import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';

const app=fs.readFileSync('./dist/app.js','utf8');
const code=app.slice(app.indexOf('function muscleSpreadDirections('),app.indexOf('function updateLayers('));
const scope={V:(x,y,z)=>new THREE.Vector3(x,y,z)};
vm.createContext(scope);vm.runInContext(code,scope);
const modes=['multi','frontal','sagital','transversal'];
const seen=new Set();
for(const side of ['L','R'])for(let slot=0;slot<28;slot++){
  const directions=scope.muscleSpreadDirections(new THREE.Vector3(side==='L'?-.3:.3,.7,slot%2?-.15:.2),slot,side);
  for(const mode of modes){
    const vector=directions[mode];
    if(!vector||!Number.isFinite(vector.length())||Math.abs(vector.length()-1)>1e-8)throw Error(`Dirección inválida: ${mode}/${side}/${slot}`);
    if(mode==='frontal'&&Math.abs(vector.z)>1e-10||mode==='sagital'&&Math.abs(vector.x)>1e-10||mode==='transversal'&&Math.abs(vector.y)>1e-10)throw Error(`El desplazamiento no queda en el plano ${mode}`);
    if(mode==='multi'&&slot%7!==3&&(!vector.x||!vector.y||!vector.z))throw Error(`No hay separación tridimensional en ${side}/${slot}`);
  }
  seen.add(directions.multi.toArray().map(n=>n.toFixed(3)).join(','));
}
if(seen.size<40)throw Error(`Direcciones insuficientemente diferenciadas: ${seen.size}`);
console.log(`${seen.size} direcciones musculares distintas; proyecciones frontal, sagital y transversal válidas.`);
