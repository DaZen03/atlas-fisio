import * as THREE from 'three';
import { GLTFLoader } from '../node_modules/three/examples/jsm/loaders/GLTFLoader.js';
import {movements, biomechanics, structures, sources, planes, jointExplorer, leverStudy} from './data.js';
import meshManifest from './assets/bodyparts-manifest.json';
import anatomicalJoints from './assets/bodyparts-joints.json';

const $ = id => document.getElementById(id);
const savedTheme=(()=>{try{return localStorage.getItem('atlas-theme')}catch{return null}})();
document.documentElement.dataset.theme=savedTheme||(matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');
function syncThemeButton(){const dark=document.documentElement.dataset.theme==='dark';$('theme-toggle').setAttribute('aria-pressed',String(dark));$('theme-toggle').setAttribute('aria-label',dark?'Activar modo claro':'Activar modo oscuro');$('theme-toggle').innerHTML=dark?'☀ <span>Modo claro</span>':'☾ <span>Modo oscuro</span>'}
$('theme-toggle').addEventListener('click',()=>{document.documentElement.dataset.theme=document.documentElement.dataset.theme==='dark'?'light':'dark';try{localStorage.setItem('atlas-theme',document.documentElement.dataset.theme)}catch{}syncThemeButton()});
syncThemeButton();
const makeLink = id => `<a href="${sources[id].url}" target="_blank" rel="noopener noreferrer">${sources[id].label} ↗</a>`;
let activeMovement = 0;
let activePlaneFilter = 'todos';
let activeCategoryFilter = 'todos';
let activeLearningLens = 'todos';
let activeStructure = 'deltoid';
let selectedMeshName='';
let selectedStructureSide = 'R';
let structureFilter = 'Todas';
let browseRegion='all';
let progress = 0;
let playing = false;
let poseDirection = 1;
let lastTime = 0;
let anatomicalModelLoaded = false;
let poseMode='guided';
let freeSide='R',freeJoint='shoulder',freeAction='flex';
let freeRegion='rightArm';
let catalogSection='all';
const catalogSections={all:'Todo el cuerpo',head:'Cabeza y cuello',trunk:'Columna y tórax',arm:'Hombro y brazo',hand:'Antebrazo y mano',pelvis:'Pelvis y cadera',leg:'Muslo y rodilla',foot:'Pierna y pie'};
const regions={head:{label:'Cabeza y cuello',side:'C',joints:['neck','tmj']},rightArm:{label:'Brazo derecho',side:'R',joints:['shoulder','elbow','radioulnar','wrist']},leftArm:{label:'Brazo izquierdo',side:'L',joints:['shoulder','elbow','radioulnar','wrist']},rightLeg:{label:'Pierna derecha',side:'R',joints:['hip','knee','ankle']},leftLeg:{label:'Pierna izquierda',side:'L',joints:['hip','knee','ankle']}};
const freeAngles=Object.fromEntries(['R','L','C'].map(side=>[side,Object.fromEntries(Object.entries(jointExplorer).map(([key,joint])=>[key,Object.fromEntries(joint.actions.map(action=>[action.id,0]))]))]));
const freeRanges=Object.fromEntries(['R','L','C'].map(side=>[side,Object.fromEntries(Object.entries(jointExplorer).map(([key,joint])=>[key,Object.fromEntries(joint.actions.map(action=>[action.id,{min:action.min,max:action.max}]))]))]));
const movementJoint={shoulder:'shoulder',shoulderflex:'shoulder',elbow:'elbow',hipflex:'hip',hipabd:'hip',hiprot:'hip',hiphinge:'hip',squat:'knee',knee:'knee',ankle:'ankle',plantar:'ankle'};
for(const movement of movements)if(movement.base)movementJoint[movement.id]=movement.jointKey||movementJoint[movement.base];
const meshCoverage = new Set(Object.values(meshManifest).map(item=>item.structure));
const relatedMeshes={spine:['cervical','thoracic','lumbar','sacrum'],radiusulna:['radius','ulna'],tibiafibula:['tibia','fibula'],foot:['talus','calcaneus','navicular','cuboid','cuneiforms','metatarsals','toephalanges'],neckjoint:['skull','cervical'],radioulnarjoint:['radius','ulna'],shoulderjoint:['humerus','scapula'],elbowjoint:['humerus','radius','ulna'],wristjoint:['radius','carpals'],hipjoint:['pelvis','femur'],kneejoint:['femur','tibia','patella'],anklejoint:['tibia','fibula','talus']};
const partMotion={
  skull:'neck',neckjoint:'neck',neckmuscles:'neck',scalenes:'neck',deepneck:'neck',suprahyoid:'tmj',mandible:'tmj',tmjoint:'tmj',
  humerus:'shoulder',shoulderjoint:'shoulder',deltoid:'shoulder',pectoralis:'shoulder',latissimus:'shoulder',supraspinatus:'shoulder',infraspinatus:'shoulder',subscapularis:'shoulder',teresminor:'shoulder',teresmajor:'shoulder',coracobrachialis:'shoulder',
  ulna:'elbow',elbowjoint:'elbow',biceps:'elbow',triceps:'elbow',brachialis:'elbow',brachioradialis:'elbow',anconeus:'elbow',
  radius:'radioulnar',radiusulna:'radioulnar',radioulnarjoint:'radioulnar',pronators:'radioulnar',supinator:'radioulnar',
  carpals:'wrist',metacarpals:'wrist',handphalanges:'wrist',wristjoint:'wrist',forearmflexors:'wrist',forearmextensors:'wrist',wristflexors:'wrist',wristextensors:'wrist',thumbtendons:'wrist',
  femur:'hip',hipjoint:'hip',gluteus:'hip',gluteusmaximus:'hip',gluteusminimus:'hip',iliopsoas:'hip',hiprotators:'hip',tensorfasciae:'hip',adductorlongus:'hip',adductors:'hip',sartorius:'hip',
  patella:'knee',tibia:'knee',fibula:'knee',tibiafibula:'knee',kneejoint:'knee',quadriceps:'knee',hamstrings:'knee',popliteus:'knee',
  foot:'ankle',talus:'ankle',calcaneus:'ankle',navicular:'ankle',sesamoids:'ankle',cuboid:'ankle',cuneiforms:'ankle',metatarsals:'ankle',toephalanges:'ankle',anklejoint:'ankle',tibialis:'ankle',gastrocnemius:'ankle',soleus:'ankle',lowerlegmuscles:'ankle'
};
const directMover=new Set(['skull','mandible','humerus','ulna','radius','carpals','metacarpals','handphalanges','femur','tibia','fibula','tibiafibula','foot','talus','calcaneus','navicular','sesamoids','cuboid','cuneiforms','metatarsals','toephalanges']);
const hasAnatomicalMesh=id=>meshCoverage.has(id)||(relatedMeshes[id]||[]).some(part=>meshCoverage.has(part));
const regionFor=(joint,side)=>['neck','tmj'].includes(joint)?'head':`${side==='L'?'left':'right'}${['hip','knee','ankle'].includes(joint)?'Leg':'Arm'}`;
function sectionForStructure(s){
  if(['skull','mandible','tmjoint','neckjoint','neckmuscles','scalenes','deepneck','suprahyoid','eyemuscles','pharynxmuscles','larynxmuscles','tonguemuscles','foramenmagnum','transverseforamen','cervical'].includes(s.id))return 'head';
  if(['spine','thoracic','lumbar','sacrum','sternum','ribs','rectusabdominis','externaloblique','erectorspinae','serratusposterior','deepback','thoracicdeep','diaphragm'].includes(s.id))return 'trunk';
  if(['pelvis','ilium','ischium','pubis','foramenobturator','sacralforamina','sacroiliac','hipjoint','gluteus','gluteusmaximus','gluteusminimus','iliopsoas','hiprotators','pelvicfloor'].includes(s.id))return 'pelvis';
  if(['handphalanges','metacarpals','carpals','ulna','brachioradialis','handintrinsics','thumbtendons'].includes(s.id))return 'hand';
  if(['foot','toephalanges','metatarsals','talus','calcaneus','navicular','sesamoids','cuboid','cuneiforms','footmuscles'].includes(s.id))return 'foot';
  if(['clavicle','scapula','trapezius','serratus','pectoralisminor','subclavius','levatorscapulae','rhomboids'].includes(s.id))return 'arm';
  if(['femur','sartorius','adductorlongus','adductors'].includes(s.id))return 'leg';
  const joint=partMotion[s.id];
  if(['neck','tmj'].includes(joint))return 'head';
  if(['radioulnar','wrist'].includes(joint))return 'hand';
  if(['shoulder','elbow'].includes(joint))return 'arm';
  if(joint==='hip')return 'pelvis';
  if(joint==='knee')return 'leg';
  if(joint==='ankle')return 'foot';
  return 'trunk';
}

function renderPlaneTabs(){
  $('plane-tabs').innerHTML=[['todos','Todos'],['sagital','Sagital'],['frontal','Frontal'],['transversal','Transversal']].map(([id,label])=>`<button type="button" data-plane="${id}" class="${activePlaneFilter===id?'active':''}" aria-pressed="${activePlaneFilter===id}">${label}</button>`).join('');
  document.querySelectorAll('[data-plane]').forEach(btn=>btn.addEventListener('click',()=>{activePlaneFilter=btn.dataset.plane;const first=movements.findIndex(matchesMovementFilter);if(first>=0)selectMovement(first);else{renderPlaneTabs();renderMovementList()}}));
}
function matchesMovementFilter(m){return (activePlaneFilter==='todos'||m.plane===activePlaneFilter)&&(activeCategoryFilter==='todos'||(m.category||'Fundamentos')===activeCategoryFilter)}
function renderMovementList(){
  $('movement-list').innerHTML = movements.map((m,i)=>({m,i})).filter(({m})=>matchesMovementFilter(m)).map(({m,i})=>`<button type="button" class="movement ${i===activeMovement?'active':''}" data-motion="${i}" aria-pressed="${i===activeMovement}"><span class="movement-num">${String(i+1).padStart(2,'0')}</span><span class="movement-name">${m.short}</span><span class="movement-arrow">↗</span></button>`).join('')||'<p class="structure-empty">No hay gestos en esta combinación de sección y plano.</p>';
  document.querySelectorAll('[data-motion]').forEach(btn=>btn.addEventListener('click',()=>selectMovement(Number(btn.dataset.motion))));
}
function renderDetail(){
  if(poseMode==='free'){renderFreeDetail();return}
  $('guided-detail').hidden=false;$('free-detail').hidden=true;$('learning-panel').hidden=false;
  const m=movements[activeMovement];
  $('detail-index').textContent=`MOVIMIENTO ${String(activeMovement+1).padStart(2,'0')} DE ${String(movements.length).padStart(2,'0')}`;
  $('detail-title').textContent=m.name;
  $('detail-summary').textContent=m.summary;
  $('detail-joint').textContent=m.joint;
  $('detail-joint-type').textContent=`Tipo: ${m.jointType||jointExplorer[movementJoint[m.id]].type}.`;
  const plane=planes[m.plane];
  $('detail-plane-name').textContent=plane.name;
  $('detail-plane-division').textContent=plane.division;
  $('detail-plane-use').textContent=plane.use;
  $('plane-badge').textContent=`${plane.name.toUpperCase()} · ${m.plane==='sagital'?'EJE MEDIOLATERAL':m.plane==='frontal'?'EJE ANTEROPOSTERIOR':'EJE VERTICAL'}`;
  $('plane-badge').style.borderColor=plane.color;
  const b=biomechanics[m.id];
  $('detail-axis').innerHTML=`<strong>Plano y eje.</strong> ${b.axis}`;
  $('detail-synergy').innerHTML=`<strong>Sinergia.</strong> ${b.synergy}`;
  $('detail-control').innerHTML=`<strong>Control del gesto.</strong> ${b.control}`;
  $('detail-muscle').textContent=m.muscle;
  $('detail-origin').innerHTML=`<strong>Origen.</strong> ${m.origin}`;
  $('detail-insertion').innerHTML=`<strong>Inserción.</strong> ${m.insertion}`;
  $('detail-observe').textContent=m.observe;
  renderLearningContext(m);
  $('detail-sources').innerHTML=m.sources.map(makeLink).join('');
  $('timeline-name').textContent=m.name;
  renderLeverStudy();
  renderMotionAnalysis();
  renderLoadFocus();
  updateReadout();
}
function smootherStep(t){t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10)}
function guidedFraction(m=movements[activeMovement]){const t=THREE.MathUtils.clamp(progress/100,0,1);return m.base?t:smootherStep(t)}
function renderLoadFocus(){
  $('load-focus').hidden=false;
  const training=poseMode==='guided'?movements[activeMovement].trainingLoad:null;
  $('load-tension').hidden=!training;$('load-recruitment').hidden=!training;
  if(training){$('load-tension').textContent=`Tensión mecánica: ${training.tension}`;$('load-recruitment').textContent=`Unidades motoras: ${training.recruitment}`}
  if(poseMode==='free'){
    const joint=jointExplorer[freeJoint],action=currentFreeAction(),value=freeAngles[freeSide][freeJoint][freeAction];
    $('load-primary').textContent=`Músculos relacionados: ${action.muscles}`;
    $('load-support').textContent=`Gesto: ${freeMotionName(action,value)}. La demanda cambia con la postura, la carga y el apoyo.`;
    $('load-bones').textContent=`Segmentos que transmiten la carga: ${joint.bones}`;
    $('load-stage').textContent=`Ángulo visual: ${Math.abs(value)}°. El visor no mide el esfuerzo de cada músculo.`;
    return;
  }
  const m=movements[activeMovement],joint=jointExplorer[movementJoint[m.id]];
  $('load-primary').textContent=`Músculo destacado: ${m.muscle}`;
  $('load-support').textContent=`Sinergia y estabilización: ${biomechanics[m.id].synergy}`;
  $('load-bones').textContent=`Segmentos que transmiten la carga: ${joint.bones}`;
  $('load-stage').textContent=m.stageLabels?`Fase ${Math.min(3,Math.floor(progress/34)+1)}: ${m.stageLabels[Math.min(2,Math.floor(progress/34))]}. La exigencia real depende de carga, velocidad y técnica.`:progress<15?'Inicio: identifica el eje y la carga antes de moverte.':progress<75?'Recorrido: observa cómo cambia la distancia perpendicular entre la carga y la articulación.':'Tramo final: compara el control muscular y la posición de los segmentos.';
}
function renderLearningContext(m){
  const b=biomechanics[m.id];
  const notes={
    fisioterapia:`Examina la articulación y la coordinación entre segmentos. ${m.observe} El recorrido mostrado es visual y no establece un rango clínico normal.`,
    entrenamiento:`Reconoce los músculos que contribuyen al gesto: ${b.synergy} Si hay carga, su distancia perpendicular al eje modifica el momento externo.`,
    ergonomia:`Relaciona la tarea con el entorno. ${m.summary} Acercar una carga al cuerpo puede reducir su brazo de momento externo; la postura útil depende del contexto.`
  };
  const labels={fisioterapia:'Fisioterapia y rehabilitación',entrenamiento:'Entrenamiento y rendimiento',ergonomia:'Vida diaria y ergonomía'};
  const keys=activeLearningLens==='todos'?Object.keys(labels):[activeLearningLens];
  $('learning-context').innerHTML=keys.map(key=>`<div><strong>${labels[key]}</strong><p>${notes[key]}</p></div>`).join('');
}
function currentFreeAction(){return jointExplorer[freeJoint].actions.find(action=>action.id===freeAction)}
function freeMotionName(action,value){return value>0?action.positive:value<0?action.negative:action.zero||'Posición neutra'}
function renderFreeDetail(){
  const joint=jointExplorer[freeJoint],action=currentFreeAction(),value=freeAngles[freeSide][freeJoint][freeAction];
  $('guided-detail').hidden=true;$('free-detail').hidden=false;$('learning-panel').hidden=true;
  $('detail-index').textContent=`EXPLORACIÓN LIBRE · ${freeSide==='C'?'LÍNEA MEDIA':freeSide==='R'?'LADO DERECHO':'LADO IZQUIERDO'}`;
  $('detail-title').textContent=joint.name;
  $('detail-summary').textContent=`Mueve el segmento distal y observa la articulación en el contexto de toda la extremidad.`;
  $('free-joint-type').textContent=joint.type;
  $('free-bones').textContent=joint.bones;
  $('free-motion-name').textContent=`${freeMotionName(action,value)} · ${Math.abs(value)}°`;
  $('free-plane').textContent=`${planes[action.plane].name}. ${planes[action.plane].division}`;
  $('free-muscles').textContent=action.muscles;
  $('free-context').textContent=joint.context;
  $('free-sources').innerHTML=joint.sources.map(makeLink).join('');
  $('plane-badge').textContent=`${planes[action.plane].name.toUpperCase()} · ${freeMotionName(action,value).toUpperCase()}`;
  $('plane-badge').style.borderColor=planes[action.plane].color;
  renderLeverStudy();
  renderMotionAnalysis();
  renderLoadFocus();
}
function renderMotionAnalysis(){
  const hinge=poseMode==='guided'&&['hiphinge','pickup','deadlift'].includes(movements[activeMovement].id);
  const squat=poseMode==='guided'&&['squat','sitdown','standup','lunge'].includes(movements[activeMovement].id);
  const key=poseMode==='free'?freeJoint:movementJoint[movements[activeMovement].id];
  const action=poseMode==='free'?currentFreeAction():null;
  const angle=poseMode==='free'?freeAngles[freeSide][key][freeAction]:Math.round(movements[activeMovement].maxAngle*guidedFraction());
  const maximum=poseMode==='free'?Math.max(Math.abs(freeRanges[freeSide][key][freeAction].min),Math.abs(freeRanges[freeSide][key][freeAction].max)):movements[activeMovement].maxAngle;
  const phase=Math.abs(angle)<2?'Posición neutra':Math.abs(angle)/maximum<.65?'Recorrido articular':'Tramo final del intervalo visual';
  const focus={
    neck:'El cráneo cambia de orientación sobre la columna cervical. Los músculos posteriores y anteriores equilibran el momento de la cabeza.',
    tmj:'La mandíbula rota al abrirse; una apertura amplia también requiere traslación del cóndilo, que esta animación simplifica.',
    shoulder:'El húmero gira respecto a la glenoides. El manguito rotador centra la cabeza humeral y la escápula participa en la elevación completa.',
    elbow:'El antebrazo gira alrededor de un eje cercano al codo. Bíceps, braquial y tríceps cambian su ventaja mecánica según el ángulo.',
    radioulnar:'El radio rota respecto al cúbito. El pronador redondo, el pronador cuadrado y el supinador actúan alrededor del eje longitudinal.',
    wrist:'La mano se orienta respecto al antebrazo. Flexores y extensores de la muñeca también estabilizan la posición durante el agarre.',
    hip:'El fémur gira dentro del acetábulo. Glúteos, aductores e iliopsoas pueden mover el muslo o estabilizar la pelvis según el apoyo.',
    knee:'La tibia cambia de orientación respecto al fémur. La rótula modifica el brazo de momento del cuádriceps; el rodamiento real se simplifica.',
    ankle:'El pie cambia de orientación respecto a la pierna. Tibial anterior y tríceps sural producen momentos opuestos; el apoyo cambia la cadena mecánica.'
  };
  $('motion-phase').textContent=poseMode==='guided'&&movements[activeMovement].base?`${phase} · fase ${Math.round(progress)}%`:`${phase} · ${Math.abs(angle)}°`;
  $('motion-biomechanics').textContent=hinge?'La pelvis y el tronco se inclinan juntos sobre las caderas; las rodillas se flexionan ligeramente y los pies conservan el apoyo. Glúteos e isquiotibiales controlan el descenso y ayudan a extender las caderas al subir.':squat?'Caderas y rodillas se flexionan mientras la pelvis desciende; la pierna se inclina hacia delante y el pie permanece apoyado. Glúteos, cuádriceps y musculatura del tobillo contribuyen según la profundidad y la carga.':focus[key];
  const lever=hinge?leverStudy.hiphinge:squat?leverStudy.squat:leverStudy[key];
  $('motion-chain').textContent=`Palanca: ${lever.kind}. El momento externo depende de la carga y de su distancia perpendicular al eje; esta vista no calcula fuerzas musculares. ${poseMode==='free'?'Puedes combinar gestos y observar cómo cambia la posición de huesos y músculos.':'Desliza la barra para observar el mismo gesto a lo largo del recorrido.'}`;
  const specific={shoulder:'upperlimb',elbow:'upperlimb',radioulnar:'motions',knee:'joints',ankle:'motions',hip:'limbmuscles',tmj:'tmj',neck:'backmuscles',wrist:'upperlimb'};
  $('motion-sources').innerHTML=(hinge?['hiphinge','hipload']:squat?['squat','squatstudy']:[specific[key],'levers']).map(makeLink).join('');
}
function renderLeverStudy(){
  const key=poseMode==='free'?freeJoint:movementJoint[movements[activeMovement].id];
  const hinge=poseMode==='guided'&&['hiphinge','pickup','deadlift'].includes(movements[activeMovement].id);
  const squat=poseMode==='guided'&&['squat','sitdown','standup','lunge'].includes(movements[activeMovement].id);
  const data=hinge?leverStudy.hiphinge:squat?leverStudy.squat:leverStudy[key],joint=jointExplorer[key];
  const value=poseMode==='free'?freeAngles[freeSide][freeJoint][freeAction]:Math.round(movements[activeMovement].maxAngle*guidedFraction());
  $('lever-kind').textContent=data.kind;
  const labels=data.layout==='first'?[['F','Esfuerzo'],['A','Apoyo'],['R','Resistencia']]:data.layout==='second'?[['A','Apoyo'],['R','Resistencia'],['F','Esfuerzo']]:data.layout==='third'?[['A','Apoyo'],['F','Esfuerzo'],['R','Resistencia']]:[['A','Eje'],['↻','Giro'],['R','Resistencia']];
  $('lever-diagram').innerHTML=labels.map(([letter,label])=>`<div><b>${letter}</b><span>${label}</span></div>`).join('');
  $('lever-components').innerHTML=`<strong>Eje o apoyo:</strong> ${data.pivot}<br><strong>Palanca ósea:</strong> ${hinge?'Pelvis, fémures y tronco con ambos pies apoyados':squat?'Pelvis, fémures, tibias y pies en apoyo':joint.bones}<br><strong>Fuerza muscular:</strong> ${data.effort}<br><strong>Resistencia:</strong> ${data.load}`;
  $('lever-moment').textContent=`${poseMode==='guided'&&movements[activeMovement].base?`Fase de la secuencia: ${Math.round(progress)}%.`:`Ángulo mostrado: ${Math.abs(value)}°.`} ${data.moment}`;
  $('lever-sources').innerHTML=(hinge?['hiphinge','hipload','torque']:squat?['squat','squatstudy','torque']:['levers','leverclasses','torque']).map(makeLink).join('');
}
function updateFreeReadout(){
  const action=currentFreeAction(),value=freeAngles[freeSide][freeJoint][freeAction];
  $('free-action-label').textContent=freeMotionName(action,value);
  $('free-angle-readout').textContent=`${value>0?'+':''}${value}°`;
  $('free-slider').setAttribute('aria-valuetext',`${freeMotionName(action,value)}, ${Math.abs(value)} grados`);
  syncQuickControl();
}
function renderFreeControls(){
  const joint=jointExplorer[freeJoint];
  if(!joint.actions.some(action=>action.id===freeAction))freeAction=joint.actions[0].id;
  const action=currentFreeAction();
  $('free-sides').innerHTML=Object.entries(regions).map(([id,region])=>`<button type="button" data-region="${id}" class="${freeRegion===id?'active':''}" aria-pressed="${freeRegion===id}">${region.label}</button>`).join('');
  $('free-joints').innerHTML=regions[freeRegion].joints.map(key=>`<button type="button" data-free-joint="${key}" class="${freeJoint===key?'active':''}" aria-pressed="${freeJoint===key}">${jointExplorer[key].name}</button>`).join('');
  $('free-actions').innerHTML=joint.actions.map(item=>`<button type="button" data-free-action="${item.id}" class="${freeAction===item.id?'active':''}" aria-pressed="${freeAction===item.id}">${item.label}</button>`).join('');
  const range=freeRanges[freeSide][freeJoint][freeAction];
  $('free-slider').min=String(range.min);$('free-slider').max=String(range.max);
  $('free-slider').value=String(freeAngles[freeSide][freeJoint][freeAction]);
  $('free-range-left').textContent=`${action.negative||action.zero||'Neutro'} · ${range.min}°`;
  $('free-range-right').textContent=`${action.positive} · +${range.max}°`;
  $('range-min').min=String(action.min);$('range-min').max='0';$('range-min').value=String(range.min);
  $('range-max').min='0';$('range-max').max=String(action.max);$('range-max').value=String(range.max);
  updateFreeReadout();
  document.querySelectorAll('[data-region]').forEach(button=>button.addEventListener('click',()=>{freeRegion=button.dataset.region;freeSide=regions[freeRegion].side;if(!regions[freeRegion].joints.includes(freeJoint)){freeJoint=regions[freeRegion].joints[0];freeAction=jointExplorer[freeJoint].actions[0].id}syncFreeSelection()}));
  document.querySelectorAll('[data-free-joint]').forEach(button=>button.addEventListener('click',()=>{freeJoint=button.dataset.freeJoint;freeAction=jointExplorer[freeJoint].actions[0].id;syncFreeSelection()}));
  document.querySelectorAll('[data-free-action]').forEach(button=>button.addEventListener('click',()=>{freeAction=button.dataset.freeAction;syncFreeSelection()}));
}
function syncFreeSelection(){if(['neck','tmj'].includes(freeJoint))freeSide='C';else if(freeSide==='C')freeSide='R';freeRegion=regionFor(freeJoint,freeSide);renderFreeControls();renderDetail();applyPose();updatePlaneGuide();selectStructure(jointExplorer[freeJoint].structure)}
function setPoseMode(mode){
  poseMode=mode;playing=false;$('play-button').textContent='▶';
  $('guided-controls').hidden=mode==='free';$('free-controls').hidden=mode!=='free';$('guided-timeline').hidden=mode==='free';
  document.querySelectorAll('[data-mode]').forEach(button=>{button.classList.toggle('active',button.dataset.mode===mode);button.setAttribute('aria-pressed',String(button.dataset.mode===mode))});
  if(mode==='free')syncFreeSelection();else{renderDetail();applyPose();updatePlaneGuide();selectStructure(movements[activeMovement].highlight,{side:movements[activeMovement].side||'R'})}
}
function renderPartPicker(){
  const picker=$('body-part-select');
  $('explorer-suggestions').innerHTML=structures.slice().sort((a,b)=>a.name.localeCompare(b.name,'es')).map(s=>`<option value="${s.name}"></option>`).join('');
  $('body-region-select').innerHTML=Object.entries(catalogSections).map(([id,label])=>`<option value="${id}">${label}</option>`).join('');
  $('body-region-select').value=catalogSection;
  const available=structures.filter(s=>catalogSection==='all'||sectionForStructure(s)===catalogSection);
  const groups=[['Huesos',s=>s.type.startsWith('HUES')],['Articulaciones',s=>s.type==='ARTICULACIÓN'],['Músculos',s=>s.type.startsWith('MÚSC')],['Otras estructuras',s=>!s.type.startsWith('HUES')&&s.type!=='ARTICULACIÓN'&&!s.type.startsWith('MÚSC')]];
  picker.innerHTML=groups.map(([label,test])=>{const options=available.filter(test).sort((a,b)=>a.name.localeCompare(b.name,'es'));return options.length?`<optgroup label="${label}">${options.map(s=>`<option value="${s.id}">${s.name}</option>`).join('')}</optgroup>`:''}).join('');
  picker.value=activeStructure;
  const pieces=[...new Set(Object.values(meshManifest).filter(info=>info.structure===activeStructure).map(info=>info.name))].sort((a,b)=>a.localeCompare(b,'es'));
  $('part-substructure-wrap').hidden=pieces.length<2;
  $('part-substructure-select').innerHTML='<option value="">Todas las piezas del grupo</option>'+pieces.map(name=>`<option value="${name}">${name}</option>`).join('');
  $('part-substructure-select').value=selectedMeshName;
  const selected=structures.find(s=>s.id===activeStructure),jointKey=partMotion[activeStructure];
  const side=selectedStructureSide==='L'?'izquierdo':selectedStructureSide==='R'?'derecho':'';
  if(!jointKey){$('part-motion-status').textContent=`${selected.name}: hay ficha anatómica, pero no una animación individual de esta estructura en el visor.`;return}
  const relation=selected.type.startsWith('MÚSC')?'Su malla acompaña la articulación o se deforma entre los segmentos conectados; no reproduce una contracción fisiológica.':directMover.has(activeStructure)?'Su segmento óseo acompaña la animación del visor.':'El control muestra el movimiento de la articulación relacionada.';
  $('part-motion-status').textContent=`${selectedMeshName||selected.name}${side?' · lado '+side:''}: ${jointExplorer[jointKey].name}. ${relation}`;
}
function renderStructures(){
  const category=s=>s.type.startsWith('HUES')?'Huesos':s.type.startsWith('MÚSC')?'Músculos':s.type==='ARTICULACIÓN'?'Articulaciones':'Aberturas';
  const normalize=value=>value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const query=normalize($('structure-search').value.trim());
  const regionStructures=structures.filter(s=>browseRegion==='all'||sectionForStructure(s)===browseRegion);
  const boneMeshes=Object.values(meshManifest).filter(info=>info.layer==='bones').length;
  const muscleMeshes=Object.values(meshManifest).filter(info=>info.layer==='muscles').length;
  $('structure-metrics').innerHTML=`<div><strong>${structures.length}</strong><span>fichas anatómicas</span></div><div><strong>${boneMeshes}</strong><span>mallas óseas</span></div><div><strong>${muscleMeshes}</strong><span>mallas musculares</span></div><div><strong>${Object.keys(catalogSections).length-1}</strong><span>regiones para explorar</span></div>`;
  $('structure-region').innerHTML=Object.entries(catalogSections).map(([id,label])=>`<option value="${id}">${label} · ${id==='all'?structures.length:structures.filter(s=>sectionForStructure(s)===id).length}</option>`).join('');
  $('structure-region').value=browseRegion;
  $('structure-region-summary').textContent=`${regionStructures.length} fichas en ${catalogSections[browseRegion].toLowerCase()}. Filtra por tipo o busca un nombre.`;
  $('structure-filters').innerHTML=['Todas','Huesos','Músculos','Articulaciones','Aberturas'].map(c=>`<button type="button" data-filter="${c}" class="${structureFilter===c?'active':''}" aria-pressed="${structureFilter===c}">${c} <span>${c==='Todas'?regionStructures.length:regionStructures.filter(s=>category(s)===c).length}</span></button>`).join('');
  document.querySelectorAll('[data-filter]').forEach(btn=>btn.addEventListener('click',()=>{structureFilter=btn.dataset.filter;$('structure-search').value='';const first=regionStructures.find(s=>structureFilter==='Todas'||category(s)===structureFilter);if(first&&!regionStructures.some(s=>s.id===activeStructure&&(structureFilter==='Todas'||category(s)===structureFilter))){selectStructure(first.id);structureFilter=btn.dataset.filter}renderStructures()}));
  const visible=regionStructures.filter(s=>(structureFilter==='Todas'||category(s)===structureFilter)&&(!query||normalize(s.name).includes(query))).sort((a,b)=>a.name.localeCompare(b.name,'es'));
  $('structure-list-status').textContent=`${visible.length} ${visible.length===1?'resultado':'resultados'} · ${structureFilter.toLowerCase()}`;
  $('structure-tabs').innerHTML=visible.length?visible.map(s=>`<button type="button" class="${s.id===activeStructure?'active':''}" data-structure="${s.id}" aria-pressed="${s.id===activeStructure}">${s.name}</button>`).join(''):'<p class="structure-empty">No hay estructuras con estos filtros.</p>';
  document.querySelectorAll('[data-structure]').forEach(btn=>btn.addEventListener('click',()=>selectStructure(btn.dataset.structure,{activateMotion:true,scroll:true})));
  const s=structures.find(v=>v.id===activeStructure);
  const meshNote=anatomicalModelLoaded&&hasAnatomicalMesh(s.id)?'<p class="mesh-coverage">Malla anatómica identificada · BodyParts3D</p>':'<p class="mesh-coverage reference">Referencia didáctica o región anatómica</p>';
  const textOverrides={
    skull:'La bóveda craneal protege el encéfalo. Las mallas muestran huesos craneales y faciales identificados; se redujeron polígonos para que el atlas funcione en el navegador.',
    ribs:'La caja torácica tiene doce pares de costillas y un esternón. Las mallas GLB muestran cada costilla y las partes principales del esternón; los cartílagos costales no se individualizan.',
    forearmflexors:'Grupo anterior del antebrazo que mueve muñeca y dedos. La malla destacada corresponde al flexor superficial de los dedos; no representa a todos los flexores.',
    forearmextensors:'Grupo posterior del antebrazo cuyos tendones extienden muñeca y dedos. La malla destacada corresponde al extensor de los dedos; no representa a todos los extensores.'
  };
  const hasMesh=anatomicalModelLoaded&&hasAnatomicalMesh(s.id);
  const directPieces=Object.values(meshManifest).filter(info=>info.structure===s.id).length;
  const oldModelDescription=/(visor|modelo|varilla|aro|anillo|banda|lámina|esquem|dibuj|se representa|se muestran|se ve|se marca|pieza|volumen|segmentos|aquí|rayos|tramo|se resaltan|contiguas)/i.test(s.fact);
  $('structure-detail').innerHTML=`<div class="structure-detail-meta"><span class="type">${s.type}</span><span>${catalogSections[sectionForStructure(s)]}</span></div><h3>${s.name}</h3>${selectedMeshName?`<p><strong>Pieza individual:</strong> ${selectedMeshName} · identificada en BodyParts3D.</p>`:''}<p>${hasMesh&&textOverrides[s.id]||s.text}</p>${meshNote}${directPieces?`<p class="structure-piece-count">${directPieces} ${directPieces===1?'malla identificada':'mallas identificadas'} en el GLB</p>`:''}${oldModelDescription&&hasMesh?'':`<div class="fact"><strong>Dato de estudio:</strong> ${s.fact}</div>`}<div class="structure-citations"><strong>Fuentes de esta ficha</strong><div class="detail-sources">${[...new Set([...s.sources,...(hasMesh?['bodyparts']:[])])].map(makeLink).join('')}</div></div>`;
}
function renderSources(){
  const query=$('source-search').value.trim().toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const groupSets={
    assets:new Set(['bodyparts','gltf']),
    basics:new Set(['terminology','motions','joints','jointtypes']),
    bones:new Set(['skull','pelvis','foramen','pelvis2','girdle','upperbones','lowerbones','spine','thorax','handbones','talus','footbones','sternum','mandible','forearmbones','legbones','vertebrae','midfoot','pelvicjoints','tmj','sacralforamina']),
    mechanics:new Set(['sportrun','sportfootball','sporttennis','sportswim','sportbasket','sportcycling','motorunits','heavyload','rdlstudy','levers','torque','leverclasses','hiphinge','hipload','squat','squatstudy'])
  };
  const groupNames={assets:'Mallas 3D y formato',basics:'Bases anatómicas y movimiento',bones:'Huesos y articulaciones',muscles:'Músculos y regiones',mechanics:'Biomecánica, deporte y entrenamiento'};
  const grouped=Object.fromEntries(Object.keys(groupNames).map(key=>[key,[]]));
  for(const [id,source] of Object.entries(sources)){
    const key=Object.entries(groupSets).find(([,set])=>set.has(id))?.[0]||'muscles';
    const normalized=source.label.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'');
    if(!query||normalized.includes(query))grouped[key].push({id,...source});
  }
  const count=Object.values(grouped).reduce((total,group)=>total+group.length,0);
  $('source-count').textContent=`${count} de ${Object.keys(sources).length} referencias`;
  $('source-list').innerHTML=Object.entries(grouped).filter(([,items])=>items.length).map(([key,items],index)=>`<details class="source-group" ${query||index===0?'open':''}><summary><span>${groupNames[key]}</span><small>${items.length} ${items.length===1?'fuente':'fuentes'}</small></summary><div class="source-group-links">${items.map(source=>`<a href="${source.url}" target="_blank" rel="noopener noreferrer"><span>${source.label}</span><span aria-hidden="true">↗</span></a>`).join('')}</div></details>`).join('')||'<p class="structure-empty">No hay referencias con ese término.</p>';
}
function renderAudit(){
  const checks=[
    ['Hombro','Abducción y deltoides medio',['motions','deltoid']],
    ['Codo','Flexión y tuberosidad radial del bíceps',['upperlimb','biceps']],
    ['Cadera','Flexión e inserción del iliopsoas',['motions','iliopsoas']],
    ['Cadera','Abducción e inserción del glúteo medio',['motions','gluteus']],
    ['Rodilla','Flexión y acción de los isquiotibiales',['motions','hamstrings']],
    ['Tobillo','Dorsiflexión e inserción del tibial anterior',['motions','tibialis']],
    ['Hombro','Flexión anterior y acción del deltoides',['motions','deltoid']],
    ['Tobillo','Flexión plantar y tendón calcáneo',['motions','gastrocnemius2']],
    ['Cadera','Rotación externa y acción de los rotadores',['motions','hipmuscles']],
    ['Planos','División sagital, frontal y transversal',['terminology','motions']],
    ['Cráneo','Posición del foramen magno',['skull','foramen']],
    ['Pelvis','Posición del foramen obturador',['pelvis','pelvis2']],
    ['Mano','Carpo, metacarpo y falanges',['upperbones','handbones']],
    ['Pie','Relación del talo con tibia y calcáneo',['lowerbones','talus']],
    ['Escápula','Función del trapecio y serrato anterior',['upperlimb','shoulderabductors']],
    ['Tórax','Esternón y cartílagos costales',['thorax','sternum']],
    ['Columna','Regiones cervical, torácica y lumbar',['spine','vertebrae']],
    ['Pelvis','Ilion, isquion y pubis',['pelvis','pelvis2']],
    ['Hombro','Cuatro músculos del manguito rotador',['upperlimb','rotatorcuff']],
    ['Pie','Navicular, cuboides y cuneiformes',['lowerbones','midfoot']],
    ['Columna','Forámenes cervicales y sacros',['spine','sacralforamina']],
    ['Hombro','Glenohumeral esferoidea y movimiento multiaxial',['joints','jointtypes']],
    ['Codo','Humerocubital en bisagra; radiocubital para pronación',['joints','jointtypes']],
    ['Muñeca','Radiocarpiana condílea y movimiento biaxial',['jointtypes','upperbones']],
    ['Cadera','Coxofemoral esferoidea y estabilidad de carga',['joints','jointtypes']],
    ['Rodilla','Bisagra modificada con rodamiento y deslizamiento',['joints','jointtypes']],
    ['Tobillo','Talocrural en bisagra para dorsiflexión y flexión plantar',['joints','jointtypes']]
  ];
  $('audit-rows').innerHTML=checks.map(([region,claim,refs])=>`<div class="audit-row"><span>${region}</span><strong>${claim}</strong><div>${refs.map(makeLink).join('')}</div></div>`).join('');
}
function renderJointMap(){
  $('joint-map-grid').innerHTML=Object.entries(jointExplorer).map(([key,joint],index)=>`<button type="button" class="joint-map-card" data-joint-map="${key}"><span class="num">${String(index+1).padStart(2,'0')} / ARTICULACIÓN</span><strong>${joint.name}</strong><span>${joint.type}</span><span>${joint.bones}</span><span class="go">Explorar movimiento ↗</span></button>`).join('');
  document.querySelectorAll('[data-joint-map]').forEach(button=>button.addEventListener('click',()=>{freeJoint=button.dataset.jointMap;freeAction=jointExplorer[freeJoint].actions[0].id;freeRegion=regionFor(freeJoint,freeSide);setPoseMode('free');$('explorar').scrollIntoView({behavior:'smooth',block:'start'})}));
}
function selectMovement(index){
  activeMovement=index;progress=0;poseDirection=1;playing=false;$('play-button').textContent='▶';$('play-button').setAttribute('aria-label','Reproducir movimiento');
  $('motion-slider').value='0';renderPlaneTabs();renderMovementList();renderDetail();applyPose();updatePlaneGuide();
  selectedMeshName='';
  selectStructure(movements[index].highlight,{side:movements[index].side||'R'});
  if(movements[index].grounded||['hiphinge','squat','lunge'].includes(movements[index].id))setView('side');
}
function selectStructure(id,{activateMotion=false,side=null,scroll=false,meshName=null}={}){
  const s=structures.find(v=>v.id===id);if(!s)return;
  if(activeStructure!==id)selectedMeshName='';
  if(meshName)selectedMeshName=meshName;
  const jointKey=partMotion[id];
  if(activateMotion&&jointKey){
    freeSide=['neck','tmj'].includes(jointKey)?'C':side==='L'||side==='R'?side:freeSide==='L'?'L':'R';
    freeJoint=jointKey;freeAction=jointExplorer[jointKey].actions[0].id;
    if(poseMode==='free')syncFreeSelection();else setPoseMode('free');
  }
  activeStructure=id;selectedStructureSide=side==='L'||side==='R'?side:jointKey&&poseMode==='free'?freeSide:null;
  if(catalogSection!=='all'&&sectionForStructure(s)!==catalogSection)catalogSection=sectionForStructure(s);
  if(browseRegion!=='all'&&sectionForStructure(s)!==browseRegion)browseRegion=sectionForStructure(s);
  $('structure-search').value='';
  structureFilter=s.type.startsWith('HUES')?'Huesos':s.type.startsWith('MÚSC')?'Músculos':s.type==='ARTICULACIÓN'?'Articulaciones':'Aberturas';
  renderStructures();renderPartPicker();updateLayers();highlightStructure();
  if(meshName){focusSelection();updateTouchSelection();}
  if(scroll)$('explorar').scrollIntoView({behavior:'smooth',block:'start'});
}
function updateReadout(){
  const m=movements[activeMovement];
  $('angle-readout').textContent=m.base?`${Math.round(progress)}%`:`${Math.round(m.maxAngle*guidedFraction(m))}°`;
  $('motion-stage').textContent=m.stageLabels?`${m.stageLabels[Math.min(2,Math.floor(progress/34))].toUpperCase()} · ${Math.round(progress)}%`:progress<2?'REPOSO · 0%':progress>98?'POSICIÓN FINAL · 100%':`EN MOVIMIENTO · ${Math.round(progress)}%`;
  $('motion-slider').style.setProperty('--pct',`${progress}%`);
  if(poseMode==='guided')renderLeverStudy();
  if(poseMode==='guided')renderMotionAnalysis();
  if(poseMode==='guided')renderLoadFocus();
  syncQuickControl();
}
function syncQuickControl(){
  if(!$('quick-slider'))return;
  if(poseMode==='free'){
    const joint=jointExplorer[freeJoint],action=currentFreeAction(),value=freeAngles[freeSide][freeJoint][freeAction];
    $('quick-motion-name').textContent=`${joint.name} · ${action.label}`;
    $('quick-angle').textContent=`${value>0?'+':''}${value}°`;
    const range=freeRanges[freeSide][freeJoint][freeAction];
    $('quick-slider').min=String(range.min);$('quick-slider').max=String(range.max);$('quick-slider').value=String(value);
    $('quick-action').textContent='↺';$('quick-action').setAttribute('aria-label','Restablecer este movimiento');
  }else{
    const movement=movements[activeMovement];
    $('quick-motion-name').textContent=movement.name;
    $('quick-angle').textContent=movement.base?`${Math.round(progress)}%`:`${Math.round(movement.maxAngle*guidedFraction(movement))}°`;
    $('quick-slider').min='0';$('quick-slider').max='100';$('quick-slider').value=String(progress);
    $('quick-action').textContent=playing?'Ⅱ':'▶';$('quick-action').setAttribute('aria-label',playing?'Pausar movimiento':'Reproducir movimiento');
  }
}
document.querySelectorAll('.layer input').forEach(input=>input.addEventListener('change',()=>updateLayers()));
$('explode-slider').addEventListener('input',()=>updateLayers());
$('muscle-depth').addEventListener('change',updateLayers);
$('fullscreen-explode-slider').addEventListener('input',event=>{$('explode-slider').value=event.target.value;updateLayers()});
$('separation-plane').addEventListener('change',event=>{$('fullscreen-separation-plane').value=event.target.value;updateLayers()});
$('fullscreen-separation-plane').addEventListener('change',event=>{$('separation-plane').value=event.target.value;updateLayers()});
function toggleSeparateSelected(){separateSelected=!separateSelected;updateLayers()}
$('separate-selected').addEventListener('click',toggleSeparateSelected);
$('fullscreen-separate-selected').addEventListener('click',toggleSeparateSelected);
$('fullscreen-reset-separation').addEventListener('click',()=>{$('explode-slider').value='0';updateLayers()});
$('muscle-opacity').addEventListener('input',()=>updateLayers());
$('isolate-structure').addEventListener('click',()=>{isolateSelected=!isolateSelected;updateLayers();highlightStructure()});
$('reset-explore').addEventListener('click',()=>{isolateSelected=false;separateSelected=false;$('explode-slider').value='0';$('separation-plane').value='multi';$('muscle-opacity').value='100';$('layer-bones').checked=true;$('layer-muscles').checked=true;updateLayers();highlightStructure()});
$('structure-search').addEventListener('input',()=>renderStructures());
$('structure-region').addEventListener('change',event=>{browseRegion=event.target.value;structureFilter='Todas';$('structure-search').value='';const first=structures.find(s=>browseRegion==='all'||sectionForStructure(s)===browseRegion);if(first&&!structures.some(s=>s.id===activeStructure&&(browseRegion==='all'||sectionForStructure(s)===browseRegion))){selectStructure(first.id);structureFilter='Todas'}renderStructures()});
$('source-search').addEventListener('input',()=>renderSources());
$('body-part-select').addEventListener('change',event=>selectStructure(event.target.value,{activateMotion:true}));
$('explorer-search').addEventListener('change',event=>{
  const normalize=value=>value.toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  const query=normalize(event.target.value);
  if(!query)return;
  const structure=structures.find(item=>normalize(item.name)===query)||structures.find(item=>normalize(item.name).includes(query));
  if(!structure){$('part-motion-status').textContent='No encontré esa estructura. Prueba con otro nombre anatómico.';return}
  const piece=Object.values(meshManifest).find(info=>info.structure===structure.id&&info.layer==='muscles')||Object.values(meshManifest).find(info=>info.structure===structure.id);
  selectStructure(structure.id,{activateMotion:true,side:piece?.name.includes('left ')?'L':piece?.name.includes('right ')?'R':null,meshName:piece?.name||null});
  if(window.innerWidth<=760)openMobileViewer();
});
$('body-region-select').addEventListener('change',event=>{catalogSection=event.target.value;const first=structures.find(s=>catalogSection==='all'||sectionForStructure(s)===catalogSection);if(first)selectStructure(first.id);});
$('movement-category').addEventListener('change',event=>{activeCategoryFilter=event.target.value;activePlaneFilter='todos';const first=movements.findIndex(matchesMovementFilter);if(first>=0)selectMovement(first);else{renderPlaneTabs();renderMovementList()}});
$('learning-lens').addEventListener('change',event=>{activeLearningLens=event.target.value;renderLearningContext(movements[activeMovement])});
$('part-substructure-select').addEventListener('change',event=>{selectedMeshName=event.target.value;selectedStructureSide=selectedMeshName.includes('left ')?'L':selectedMeshName.includes('right ')?'R':null;renderPartPicker();renderStructures();updateLayers();highlightStructure();if(selectedMeshName){focusSelection();updateTouchSelection();}});
$('motion-slider').addEventListener('input',e=>{progress=Number(e.target.value);poseDirection=1;playing=false;$('play-button').textContent='▶';applyPose();updateReadout();});
$('play-button').addEventListener('click',()=>{if(!playing&&progress>=100){progress=0;poseDirection=1}playing=!playing;$('play-button').textContent=playing?'Ⅱ':'▶';$('play-button').setAttribute('aria-label',playing?'Pausar movimiento':'Reproducir movimiento');syncQuickControl()});
$('quick-slider').addEventListener('input',event=>{const target=$(poseMode==='free'?'free-slider':'motion-slider');target.value=event.target.value;target.dispatchEvent(new Event('input',{bubbles:true}))});
$('quick-action').addEventListener('click',()=>{if(poseMode==='free'){$('quick-slider').value='0';$('quick-slider').dispatchEvent(new Event('input',{bubbles:true}))}else{$('play-button').click();syncQuickControl()}});
$('reset-pose').addEventListener('click',()=>{playing=false;poseDirection=1;progress=0;$('motion-slider').value='0';$('play-button').textContent='▶';applyPose();updateReadout()});
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setPoseMode(button.dataset.mode)));
$('free-slider').addEventListener('input',event=>{freeAngles[freeSide][freeJoint][freeAction]=Number(event.target.value);updateFreeReadout();renderDetail();applyPose();updatePlaneGuide()});
function updateFreeRange(){
  const action=currentFreeAction(),range=freeRanges[freeSide][freeJoint][freeAction];
  const minimum=Number($('range-min').value),maximum=Number($('range-max').value);
  range.min=Number.isFinite(minimum)?Math.max(action.min,Math.min(0,minimum)):action.min;
  range.max=Number.isFinite(maximum)?Math.max(1,Math.min(action.max,maximum)):action.max;
  freeAngles[freeSide][freeJoint][freeAction]=Math.max(range.min,Math.min(range.max,freeAngles[freeSide][freeJoint][freeAction]));
  renderFreeControls();renderDetail();applyPose();
}
$('range-min').addEventListener('change',updateFreeRange);
$('range-max').addEventListener('change',updateFreeRange);
$('range-restore').addEventListener('click',()=>{const action=currentFreeAction();freeRanges[freeSide][freeJoint][freeAction]={min:action.min,max:action.max};renderFreeControls();renderDetail()});
$('reset-free').addEventListener('click',()=>{for(const side of ['R','L','C'])for(const joint of Object.values(freeAngles[side]))for(const key of Object.keys(joint))joint[key]=0;syncFreeSelection()});
$('explode-slider').value='0';
$('muscle-opacity').value='100';
renderPlaneTabs();renderMovementList();renderDetail();renderStructures();renderPartPicker();renderSources();renderAudit();renderJointMap();renderFreeControls();

