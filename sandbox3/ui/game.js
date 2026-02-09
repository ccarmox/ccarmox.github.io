async function obtenerUrlValida(rutaLocal, rutaBackup) {
  try {
    const respuesta = await fetch(rutaLocal, { method: "HEAD" });
    return respuesta.ok ? rutaLocal : rutaBackup;
  } catch (error) {
    console.warn("Ruta local no disponible, usando backup...");
    return rutaBackup;
  }
}

async function encriptacion() {
  try {
    const modulo = await import("https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/+esm");
    return modulo.default;
  } catch (error) {
    console.error("No se pudo cargar CryptoJS:", error);
  }
}

// Escuchador de mensajes global (solo se registra una vez)
window.addEventListener("message", (event) => {
  if (event.data && event.data.type === "KEY") {
    const url = new URL(window.location.href);
    url.searchParams.set("key", event.data.payload);
    window.location.href = url.toString();
  }
});

async function loadPageConfig(encripted_data) {

  const container = document.getElementById("app");
  
  // RESET DEL CONTENEDOR PADRE (Crucial para el scroll)
  Object.assign(container.style, {
    margin: "0",
    padding: "0",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
    position: "fixed", // Fija el contenedor para evitar rebotes de scroll en móvil
    top: "0",
    left: "0"
  });
  
  container.innerHTML = "";
  const iframe = document.createElement("iframe");

  // Estilos de integración total e invisible
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",
    border: "none",
    margin: "0",
    padding: "0",
    display: "block",
    overflowY: "auto", // El scroll sucede AQUÍ
    webkitOverflowScrolling: "touch" // Scroll fluido en iOS
  });

  iframe.setAttribute("frameborder", "0");

  try {
    let decripted_data = "";
    const params = new URLSearchParams(window.location.search);
    const miClave = params.get("key");

    try {
      const CryptoJS = await encriptacion();
      const bytes = CryptoJS.AES.decrypt(encripted_data.trim(), miClave);
      decripted_data = bytes.toString(CryptoJS.enc.Utf8);
      if (!decripted_data) throw new Error("JSON vacío");
    } catch (error) {
      console.error("Error en desencriptación.");
      decripted_data = encripted_data.trim();
    }

    const data = JSON.parse(decripted_data);
    window.json_data = data;

    const urlValida = await obtenerUrlValida(
      "../../../ui/html_ui_game.html",
      "https://ccarmox.github.io/sandbox3/ui/html_ui_game.html"
    );

    iframe.onload = () => {
      iframe.contentWindow.postMessage({ type: "INIT_DATA", payload: data }, "*");
    };

    iframe.src = urlValida;
    container.appendChild(iframe);
    document.title = data.title;

  } catch (error) {
    console.error("Error cargando configuración, mostrando error UI.");

    const urlError = await obtenerUrlValida(
      "../../../ui/html_ui_error.html",
      "https://ccarmox.github.io/sandbox3/ui/html_ui_error.html"
    );

    const keyParam = new URLSearchParams(window.location.search).get("key");

    iframe.onload = () => {
      iframe.contentWindow.postMessage({ type: "INIT_DATA", payload: keyParam }, "*");
    };

    iframe.src = urlError;
    container.appendChild(iframe);
    document.title = "🔒";
  }
}