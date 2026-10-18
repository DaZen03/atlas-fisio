# Estructura del proyecto

## Directorios

- `dist/` es a la vez la aplicación fuente del atlas estático y la carpeta publicada por GitHub Pages. `index.html` es la portada y plantilla de las vistas, mientras `app.js`, `data.js` y `extra-movements.js` son fuentes editables; `app.bundle.js` es salida compilada. `vistas/` contiene los HTML de aprendizaje, atlas, animaciones, articulaciones, estructuras, práctica, verificación, formatos y fuentes. `analisis.html` y `biomecanica/` son rutas independientes. `guias/` conserva las lecciones. `assets/` contiene GLB, manifiestos y pivotes.
- `tools/` contiene generadores de páginas, utilidades de catálogo y versionado para Pages.
- `docs/` contiene decisiones de integración, fuentes evaluadas y límites del modelo.
- `.github/workflows/` automatiza la publicación de `dist/` en GitHub Pages.
- `standalone-bundle.js` y `outputs/atlas-movimiento-3d.html` se generan para la versión autónoma que puede abrirse sin servidor.

## Comandos habituales

- `npm install`: instala dependencias fijadas en `package.json`.
- `npm run build`: regenera páginas, bundles y el HTML autónomo.
- `npm test`: ejecuta validación anatómica, biomecánica y regresiones del rig.
- `npm run serve`: sirve el atlas en `http://127.0.0.1:3000`.

## Flujo de publicación

El workflow publica el contenido completo de `dist/`. Mantener referencias relativas (`./` y `../`) para que funcione en la URL de proyecto de GitHub Pages. La versión de CSS, JS y worker se agrega durante el workflow según el SHA del commit. No editar a mano los bundles: modificar `dist/app.js` y volver a ejecutar `npm run build`.

## Próxima mejora de estructura

La fuente principal sigue dentro de `dist/` para mantener una publicación directa. Si se separa en el futuro, hacer el cambio junto con una configuración de build que copie y empaquete explícitamente a `dist/`; mover fuentes sin esa fase de compilación rompería las rutas del sitio.
