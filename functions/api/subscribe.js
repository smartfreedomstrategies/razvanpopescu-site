/**
 * POST /api/subscribe
 *
 * Primeste trimiterile de la /test-executie-sau-pozitionare si /conversatie
 * si le duce in Brevo. Cheia API sta in variabilele Cloudflare, niciodata in
 * HTML si niciodata in repo.
 *
 * Variabile (Workers & Pages > proiect > Settings > Variables and Secrets):
 *   BREVO_API_KEY          SECRET, cu Encrypt bifat
 *   BREVO_LIST_TEST        text, ID-ul numeric al listei pentru test
 *   BREVO_LIST_CONVERSATIE text, ID-ul numeric al listei pentru cereri de conversatie
 *   BREVO_NOTIFY_TO        text, optional. Unde primesti notificarea de lead
 *   BREVO_SENDER           text, optional. Expeditor verificat in Brevo
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
  // Contact existent: nu e o eroare pentru noi.
  if (body && body.code === "duplicate_parameter") return { ok: true, duplicate: true };
  return { ok: false, status: res.status, body };
}

export async function onRequestPost({ request, env }) {
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

    const listIds = env.BREVO_LIST_TEST ? [Number(env.BREVO_LIST_TEST)] : [];

    const r = await brevo(env, "/contacts", {
      email,
      attributes,
      listIds,
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
  // email, nu se creeaza contact, dar notificarea de mai jos tot pleaca.
  if (isEmail(contact)) {
    const listIds = env.BREVO_LIST_CONVERSATIE ? [Number(env.BREVO_LIST_CONVERSATIE)] : [];
    const r = await brevo(env, "/contacts", {
      email: contact,
      attributes,
      listIds,
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
        "Nume: " + nume + "\n" + "Contact: " + contact + "\n\n" + "Ce e blocat:\n" + blocat + "\n",
    });
  }

  return json({ ok: true });
}

export async function onRequestGet() {
  return json({ ok: false, error: "method" }, 405);
}
