const fs = require('node:fs');
const path = require('node:path');

const groups = [
  ['Empieza aquí', [
    ['inicio', 'Inicio', 'index.html', 'Vista general'],
    ['aprender', 'Aprender', 'vistas/aprender.html', 'Ruta de estudio'],
    ['practicar', 'Practicar', 'vistas/practicar.html', 'Preguntas por área']
  ]],
  ['Explora el cuerpo', [
    ['explorar', 'Atlas 3D', 'vistas/explorar.html', 'Capas y movimientos'],
    ['estructuras', 'Estructuras', 'vistas/estructuras.html', 'Huesos y músculos'],
    ['articulaciones', 'Articulaciones', 'vistas/articulaciones.html', 'Mapa por región'],
    ['animaciones', 'Animaciones', 'vistas/animaciones.html', 'Fases del gesto']
  ]],
  ['Aplica lo aprendido', [
    ['biomecanica', 'Biomecánica', 'biomecanica/index.html', 'Palancas y carga'],
    ['analisis', 'Analizar vídeo', 'analisis.html', 'Observación por fases']
  ]],
  ['Consulta', [
    ['verificacion', 'Verificación', 'vistas/verificacion.html', 'Alcance del modelo'],
    ['formatos', 'Formatos', 'vistas/formatos.html', 'Archivos del atlas'],
    ['fuentes', 'Fuentes', 'vistas/fuentes.html', 'Bibliografía y créditos']
  ]]
];

function renderSiteMenu(prefix, active = '') {
  const links = groups.map(([label, items]) => `<div class="site-menu-group"><h2>${label}</h2>${items.map(([key, title, route, description]) => `<a href="${prefix}${route}"${key === active ? ' aria-current="page"' : ''}><strong>${title}</strong><small>${description}</small></a>`).join('')}</div>`).join('');
  return `<details class="site-menu"><summary><span aria-hidden="true">☰</span><span>Secciones</span><span class="site-menu-chevron" aria-hidden="true">⌄</span></summary><nav class="site-menu-panel" aria-label="Categorías del atlas">${links}</nav></details>`;
}

function updateTemplate(file, navClass, prefix, active) {
  let html = fs.readFileSync(file, 'utf8');
  const oldNav = new RegExp(`<nav class="${navClass}"[^>]*>[\\s\\S]*?<\\/nav>`);
  const currentMenu = /<details class="site-menu">[\s\S]*?<\/details>/;
  const matcher = currentMenu.test(html) ? currentMenu : oldNav;
  if (!matcher.test(html)) throw new Error(`No se encontró la navegación en ${file}`);
  html = html.replace(matcher, renderSiteMenu(prefix, active));
  const stylesheet = `<link rel="stylesheet" href="${prefix}site-menu.css">`;
  if (!html.includes(stylesheet)) html = html.replace(/(<link rel="stylesheet" href="[^\"]+\.css">)/, `$1\n  ${stylesheet}`);
  fs.writeFileSync(file, html);
}

if (require.main === module) {
  const root = path.join(__dirname, '..', 'dist');
  updateTemplate(path.join(root, 'index.html'), 'primary-tabs', './', 'inicio');
  updateTemplate(path.join(root, 'analisis.html'), 'main-tabs', './', 'analisis');
  console.log('Menú de categorías aplicado a las páginas principales.');
}

module.exports = { renderSiteMenu };
