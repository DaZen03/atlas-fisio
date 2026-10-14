import fs from 'node:fs';
import vm from 'node:vm';
import * as THREE from 'three';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader.js';
import manifest from './dist/assets/bodyparts-manifest.json' with {type:'json'};

const source=fs.readFileSync('./dist/app.js','utf8');
const code=source.slice(source.indexOf('const musclePalette='),source.indexOf('const V='));
const scope={THREE};vm.createContext(scope);vm.runInContext(code,scope);
const bytes=fs.readFileSync('./dist/assets/bodyparts.glb');
const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
const assigned=[];
gltf.scene.traverse(mesh=>{
  const info=manifest[mesh.name];
  if(!mesh.isMesh||info?.layer!=='muscles')return;
  const box=new THREE.Box3().setFromObject(mesh);
  scope.musclePaletteIndex(info,box,assigned);
});
let near=0,same=0;
for(let i=0;i<assigned.length;i++)for(let j=i+1;j<assigned.length;j++){
  if(!assigned[i].box.clone().expandByScalar(.045).intersectsBox(assigned[j].box))continue;
  near++;
  if(assigned[i].index===assigned[j].index)same++;
}
const distinct=new Set(assigned.map(item=>item.index)).size;
if(assigned.length!==392||distinct<10||same/near>.08)throw Error(`Contraste insuficiente: ${assigned.length} músculos, ${distinct} tonos, ${same}/${near} vecinos iguales`);
console.log(`${assigned.length} músculos, ${distinct} tonos; ${same}/${near} pares vecinos comparten tono (${(100*same/near).toFixed(1)} %).`);
