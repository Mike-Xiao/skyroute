// ============================================================
// ④ 旅客信息页
// [OTA 模式] 重复行表单(多人)、证件校验、联系人、发票抬头、草稿暂存
// ============================================================
import { store } from '../store.js';
import { go } from '../router.js';
import { toast } from '../ui.js';

const ID_TYPES = ['身份证','护照','港澳通行证','台胞证','出生证明'];

export function renderPassengers(app){
  const s = store.get();
  // 初始化旅客数组：按人数
  let pax = s.passengers.length ? [...s.passengers] : [];
  const need = s.adults + s.children;
  while(pax.length < need) pax.push({ type: pax.length < s.adults ? 'adult':'child', name:'', idType:'身份证', idNo:'', birth:'' });

  app.innerHTML = `
    <h2 class="section-title">填写旅客信息</h2>
    <div id="pax-list"></div>
    <div class="card" style="margin-top:14px;">
      <h3 class="section-title">联系人</h3>
      <div class="row">
        <div class="field"><label>联系人姓名</label><input class="input" id="contact-name" value="${s.contact.name}" placeholder="取票/通知联系人"></div>
        <div class="field"><label>手机号</label><input class="input" id="contact-phone" value="${s.contact.phone}" placeholder="11 位手机号"></div>
      </div>
      <div class="field"><label>发票抬头（选填）</label><input class="input" id="invoice" placeholder="个人或单位名称"></div>
    </div>
    <div style="margin-top:18px;display:flex;justify-content:space-between;">
      <button class="btn line" id="back">← 返回选座</button>
      <button class="btn lg" id="next">下一步：支付</button>
    </div>
  `;

  const $ = (sel)=> app.querySelector(sel);

  function renderPaxList(){
    $('#pax-list').innerHTML = pax.map((p,i)=>`
      <div class="pax-card">
        <div class="pax-head">
          <b>旅客 ${i+1}</b>
          <span class="tag">${p.type==='adult'?'成人':'儿童'}</span>
        </div>
        <div class="row">
          <div class="field"><label>姓名</label><input class="input pax-name" data-i="${i}" value="${p.name}" placeholder="与证件一致"></div>
          <div class="field"><label>证件类型</label>
            <select class="select pax-idtype" data-i="${i}">
              ${ID_TYPES.map(t=>`<option ${t===p.idType?'selected':''}>${t}</option>`).join('')}
            </select>
          </div>
          <div class="field"><label>证件号码</label><input class="input pax-idno" data-i="${i}" value="${p.idNo}" placeholder="证件号"></div>
          <div class="field"><label>出生日期</label><input class="input pax-birth" data-i="${i}" type="date" value="${p.birth}"></div>
        </div>
      </div>`).join('');
    // 绑定输入
    app.querySelectorAll('.pax-name').forEach(el=> el.oninput=()=> pax[+el.dataset.i].name=el.value);
    app.querySelectorAll('.pax-idtype').forEach(el=> el.onchange=()=> pax[+el.dataset.i].idType=el.value);
    app.querySelectorAll('.pax-idno').forEach(el=> el.oninput=()=> pax[+el.dataset.i].idNo=el.value);
    app.querySelectorAll('.pax-birth').forEach(el=> el.onchange=()=> pax[+el.dataset.i].birth=el.value);
  }
  renderPaxList();

  $('#contact-name').oninput=e=> store.get().contact.name = e.target.value;
  $('#contact-phone').oninput=e=> store.get().contact.phone = e.target.value;
  $('#back').onclick=()=> go('seats');
  $('#next').onclick=()=>{
    // 校验
    for(const p of pax){
      if(!p.name.trim()){ toast('请填写全部旅客姓名','error'); return; }
      if(!p.idNo.trim()){ toast('请填写全部证件号','error'); return; }
      if(p.idType==='身份证' && !/^\d{17}[\dXx]$/.test(p.idNo)){ toast('身份证号格式有误','error'); return; }
    }
    const c = { name: $('#contact-name').value.trim(), phone: $('#contact-phone').value.trim() };
    if(!c.name){ toast('请填写联系人姓名','error'); return; }
    if(!/^1\d{10}$/.test(c.phone)){ toast('手机号格式有误','error'); return; }
    store.set({ passengers: pax, contact: c, invoice: $('#invoice').value.trim() });
    go('payment');
  };
}
