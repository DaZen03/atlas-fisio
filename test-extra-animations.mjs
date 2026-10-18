import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {movements,structures} from './dist/data.js';
import joints from './dist/assets/bodyparts-joints.json' with {type:'json'};

const app=fs.readFileSync('./dist/app.js','utf8');
const code=app.slice(app.indexOf('function groundedPose('),app.indexOf('function applyPose('));
const bodyRoot=new THREE.Group(),headGroup=new THREE.Group(),jawGroup=new THREE.Group();
bodyRoot.add(headGroup);headGroup.add(jawGroup);
const arms={},legs={};
for(const side of ['R','L']){
  arms[side]=Object.fromEntries(['shoulder','elbow','forearm','wrist'].map(key=>[key,new THREE.Group()]));
  legs[side]=Object.fromEntries(['hip','knee','ankle'].map(key=>[key,new THREE.Group()]));
  const suffix=side==='L'?'L':'';
  const arm=arms[side],leg=legs[side];
  bodyRoot.add(arm.shoulder);arm.shoulder.add(arm.elbow);arm.elbow.add(arm.forearm);arm.forearm.add(arm.wrist);
  bodyRoot.add(leg.hip);leg.hip.add(leg.knee);leg.knee.add(leg.ankle);
  arm.shoulder.position.fromArray(joints[`shoulder${suffix}`]);
  arm.elbow.position.fromArray(joints[`elbow${suffix}`]).sub(arm.shoulder.position);
  arm.wrist.position.fromArray(joints[`wrist${suffix}`]).sub(new THREE.Vector3().fromArray(joints[`elbow${suffix}`]));
  legs[side].hip.position.fromArray(joints[`hip${suffix}`]);
  legs[side].knee.position.fromArray(joints[`knee${suffix}`]).sub(legs[side].hip.position);
  legs[side].ankle.position.fromArray(joints[`ankle${suffix}`]).sub(new THREE.Vector3().fromArray(joints[`knee${suffix}`]));
}
const scope={THREE,bodyRoot,headGroup,jawGroup,arms,legs,smootherStep(t){t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10)}};
vm.createContext(scope);vm.runInContext(code,scope);
const all=[bodyRoot,headGroup,jawGroup,...Object.values(arms.R),...Object.values(arms.L),...Object.values(legs.R),...Object.values(legs.L)];
const reset=()=>{for(const node of all)node.rotation.set(0,0,0);bodyRoot.position.set(0,0,0)};
const signature=()=>all.flatMap(node=>[...node.rotation.toArray().slice(0,3),...(node===bodyRoot?node.position.toArray():[])]).map(n=>Math.round(n*1000)/1000);
const extras=movements.filter(m=>m.base),signatures=new Set();
if(extras.length!==35)throw Error(`Se esperaban 35 secuencias; hay ${extras.length}`);
const requiredHighlights={
  chestpress:['pectoralis','deltoid','triceps'],
  overheadpress:['deltoid','triceps','serratus'],
  row:['latissimus','teresmajor','biceps','brachialis'],
  pullup:['latissimus','teresmajor','biceps','brachialis','brachioradialis']
};
for(const movement of extras){
  if(!structures.some(s=>s.id===movement.highlight))throw Error(`Sin estructura: ${movement.id}`);
  if(requiredHighlights[movement.id])for(const structure of requiredHighlights[movement.id]){
    if(!movement.highlightAll?.includes(structure))throw Error(`${movement.id} no resalta ${structure}`);
  }
  const frames=[];
  for(const progress of [0,25,50,75,100]){
    reset();scope.applyExamplePose(movement,progress);frames.push(signature());
    bodyRoot.updateMatrixWorld(true);
    if(movement.grounded)for(const side of ['R','L']){
      const suffix=side==='L'?'L':'';
      const foot=legs[side].ankle.getWorldPosition(new THREE.Vector3());
      const neutral=new THREE.Vector3().fromArray(joints[`ankle${suffix}`]);
      if(foot.distanceTo(neutral)>.012)throw Error(`Pie separado del apoyo en ${movement.id} ${progress}%: ${foot.distanceTo(neutral).toFixed(3)} m`);
    }
  }
  if(frames.some(frame=>frame.some(value=>!Number.isFinite(value))))throw Error(`Valor no finito: ${movement.id}`);
  for(let i=1;i<frames.length;i++){
    const largestStep=Math.max(...frames[i].map((value,j)=>Math.abs(value-frames[i-1][j])));
    if(largestStep>.85)throw Error(`Salto brusco entre fases en ${movement.id}, ${[0,25,50,75][i-1]}–${[25,50,75,100][i-1]}%, componente ${frames[i].findIndex((value,j)=>Math.abs(value-frames[i-1][j])===largestStep)}: ${largestStep.toFixed(2)}`);
  }
  if(JSON.stringify(frames[0])===JSON.stringify(frames[4]))throw Error(`La secuencia no cambia: ${movement.id}`);
  const key=JSON.stringify(frames);
  if(signatures.has(key))throw Error(`Secuencia duplicada: ${movement.id}`);
  signatures.add(key);
}
console.log(`${extras.length} secuencias adicionales con cinco fases finitas y recorridos distintos.`);
for(const movement of extras.filter(m=>m.category==='Deporte')){
  if(!movement.phases||movement.phases[0].at!==0||movement.phases.at(-1).at!==100)throw Error(`Faltan fases deportivas completas en ${movement.id}`);
  let previous=null;
  for(let progress=0;progress<=100;progress+=5){
    reset();scope.applyExamplePose(movement,progress);const current=signature();
    if(previous){const changes=current.map((value,j)=>Math.abs(value-previous[j])),step=Math.max(...changes);if(step>.4)throw Error(`Discontinuidad deportiva ${movement.id} en ${progress}%: componente ${changes.indexOf(step)}, ${step.toFixed(3)}`)}
    previous=current;
  }
}
console.log('Seis gestos deportivos revisados cada 5 % sin saltos articulares.');
const triceps=extras.find(m=>m.id==='tricepsext');
if(!triceps)throw Error('Falta la extensión de tríceps sobre cabeza');
for(const progress of [0,50,100]){
  reset();scope.applyExamplePose(triceps,progress);bodyRoot.updateMatrixWorld(true);
  for(const side of ['R','L']){
    const shoulder=arms[side].shoulder,elbow=arms[side].elbow;
    const upperArm=elbow.getWorldPosition(new THREE.Vector3()).sub(shoulder.getWorldPosition(new THREE.Vector3())).normalize();
    if(upperArm.y<.9)throw Error(`El brazo no queda elevado sobre la cabeza en ${side}/${progress}%: vertical=${upperArm.y.toFixed(3)}`);
    if(Math.abs(shoulder.rotation.x-THREE.MathUtils.degToRad(-165))>1e-6)throw Error(`El húmero cambia durante la extensión en ${side}/${progress}%`);
    const expected=-110+progress;
    if(Math.abs(THREE.MathUtils.radToDeg(elbow.rotation.x)-expected)>1e-6)throw Error(`Ángulo incorrecto del codo en ${side}/${progress}%`);
  }
}
console.log('Extensión de tríceps: ambos brazos elevados, hombros estables y 100° de extensión coordinada del codo.');
