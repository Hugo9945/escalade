// Active le mode hors connexion (voir sw.js) et affiche un petit bandeau quand il n'y a pas de réseau.
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("sw.js")
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.active && reg.active.postMessage("precharger"))
      .catch(() => {});
  });
}

function bandeauHorsLigne() {
  let b = document.getElementById("bandeau-hors-ligne");
  if (navigator.onLine) {
    if (b) b.remove();
    return;
  }
  if (!b) {
    b = document.createElement("div");
    b.id = "bandeau-hors-ligne";
    b.className = "hors-ligne";
    b.textContent = "Hors connexion : copie enregistrée du site";
    document.body.appendChild(b);
  }
}
window.addEventListener("online", bandeauHorsLigne);
window.addEventListener("offline", bandeauHorsLigne);
window.addEventListener("load", bandeauHorsLigne);
