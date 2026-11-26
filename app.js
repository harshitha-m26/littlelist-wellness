const $ = id => document.getElementById(id);
let tasks = [], activeFilter = "all", editingId = null;
const api = async (url, options={}) => {
  const response = await fetch(url, { headers: { "Content-Type":"application/json" }, ...options });
  if (!response.ok) { const e = await response.json().catch(()=>({})); throw new Error(e.message || "Something went wrong"); }
  return response.json();
};
function toast(message) { const el=$("toast"); el.textContent=message; el.classList.add("show"); setTimeout(()=>el.classList.remove("show"),2100); }
function dateLabel() { const now=new Date(); $("todayLabel").textContent=now.toLocaleDateString("en-US",{weekday:"long",month:"long"}).toUpperCase(); $("dateText").textContent=now.toLocaleDateString("en-US",{weekday:"long",month:"long",day:"numeric"})+"  ·  A fresh start, whenever you need one."; }
function render() {
  const total=tasks.length, done=tasks.filter(t=>t.completed).length, pending=total-done, percent=total?Math.round(done/total*100):0;
  $("totalCount").textContent=total; $("pendingCount").textContent=pending; $("completedCount").textContent=done;
  $("progressValue").textContent=percent+"%"; $("progressFill").style.width=percent+"%";
  $("navAll").textContent=total; $("navPending").textContent=pending; $("navCompleted").textContent=done;
  document.querySelectorAll("[data-filter]").forEach(b=>b.classList.toggle("active",b.classList.contains("nav-item")&&b.dataset.filter===activeFilter));
  document.querySelectorAll(".filter-tab").forEach(b=>b.classList.toggle("selected",b.dataset.filter===activeFilter));
  const query=$("searchInput").value.toLowerCase(), priority=$("priorityFilter").value;
  const visible=tasks.filter(t=>(activeFilter==="all"||(activeFilter==="pending"&&!t.completed)||(activeFilter==="completed"&&t.completed))&&
    (!priority||priority==="all"||t.priority===priority)&&(`${t.title} ${t.description||""} ${t.category||""}`.toLowerCase().includes(query)));
  $("taskList").innerHTML=visible.map(t=>`<article class="task-row ${t.completed?"done":""}">
    <input class="task-check" type="checkbox" ${t.completed?"checked":""} aria-label="Mark complete" data-action="toggle" data-id="${t._id}">
    <div class="task-info"><div class="task-title">${escapeHtml(t.title)}</div>${t.description?`<div class="task-description">${escapeHtml(t.description)}</div>`:""}</div>
    <div class="task-meta"><span class="priority ${t.priority}">${t.priority}</span>${t.dueDate?`<span class="task-date">${formatDate(t.dueDate)}</span>`:""}<span class="task-category">${escapeHtml(t.category||"Personal")}</span>
    <button class="icon-button" title="Edit task" data-action="edit" data-id="${t._id}">✎</button><button class="icon-button" title="Delete task" data-action="delete" data-id="${t._id}">×</button></div>
  </article>`).join("");
  $("emptyState").style.display=visible.length?"none":"block";
  if (!visible.length && (query||priority!=="all"||activeFilter!=="all")) { $("emptyState").querySelector("h3").textContent="No tasks found"; $("emptyState").querySelector("p").textContent="Try changing your search or filters."; $("emptyAdd").style.display="none"; }
  else { $("emptyState").querySelector("h3").textContent="It's a little quiet here"; $("emptyState").querySelector("p").textContent="Add your first task and make today count."; $("emptyAdd").style.display="inline-block"; }
}
function escapeHtml(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));}
function formatDate(s){const d=new Date(s+"T00:00:00");return d.toLocaleDateString("en-US",{month:"short",day:"numeric"});}
async function load(){tasks=await api("/api/tasks");render();const s=await api("/api/status");$("dbStatus").textContent=s.database;}
function openModal(task=null){editingId=task?task._id:null;$("modalTitle").textContent=task?"Edit task":"Add a task";$("taskTitle").value=task?.title||"";$("taskDescription").value=task?.description||"";$("taskPriority").value=task?.priority||"Medium";$("taskCategory").value=task?.category||"Personal";$("taskDueDate").value=task?.dueDate||"";$("modalBackdrop").classList.add("show");$("taskTitle").focus();}
function closeModal(){$("modalBackdrop").classList.remove("show");$("taskForm").reset();editingId=null;}
$("openForm").onclick=()=>openModal();$("emptyAdd").onclick=()=>openModal();$("closeModal").onclick=closeModal;$("cancelModal").onclick=closeModal;
$("taskForm").onsubmit=async e=>{e.preventDefault();const data={title:$("taskTitle").value,description:$("taskDescription").value,priority:$("taskPriority").value,category:$("taskCategory").value,dueDate:$("taskDueDate").value};try{if(editingId)await api("/api/tasks/"+editingId,{method:"PATCH",body:JSON.stringify(data)});else await api("/api/tasks",{method:"POST",body:JSON.stringify(data)});closeModal();await load();toast(editingId?"Task updated":"Task added");}catch(err){toast(err.message);}};
$("taskList").onclick=async e=>{const el=e.target.closest("[data-action]");if(!el)return;const id=el.dataset.id,task=tasks.find(t=>t._id===id);try{if(el.dataset.action==="edit")openModal(task);if(el.dataset.action==="toggle"){await api("/api/tasks/"+id,{method:"PATCH",body:JSON.stringify({completed:el.checked})});await load();}if(el.dataset.action==="delete"&&confirm("Delete this task?")){await api("/api/tasks/"+id,{method:"DELETE"});await load();toast("Task deleted");}}catch(err){toast(err.message);}};
document.querySelectorAll("[data-filter]").forEach(b=>b.onclick=()=>{activeFilter=b.dataset.filter;render();});
$("searchInput").oninput=render;$("priorityFilter").onchange=render;
$("themeToggle").onclick=()=>{document.body.classList.toggle("dark");$("themeToggle").textContent=document.body.classList.contains("dark")?"☀":"☾";};
$("modalBackdrop").onclick=e=>{if(e.target===$("modalBackdrop"))closeModal();};
document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal();});
dateLabel();load().catch(err=>{ $("dbStatus").textContent="Server unavailable";toast("Please start the project server first."); console.error(err); });

