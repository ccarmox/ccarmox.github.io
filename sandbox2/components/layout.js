async function loadPageConfig(encripted_data) {
  try {

    var decripted_data = "";

try {

  // Obtener los parámetros de la URL actual
const params = new URLSearchParams(window.location.search);

// Leer el valor de 'key'
const miClave = params.get('key');

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
    const responseHtml = await fetch("../../../components/general.html");
    const htmlText = await responseHtml.text();
    const container = document.getElementById("app");
    container.innerHTML = htmlText;

    // 3. Personalizar el contenido
    document.title = data.titulo;
    document.getElementById("main-title").innerText = data.titulo;
    document.getElementById("main-description").innerText = data.descripcion;

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
  } catch (error) {
    console.error("Error cargando la configuración:", error);
  }
}
