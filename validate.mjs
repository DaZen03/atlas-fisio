import fs from 'node:fs';
import { movements, biomechanics, structures, sources, planes, jointExplorer, leverStudy } from './dist/data.js';
import meshManifest from './dist/assets/bodyparts-manifest.json' with { type: 'json' };
import anatomicalJoints from './dist/assets/bodyparts-joints.json' with { type: 'json' };

const html = fs.readFileSync('./dist/index.html', 'utf8');
const app = fs.readFileSync('./dist/app.js', 'utf8');
const standalone = fs.readFileSync('../../outputs/atlas-movimiento-3d.html', 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const referencedIds = [...app.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]);
const structureIds = new Set(structures.map(structure => structure.id));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };

check(ids.size === [...html.matchAll(/\bid="([^"]+)"/g)].length, 'Hay identificadores HTML duplicados.');
for (const id of referencedIds) check(ids.has(id), `Falta el elemento HTML ${id}.`);
check(movements.length === 46, 'No hay 46 movimientos.');
check(movements.filter(m=>m.base).length===35, 'Faltan las 35 animaciones adicionales.');
check(movements.filter(m=>m.category==='Entrenamiento').every(m=>m.trainingLoad?.tension&&m.trainingLoad?.recruitment), 'Falta explicación de tensión o reclutamiento en un ejercicio.');
check(movements.some(m=>m.id==='hiphinge')&&movements.some(m=>m.id==='squat'), 'Faltan los dos gestos funcionales en apoyo.');
check(Object.keys(planes).length === 3, 'No hay tres planos.');
check(structures.length === 118, 'El catálogo de estructuras cambió de tamaño.');
check(Object.keys(sources).length===75, 'El catálogo de fuentes cambió de tamaño.');
check(Object.keys(meshManifest).length === 610, 'El GLB no tiene las 610 mallas seleccionadas.');
check(Object.values(meshManifest).filter(mesh=>mesh.layer==='bones').length === 206, 'Faltan mallas óseas.');
check(Object.values(meshManifest).filter(mesh=>mesh.layer==='muscles').length === 404, 'Faltan 404 mallas musculares.');
check(Object.values(meshManifest).filter(mesh=>mesh.structure==='deltoid').length===6, 'Faltan las seis porciones del deltoides.');
check(Object.values(meshManifest).filter(mesh=>mesh.structure==='deltoid').every(mesh=>mesh.segment==='static'), 'El origen del deltoides debe permanecer en el tronco.');
check(Object.keys(jointExplorer).length === 9, 'Falta una articulación del modo libre.');
for(const joint of Object.keys(jointExplorer))check(leverStudy[joint]?.pivot&&leverStudy[joint]?.effort&&leverStudy[joint]?.load&&leverStudy[joint]?.moment, `Falta la biomecánica de palancas para ${joint}.`);
check(Array.isArray(anatomicalJoints.neck), 'Falta el pivote cervical.');
check(Object.values(meshManifest).some(mesh=>mesh.segment==='head'), 'Faltan las mallas móviles de la cabeza.');
for(const segment of ['forearm','forearmL'])check(Object.values(meshManifest).some(mesh=>mesh.segment===segment), `Faltan mallas móviles en ${segment}.`);
for (const side of ['','L']) for(const joint of ['shoulder','elbow','wrist','hip','knee','ankle']){
  const key=joint+side;
  check(Array.isArray(anatomicalJoints[key])&&anatomicalJoints[key].length===3, `Falta el pivote ${key}.`);
  check(Object.values(meshManifest).some(mesh=>mesh.segment===key), `Faltan mallas móviles en ${key}.`);
}
for(const [key,joint] of Object.entries(jointExplorer)){
  check(structureIds.has(joint.structure), `Falta ficha articular de ${key}.`);
  check(joint.type&&joint.bones&&joint.actions.length>0, `Ficha articular incompleta: ${key}.`);
  for(const source of joint.sources)check(sources[source], `Fuente inexistente ${source}.`);
  for(const action of joint.actions){
    check(action.min<=0&&action.max>0, `Control de ángulo inválido en ${key}/${action.id}.`);
    check(planes[action.plane], `Plano inexistente en ${key}/${action.id}.`);
  }
}
for (const muscle of ['pectoralisminor','neckmuscles','levatorscapulae','hiprotators','teresmajor','coracobrachialis','pronators','wristflexors','wristextensors','adductors','lowerlegmuscles','popliteus','footmuscles','scalenes','subclavius','serratusposterior','anconeus','supinator','thumbtendons','handintrinsics','iliocostalis','longissimus','semispinalis','spinalis','intertransversarii','externalintercostals','internalintercostals','innermostintercostals']) {
  check(Object.values(meshManifest).some(mesh=>mesh.structure===muscle), `Falta malla para ${muscle}.`);
}
check(fs.statSync('./dist/assets/bodyparts.glb').size > 1000000, 'Falta el archivo GLB anatómico.');
for (const movement of movements) {
  check(planes[movement.plane], `Plano inexistente en ${movement.id}.`);
  check(biomechanics[movement.id], `Falta biomecánica en ${movement.id}.`);
  check(structureIds.has(movement.highlight), `Estructura destacada inexistente en ${movement.id}.`);
  for (const source of movement.sources) check(sources[source], `Fuente inexistente ${source}.`);
  if(movement.base)check(movement.pose||movement.grounded, `Animación adicional sin postura: ${movement.id}.`);
}
for (const structure of structures) {
  for (const source of structure.sources) check(sources[source], `Fuente inexistente ${source}.`);
}
check(standalone.includes('<style>') && standalone.includes('<script>'), 'HTML autónomo sin estilos o código integrado.');
check(standalone.includes('data:model/gltf-binary;base64,'), 'HTML autónomo sin mallas GLB integradas.');
for(const id of ['quick-slider','explode-slider','separation-plane','separate-selected','fullscreen-explode-slider','fullscreen-explode-value','fullscreen-separation-plane','fullscreen-separate-selected','fullscreen-reset-separation','muscle-opacity','isolate-structure','range-min','range-max','lever-diagram','lever-moment','body-region-select','body-part-select','part-substructure-select','part-motion-status','structure-metrics','structure-region','structure-region-summary','structure-list-status','source-search','source-count','source-list','motion-phase','motion-biomechanics','movement-category','learning-lens','focus-selection','zoom-in','zoom-out','zoom-level','nav-pad','nav-stick','fullscreen-view','theme-toggle','load-focus','load-primary','load-support','load-bones','load-stage','load-tension','load-recruitment'])check(ids.has(id), `Falta el control ${id}.`);
check(app.includes('function muscleSpreadDirections(')&&app.includes("$('fullscreen-explode-slider').addEventListener('input'"), 'Falta la separación muscular multidireccional o su control en pantalla completa.');
const layerUpdateSource=app.slice(app.indexOf('function updateLayers()'),app.indexOf('function createPlaneGuides()'));
check(/const separationMode=\$\('separation-plane'\)\.value/.test(layerUpdateSource), 'updateLayers debe leer el plano de separación dentro de su propio alcance.');
check(app.includes('function updateMuscleDeformation()')&&app.includes('muscleAnchors(info)'), 'Falta el acoplamiento de mallas musculares al movimiento.');
check(app.includes('function groundedPose(')&&app.includes('function musclePaletteIndex('), 'Faltan la coordinación de los gestos o el contraste muscular.');
check(app.includes("info.structure==='mandible'?'jaw':info.segment"), 'La mandíbula no está vinculada al pivote temporomandibular.');
check(!standalone.includes('src="./app.bundle.js"') && !standalone.includes('href="./styles.css"'), 'HTML autónomo con archivos externos locales.');
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log(`Validado: ${movements.length} movimientos, ${Object.keys(planes).length} planos, ${structures.length} fichas, ${Object.keys(meshManifest).length} mallas y HTML autónomo.`);
}
