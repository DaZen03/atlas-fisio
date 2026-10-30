import {parseYouTubeLink,formatTimecode,parseTimecode} from './youtube-link.js?v=c363f63059d0';
const $ = id => document.getElementById(id);
const videoInput = $('video-file');
const video = $('source-video');
const stage = $('video-stage');
const overlay = $('pose-overlay');
const ctx = overlay.getContext('2d');
const progress = $('analysis-progress');
const movement = $('movement-choice');
const jointSelect = $('joint-choice');
const sideSelect = $('side-choice');
const chartJoint = $('chart-joint');
const chartSide = $('chart-side');
const chart = $('angle-chart');
const chartCtx = chart.getContext('2d');
const results = [];
let sourceUrl = '';
let worker = null;
let workerReady = false;
let cancelled = false;
let pendingPose = null;
let lastLandmarks = null;
let analysisRunning = false;
let lastInferenceTimestamp = 0;

const index = {
  left:{shoulder:11,elbow:13,wrist:15,hip:23,knee:25,ankle:27,heel:29,foot:31},
  right:{shoulder:12,elbow:14,wrist:16,hip:24,knee:26,ankle:28,heel:30,foot:32}
};
const triplets = {
  shoulder: side => [index[side].hip,index[side].shoulder,index[side].elbow],
  elbow: side => [index[side].shoulder,index[side].elbow,index[side].wrist],
  hip: side => [index[side].shoulder,index[side].hip,index[side].knee],
  knee: side => [index[side].hip,index[side].knee,index[side].ankle],
  ankle: side => [index[side].knee,index[side].ankle,index[side].foot]
};
const jointLabels = {shoulder:'Hombro',elbow:'Codo',hip:'Cadera',knee:'Rodilla',ankle:'Tobillo'};
const configs = {
  hiphinge:{joint:'hip',side:'left',route:'./biomecanica/bisagra.html',movement:'hiphinge'},
  squat:{joint:'knee',side:'left',route:'./biomecanica/sentadilla.html',movement:'squat'},
  curl:{joint:'elbow',side:'left',route:'./biomecanica/curl.html',movement:'curl'},
  chestpress:{joint:'elbow',side:'left',route:'./biomecanica/press-pecho.html',movement:'chestpress'},
  legextension:{joint:'knee',side:'left',route:'./biomecanica/extension-rodilla.html',movement:'legextension'},
  walking:{joint:'knee',side:'left',route:'./index.html?movimiento=walkstep#explorar',movement:'walkstep'},
  other:{joint:'knee',side:'left',route:'./index.html?movimiento=squat#explorar',movement:'squat'}
};

