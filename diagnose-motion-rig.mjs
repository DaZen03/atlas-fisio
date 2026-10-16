import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import manifest from './dist/assets/bodyparts-manifest.json' with {type:'json'};
import joints from './dist/assets/bodyparts-joints.json' with {type:'json'};

const source=fs.readFileSync('./dist/app.js','utf8');
const rigCode=source.slice(source.indexOf('function muscleAnchors('),source.indexOf('function updateLayers('));
const scope={THREE};vm.createContext(scope);vm.runInContext(rigCode,scope);
const bytes=fs.readFileSync('./dist/assets/bodyparts.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const root=new THREE.Group();root.add(gltf.scene);
const rig={static:root};
const head=new THREE.Group(),jaw=new THREE.Group();
head.position.fromArray(joints.neck);root.add(head);head.add(jaw);
rig.head=head;rig.jaw=jaw;
for(const side of ['R','L']){
  const suffix=side==='L'?'L':'';
  const shoulder=new THREE.Group(),elbow=new THREE.Group(),forearm=new THREE.Group(),wrist=new THREE.Group();
  const hip=new THREE.Group(),knee=new THREE.Group(),ankle=new THREE.Group();
  const gluteMax=new THREE.Group(),gluteMed=new THREE.Group(),gluteMin=new THREE.Group();
  shoulder.position.fromArray(joints[`shoulder${suffix}`]);root.add(shoulder);
  elbow.position.fromArray(joints[`elbow${suffix}`]).sub(shoulder.position);shoulder.add(elbow);
  elbow.add(forearm);wrist.position.fromArray(joints[`wrist${suffix}`]).sub(new THREE.Vector3().fromArray(joints[`elbow${suffix}`]));forearm.add(wrist);
  hip.position.fromArray(joints[`hip${suffix}`]);root.add(hip);
  for(const group of [gluteMax,gluteMed,gluteMin]){group.position.copy(hip.position);root.add(group)}
  knee.position.fromArray(joints[`knee${suffix}`]).sub(hip.position);hip.add(knee);
  ankle.position.fromArray(joints[`ankle${suffix}`]).sub(new THREE.Vector3().fromArray(joints[`knee${suffix}`]));knee.add(ankle);
  Object.assign(rig,{['shoulder'+suffix]:shoulder,['elbow'+suffix]:elbow,['forearm'+suffix]:forearm,['wrist'+suffix]:wrist,['hip'+suffix]:hip,['knee'+suffix]:knee,['ankle'+suffix]:ankle,['gluteMax'+suffix]:gluteMax,['gluteMed'+suffix]:gluteMed,['gluteMin'+suffix]:gluteMin});
}
root.updateMatrixWorld(true);
const neutralInverse=Object.fromEntries(Object.entries(rig).map(([key,node])=>[key,node.matrixWorld.clone().invert()]));
const records=[],point=new THREE.Vector3();
for(const id of ['rhomboids','serratus','pectoralisminor','subclavius']){
  const sample=Object.values(manifest).find(item=>item.structure===id);
  if(sample&&scope.muscleAnchors(sample))throw Error(`${id} sigue al húmero aunque la escápula o clavícula está fija`);
}
gltf.scene.traverse(obj=>{if(obj.isMesh&&manifest[obj.name]?.layer==='muscles')records.push({mesh:obj,info:manifest[obj.name]})});
const links=[];
const worldVertex=(mesh,i)=>new THREE.Vector3().fromBufferAttribute(mesh.geometry.attributes.position,i).applyMatrix4(mesh.matrixWorld);
for(const record of records){
  const {mesh,info}=record,positions=mesh.geometry.attributes.position;
  const vertexIds=[0,Math.floor(positions.count/2),positions.count-1];
  record.neutral=vertexIds.map(i=>worldVertex(mesh,i));
  record.edgeLength=record.neutral[0].distanceTo(record.neutral[1]);
  const anchors=scope.muscleAnchors(info);
  record.anchors=anchors;
  record.dominant=anchors?scope.muscleDominant(info,anchors):info.segment;
  if(['gluteusmaximus','gluteus','gluteusminimus'].includes(info.structure)&&!record.dominant.startsWith('glute'))throw Error(`Glúteo sin seguimiento: ${info.name}`);
  if(!rig[record.dominant])throw Error(`Segmento desconocido: ${info.name} → ${record.dominant}`);
  if(anchors){
    const toRoot=mesh.matrixWorld.clone();
    for(const anchor of [anchors[0],anchors[1]])if(anchor!==record.dominant){
      const pivot=scope.muscleJointPivot(rig,record.dominant,anchor).getWorldPosition(new THREE.Vector3());
      links.push({name:info.name,dominant:record.dominant,anchor,record,point:scope.muscleEndpoint(mesh,toRoot,pivot)});
    }
  }
  if(anchors&&!record.dominant.startsWith('glute')){
    record.follower=new THREE.Group();root.add(record.follower);record.follower.attach(mesh);
    record.weights=scope.muscleMotionWeights(anchors,info);
  }else rig[record.dominant].attach(mesh);
}
root.updateMatrixWorld(true);
let neutralError=0;
for(const record of records){
  const ids=[0,Math.floor(record.mesh.geometry.attributes.position.count/2),record.mesh.geometry.attributes.position.count-1];
  for(let i=0;i<3;i++)neutralError=Math.max(neutralError,record.neutral[i].distanceTo(worldVertex(record.mesh,ids[i])));
}
if(neutralError>1e-5)throw Error(`La unión al esqueleto cambia la posición neutral: ${neutralError}`);

const deg=THREE.MathUtils.degToRad;
const poses=[
  ['cuello',()=>rig.head.rotation.y=deg(50)],
  ['mandíbula',()=>rig.jaw.rotation.x=deg(20)],
  ['hombro',()=>rig.shoulder.rotation.z=-deg(90)],
  ['codo',()=>rig.elbow.rotation.x=-deg(135)],
  ['pronación',()=>rig.forearm.rotation.y=deg(85)],
  ['muñeca/mano',()=>rig.wrist.rotation.x=-deg(80)],
  ['codo izquierdo',()=>rig.elbowL.rotation.x=-deg(135)],
  ['pronación izquierda',()=>rig.forearmL.rotation.y=-deg(85)],
  ['muñeca izquierda',()=>rig.wristL.rotation.x=-deg(80)],
  ['cadera',()=>rig.hip.rotation.x=-deg(110)],
  ['cadera izquierda',()=>rig.hipL.rotation.x=-deg(110)],
  ['rodilla/isquios',()=>rig.knee.rotation.x=deg(120)],
  ['tobillo',()=>rig.ankle.rotation.x=deg(40)],
  ['tobillo izquierdo',()=>rig.ankleL.rotation.x=deg(40)],
  ['brazo izquierdo',()=>rig.shoulderL.rotation.z=deg(90)],
  ['pierna izquierda',()=>rig.kneeL.rotation.x=deg(120)],
];
const report=[];
const linkGaps=new Map();
const unmovedByPose=[];
for(const [name,setPose] of poses){
  for(const node of Object.values(rig))node.rotation.set(0,0,0);
  setPose();root.updateMatrixWorld(true);
  for(const suffix of ['', 'L'])for(const [key,share] of [['gluteMax',.24],['gluteMed',.32],['gluteMin',.38]]){
    const hip=rig['hip'+suffix].rotation;
    rig[key+suffix].rotation.set(hip.x*share,hip.y*share,hip.z*share);
  }
  root.updateMatrixWorld(true);
  const delta=Object.fromEntries(Object.entries(rig).map(([key,node])=>[key,node.matrixWorld.clone().multiply(neutralInverse[key])]));
  for(const record of records)if(record.follower){
    const {position,rotation}=scope.blendMuscleDeltas(record.weights,delta);
    record.follower.position.copy(position);record.follower.quaternion.copy(rotation);
  }
  root.updateMatrixWorld(true);
  let maxStretch=0,maxLink=0,maxLinkName='';
  const jointForPose={cuello:'head',mandíbula:'jaw',hombro:'shoulder',codo:'elbow',pronación:'forearm','muñeca/mano':'wrist','codo izquierdo':'elbowL','pronación izquierda':'forearmL','muñeca izquierda':'wristL',cadera:'hip','cadera izquierda':'hipL','rodilla/isquios':'knee',tobillo:'ankle','tobillo izquierdo':'ankleL','brazo izquierdo':'shoulderL','pierna izquierda':'kneeL'}[name];
  const unmoved=[];
  for(const record of records){
    const mesh=record.mesh,ids=[0,Math.floor(mesh.geometry.attributes.position.count/2),mesh.geometry.attributes.position.count-1];
    const moved=ids.map(i=>worldVertex(mesh,i));
    const length=moved[0].distanceTo(moved[1]);
    const anchors=record.anchors;
    if((anchors?.includes(jointForPose)||record.info.segment===jointForPose)&&Math.max(...moved.map((point,i)=>point.distanceTo(record.neutral[i])))<.001)unmoved.push(record.info.name);
    if(record.edgeLength>.002)maxStretch=Math.max(maxStretch,Math.abs(length/record.edgeLength-1));
    if(name.startsWith('cadera')&&record.dominant.startsWith('glute')){
      const side=name==='cadera'?'right ':'left ';
      if(record.info.name.startsWith(side)&&Math.max(...moved.map((point,i)=>point.distanceTo(record.neutral[i])))<.01)
        throw Error(`El glúteo no acompaña a la pierna: ${record.info.name}`);
    }
  }
  for(const link of links){
    const a=point.copy(link.point).applyMatrix4(link.record.follower?link.record.follower.matrixWorld:delta[link.dominant]).clone();
    const b=point.copy(link.point).applyMatrix4(rig[link.anchor].matrixWorld.clone().multiply(neutralInverse[link.anchor]));
    const gap=a.distanceTo(b);
    if(gap>maxLink){maxLink=gap;maxLinkName=link.name}
    const key=`${link.name} (${link.dominant}→${link.anchor})`;
    linkGaps.set(key,Math.max(linkGaps.get(key)||0,gap));
  }
  report.push({movimiento:name,desviación_máxima_de_fibras:maxStretch.toExponential(2),conexión_máxima_m:maxLink.toFixed(3),músculo:maxLinkName});
  unmovedByPose.push({name,unmoved});
  if(unmoved.length)throw Error(`${name}: músculos inmóviles: ${unmoved.join(', ')}`);
  if(maxStretch>1e-4)throw Error(`Estiramiento de malla en ${name}: ${maxStretch}`);
  if(maxLink>.40)throw Error(`Separación excesiva entre segmentos en ${name}: ${maxLink.toFixed(3)} m (${maxLinkName})`);
}
if(records.length!==404)throw Error(`Se esperaban 404 músculos; hay ${records.length}`);
console.table(report);
for(const item of unmovedByPose)console.log(`INMÓVILES ${item.name}: ${item.unmoved.length} ${item.unmoved.join(' | ')}`);
console.log([...linkGaps].sort((a,b)=>b[1]-a[1]).slice(0,25).map(([name,gap])=>`${gap.toFixed(3)} m ${name}`).join('\n'));
console.log(`${records.length} mallas musculares y ${links.length} conexiones revisadas; error neutral ${neutralError.toExponential(2)} m`);
