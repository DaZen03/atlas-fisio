import fs from 'node:fs';
import vm from 'node:vm';
import { movements, biomechanics, structures, sources, planes, jointExplorer, leverStudy, externalMomentArm, machineMechanics, quizCategories, quizQuestions } from './dist/data.js';
import meshManifest from './dist/assets/bodyparts-manifest.json' with { type: 'json' };
import anatomicalJoints from './dist/assets/bodyparts-joints.json' with { type: 'json' };

const html = fs.readFileSync('./dist/index.html', 'utf8');
const app = fs.readFileSync('./dist/app.js', 'utf8');
const standalone = fs.readFileSync('../../outputs/atlas-movimiento-3d.html', 'utf8');
const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const referencedIds = [...app.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]);
const structureIds = new Set(structures.map(structure => structure.id));
const movementIds = new Set(movements.map(movement => movement.id));
const failures = [];
const check = (condition, message) => { if (!condition) failures.push(message); };
check(html.includes('data-atlas-view="inicio"')&&html.includes('href="./vistas/formatos.html"'), 'La portada debe actuar como menú y enlazar las zonas separadas.');
check(!/<html[^>]*data-atlas-view="inicio"/.test(standalone), 'El HTML autónomo debe conservar el atlas completo al abrirse sin rutas adicionales.');