function updateStartState(){
  const allowed = !!videoInput.files?.[0] && $('metrics-consent').checked && !analysisRunning;
  $('start-analysis').disabled = !allowed;
  $('analysis-status').textContent = !videoInput.files?.[0] ? 'Elige un archivo de vídeo.' : !$('metrics-consent').checked ? 'Lee y acepta el aviso de privacidad para activar el análisis.' : 'Listo para analizar en este dispositivo.';
}
function setStatus(message, isError=false){
  const node=$('analysis-status');node.textContent=message;node.classList.toggle('error',isError);
}
function layoutVideo(){
  if(!video.videoWidth||!video.videoHeight)return;
  const maxH=Math.min(window.innerHeight*.62,660);
  const width=Math.min(stage.parentElement.clientWidth||900,maxH*video.videoWidth/video.videoHeight);
  stage.style.width=`${width}px`;
  stage.style.height=`${width*video.videoHeight/video.videoWidth}px`;
  overlay.width=video.videoWidth;overlay.height=video.videoHeight;
  drawOverlay(lastLandmarks);
}
function pointAngle(a,b,c){
  if(!a||!b||!c)return null;
  const ba=[a.x-b.x,a.y-b.y,a.z-b.z],bc=[c.x-b.x,c.y-b.y,c.z-b.z];
  const la=Math.hypot(...ba),lb=Math.hypot(...bc);
  if(la<1e-7||lb<1e-7)return null;
  const cosine=Math.max(-1,Math.min(1,(ba[0]*bc[0]+ba[1]*bc[1]+ba[2]*bc[2])/(la*lb)));
  return Math.acos(cosine)*180/Math.PI;
}
function angleRows(result,time){
  if(!result.worldLandmarks||!result.landmarks)return [];
  const rows=[];
  for(const side of ['left','right'])for(const [joint,indices] of Object.entries(triplets)){
    const points=indices(side).map(i=>result.worldLandmarks[i]);
    const observed=indices(side).map(i=>result.landmarks[i]);
    const visibility=Math.min(...observed.map(point=>Number(point?.visibility??0)));
    if(visibility<.45)continue;
    const angle=pointAngle(...points);
    if(Number.isFinite(angle))rows.push({time,side,joint,angle,visibility,units:'deg'});
  }
  return rows;
}
function drawOverlay(landmarks){
  if(!ctx||!overlay.width||!overlay.height)return;
  ctx.clearRect(0,0,overlay.width,overlay.height);
  if(!landmarks)return;
  const connections=[[11,12],[11,13],[13,15],[12,14],[14,16],[11,23],[12,24],[23,24],[23,25],[25,27],[27,31],[27,29],[24,26],[26,28],[28,32],[28,30]];
  ctx.lineWidth=Math.max(2,overlay.width/360);ctx.lineCap='round';ctx.strokeStyle='#8fca9f';
  for(const [a,b] of connections){const p=landmarks[a],q=landmarks[b];if((p?.visibility??0)<.35||(q?.visibility??0)<.35)continue;ctx.beginPath();ctx.moveTo(p.x*overlay.width,p.y*overlay.height);ctx.lineTo(q.x*overlay.width,q.y*overlay.height);ctx.stroke()}
  for(const point of landmarks){if((point?.visibility??0)<.35)continue;ctx.beginPath();ctx.arc(point.x*overlay.width,point.y*overlay.height,Math.max(3,overlay.width/150),0,Math.PI*2);ctx.fillStyle='#f5cb74';ctx.fill()}
}
function ensureWorker(){
  if(worker)return;
  worker=new Worker('./pose-worker.js?v=c363f63059d0',{type:'module'});
  worker.onmessage=event=>{
    const message=event.data||{};
    if(message.type==='ready'){workerReady=true;pendingPose?.resolve(null);pendingPose=null;return}
    if(message.type==='pose'){
      lastLandmarks=message.landmarks;
      drawOverlay(message.landmarks);
      pendingPose?.resolve(message);pendingPose=null;return;
    }
    if(message.type==='error'){
      const error=new Error(message.message);
      pendingPose?.reject(error);pendingPose=null;workerReady=false;
      worker?.terminate();worker=null;
      $('start-analysis').disabled=false;setStatus(`No se pudo preparar el detector: ${message.message}`,true);
    }
  };
  worker.onerror=event=>{pendingPose?.reject(new Error(event.message||'Error en el worker de pose.'));pendingPose=null;workerReady=false;worker?.terminate();worker=null;setStatus(event.message||'Error en el análisis.',true)};
  worker.postMessage({type:'init'});
}
function waitForWorkerReady(){
  if(workerReady)return Promise.resolve();
  return new Promise((resolve,reject)=>{pendingPose={resolve,reject};ensureWorker()});
}
function nextPose(bitmap){
  return new Promise((resolve,reject)=>{
    pendingPose={resolve,reject};
    lastInferenceTimestamp=Math.max(Math.round(performance.now()),lastInferenceTimestamp+1);
    worker.postMessage({type:'estimate',bitmap,timestamp:lastInferenceTimestamp},[bitmap]);
  });
}
function seekTo(time){
  return new Promise((resolve,reject)=>{
    if(Math.abs(video.currentTime-time)<.015){resolve();return}
    let timeout=setTimeout(()=>{video.removeEventListener('seeked',done);reject(new Error('El vídeo tardó demasiado en desplazarse a un fotograma.'))},5000);
    const done=()=>{clearTimeout(timeout);resolve()};
    video.addEventListener('seeked',done,{once:true});video.currentTime=time;
  });
}
async function analyse(){
  const file=videoInput.files?.[0];if(!file)return;
  cancelled=false;analysisRunning=true;$('start-analysis').disabled=true;$('stop-analysis').disabled=false;$('download-csv').disabled=true;
  results.length=0;progress.value=0;$('chart-empty').hidden=false;$('angle-summary').innerHTML='<span>Procesando…</span>';
  setStatus('Descargando y preparando el detector. El vídeo permanece en este navegador…');
  try{
    await waitForWorkerReady();
    if(!Number.isFinite(video.duration)||video.duration<=0)throw new Error('No se pudo leer la duración del vídeo.');
    video.pause();
    const duration=video.duration;
    const count=Math.max(2,Math.min(180,Math.ceil(duration*4)));
    const lastTime=Math.max(0,duration-.04);
    const seconds=[...new Set(Array.from({length:count},(_,i)=>lastTime*i/(count-1)))];
    for(let i=0;i<seconds.length;i++){
      if(cancelled)break;
      const time=seconds[i];
      await seekTo(time);
      const bitmap=await createImageBitmap(video);
      const pose=await nextPose(bitmap);
      if(pose)results.push(...angleRows(pose,time));
      progress.value=(i+1)/seconds.length*100;
      if(i%4===0||i===seconds.length-1)setStatus(`Fotograma ${i+1} de ${seconds.length} · ${Math.round(progress.value)} %`);
      await new Promise(requestAnimationFrame);
    }
    if(cancelled)setStatus(`Análisis detenido. Se conservaron ${results.length} medidas válidas en esta sesión.`);
    else setStatus(`Análisis terminado. ${results.length} medidas articulares válidas; revisa la visibilidad y el ángulo seleccionado.`);
    $('download-csv').disabled=results.length===0;
    $('chart-empty').hidden=results.length>0;
    updateAtlasLink();renderChart();
  }catch(error){
    setStatus(`No se completó el análisis: ${error.message}`,true);
  }finally{
    analysisRunning=false;$('start-analysis').disabled=!videoInput.files?.[0]||!$('metrics-consent').checked;
    $('stop-analysis').disabled=true;
  }
}
function selectedData(){return results.filter(row=>row.joint===chartJoint.value&&row.side===chartSide.value)}
function renderChart(){
  const rect=chart.getBoundingClientRect();if(!rect.width)return;
  const dpr=Math.min(window.devicePixelRatio||1,2);chart.width=Math.round(rect.width*dpr);chart.height=Math.round(rect.height*dpr);chartCtx.setTransform(dpr,0,0,dpr,0,0);
  const w=rect.width,h=rect.height,pad={l:48,r:16,t:16,b:34};chartCtx.clearRect(0,0,w,h);
  const data=selectedData();
  if(!data.length){$('angle-summary').innerHTML='<span>Fotogramas válidos: 0 para la selección actual.</span><span>Revisa el lado, articulación, encuadre y visibilidad.</span>';return}
  const min=Math.floor(Math.min(...data.map(x=>x.angle))/10)*10,max=Math.ceil(Math.max(...data.map(x=>x.angle))/10)*10||10;
  chartCtx.font='12px DM Sans, sans-serif';chartCtx.strokeStyle='#d7e0d6';chartCtx.fillStyle='#647a6e';chartCtx.lineWidth=1;
  for(let n=0;n<=4;n++){const y=pad.t+(h-pad.t-pad.b)*n/4;chartCtx.beginPath();chartCtx.moveTo(pad.l,y);chartCtx.lineTo(w-pad.r,y);chartCtx.stroke();chartCtx.fillText(`${Math.round(max-(max-min)*n/4)}°`,5,y+4)}
  const duration=Math.max(video.duration||data.at(-1).time,0.01);
  chartCtx.strokeStyle='#438261';chartCtx.lineWidth=2.5;chartCtx.beginPath();
  data.forEach((row,i)=>{const x=pad.l+(w-pad.l-pad.r)*row.time/duration,y=pad.t+(h-pad.t-pad.b)*(max-row.angle)/(max-min||1);if(i===0)chartCtx.moveTo(x,y);else chartCtx.lineTo(x,y)});chartCtx.stroke();
  chartCtx.fillStyle='#647a6e';chartCtx.fillText('Tiempo (s)',w/2-26,h-5);chartCtx.fillText(`${jointLabels[chartJoint.value]} · ${chartSide.value==='left'?'izquierdo':'derecho'} · ángulo estimado`,pad.l,pad.t+12);
  const angles=data.map(x=>x.angle).sort((a,b)=>a-b),vis=data.map(x=>x.visibility).sort((a,b)=>a-b);
  const mean=angles.reduce((a,b)=>a+b,0)/angles.length;
  const median=array=>array[Math.floor(array.length/2)];
  $('angle-summary').innerHTML=`<span>Fotogramas válidos: ${data.length}</span><span>Ángulo mínimo / medio / máximo: ${Math.round(angles[0])}° / ${Math.round(mean)}° / ${Math.round(angles.at(-1))}°</span><span>Visibilidad mediana de puntos: ${Math.round(median(vis)*100)} %</span>`;
}
function updateAtlasLink(){
  const item=configs[movement.value]||configs.other;
  const link=$('atlas-case-link');
  link.href=item.route;link.removeAttribute('aria-disabled');link.classList.remove('disabled-link');
  link.textContent=`Abrir ${movement.options[movement.selectedIndex].text} con contexto en el atlas 3D ↗`;
}
function downloadCsv(){
  if(!results.length)return;
  const header='tiempo_s,lado,articulacion,angulo_geometrico_estimado_grados,visibilidad_minima';
  const lines=results.map(row=>[row.time.toFixed(3),row.side==='left'?'izquierdo':'derecho',jointLabels[row.joint],row.angle.toFixed(2),row.visibility.toFixed(3)].join(','));
  const blob=new Blob(['\ufeff'+header+'\n'+lines.join('\n')],{type:'text/csv;charset=utf-8'});
  const url=URL.createObjectURL(blob),anchor=document.createElement('a');anchor.href=url;anchor.download='atlas-analisis-movimiento.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
}

