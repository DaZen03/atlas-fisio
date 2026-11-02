const search=document.getElementById('community-search');
const threads=[...document.querySelectorAll('[data-community-thread]')];
const filters=[...document.querySelectorAll('[data-community-filter]')];
const result=document.getElementById('community-results');
const empty=document.getElementById('community-empty');
let activeFilter='all';

function normalize(value){return String(value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function renderThreads(){
  const query=normalize(search.value);
  let visible=0;
  for(const thread of threads){
    const show=(activeFilter==='all'||thread.dataset.category===activeFilter)&&(!query||normalize(thread.dataset.search).includes(query));
    thread.hidden=!show;if(show)visible++;
  }
  result.textContent=`${visible} ${visible===1?'discusión':'discusiones'}`;
  empty.hidden=visible!==0;
}
filters.forEach(button=>button.addEventListener('click',()=>{activeFilter=button.dataset.communityFilter;filters.forEach(item=>{const active=item===button;item.classList.toggle('active',active);item.setAttribute('aria-pressed',String(active))});renderThreads()}));
search.addEventListener('input',renderThreads);

const dialog=document.getElementById('preview-auth');
document.querySelectorAll('[data-preview-auth]').forEach(button=>button.addEventListener('click',event=>{event.preventDefault();dialog.showModal()}));
document.querySelectorAll('[data-dialog-close]').forEach(button=>button.addEventListener('click',()=>dialog.close()));
dialog.addEventListener('click',event=>{if(event.target===dialog)dialog.close()});
try{document.documentElement.dataset.theme=localStorage.getItem('atlas-theme')||'light'}catch{}

const adminTeam=document.querySelector('.admin-team');
if(adminTeam){
  const adminLink=document.createElement('a');
  adminLink.className='admin-manage-link';
  adminLink.href='./vistas/admin-comunidad.html';
  adminLink.textContent='Administrar usuarios →';
  adminTeam.append(adminLink);
}
