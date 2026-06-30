# Listă de verificare DNS — mutare razvanpopescu.com pe Cloudflare

Citit din DNS-ul live pe 30 iunie 2026. Folosește asta când faci importul în Cloudflare, ca să confirmi că nimic vital nu lipsește înainte de „Continue to activation".

## Stare actuală
- DNS gestionat de: **Hosterion** (ns1/ns2.hosterion.com + .net)
- Emailul tău: **Google Workspace** (MX → SMTP.GOOGLE.com). NU e pe cPanel. Bun, mai robust la mutare.
- Site actual: server cPanel la IP `74.117.152.12`

---

## VITAL — astea trebuie să existe în Cloudflare (altfel se strică emailul)

| Tip | Nume | Valoare | Proxy |
|---|---|---|---|
| MX | razvanpopescu.com | `SMTP.GOOGLE.com` (prioritate 1) | DNS only |
| TXT (SPF) | razvanpopescu.com | `v=spf1 +a +mx +ip4:184.75.248.10 include:hermesmx.hosterion.net ~all` | DNS only |
| TXT (DMARC) | _dmarc | `v=DMARC1; p=none;` | DNS only |
| TXT (DKIM) | default._domainkey | cheia DKIM lungă (verifică în cPanel → Email Deliverability) | DNS only |

**ATENȚIE la DKIM:** scanarea Cloudflare ratează uneori `default._domainkey` (cheie foarte lungă). Verifică manual că apare. Dacă lipsește, emailul trimis poate ajunge la spam. O găsești în cPanel → Email Deliverability → Manage → DKIM.

---

## SITE — astea le schimbi DUPĂ ce domeniul e în Cloudflare

NU edita A-ul manual. Mergi în Workers & Pages → razvanpopescu-site → tab **Domains** → **Add Domain** → scrii `razvanpopescu.com`. Cloudflare creează singur înregistrarea corectă spre Worker. Repetă pentru `www`.

| Nume | Țintă | Proxy |
|---|---|---|
| razvanpopescu.com | Worker razvanpopescu-site | Proxied (auto) |
| www | Worker razvanpopescu-site | Proxied (auto) |

Vechiul A spre `74.117.152.12` pentru apex și www se înlocuiește prin pasul de mai sus.

---

## SUBDOMENII HOSTING — păstrează ca DNS only (norișor gri)

Cloudflare le importă automat la scanare. Lasă-le, dar pune-le DNS only (nu Proxied):
- mail, webmail, cpanel, whm, ftp, autodiscover, autoconfig, webdisk, cpcalendars, cpcontacts → toate spre `74.117.152.12`

Astea îți dau acces la hosting/webmail. Nu fac rău. DNS only e suficient.

---

## Ordinea corectă a pașilor

1. **Adaugi domeniul în Cloudflare** (fluxul „Add a site" / Review DNS records).
2. **Verifici lista de mai sus** în ecranul de review — mai ales MX, SPF, DMARC, DKIM. Adaugi manual ce lipsește.
3. **Schimbi nameserverele** la Hosterion (din ns*.hosterion → cele 2 date de Cloudflare). Asta activează Cloudflare.
4. **Aștepți propagarea** (minute–ore).
5. **Workers → Domains → Add Domain** → `razvanpopescu.com` + `www`.
6. **Test:** deschizi site-ul, și îți trimiți un email de test ca să confirmi că Gmail-ul merge.

## Plasă de siguranță
Dacă ceva nu merge, schimbi nameserverele înapoi la ns*.hosterion la registrar și revii la starea actuală. Reversibil.
