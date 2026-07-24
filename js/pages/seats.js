// ============================================================
// ③ 选座/选铺页
// [OTA 模式] 网格状态机(可选/已选/锁定/紧急出口)、稀缺资源锁定
//   - 机票：客舱座位图（A-F 排，中过道）
//   - 火车：按席别选铺（硬座/硬卧上中下/软卧）
// ============================================================
import { store } from '../store.js';
import { go } from '../router.js';
import { cityName } from '../ui.js';
import { genSeatMap, CABIN_CLASSES, BERTH_CLASSES } from '../data.js';

export function renderSeats(app){
  const s = store.get();
  const isFlight = s.tripType==='flight';
  const sel = s.selectedOutbound;

  app.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
      <div>
        <b>${isFlight? `${sel.airline.name} ${sel.flightNo}`:`${sel.railway.name} ${sel.trainNo}`}</b>
        <span class="muted" style="margin-left:8px;">${cityName(s.from)} → ${cityName(s.to)} · ${s.depDate} · ${sel.dep}-${sel.arr}</span>
      </div>
      <button class="btn ghost" id="back-res">← 重新选择</button>
    </div>
    <div class="card" id="seat-area"></div>
    <div style="margin-top:14px;display:flex;justify-content:space-between;align-items:center;">
      <div id="seat-info" class="muted">未选择座位</div>
      <button class="btn lg" id="next-btn" disabled>下一步：填写旅客</button>
    </div>
  `;
  const $ = (sel)=> app.querySelector(sel);
  $('#back-res').onclick=()=> go('results');
  $('#next-btn').onclick=()=> go('passengers');

  if(isFlight) renderFlightSeats(); else renderTrainBerths();

  function renderFlightSeats(){
    const cls = s.cabinClass;
    const seatMap = genSeatMap(sel.id, cls);
    const className = CABIN_CLASSES.find(c=>c.code===cls).name;
    $('#seat-area').innerHTML = `
      <h3 class="section-title">选座 · ${className}（示意）</h3>
      <p class="tiny" style="margin-top:-8px;">靠窗看景、靠过道方便出入、前排更稳；锁定/已售不可选。</p>
      <div class="seat-map">
        <div class="cabin" id="cabin">
          ${seatMap.map(row=>{
            const cells = row.map((st,ci)=>{
              if(ci===3) return `<span class="seat aisle">·</span>`;
              if(st.status==='sold') return `<span class="seat sold" title="已被占用">${st.id}</span>`;
              if(st.status==='locked') return `<span class="seat locked" title="已锁定">${st.id}</span>`;
              return `<span class="seat available" data-id="${st.id}" data-price="${st.price}">${st.id}</span>`;
            }).join('');
            return `<div class="seat-row"><span class="tiny" style="width:24px;text-align:right;">${row[0].row}</span>${cells}</div>`;
          }).join('')}
        </div>
      </div>
      <div class="seat-legend">
        <span><i style="background:#fff;border:1px solid var(--line);"></i>可选</span>
        <span><i style="background:var(--brand);"></i>已选</span>
        <span><i style="background:var(--line);"></i>已售</span>
        <span><i style="background:#ffd9d9;"></i>锁定</span>
      </div>
    `;
    // 按人数多选座位
    const people = s.adults + s.children;
    const picked = [];
    const refresh=()=>{
      $('#cabin').querySelectorAll('.seat.available').forEach(el=> el.classList.toggle('selected', picked.includes(el.dataset.id)));
      $('#seat-info').textContent = picked.length? `已选 ${picked.join('、')}（${picked.length}/${people}）` : '未选择座位';
      $('#next-btn').disabled = picked.length < people;
      store.set({ selectedSeat: { id: picked.join(','), price: cls==='C'?580: cls==='P'?420:0 } });
    };
    $('#cabin').querySelectorAll('.seat.available').forEach(el=> el.onclick=()=>{
      const id=el.dataset.id;
      if(picked.includes(id)) picked.splice(picked.indexOf(id),1);
      else if(picked.length<people) picked.push(id);
      else { picked.shift(); picked.push(id); }
      refresh();
    });
    refresh();
  }

  function renderTrainBerths(){
    const berth = BERTH_CLASSES.find(c=>c.code===s.berthClass);
    const people = s.adults + s.children;
    let positions=[];
    if(berth.code==='RW') positions=['下铺','上铺'];
    else if(berth.code==='YW') positions=['下铺','中铺','上铺'];
    else positions=['靠窗','中间','靠过道'];
    const grid = [];
    for(let i=1;i<=8;i++) grid.push(positions.map(p=>({id:`${i}号${p}`,p})));
    $('#seat-area').innerHTML = `
      <h3 class="section-title">选铺 · ${berth.name}（示意）</h3>
      <p class="tiny" style="margin-top:-8px;">下铺方便老人/带娃，上铺更安静；请为每位旅客选铺。</p>
      <div class="berth-grid" id="berth-grid">
        ${grid.flat().map(b=>`<div class="berth" data-id="${b.id}">${b.id}</div>`).join('')}
      </div>
    `;
    const picked=[];
    const refresh=()=>{
      $('#berth-grid').querySelectorAll('.berth').forEach(el=> el.classList.toggle('on', picked.includes(el.dataset.id)));
      $('#seat-info').textContent = picked.length? `已选 ${picked.join('、')}（${picked.length}/${people}）`:'未选铺';
      $('#next-btn').disabled = picked.length<people;
      store.set({ selectedSeat: { id: picked.join(','), price:0 } });
    };
    $('#berth-grid').querySelectorAll('.berth').forEach(el=> el.onclick=()=>{
      const id=el.dataset.id;
      if(picked.includes(id)) picked.splice(picked.indexOf(id),1);
      else if(picked.length<people) picked.push(id);
      else { picked.shift(); picked.push(id); }
      refresh();
    });
    refresh();
  }
}
