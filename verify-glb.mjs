import fs from 'node:fs';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import manifest from './dist/assets/bodyparts-manifest.json' with { type: 'json' };

const bytes=fs.readFileSync('./dist/assets/bodyparts.glb');
const data=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const gltf=await new GLTFLoader().parseAsync(data,'');
const meshes=[];
gltf.scene.traverse(object=>{if(object.isMesh)meshes.push(object)});
const missing=meshes.filter(mesh=>!manifest[mesh.name]);
const empty=meshes.filter(mesh=>!mesh.geometry.attributes.position?.count);
if(meshes.length!==610||missing.length||empty.length){
  throw new Error(`GLB: ${meshes.length} mallas, ${missing.length} sin ficha de origen, ${empty.length} vacías`);
}
console.log(`GLB compatible con GLTFLoader: ${meshes.length} mallas nombradas, ninguna vacía.`);
