# Configurare e-mail comenzi cu Formspree

Formspree a fost ales deoarece acceptă formulare statice prin HTTPS, funcționează cu GitHub Pages, poate redirecționa notificări pe e-mail și nu cere o cheie secretă în browser. Integrarea folosește un `POST` real prin `fetch()` și honeypot-ul oficial `_gotcha`.

La verificarea din 2 octombrie 2026, planul Free era prezentat pentru testare/dezvoltare, cu 50 de trimiteri pe lună. Verifică din nou limitele și termenii înainte de utilizarea comercială. Auto Response nu era inclus în planul Free; confirmarea automată către client nu este simulată în acest proiect.

Surse oficiale verificate:

- https://help.formspree.io/articles/building-your-form/submit-forms-with-javascript-ajax
- https://help.formspree.io/articles/building-your-form/honeypot-spam-filtering
- https://formspree.io/plans

## Ce trebuie să faci

1. Intră pe https://formspree.io/ și creează un cont.
2. Creează un formular nou.
3. Setează destinatarul notificărilor la `nsportoradeabh@yahoo.com`.
4. Confirmă adresa de e-mail dacă Formspree solicită acest lucru.
5. Copiază endpoint-ul formularului. Are forma:

   ```text
   https://formspree.io/f/XXXXXXXX
   ```

6. Deschide `assets/js/config.js`.
7. Găsește exact această linie:

   ```js
   endpoint: ""
   ```

8. Schimbă **o singură valoare**:

   ```js
   endpoint: "https://formspree.io/f/ID-UL-TAU-REAL"
   ```

9. Publică site-ul.
10. Trimite o comandă de test cu date non-sensibile.
11. Verifică simultan:
    - mesajul de succes din site;
    - apariția trimiterii în panoul Formspree;
    - primirea e-mailului la `nsportoradeabh@yahoo.com`;
    - subiectul cu referința `NSJ-...`;
    - toate produsele și datele necesare din mesaj.

## Protecție anti-spam

Formularul include `_gotcha`, numele recomandat în documentația oficială Formspree. Formspree aplică și protecția proprie reCAPTCHA. Nu adăuga un CAPTCHA separat fără să testezi accesibilitatea și impactul GDPR.

## Dacă trimiterea eșuează

Site-ul nu golește coșul și nu afișează succes fals. Utilizatorul primește opțiuni de reîncercare și WhatsApp. Verifică endpoint-ul, activarea formularului, limitele planului și consola/network din browser.

## Confirmare automată către client

Pentru un plan care include oficial **Auto Response**, configurează în panoul Formspree un e-mail de confirmare folosind adresa trimisă în câmpul `customer_email`/`_replyto`. Conținut recomandat:

**Subiect:** Am primit comanda ta — NSPORT × FR Judo

```text
Bună, [NUME],

Am primit solicitarea ta pentru Backnumber Judo personalizat.

Referință: [ORDER ID]
Sportiv: [ATHLETE]
Dimensiune: [SIZE]
Cantitate: [QUANTITY]

Aceasta confirmă primirea solicitării. Detaliile finale vor fi confirmate de NSPORT.

NSPORT
nsportoradeabh@yahoo.com
```

Nu activa această funcție dacă planul ales nu o include și nu pretinde că un autoresponder a fost trimis fără verificare reală.
