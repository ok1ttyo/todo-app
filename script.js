// Elements
const $ = s => document.querySelector(s);
const $$ = s => document.querySelectorAll(s);

const list = $('#list');
const search = $('#search');
const composer = $('#composer');
const openComposer = $('#openComposer');
const addTaskBtn = $('#addTask');
const newTitle = $('#newTitle');
const newDue = $('#newDue');
const newPriority = $('#newPriority');
const counter = $('#counter');
const darkModeBtn = $('#darkModeBtn');
const langSelect = $('#language');

const pageTitle = $('#pageTitle');
const sbTitle = $('#sbTitle');
const sbSub = $('#sbSub');
const navToday = $('#navToday');
const navUpcoming = $('#navUpcoming');
const navAll = $('#navAll');
const navCompleted = $('#navCompleted');
const btnAddNew = $('#btnAddNew');
const btnAdd = $('#btnAdd');

const filterBtns = $$('.filters button');
const viewBtns = $$('.nav button');

// State
let tasks = JSON.parse(localStorage.getItem('todo_v2_all')) || [];
let currentFilter = 'all';
let currentView = 'today';
let q = '';

// Translations (EN/AR + explanations)
const t = {
  en: {
    appTitle: "To-do List", sbTitle: "My Tasks", sbSub: "Stay focused",
    nav: { today: "Today", upcoming: "Upcoming", all: "All", completed: "Completed" },
    search: "Search tasks",
    addNew: "Add New Task", add: "Add",
    filters: { all: "All", active: "Active", completed: "Completed" },
    counter: n => `${n} ${n===1?"task":"tasks"} left`,
    due: "Due:", editPrompt: "Edit task:",
    priorities: { low: "Low — Normal", medium: "Medium — Important", high: "High — Urgent" },
    placeholder: "Task title"
  },
  ar: {
    appTitle: "قائمة المهام", sbTitle: "مهامي", sbSub: "ركّز على المهم",
    nav: { today: "اليوم", upcoming: "القادمة", all: "الكل", completed: "منجزة" },
    search: "ابحث عن مهمة",
    addNew: "إضافة مهمة جديدة", add: "إضافة",
    filters: { all: "الكل", active: "نشطة", completed: "منجزة" },
    counter: n => `${n} ${n===1?"مهمة":"مهام"} متبقية`,
    due: "الموعد:", editPrompt: "عدّل المهمة:",
    priorities: { low: "منخفض — عادي", medium: "متوسط — مهم", high: "مرتفع — طارئ" },
    placeholder: "عنوان المهمة"
  }
};

// Helpers
const todayStr = () => new Date().toISOString().slice(0,10);
const isToday   = d => d === todayStr();
const isUpcoming= d => d && d > todayStr();
function save(){ localStorage.setItem('todo_v2_all', JSON.stringify(tasks)); }

// Language & RTL
function applyLang(lang){
  document.body.dir = (lang==='ar') ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', document.body.dir);

  pageTitle.textContent = t[lang].appTitle;
  sbTitle.textContent = t[lang].sbTitle;
  sbSub.textContent = t[lang].sbSub;
  navToday.textContent = t[lang].nav.today;
  navUpcoming.textContent = t[lang].nav.upcoming;
  navAll.textContent = t[lang].nav.all;
  navCompleted.textContent = t[lang].nav.completed;
  search.placeholder = t[lang].search;
  btnAddNew.textContent = t[lang].addNew;
  btnAdd.textContent = t[lang].add;
  $('#fAll').textContent = t[lang].filters.all;
  $('#fActive').textContent = t[lang].filters.active;
  $('#fCompleted').textContent = t[lang].filters.completed;
  newTitle.placeholder = t[lang].placeholder;

  // Update composer dropdown labels
  newPriority.options[0].text = t[lang].priorities.low;
  newPriority.options[1].text = t[lang].priorities.medium;
  newPriority.options[2].text = t[lang].priorities.high;

  render(); // refresh badge texts & counter
  localStorage.setItem('todo_v2_lang', lang);
}

