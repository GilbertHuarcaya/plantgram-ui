# Plantgram UI (frontend)

Frontend static prototype for Plantgram built with Alpine.js and Tailwind CSS.

Capabilities
- Feed: muestra publicaciones paginadas con imagenes, likes, comentarios y guardados.
- Post detail: vista ampliada de una publicación con imagen, información, acciones y comentarios.
- Crear publicación: subida de imagen y meta (plant-profile, especie, tags).
- Perfil de usuario: listado de posts, guardados y perfiles de planta del usuario.
- Perfiles de plantas: CRUD básico para perfiles de plantas y galería asociada.
- Especies / Explorar: búsqueda y detalle de especies, listado de perfiles asociados.
- Guardados (Saves): ver y gestionar publicaciones guardadas.
- Notificaciones: listar, marcar como leídas y eliminar notificaciones.
- Configuración: actualización simple del perfil de usuario (avatar, nombre, bio).

Tech stack
- Alpine.js (v3) for small reactive stores and UI bindings.
- Tailwind CSS for styling (CDN or local install supported).
- Simple Node static server (`index.js`) to serve files from `public/`.

Run locally
1. From the `plantgram-ui` folder, install dependencies:

```bash
npm install
```

2. Start the static server:

```bash
npm start
```

3. Open the app at `http://localhost:3001`.

Notes
- By default the frontend expects the backend API at `http://localhost:3000`.
- To change the API base URL, set `window.PLANTGRAM_API_URL` before loading `store/index.js` in `public/index.html`.
- The project currently loads Alpine.js and Tailwind via CDN in `public/index.html`, but `package.json` includes them as dependencies for local build or future tooling.

No author or AI usage information is included in this README.
