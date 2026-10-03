import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const htmlFiles = ["index.html", "404.html", "termeni-si-conditii.html", "politica-confidentialitate.html", "politica-cookies.html", "politica-retur.html", "livrare-plata.html"];

test("toate paginile declarate există și sunt în română", () => {
  htmlFiles.forEach((file) => {
    const path = resolve(root, file);
    assert.equal(existsSync(path), true, `${file} lipsește`);
    assert.match(readFileSync(path, "utf8"), /<html lang="ro">/);
  });
});

test("resursele locale din HTML există", () => {
  const missing = [];
  htmlFiles.forEach((file) => {
    const html = readFileSync(resolve(root, file), "utf8");
    for (const match of html.matchAll(/(?:src|href)="([^"]+)"/g)) {
      const target = match[1];
      if (/^(?:https?:|mailto:|tel:|#|\.\/$)/.test(target)) continue;
      const clean = target.split("#")[0].split("?")[0];
      if (!existsSync(resolve(root, clean))) missing.push(`${file}: ${clean}`);
    }
  });
  assert.deepEqual(missing, []);
});

test("toate elementele DOM folosite de aplicație există", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const app = readFileSync(resolve(root, "assets/js/app.js"), "utf8");
  const ids = [...app.matchAll(/\$\("#([a-z0-9-]+)"\)/gi)].map((match) => match[1]);
  const missing = [...new Set(ids)].filter((id) => !new RegExp(`id=["']${id}["']`).test(html));
  assert.deepEqual(missing, []);
});

test("pagina principală nu conține ID-uri duplicate", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
  assert.deepEqual([...new Set(duplicates)], []);
});

test("configurația conține endpoint-ul Formspree furnizat și este activă", () => {
  const config = readFileSync(resolve(root, "assets/js/config.js"), "utf8");
  assert.match(config, /endpoint:\s*"https:\/\/formspree\.io\/f\/xyezarzg"/);
  assert.match(config, /configured:\s*true/);
});

test("configurația și interfața folosesc exclusiv cele patru dimensiuni noi", () => {
  const config = readFileSync(resolve(root, "assets/js/config.js"), "utf8");
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  for (const size of ["20x20", "30x30", "35x35", "40x40"]) assert.match(config, new RegExp(`"${size}"`));
  assert.doesNotMatch(`${config}\n${html}`, /15x15|25x25|15 × 15|25 × 25/);
});

test("backnumber renderer-ul valódi helyi QR-t használ és nem tartalmaz tiltott jelölést", () => {
  const renderer = readFileSync(resolve(root, "assets/js/backnumber-renderer.js"), "utf8");
  const qr = readFileSync(resolve(root, "assets/js/qr-code.js"), "utf8");
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.doesNotMatch(renderer, /OFFICIAL|\bIJF\b|fake certification/i);
  assert.match(renderer, /backnumber-visual__name/);
  assert.match(renderer, /backnumber-visual__code/);
  assert.match(renderer, /backnumber-visual__qr/);
  assert.match(renderer, /backnumber-visual__logo/);
  assert.match(qr, /createQrMatrix/);
  assert.doesNotMatch(qr, /https?:\/\//);
});

test("logo-ul oficial FR Judo este folosit ca asset, nu ca text în header", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  assert.equal(existsSync(resolve(root, "assets/images/frjudo/fr-judo-logo-original.png")), true);
  assert.equal(existsSync(resolve(root, "assets/images/frjudo/fr-judo-logo-transparent.png")), true);
  assert.match(html, /brand__partner-logo/);
  assert.doesNotMatch(html, /<span class="brand__partner">FR JUDO<\/span>/);
});

test("az aktív promóciós képek a háromzónás, textúrázott v4 változatokat használják", () => {
  const html = readFileSync(resolve(root, "index.html"), "utf8");
  for (const image of ["hero-judoka-popescu-v4", "backnumber-studio-v4", "detaliu-backnumber-v4", "judogi-alb-v4", "judogi-albastru-v4", "spre-tatami-v4", "actiune-judo-v4"]) {
    assert.match(html, new RegExp(image));
  }
  assert.doesNotMatch(html, /(?:hero-judoka-popescu|backnumber-studio|detaliu-backnumber|judogi-alb|judogi-albastru|spre-tatami|actiune-judo)-v[23](?:\.|-960)/);
});

test("a backnumber renderer külön ország- és azonosítózónát épít", () => {
  const renderer = readFileSync(resolve(root, "assets/js/backnumber-renderer.js"), "utf8");
  const css = readFileSync(resolve(root, "assets/css/style.css"), "utf8");
  assert.match(renderer, /lower\.append\(code, identifiers\)/);
  assert.match(renderer, /identifiers\.append\(qr, logo\)/);
  assert.match(css, /backnumber-visual__lower[^}]+grid-template-rows/);
  assert.match(css, /backnumber-visual__identifiers[^}]+justify-content:space-between/);
  assert.match(renderer, /fr-judo-logo-transparent\.png/);
});

test("a Cloudflare Web Analytics minden publikus oldalon pontosan egyszer szerepel", () => {
  const source = "static.cloudflareinsights.com/beacon.min.js";
  const token = "41a65534312e43bc89acfabafcd127d8";
  htmlFiles.forEach((file) => {
    const html = readFileSync(resolve(root, file), "utf8");
    assert.equal(html.split(source).length - 1, 1, `${file}: hibás analytics példányszám`);
    assert.equal(html.split(token).length - 1, 1, `${file}: hibás token példányszám`);
    assert.match(html, new RegExp(`${source.replaceAll(".", "\\.")}[^]*</script><!-- End Cloudflare Web Analytics -->\\s*</body>`));
  });
});

test("fluxul de submit are blocare internă pentru trimitere dublă", () => {
  const app = readFileSync(resolve(root, "assets/js/app.js"), "utf8");
  assert.match(app, /let submissionInProgress = false/);
  assert.match(app, /if \(submissionInProgress\) return/);
  assert.match(app, /submissionInProgress = true/);
  assert.match(app, /submissionInProgress = false/);
});
