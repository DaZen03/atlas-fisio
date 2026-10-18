function parseSeconds(value){
  if(!value)return 0;
  const raw=String(value).trim().toLowerCase();
  if(/^\d+(?::\d{1,2}){1,2}$/.test(raw))return Math.min(86400,raw.split(':').reduce((n,part)=>n*60+Number(part),0));
  if(/^\d+$/.test(raw))return Math.min(86400,Number(raw));
  const parts=[...raw.matchAll(/(\d+)(h|m|s)/g)];
  if(parts.length&&parts.map(x=>x[0]).join('')===raw)return Math.min(86400,parts.reduce((n,x)=>n+Number(x[1])*({h:3600,m:60,s:1}[x[2]]),0));
  return 0;
}

export function parseYouTubeLink(value){
  let url;
  try{url=new URL(String(value).trim())}catch{return null}
  if(!['https:','http:'].includes(url.protocol))return null;
  const host=url.hostname.toLowerCase();
  let id='';
  if(host==='youtu.be'||host==='www.youtu.be')id=url.pathname.split('/')[1]||'';
  else if(['youtube.com','www.youtube.com','m.youtube.com','www.youtube-nocookie.com'].includes(host)){
    const path=url.pathname.split('/').filter(Boolean);
    id=path[0]==='watch'?url.searchParams.get('v')||'':['shorts','live','embed'].includes(path[0])?path[1]||'':'';
  }
  if(!/^[a-zA-Z0-9_-]{11}$/.test(id))return null;
  const hash=new URLSearchParams(url.hash.replace(/^#/,''));
  const start=parseSeconds(url.searchParams.get('t')||url.searchParams.get('start')||hash.get('t'));
  return {id,start,url:`https://www.youtube.com/watch?v=${id}`};
}

export function formatTimecode(seconds){
  const n=Math.max(0,Math.floor(Number(seconds)||0));
  return `${String(Math.floor(n/60)).padStart(2,'0')}:${String(n%60).padStart(2,'0')}`;
}

export function parseTimecode(value){
  const raw=String(value).trim();
  if(!/^\d{1,3}:[0-5]\d(?::[0-5]\d)?$/.test(raw))return null;
  return raw.split(':').reduce((n,part)=>n*60+Number(part),0);
}