let scene,camera,renderer,bodyRoot,boneRoot,muscleRoot,surfaceRoot,markerRoot,guideGroup,planeMeshes,axisArrow;
let armR,legR,arms={},legs={},headGroup,jawGroup,raycaster,highlighted=[];
let updateTouchSelection=()=>{};
const DEFAULT_DISTANCE=8.4,MIN_DISTANCE=.55,MAX_DISTANCE=32;
let yaw=-.32,pitch=.07,distance=DEFAULT_DISTANCE,viewTarget=-.32;
const cameraTarget=new THREE.Vector3(0,-.18,0);
const navVector={x:0,y:0};
const pickables=[];
const anatomicalMuscles=[];
const tendonBindings=[];
const muscleMotionBindings=[];
let tendonLines=null;
const neutralRigInverse={};
let isolateSelected=false;
let separateSelected=false;
const boneMat=new THREE.MeshStandardMaterial({color:0xe8ddc5,roughness:.72,metalness:.02});
const jointMat=new THREE.MeshStandardMaterial({color:0xf8e5c8,roughness:.55});
const muscleMat=new THREE.MeshStandardMaterial({color:0xd87d68,roughness:.75,transparent:true,opacity:.88,depthWrite:false});
const muscleDark=new THREE.MeshStandardMaterial({color:0xbb6557,roughness:.78,transparent:true,opacity:.8,depthWrite:false});
const surfaceMat=new THREE.MeshStandardMaterial({color:0xa7c7b5,transparent:true,opacity:.20,depthWrite:false,side:THREE.DoubleSide,roughness:.8});
const markerMat=new THREE.MeshStandardMaterial({color:0xecc779,emissive:0x9f6b24,emissiveIntensity:.35});
const accentMat=new THREE.MeshStandardMaterial({color:0xffb482,emissive:0xea7355,emissiveIntensity:.45,roughness:.5});
const musclePalette=[0xb84253,0xd99555,0x805678,0xe17868,0xa95b3f,0xc65b85,0x8d684f,0xae709e,0xd45c47,0x98596a,0xe5a17c,0x9e3e61];
function musclePaletteIndex(info,box,assigned){
  const name=info.name.replace(/\b(left|right)\b/g,'').trim();
  let hash=0;for(const char of name)hash=(hash*31+char.charCodeAt(0))>>>0;
  const preference=hash%musclePalette.length,penalties=new Array(musclePalette.length).fill(0);
  const vicinity=box.clone().expandByScalar(.045);
  for(const other of assigned)if(vicinity.intersectsBox(other.box))penalties[other.index]++;
  let best=preference;
  for(let offset=1;offset<musclePalette.length;offset++){
    const index=(preference+offset)%musclePalette.length;
    if(penalties[index]<penalties[best])best=index;
  }
  assigned.push({box,index:best});
  return best;
}
const V=(x,y,z)=>new THREE.Vector3(x,y,z);
const muscleProfile=new THREE.LatheGeometry([[0,-1],[.34,-.86],[.72,-.57],[1,-.08],[.93,.31],[.58,.72],[0,1]].map(([r,y])=>new THREE.Vector2(r,y)),20);