videoInput.addEventListener('change',()=>{
  if(sourceUrl)URL.revokeObjectURL(sourceUrl);
  const file=videoInput.files?.[0];
  if(!file){updateStartState();return}
  sourceUrl=URL.createObjectURL(file);video.src=sourceUrl;video.load();stage.hidden=false;
  $('file-status').textContent=`${file.name} · ${(file.size/1024/1024).toFixed(1)} MB · el archivo se procesa desde memoria local.`;
  video.addEventListener('loadedmetadata',()=>{layoutVideo();$('file-status').textContent+=` · ${video.duration.toFixed(1)} s`;},{once:true});
  updateStartState();
});
$('metrics-consent').addEventListener('change',updateStartState);
$('start-analysis').addEventListener('click',analyse);
$('stop-analysis').addEventListener('click',()=>{cancelled=true;setStatus('Deteniendo después del fotograma actual…')});
$('download-csv').addEventListener('click',downloadCsv);
movement.addEventListener('change',()=>{const config=configs[movement.value]||configs.other;jointSelect.value=config.joint;chartJoint.value=config.joint;sideSelect.value=config.side;chartSide.value=config.side;updateAtlasLink();renderChart()});
jointSelect.addEventListener('change',()=>{chartJoint.value=jointSelect.value;renderChart()});
sideSelect.addEventListener('change',()=>{if(sideSelect.value!=='both')chartSide.value=sideSelect.value;renderChart()});
chartJoint.addEventListener('change',renderChart);chartSide.addEventListener('change',renderChart);
video.addEventListener('loadedmetadata',layoutVideo);window.addEventListener('resize',()=>{layoutVideo();renderChart()});
window.addEventListener('pagehide',()=>{worker?.postMessage({type:'close'});worker?.terminate();if(sourceUrl)URL.revokeObjectURL(sourceUrl)});
updateAtlasLink();updateStartState();

