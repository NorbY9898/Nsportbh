# NSPORT × FR Judo — Backnumber Judo personalizat

Microsite e-commerce static, mobile-first, în limba română, compatibil cu publicarea existentă prin GitHub și Cloudflare Workers. Include configurator live, coș în `localStorage`, comenzi individuale și de club, checkout, Formspree și fallback WhatsApp.

> Site-ul este funcțional fără build. Endpoint-ul Formspree este configurat; pentru lansare mai sunt obligatorii testarea unei comenzi reale, configurarea prețurilor, datelor juridice și transportului.

## Rulare locală

Modulele JavaScript au nevoie de un server HTTP local (nu deschide direct `public/index.html` cu `file://`).

```powershell
node scripts/serve.mjs
```

Deschide `http://127.0.0.1:4173/`. Nu sunt necesare pachete npm. Alternativ, dacă Python este deja instalat:

```powershell
python -m http.server 8080 --directory public
```

Deschide apoi adresa afișată de server.

## Teste

Necesită Node.js 20 sau mai nou și nu instalează dependențe:

```powershell
npm test
npm run check
```

## Configurare centrală

Toate valorile comerciale sunt în [`public/assets/js/config.js`](public/assets/js/config.js).

### Prețuri

În `PRODUCT_CONFIG.sizes`, înlocuiește `null` cu numărul în lei, fără text:

```js
"20x20": { label: "20 × 20 cm", width: 20, height: 20, price: null },
"30x30": { label: "30 × 30 cm", width: 30, height: 30, price: null },
"35x35": { label: "35 × 35 cm", width: 35, height: 35, price: null },
"40x40": { label: "40 × 40 cm", width: 40, height: 40, price: null }
```

Dimensiunile disponibile sunt exclusiv **20 × 20 cm, 30 × 30 cm, 35 × 35 cm și 40 × 40 cm**. Fiecare preț se configurează separat prin câmpul `price` al dimensiunii respective.

Cât timp valoarea este `null`, interfața afișează „Preț la cerere” și nu inventează totaluri.

### Telefon și WhatsApp

Modifică o singură dată cele trei reprezentări din `STORE_CONFIG`:

```js
phoneDisplay: "0745 326 270",
whatsappDisplay: "0745 326 270",
whatsappInternational: "40745326270",
```

Numărul internațional nu conține `+`, spații sau alte semne.

### E-mail

Modifică `orderEmail`. Pentru primirea comenzilor, destinatarul se configurează și în panoul Formspree; adresa din JavaScript nu poate redirecționa singură e-mailul.

### Formspree

Endpoint-ul `https://formspree.io/f/xyezarzg` este setat, iar `configured` este `true`. Urmează pașii de testare din [`EMAIL-SETUP.md`](EMAIL-SETUP.md) și verifică primirea reală la adresa configurată în panoul Formspree.

### Transport

În `STORE_CONFIG.shipping` completează:

```js
shipping: {
  enabled: true,
  price: 25,
  courier: "NUME CURIER",
  estimatedDelivery: "INTERVAL CONFIRMAT"
}
```

Dacă `price` este `null`, site-ul spune că valoarea va fi confirmată. Actualizează textele comerciale după alegerea curierului.

### Plăți

Metodele sunt inactive implicit. Activează un câmp numai după ce există un flux real și verificat:

```js
payments: { card: false, bankTransfer: false, cashOnDelivery: false }
```

Interfața nu simulează plata cu cardul. Activarea unei metode necesită și implementarea/includerea instrucțiunilor contractuale aferente.

## Logo oficial FR Judo

Fișierul furnizat este păstrat nemodificat în `public/assets/images/frjudo/fr-judo-logo-original.png` și este folosit în header cu `object-fit: contain`. Pentru backnumber se folosește `public/assets/images/frjudo/fr-judo-logo-transparent.png`, derivat din fișierul complet numai prin eliminarea fundalului alb, fără decupare, redesenare sau generare AI.

