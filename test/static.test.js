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

test("configurația nu conține un endpoint Formspree inventat", () => {
  const config = readFileSync(resolve(root, "assets/js/config.js"), "utf8");
  assert.match(config, /endpoint:\s*""/);
});
