const fs=require('fs');
const path=require('path');
const base=__dirname;
const html=fs.readFileSync(path.join(base,'dist','index.html'),'utf8');
const css=fs.readFileSync(path.join(base,'dist','styles.css'),'utf8');
const menuCss=fs.readFileSync(path.join(base,'dist','site-menu.css'),'utf8');
const model=fs.readFileSync(path.join(base,'dist','assets','bodyparts.glb')).toString('base64');
const dataUrl=`data:model/gltf-binary;base64,${model}`;
const bundle=fs.readFileSync(path.join(base,'standalone-bundle.js'),'utf8');
if(!bundle.includes('./assets/bodyparts.glb'))throw new Error('No se encontró la ruta del GLB para integrarlo');
const js=bundle.replaceAll('./assets/bodyparts.glb',dataUrl).replace(/<\/script/gi,'<\\/script');
const result=html
  .replace('data-atlas-view="inicio"','')
  .replace(/<link rel="stylesheet" href="\.\/styles\.css(?:\?v=[a-f0-9]{7,40})?">/i,()=>`<style>${css}</style>`)
  .replace(/<link rel="stylesheet" href="\.\/site-menu\.css(?:\?v=[a-f0-9]{7,40})?">/i,()=>`<style>${menuCss}</style>`)
  .replace(/<script type="module" src="\.\/app\.bundle\.js(?:\?v=[a-f0-9]{7,40})?"><\/script>/i,()=>`<script>${js}</script>`);
const routeAnchors={'./vistas/aprender.html':'#ruta-aprendizaje','./vistas/explorar.html':'#explorar','./vistas/animaciones.html':'#guided-timeline','./vistas/articulaciones.html':'#explorar','./vistas/estructuras.html':'#estructuras','./vistas/practicar.html':'#cuestionarios','./vistas/verificacion.html':'#verificacion','./vistas/formatos.html':'#formatos','./vistas/fuentes.html':'#fuentes','./biomecanica/index.html':'#biomecanica','./analisis.html':'#explorar'};
let standaloneHtml=result;
for(const [route,anchor] of Object.entries(routeAnchors))standaloneHtml=standaloneHtml.replaceAll(`href="${route}"`,`href="${anchor}"`);
for(const asset of ['referencia-codo.svg','referencia-bisagra.svg','referencia-momento.svg']){
  const svg=fs.readFileSync(path.join(base,'dist','assets',asset)).toString('base64');
  standaloneHtml=standaloneHtml.replaceAll(`src="./assets/${asset}"`,`src="data:image/svg+xml;base64,${svg}"`);
}
if(/<script type="module" src="\.\/app\.bundle\.js(?:\?v=[a-f0-9]{7,40})?"><\/script>|<link rel="stylesheet" href="\.\/styles\.css(?:\?v=[a-f0-9]{7,40})?">/i.test(standaloneHtml))throw new Error('No se integraron los archivos del visor');
fs.writeFileSync(path.join(base,'..','..','outputs','atlas-movimiento-3d.html'),standaloneHtml);
console.log('Archivo HTML autónomo creado');
