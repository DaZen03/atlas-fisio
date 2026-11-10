import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {movements} from './dist/data.js';
import joints from './dist/assets/bodyparts-joints.json' with {type:'json'};

const app=fs.readFileSync('./dist/app.js','utf8');
const advance=vm.runInNewContext(`${app.slice(app.indexOf('function playbackAdvance('),app.indexOf('function guidedFraction('))}\nplaybackAdvance`);
if(Math.abs(advance(200,1)-5.4)>1e-9||Math.abs(advance(500,1)-6.75)>1e-9||Math.abs(advance(200,2)-10.8)>1e-9)
  throw Error('La reproducción deja de seguir el tiempo real en fotogramas lentos');
const exerciseSource=fs.readFileSync('./dist/exercises.js','utf8');
const exercises=vm.runInNewContext(`${exerciseSource.slice(0,exerciseSource.indexOf('];')+2)}\nexercises`);
const poseCode=app.slice(app.indexOf('function groundedPose('),app.indexOf('function muscleAnchors('));
const bodyRoot=new THREE.Group(),headGroup=new THREE.Group(),jawGroup=new THREE.Group();
bodyRoot.add(headGroup);headGroup.add(jawGroup);
const arms={},legs={},scapulae={};
for(const side of ['R','L']){
  const suffix=side==='L'?'L':'';
  const arm=arms[side]=Object.fromEntries(['shoulder','elbow','forearm','wrist'].map(key=>[key,new THREE.Group()]));
  const leg=legs[side]=Object.fromEntries(['hip','knee','ankle','gluteMax','gluteMed','gluteMin'].map(key=>[key,new THREE.Group()]));
  bodyRoot.add(arm.shoulder,leg.hip);
  arm.shoulder.add(arm.elbow);arm.elbow.add(arm.forearm);arm.forearm.add(arm.wrist);
  leg.hip.add(leg.knee);leg.knee.add(leg.ankle);
  arm.shoulder.position.fromArray(joints[`shoulder${suffix}`]);
  arm.elbow.position.fromArray(joints[`elbow${suffix}`]).sub(arm.shoulder.position);
  arm.wrist.position.fromArray(joints[`wrist${suffix}`]).sub(new THREE.Vector3().fromArray(joints[`elbow${suffix}`]));
  leg.hip.position.fromArray(joints[`hip${suffix}`]);
  leg.knee.position.fromArray(joints[`knee${suffix}`]).sub(leg.hip.position);
  leg.ankle.position.fromArray(joints[`ankle${suffix}`]).sub(new THREE.Vector3().fromArray(joints[`knee${suffix}`]));
  scapulae[side]=new THREE.Group();bodyRoot.add(scapulae[side]);
}
const scope={THREE,bodyRoot,headGroup,jawGroup,arms,legs,scapulae,
  armR:arms.R,legR:legs.R,movements,poseMode:'guided',activeMovement:0,progress:0,
  guidedFraction(m){const t=THREE.MathUtils.clamp(this.progress/100,0,1);return m.base?t:t*t*t*(t*(t*6-15)+10)},
  smootherStep(t){t=THREE.MathUtils.clamp(t,0,1);return t*t*t*(t*(t*6-15)+10)},
  updateMuscleDeformation(){},updateMuscleSeparations(){},updatePlaneGuide(){}
};
// La función real usa variables léxicas: la fracción debe leer el avance del contexto.
scope.guidedFraction=function(m){const t=THREE.MathUtils.clamp(scope.progress/100,0,1);return m.base?t:scope.smootherStep(t)};
vm.createContext(scope);vm.runInContext(poseCode,scope);
const nodes=[bodyRoot,headGroup,jawGroup,...Object.values(arms).flatMap(Object.values),...Object.values(legs).flatMap(Object.values)];
const signature=()=>nodes.flatMap(node=>[node.rotation.x,node.rotation.y,node.rotation.z,...(node===bodyRoot?node.position.toArray():[])]);
const failures=[];
for(const [index,movement] of movements.entries()){
  scope.activeMovement=index;
  const frames=[];
  for(const progress of [0,25,50,75,100]){
    scope.progress=progress;scope.applyPose();frames.push(signature());
    if(frames.at(-1).some(value=>!Number.isFinite(value)))failures.push(`${movement.id}: valor no finito en ${progress}%`);
  }
  const range=Math.max(...frames[0].map((_,i)=>Math.max(...frames.map(frame=>frame[i]))-Math.min(...frames.map(frame=>frame[i]))));
  if(range<.025)failures.push(`${movement.id}: no cambia su pose durante la reproducción`);
  if(movement.id==='hiphinge'&&Math.abs(THREE.MathUtils.radToDeg(bodyRoot.rotation.x)-55)>.01)
    failures.push('hiphinge: el tronco no alcanza 55° al final');
}
for(const [id,node] of [['shoulderrot',arms.R.wrist],['hiprot',legs.R.ankle]]){
  scope.activeMovement=movements.findIndex(movement=>movement.id===id);
  const positions=[];
  for(const progress of [0,100]){
    scope.progress=progress;scope.applyPose();bodyRoot.updateMatrixWorld(true);
    positions.push(node.getWorldPosition(new THREE.Vector3()));
  }
  if(positions[0].distanceTo(positions[1])<.08)
    failures.push(`${id}: el extremo del miembro no muestra el giro axial`);
}
for(const exercise of exercises)if(!movements.some(movement=>movement.id===exercise.movement))
  failures.push(`Ejercicio ${exercise.id}: movimiento ${exercise.movement} inexistente`);
if(failures.length)throw Error(failures.join('\n'));
console.log(`${movements.length} gestos y ${exercises.length} enlaces de ejercicios: poses finitas y giros axiales con referencia distal.`);
