const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { renderSiteMenu } = require('./site-menu.cjs');

const sample = renderSiteMenu('../', 'biomecanica');
for (const group of ['Empieza aquí','Explora el cuerpo','Aplica lo aprendido','Consulta']) assert.ok(sample.includes(group), `Falta la categoría ${group}`);
assert.equal([...sample.matchAll(/<a href=/g)].length, 14);
assert.match(sample, /href="\.\.\/biomecanica\/index\.html" aria-current="page"/);

const root = path.join(__dirname, '..', 'dist');
const pages = [];
function visit(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) visit(target);
    else if (entry.name.endsWith('.html')) pages.push(target);
  }
}
visit(root);
for (const page of pages) {
  const html = fs.readFileSync(page, 'utf8');
  assert.match(html, /<details class="site-menu">/, `Falta menú en ${page}`);
  assert.match(html, /<nav class="site-menu-panel" aria-label="Categorías del atlas">/, `Falta descripción accesible del menú en ${page}`);
  assert.match(html, /site-menu\.css/, `Faltan estilos del menú en ${page}`);
}
console.log(`Menú de cuatro categorías verificado en ${pages.length} páginas.`);
