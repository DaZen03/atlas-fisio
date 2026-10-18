const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..','dist');
const out=path.join(root,'vistas');
const source=fs.readFileSync(path.join(root,'index.html'),'utf8');
fs.mkdirSync(out,{recursive:true});

const views=[
  {slug:'aprender',title:'Ruta de aprendizaje',description:'Estudia los conceptos desde fundamentos hasta aplicación.'},
  {slug:'explorar',title:'Atlas 3D',description:'Explora el modelo anatómico, sus movimientos y el mapa articular.'},
  {slug:'animaciones',title:'Animaciones y movimientos',description:'Compara fases y recorre los movimientos guiados con el modelo anatómico.'},
  {slug:'articulaciones',title:'Mapa articular',description:'Elige una articulación y relaciónala con su movimiento en el atlas.'},
  {slug:'estructuras',title:'Estructuras del cuerpo',description:'Busca huesos, articulaciones y músculos por región.'},
  {slug:'practicar',title:'Cuestionarios',description:'Practica por áreas y relaciona las respuestas con el modelo.'},
  {slug:'verificacion',title:'Verificación anatómica',description:'Revisa los límites y controles de calidad del atlas.'},
  {slug:'formatos',title:'Formatos y recursos',description:'Consulta los archivos y formatos empleados por el modelo.'},
  {slug:'fuentes',title:'Fuentes y créditos',description:'Consulta la bibliografía y procedencia del atlas.'}
];

for(const view of views){
  let html=source
    .replace('<html lang="es" data-atlas-view="inicio">',`<html lang="es" data-atlas-view="${view.slug}">`)
    .replace('<meta charset="utf-8">', '<meta charset="utf-8">\n  <base href="../">')
    .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${view.description}">`)
    .replace(/<title>[^<]*<\/title>/,`<title>${view.title} · Atlas del movimiento humano</title>`)
    .replace(/ aria-current="page"/g,'')
    .replace(`href="./vistas/${view.slug}.html"`,`href="./vistas/${view.slug}.html" aria-current="page"`);
  if(!html.includes(`data-atlas-view="${view.slug}"`)||!html.includes('<base href="../">'))throw Error(`No se preparó la vista ${view.slug}`);
  fs.writeFileSync(path.join(out,`${view.slug}.html`),html);
}
console.log(`Generadas ${views.length} páginas independientes, sin iframe.`);
