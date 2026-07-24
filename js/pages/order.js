// ============================================================
// ⑥ 订单完成页
// [OTA 模式] 完成态反馈、电子行程单、退改说明、二次转化(再次预订)
// ============================================================
import { store } from '../store.js';
import { go } from '../router.js';
import { cityName } from '../ui.js';

export function renderOrder(app){
  const s = store.get();
  const o = s.order;
  const sel = s.selectedOutbound;
  const isFlight = s.tripType==='flight';

  app.innerHTML = `
    <div class="card">
      <div class="order-ok">
        <div class="ok">✓</div>
        <h2 style="margin:0 0 6px;">支付成功，订单已创建</h2>
        <div class="muted">本订单为模拟订单，未发生真实扣款。</div>
      </div>

      <div class="summary" style="max-width:560px;margin:0 auto;">
        <h3 class="section-title">电子行程单</h3>
        <div class="line"><span>订单号</span><b>${o.no}</b></div>
        <div class="line"><span>行程</span><span>${cityName(s.from)} → ${cityName(s.to)}</span></div>
        <div class="line"><span>日期/时间</span><span>${s.depDate} ${sel.dep}-${sel.arr}</span></div>
        <div class="line"><span>${isFlight?'航班':'车次'}</span><span>${isFlight?`${sel.airline.name} ${sel.flightNo}`:`${sel.railway.name} ${sel.trainNo}`}</span></div>
        <div class="line"><span>座位/铺位</span><span>${o.seat}</span></div>
        <div class="line"><span>旅客</span><span>${o.passengers} 人</span></div>
        <div class="line"><span>联系人</span><span>${s.contact.name} ${s.contact.phone}</span></div>
        <div class="line"><span>支付方式</span><span>${({wechat:'微信支付',alipay:'支付宝',card:'银行卡'})[o.payMethod]}</span></div>
        <div class="line"><span>支付时间</span><span>${o.payTime}</span></div>
        <div class="total"><span>实付</span><span class="price"><span class="yen">¥</span><span class="num">${o.total}</span></span></div>
      </div>

      <div style="max-width:560px;margin:14px auto 0;display:flex;gap:10px;">
        <button class="btn line" style="flex:1;" id="print">打印/保存行程单</button>
        <button class="btn" style="flex:1;" id="again">再次预订</button>
      </div>

      <div class="card" style="max-width:560px;margin:14px auto 0;background:var(--bg);">
        <h3 class="section-title">退改签说明（示意）</h3>
        <ul class="tiny" style="line-height:1.8;">
          <li>起飞/发车前 24 小时以上：免费改签 1 次，退票收 5% 手续费</li>
          <li>2-24 小时内：改签收 20%，退票收 20%</li>
          <li>2 小时以内：不支持退改</li>
          <li>以上规则为虚构示意，不构成任何真实条款</li>
        </ul>
      </div>
    </div>
  `;

  app.querySelector('#print').onclick=()=> window.print();
  app.querySelector('#again').onclick=()=>{ store.reset(); go('search'); };
}
