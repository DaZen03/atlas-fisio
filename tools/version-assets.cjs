const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');

const distDir = process.env.ATLAS_DIST_DIR || path.join(__dirname, '..', 'dist');
const version = process.argv[2] === 'auto'
  ? createHash('sha256')
      .update(['styles.css','app.bundle.js','site-menu.css','guide-pages.css','analysis.css','pose-worker.js','youtube-link.js','biomechanics-pages.css','biomechanics-study.js']
        .filter(asset => fs.existsSync(path.join(distDir, asset)))
        .map(asset => `${asset}:${createHash('sha256').update(fs.readFileSync(path.join(distDir, asset))).digest('hex')}`)
        .join('|'))
      .digest('hex').slice(0, 12)
  : process.argv[2];
if (!version || !/^[a-f0-9]{7,40}$/i.test(version)) {
  throw new Error('Indica un identificador de versión Git válido.');
}

function versionReference(html, ref) {
  const versionedRef = `${ref}?v=${version}`;
  if (html.includes(versionedRef)) return html;
  const escaped = ref.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`${escaped}(?:\\?v=[a-f0-9]{7,40})?`, 'i');
  if (!pattern.test(html)) throw new Error(`No se encontró ${ref} en ${distDir}`);
  return html.replace(pattern, versionedRef);
}

const indexPath = path.join(distDir, 'index.html');
let indexHtml = fs.readFileSync(indexPath, 'utf8');
for (const asset of ['styles.css', 'site-menu.css', 'app.bundle.js']) indexHtml = versionReference(indexHtml, `./${asset}`);
fs.writeFileSync(indexPath, indexHtml);

const guidesDir = path.join(distDir, 'guias');
function visitHtml(directory) {
  for (const entry of fs.readdirSync(directory, {withFileTypes:true})) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) visitHtml(target);
    else if (entry.isFile() && entry.name.endsWith('.html')) {
      let html = fs.readFileSync(target, 'utf8');
      const baseHref = html.match(/<base\s+href="([^"]+)"/i)?.[1];
      const baseDir = baseHref ? path.resolve(path.dirname(target), baseHref) : path.dirname(target);
      for (const asset of ['guide-pages.css','analysis.css','analysis.js','biomechanics-pages.css','biomechanics-study.js','site-menu.css','styles.css','app.bundle.js']) {
        const relative = path.relative(baseDir, path.join(distDir, asset)).split(path.sep).join('/');
        const reference = `${relative.startsWith('.') ? '' : './'}${relative}`;
        if (html.includes(reference)) html = versionReference(html, reference);
      }
      fs.writeFileSync(target, html);
    }
  }
}
visitHtml(distDir);
const analysisJsPath = path.join(distDir, 'analysis.js');
if (fs.existsSync(analysisJsPath)) {
  let analysisJs = fs.readFileSync(analysisJsPath, 'utf8');
  analysisJs = versionReference(analysisJs, './pose-worker.js');
  if (analysisJs.includes('./youtube-link.js')) analysisJs = versionReference(analysisJs, './youtube-link.js');
  fs.writeFileSync(analysisJsPath, analysisJs);
}
console.log(`Archivos estáticos versionados con ${version}`);
