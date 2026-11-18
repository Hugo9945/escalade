// Protection du site par mot de passe, côté serveur (Cloudflare Pages Functions).
// Chaque demande (page, image, données) passe par ici avant d'être servie.
// Le mot de passe n'est PAS dans le code : il est réglé dans Cloudflare
// (Paramètres du projet → Variables et secrets → SITE_PASSWORD).
// Une fois le bon mot de passe saisi, un cookie garde l'appareil connecté pendant un an.

const COOKIE = "sac_a_topos";
const UN_AN = 60 * 60 * 24 * 365;

async function jeton(motDePasse) {
  const cle = await crypto.subtle.importKey("raw", new TextEncoder().encode(motDePasse), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const signature = await crypto.subtle.sign("HMAC", cle, new TextEncoder().encode("sac-a-topos-connecte"));
  return [...new Uint8Array(signature)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function egal(a, b) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function lireCookie(requete, nom) {
  const entete = requete.headers.get("Cookie") || "";
  for (const morceau of entete.split(";")) {
    const [k, ...v] = morceau.trim().split("=");
    if (k === nom) return v.join("=");
  }
  return "";
}

function pageConnexion(erreur) {
  return new Response(
    `<!doctype html>
<html lang="fr"><head>
<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex, nofollow"><title>Sac à topos</title>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;800&display=swap">
<style>
  body { margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center; background: #2f4a3a; font-family: Inter, system-ui, sans-serif; color: #f4efe6; padding: 16px; box-sizing: border-box; }
  form { display: flex; flex-direction: column; align-items: center; gap: 16px; text-align: center; }
  h1 { margin: 0; font-weight: 800; font-size: 2rem; letter-spacing: -0.02em; }
  p { margin: 0; color: #cfe0d4; }
  input { font-size: 1.4rem; padding: 10px 12px; width: 14ch; text-align: center; border: 1px solid #dbe3e9; border-radius: 10px; }
  input:focus { outline: 3px solid #c8a27a; border-color: #c8a27a; }
  button { font: 600 1rem Inter, sans-serif; padding: 10px 18px; background: #c8a27a; color: #2b2f2a; border: 0; border-radius: 999px; cursor: pointer; }
  .erreur { color: #f3c98a; font-weight: 600; }
</style></head><body>
<form method="post" action="/__connexion">
  <h1>Sac à topos</h1>
  <p>Entre le mot de passe pour ouvrir le site</p>
  <input type="password" name="mot_de_passe" autocomplete="current-password" autofocus aria-label="Mot de passe">
  <button type="submit">Entrer</button>
  ${erreur ? '<p class="erreur" role="alert">Mot de passe incorrect</p>' : ""}
</form></body></html>`,
    { status: erreur ? 401 : 200, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } }
  );
}

export async function onRequest(context) {
  const { request, env, next } = context;
  const motDePasse = env.SITE_PASSWORD;
  if (!motDePasse) return new Response("Mot de passe non configuré dans Cloudflare (SITE_PASSWORD).", { status: 500 });

  const attendu = await jeton(motDePasse);
  const url = new URL(request.url);

  // Envoi du formulaire de connexion
  if (url.pathname === "/__connexion" && request.method === "POST") {
    const donnees = await request.formData();
    const saisi = String(donnees.get("mot_de_passe") || "");
    if (!egal(await jeton(saisi), attendu)) {
      await new Promise((r) => setTimeout(r, 1500)); // ralentit les essais au hasard
      return pageConnexion(true);
    }
    return new Response(null, {
      status: 303,
      headers: {
        Location: "/",
        "Set-Cookie": `${COOKIE}=${attendu}; Max-Age=${UN_AN}; Path=/; HttpOnly; Secure; SameSite=Lax`,
      },
    });
  }

  // Appareil déjà connecté : on sert normalement la page demandée.
  if (egal(lireCookie(request, COOKIE), attendu)) {
    const reponse = await next();
    const copie = new Response(reponse.body, reponse);
    copie.headers.set("X-Robots-Tag", "noindex, nofollow");
    return copie;
  }

  return pageConnexion(false);
}
