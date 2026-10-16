const fs = require('node:fs');
const path = require('node:path');

const version = process.argv[2];
if (!version || !/^[a-f0-9]{7,40}$/i.test(version)) {
  throw new Error('Indica un identificador de versión Git válido.');
}

const distDir = process.env.ATLAS_DIST_DIR || path.join(__dirname, '..', 'dist');
const indexPath = path.join(distDir, 'index.html');
let html = fs.readFileSync(indexPath, 'utf8');
for (const asset of ['styles.css', 'app.bundle.js']) {
  const ref = `./${asset}`;
  const versionedRef = `${ref}?v=${version}`;
  if (html.includes(versionedRef)) continue;
  const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}(?!\\?v=)`);
  if (!pattern.test(html)) throw new Error(`No se encontró ${ref} en dist/index.html`);
  html = html.replace(pattern, versionedRef);
}

fs.writeFileSync(indexPath, html);
console.log(`Archivos versionados con ${version}`);
