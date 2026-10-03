# Prompturi imagini NSPORT × Federația Română de Judo

Imaginile active `*-v4` păstrează fotografiile realiste `*-v3-base` cu backnumber textil gol. `scripts/compose_backnumber_assets.py` redă mai întâi obiectul complet în trei zone verticale (nume, cod de țară, apoi QR/siglă), după care transformă obiectul complet pe judogi și îl integrează în lumina și textura materialului. Logo-ul FR Judo complet este derivat din fișierul original numai prin eliminarea fundalului alb; nu este decupat, generat sau redesenat.

## Regula obligatorie pentru fiecare imagine cu backnumber

```text
IMAGEGEN BASE RULE:
Create a clean BLANK WHITE SQUARE textile backnumber with realistic stitching, folds, perspective, lighting and shadows.
Do not let AI draw any name, country code, QR code, logo, emblem, serial number, certification, approval mark or watermark.
Preserve the supplied photograph outside the backnumber area.

DETERMINISTIC COMPOSITING RULE:
The local composition script renders exact text POPESCU in the top zone, exact code ROU alone in the middle zone, and a separate lower row with the locally generated QR for NSPORT|FRJ|NAME=POPESCU|COUNTRY=ROU|SIZE=30x30 on the left plus the unmodified FR Judo emblem on the right. It then transforms and texture-blends the complete backnumber as one object.
Do not display OFFICIAL, IJF, fake IDs or certification claims.
```

## 1. Hero

- Fișier final: `assets/images/hero/hero-judoka-popescu-v4.png`
- Variantă web: `assets/images/hero/hero-judoka-popescu-v4.webp`

```text
Use case: precise-object-edit. Edit only the backnumber patch on the existing wide hero photo. Preserve the athlete, anatomy, white judogi, black belt, arena, lighting, framing, negative space and color grading. Use a white square textile base and a wide slightly arched/trapezoidal dark-blue top panel. Match perspective, stitching, folds and light.

IMAGEGEN BASE RULE: create only a blank white square textile patch; no text, QR, logo or blue panel. Exact artwork is added later by the deterministic composition script.
```

## 2. Pregătire centură

- Fișier: `assets/images/story/pregatire-centura.png`

```text
Close-up of an adult judoka tightening a black belt over a white judogi. Preserve realistic hands, fabric weave and arena lighting. No backnumber is visible. No logos, text, certification marks or watermark.
```

## 3. Detaliu backnumber

- Fișier final: `assets/images/story/detaliu-backnumber-v4.png`
- Variantă web: `assets/images/story/detaliu-backnumber-v4.webp`

```text
Use case: precise-object-edit. Edit only the backnumber in the existing macro close-up. Preserve the athlete, white judogi weave, shoulders, camera angle, lighting and background. Use a white square textile base and a wide slightly arched/trapezoidal dark-blue top panel with realistic stitching and folds.

IMAGEGEN BASE RULE: create only a blank white square textile patch; no text, QR, logo or blue panel. Exact artwork is added later by the deterministic composition script.
```

## 4. Judogi alb

- Fișier final: `assets/images/story/judogi-alb-v4.png`
- Variantă web: `assets/images/story/judogi-alb-v4.webp`

```text
Use case: precise-object-edit. Replace only the backnumber on the existing portrait of the athlete in a white judogi. Preserve pose, anatomy, black belt, arena, lighting, portrait framing and color grading. Use a white square textile base and a wide slightly arched/trapezoidal dark-blue top panel.

IMAGEGEN BASE RULE: create only a blank white square textile patch; no text, QR, logo or blue panel. Exact artwork is added later by the deterministic composition script.
```

## 5. Judogi albastru

- Fișier final: `assets/images/story/judogi-albastru-v4.png`
- Variantă web: `assets/images/story/judogi-albastru-v4.webp`

```text
Use case: precise-object-edit. Replace only the backnumber on the existing portrait of the athlete in a blue judogi. Preserve pose, anatomy, black belt, arena, lighting, portrait framing and color grading. Use a white square textile base and a wide slightly arched/trapezoidal dark-blue top panel.

IMAGEGEN BASE RULE: create only a blank white square textile patch; no text, QR, logo or blue panel. Exact artwork is added later by the deterministic composition script.
```

## 6. Spre tatami

- Fișier final: `assets/images/story/spre-tatami-v4.png`
- Variantă web: `assets/images/story/spre-tatami-v4.webp`

```text
Use case: precise-object-edit. Replace only the smaller backnumber on the existing wide shot of the athlete walking toward the tatami. Preserve full-body walking anatomy, white judogi, tunnel, crowd, lighting, framing and reflections. Use a white square textile base and a wide slightly arched/trapezoidal dark-blue top panel.

IMAGEGEN BASE RULE: create only a blank white square textile patch; no text, QR, logo or blue panel. Exact artwork is added later by the deterministic composition script.
```

## 7. Acțiune judo

- Fișier final: `assets/images/story/actiune-judo-v4.png`
- Variantă web: `assets/images/story/actiune-judo-v4.webp`

```text
Use case: precise-object-edit. Replace only the visible oblique backnumber on the white judoka in the existing dynamic throw photo. Preserve both athletes, realistic anatomy, grips, exact action, arena, lighting and framing. Match the patch perspective, folds and light.

IMAGEGEN BASE RULE: create only a blank white square textile patch; no text, QR, logo or blue panel. Exact artwork is added later by the deterministic composition script.
```

## 8. Produs studio

- Fișier final: `assets/images/product/backnumber-studio-v4.png`
- Variantă web: `assets/images/product/backnumber-studio-v4.webp`

```text
Use case: precise-object-edit. Preserve the existing dark studio backdrop, red/blue/yellow rim lighting, camera angle, product position, textile realism and stitching. The product is a white square textile backnumber with a wide slightly arched/trapezoidal dark-blue top panel.

IMAGEGEN BASE RULE: create only a blank white square textile patch; no text, QR, logo or blue panel. Exact artwork is added later by the deterministic composition script.
```

## Méret-összehasonlítás

A méretgrafikák nem raszterképek. Az `assets/js/backnumber-renderer.js` és a központi `.backnumber-visual` CSS komponens rajzolja őket. Oldalhosszuk 20 : 30 : 35 : 40, azaz 4 : 6 : 7 : 8 arányban skálázódik.
