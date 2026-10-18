const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..','dist');
const files=[];
function walk(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory())walk(file);else if(entry.name.endsWith('.html'))files.push(file)}}
walk(root);
const errors=[];
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  const pagePath=path.relative(root,file).split(path.sep).join('/');
  const pageUrl=new URL(pagePath,'https://atlas.test/');
  const baseHref=html.match(/<base\s+href="([^"]+)"/i)?.[1];
  const baseUrl=baseHref?new URL(baseHref,pageUrl):pageUrl;
  for(const match of html.matchAll(/\b(?:href|src)="([^"]+)"/g)){
    const ref=match[1];
    if(/^(?:https?:|data:|mailto:|tel:|javascript:)/i.test(ref)||ref.startsWith('#'))continue;
    const url=new URL(ref,baseUrl);
    if(url.host!=='atlas.test')continue;
    const target=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!target.startsWith(root+path.sep)&&target!==root){errors.push(`${pagePath}: ruta fuera de dist: ${ref}`);continue}
    if(!fs.existsSync(target)){errors.push(`${pagePath}: falta ${ref}`)}
  }
}
if(errors.length){console.error(errors.join('\n'));process.exitCode=1}
else console.log(`Enlaces locales y recursos comprobados en ${files.length} páginas HTML.`);
