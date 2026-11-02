const storageKey='atlas-community-demo-users-v1';
const defaults=[
  {id:'demo-jhostyn',name:'Jhostyn',profession:'enthusiast',role:'admin',status:'active'},
  {id:'demo-gerardo',name:'Gerardo',profession:'enthusiast',role:'admin',status:'active'},
  {id:'demo-ana',name:'Ana',profession:'physiotherapy',role:'member',status:'active'},
  {id:'demo-luis',name:'Luis',profession:'enthusiast',role:'member',status:'active'}
];
const labels={profession:{enthusiast:'Entusiasta',physiotherapy:'Fisioterapia',medicine:'Medicina',sport_science:'Ciencias del deporte',personal_training:'Entrenamiento personal',education_research:'Docencia / investigación',other:'Otra profesión'},role:{member:'Miembro',moderator:'Moderador',admin:'Administrador'},status:{active:'Activa',suspended:'Suspendida'}};
const rows=document.getElementById('admin-user-rows');
const mobile=document.getElementById('admin-mobile-list');
const search=document.getElementById('admin-search');
const roleFilter=document.getElementById('admin-role-filter');
const results=document.getElementById('admin-results');
const counts=document.getElementById('admin-counts');
const editor=document.getElementById('admin-editor');
const form=document.getElementById('admin-user-form');
const toast=document.getElementById('admin-toast');
let users=loadUsers();

function loadUsers(){try{const saved=JSON.parse(localStorage.getItem(storageKey));return Array.isArray(saved)&&saved.length?saved:structuredClone(defaults)}catch{return structuredClone(defaults)}}
function saveUsers(){localStorage.setItem(storageKey,JSON.stringify(users))}
function normalize(value){return String(value||'').toLocaleLowerCase('es').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function visibleUsers(){const query=normalize(search.value);return users.filter(user=>(roleFilter.value==='all'||user.role===roleFilter.value)&&(!query||normalize(`${user.name} ${labels.profession[user.profession]}`).includes(query)))}
function identity(user){return `<div class="user-identity"><span class="avatar">${user.name.charAt(0).toUpperCase()}</span><div><strong>${user.name}</strong><small>${user.id}</small></div></div>`}
function render(){
  const list=visibleUsers();
  rows.innerHTML=list.map(user=>`<tr>${`<td>${identity(user)}</td>`}<td><span class="profile-tag">${labels.profession[user.profession]}</span></td><td><span class="role-pill role-${user.role}">${labels.role[user.role]}</span></td><td><span class="status-dot status-${user.status}">${labels.status[user.status]}</span></td><td><button class="edit-user" data-edit-user="${user.id}">Editar</button></td></tr>`).join('');
  mobile.innerHTML=list.map(user=>`<article>${identity(user)}<dl><div><dt>Profesión</dt><dd>${labels.profession[user.profession]}</dd></div><div><dt>Rol</dt><dd>${labels.role[user.role]}</dd></div><div><dt>Estado</dt><dd>${labels.status[user.status]}</dd></div></dl><button class="edit-user" data-edit-user="${user.id}">Editar perfil</button></article>`).join('');
  results.textContent=`${list.length} ${list.length===1?'usuario':'usuarios'}`;
  counts.innerHTML=`<strong>${users.length}</strong><span>Total</span><strong>${users.filter(user=>user.role==='admin').length}</strong><span>Administradores</span><strong>${users.filter(user=>user.status==='suspended').length}</strong><span>Suspendidos</span>`;
  document.querySelectorAll('[data-edit-user]').forEach(button=>button.addEventListener('click',()=>openEditor(button.dataset.editUser)));
}
function openEditor(id){const user=users.find(item=>item.id===id);if(!user)return;document.getElementById('edit-user-id').value=user.id;document.getElementById('edit-name').value=user.name;document.getElementById('edit-profession').value=user.profession;document.getElementById('edit-role').value=user.role;document.getElementById('edit-status').value=user.status;document.getElementById('editor-title').textContent=user.name;editor.showModal()}
function showToast(message){toast.textContent=message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),2500)}
form.addEventListener('submit',event=>{event.preventDefault();const id=document.getElementById('edit-user-id').value;const user=users.find(item=>item.id===id);if(!user)return;user.name=document.getElementById('edit-name').value.trim();user.profession=document.getElementById('edit-profession').value;user.role=document.getElementById('edit-role').value;user.status=document.getElementById('edit-status').value;saveUsers();render();editor.close();showToast(`Perfil de ${user.name} actualizado en esta vista previa.`)});
document.querySelectorAll('[data-editor-close]').forEach(button=>button.addEventListener('click',()=>editor.close()));
editor.addEventListener('click',event=>{if(event.target===editor)editor.close()});
search.addEventListener('input',render);roleFilter.addEventListener('change',render);
document.getElementById('admin-reset').addEventListener('click',()=>{users=structuredClone(defaults);saveUsers();render();showToast('Datos de demostración restaurados.')});
try{document.documentElement.dataset.theme=localStorage.getItem('atlas-theme')||'light'}catch{}
render();
