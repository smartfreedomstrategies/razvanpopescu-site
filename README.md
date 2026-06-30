# RazvanPopescu.com — site static

Pagină de prezentare. Un singur fișier, `index.html`, autonom. Font Satoshi din Fontshare (CDN), Lora din Google Fonts. Fără build, fără dependențe locale.

## Ce e în pachet
- `index.html` — pagina întreagă (HTML + CSS + JS inline)
- `README.md` — fișierul ăsta
- `.gitignore`

---

## Pasul 1 — GitHub

1. Intri pe github.com, faci un repo nou: **Repositories → New**.
2. Nume: `razvanpopescu-site` (sau ce vrei). Lasă-l **Public** (Cloudflare Pages merge și pe privat, dar public e mai simplu de început).
3. NU bifa „Add a README" — îl ai deja.
4. Pe pagina repo-ului gol, alege **uploading an existing file** și trage `index.html`, `README.md`, `.gitignore`.
5. Commit. Gata, fișierele sunt în GitHub.

*(Alternativ, dacă ai git pe calculator: `git init`, `git add .`, `git commit -m "site"`, conectezi remote-ul și `git push`.)*

---

## Pasul 2 — Cloudflare Pages

1. Intri pe dash.cloudflare.com → **Workers & Pages → Create → Pages → Connect to Git**.
2. Autorizezi GitHub, alegi repo-ul `razvanpopescu-site`.
3. Setări build:
   - **Framework preset:** None
   - **Build command:** lasă gol
   - **Build output directory:** `/` (rădăcina)
4. **Save and Deploy.** În ~30 de secunde ai un link `*.pages.dev` live.

Orice push nou în GitHub → Cloudflare republică automat. Asta voiai.

---

## Pasul 3 — Domeniul tău (razvanpopescu.com)

1. În proiectul Pages → **Custom domains → Set up a domain** → scrii `razvanpopescu.com`.
2. Cloudflare îți spune ce record DNS să pui. Dacă domeniul e deja pe Cloudflare, se face cu un click. Dacă e la alt registrar, schimbi nameserverele sau pui un CNAME, după instrucțiuni.
3. HTTPS se activează singur.

**Atenție:** site-ul vechi de pe cPanel rămâne live până muți DNS-ul. Testează întâi pe link-ul `*.pages.dev`, apoi muți domeniul. Zero downtime dacă faci în ordinea asta.

---

## Cum editezi de acum

Deschizi `index.html`, schimbi textul, dai push în GitHub. Cloudflare republică singur. Fără panou, fără FTP, fără cPanel. Plain file. Portabil. Al tău.
