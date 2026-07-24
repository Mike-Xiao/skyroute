// ============================================================
// 状态层：跨页状态用 sessionStorage 持久（刷新不丢）
// [OTA 模式] 真实 OTA 会把订单草稿存后端；学习版用 sessionStorage 演示。
// ============================================================

const KEY = 'skyroute_state_v1';

const defaults = {
  tripType: 'flight',      // 'flight' | 'train'
  journeyType: 'oneway',   // 'oneway' | 'roundtrip'
  from: 'BJS',
  to: 'SHA',
  depDate: '',
  retDate: '',
  cabinClass: 'Y',         // 机票舱位
  berthClass: 'ZE',        // 火车席别
  adults: 1,
  children: 0,
  infants: 0,
  // 结果页选中
  selectedOutbound: null,  // 选中的航班/车次对象
  selectedRet: null,      // 往程（往返时）
  selectedSeat: null,      // 选中座位
  // 旅客
  passengers: [],
  contact: { name:'', phone:'' },
  // 订单
  order: null,
};

let state = load();

function load(){
  try{
    const s = JSON.parse(sessionStorage.getItem(KEY));
    return Object.assign({}, defaults, s||{});
  }catch{ return {...defaults}; }
}
function save(){
  sessionStorage.setItem(KEY, JSON.stringify(state));
}

export const store = {
  get(){ return state; },
  set(patch){ state = Object.assign({}, state, patch); save(); return state; },
  reset(){ state = {...defaults}; save(); },
  // 计算总价
  totalPrice(){
    const s = state;
    if(!s.selectedOutbound) return 0;
    const base = s.selectedOutbound.price;
    const people = s.adults + s.children;
    let total = base * people;
    if(s.selectedSeat) total += (s.selectedSeat.price||0)*people;
    return total;
  },
};
