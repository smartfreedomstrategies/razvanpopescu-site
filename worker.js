/**
 * Workerul site-ului razvanpopescu.com
 *
 * Fisierele statice (index.html, /conversatie, /brand-facts, robots.txt,
 * sitemap.xml, _redirects) sunt servite direct de Cloudflare, inainte sa ajunga
 * aici. Workerul se ocupa doar de rutele care nu sunt fisiere.
 *
 * Rute:
 *   POST /api/subscribe  -> trimite in Brevo formularele de pe /test-... si /conversatie
 *
 * Variabile (Settings > Variables and secrets, DUPA primul deploy cu fisierul asta):
 *   BREVO_API_KEY          SECRET, cu Encrypt bifat
 *   BREVO_LIST_TEST        ID-ul numeric al listei pentru test
 *   BREVO_LIST_CONVERSATIE ID-ul numeric al listei pentru cereri de conversatie
 *   BREVO_NOTIFY_TO        optional, unde primesti notificarea de lead
 *   BREVO_SENDER           optional, expeditor verificat in Brevo
 *
 * Atributele trebuie sa existe DEJA in Brevo (Contacts > Settings > Contact attributes):
 *   SCOR_CLARITATE (number) · VERDICT (text) · SURSA (text)
 *   NUME (text) · CONTACT (text) · CE_E_BLOCAT (text)
 */

const BREVO = "https://api.brevo.com/v3";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });

const isEmail = (v) =>
  typeof v === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());

const clean = (v, max = 500) => (typeof v === "string" ? v.trim().slice(0, max) : "");

async function brevo(env, path, payload) {
  const res = await fetch(BREVO + path, {
    method: "POST",
    headers: {
      "api-key": env.BREVO_API_KEY,
      "content-type": "application/json",
      accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
  if (res.ok) return { ok: true };
  let body = null;
  try {
    body = await res.json();
  } catch (_) {}
  // Contact existent: pentru noi nu e eroare.
  if (body && body.code === "duplicate_parameter") return { ok: true, duplicate: true };
  return { ok: false, status: res.status, body };
}

async function subscribe(request, env) {
  if (request.method !== "POST") return json({ ok: false, error: "method" }, 405);
  if (!env.BREVO_API_KEY) return json({ ok: false, error: "config" }, 500);

  // Acceptam doar cereri de pe propriul domeniu.
  const host = new URL(request.url).hostname;
  const origin = request.headers.get("origin") || "";
  if (origin) {
    try {
      if (new URL(origin).hostname !== host) return json({ ok: false, error: "origin" }, 403);
    } catch (_) {
      return json({ ok: false, error: "origin" }, 403);
    }
  }

  let data;
  try {
    data = await request.json();
  } catch (_) {
    return json({ ok: false, error: "json" }, 400);
  }

  // Capcana pentru boti: campul e ascuns in pagina, un om nu-l completeaza.
  if (clean(data.website)) return json({ ok: true });

  const form = data.form === "conversatie" ? "conversatie" : "test";

  if (form === "test") {
    const email = clean(data.email, 200);
    if (!isEmail(email)) return json({ ok: false, error: "email" }, 400);

    const scor = Number.isInteger(data.scor) ? Math.max(0, Math.min(5, data.scor)) : null;
    const verdict = ["executie", "gri", "claritate"].includes(data.verdict) ? data.verdict : "";

    const attributes = { SURSA: "test-executie-sau-pozitionare" };
    if (scor !== null) attributes.SCOR_CLARITATE = scor;
    if (verdict) attributes.VERDICT = verdict;

    const r = await brevo(env, "/contacts", {
      email,
      attributes,
      listIds: env.BREVO_LIST_TEST ? [Number(env.BREVO_LIST_TEST)] : [],
      updateEnabled: true,
    });
    if (!r.ok) return json({ ok: false, error: "brevo" }, 502);
    return json({ ok: true });
  }

  const nume = clean(data.nume, 120);
  const contact = clean(data.contact, 200);
  const blocat = clean(data.blocat, 1000);
  if (!nume || !contact || !blocat) return json({ ok: false, error: "camp" }, 400);

  const attributes = {
    NUME: nume,
    CONTACT: contact,
    CE_E_BLOCAT: blocat,
    SURSA: "conversatie",
  };

  // Brevo are nevoie de un identificator. Daca omul a lasat telefon in loc de
  // email nu se creeaza contact, dar notificarea de mai jos tot pleaca.
  if (isEmail(contact)) {
    const r = await brevo(env, "/contacts", {
      email: contact,
      attributes,
      listIds: env.BREVO_LIST_CONVERSATIE ? [Number(env.BREVO_LIST_CONVERSATIE)] : [],
      updateEnabled: true,
    });
    if (!r.ok) return json({ ok: false, error: "brevo" }, 502);
  }

  if (env.BREVO_NOTIFY_TO && env.BREVO_SENDER) {
    await brevo(env, "/smtp/email", {
      sender: { email: env.BREVO_SENDER, name: "razvanpopescu.com" },
      to: [{ email: env.BREVO_NOTIFY_TO }],
      subject: "Cerere de conversatie: " + nume,
      textContent:
        "Nume: " + nume + "\nContact: " + contact + "\n\nCe e blocat:\n" + blocat + "\n",
    });
  }

  return json({ ok: true });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/subscribe") {
      return subscribe(request, env);
    }

    // Orice altceva: fisierele site-ului, cu _redirects si _headers aplicate.
    return env.ASSETS.fetch(request);
  },
};
