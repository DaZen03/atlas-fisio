import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import joints from './dist/assets/bodyparts-joints.json' with {type:'json'};

const source=fs.readFileSync('./dist/app.js','utf8');
const code=source.slice(source.indexOf('function groundedPose('),source.indexOf('function applyPose('));
const root=new THREE.Group(),legs={};
for(const side of ['R','L']){
  const suffix=side==='L'?'L':'';
  const hip=new THREE.Group(),knee=new THREE.Group(),ankle=new THREE.Group();
  hip.position.fromArray(joints[`hip${suffix}`]);root.add(hip);
  knee.position.fromArray(joints[`knee${suffix}`]).sub(hip.position);hip.add(knee);
  ankle.position.fromArray(joints[`ankle${suffix}`]).sub(new THREE.Vector3().fromArray(joints[`knee${suffix}`]));knee.add(ankle);
  legs[side]={hip,knee,ankle};
}
const scope={THREE,legs};vm.createContext(scope);vm.runInContext(code,scope);
for(const [motion,poseFor] of [['bisagra',scope.hipHingePose],['sentadilla',scope.squatPose]])for(const percent of [0,25,50,75,100]){
  const pose=poseFor(percent);
  root.rotation.x=pose.torso;root.position.copy(pose.position);
  let largestFootDrift=0;
  for(const side of ['R','L']){
    const suffix=side==='L'?'L':'',leg=legs[side];
    leg.hip.rotation.x=pose.thigh-pose.torso;
    leg.knee.rotation.x=pose.knee;
    leg.ankle.rotation.x=pose.ankle;
    root.updateMatrixWorld(true);
    const initial=new THREE.Vector3().fromArray(joints[`ankle${suffix}`]);
    largestFootDrift=Math.max(largestFootDrift,leg.ankle.getWorldPosition(new THREE.Vector3()).distanceTo(initial));
    if(Math.abs(leg.ankle.getWorldQuaternion(new THREE.Quaternion()).angleTo(new THREE.Quaternion()))>1e-6)throw Error(`El pie ${side} gira en ${motion} ${percent}%`);
  }
  if(largestFootDrift>.006)throw Error(`El pie se desliza ${largestFootDrift} m en ${motion} ${percent}%`);
  console.log(`${motion} ${percent}% · tronco ${(pose.torso*180/Math.PI).toFixed(1)}° · rodilla ${(pose.knee*180/Math.PI).toFixed(1)}° · deriva del tobillo ${(largestFootDrift*1000).toFixed(1)} mm`);
}
