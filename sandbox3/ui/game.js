/**
 * Comprueba qué URL está disponible sin descargar todo el contenido.
 * Retorna la URL válida (string).
 */
async function obtenerUrlValida(rutaLocal, rutaBackup) {
  try {
    // Intentamos verificar la ruta local (usamos method: 'HEAD' para ser más eficientes si el servidor lo soporta,
    // si no, un fetch normal también vale para comprobar el status).
    const respuesta = await fetch(rutaLocal, { method: "HEAD" });

    if (respuesta.ok) {
      return rutaLocal;
    } else {
      throw new Error(`Ruta local status: ${respuesta.status}`);
    }
  } catch (error) {
    console.warn("Ruta local no disponible, verificando backup...", error);
    // Si falla la local, devolvemos la de backup (asumiendo que esta funcionará,
    // o podrías hacer otro fetch check aquí si quisieras ser estricto).
    return rutaBackup;
  }
}

async function encriptacion() {
  try {
    const modulo =
      await import("https://cdn.jsdelivr.net/npm/crypto-js@4.1.1/+esm");
    return modulo.default;
  } catch (error) {
    console.error("No se pudo cargar CryptoJS desde el CDN:", error);
  }
}

async function loadPageConfig(encripted_data) {
  const container = document.getElementById("app");

  // Limpiamos el contenedor
  container.innerHTML = "";

  // Creamos el iframe
  const iframe = document.createElement("iframe");

  // Estilos para integración total (hace que el iframe sea imperceptible)
  Object.assign(iframe.style, {
    width: "100%",
    height: "100%",        // Cambiamos a 100% para que dependa del padre
    minHeight: "100vh",    // Forzamos el mínimo de pantalla
    border: "none",
    margin: "0",
    padding: "0",
    display: "block"
  });

  // Atributos adicionales de limpieza
  iframe.setAttribute("frameborder", "0");
  iframe.setAttribute("marginheight", "0");
  iframe.setAttribute("marginwidth", "0");

  try {
    let decripted_data = "";

    try {
      const params = new URLSearchParams(window.location.search);
      const miClave = params.get("key");
      const CryptoJS = await encriptacion();

      const bytes = CryptoJS.AES.decrypt(encripted_data.trim(), miClave);
      decripted_data = bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error("La clave es incorrecta o no se pudo desencriptar.");
      decripted_data = encripted_data.trim();
    }

    const data = JSON.parse(decripted_data);

    // Guardamos en window por si acaso, aunque con iframe se usa postMessage
    window.json_data = data;

    // 1. Determinar la URL correcta
    const urlValida = await obtenerUrlValida(
      "../../../ui/html_ui_game.html",
      "https://ccarmox.github.io/sandbox3/ui/html_ui_game.html",
    );

    // 2. Configurar el evento de carga del iframe para enviar los datos
    iframe.onload = () => {
      // Enviamos el objeto 'data' al iframe una vez que ha cargado
      // El segundo parámetro "*" permite enviar a cualquier origen, cámbialo a la URL específica si necesitas más seguridad.
      iframe.contentWindow.postMessage(
        {
          type: "INIT_DATA",
          payload: data,
        },
        "*",
      );
    };

    // 3. Establecer la fuente e insertar en el DOM
    iframe.src = urlValida;
    container.appendChild(iframe);

    // Nota: Ya no modificamos document.title aquí directamente si queremos que lo haga el iframe,
    // pero podemos dejarlo para la ventana padre:
    document.title = data.titulo;
  } catch (error) {
    console.error("Error cargando la configuración:", error);

    // Cargar la versión de error en el iframe
    const urlError = await obtenerUrlValida(
      "../../../ui/html_ui_error.html",
      "https://ccarmox.github.io/sandbox3/ui/html_ui_error.html",
    );

    const urlParams = new URLSearchParams(window.location.search);
    const keyParam = urlParams.get("key");

    // 2. Configurar el evento de carga del iframe para enviar los datos
    iframe.onload = () => {
      // Enviamos el objeto 'data' al iframe una vez que ha cargado
      // El segundo parámetro "*" permite enviar a cualquier origen, cámbialo a la URL específica si necesitas más seguridad.
      iframe.contentWindow.postMessage(
        {
          type: "INIT_DATA",
          payload: keyParam,
        },
        "*",
      );
    };

    // Escuchamos mensajes que vengan de cualquier iframe o ventana hija
    window.addEventListener("message", (event) => {
      // 1. (Opcional pero recomendado) Verificar el origen por seguridad
      // if (event.origin !== "https://ccarmox.github.io") return;

      // 2. Filtramos por el tipo de mensaje que definimos en el hijo
      if (event.data && event.data.type === "KEY") {
        const inputVal = event.data.payload;

        // Obtenemos la URL actual
        const url = new URL(window.location.href);

        // Establecemos (o sobrescribimos) el parámetro 'Key'
        url.searchParams.set("key", inputVal);

        // Recargamos la página con la nueva URL
        window.location.href = url.toString();
      }
    });

    iframe.src = urlError;
    container.appendChild(iframe);
  }
}
