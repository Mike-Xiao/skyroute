// ============================================================
// ② 结果列表页：筛选 + 排序 + 列表
// [OTA 模式] 筛选-列表-排序三栏；价格锚点；按时段/航司/价格筛选
// ============================================================
import { store } from '../store.js';
import { go } from '../router.js';
import { cityName, toast } from '../ui.js';
import { genFlights, genTrains, AIRLINES, RAILWAYS, PLANES, TIME_SLOTS, CABIN_CLASSES, BERTH_CLASSES } from '../data.js';

export function renderResults(app){
  const s = store.get();
  const isFlight = s.tripType==='flight';
  // 生成数据（基于搜索条件）
  let items = isFlight
    ? genFlights(s.from, s.to, s.depDate)
    : genTrains(s.from, s.to, s.depDate);

  // 应用舱位/席别加价
  const clsFactor = (()=>{
    if(isFlight){ const c=CABIN_CLASSES.find(x=>x.code===s.cabinClass); return c?c.factor:1; }
    const c=BERTH_CLASSES.find(x=>x.code===s.berthClass); return c?c.factor:1;
  })();
  items = items.map(it=> ({...it, price: Math.round(it.price*clsFactor)}));

  // 筛选状态
  const filter = { airline:new Set(), slot:new Set(), maxPrice: Infinity, stops:'any' };
  let sortBy = 'time';

  app.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div>
        <b>${cityName(s.from)}</b> → <b>${cityName(s.to)}</b>
        <span class="muted" style="margin-left:8px;">${s.depDate} · ${isFlight?'机票':'火车票'} · ${isFlight?CABIN_CLASSES.find(c=>c.code===s.cabinClass).name:BERTH_CLASSES.find(c=>c.code===s.berthClass).name}</span>
      </div>
      <button class="btn ghost" id="back-search">← 修改搜索</button>
    </div>
    <div class="results-layout">
      <aside class="filters card">
        <div class="group">
          <h4>${isFlight?'航司':'铁路局'}</h4>
          <div id="f-airline">
            ${Object.entries(isFlight?AIRLINES:RAILWAYS).map(([k,v])=>`<label><input type="checkbox" value="${k}">${v.name}</label>`).join('')}
          </div>
        </div>
        <div class="group">
          <h4>时段</h4>
          <div id="f-slot">
            ${TIME_SLOTS.map(t=>`<label><input type="checkbox" value="${t.id}">${t.name} (${t.range[0]}-${t.range[1].replace(')','')})</label>`).join('')}
          </div>
        </div>
        ${isFlight?`<div class="group"><h4>类型</h4>
          <div id="f-stops">
            <label><input type="radio" name="stops" value="any" checked>全部</label>
            <label><input type="radio" name="stops" value="0">直飞</label>
            <label><input type="radio" name="stops" value="1">中转</label>
          </div></div>`:''}
        <div class="group">
          <h4>最高价格</h4>
          <input type="range" id="f-price" min="0" max="${Math.max(...items.map(i=>i.price))}" value="${Math.max(...items.map(i=>i.price))}" style="width:100%;">
          <div class="tiny" id="price-val">不限</div>
        </div>
      </aside>
      <div class="results-main">
        <div class="sort-bar">
          <span class="muted">排序：</span>
          <button class="chip on" data-sort="time">时间</button>
          <button class="chip" data-sort="price">价格</button>
          <button class="chip" data-sort="dur">时长</button>
          <span class="muted" style="margin-left:auto;" id="count"></span>
        </div>
        <div id="list"></div>
      </div>
    </div>
  `;

  const $ = (sel)=> app.querySelector(sel);
  $('#back-search').onclick=()=> go('search');

  // 筛选事件
  app.querySelectorAll('#f-airline input').forEach(c=> c.onchange=()=>{ toggle(filter.airline, c.value, c.checked); renderList(); });
  app.querySelectorAll('#f-slot input').forEach(c=> c.onchange=()=>{ toggle(filter.slot, c.value, c.checked); renderList(); });
  app.querySelectorAll('[name=stops]').forEach(r=> r.onchange=()=>{ filter.stops=r.value; renderList(); });
  $('#f-price').oninput=(e)=>{
    const v=+e.target.value; filter.maxPrice=v;
    $('#price-val').textContent = v>=Math.max(...items.map(i=>i.price)) ? '不限' : `≤ ¥${v}`;
    renderList();
  };
  // 排序
  app.querySelectorAll('[data-sort]').forEach(b=> b.onclick=()=>{
    app.querySelectorAll('[data-sort]').forEach(x=>x.classList.remove('on'));
    b.classList.add('on'); sortBy=b.dataset.sort; renderList();
  });

  function toggle(set,val,on){ on? set.add(val): set.delete(val); }

  function inSlot(time, id){
    const t = TIME_SLOTS.find(x=>x.id===id);
    // range = ['06:00','12:00']，闭开区间 [start, end)
    return time >= t.range[0] && time < t.range[1];
  }

  function renderList(){
    let list = items.filter(it=>{
      if(filter.airline.size && !filter.airline.has(it.airline?it.airline.code:it.railway.code)) return false;
      if(filter.slot.size && !([...filter.slot].some(id=> inSlot(it.dep, id)))) return false;
      if(isFlight && filter.stops!=='any' && String(it.stops)!==filter.stops) return false;
      if(it.price > filter.maxPrice) return false;
      return true;
    });
    list.sort((a,b)=>{
      if(sortBy==='price') return a.price-b.price;
      if(sortBy==='dur') return durMin(a.dur)-durMin(b.dur);
      return a.dep.localeCompare(b.dep);
    });
    $('#count').textContent = `共 ${list.length} 条`;
    $('#list').innerHTML = list.length ? list.map(renderItem).join('') : `<div class="card" style="text-align:center;color:var(--ink-2);">没有符合条件的结果，试试放宽筛选</div>`;
    $('#list').querySelectorAll('.list-item').forEach(el=> el.onclick=()=>{
      const id = el.dataset.id;
      const sel = list.find(x=>x.id===id);
      store.set({ selectedOutbound: sel });
      go('seats');
    });
  }
  function renderItem(it){
    if(isFlight){
      return `
      <div class="list-item" data-id="${it.id}">
        <div>
          <div class="seg">
            <div><div class="time">${it.dep}</div><div class="tiny">${cityName(s.from)}</div></div>
            <div style="text-align:center;color:var(--ink-3);">
              <div class="tiny">${it.dur}</div>
              <div style="position:relative;width:90px;height:1px;background:var(--line);margin:4px 0;"><span style="position:absolute;right:-2px;top:-4px;">→</span></div>
              <div class="tiny">${it.stops? it.stopCity : '直飞'}</div>
            </div>
            <div><div class="time">${it.arr}</div><div class="tiny">${cityName(s.to)}</div></div>
            <div class="tiny" style="margin-left:20px;">
              <div><b>${it.airline.name} ${it.flightNo}</b></div>
              <div>${PLANES[it.plane]} · ${it.cabin}</div>
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          ${it.low?'<span class="low-price">低价</span>':''}
          <div class="price"><span class="yen">¥</span><span class="num">${it.price}</span></div>
          <div class="tiny">起 · 经济舱</div>
        </div>
      </div>`;
    }else{
      return `
      <div class="list-item" data-id="${it.id}">
        <div>
          <div class="seg">
            <div><div class="time">${it.dep}</div><div class="tiny">${cityName(s.from)}</div></div>
            <div style="text-align:center;color:var(--ink-3);">
              <div class="tiny">${it.dur}</div>
              <div style="width:90px;height:1px;background:var(--line);margin:4px 0;"></div>
              <div class="tiny">${it.stops}站</div>
            </div>
            <div><div class="time">${it.arr}</div><div class="tiny">${cityName(s.to)}</div></div>
            <div class="tiny" style="margin-left:20px;">
              <div><b>${it.railway.name} ${it.trainNo}</b></div>
              <div>${BERTH_CLASSES.find(c=>c.code===s.berthClass).name}${it.hasBerth?' · 含卧铺':''}</div>
            </div>
          </div>
        </div>
        <div style="text-align:right;">
          <div class="price"><span class="yen">¥</span><span class="num">${it.price}</span></div>
          <div class="tiny">${BERTH_CLASSES.find(c=>c.code===s.berthClass).name}起</div>
        </div>
      </div>`;
    }
  }

  function durMin(d){ const m=d.match(/(\d+)小时?(\d+)?/); const h=m&&m[1]?+m[1]:0; const mm=m&&m[2]?+m[2]:0; return h*60+mm; }

  renderList();
}