// Simple daily wellbeing notes are stored in this browser.
const wellnessKey = "littlelist-wellness-v1";
function todayKey(){ return new Date().toISOString().slice(0,10); }
function getWellness(){ try { return JSON.parse(localStorage.getItem(wellnessKey) || "{}"); } catch { return {}; } }
function showWellness(){
  const day=getWellness()[todayKey()] || {};
  $("sleepSaved").textContent=day.sleep ? `${day.sleep} hours recorded today` : "No sleep entry today";
  $("dietSaved").textContent=day.diet ? "Meal note saved for today" : "No meal note today";
  $("exerciseSaved").textContent=day.exercise ? `${day.exercise.minutes} min · ${day.exercise.type || "Movement"}` : "No activity logged today";
  if(day.sleep) $("sleepHours").value=day.sleep;
  if(day.diet) $("dietNote").value=day.diet;
  if(day.exercise){ $("exerciseMinutes").value=day.exercise.minutes; $("exerciseType").value=day.exercise.type || ""; }
}
function saveWellness(kind){
  const all=getWellness(), day=all[todayKey()] || {};
  if(kind==="sleep"){
    const value=Number($("sleepHours").value);
    if($("sleepHours").value==="" || !Number.isFinite(value) || value<0 || value>24){toast("Enter sleep hours from 0 to 24");return;}
    day.sleep=value;
  }
  if(kind==="diet"){
    const value=$("dietNote").value.trim();
    if(!value){toast("Add a short meal note first");return;}
    day.diet=value;
  }
  if(kind==="exercise"){
    const raw=$("exerciseMinutes").value, value=Number(raw), type=$("exerciseType").value.trim();
    if(raw==="" || !Number.isFinite(value) || value<0 || value>1440){toast("Enter activity minutes from 0 to 1440");return;}
    day.exercise={minutes:value,type};
  }
  all[todayKey()]=day; localStorage.setItem(wellnessKey,JSON.stringify(all)); showWellness(); toast("Daily note saved");
}
document.querySelectorAll("[data-save]").forEach(button=>button.addEventListener("click",()=>saveWellness(button.dataset.save)));
showWellness();
