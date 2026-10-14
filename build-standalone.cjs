const fs=require('fs');
const path=require('path');
const base=__dirname;
const html=fs.readFileSync(path.join(base,'dist','index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'dist','styles.css'),'utf8');
const model=fs.readFileSync(path.join(base,'dist','assets','bodyparts.glb')).toString('base64');
const dataUrl=`data:model/gltf-binary;base64,${model}`;
const bundle=fs.readFileSync(path.join(base,'standalone-bundle.js'),'utf8');
if(!bundle.includes('./assets/bodyparts.glb'))throw new Error('No se encontró la ruta del GLB para integrarlo');
const js=bundle.replaceAll('./assets/bodyparts.glb',dataUrl).replace(/<\/script/gi,'<\\/script');
const result=html
  .replace(/<link rel="stylesheet" href="\.\/styles\.css">/,()=>`<style>${css}</style>`)
  .replace(/<script type="module" src="\.\/app\.bundle\.js"><\/script>/,()=>`<script>${js}</script>`);
if(result.includes('<script type="module" src="./app.bundle.js"></script>')||result.includes('<link rel="stylesheet" href="./styles.css">'))throw new Error('No se integraron los archivos del visor');
fs.writeFileSync(path.join(base,'..','..','outputs','atlas-movimiento-3d.html'),result);
console.log('Archivo HTML autónomo creado');
