# NSPORT × FR Judo — Backnumber Judo personalizat

Microsite e-commerce static, mobile-first, în limba română, pregătit pentru GitHub Pages. Include configurator live, coș în `localStorage`, comenzi individuale și de club, checkout, Formspree și fallback WhatsApp.

> Site-ul este funcțional fără build. Pentru lansare sunt obligatorii configurarea prețurilor, datelor juridice, transportului și endpoint-ului Formspree.

## Rulare locală

Modulele JavaScript au nevoie de un server HTTP local (nu deschide direct `index.html` cu `file://`).

```powershell
node scripts/serve.mjs
```

Deschide `http://127.0.0.1:4173/`. Nu sunt necesare pachete npm. Alternativ, dacă Python este deja instalat:

```powershell
python -m http.server 8080
```

Deschide apoi adresa afișată de server.

## Teste

Necesită Node.js 20 sau mai nou și nu instalează dependențe:

```powershell
npm test
npm run check
```

## Configurare centrală

Toate valorile comerciale sunt în [`assets/js/config.js`](assets/js/config.js).

### Prețuri

În `PRODUCT_CONFIG.sizes`, înlocuiește `null` cu numărul în lei, fără text:

```js
"15x15": { label: "15 × 15 cm", price: 99, note: "Format compact" }
```

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

Urmează pașii din [`EMAIL-SETUP.md`](EMAIL-SETUP.md). Este necesară schimbarea unei singure valori: `formBackend.endpoint`. Starea „configurat” este derivată automat din endpoint; nu există un al doilea comutator care poate rămâne greșit.

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

## Logo-uri oficiale

- pune logo-ul NSPORT în `assets/images/nsport/`;
- pune exclusiv logo-ul oficial primit de la FR Judo în `assets/images/frjudo/`;
- păstrează proporțiile și nu modifica fișierul oficial;
- actualizează componenta `.brand` din pagini numai după ce fișierele și drepturile sunt confirmate.

În versiunea actuală se folosește doar text, nu un logo FR Judo generat.

## Imagini

Seria foto generată pentru proiect este în:

- `assets/images/hero/`
- `assets/images/story/`
- `assets/images/product/`

Fișierele PNG sunt sursele originale generate. Site-ul servește variantele WebP optimizate (aproximativ 1,5 MB pentru întreaga serie utilizată); hero-ul are și o variantă de 960 px prin `srcset`. Pentru regenerarea compresiei, rulează `scripts/optimize_images.py` cu Pillow disponibil.

Pentru înlocuire, păstrează numele fișierelor sau schimbă sursele din `index.html`. Prompturile, dimensiunile și pozițiile sunt documentate în [`IMAGE-GENERATION-PROMPTS.md`](IMAGE-GENERATION-PROMPTS.md).

## Publicare pe GitHub Pages

1. Publică repository-ul pe GitHub.
2. În **Settings → Pages**, alege **Deploy from a branch**.
3. Selectează ramura principală și directorul `/ (root)`.
4. Salvează și verifică adresa `https://username.github.io/repository/`.
5. Toate căile proiectului sunt relative, deci funcționează și într-un subdirector.

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
```

## Observații de lansare

- Datele complete de checkout nu sunt stocate local; numai produsele din coș și preferințele cookie sunt păstrate.
- Succesul comenzii apare numai după un răspuns HTTP reușit al Formspree.
- Coșul nu este golit la eroare sau când backend-ul lipsește.
- Autoresponder-ul Formspree nu este simulat. La verificarea din 2 octombrie 2026, funcția Auto Response nu era inclusă în planul Free; verifică din nou planul ales.
- Textele juridice sunt o bază de lucru și trebuie validate profesional înainte de lansare.

Parcurge integral [`LAUNCH-CHECKLIST.md`](LAUNCH-CHECKLIST.md) înainte de publicare.