check(ids.size === [...html.matchAll(/\bid="([^"]+)"/g)].length, 'Hay identificadores HTML duplicados.');
for (const id of referencedIds) check(ids.has(id), `Falta el elemento HTML ${id}.`);
check(movements.length === 46, 'No hay 46 movimientos.');
check(movements.filter(m=>m.base).length===35, 'Faltan las 35 animaciones adicionales.');
check(movements.filter(m=>m.category==='Entrenamiento').every(m=>m.trainingLoad?.tension&&m.trainingLoad?.recruitment), 'Falta explicación de tensión o reclutamiento en un ejercicio.');
check(movements.some(m=>m.id==='hiphinge')&&movements.some(m=>m.id==='squat'), 'Faltan los dos gestos funcionales en apoyo.');
check(Object.keys(planes).length === 3, 'No hay tres planos.');
check(structures.length === 118, 'El catálogo de estructuras cambió de tamaño.');
const muscleRecords=structures.filter(s=>s.type.startsWith('MÚSC'));
check(muscleRecords.length===68, 'El catálogo muscular debe contener 68 fichas auditables.');
for(const muscle of muscleRecords){check(muscle.text&&muscle.fact, `Falta descripción funcional o detalle en ${muscle.id}.`);check(muscle.sources.some(id=>sources[id]&&id!=='bodyparts'), `Falta una fuente anatómica distinta de la malla para ${muscle.id}.`);}
check(muscleRecords.find(s=>s.id==='hamstrings').text.includes('no la extiende'), 'La ficha de isquiotibiales debe aclarar que la cabeza corta no cruza ni extiende la cadera.');
check(!muscleRecords.find(s=>s.id==='scalenes').fact.includes('giro inicial hacia ese mismo lado'), 'La ficha de escalenos no debe fijar sin matiz una dirección de rotación cervical discutida.');
check(muscleRecords.find(s=>s.id==='deepback').text.includes('rotadores breves suelen abarcar un nivel y los largos, dos'), 'La ficha de músculos vertebrales profundos debe distinguir rotadores breves y largos.');
check(muscleRecords.find(s=>s.id==='handintrinsics').fact.includes('dedo medio'), 'La acción de los interóseos debe señalar el dedo medio como referencia para abducción y aducción.');
check(muscleRecords.find(s=>s.id==='pelvicfloor').text.includes('diafragma pélvico')&&!muscleRecords.find(s=>s.id==='pelvicfloor').text.includes('capas profundas'), 'El suelo pélvico debe describirse como complejo, no como capas musculares homogéneas.');
check(muscleRecords.find(s=>s.id==='larynxmuscles').sources.includes('larynxanatomy')&&muscleRecords.find(s=>s.id==='eyemuscles').sources.includes('eyeanatomy'), 'Las fichas laríngea y ocular deben enlazar fuentes anatómicas específicas.');
check(Object.keys(sources).length===89, 'Faltan las referencias anatómicas específicas y de biomecánica.');
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
check(standalone.includes('id="cuestionarios"')&&standalone.includes('class="study-route"')&&standalone.includes('id="ruta-aprendizaje"')&&standalone.includes('id="biomecanica"'), 'Falta una sección de aprendizaje, biomecánica o tests en el HTML autónomo.');
check(standalone.includes('term-reading-key')&&standalone.includes('levantar la punta del pie'), 'El HTML autónomo no contiene las equivalencias en palabras comunes.');
for(const id of ['ruta-aprendizaje','learning-path-title'])check(ids.has(id), `Falta la ruta progresiva ${id}.`);
for(const id of ['biomecanica','biomechanics-title','quiz-model-context'])check(ids.has(id), `Falta la sección conectada al modelo ${id}.`);
check(html.includes('./vistas/aprender.html')&&html.includes('./analisis.html')&&html.includes('./biomecanica/index.html')&&html.includes('./vistas/fuentes.html'), 'Faltan accesos a análisis, biomecánica o aprendizaje.');
const studyGuides=['aprendizaje','movimientos','modelo-3d','estructuras','biomecanica','cuestionarios','verificacion','fuentes','fidelidad'];
for(const guide of studyGuides){const guidePath=`./dist/guias/${guide}.html`;check(fs.existsSync(guidePath),`Falta la página de guía ${guide}.`);if(fs.existsSync(guidePath)){const page=fs.readFileSync(guidePath,'utf8');check(page.includes('guide-pages.css')&&page.includes('Al finalizar esta guía podrás')&&page.includes('PONLO A PRUEBA'),`La guía ${guide} no tiene estructura didáctica completa.`);check(page.includes('aria-label="Secciones principales"')&&page.includes('../index.html'),`La guía ${guide} perdió su navegación de retorno.`);for(const [,href] of page.matchAll(/href="([^"]+)"/g)){if(href.startsWith('http://')||href.startsWith('https://'))continue;if(href.startsWith('../index.html#'))check(ids.has(href.split('#')[1]),`La guía ${guide} apunta a una sección inexistente: ${href}.`);else if(href.endsWith('.html')){const target=href.startsWith('../')?`./dist/${href.slice(3)}`:`./dist/guias/${href}`;check(fs.existsSync(target),`La guía ${guide} apunta a una página inexistente: ${href}.`)}}check(fs.existsSync('./dist/guide-pages.css'),`Falta la hoja de estilos de las guías.`)}}
check(html.includes('./vistas/aprender.html')&&html.includes('./vistas/fuentes.html'),'La portada no enlaza con aprendizaje y fuentes.');
check(html.includes('term-reading-key'), 'Falta la guía que explica las equivalencias en lenguaje común.');
const analysisHtml=fs.readFileSync('./dist/analisis.html','utf8');
const analysisJs=fs.readFileSync('./dist/analysis.js','utf8');
const poseWorker=fs.readFileSync('./dist/pose-worker.js','utf8');
for(const file of ['./dist/analysis.css','./dist/analysis.js','./dist/pose-worker.js','./dist/MEDIAPIPE-NOTICES.md'])check(fs.existsSync(file),`Falta el recurso del analizador ${file}.`);
for(const id of ['movement-choice','joint-choice','side-choice','video-file','metrics-consent','start-analysis','stop-analysis','source-video','pose-overlay','analysis-progress','angle-chart','download-csv','atlas-case-link'])check(analysisHtml.includes(`id="${id}"`),`Falta el control del análisis ${id}.`);
check(analysisHtml.includes('MediaPipe puede enviar métricas técnicas')&&analysisHtml.includes('no envía el vídeo ni sus fotogramas'), 'Falta el aviso claro sobre vídeo local y métricas de uso.');
check(analysisHtml.includes('type="module" src="./analysis.js"')&&analysisJs.includes("new Worker('./pose-worker.js',{type:'module'})"), 'El analizador no carga su JavaScript y worker locales.');
check(analysisJs.includes('createImageBitmap(video)')&&analysisJs.includes('detector')&&analysisJs.includes('worldLandmarks')&&analysisJs.includes('function pointAngle'), 'Falta el análisis de fotogramas y ángulos 3D estimados.');
check(analysisJs.includes('let analysisRunning = false')&&analysisJs.includes('!analysisRunning')&&analysisJs.includes('analysisRunning=true'), 'El control de análisis debe habilitarse cuando el detector queda listo y bloquearse mientras procesa.');
check(analysisJs.includes('lastInferenceTimestamp+1')&&analysisJs.includes('duration-.04'), 'Los reanálisis deben mantener marcas de tiempo crecientes y evitar el último fotograma exacto.');
check(analysisJs.includes('function downloadCsv()')&&analysisJs.includes('text/csv'), 'Falta la exportación CSV local.');
check(poseWorker.includes("const VERSION = '1.1.1'")&&/runningMode:\s*'VIDEO'/.test(poseWorker)&&poseWorker.includes('detectForVideo'), 'El worker debe fijar la versión de MediaPipe y ejecutar Pose Landmarker en modo vídeo.');
check(poseWorker.includes('pose_landmarker_lite/float16/1/pose_landmarker_lite.task'), 'Falta la ruta del modelo Lite de Pose Landmarker.');
check(analysisJs.includes("route:'./biomecanica/bisagra.html'")&&analysisJs.includes("route:'./biomecanica/sentadilla.html'")&&analysisJs.includes("route:'./biomecanica/press-pecho.html'"), 'El análisis no deriva a los casos biomecánicos relacionados.');
check(app.includes('new URLSearchParams(location.search)')&&app.includes('startMovement'), 'El atlas no selecciona el movimiento recibido por URL.');
const biomechDir='./dist/biomecanica';
const biomechPages=['index','curl','bisagra','press-pecho','extension-rodilla','sentadilla'];
for(const slug of biomechPages)check(fs.existsSync(`${biomechDir}/${slug}.html`),`Falta la página biomecánica ${slug}.`);
for(const slug of biomechPages.slice(1)){
  const page=fs.readFileSync(`${biomechDir}/${slug}.html`,'utf8');
  const iframe=page.match(/<iframe[^>]+src="([^"]+)"/);
  check(page.includes('biomechanics-pages.css')&&page.includes('Explicación biomecánica')&&page.includes('Mostrar una respuesta orientativa'),`El caso ${slug} necesita explicación y pregunta de recuperación.`);
  check(iframe&&iframe[1].startsWith('../index.html?movimiento='),`El caso ${slug} no integra el atlas 3D con movimiento preseleccionado.`);
  if(iframe){const url=new URL(iframe[1],'https://atlas.test/biomecanica/');const movement=url.searchParams.get('movimiento'),machine=url.searchParams.get('maquina');check(movementIds.has(movement),`El caso ${slug} apunta a un movimiento inexistente: ${movement}.`);check(machineMechanics.some(item=>item.id===machine),`El caso ${slug} apunta a un mecanismo inexistente: ${machine}.`)}
  for(const [,href] of page.matchAll(/href="([^"]+)"/g)){if(href.startsWith('http://')||href.startsWith('https://'))continue;if(href.startsWith('#'))continue;if(href.startsWith('../index.html#')){check(ids.has(href.split('#')[1]),`El caso ${slug} apunta a una sección inexistente: ${href}.`);continue}if(href.endsWith('.html')){const target=href.startsWith('../')?`./dist/${href.slice(3)}`:`${biomechDir}/${href}`;check(fs.existsSync(target),`El caso ${slug} apunta a una página inexistente: ${href}.`)}}
}
check(fs.readFileSync('./dist/biomechanics-pages.css','utf8').includes('@media'), 'Las páginas biomecánicas necesitan estilos responsivos.');
for(const view of ['aprender','explorar','animaciones','articulaciones','estructuras','practicar','verificacion','formatos','fuentes']){
  const page=fs.readFileSync(`./dist/vistas/${view}.html`,'utf8');
  check(page.includes(`data-atlas-view="${view}"`)&&page.includes('<base href="../">')&&!page.includes('<iframe'),`La página ${view} no tiene HTML propio y una vista aislada.`);
}
check(html.includes("dataset.atlasView=atlasView")&&fs.readFileSync('./dist/styles.css','utf8').includes('data-atlas-view="practicar"'), 'El atlas no oculta las otras secciones al abrir una vista dedicada.');
for(const phrase of ['Define la meta','Observa en 3D','Aplica la idea','Comprueba y repasa','learning-sequence','quiz-study-cue','openstax.org/books/anatomy-and-physiology-2e/pages/1-introduction','khanacademy.org/khan-for-educators'])check(html.includes(phrase), `Falta una etapa o referencia de la guía didáctica: ${phrase}.`);
check(app.includes('const commonTermGlossary=')&&app.includes('function withCommonTerms(')&&app.includes('class="common-term"'), 'Falta el glosario contextual de términos científicos y comunes.');
check(ids.has('selected-structure-info')&&ids.has('touch-selection-function'), 'Falta la ficha contextual de función anatómica para escritorio o móvil.');
check(app.includes('Función y fijaciones')&&app.includes('Detalle anatómico')&&app.includes('Relación con el movimiento')&&app.includes('selected-info-sources'), 'La selección debe mostrar función, detalles, vínculo articular y fuentes.');
check(app.includes("$('touch-selection-function').textContent")&&app.includes("selectStructure(jointExplorer[freeJoint].structure,{side,meshName:name})"), 'La selección táctil debe anunciar su función e incluir las articulaciones.');
check(app.includes("withCommonTerms(question.explanation")&&app.includes("withCommonTerms(joint.type")&&app.includes("withCommonTerms(item.mechanism"), 'Las equivalencias deben mostrarse en tests, articulaciones y biomecánica de máquinas.');
check(fs.readFileSync('./dist/styles.css','utf8').includes('.scientific-common-pair'), 'Falta el estilo legible para las equivalencias terminológicas.');
const glossaryStart=app.indexOf('const commonTermGlossary='),glossaryEnd=app.indexOf('\nlet activeMovement',glossaryStart),glossaryContext={};
if(glossaryStart>=0&&glossaryEnd>glossaryStart){
  vm.runInNewContext(`${app.slice(glossaryStart,glossaryEnd)}\nglobalThis.withCommonTerms=withCommonTerms;`,glossaryContext);
  const annotated=glossaryContext.withCommonTerms('Dorsiflexión y plano sagital; el tibial anterior levanta el pie.',5);
  check(annotated.includes('Dorsiflexión</span><span class="common-term">(levantar la punta del pie)'), 'No se muestra la equivalencia común del movimiento.');
  check(annotated.includes('plano sagital')&&annotated.includes('vista que divide derecha e izquierda'), 'No se muestra la equivalencia común del plano anatómico.');
  check(glossaryContext.withCommonTerms('<script>alert(1)</script>').includes('&lt;script&gt;'), 'El glosario debe escapar texto insertado como HTML.');
}else check(false,'No se puede probar el glosario de términos.');
for(const match of html.matchAll(/data-model-movement="([^"]+)"/g))check(movementIds.has(match[1]), `Acción de sección con movimiento inexistente: ${match[1]}.`);
for(const level of ['PRINCIPIANTE','FUNDAMENTOS','APLICACIÓN','AVANZADO'])check(html.includes(level), `Falta el nivel de aprendizaje ${level}.`);
check(html.includes('insertion-guide')&&html.includes('brazo de momento interno')&&html.includes('línea de tracción'), 'Falta la explicación funcional de las inserciones y el brazo interno.');
for(const id of ['quick-slider','explode-slider','separation-plane','separate-selected','fullscreen-explode-slider','fullscreen-explode-value','fullscreen-separation-plane','fullscreen-separate-selected','fullscreen-reset-separation','muscle-opacity','isolate-structure','range-min','range-max','lever-diagram','lever-moment','moment-segment','moment-side','moment-follow','moment-angle','moment-length','moment-force','moment-point','moment-diagram','moment-distance-result','moment-torque-result','moment-length-impact','body-region-select','body-part-select','part-substructure-select','part-motion-status','structure-metrics','structure-region','structure-region-summary','structure-list-status','source-search','source-count','source-list','motion-phase','motion-biomechanics','movement-category','learning-lens','focus-selection','zoom-in','zoom-out','zoom-level','nav-pad','nav-stick','fullscreen-view','theme-toggle','load-focus','load-primary','load-support','load-bones','load-stage','load-tension','load-recruitment'])check(ids.has(id), `Falta el control ${id}.`);
check(sources.elbowmomentarms&&sources.shouldermomentarms, 'Faltan estudios sobre brazos de momento que varían con el ángulo.');
check(Math.abs(externalMomentArm(30,50,90).torqueNm-15)<1e-9, 'El simulador debe aplicar τ = F × d⊥.');
check(machineMechanics.length===4&&new Set(machineMechanics.map(machine=>machine.id)).size===4, 'Faltan los cuatro mecanismos de máquina o hay claves duplicadas.');
for(const machine of machineMechanics){check(machine.title&&machine.formula&&machine.diagram&&machine.mechanism&&machine.watch, `Ficha incompleta de mecanismo: ${machine.id}.`);for(const source of machine.sources)check(sources[source], `Fuente inexistente ${source} en ${machine.id}.`)}
for(const id of ['machine-lab-title','machine-title','machine-example','machine-diagram','machine-formula','machine-mechanism','machine-watch','machine-sources'])check(ids.has(id), `Falta contenido de mecanismos ${id}.`);
check(app.includes('function renderMachineStudy(')&&app.includes("[data-machine-type]"), 'Falta el selector interactivo de mecanismos de máquinas.');
check(quizCategories.length===5&&new Set(quizCategories.map(category=>category.id)).size===5, 'Faltan áreas de cuestionario o hay claves duplicadas.');
check(quizQuestions.length>=20&&new Set(quizQuestions.map(question=>question.id)).size===quizQuestions.length, 'El banco necesita preguntas suficientes y claves únicas.');
for(const category of quizCategories)check(quizQuestions.some(question=>question.area===category.id), `No hay preguntas para ${category.label}.`);
for(const question of quizQuestions){check(question.options.length>=3&&question.answer>=0&&question.answer<question.options.length, `Respuestas inválidas en ${question.id}.`);for(const source of question.sources)check(sources[source], `Fuente inexistente ${source} en pregunta ${question.id}.`)}
for(const id of ['quiz-heading','quiz-categories','quiz-topic-label','quiz-score','quiz-round-title','quiz-progress','quiz-progress-fill','quiz-status','quiz-question','quiz-answers','quiz-feedback','quiz-feedback-result','quiz-explanation','quiz-question-sources','quiz-next','quiz-model-context'])check(ids.has(id), `Falta contenido del cuestionario ${id}.`);
check(app.includes('function shuffleItems(')&&app.includes('function startQuiz(')&&app.includes('function answerQuiz(')&&app.includes('function prepareQuizModelForCurrentQuestion('), 'Falta la selección aleatoria, el flujo de respuesta o la conexión entre test y modelo.');
for(const question of quizQuestions)check(app.includes(`'${question.id}':{movement:`), `La pregunta ${question.id} no tiene una región y movimiento asociados.`);
for(const [,context] of [...app.matchAll(/'([^']+)':\{movement:'([^']+)'(?:,machine:'([^']+)')?\}/g)].map(match=>[match[1],{movement:match[2],machine:match[3]}]))check(movementIds.has(context.movement), `El mapa del test apunta a un movimiento inexistente: ${context.movement}.`);
check(app.includes('function muscleSpreadDirections(')&&app.includes("$('fullscreen-explode-slider').addEventListener('input'"), 'Falta la separación muscular multidireccional o su control en pantalla completa.');
const layerUpdateSource=app.slice(app.indexOf('function updateLayers()'),app.indexOf('function createPlaneGuides()'));
check(/const separationMode=\$\('separation-plane'\)\.value/.test(layerUpdateSource), 'updateLayers debe leer el plano de separación dentro de su propio alcance.');
check(layerUpdateSource.includes('const regionBoneContext=')&&layerUpdateSource.includes('expandRegion&&regionStructures.has')&&layerUpdateSource.includes('selectedIsMuscle?regionBones.has'), 'El aislamiento debe conservar músculos de la región y huesos de referencia para huesos, articulaciones y músculos seleccionados.');
check(app.includes('externalMomentArm(referenceLength,force,angle,application)')&&app.includes('moment-length-impact'), 'El explorador debe comparar el efecto de longitud con una referencia manteniendo constantes fuerza, ángulo y aplicación.');
check(app.includes('function focusJoint(')&&app.includes('requestAnimationFrame(()=>focusJoint(freeJoint,freeSide))')&&app.includes('Enfocar zona y explorar'), 'El mapa articular debe centrar la articulación en el visor al abrir su exploración.');
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