function addMesh(parent,geometry,material,id){
  const mesh=new THREE.Mesh(geometry,material);parent.add(mesh);
  mesh.userData.procedural=true;
  mesh.userData.layer=material===surfaceMat?'surface':material===markerMat?'markers':material===muscleMat||material===muscleDark?'muscles':'bones';
  if(id){mesh.userData.structure=id;pickables.push(mesh)}
  return mesh;
}
function ellipsoid(parent,pos,scale,material,id){const mesh=addMesh(parent,new THREE.SphereGeometry(1,20,14),material,id);mesh.position.set(...pos);mesh.scale.set(...scale);return mesh;}
function muscleBelly(parent,pos,scale,material,id){const mesh=addMesh(parent,muscleProfile,material,id);mesh.position.set(...pos);mesh.scale.set(...scale);return mesh;}
function rod(parent,a,b,r,material,id){
  const A=V(...a),B=V(...b),d=B.clone().sub(A),m=addMesh(parent,new THREE.CylinderGeometry(r*.9,r,d.length(),10),material,id);
  m.position.copy(A.add(B).multiplyScalar(.5));m.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());return m;
}
function longBone(parent,a,b,r,id){
  const A=V(...a),B=V(...b),d=B.clone().sub(A),length=d.length();
  const geometry=new THREE.CylinderGeometry(1,1,length,16,12),position=geometry.attributes.position;
  for(let i=0;i<position.count;i++){
    const y=position.getY(i),t=y/length+.5;
    const end=Math.pow(Math.abs(t-.5)*2,4),radius=r*(.76+.42*end);
    position.setXYZ(i,position.getX(i)*radius+Math.sin(t*Math.PI)*r*.13,y,position.getZ(i)*radius);
  }
  geometry.computeVertexNormals();
  const mesh=addMesh(parent,geometry,boneMat,id);mesh.position.copy(A.add(B).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(V(0,1,0),d.normalize());
  ellipsoid(parent,a,[r*1.25,r*1.18,r*1.25],boneMat,id);ellipsoid(parent,b,[r*1.22,r*1.12,r*1.22],boneMat,id);
  return mesh;
}
function curve(parent,points,r,material,id){const path=new THREE.CatmullRomCurve3(points.map(p=>V(...p)));return addMesh(parent,new THREE.TubeGeometry(path,Math.max(18,points.length*5),r,7,false),material,id);}
function ring(parent,x,y,z,r,material,id,axis='z'){const obj=addMesh(parent,new THREE.TorusGeometry(r,Math.min(.024,r*.25),7,26),material,id);obj.position.set(x,y,z);if(axis==='y')obj.rotation.x=Math.PI/2;return obj;}
function constructBody(){
  bodyRoot=new THREE.Group();scene.add(bodyRoot);boneRoot=new THREE.Group();muscleRoot=new THREE.Group();surfaceRoot=new THREE.Group();markerRoot=new THREE.Group();bodyRoot.add(boneRoot,muscleRoot,surfaceRoot,markerRoot);
  headGroup=new THREE.Group();headGroup.position.set(0,1.55,0);bodyRoot.add(headGroup);
  jawGroup=new THREE.Group();jawGroup.position.set(0,.08,.22);headGroup.add(jawGroup);
  const neckMarker=ellipsoid(headGroup,[0,0,.20],[.06,.06,.06],markerMat,'neckjoint');neckMarker.userData.side='C';neckMarker.userData.jointKey='neck';
  // Spine, sacrum and skull.
  for(let i=0;i<16;i++){
    const y=-.40+i*.126,id=i<5?'lumbar':i<13?'thoracic':'cervical';
    ellipsoid(boneRoot,[0,y,-.13],[.095,.074,.09],boneMat,id);
  }
  ellipsoid(markerRoot,[0,.45,-.35],[.05,.05,.05],markerMat,'spine');
  for(const s of [-1,1])ring(markerRoot,s*.14,1.38,-.14,.04,markerMat,'transverseforamen','y');
  ellipsoid(headGroup,[0,.43,-.03],[.43,.53,.37],boneMat,'skull');
  ellipsoid(headGroup,[0,.07,.18],[.30,.12,.24],boneMat,'skull');
  curve(jawGroup,[[-.26,.01,.03],[-.23,-.14,.08],[0,-.20,.12],[.23,-.14,.08],[.26,.01,.03]],.042,boneMat,'mandible');
  for(const s of [-1,1]){const tm=ellipsoid(headGroup,[s*.30,.08,.24],[.045,.045,.045],markerMat,'tmjoint');tm.userData.side='C';tm.userData.jointKey='tmj'}
  ellipsoid(headGroup,[0,.37,.02],[.45,.58,.39],surfaceMat);
  ring(headGroup,0,-.11,-.12,.11,markerMat,'foramenmagnum','y');
  // Sternum, ribcage, clavicles, scapulae.
  rod(boneRoot,[0,.75,.28],[0,1.38,.28],.064,boneMat,'sternum');
  ellipsoid(boneRoot,[0,1.38,.28],[.105,.12,.075],boneMat,'sternum');
  ellipsoid(boneRoot,[0,.72,.28],[.055,.10,.045],boneMat,'sternum');
  for(let i=0;i<12;i++){const y=.39+i*.096,w=.40+.18*Math.sin((i+1)/13*Math.PI);
    for(const s of [-1,1]){
      const front=i<7?[0,y,.23]:i<10?[s*.18,y,.21]:[s*.34,y,.08];
      curve(boneRoot,[front,[s*w*.55,y+.025,.25],[s*w,y+.02,0],[s*w*.82,y,-.29],[s*.14,y,-.37]],.021,boneMat,'ribs');
    }
  }
  for(const s of [-1,1]){
    rod(boneRoot,[s*.06,1.39,.24],[s*.69,1.38,.12],.055,boneMat,'clavicle');
    const blade=ellipsoid(boneRoot,[s*.52,1.11,-.29],[.25,.40,.07],boneMat,'scapula');blade.rotation.z=s*.25;
    curve(boneRoot,[[s*.55,1.3,-.33],[s*.71,1.35,-.21],[s*.82,1.38,-.05]],.048,boneMat,'scapula');
    curve(muscleRoot,[[s*.43,1.42,-.40],[s*.61,1.44,-.39],[s*.79,1.37,-.26]],.052,muscleMat,'supraspinatus');
    ellipsoid(muscleRoot,[s*.55,1.11,-.39],[.19,.22,.045],muscleDark,'infraspinatus');
    ellipsoid(muscleRoot,[s*.53,1.07,-.19],[.15,.23,.045],muscleMat,'subscapularis');
    curve(muscleRoot,[[s*.59,.90,-.39],[s*.73,1.02,-.35],[s*.81,1.25,-.22]],.035,muscleDark,'teresminor');
    for(let i=0;i<2;i++)curve(muscleRoot,[[s*.12,1.22-i*.18,-.39],[s*.36,1.18-i*.16,-.37],[s*.52,1.14-i*.15,-.34]],.042,muscleDark,'rhomboids');
    ellipsoid(muscleRoot,[s*.28,1.0,.34],[.32,.38,.09],muscleDark,'pectoralis');
    curve(muscleRoot,[[0,1.56,-.27],[s*.27,1.48,-.32],[s*.58,1.28,-.34],[s*.68,1.08,-.33]],.105,muscleDark,'trapezius');
    ellipsoid(muscleRoot,[s*.35,.38,-.36],[.30,.52,.075],muscleDark,'latissimus');
    for(let i=0;i<4;i++)curve(muscleRoot,[[s*.50,.53+i*.17,.12],[s*.62,.56+i*.17,-.02]],.038,muscleMat,'serratus');
    ellipsoid(muscleRoot,[s*.16,.18,.36],[.13,.49,.075],muscleMat,'rectusabdominis');
    ellipsoid(muscleRoot,[s*.49,.10,.26],[.15,.47,.06],muscleDark,'externaloblique');
    ellipsoid(muscleRoot,[s*.15,.35,-.32],[.075,.80,.06],muscleMat,'erectorspinae');
  }
  ellipsoid(surfaceRoot,[0,.75,0],[.70,.95,.39],surfaceMat);
  // Pelvic crest, acetabular area and two visible obturator openings.
  for(const s of [-1,1]){
    curve(boneRoot,[[s*.14,-.38,-.22],[s*.37,-.30,-.26],[s*.62,-.31,-.12],[s*.60,-.52,.08],[s*.43,-.74,.13]],.075,boneMat,'ilium');
    const wing=ellipsoid(boneRoot,[s*.43,-.50,-.16],[.23,.25,.07],boneMat,'ilium');wing.rotation.z=s*.24;
    curve(boneRoot,[[s*.43,-.74,.13],[s*.50,-.96,.18],[s*.31,-1.03,.20]],.062,boneMat,'ischium');
    curve(boneRoot,[[s*.31,-1.03,.20],[s*.17,-.84,.20],[s*.43,-.74,.13]],.062,boneMat,'pubis');
    ellipsoid(boneRoot,[s*.44,-.70,.03],[.18,.17,.14],boneMat,'pelvis');
    ring(markerRoot,s*.33,-.86,.245,.105,markerMat,'foramenobturator');
    ellipsoid(markerRoot,[s*.20,-.54,-.32],[.05,.05,.05],markerMat,'sacroiliac');
  }
  ellipsoid(boneRoot,[0,-.55,-.22],[.15,.32,.15],boneMat,'pelvis');
  ellipsoid(boneRoot,[0,-.62,-.28],[.11,.27,.10],boneMat,'sacrum');
  for(const s of [-1,1])for(const y of [-.51,-.63,-.75])ring(markerRoot,s*.06,y,-.39,.022,markerMat,'sacralforamina');
  rod(boneRoot,[-.19,-.88,.19],[.19,-.88,.19],.055,boneMat,'pelvis');
  ellipsoid(surfaceRoot,[0,-.51,0],[.67,.40,.36],surfaceMat);
  arms.R=buildArm(-1);arms.L=buildArm(1);armR=arms.R;
  legs.R=buildLeg(-1);legs.L=buildLeg(1);legR=legs.R;
  // Identification spheres at visible surface landmarks.
  const highlights=[['scapula',[-.62,1.29,-.25]],['humerus',[-.89,.96,.14]],['radiusulna',[-.95,.08,.15]],['pelvis',[-.52,-.50,.24]],['femur',[-.35,-1.25,.20]],['tibiafibula',[-.38,-2.32,.15]]];
  for(const [id,p] of highlights)ellipsoid(markerRoot,p,[.045,.045,.045],markerMat,id);
}
function buildArm(s){
  const side=s<0?'R':'L';
  const shoulder=new THREE.Group();shoulder.position.set(s*.82,1.36,0);bodyRoot.add(shoulder);
  ellipsoid(shoulder,[0,-.04,0],[.16,.16,.17],jointMat,'humerus');
  const shoulderMarker=ellipsoid(shoulder,[0,0,.22],[.075,.075,.075],markerMat,'shoulderjoint');shoulderMarker.userData.side=side;shoulderMarker.userData.jointKey='shoulder';
  longBone(shoulder,[0,-.06,0],[s*.035,-.73,0],.083,'humerus');
  ellipsoid(shoulder,[s*-.065,-.71,0],[.075,.055,.07],boneMat,'humerus');
  ellipsoid(shoulder,[s*.085,-.71,0],[.072,.06,.068],boneMat,'humerus');
  ellipsoid(shoulder,[s*.02,-.43,0],[.11,.33,.11],muscleMat,'deltoid');
  muscleBelly(shoulder,[s*.03,-.35,.135],[.14,.32,.105],muscleMat,'biceps');
  muscleBelly(shoulder,[0,-.54,.075],[.105,.20,.08],muscleDark,'brachialis');
  muscleBelly(shoulder,[s*.02,-.38,-.14],[.13,.28,.095],muscleDark,'triceps');
  const del=ellipsoid(shoulder,[s*.03,-.10,.04],[.205,.24,.21],muscleMat,'deltoid');del.rotation.z=s*.3;
  ellipsoid(shoulder,[0,-.37,0],[.21,.48,.20],surfaceMat);
  const elbow=new THREE.Group();elbow.position.set(s*.03,-.77,0);shoulder.add(elbow);
  ellipsoid(elbow,[0,0,0],[.11,.11,.105],jointMat,'humerus');
  const elbowMarker=ellipsoid(elbow,[0,0,.17],[.06,.06,.06],markerMat,'elbowjoint');elbowMarker.userData.side=side;elbowMarker.userData.jointKey='elbow';
  const forearm=new THREE.Group();elbow.add(forearm);
  const radioulnarMarker=ellipsoid(forearm,[s*.08,-.10,.14],[.045,.045,.045],markerMat,'radioulnarjoint');radioulnarMarker.userData.side=side;radioulnarMarker.userData.jointKey='radioulnar';
  rod(forearm,[s*.05,-.06,.04],[s*.09,-.64,.045],.054,boneMat,'radius');
  rod(elbow,[s*-.06,-.06,-.035],[s*-.05,-.64,-.035],.052,boneMat,'ulna');
  ellipsoid(elbow,[0,-.30,.10],[.115,.27,.09],muscleDark,'radiusulna');
  ellipsoid(elbow,[s*.14,-.27,.08],[.06,.25,.06],muscleMat,'brachioradialis');
  ellipsoid(elbow,[0,-.33,.16],[.10,.24,.045],muscleMat,'forearmflexors');
  ellipsoid(elbow,[0,-.33,-.13],[.10,.24,.045],muscleDark,'forearmextensors');
  const wrist=new THREE.Group();wrist.position.set(0,-.65,0);forearm.add(wrist);
  const wristMarker=ellipsoid(wrist,[0,0,.10],[.052,.052,.052],markerMat,'wristjoint');wristMarker.userData.side=side;wristMarker.userData.jointKey='wrist';
  for(let row=0;row<2;row++)for(let j=0;j<4;j++)ellipsoid(wrist,[s*(j-1.5)*.055,-.075-row*.065,.03],[.029,.028,.025],boneMat,'carpals');
  for(let j=0;j<5;j++){
    const x=s*(2-j)*.055;
    rod(wrist,[x*.7,-.17,.04],[x,-.32,.04],.019,boneMat,'metacarpals');
    const count=j===0?2:3;
    for(let k=0;k<count;k++)rod(wrist,[x,-.33-k*.053,.04],[x*1.07,-.375-k*.053,.04],.012,boneMat,'handphalanges');
  }
  ellipsoid(wrist,[0,-.12,-.015],[.13,.19,.07],surfaceMat);
  return {shoulder,elbow,forearm,wrist,radioulnar:forearm};
}
function buildLeg(s){
  const side=s<0?'R':'L';
  const hip=new THREE.Group();hip.position.set(s*.39,-.70,0);bodyRoot.add(hip);
  const gluteMax=new THREE.Group(),gluteMed=new THREE.Group(),gluteMin=new THREE.Group();
  for(const group of [gluteMax,gluteMed,gluteMin]){group.position.copy(hip.position);bodyRoot.add(group)}
  ellipsoid(hip,[0,0,0],[.14,.15,.14],jointMat,'femur');
  const hipMarker=ellipsoid(hip,[0,0,.22],[.075,.075,.075],markerMat,'hipjoint');hipMarker.userData.side=side;hipMarker.userData.jointKey='hip';
  longBone(hip,[0,-.08,0],[s*.02,-.94,0],.103,'femur');
  rod(hip,[0,-.03,0],[s*.14,-.16,-.015],.063,boneMat,'femur');
  ellipsoid(hip,[s*.14,-.16,-.015],[.105,.12,.09],boneMat,'femur');
  for(const offset of [-.09,.09])ellipsoid(hip,[offset,-.91,0],[.10,.085,.09],boneMat,'femur');
  const quad=muscleBelly(hip,[0,-.46,.14],[.18,.38,.135],muscleMat,'quadriceps');quad.rotation.z=s*.04;
  muscleBelly(hip,[0,-.47,-.13],[.17,.38,.13],muscleDark,'hamstrings');
  ellipsoid(hip,[s*.13,-.10,-.15],[.25,.23,.13],muscleMat,'gluteus');
  ellipsoid(hip,[s*.09,-.17,-.28],[.27,.28,.13],muscleDark,'gluteusmaximus');
  ellipsoid(hip,[s*.16,-.13,-.055],[.12,.16,.055],muscleDark,'gluteusminimus');
  ellipsoid(hip,[s*.23,-.21,.08],[.075,.20,.075],muscleMat,'tensorfasciae');
  ellipsoid(hip,[-s*.12,-.39,.13],[.08,.32,.07],muscleDark,'adductorlongus');
  curve(hip,[[s*.19,-.06,.19],[s*.06,-.33,.25],[-s*.13,-.77,.20]],.033,muscleMat,'sartorius');
  curve(hip,[[s*.18,.07,-.15],[s*.19,-.07,-.08],[s*.11,-.22,-.02]],.044,muscleMat,'iliopsoas');
  ellipsoid(hip,[0,-.42,0],[.25,.49,.24],surfaceMat);
  const knee=new THREE.Group();knee.position.set(s*.015,-.94,0);hip.add(knee);
  ellipsoid(knee,[0,.015,.12],[.13,.13,.07],boneMat,'patella');
  const kneeMarker=ellipsoid(knee,[0,0,.22],[.06,.06,.06],markerMat,'kneejoint');kneeMarker.userData.side=side;kneeMarker.userData.jointKey='knee';
  longBone(knee,[s*-.025,-.05,0],[s*-.025,-.86,0],.082,'tibia');
  ellipsoid(knee,[0,-.055,0],[.14,.07,.12],boneMat,'tibia');
  longBone(knee,[s*.10,-.09,-.025],[s*.10,-.84,-.025],.040,'fibula');
  muscleBelly(knee,[s*-.04,-.40,.14],[.115,.32,.095],muscleMat,'tibialis');
  muscleBelly(knee,[s*.02,-.38,-.12],[.155,.30,.13],muscleDark,'gastrocnemius');
  muscleBelly(knee,[s*.01,-.57,-.10],[.12,.23,.10],muscleMat,'soleus');
  const ankle=new THREE.Group();ankle.position.set(0,-.87,0);knee.add(ankle);
  const ankleMarker=ellipsoid(ankle,[0,0,.04],[.06,.06,.06],markerMat,'anklejoint');ankleMarker.userData.side=side;ankleMarker.userData.jointKey='ankle';
  ellipsoid(ankle,[0,-.015,.075],[.11,.07,.12],boneMat,'talus');
  ellipsoid(ankle,[0,-.12,-.095],[.13,.10,.14],boneMat,'calcaneus');
  ellipsoid(ankle,[-s*.055,-.015,.20],[.065,.055,.06],boneMat,'navicular');
  ellipsoid(ankle,[s*.075,-.075,.22],[.065,.06,.075],boneMat,'cuboid');
  for(let j=0;j<3;j++)ellipsoid(ankle,[-s*.095+s*j*.055,-.02,.30],[.027,.045,.05],boneMat,'cuneiforms');
  ellipsoid(ankle,[0,-.085,.20],[.13,.045,.14],boneMat,'foot');
  for(let j=-2;j<=2;j++){
    const x=j*.052;
    rod(ankle,[x*.7,-.06,.28],[x,-.05,.49],.022,boneMat,'metatarsals');
    const count=j===-2*s?2:3;
    for(let k=0;k<count;k++)rod(ankle,[x,-.05,.50+k*.05],[x*1.04,-.045,.545+k*.05],.013,boneMat,'toephalanges');
  }
  return {hip,knee,ankle,gluteMax,gluteMed,gluteMin};
}
function groundedPose(value,torsoDegrees,thighDegrees,kneeDegrees){
  const t=THREE.MathUtils.clamp(value/100,0,1);
  const torso=THREE.MathUtils.degToRad(torsoDegrees*t);
  const thigh=THREE.MathUtils.degToRad(thighDegrees*t);
  const knee=THREE.MathUtils.degToRad(kneeDegrees*t);
  const axis=new THREE.Vector3(1,0,0),center=new THREE.Vector3(),shift=new THREE.Vector3();
  for(const side of ['R','L']){
    const leg=legs[side],upper=leg.knee.position,lower=leg.ankle.position;
    center.add(leg.hip.position);
    shift.add(upper).add(lower)
      .sub(upper.clone().applyAxisAngle(axis,thigh))
      .sub(lower.clone().applyAxisAngle(axis,thigh+knee));
  }
  center.multiplyScalar(.5);shift.multiplyScalar(.5);
  return {torso,thigh,knee,ankle:-(thigh+knee),position:center.clone().sub(center.clone().applyAxisAngle(axis,torso)).add(shift)};
}
function hipHingePose(value){return groundedPose(value,55,-8,12)}
function squatPose(value){return groundedPose(value,20,-30,60)}
function applyExamplePose(m,value){
  const t=THREE.MathUtils.clamp(value/100,0,1),ease=t*t*(3-2*t),deg=THREE.MathUtils.degToRad;
  if(m.grounded){
    const motion=groundedPose(m.reverse?100-value:value,...m.grounded);
    bodyRoot.rotation.x=motion.torso;bodyRoot.position.copy(motion.position);
    for(const side of ['R','L']){
      legs[side].hip.rotation.x=motion.thigh-motion.torso;
      legs[side].knee.rotation.x=motion.knee;
      legs[side].ankle.rotation.x=motion.ankle;
    }
  }
  const phases=m.phases;
  const keys=phases?new Set(phases.flatMap(phase=>Object.keys(phase.pose))):new Set([...Object.keys(m.from||{}),...Object.keys(m.pose||{})]);
  for(const key of keys){
    const keyPhases=phases?.filter(phase=>key in phase.pose);
    const previous=keyPhases?[...keyPhases].reverse().find(phase=>phase.at<=value)||{at:0,pose:{[key]:[0,0,0]}}:null;
    const next=keyPhases?keyPhases.find(phase=>phase.at>=value)||previous:null;
    const phaseT=keyPhases&&next.at>previous.at?THREE.MathUtils.clamp((value-previous.at)/(next.at-previous.at),0,1):0;
    const phaseEase=smootherStep(phaseT);
    const initial=phases?previous.pose[key]:m.from?.[key]||[0,0,0],final=phases?next.pose[key]:m.pose?.[key]||[0,0,0];
    const v=initial.map((n,i)=>n+(final[i]-n)*(phases?phaseEase:ease));
    if(key==='rootPosition'){bodyRoot.position.add(new THREE.Vector3(...v));continue}
    const target=key==='rootRotation'?bodyRoot:key==='head'?headGroup:key==='jaw'?jawGroup:key.endsWith('L')?(arms.L[key.slice(0,-1)]||legs.L[key.slice(0,-1)]):(arms.R[key.slice(0,-1)]||legs.R[key.slice(0,-1)]);
    if(target)target.rotation.set(deg(v[0]),deg(v[1]),deg(v[2]));
  }
}
function applyPose(){
  if(!arms.R||!legs.R)return;
  bodyRoot.position.set(0,0,0);bodyRoot.rotation.set(0,0,0);
  for(const side of ['R','L']){
    arms[side].shoulder.rotation.set(0,0,0);arms[side].elbow.rotation.set(0,0,0);arms[side].forearm.rotation.set(0,0,0);arms[side].wrist.rotation.set(0,0,0);
    legs[side].hip.rotation.set(0,0,0);legs[side].knee.rotation.set(0,0,0);legs[side].ankle.rotation.set(0,0,0);
  }
  headGroup.rotation.set(0,0,0);
  jawGroup.rotation.set(0,0,0);
  const deg=THREE.MathUtils.degToRad;
  if(poseMode==='free'){
    for(const side of ['R','L']){
      const a=freeAngles[side],direction=side==='R'?-1:1;
      arms[side].shoulder.rotation.set(-deg(a.shoulder.flex),direction*deg(a.shoulder.rot),direction*deg(a.shoulder.abd));
      arms[side].elbow.rotation.x=-deg(a.elbow.flex);
      arms[side].forearm.rotation.y=(side==='R'?1:-1)*deg(a.radioulnar.pron);
      arms[side].wrist.rotation.x=-deg(a.wrist.flex);
      legs[side].hip.rotation.set(-deg(a.hip.flex),direction*deg(a.hip.rot),direction*deg(a.hip.abd));
      legs[side].knee.rotation.x=deg(a.knee.flex);
      legs[side].ankle.rotation.x=-deg(a.ankle.dorsi);
    }
    headGroup.rotation.set(deg(freeAngles.C.neck.flex),deg(freeAngles.C.neck.rot),0);
    jawGroup.rotation.x=deg(freeAngles.C.tmj.open);
  }else{
    const m=movements[activeMovement],visualProgress=guidedFraction(m)*100,rad=deg(m.maxAngle*visualProgress/100);
    if(m.id==='shoulder')armR.shoulder.rotation.z=-rad;
    if(m.id==='shoulderflex')armR.shoulder.rotation.x=-rad;
    if(m.id==='elbow')armR.elbow.rotation.x=-rad;
    if(m.id==='hipflex')legR.hip.rotation.x=-rad;
    if(m.id==='hipabd')legR.hip.rotation.z=-rad;
    if(m.id==='knee')legR.knee.rotation.x=rad;
    if(m.id==='ankle')legR.ankle.rotation.x=-rad;
    if(m.id==='plantar')legR.ankle.rotation.x=rad;
    if(m.id==='hiprot')legR.hip.rotation.y=-rad;
    if(m.id==='hiphinge'||m.id==='squat'){
      const motion=m.id==='hiphinge'?hipHingePose(visualProgress):squatPose(visualProgress);
      bodyRoot.rotation.x=motion.torso;bodyRoot.position.copy(motion.position);
      for(const side of ['R','L']){
        legs[side].hip.rotation.x=motion.thigh-motion.torso;
        legs[side].knee.rotation.x=motion.knee;
        legs[side].ankle.rotation.x=motion.ankle;
      }
    }
    if(m.base)applyExamplePose(m,progress);
  }
  for(const side of ['R','L']){
    const leg=legs[side],hip=leg.hip.rotation;
    for(const [key,share] of [['gluteMax',.24],['gluteMed',.32],['gluteMin',.38]]){
      leg[key].rotation.set(hip.x*share,hip.y*share,hip.z*share);
    }
  }
  updateMuscleDeformation();updateMuscleSeparations();updatePlaneGuide();
}
function muscleAnchors(info){
  const suffix=info.name.includes('left ')?'L':'';
  const id=info.structure;
  if(id==='deltoid')return ['static','shoulder'+suffix,'down'];
  if(['pectoralis','supraspinatus','infraspinatus','subscapularis','teresminor','teresmajor'].includes(id))return ['static','shoulder'+suffix,'out'];
  if(id==='coracobrachialis')return ['static','shoulder'+suffix,'down'];
  if(id==='neckmuscles'||id==='scalenes')return ['static','head','up'];
  if(id==='deepneck')return ['static','head','up'];
  if(id==='suprahyoid'||id==='tonguemuscles')return ['head','jaw','down'];
  // La escápula y la clavícula permanecen fijas en este visor: sus músculos no deben seguir al húmero.
  if(id==='levatorscapulae'||id==='trapezius'&&info.name.includes('descending part'))return ['head','static','down'];
  if(['gluteus','gluteusmaximus','gluteusminimus','iliopsoas','hiprotators','adductorlongus','adductors'].includes(id))return ['static','hip'+suffix,'down'];
  if(id==='biceps')return ['static','forearm'+suffix,'down','shoulder'+suffix];
  if(id==='brachioradialis')return ['elbow'+suffix,'forearm'+suffix,'down','forearm'+suffix];
  if(id==='triceps'&&info.name.includes('long head of'))return ['static','elbow'+suffix,'down','shoulder'+suffix];
  if(['triceps','brachialis','anconeus'].includes(id))return ['shoulder'+suffix,'elbow'+suffix,'down'];
  if(['forearmflexors','forearmextensors','wristflexors','wristextensors','thumbtendons'].includes(id))return ['elbow'+suffix,'wrist'+suffix,'down','forearm'+suffix];
  if(['pronators','supinator'].includes(id))return ['elbow'+suffix,'forearm'+suffix,'down'];
  if(id==='tensorfasciae')return ['static','hip'+suffix,'down'];
  if(id==='hamstrings'&&info.name.includes('short head of'))return ['knee'+suffix,'knee'+suffix];
  if(id==='sartorius'||info.name.includes('rectus femoris')||id==='hamstrings')return ['static','knee'+suffix,'down','hip'+suffix];
  if(['quadriceps','hamstrings'].includes(id))return ['hip'+suffix,'knee'+suffix,'down'];
  // Las mallas de pierna representan sobre todo el vientre muscular; se fijan al segmento tibial.
  // El tendón distal no es una malla anatómica independiente y no debe separar el vientre del hueso al mover el tobillo.
  if(['gastrocnemius','tibialis','soleus','lowerlegmuscles'].includes(id))return ['knee'+suffix,'knee'+suffix];
  return null;
}
function muscleDominant(info,anchors){
  const gluteGroup={gluteusmaximus:'gluteMax',gluteus:'gluteMed',gluteusminimus:'gluteMin'}[info.structure];
  if(gluteGroup)return gluteGroup+(info.name.includes('left ')?'L':'');
  if(['pectoralis','supraspinatus','infraspinatus','subscapularis','teresminor','teresmajor','iliopsoas','hiprotators','tensorfasciae'].includes(info.structure))return 'static';
  return anchors[3]||(anchors[0]==='static'?anchors[1]:anchors[0]);
}
function muscleMotionWeights(anchors,info){
  const keys=[...new Set([anchors[0],anchors[1],anchors[3]].filter(Boolean))];
  if(keys.length===1)return [{key:keys[0],weight:1}];
  if(keys.length===2&&keys.includes('static')&&['trapezius','rhomboids','serratus','pectoralisminor','subclavius','scalenes'].includes(info?.structure))
    return keys.map(key=>({key,weight:key==='static'?.78:.22}));
  const dominant=muscleDominant(info,anchors);
  const mainWeight=keys.length===2?.92:.90;
  return keys.map(key=>({key,weight:key===dominant?mainWeight:(1-mainWeight)/(keys.length-1)}));
}
function blendMuscleDeltas(weights,delta){
  const position=new THREE.Vector3(),rotation=new THREE.Quaternion(),scale=new THREE.Vector3();
  const partPosition=new THREE.Vector3(),partRotation=new THREE.Quaternion();
  let accumulated=0;
  for(const {key,weight} of weights){
    delta[key].decompose(partPosition,partRotation,scale);
    position.addScaledVector(partPosition,weight);
    if(accumulated===0)rotation.copy(partRotation);
    else rotation.slerp(partRotation,weight/(accumulated+weight));
    accumulated+=weight;
  }
  return {position,rotation};
}
function muscleJointPivot(rig,dominant,anchor){
  return rig[anchor==='static'?dominant:anchor];
}
function updateMuscleDeformation(){
  if(!bodyRoot)return;
  bodyRoot.updateMatrixWorld(true);
  const rootInverse=bodyRoot.matrixWorld.clone().invert(),delta={static:new THREE.Matrix4().identity()};
  for(const key of Object.keys(neutralRigInverse)){
    const node=key==='head'?headGroup:key==='jaw'?jawGroup:key.endsWith('L')?(arms.L[key.slice(0,-1)]||legs.L[key.slice(0,-1)]):(arms.R[key]||legs.R[key]);
    if(node)delta[key]=rootInverse.clone().multiply(node.matrixWorld).multiply(neutralRigInverse[key]);
  }
  for(const binding of muscleMotionBindings){
    const {position,rotation}=blendMuscleDeltas(binding.weights,delta);
    binding.group.position.copy(position);binding.group.quaternion.copy(rotation);binding.group.updateMatrix();
  }
  if(!tendonLines)return;
  const position=tendonLines.geometry.attributes.position;
  const start=new THREE.Vector3(),end=new THREE.Vector3();
  for(let i=0;i<tendonBindings.length;i++){
    const link=tendonBindings[i];
    start.copy(link.point).applyMatrix4(link.follower?link.follower.matrix:delta[link.dominant]);
    end.copy(link.point).applyMatrix4(delta[link.anchor]);
    const reach=end.distanceTo(start);
    if(reach>.22)end.lerp(start,1-.22/reach);
    position.setXYZ(i*2,start.x,start.y,start.z);
    position.setXYZ(i*2+1,link.enabled?end.x:start.x,link.enabled?end.y:start.y,link.enabled?end.z:start.z);
  }
  position.needsUpdate=true;
}
function muscleEndpoint(mesh,toRoot,pivot){
  const positions=mesh.geometry.attributes.position,point=new THREE.Vector3();
  let closest=Infinity;
  for(let i=0;i<positions.count;i++){
    point.fromBufferAttribute(positions,i).applyMatrix4(toRoot);
    closest=Math.min(closest,point.distanceToSquared(pivot));
  }
  const limit=(Math.sqrt(closest)+.025)**2;
  const center=new THREE.Vector3();let count=0;
  for(let i=0;i<positions.count;i++){
    point.fromBufferAttribute(positions,i).applyMatrix4(toRoot);
    if(point.distanceToSquared(pivot)<=limit){center.add(point);count++}
  }
  return center.multiplyScalar(1/Math.max(1,count));
}
function muscleSpreadDirections(rootCenter,bodyCenter,bodyRadii,side){
  const delta=rootCenter.clone().sub(bodyCenter);
  // La profundidad del GLB es estrecha frente a su altura; se compensa para que
  // las capas anteriores y posteriores queden legibles al separar los grupos.
  const radial=V(delta.x/Math.max(bodyRadii.x,.1),delta.y/Math.max(bodyRadii.y,.1),delta.z/Math.max(bodyRadii.z,.1)*1.65);
  if(radial.lengthSq()<.05)radial.set(side==='L'?-1:1,0,0);
  radial.normalize();
  const project=(x,y,z,fallback)=>{const direction=V(x,y,z);return direction.lengthSq()<.08?fallback.clone():direction.normalize()};
  return {multi:radial,frontal:project(radial.x,radial.y,0,V(side==='L'?-1:1,0,0)),sagital:project(0,radial.y,radial.z,V(0,0,side==='L'?-1:1)),transversal:project(radial.x,0,radial.z,V(side==='L'?-1:1,0,0))};
}
function updateMuscleSeparations(){
  if(!bodyRoot||!anatomicalMuscles.length)return;
  const structure=structures.find(item=>item.id===activeStructure),selectedIsMuscle=structure?.type.startsWith('MÚSC');
  const separationMode=$('separation-plane').value,amount=Number($('explode-slider').value)*.0052;
  const bodyWorldQuaternion=bodyRoot.getWorldQuaternion(new THREE.Quaternion());
  for(const {mesh,base,directions,spreadScale} of anatomicalMuscles){
    const name=mesh.userData.anatomicalName||'';
    const selected=selectedIsMuscle&&mesh.userData.structure===activeStructure&&(!selectedMeshName||name===selectedMeshName)&&(!selectedStructureSide||selectedStructureSide==='R'&&!name.includes('left ')||selectedStructureSide==='L'&&!name.includes('right '));
    const parentWorldQuaternion=mesh.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
    const localDirection=directions[separationMode].clone().applyQuaternion(bodyWorldQuaternion).applyQuaternion(parentWorldQuaternion).normalize();
    mesh.position.copy(base).addScaledVector(localDirection,amount*spreadScale*(separateSelected?Number(selected):1));
  }
}
function updateLayers(){
  if(!bodyRoot)return;
  const separationMode=$('separation-plane').value;
  const visible={bones:$('layer-bones').checked,muscles:$('layer-muscles').checked,surface:$('layer-surface').checked,markers:$('layer-markers').checked};
  const selected=new Set([activeStructure,...(relatedMeshes[activeStructure]||[])]);
  const structure=structures.find(item=>item.id===activeStructure);
  const selectedIsMuscle=structure?.type.startsWith('MÚSC');
  const depthStage=$('muscle-depth')?.value||'all';
  const muscleDepth=name=>{const n=(name||'').toLowerCase();if(/deep|profund|interosse|lumbrical|rotator|multifid|transvers|quadratus|pterygoid|subscapular|infraspinat|supraspinat/.test(n))return 'deep';if(/middle|intermed|medial|longissimus|iliocostalis|serratus posterior|flexor|extensor|adductor|vastus intermed/.test(n))return 'intermediate';return 'superficial'};
  bodyRoot.traverse(obj=>{if(!obj.isMesh||!obj.userData.layer)return;
    let show=visible[obj.userData.layer]&&!(anatomicalModelLoaded&&obj.userData.procedural&&(obj.userData.layer==='bones'||obj.userData.layer==='muscles'));
    if(obj.userData.layer==='muscles'&&depthStage!=='all')show=show&&muscleDepth(obj.userData.anatomicalName)===depthStage;
    if(isolateSelected&&obj.userData.layer==='muscles'){
      show=show&&selectedIsMuscle&&selected.has(obj.userData.structure);
      const name=obj.userData.anatomicalName||'';
      if(selectedStructureSide==='R'&&name.includes('left '))show=false;
      if(selectedStructureSide==='L'&&name.includes('right '))show=false;
    }
    if(isolateSelected&&obj.userData.layer==='bones'&&!selectedIsMuscle)show=show&&selected.has(obj.userData.structure);
    if(isolateSelected&&selectedMeshName&&selected.has(obj.userData.structure))show=show&&obj.userData.anatomicalName===selectedMeshName;
    obj.visible=show;
  });
  for(const {mesh} of anatomicalMuscles){
    const opacity=Number($('muscle-opacity').value)/100;
    for(const mat of new Set([mesh.userData.oldMaterial||mesh.material,mesh.material])){
      mat.transparent=opacity<1;mat.opacity=opacity;mat.depthWrite=opacity===1;mat.needsUpdate=true;
    }
  }
  updateMuscleSeparations();
  if(tendonLines){
    const selectedName=selectedMeshName;
    for(const link of tendonBindings){
      const matchesSide=selectedStructureSide!=='R'||!link.name.includes('left ');
      const matchesOtherSide=selectedStructureSide!=='L'||!link.name.includes('right ');
      link.enabled=(!isolateSelected||selectedIsMuscle&&selected.has(link.structure)&&(!selectedName||selectedName===link.name))&&matchesSide&&matchesOtherSide;
    }
    tendonLines.visible=visible.muscles&&Number($('explode-slider').value)===0;
    tendonLines.material.opacity=Number($('muscle-opacity').value)/100*.65;
    tendonLines.material.needsUpdate=true;
    updateMuscleDeformation();
  }
  $('explode-value').textContent=`${$('explode-slider').value}%`;
  $('fullscreen-explode-slider').value=$('explode-slider').value;
  $('fullscreen-explode-value').textContent=`${$('explode-slider').value}%`;
  $('fullscreen-separation-plane').value=separationMode;
  $('separate-selected').classList.toggle('active',separateSelected);
  $('separate-selected').setAttribute('aria-pressed',String(separateSelected));
  $('fullscreen-separate-selected').classList.toggle('active',separateSelected);
  $('fullscreen-separate-selected').setAttribute('aria-pressed',String(separateSelected));
  $('opacity-value').textContent=`${$('muscle-opacity').value}%`;
  $('isolate-structure').classList.toggle('active',isolateSelected);
  $('isolate-structure').setAttribute('aria-pressed',String(isolateSelected));
  $('explore-note').textContent=isolateSelected?`${structure?.name||'Estructura'} aislada; se conservan los huesos como referencia cuando es un músculo.`:separateSelected?selectedIsMuscle?`Separa ${selectedMeshName||structure.name}; el resto permanece en su sitio. Es una vista de estudio, no una posición anatómica.`:'Elige un músculo o una fibra para separarla de las demás.':`Separa todos los músculos en ${separationMode==='multi'?'varias direcciones 3D':`el plano ${separationMode}`}. Es una distribución didáctica, no anatómica.`;
  updatePlaneGuide();
}
function createPlaneGuides(){
  guideGroup=new THREE.Group();scene.add(guideGroup);planeMeshes={};
  for(const [id,p] of Object.entries(planes)){
    const dimensions={sagital:[1.05,5.25],frontal:[2.75,5.25],transversal:[2.75,1.45]}[id];
    const mesh=new THREE.Mesh(new THREE.PlaneGeometry(...dimensions),new THREE.MeshBasicMaterial({color:p.color,transparent:true,opacity:.11,side:THREE.DoubleSide,depthWrite:false,depthTest:false}));
    if(id==='sagital')mesh.rotation.y=Math.PI/2;
    if(id==='transversal')mesh.rotation.x=-Math.PI/2;
    mesh.userData.anatomicalPlaneRotation=mesh.quaternion.clone();
    const edge=new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry),new THREE.LineBasicMaterial({color:p.color,transparent:true,opacity:.75,depthTest:false}));mesh.add(edge);
    guideGroup.add(mesh);planeMeshes[id]=mesh;
  }
  axisArrow=new THREE.ArrowHelper(V(0,0,1),V(-.82,1.36,0),.55,0xd4aa76,.13,.065);guideGroup.add(axisArrow);
  axisArrow.line.material.depthTest=false;axisArrow.cone.material.depthTest=false;
  updatePlaneGuide();
}
function updatePlaneGuide(){
  if(!guideGroup)return;
  guideGroup.visible=$('layer-plane').checked;
  const m=movements[activeMovement],plane=poseMode==='free'?currentFreeAction().plane:m.plane;
  for(const [id,mesh] of Object.entries(planeMeshes))mesh.visible=id===plane;
  bodyRoot.updateMatrixWorld(true);
  const centerOffset=V(0,-.28,0).applyQuaternion(bodyRoot.getWorldQuaternion(new THREE.Quaternion()));
  const center=bodyRoot.getWorldPosition(new THREE.Vector3()).add(centerOffset);
  const anatomicalFrame=bodyRoot.getWorldQuaternion(new THREE.Quaternion());
  for(const mesh of Object.values(planeMeshes)){
    mesh.position.copy(center);
    mesh.quaternion.copy(anatomicalFrame).multiply(mesh.userData.anatomicalPlaneRotation);
    mesh.scale.setScalar(1);
  }
  const direction=plane==='sagital'?V(1,0,0):plane==='frontal'?V(0,0,1):V(0,1,0);
  direction.applyQuaternion(anatomicalFrame).normalize();
  axisArrow.setDirection(direction);axisArrow.setColor(new THREE.Color(planes[plane].color));
  axisArrow.setLength(.6,.14,.075);
  axisArrow.position.copy(center).add(V(-1.35,1.4,.08).applyQuaternion(anatomicalFrame));
}
function highlightStructure(){
  for(const mesh of highlighted){
    mesh.material=mesh.userData.oldMaterial;
    mesh.userData.highlightMaterial?.dispose();
    delete mesh.userData.oldMaterial;delete mesh.userData.highlightMaterial;
  }highlighted=[];
  if(!bodyRoot)return;
  const selected=new Set([activeStructure,...(relatedMeshes[activeStructure]||[])]);
  if(poseMode==='guided')for(const id of movements[activeMovement].highlightAll||[])selected.add(id);
  bodyRoot.traverse(obj=>{if(obj.isMesh&&obj.visible&&selected.has(obj.userData.structure)&&obj.parent.visible!==false){
    if(selectedMeshName&&obj.userData.anatomicalName!==selectedMeshName)return;
    if(poseMode==='free'&&obj.userData.jointKey&&obj.userData.side!==freeSide) return;
    const name=obj.userData.anatomicalName||'';
    if(selectedStructureSide==='R'&&name.includes('left '))return;
    if(selectedStructureSide==='L'&&name.includes('right '))return;
    obj.userData.oldMaterial=obj.material;
    const accent=obj.material.clone();
    accent.color.lerp(new THREE.Color(0xffe290),selectedMeshName?.72:.48);
    if(accent.emissive){accent.emissive.setHex(0x9b741c);accent.emissiveIntensity=selectedMeshName?.32:.18}
    obj.userData.highlightMaterial=accent;
    obj.material=accent;
    highlighted.push(obj)
  }});
}
function loadAnatomicalMeshes(){
  $('mesh-status').textContent='CARGANDO MALLAS ANATÓMICAS…';
  new GLTFLoader().load('./assets/bodyparts.glb',gltf=>{
    const savedProgress=progress,savedPoseMode=poseMode;
    poseMode='guided';progress=0;applyPose();
    const joints=Object.fromEntries(Object.entries(anatomicalJoints).map(([key,point])=>[key,V(...point)]));
    for(const side of ['R','L']){
      const suffix=side==='L'?'L':'',arm=arms[side],leg=legs[side];
      arm.shoulder.position.copy(joints[`shoulder${suffix}`]);
      arm.elbow.position.copy(joints[`elbow${suffix}`].clone().sub(joints[`shoulder${suffix}`]));
      arm.wrist.position.copy(joints[`wrist${suffix}`].clone().sub(joints[`elbow${suffix}`]));
      leg.hip.position.copy(joints[`hip${suffix}`]);
      for(const group of [leg.gluteMax,leg.gluteMed,leg.gluteMin])group.position.copy(leg.hip.position);
      leg.knee.position.copy(joints[`knee${suffix}`].clone().sub(joints[`hip${suffix}`]));
      leg.ankle.position.copy(joints[`ankle${suffix}`].clone().sub(joints[`knee${suffix}`]));
    }
    headGroup.position.copy(joints.neck);
    bodyRoot.add(gltf.scene);
    bodyRoot.updateMatrixWorld(true);
    const rig={static:bodyRoot,head:headGroup,jaw:jawGroup};
    for(const side of ['R','L'])for(const joint of ['shoulder','elbow','forearm','wrist','hip','knee','ankle'])rig[joint+(side==='L'?'L':'')]=arms[side][joint]||legs[side][joint];
    for(const side of ['R','L'])for(const group of ['gluteMax','gluteMed','gluteMin'])rig[group+(side==='L'?'L':'')]=legs[side][group];
    bodyRoot.updateMatrixWorld(true);
    const rootInverse=bodyRoot.matrixWorld.clone().invert();
    for(const [key,node] of Object.entries(rig))if(key!=='static')neutralRigInverse[key]=rootInverse.clone().multiply(node.matrixWorld).invert();
    const meshes=[];gltf.scene.traverse(obj=>{if(obj.isMesh)meshes.push(obj)});
    const bodyBounds=new THREE.Box3().setFromObject(gltf.scene);
    const bodyCenter=bodyBounds.getCenter(new THREE.Vector3()).applyMatrix4(rootInverse);
    const bodyRadii=bodyBounds.getSize(new THREE.Vector3()).multiplyScalar(.5);
    const muscleGroupCenters=new Map();
    for(const mesh of meshes){
      const info=meshManifest[mesh.name];if(info?.layer!=='muscles')continue;
      const side=info.name.includes('left ')?'L':'R',key=`${info.structure}:${side}`;
      const center=new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()).applyMatrix4(rootInverse);
      const entry=muscleGroupCenters.get(key)||{center:V(0,0,0),count:0};entry.center.add(center);entry.count++;muscleGroupCenters.set(key,entry);
    }
    for(const entry of muscleGroupCenters.values())entry.center.multiplyScalar(1/entry.count);
    const assignedColors=[],groupSpreadDirections=new Map();
    for(const mesh of meshes){
      const info=meshManifest[mesh.name];
      if(!info)continue;
      mesh.userData.layer=info.layer;mesh.userData.structure=info.structure;
      mesh.userData.anatomicalName=info.name;
      const anchors=info.layer==='muscles'?muscleAnchors(info):null;
      const colorIndex=info.layer==='muscles'?musclePaletteIndex(info,new THREE.Box3().setFromObject(mesh),assignedColors):null;
      if(anchors){
        mesh.updateMatrixWorld(true);
        const toRoot=rootInverse.clone().multiply(mesh.matrixWorld);
        const dominant=muscleDominant(info,anchors);
        const follower=dominant.startsWith('glute')?null:new THREE.Group();
        if(follower)bodyRoot.add(follower);
        for(const anchor of [anchors[0],anchors[1]])if(anchor!==dominant){
          const pivot=muscleJointPivot(rig,dominant,anchor).getWorldPosition(new THREE.Vector3()).applyMatrix4(rootInverse);
          tendonBindings.push({structure:info.structure,name:info.name,dominant,anchor,follower,point:muscleEndpoint(mesh,toRoot,pivot),enabled:true});
        }
        if(follower){
          follower.attach(mesh);
          muscleMotionBindings.push({group:follower,weights:muscleMotionWeights(anchors,info)});
        }else rig[dominant].attach(mesh);
      }else rig[info.structure==='mandible'?'jaw':info.segment].attach(mesh);
      if(info.layer==='muscles'){
        mesh.material=mesh.material.clone();
        mesh.material.color.setHex(musclePalette[colorIndex]);
        mesh.material.roughness=.78;mesh.material.metalness=0;
        mesh.material.transparent=false;mesh.material.opacity=1;mesh.material.depthWrite=true;
        mesh.geometry.computeBoundingBox();
        const side=info.name.includes('left ')?'L':'R',spreadKey=`${info.structure}:${side}`;
        const rootCenter=muscleGroupCenters.get(spreadKey)?.center||new THREE.Box3().setFromObject(mesh).getCenter(new THREE.Vector3()).applyMatrix4(rootInverse);
        let rootDirections=groupSpreadDirections.get(spreadKey);
        if(!rootDirections){rootDirections=muscleSpreadDirections(rootCenter,bodyCenter,bodyRadii,side);groupSpreadDirections.set(spreadKey,rootDirections)}
        const directions=Object.fromEntries(Object.entries(rootDirections).map(([plane,direction])=>[plane,direction.clone()]));
        anatomicalMuscles.push({mesh,base:mesh.position.clone(),directions,spreadScale:1,groupKey:spreadKey});
      }
      pickables.push(mesh);
    }
    if(tendonBindings.length){
      const geometry=new THREE.BufferGeometry();
      geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(tendonBindings.length*6),3).setUsage(THREE.DynamicDrawUsage));
      tendonLines=new THREE.LineSegments(geometry,new THREE.LineBasicMaterial({color:0xd2c5ae,transparent:true,opacity:.65,depthWrite:false}));
      tendonLines.frustumCulled=false;bodyRoot.add(tendonLines);
    }
    anatomicalModelLoaded=true;
    poseMode=savedPoseMode;progress=savedProgress;applyPose();
    updateLayers();renderStructures();highlightStructure();updatePlaneGuide();
    const boneCount=meshes.filter(mesh=>meshManifest[mesh.name]?.layer==='bones').length;
    const muscleCount=meshes.filter(mesh=>meshManifest[mesh.name]?.layer==='muscles').length;
    $('mesh-status').textContent=`${boneCount} MALLAS ÓSEAS · ${muscleCount} MUSCULARES · GLB`;
  },undefined,error=>{
    console.error('No se pudo cargar el archivo GLB',error);
    $('mesh-status').textContent='MODELO DIDÁCTICO DE RESPALDO';
  });
}
function updateCamera(){
  camera.position.set(distance*Math.sin(yaw)*Math.cos(pitch),distance*Math.sin(pitch),distance*Math.cos(yaw)*Math.cos(pitch)).add(cameraTarget);
  camera.lookAt(cameraTarget);
}
function focusSelection(){
  if(!camera||!highlighted.length)return;
  const box=new THREE.Box3(),part=new THREE.Box3();let found=false;
  for(const mesh of highlighted){
    if(!meshManifest[mesh.name])continue;
    part.setFromObject(mesh);
    if(part.isEmpty())continue;
    box.union(part);found=true;
  }
  if(!found)return;
  box.getCenter(cameraTarget);
  const sphere=box.getBoundingSphere(new THREE.Sphere());
  const vertical=2*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2);
  const horizontal=vertical*camera.aspect;
  setDistance(2.0*sphere.radius/Math.min(vertical,horizontal));
  updateCamera();
}
function setView(v){
  viewTarget={front:0,side:Math.PI/2,back:Math.PI}[v];
  document.querySelectorAll('[data-view]').forEach(b=>b.classList.toggle('active',b.dataset.view===v));
  $('stage-view').textContent=`VISTA ${v==='front'?'ANTERIOR':v==='side'?'LATERAL':'POSTERIOR'} · 3D`;
}
document.querySelectorAll('[data-view]').forEach(btn=>btn.addEventListener('click',()=>setView(btn.dataset.view)));
$('focus-selection').addEventListener('click',focusSelection);
function setDistance(next){distance=THREE.MathUtils.clamp(next,MIN_DISTANCE,MAX_DISTANCE);const label=`${Math.round(DEFAULT_DISTANCE/distance*100)} %`;$('zoom-level').textContent=label;$('model-zoom-value').textContent=label;$('model-zoom').value=String(Math.round(Math.log(MAX_DISTANCE/distance)/Math.log(MAX_DISTANCE/MIN_DISTANCE)*100))}
$('zoom-in').addEventListener('click',()=>setDistance(distance/1.3));
$('zoom-out').addEventListener('click',()=>setDistance(distance*1.3));
$('model-zoom').addEventListener('input',event=>setDistance(MAX_DISTANCE*Math.pow(MIN_DISTANCE/MAX_DISTANCE,Number(event.target.value)/100)));
setDistance(distance);
$('reset-view').addEventListener('click',()=>{setDistance(DEFAULT_DISTANCE);pitch=.07;cameraTarget.set(0,-.18,0);setView('front');});
const navPad=$('nav-pad'),navStick=$('nav-stick');
function setJoystick(event){const rect=navPad.getBoundingClientRect(),radius=rect.width*.34;const x=(event.clientX-rect.left-rect.width/2)/radius,y=(event.clientY-rect.top-rect.height/2)/radius;const length=Math.max(1,Math.hypot(x,y));navVector.x=x/length;navVector.y=y/length;navStick.style.transform=`translate(${navVector.x*radius}px,${navVector.y*radius}px)`;viewTarget=null}
function releaseJoystick(){navVector.x=0;navVector.y=0;navStick.style.transform='translate(0,0)'}
navPad.addEventListener('pointerdown',event=>{event.preventDefault();navPad.setPointerCapture(event.pointerId);setJoystick(event)});
navPad.addEventListener('pointermove',event=>{if(navPad.hasPointerCapture(event.pointerId))setJoystick(event)});
navPad.addEventListener('pointerup',releaseJoystick);navPad.addEventListener('pointercancel',releaseJoystick);navPad.addEventListener('lostpointercapture',releaseJoystick);
navPad.addEventListener('keydown',event=>{const step=.13;if(event.key==='ArrowLeft')yaw+=step;else if(event.key==='ArrowRight')yaw-=step;else if(event.key==='ArrowUp')pitch=Math.max(-.9,pitch-step);else if(event.key==='ArrowDown')pitch=Math.min(.9,pitch+step);else return;viewTarget=null;event.preventDefault()});
const stage=document.querySelector('.stage');
const explorer=document.querySelector('.explorer');
let resizeViewerCanvas=()=>{};
let mobileViewerOpen=false;
function syncMobileViewer(){
  const mobile=window.innerWidth<=760;
  if(!mobile)mobileViewerOpen=false;
  const active=mobile&&mobileViewerOpen;
  stage.classList.toggle('mobile-viewer-open',active);
  document.body.classList.toggle('mobile-viewer-active',active);
  stage.setAttribute('aria-hidden',String(mobile&&!active));
  $('mobile-viewer-open').setAttribute('aria-expanded',String(active));
  if(active){stage.setAttribute('role','dialog');stage.setAttribute('aria-modal','true');stage.setAttribute('aria-label','Visor anatómico 3D')}
  else{stage.removeAttribute('role');stage.removeAttribute('aria-modal');stage.removeAttribute('aria-label')}
}
function openMobileViewer(){
  if(window.innerWidth>760){stage.scrollIntoView({behavior:'smooth'});return}
  mobileViewerOpen=true;syncMobileViewer();
  document.querySelector('.viewer-layout-control').classList.remove('open');
  $('viewer-settings-toggle').setAttribute('aria-expanded','false');
  requestAnimationFrame(()=>requestAnimationFrame(()=>{resizeViewerCanvas();$('mobile-viewer-close').focus()}));
}
async function closeMobileViewer(){
  if(document.fullscreenElement===stage)await document.exitFullscreen();
  if(stage.classList.contains('expanded')){stage.classList.remove('expanded');document.body.classList.remove('viewer-expanded')}
  mobileViewerOpen=false;
  stage.classList.remove('mobile-viewer-open');
  document.body.classList.remove('mobile-viewer-active');
  $('mobile-viewer-open').focus();
  syncMobileViewer();
}
$('mobile-viewer-open').addEventListener('click',openMobileViewer);
$('mobile-viewer-close').addEventListener('click',closeMobileViewer);
document.addEventListener('keydown',event=>{if(event.key==='Escape'&&mobileViewerOpen&&!document.fullscreenElement)closeMobileViewer()});
document.addEventListener('focusin',event=>{if(mobileViewerOpen&&!stage.contains(event.target))$('mobile-viewer-close').focus()});
const stagePlaceholder=document.createElement('div');
stagePlaceholder.className='stage-placeholder panel';
stagePlaceholder.setAttribute('aria-hidden','true');
let viewerPinned=true,viewerDockQueued=false;
let viewerHidden=false;
function setViewerSize(){
  const size=Number($('viewer-size').value);
  document.documentElement.style.setProperty('--viewer-height',`${size}dvh`);
  document.documentElement.style.setProperty('--viewer-dock-width',`${Math.round(window.innerWidth<=760?120+size*2.5:280+size*4)}px`);
  $('viewer-size-value').textContent=`${size} %`;
  requestAnimationFrame(resizeViewerCanvas);
}
function updateViewerDock(){
  const shouldDock=window.innerWidth>760&&!viewerHidden&&viewerPinned&&explorer.getBoundingClientRect().bottom<=4&&!document.fullscreenElement&&!stage.classList.contains('expanded');
  if(shouldDock&&!stage.classList.contains('is-docked')){stage.before(stagePlaceholder);stage.classList.add('is-docked')}
  else if(!shouldDock&&stage.classList.contains('is-docked')){stage.classList.remove('is-docked');stagePlaceholder.remove()}
}
function setViewerHidden(hidden){
  viewerHidden=hidden;
  explorer.classList.toggle('viewer-hidden',hidden);
  $('restore-viewer').hidden=!hidden;
  $('hide-viewer').setAttribute('aria-expanded',String(!hidden));
  if(hidden&&stage.classList.contains('is-docked')){stage.classList.remove('is-docked');stagePlaceholder.remove()}
  else if(!hidden){stage.scrollIntoView({behavior:'smooth',block:'center'});queueViewerDock()}
}
$('hide-viewer').addEventListener('click',()=>setViewerHidden(true));
$('restore-viewer').addEventListener('click',()=>setViewerHidden(false));
function queueViewerDock(){if(viewerDockQueued)return;viewerDockQueued=true;requestAnimationFrame(()=>{viewerDockQueued=false;updateViewerDock()})}
$('viewer-size').addEventListener('input',()=>{setViewerSize();queueViewerDock()});
$('viewer-settings-toggle').addEventListener('click',()=>{const open=document.querySelector('.viewer-layout-control').classList.toggle('open');$('viewer-settings-toggle').setAttribute('aria-expanded',String(open))});
$('viewer-pin').addEventListener('click',()=>{viewerPinned=!viewerPinned;$('viewer-pin').setAttribute('aria-pressed',String(viewerPinned));$('viewer-pin').textContent=viewerPinned?'Fijado':'Fijar';$('viewer-pin').title=viewerPinned?'Dejar de fijar el visor':'Mantener el visor visible';queueViewerDock()});
window.addEventListener('scroll',queueViewerDock,{passive:true});
window.addEventListener('resize',()=>{syncMobileViewer();setViewerSize();queueViewerDock();requestAnimationFrame(resizeViewerCanvas)});
if(window.innerWidth<=760)$('viewer-size').value='72';
syncMobileViewer();setViewerSize();queueViewerDock();
function syncFullscreenButton(){const active=!!document.fullscreenElement||stage.classList.contains('expanded');$('fullscreen-view').setAttribute('aria-label',active?'Salir de pantalla completa':'Abrir visor en pantalla completa');$('fullscreen-view').innerHTML=active?'⛶ <span>Salir de pantalla completa</span>':'⛶ <span>Pantalla completa</span>'}
$('fullscreen-view').addEventListener('click',async()=>{if(document.fullscreenElement){await document.exitFullscreen();return}if(stage.classList.contains('expanded')){stage.classList.remove('expanded');document.body.classList.remove('viewer-expanded');syncFullscreenButton();return}try{if(!stage.requestFullscreen)throw Error('API no disponible');await stage.requestFullscreen()}catch{stage.classList.add('expanded');document.body.classList.add('viewer-expanded');syncFullscreenButton()}});
document.addEventListener('fullscreenchange',()=>{syncFullscreenButton();queueViewerDock();requestAnimationFrame(resizeViewerCanvas)});

