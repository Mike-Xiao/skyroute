// ============================================================
// 通用 UI 组件：城市选择器 / 日期选择器 / 弹层 / Toast / 倒计时
// ============================================================
import { CITIES } from './data.js';

const overlayRoot = () => document.getElementById('overlay-root');

// ---------- 通用弹层 ----------
export function openOverlay(panelHTML, opts={}){
  closeOverlay();
  const wrap = document.createElement('div');
  wrap.className = 'overlay';
  wrap.innerHTML = `<div class="overlay-panel" style="${opts.style||''}">${panelHTML}</div>`;
  wrap.addEventListener('click', e=>{
    if(e.target === wrap && opts.closeOnBackdrop!==false) closeOverlay();
  });
  overlayRoot().appendChild(wrap);
  return wrap;
}
export function closeOverlay(){ overlayRoot().innerHTML=''; }

// ---------- Toast ----------
export function toast(msg, type='info'){
  const t = document.createElement('div');
  const color = type==='error' ? 'var(--danger)' : type==='ok' ? 'var(--ok)' : 'var(--brand)';
  t.style.cssText = `position:fixed;left:50%;top:80px;transform:translateX(-50%);background:${color};color:#fff;padding:10px 20px;border-radius:8px;z-index:200;box-shadow:var(--shadow-lg);font-size:14px;`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(()=> t.remove(), 1800);
}

// ---------- 城市选择器 ----------
// [OTA 模式] 城市选择器：热门 + 拼音首字母 + 搜索过滤
export function cityPicker(onPick){
  const html = `
    <div class="overlay-head">
      <b>选择城市</b>
      <button class="overlay-close">×</button>
    </div>
    <div class="overlay-body">
      <input class="input" id="city-search" placeholder="输入城市名/拼音/三字码" />
      <div style="margin-top:14px;">
        <div class="city-index">热门城市</div>
        <div class="city-grid" id="city-hot">
          ${CITIES.hot.map(c=>`<button data-code="${c.code}" data-name="${c.name}">${c.name}</button>`).join('')}
        </div>
      </div>
      <div id="city-all"></div>
    </div>`;
  const w = openOverlay(html, {style:'max-width:560px'});
  w.querySelector('.overlay-close').onclick = closeOverlay;

  const bind = (btn)=>{
    onPick(btn.dataset.code, btn.dataset.name);
    closeOverlay();
  };
  // 热门城市点击
  w.querySelector('#city-hot').querySelectorAll('button').forEach(b=> b.onclick=()=>bind(b));
  // 搜索过滤
  const all = [].concat(...Object.entries(CITIES).filter(([k])=>k!=='hot').map(([k,v])=>v));
  w.querySelector('#city-search').oninput = (e)=>{
    const q = e.target.value.trim().toLowerCase();
    if(!q){ renderCityAll(w, onPick); w.querySelector('#city-hot').style.display=''; return; }
    w.querySelector('#city-hot').style.display='none';
    const matched = all.filter(c=> c.name.includes(q)|| c.py.includes(q)|| c.code.toLowerCase().includes(q));
    const box = w.querySelector('#city-all');
    box.innerHTML = matched.length
      ? `<div class="city-grid">${matched.map(c=>`<button data-code="${c.code}" data-name="${c.name}">${c.name}</button>`).join('')}</div>`
      : `<div class="muted" style="padding:20px;text-align:center;">无匹配城市</div>`;
    box.querySelectorAll('button').forEach(b=> b.onclick=()=>bind(b));
  };
  renderCityAll(w, onPick);
}
function renderCityAll(w, onPick){
  const box = w.querySelector('#city-all');
  let html = '';
  for(const k of Object.keys(CITIES)){
    if(k==='hot') continue;
    html += `<div class="city-index">${k}</div><div class="city-grid">${CITIES[k].map(c=>`<button data-code="${c.code}" data-name="${c.name}">${c.name}</button>`).join('')}</div>`;
  }
  box.innerHTML = html;
  box.querySelectorAll('button').forEach(b=> b.onclick=()=>{
    onPick(b.dataset.code, b.dataset.name); closeOverlay();
  });
}

// ---------- 日期选择器 ----------
// [OTA 模式] 日历：禁选过去、往返联动
export function datePicker(onPick, opts={}){
  const today = new Date(); today.setHours(0,0,0,0);
  let cur = new Date(today.getFullYear(), today.getMonth(), 1);
  let selected = opts.value ? new Date(opts.value) : null;

  function render(){
    const y = cur.getFullYear(), m = cur.getMonth();
    const first = new Date(y,m,1).getDay();
    const days = new Date(y,m+1,0).getDate();
    const wkd = ['日','一','二','三','四','五','六'];
    let cells = '';
    wkd.forEach(d=> cells+=`<span class="dow">${d}</span>`);
    for(let i=0;i<first;i++) cells+=`<span></span>`;
    for(let d=1; d<=days; d++){
      const date = new Date(y,m,d);
      const past = date < today;
      const isToday = +date === +today;
      const on = selected && +selected === +date;
      // 往返联动：返程不能早于去程
      let disabled = past;
      if(opts.minDate){ const min = new Date(opts.minDate); if(date < min) disabled = true; }
      cells += `<button class="cal-cell ${isToday?'today':''} ${on?'on':''}" data-d="${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}" ${disabled?'disabled':''}>${d}</button>`;
    }
    const html = `
      <div class="overlay-head"><b>${opts.title||'选择日期'}</b><button class="overlay-close">×</button></div>
      <div class="overlay-body"><div class="cal">
        <div class="cal-head"><button id="prev">‹</button><b>${y}年${m+1}月</b><button id="next">›</button></div>
        <div class="cal-grid">${cells}</div>
      </div></div>`;
    const w = openOverlay(html, {style:'max-width:340px'});
    w.querySelector('.overlay-close').onclick = closeOverlay;
    w.querySelector('#prev').onclick = ()=>{ cur = new Date(y,m-1,1); render(); };
    w.querySelector('#next').onclick = ()=>{ cur = new Date(y,m+1,1); render(); };
    w.querySelectorAll('.cal-cell:not(:disabled)').forEach(c=> c.onclick=()=>{
      onPick(c.dataset.d); closeOverlay();
    });
  }
  render();
}

// ---------- 倒计时 ----------
// [OTA 模式] 订单倒计时制造紧迫感，超时回退
export function countdown(el, totalMin=15, onTimeout){
  let remain = totalMin * 60;
  const fmt = (s)=>{ const m=Math.floor(s/60), x=s%60; return `${String(m).padStart(2,'0')}:${String(x).padStart(2,'0')}`; };
  el.textContent = fmt(remain);
  const t = setInterval(()=>{
    remain--;
    el.textContent = fmt(remain);
    if(remain<=0){ clearInterval(t); onTimeout&&onTimeout(); }
  }, 1000);
  return ()=> clearInterval(t);
}

// ---------- 城市名查找 ----------
export function cityName(code){
  for(const k of Object.keys(CITIES)){
    const arr = CITIES[k];
    const c = arr.find(x=>x.code===code);
    if(c) return c.name;
  }
  return code;
}
