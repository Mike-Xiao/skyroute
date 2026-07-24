// ============================================================
// ⑤ 支付页：订单摘要 + 倒计时 + 模拟支付方式
// [OTA 模式] 紧迫感倒计时、价格明细、退改说明、信任要素
//   注意：仅前端模拟，不跳任何真实支付。
// ============================================================
import { store } from '../store.js';
import { go } from '../router.js';
import { cityName, countdown, toast } from '../ui.js';

export function renderPayment(app){
  const s = store.get();
  const sel = s.selectedOutbound;
  const isFlight = s.tripType==='flight';
  const people = s.adults + s.children;
  const base = sel.price * people;
  const seatFee = (s.selectedSeat && s.selectedSeat.price) ? s.selectedSeat.price*people : 0;
  const fuel = isFlight ? 50*people : 0;       // 机票机建燃油（示意）
  const insurance = isFlight ? 30*people : 5*people; // 保险示意
  const total = base + seatFee + fuel + insurance;

  app.innerHTML = `
    <div class="pay-grid">
      <div>
        <div class="card">
          <h3 class="section-title">行程信息</h3>
          <div style="display:flex;justify-content:space-between;">
            <div>
              <div><b>${cityName(s.from)} → ${cityName(s.to)}</b></div>
              <div class="muted">${s.depDate} · ${sel.dep}-${sel.arr} · ${isFlight?`${sel.airline.name} ${sel.flightNo}`:`${sel.railway.name} ${sel.trainNo}`}</div>
              <div class="tiny">座位：${s.selectedSeat? s.selectedSeat.id || '未选座' : '未选座'}</div>
            </div>
            <div style="text-align:right;">
              <div class="tiny">旅客 ${s.passengers.length} 人</div>
              <div class="tiny">${s.contact.name} ${s.contact.phone}</div>
            </div>
          </div>
        </div>

        <div class="card" style="margin-top:14px;">
          <h3 class="section-title">选择支付方式</h3>
          <div class="pay-method on" data-pay="wechat"><span style="font-size:20px;">💚</span><div><div><b>微信支付</b></div><div class="tiny">推荐</div></div></div>
          <div class="pay-method" data-pay="alipay"><span style="font-size:20px;">💙</span><div><b>支付宝</b></div></div>
          <div class="pay-method" data-pay="card"><span style="font-size:20px;">💳</span><div><b>银行卡</b> <span class="tiny">（模拟，不跳真实）</span></div></div>
          <button class="btn lg block" id="pay-btn">确认支付 ¥${total}</button>
          <p class="tiny" style="text-align:center;margin-top:10px;">本站为学习项目，点击"确认支付"仅模拟下单成功，不会发生真实扣款。</p>
        </div>
      </div>

      <div>
        <div class="summary">
          <h3 class="section-title">订单明细</h3>
          <div class="line"><span>票价 × ${people}</span><span>¥${base}</span></div>
          ${seatFee?`<div class="line"><span>选座费 × ${people}</span><span>¥${seatFee}</span></div>`:''}
          ${fuel?`<div class="line"><span>机建燃油 × ${people}</span><span>¥${fuel}</span></div>`:''}
          <div class="line"><span>保险 × ${people}</span><span>¥${insurance}</span></div>
          <div class="total"><span>合计</span><span class="price"><span class="yen">¥</span><span class="num">${total}</span></span></div>
          <div style="margin-top:12px;padding:10px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--ink-2);">
            <b>退改说明（示意）</b><br>
            · 起飞/发车前 24 小时可免费改签一次<br>
            · 退票按时段收取手续费（详见虚构规则）<br>
            · 本订单不支持婴儿单独购票
          </div>
        </div>
        <div class="card" style="margin-top:14px;text-align:center;">
          <div class="tiny">请在 <span class="countdown" id="cd"></span> 内完成支付</div>
          <div class="tiny" style="margin-top:6px;">超时订单将自动取消</div>
        </div>
      </div>
    </div>
  `;

  const $ = (sel)=> app.querySelector(sel);
  // 倒计时 15 分钟
  const stop = countdown($('#cd'), 15, ()=>{
    toast('订单已超时，请重新选择','error');
    setTimeout(()=> go('results'), 1200);
  });

  // 支付方式切换
  app.querySelectorAll('.pay-method').forEach(el=> el.onclick=()=>{
    app.querySelectorAll('.pay-method').forEach(x=> x.classList.remove('on'));
    el.classList.add('on');
  });

  $('#pay-btn').onclick=()=>{
    stop();
    // 生成虚构订单号
    const orderNo = 'SR' + Date.now().toString().slice(-10);
    store.set({ order: {
      no: orderNo,
      total,
      payMethod: app.querySelector('.pay-method.on').dataset.pay,
      payTime: new Date().toLocaleString('zh-CN'),
      seat: s.selectedSeat? s.selectedSeat.id : '未选座',
      passengers: s.passengers.length,
    }});
    go('order');
  };
}