let youtubeVideo=null;
let youtubePlayer=null;
const youtubeNotes=[];
let youtubeApiPromise=null;
function loadYoutubeApi(){
  if(window.YT?.Player)return Promise.resolve();
  if(youtubeApiPromise)return youtubeApiPromise;
  youtubeApiPromise=new Promise((resolve,reject)=>{
    const timeout=setTimeout(()=>reject(new Error('No se pudo conectar con el reproductor. Escribe el tiempo manualmente.')),8000);
    const previous=window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady=()=>{clearTimeout(timeout);previous?.();resolve()};
    const script=document.createElement('script');
    script.src='https://www.youtube.com/iframe_api';
    script.async=true;
    script.onerror=()=>{clearTimeout(timeout);reject(new Error('No se cargó la API de YouTube. Escribe el tiempo manualmente.'))};
    document.head.append(script);
  });
  return youtubeApiPromise;
}
function youtubeStatus(message,error=false){$('youtube-status').textContent=message;$('youtube-status').classList.toggle('error',error)}
$('youtube-form').addEventListener('submit',event=>{
  event.preventDefault();
  const parsed=parseYouTubeLink($('youtube-url').value);
  if(!parsed){youtubeStatus('Introduce un enlace válido de un vídeo de YouTube.',true);return}
  youtubePlayer?.destroy?.();youtubePlayer=null;
  youtubeVideo=parsed;youtubeNotes.length=0;renderYoutubeNotes();
  const iframe=document.createElement('iframe');
  iframe.id='youtube-iframe';iframe.title='Vídeo de YouTube para observación del movimiento';
  iframe.allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen=true;iframe.loading='lazy';iframe.referrerPolicy='strict-origin-when-cross-origin';
  const src=new URL(`https://www.youtube-nocookie.com/embed/${parsed.id}`);
  src.searchParams.set('start',String(parsed.start));src.searchParams.set('enablejsapi','1');src.searchParams.set('playsinline','1');
  if(/^https?:$/.test(location.protocol))src.searchParams.set('origin',location.origin);
  iframe.src=src.toString();
  $('youtube-player-wrap').replaceChildren(iframe);
  $('youtube-open').href=parsed.url;
  $('youtube-time').value=formatTimecode(parsed.start);
  $('youtube-workspace').hidden=false;
  youtubeStatus('Vídeo cargado para observación. Si no permite incrustación, ábrelo en YouTube y registra el momento manualmente.');
});
$('youtube-capture').addEventListener('click',async()=>{
  if(!youtubeVideo)return;
  try{
    await loadYoutubeApi();
    if(!youtubePlayer){
      youtubePlayer=await new Promise((resolve,reject)=>{
        const timeout=setTimeout(()=>reject(new Error('El reproductor no respondió. Escribe el tiempo manualmente.')),8000);
        new window.YT.Player('youtube-iframe',{events:{onReady:event=>{clearTimeout(timeout);resolve(event.target)},onError:()=>{clearTimeout(timeout);reject(new Error('El vídeo no permite leer el tiempo.'))}}});
      });
    }
    const time=youtubePlayer.getCurrentTime();
    if(!Number.isFinite(time))throw new Error('No se pudo leer el tiempo.');
    $('youtube-time').value=formatTimecode(time);
    youtubeStatus(`Momento capturado: ${$('youtube-time').value}.`);
  }catch(error){youtubeStatus(error.message,true)}
});
function renderYoutubeNotes(){
  const list=$('youtube-observations');list.replaceChildren();
  if(!youtubeNotes.length){const item=document.createElement('li');item.textContent='Aún no hay observaciones.';list.append(item)}
  for(const note of youtubeNotes){
    const item=document.createElement('li');
    const link=document.createElement('a');link.href=`${youtubeVideo.url}&t=${note.seconds}s`;link.target='_blank';link.rel='noopener noreferrer';link.textContent=formatTimecode(note.seconds);
    const heading=document.createElement('strong');heading.textContent=` · ${note.phase} · ${note.joint} · ${note.side}`;
    const detail=document.createElement('p');detail.textContent=note.observation;
    item.append(link,heading,detail);list.append(item);
  }
  $('youtube-download-notes').disabled=youtubeNotes.length===0;
}
$('youtube-add-note').addEventListener('click',()=>{
  if(!youtubeVideo){youtubeStatus('Abre un enlace de YouTube antes de registrar una observación.',true);return}
  const seconds=parseTimecode($('youtube-time').value);
  const observation=$('youtube-observation').value.trim();
  if(seconds===null){youtubeStatus('Escribe el momento como mm:ss, por ejemplo 01:24.',true);return}
  if(!observation){youtubeStatus('Describe lo que ocurre en esa fase antes de añadirla.',true);return}
  youtubeNotes.push({seconds,phase:$('youtube-phase').value,joint:jointSelect.options[jointSelect.selectedIndex].text,side:sideSelect.options[sideSelect.selectedIndex].text,observation});
  youtubeNotes.sort((a,b)=>a.seconds-b.seconds);
  $('youtube-observation').value='';renderYoutubeNotes();
  youtubeStatus(`Observación añadida en ${formatTimecode(seconds)}. Las notas permanecen en esta sesión hasta que descargues el CSV.`);
});
$('youtube-download-notes').addEventListener('click',()=>{
  if(!youtubeNotes.length||!youtubeVideo)return;
  const cell=value=>`"${String(value).replaceAll('"','""')}"`;
  const lines=['video,tiempo_s,fase,articulacion,lado,observacion',...youtubeNotes.map(note=>[youtubeVideo.url,note.seconds,note.phase,note.joint,note.side,note.observation].map(cell).join(','))];
  const url=URL.createObjectURL(new Blob(['\ufeff'+lines.join('\n')],{type:'text/csv;charset=utf-8'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download='atlas-observaciones-youtube.csv';anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
});
