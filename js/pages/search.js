// ============================================================
// ① 搜索表单页
// [OTA 模式] 表单分组 + 联动校验 + 默认值；机票/火车票切换数据集
// ============================================================
import { store } from '../store.js';
import { go } from '../router.js';
import { cityPicker, datePicker, cityName, toast } from '../ui.js';
import { CABIN_CLASSES, BERTH_CLASSES } from '../data.js';

function todayStr(){ const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function addDaysStr(base, n){ const d=new Date(base); d.setDate(d.getDate()+n); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

export function renderSearch(app){
  const s = store.get();
  if(!s.depDate) store.set({ depDate: todayStr(), retDate: addDaysStr(todayStr(),3) });
  const st = store.get();

  app.innerHTML = `
    <div class="search-card card">
      <!-- 行程类型：机票 / 火车票 -->
      <div class="search-tabs">
        <button class="search-tab ${st.tripType==='flight'?'on':''}" data-trip="flight">✈ 国内机票</button>
        <button class="search-tab ${st.tripType==='train'?'on':''}" data-trip="train">🚄 火车票</button>
      </div>

      <!-- 单程/往返 -->
      <div class="trip-types">
        <button class="trip-type ${st.journeyType==='oneway'?'on':''}" data-jt="oneway">单程</button>
        <button class="trip-type ${st.journeyType==='roundtrip'?'on':''}" data-jt="roundtrip">往返</button>
      </div>

      <div class="search-grid">
        <div class="city-pair">
          <div class="field" style="margin:0;">
            <div class="city-box" id="from-box">
              <div class="lbl">出发城市</div>
              <div class="val" id="from-name">${cityName(st.from)}</div>
              <div class="sub">${st.from}</div>
            </div>
            <div class="swap" id="swap-btn" title="交换">⇄</div>
          </div>
        </div>
        <div class="city-pair">
          <div class="field" style="margin:0;">
            <div class="city-box" id="to-box">
              <div class="lbl">到达城市</div>
              <div class="val" id="to-name">${cityName(st.to)}</div>
              <div class="sub">${st.to}</div>
            </div>
          </div>
        </div>
        <div class="field">
          <label>出发日期</label>
          <div class="city-box" id="dep-box">
            <div class="val" style="font-size:16px;">${st.depDate}</div>
          </div>
        </div>
        <div class="field" id="ret-field" style="${st.journeyType==='roundtrip'?'':'display:none;'}">
          <label>返程日期</label>
          <div class="city-box" id="ret-box">
            <div class="val" style="font-size:16px;">${st.retDate}</div>
          </div>
        </div>
        <div class="field">
          <label>${st.tripType==='flight'?'舱位':'席别'}</label>
          <select class="select" id="class-sel">
            ${(st.tripType==='flight'?CABIN_CLASSES:BERTH_CLASSES).map(c=>`<option value="${c.code}" ${c.code===(st.tripType==='flight'?st.cabinClass:st.berthClass)?'selected':''}>${c.name}</option>`).join('')}
          </select>
        </div>
      </div>

      <!-- 人数 -->
      <div class="row" style="padding:0 20px 18px;">
        <div class="field"><label>成人(12+)</label><input class="input" type="number" min="1" max="9" id="adults" value="${st.adults}"></div>
        <div class="field"><label>儿童(2-12)</label><input class="input" type="number" min="0" max="8" id="children" value="${st.children}"></div>
        <div class="field"><label>婴儿(<2)</label><input class="input" type="number" min="0" max="4" id="infants" value="${st.infants}"></div>
      </div>

      <div style="padding:0 20px 20px;">
        <button class="btn lg block" id="search-btn">搜 索</button>
      </div>
    </div>
    <p class="tiny" style="margin-top:14px;">提示：本站数据为虚构 mock，仅用于学习订票流程交互。出发地、日期、舱位均可联动校验。</p>
  `;

  // ---- 事件绑定 ----
  const $ = (sel)=> app.querySelector(sel);

  // 机票/火车切换
  app.querySelectorAll('.search-tab').forEach(t=> t.onclick=()=>{
    store.set({ tripType: t.dataset.trip });
    renderSearch(app);
  });
  // 单程/往返
  app.querySelectorAll('.trip-type').forEach(t=> t.onclick=()=>{
    store.set({ journeyType: t.dataset.jt });
    renderSearch(app);
  });
  // 城市选择
  $('#from-box').onclick=()=> cityPicker((code,name)=>{ store.set({ from:code }); renderSearch(app); });
  $('#to-box').onclick=()=> cityPicker((code,name)=>{ store.set({ to:code }); renderSearch(app); });
  $('#swap-btn').onclick=()=>{ const c=store.get(); store.set({ from:c.to, to:c.from }); renderSearch(app); };
  // 日期
  $('#dep-box').onclick=()=> datePicker((d)=>{ store.set({ depDate:d }); renderSearch(app); }, { value:st.depDate, title:'出发日期' });
  if($('#ret-box')) $('#ret-box').onclick=()=> datePicker((d)=>{ store.set({ retDate:d }); renderSearch(app); }, { value:st.retDate, minDate:st.depDate, title:'返程日期' });
  // 舱位/席别
  $('#class-sel').onchange=(e)=>{
    if(st.tripType==='flight') store.set({ cabinClass:e.target.value });
    else store.set({ berthClass:e.target.value });
  };
  // 人数
  $('#adults').onchange=e=> store.set({ adults:+e.target.value||1 });
  $('#children').onchange=e=> store.set({ children:+e.target.value||0 });
  $('#infants').onchange=e=> store.set({ infants:+e.target.value||0 });
  // 提交
  $('#search-btn').onclick=()=>{
    const c = store.get();
    if(c.from===c.to){ toast('出发城市与到达城市不能相同','error'); return; }
    if(c.infants > c.adults){ toast('婴儿数不能超过成人数','error'); return; }
    if((c.adults+c.children)===0){ toast('至少需要 1 名成人或儿童','error'); return; }
    // 清掉旧选择
    store.set({ selectedOutbound:null, selectedRet:null, selectedSeat:null, passengers:[], order:null });
    go('results');
  };
}