let viewerInitPhase='preparación';
function init3D(){
  const canvas=$('body-canvas'),wrap=$('canvas-wrap');
  viewerInitPhase='creación del contexto WebGL';
  try{
    renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'high-performance',failIfMajorPerformanceCaveat:false});
  }catch(primaryError){
    console.warn('No se pudo crear el contexto WebGL de alto rendimiento; probando configuración compatible.',primaryError);
    try{renderer=new THREE.WebGLRenderer({canvas,antialias:false,alpha:true,powerPreference:'low-power',failIfMajorPerformanceCaveat:false})}
    catch(compatibilityError){compatibilityError.cause=primaryError;throw compatibilityError}
  }
  viewerInitPhase='configuración del renderizador';
  renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;
  scene=new THREE.Scene();camera=new THREE.PerspectiveCamera(37,1,.03,100);scene.add(new THREE.HemisphereLight(0xd5f2ea,0x41524b,2.3));
  const key=new THREE.DirectionalLight(0xffe7ce,3.0);key.position.set(-4,7,8);scene.add(key);
  const rim=new THREE.DirectionalLight(0x98d9c4,2.1);rim.position.set(5,3,-5);scene.add(rim);
  const floor=new THREE.GridHelper(7,14,0x41675d,0x26433f);floor.position.y=-2.68;floor.material.transparent=true;floor.material.opacity=.22;scene.add(floor);
  const circle=new THREE.Mesh(new THREE.RingGeometry(1.05,1.08,64),new THREE.MeshBasicMaterial({color:0x577c6b,transparent:true,opacity:.40,side:THREE.DoubleSide}));circle.rotation.x=-Math.PI/2;circle.position.y=-2.67;scene.add(circle);
  viewerInitPhase='construcción de la escena y el cuerpo';
  constructBody();createPlaneGuides();applyPose();updateLayers();highlightStructure();raycaster=new THREE.Raycaster();
  viewerInitPhase='ajuste del tamaño del visor';
  const resize=()=>{
    const rect=wrap.getBoundingClientRect(),width=Math.floor(rect.width),height=Math.floor(rect.height);
    if(!Number.isFinite(width)||!Number.isFinite(height)||width<1||height<1)return false;
    renderer.setSize(width,height,false);camera.aspect=width/height;camera.updateProjectionMatrix();return true;
  };
  resizeViewerCanvas=resize;
  if('ResizeObserver' in window)new ResizeObserver(resize).observe(wrap);else window.addEventListener('resize',resize,{passive:true});resize();
  viewerInitPhase='instalación de controles';
  const tooltip=document.createElement('div');tooltip.className='mesh-tooltip';tooltip.style.cssText='position:absolute;z-index:7;display:none;background:#f4eee2;color:#204037;border-radius:3px;padding:6px 9px;font-size:11px;font-weight:700;pointer-events:none;box-shadow:0 5px 20px #071c1a44';wrap.appendChild(tooltip);
  updateTouchSelection=(mesh=null)=>{
    const card=$('touch-selection');
    const item=structures.find(s=>s.id===(mesh?.userData.structure||activeStructure));
    const anatomicalName=mesh?.userData.anatomicalName||selectedMeshName;
    if(!item||!anatomicalName){card.hidden=true;return}
    const side=mesh?.userData.side||(anatomicalName.includes('right ')?'R':anatomicalName.includes('left ')?'L':null);
    $('touch-selection-kicker').textContent=item.type.startsWith('MÚSC')?'MÚSCULO SELECCIONADO':'ESTRUCTURA SELECCIONADA';
    $('touch-selection-name').textContent=item.name;
    $('touch-selection-detail').textContent=`${anatomicalName}${side?` · lado ${side==='R'?'derecho':'izquierdo'}`:''}`;
    card.hidden=false;
  };
  $('touch-selection-focus').addEventListener('click',focusSelection);
  function hit(e){const r=canvas.getBoundingClientRect();const p=new THREE.Vector2((e.clientX-r.left)/r.width*2-1,-(e.clientY-r.top)/r.height*2+1);raycaster.setFromCamera(p,camera);return raycaster.intersectObjects(pickables,false).find(hit=>{let node=hit.object;while(node){if(node.visible===false)return false;node=node.parent}return true})?.object;}
  const pointers=new Map();let pointerMoved=false,suppressSelection=false,pinchSpan=0,lastX=0,lastY=0;
  const panRight=new THREE.Vector3(),panUp=new THREE.Vector3();
  function panView(dx,dy){
    const scale=2*distance*Math.tan(THREE.MathUtils.degToRad(camera.fov)/2)/Math.max(1,canvas.clientHeight);
    panRight.set(Math.cos(yaw),0,-Math.sin(yaw));
    panUp.set(-Math.sin(yaw)*Math.sin(pitch),Math.cos(pitch),-Math.cos(yaw)*Math.sin(pitch));
    cameraTarget.addScaledVector(panRight,-dx*scale).addScaledVector(panUp,dy*scale);
  }
  const span=()=>{const [a,b]=[...pointers.values()];return Math.hypot(a.x-b.x,a.y-b.y)};
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  canvas.addEventListener('pointerdown',e=>{if(e.pointerType==='mouse'&&e.button!==0&&e.button!==2)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:e.pointerType==='mouse'&&e.button===2});canvas.setPointerCapture(e.pointerId);if(pointers.size===1){pointerMoved=false;lastX=e.clientX;lastY=e.clientY}else{pinchSpan=span();suppressSelection=true;pointerMoved=true}canvas.style.cursor=e.button===2?'move':'grabbing';tooltip.style.display='none'});
  canvas.addEventListener('pointermove',e=>{
    if(pointers.has(e.pointerId)){const current=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY,pan:current.pan});if(pointers.size>1){const next=span();if(pinchSpan>0)setDistance(distance*pinchSpan/next);pinchSpan=next;pointerMoved=true}else{const dx=e.clientX-lastX,dy=e.clientY-lastY;if(Math.abs(dx)+Math.abs(dy)>2)pointerMoved=true;if(current.pan)panView(dx,dy);else{yaw-=dx*.008;pitch=Math.max(-.65,Math.min(.65,pitch+dy*.006));viewTarget=null}lastX=e.clientX;lastY=e.clientY}tooltip.style.display='none';}
    else{const mesh=hit(e);if(mesh){const item=structures.find(s=>s.id===mesh.userData.structure);tooltip.textContent=mesh.userData.jointKey?`${item?.name||''} · ${mesh.userData.side==='C'?'línea media':`lado ${mesh.userData.side==='R'?'derecho':'izquierdo'}`}`:mesh.userData.anatomicalName?`${item?.name||''} · ${mesh.userData.anatomicalName}`:item?.name||'';tooltip.style.left=`${e.offsetX+12}px`;tooltip.style.top=`${e.offsetY+12}px`;tooltip.style.display='block';canvas.style.cursor='pointer';}else{tooltip.style.display='none';canvas.style.cursor='grab';}}
  });
  canvas.addEventListener('pointerup',e=>{const select=pointers.size===1&&!pointers.get(e.pointerId)?.pan&&!pointerMoved&&!suppressSelection;pointers.delete(e.pointerId);canvas.style.cursor='grab';if(pointers.size===1){const remaining=[...pointers.values()][0];lastX=remaining.x;lastY=remaining.y}else if(pointers.size===0){pinchSpan=0;suppressSelection=false}if(select){const mesh=hit(e);if(mesh){const name=mesh.userData.anatomicalName||'',side=mesh.userData.side||(name.includes('right ')?'R':name.includes('left ')?'L':null);if(mesh.userData.jointKey){freeSide=side||freeSide;freeJoint=mesh.userData.jointKey;freeAction=jointExplorer[freeJoint].actions[0].id;setPoseMode('free')}else{selectStructure(mesh.userData.structure,{activateMotion:true,side,meshName:name});updateTouchSelection(mesh)}}}});
  canvas.addEventListener('pointercancel',e=>{pointers.delete(e.pointerId);canvas.style.cursor='grab';if(!pointers.size){pinchSpan=0;suppressSelection=false}});
  canvas.addEventListener('pointerleave',()=>tooltip.style.display='none');
  canvas.addEventListener('wheel',e=>{e.preventDefault();setDistance(distance*Math.exp(e.deltaY*.0012));},{passive:false});
  function frame(time){
    const dt=Math.min(50,time-lastTime||16);lastTime=time;
    if(window.innerWidth<=760&&!mobileViewerOpen){setTimeout(()=>requestAnimationFrame(frame),250);return}
    if(playing){progress+=dt*.027*Number($('motion-speed').value)*poseDirection;if(progress>=100){progress=100;if($('motion-repeat').checked)poseDirection=-1;else{playing=false;$('play-button').textContent='▶'}}if(progress<=0&&poseDirection<0){progress=0;poseDirection=1;if(!$('motion-repeat').checked){playing=false;$('play-button').textContent='▶'}}$('motion-slider').value=String(progress);applyPose();updateReadout()}
    if(viewTarget!==null){let delta=((viewTarget-yaw+Math.PI*3)%(Math.PI*2))-Math.PI;yaw+=delta*.12;if(Math.abs(delta)<.002)viewTarget=null}
    if(navVector.x||navVector.y){yaw-=navVector.x*dt*.0023;pitch=Math.max(-.9,Math.min(.9,pitch+navVector.y*dt*.0018))}
    updateCamera();renderer.render(scene,camera);requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
try{init3D();loadAnatomicalMeshes()}catch(error){
  console.error('No se pudo iniciar el visor 3D. Comprueba WebGL y la aceleración por hardware del navegador.',error);
  const fallback=$('canvas-fallback'),detail=String(error?.cause?.message||error?.message||'error desconocido').slice(0,180);
  fallback.textContent=`El visor 3D falló durante ${viewerInitPhase}. Comprueba WebGL y la aceleración por hardware. Detalle: ${detail}`;
  fallback.hidden=false;fallback.setAttribute('role','alert');
}
