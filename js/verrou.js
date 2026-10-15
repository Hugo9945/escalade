// Écran de code à 4 chiffres. Chargé dans le <head> de chaque page, avant l'affichage.
// Ce n'est pas une vraie sécurité (les données restent lisibles sur GitHub) : ça évite juste
// qu'un visiteur qui tombe sur le lien voie le site.
// Le code n'est pas écrit ici : seulement son empreinte SHA-256 de « escalade:<code> ».
// Pour changer le code : printf 'escalade:NOUVEAU' | shasum -a 256

(function () {
  const EMPREINTE = "9d3b5583d3d45f3e04de6865631d75461f70008de175c14cd9b5ec4989d34d42";
  const CLE = "escalade-deverrouille";

  function lire() {
    try { return localStorage.getItem(CLE); } catch (e) { return null; }
  }
  function memoriser() {
    try { localStorage.setItem(CLE, EMPREINTE); } catch (e) { /* navigation privée : il faudra retaper le code */ }
  }

  if (lire() === EMPREINTE) return;

  document.documentElement.classList.add("verrouille");
  const style = document.createElement("style");
  style.textContent = `
    html.verrouille body > *:not(#verrou) { display: none !important; }
    #verrou { position: fixed; inset: 0; z-index: 10000; background: #1f2a44; color: #f6ecd6;
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
      padding: 16px; font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; text-align: center; }
    #verrou h1 { margin: 0; font-family: "Alfa Slab One", Georgia, serif; font-weight: 400; font-size: 2rem; color: #e2a03f; letter-spacing: 1px; }
    #verrou p { margin: 0; opacity: 0.85; }
    #verrou input { width: 9ch; font-size: 2rem; letter-spacing: 0.4em; text-align: center; padding: 8px 4px 8px 0.4em;
      border-radius: 10px; border: 2px solid #fff; background: rgba(255,255,255,0.1); color: #fff; }
    #verrou input:focus { outline: 3px solid #f2c94c; }
    #verrou .erreur-code { min-height: 1.4em; color: #ffd4cc; font-weight: 600; }
    #verrou.secoue input { animation: secoue 0.3s; }
    @keyframes secoue { 25% { transform: translateX(-8px); } 75% { transform: translateX(8px); } }
  `;
  document.head.appendChild(style);

  async function empreinte(texte) {
    const octets = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(texte));
    return [...new Uint8Array(octets)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  document.addEventListener("DOMContentLoaded", () => {
    const ecran = document.createElement("div");
    ecran.id = "verrou";
    ecran.innerHTML = `
      <h1>Sac à topos</h1>
      <p>Entre le code pour ouvrir le site</p>
      <input type="password" inputmode="numeric" pattern="[0-9]*" maxlength="4" autocomplete="off" aria-label="Code à 4 chiffres">
      <div class="erreur-code" role="alert"></div>`;
    document.body.appendChild(ecran);
    const champ = ecran.querySelector("input");
    const erreur = ecran.querySelector(".erreur-code");
    champ.focus();

    champ.addEventListener("input", async () => {
      champ.value = champ.value.replace(/\D/g, "").slice(0, 4);
      erreur.textContent = "";
      if (champ.value.length < 4) return;
      if ((await empreinte("escalade:" + champ.value)) === EMPREINTE) {
        memoriser();
        ecran.remove();
        document.documentElement.classList.remove("verrouille");
        window.dispatchEvent(new Event("resize")); // la carte recalcule sa taille
      } else {
        erreur.textContent = "Code incorrect";
        ecran.classList.remove("secoue");
        void ecran.offsetWidth;
        ecran.classList.add("secoue");
        champ.value = "";
      }
    });
  });
})();
