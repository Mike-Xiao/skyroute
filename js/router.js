// ============================================================
// 路由：hash 路由（file:// 也能跑）
// [OTA 模式] 单页多步流程，hash 路由让每步可前进/后退/刷新。
// ============================================================

import { store } from './store.js';
import { renderSearch } from './pages/search.js';
import { renderResults } from './pages/results.js';
import { renderSeats } from './pages/seats.js';
import { renderPassengers } from './pages/passengers.js';
import { renderPayment } from './pages/payment.js';
import { renderOrder } from './pages/order.js';
import { toast } from './ui.js';

const routes = {
  search: { render: renderSearch, step: 0 },
  results: { render: renderResults, step: 1 },
  seats: { render: renderSeats, step: 2 },
  passengers: { render: renderPassengers, step: 3 },
  payment: { render: renderPayment, step: 4 },
  order: { render: renderOrder, step: 5 },
};

// 步骤顺序（用于"是否可直达某步"校验）
const stepOrder = ['search','results','seats','passengers','payment','order'];

window.addEventListener('hashchange', render);

function currentRoute(){
  const h = location.hash.replace(/^#\/?/, '');
  const name = h.split('/')[0] || 'search';
  return routes[name] ? name : 'search';
}

export function go(route){
  if(!routes[route]) route = 'search';
  location.hash = '#/' + route;
}

function highlightStep(name){
  const idx = stepOrder.indexOf(name);
  document.querySelectorAll('.step').forEach((el)=>{
    const s = el.dataset.step;
    const si = stepOrder.indexOf(s);
    el.classList.remove('active','done');
    if(si < idx) el.classList.add('done');
    else if(si === idx) el.classList.add('active');
  });
}

function render(){
  const name = currentRoute();
  const app = document.getElementById('app');

  // 流程守卫：没选航班就不能进选座等（[OTA 模式] 流程依赖校验）
  const s = store.get();
  const needSelection = ['seats','passengers','payment','order'];
  if(needSelection.includes(name) && !s.selectedOutbound){
    toast('请先选择航班/车次');
    setTimeout(()=> go('results'), 600);
    return;
  }
  if(name === 'payment' && !s.passengers.length){
    toast('请先填写旅客信息');
    setTimeout(()=> go('passengers'), 600);
    return;
  }
  if(name === 'order' && !s.order){
    toast('请先完成支付');
    setTimeout(()=> go('payment'), 600);
    return;
  }

  window.scrollTo(0,0);
  highlightStep(name);
  const r = routes[name];
  app.innerHTML = '';
  r.render(app);
}

// 首次进入
if(!location.hash) location.hash = '#/search';
else render();