## Backnumber renderer

Componenta centrală este `public/assets/js/backnumber-renderer.js`. Același renderer este folosit de configuratorul live, comparația de dimensiuni, coș, lista de club și recapitularea checkout. Sportivul apare pe un singur rând în panoul albastru; `fitAthleteName()` măsoară lățimea randată și micșorează fontul până când numele încape complet. `ResizeObserver` repetă calculul la redimensionare.

`public/assets/js/qr-code.js` generează local un QR Model 2, cu corecție L, fără API extern. Payload-ul determinist are forma `NSPORT|FRJ|NAME=POPESCU|COUNTRY=ROU|SIZE=30x30`. Același produs produce același QR, iar schimbarea numelui, țării sau dimensiunii produce alt payload și altă matrice. QR-ul este exclusiv un identificator al personalizării; nu reprezintă certificare sau verificare într-o bază de date oficială.

## Imagini

Seria foto generată pentru proiect este în:

- `public/assets/images/hero/`
- `public/assets/images/story/`
- `public/assets/images/product/`

Fișierele active `*-v4.png` păstrează bazele fotografice realiste `*-v3-base.png`, iar backnumber-ul complet este compus determinist și transformat ca un singur obiect prin `scripts/compose_backnumber_assets.py`. Compozitorul aplică perspectiva, lumina și microtextura materialului peste toate cele trei zone: nume, cod de țară și rândul inferior QR/siglă. Site-ul servește variantele WebP optimizate; hero-ul are și o variantă de 960 px prin `srcset`.

Pentru înlocuire, păstrează numele fișierelor sau schimbă sursele din `public/index.html`. Prompturile, dimensiunile și pozițiile sunt documentate în [`IMAGE-GENERATION-PROMPTS.md`](IMAGE-GENERATION-PROMPTS.md).

## Publicare GitHub → Cloudflare Workers

`wrangler.jsonc` publică exclusiv directorul `./public`, cu `not_found_handling: "404-page"`. Astfel `npx wrangler deploy` nu include metadatele Git, testele, scripturile de dezvoltare, documentația sau fișierele npm din rădăcina repository-ului.

## Domeniul nsport.ro și HTTPS

1. Verifică mai întâi că varianta GitHub Pages funcționează.
2. Configurează la furnizorul DNS înregistrările recomandate în documentația oficială GitHub Pages pentru apex domain; valorile se pot schimba, deci nu copia IP-uri vechi din template-uri.
3. Pentru `www`, folosește CNAME către domeniul GitHub Pages indicat în cont.
4. Redenumește `CNAME.example` în `CNAME` numai când DNS-ul este pregătit. Conținutul trebuie să fie `nsport.ro`.
5. În **Settings → Pages → Custom domain**, introdu `nsport.ro`.
6. Așteaptă verificarea DNS, apoi activează **Enforce HTTPS**.
7. Actualizează `domain`, canonical, Open Graph, `robots.txt` și `sitemap.xml` dacă domeniul final diferă.

## Structura principală

```text
public/
  index.html
  assets/css/
  assets/js/
  assets/images/
  termeni-si-conditii.html
  politica-confidentialitate.html
  politica-cookies.html
  politica-retur.html
  livrare-plata.html
  404.html
test/
scripts/
package.json
wrangler.jsonc
```

## Observații de lansare

- Datele complete de checkout nu sunt stocate local; numai produsele din coș și preferințele cookie sunt păstrate.
- Succesul comenzii apare numai după un răspuns HTTP reușit al Formspree.
- Coșul nu este golit la eroare sau când backend-ul lipsește.
- Autoresponder-ul Formspree nu este simulat. La verificarea din 2 octombrie 2026, funcția Auto Response nu era inclusă în planul Free; verifică din nou planul ales.
- Textele juridice sunt o bază de lucru și trebuie validate profesional înainte de lansare.

Parcurge integral [`LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md) înainte de publicare.
