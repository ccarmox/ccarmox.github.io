async function obtenerContenido(rutaLocal, rutaBackup) {
  try {
    // 1. Intentamos la carga principal
    let respuesta = await fetch(rutaLocal);

    // Si el archivo no existe (404) o hay error de servidor (500)
    if (!respuesta.ok) {
      throw new Error(`Fallo en ruta local: ${respuesta.status}`);
    }

    return await respuesta.text();
  } catch (error) {
    console.warn("Ruta local no disponible, intentando backup...", error);

    // 2. Intentamos la carga desde la URL de respaldo
    try {
      const respuestaBackup = await fetch(rutaBackup);
      if (!respuestaBackup.ok) throw new Error("Error en backup");

      return await respuestaBackup.text();
    } catch (backupError) {
      console.error("Ambas rutas han fallado.");
      return "";
    }
  }
}

async function encriptacion() {
    try {
        // Importación dinámica
        const modulo = await import('https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/+esm');
        
        // Retornamos la propiedad .default que contiene todas las funciones (AES, SHA256, etc.)
        return modulo.default;
    } catch (error) {
        console.error("No se pudo cargar CryptoJS desde el CDN:", error);
        
        // Opcional: Intento de fallback si el primero falla
        // return await cargarFallback(); 
    }
}

async function loadPageConfig(encripted_data) {

    const container = document.getElementById("app");

  try {
    var decripted_data = "";

    try {
      // Obtener los parámetros de la URL actual
      const params = new URLSearchParams(window.location.search);

      // Leer el valor de 'key'
      const miClave = params.get("key");

      const CryptoJS = await encriptacion();

      // Proceso de desencriptación
      const bytes = CryptoJS.AES.decrypt(encripted_data.trim().trim(), miClave);

      // Convertir los bytes a texto legible (UTF-8)
      decripted_data = bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("La clave es incorrecta.");
      decripted_data = encripted_data.trim();
    }

    const data = JSON.parse(decripted_data);

    window.json_data = data;

    // 1. Cargar la estructura general
    const htmlText = await obtenerContenido(
      "../../../ui/html_ui_game.html",
      "https://ccarmox.github.io/sandbox2/ui/html_ui_game.html",
    );
    container.innerHTML = htmlText;

    // 3. Personalizar el contenido
    document.title = data.titulo;
    document.getElementById("main-title").innerText = data.titulo;
    document.getElementById("main-description").innerText = data.descripcion;
  } catch (error) {
    console.error("Error cargando la configuración:", error);

    // 1. Cargar la estructura general
    const htmlText = await obtenerContenido(
      "../../../ui/html_ui_error.html",
      "https://ccarmox.github.io/sandbox2/ui/html_ui_error.html",
    );
    container.innerHTML = htmlText;
  }

  // Buscamos todos los scripts dentro de lo que acabamos de insertar
  const scripts = container.querySelectorAll("script");
  scripts.forEach((oldScript) => {
    const newScript = document.createElement("script");
    // Copiamos el contenido o la fuente (src)
    if (oldScript.src) {
      newScript.src = oldScript.src;
    } else {
      newScript.textContent = oldScript.textContent;
    }
    // Lo añadimos al documento para que se ejecute
    document.body.appendChild(newScript);
    // Opcional: borramos el original para no ensuciar
    oldScript.parentNode.removeChild(oldScript);
  });
}