// Rendering
function render(){
  // counts per sidebar
  $('#count-all').textContent = tasks.length;
  $('#count-today').textContent = tasks.filter(x=>!x.done && isToday(x.due)).length;
  $('#count-upcoming').textContent = tasks.filter(x=>!x.done && isUpcoming(x.due)).length;
  $('#count-completed').textContent = tasks.filter(x=>x.done).length;

  // main list filter by view + search + filter row
  let pool = tasks.filter(t=>{
    // view
    if(currentView==='today'   && !(isToday(t.due) && !t.done)) return false;
    if(currentView==='upcoming'&& !(isUpcoming(t.due) && !t.done)) return false;
    if(currentView==='completed'&& !t.done) return false;
    // search
    if(q && !t.title.toLowerCase().includes(q)) return false;
    return true;
  });

  // filter row
  pool = pool.filter(t=>{
    if(currentFilter==='all') return true;
    if(currentFilter==='active') return !t.done;
    return t.done; // completed
  });

  // list
  list.innerHTML = '';
  const lang = langSelect.value;
  for(const item of pool){
    const row = document.createElement('div');
    row.className = 'task' + (item.done ? ' done' : '');

    // check
    const chk = document.createElement('div');
    chk.className = 'chk';
    chk.innerHTML = '<i class="fa-solid fa-check"></i>';
    chk.title = 'Complete';
    chk.onclick = ()=>{ item.done = !item.done; save(); render(); };

    // left block
    const left = document.createElement('div');
    left.className = 'item-left';
    const title = document.createElement('div');
    title.className = 'titleline';
    title.textContent = item.title;
    title.ondblclick = ()=>{
      const nv = prompt(t[lang].editPrompt, item.title);
      if(nv!==null && nv.trim()){ item.title = nv.trim(); save(); render(); }
    };

    const meta = document.createElement('div');
    meta.className = 'meta';
    const badge = document.createElement('span');
    badge.className = 'badge ' + (item.priority==='high'?'b-high': item.priority==='medium'?'b-med':'b-low');
    badge.textContent = t[lang].priorities[item.priority];
    meta.appendChild(badge);
    if(item.due){
      const due = document.createElement('span');
      due.className = 'due';
      due.textContent = `${t[lang].due} ${item.due}`;
      meta.appendChild(due);
    }
    left.append(title, meta);

    // actions
    const actions = document.createElement('div');
    actions.className = 'actions';
    const edit = document.createElement('button');
    edit.className = 'iconbtn';
    edit.innerHTML = '<i class="fa-solid fa-pen"></i>';
    edit.onclick = ()=> title.ondblclick();
    const del = document.createElement('button');
    del.className = 'iconbtn';
    del.innerHTML = '<i class="fa-solid fa-trash"></i>';
    del.onclick = ()=>{ tasks = tasks.filter(x=>x!==item); save(); render(); };
    actions.append(edit, del);

    row.append(chk, left, actions);
    list.appendChild(row);
  }

  // counter
  const activeCount = tasks.filter(x=>!x.done).length;
  counter.textContent = t[lang].counter(activeCount);

  save();
}

// Events
openComposer.onclick = ()=>{ composer.hidden = !composer.hidden; if(!composer.hidden) newTitle.focus(); };
addTaskBtn.onclick = ()=>{
  const title = newTitle.value.trim(); if(!title) return;
  tasks.push({ title, due: newDue.value || '', priority: newPriority.value, done:false });
  newTitle.value=''; newDue.value=''; newPriority.value='low'; composer.hidden=true;
  save(); render();
};
newTitle.addEventListener('keypress', e=>{ if(e.key==='Enter') addTaskBtn.click(); });

filterBtns.forEach(b=> b.onclick = ()=>{
  filterBtns.forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  currentFilter = b.dataset.filter;
  render();
});

viewBtns.forEach(b=> b.onclick = ()=>{
  viewBtns.forEach(x=>x.classList.remove('active'));
  b.classList.add('active');
  currentView = b.dataset.view;
  render();
});

search.oninput = ()=>{ q = search.value.trim().toLowerCase(); render(); };

// Dark mode
darkModeBtn.onclick = ()=>{
  document.body.classList.toggle('dark');
  localStorage.setItem('todo_v2_dark', document.body.classList.contains('dark'));
};
if(localStorage.getItem('todo_v2_dark') === 'true'){ document.body.classList.add('dark'); }

// Language init
const savedLang = localStorage.getItem('todo_v2_lang') || 'en';
langSelect.value = savedLang;
langSelect.onchange = ()=> applyLang(langSelect.value);
applyLang(savedLang);

// Seed demo data if empty
if(tasks.length===0){
  const d = todayStr();
  tasks = [
    {title:'Finish project proposal', due:d, priority:'high', done:false},
    {title:'Schedule team meeting',   due:'', priority:'medium', done:false},
    {title:'Review design mockups',   due:'', priority:'low',    done:true}
  ];
  save();
}
render();
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(err => {
        console.error("SW registration failed:", err);
      });
    });
  }
  
