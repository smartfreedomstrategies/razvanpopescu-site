# Deploy pe Cloudflare Pages — Varianta sigură (doar site, email neatins)

DNS-ul tău e gestionat în **cPanel** (hosting). Nu mutăm tot domeniul pe Cloudflare. Schimbăm doar înregistrarea care duce spre site. Email, webmail, FTP — neatinse.

**IMPORTANT:** dacă ești pe ecranul „Review your DNS records → Continue to activation" în Cloudflare, NU apăsa Continue. Aia mută tot domeniul. Ieși: **Back to Domains**.

---

## Pasul 1 — Conectează repo-ul la Cloudflare Pages

1. Cloudflare → **Workers & Pages → Create → Pages → Connect to Git**
2. Autorizezi GitHub (dacă cere) și alegi repo-ul **razvanpopescu-site**
3. Setări build:
   - Framework preset: **None**
   - Build command: **(gol)**
   - Build output directory: **/**
4. **Save and Deploy**
5. În ~30 sec ai un link `https://razvanpopescu-site.pages.dev`
6. **Testează acolo întâi.** Deschide-l, verifică: textul, diacriticele „Vânzări", contoarele (21+, 11) se animează la scroll, favicon-ul în tab. Dacă arată bine → mergi mai departe.

---

## Pasul 2 — Leagă domeniul (Custom domain)

1. În proiectul Pages → tab **Custom domains** → **Set up a domain**
2. Scrie `razvanpopescu.com` → Continue
3. Cloudflare îți va arăta **exact** ce înregistrare DNS să adaugi. De obicei una din două:
   - un **CNAME** de la `razvanpopescu.com` spre `razvanpopescu-site.pages.dev`, SAU
   - un **A** spre un IP pe care ți-l dă Cloudflare
4. **Notează exact valoarea pe care ți-o dă** (CNAME target sau IP). Aia o pui în cPanel la pasul 3.
5. Repetă pentru `www.razvanpopescu.com` dacă vrei să meargă și cu www (de obicei un CNAME spre `razvanpopescu-site.pages.dev`).

---

## Pasul 3 — Schimbă înregistrarea în cPanel (Zone Editor)

1. Intră în **cPanel** → caută **Zone Editor** (sau „DNS Zone Editor")
2. Găsești domeniul `razvanpopescu.com` → **Manage**
3. Cauți înregistrarea **A** pentru `razvanpopescu.com` (apex) care acum arată spre `74.117.152.12` (serverul de hosting)
4. O **editezi** cu valoarea pe care ți-a dat-o Cloudflare la Pasul 2:
   - dacă Cloudflare a cerut CNAME spre `*.pages.dev`: schimbi tipul în CNAME (pentru apex, unele cPanel-uri nu permit CNAME pe rădăcină — dacă te oprește, folosește varianta A cu IP-ul dat de Cloudflare)
   - dacă a cerut A spre IP: pui IP-ul lor în loc de `74.117.152.12`
5. La fel pentru **www** (CNAME spre `razvanpopescu-site.pages.dev`)
6. **NU atinge:** MX, TXT (SPF/DKIM/DMARC), webmail, mail, cpanel, ftp, autodiscover. Alea țin emailul viu.

---

## Ce să NU atingi (email + cPanel — viața ta digitală)

Lasă exact cum sunt:
- **MX** (razvanpopescu.com → Google/SMTP) — primirea emailului
- **TXT**: SPF (`v=spf1...`), DKIM (`default._domainkey`), DMARC (`_dmarc`) — autentificare email
- A/CNAME: `webmail`, `mail`, `cpanel`, `whm`, `ftp`, `autoconfig`, `autodiscover`, `webdisk`, `cpcalendars`, `cpcontacts`

---

## Verificare finală

- Propagarea DNS poate dura de la câteva minute la câteva ore.
- Verifică `razvanpopescu.com` în browser (hard refresh: Cmd+Shift+R).
- Trimite-ți un email de test ca să confirmi că emailul merge în continuare.
- HTTPS pe Pages se activează singur.

**Plasă de siguranță:** site-ul vechi de pe cPanel rămâne accesibil prin IP până se propagă DNS-ul. Dacă ceva nu merge, pui înapoi vechea valoare A (`74.117.152.12`) în Zone Editor și ești ca înainte.
