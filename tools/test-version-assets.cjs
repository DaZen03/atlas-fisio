const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'atlas-pages-version-'));
try {
  const guides = path.join(root, 'guias');
  fs.mkdirSync(guides);
  fs.writeFileSync(path.join(root, 'index.html'), '<link rel="stylesheet" href="./styles.css"><script src="./app.bundle.js"></script>');
  fs.writeFileSync(path.join(guides, 'aprendizaje.html'), '<link rel="stylesheet" href="../guide-pages.css">');
  const result = spawnSync(process.execPath, [path.join(__dirname, 'version-assets.cjs'), 'abcdef0123'], {
    encoding: 'utf8',
    env: { ...process.env, ATLAS_DIST_DIR: root }
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /\.\/styles\.css\?v=abcdef0123/);
  assert.match(fs.readFileSync(path.join(root, 'index.html'), 'utf8'), /\.\/app\.bundle\.js\?v=abcdef0123/);
  assert.match(fs.readFileSync(path.join(guides, 'aprendizaje.html'), 'utf8'), /\.\.\/guide-pages\.css\?v=abcdef0123/);
  console.log('Versionado de la portada y las guías validado.');
} finally {
  const resolvedRoot = path.resolve(root);
  if (path.dirname(resolvedRoot) !== path.resolve(os.tmpdir())) throw new Error(`No se eliminará una ruta temporal inesperada: ${resolvedRoot}`);
  fs.rmSync(resolvedRoot, { recursive: true, force: true });
}
