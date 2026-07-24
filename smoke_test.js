// 冒烟测试：用最小 DOM 桩在 node 里跑一遍 bundle.js + 触发搜索页渲染，
// 捕捉顶层 ReferenceError 与首次渲染的运行时错误。
// 用法: node smoke_test.js
const fs = require('fs');
const path = require('path');

const noop = () => {};
function fakeEl(){
  return {
    innerHTML:'', textContent:'', value:'', className:'',
    dataset:{}, style:{cssText:''},
    classList:{add:noop,remove:noop,toggle:(c,v)=>{}},
    addEventListener:noop, removeEventListener:noop,
    onclick:null, oninput:null, onchange:null,
    querySelector:()=>fakeEl(), querySelectorAll:()=>[],
    appendChild:()=>fakeEl(), setAttribute:noop, focus:noop,
    getElementsByTagName:()=>[], parentElement:null,
    remove:noop,
  };
}
const listeners = {};
globalThis.window = globalThis;
globalThis.addEventListener = (t,cb)=>{ (listeners[t]=listeners[t]||[]).push(cb); };
globalThis.removeEventListener = noop;
globalThis.document = {
  getElementById:()=>fakeEl(),
  querySelector:()=>fakeEl(),
  querySelectorAll:()=>[],
  createElement:()=>fakeEl(),
  body:fakeEl(),
  addEventListener:(t,cb)=>{ (listeners[t]=listeners[t]||[]).push(cb); },
  removeEventListener:noop,
};
globalThis.location = { hash:'' };
globalThis.sessionStorage = {
  store:{}, getItem(k){return this.store[k]||null;}, setItem(k,v){this.store[k]=v;}, removeItem(k){delete this.store[k];},
};
globalThis.scrollTo = noop;
globalThis.setTimeout = setTimeout; globalThis.clearTimeout = clearTimeout;
globalThis.setInterval = (fn)=>{ return 0; }; globalThis.clearInterval = noop;
globalThis.requestAnimationFrame = noop;
globalThis.alert = noop;

// 加载 bundle
const code = fs.readFileSync(path.join(__dirname,'js','bundle.js'),'utf8');
// 用函数包裹运行，避免污染；const 在函数作用域内仍可被同闭包内引用
const run = new Function(code);
try { run(); console.log('✓ bundle 顶层执行无错误'); }
catch(e){ console.error('✗ bundle 顶层错误:', e.message); process.exit(1); }

// 触发渲染：设置 hash 并调用 hashchange 监听
try {
  globalThis.location.hash = '#/search';
  (listeners.hashchange||[]).forEach(cb=>cb());
  console.log('✓ 触发 #/search 渲染无错误');
} catch(e){
  console.error('✗ 渲染 #/search 错误:', e.message, '\n', e.stack);
  process.exit(1);
}

// 触发结果页（需要先有 selectedOutbound，会被守卫拦下 → toast → 跳 results）
try {
  globalThis.location.hash = '#/seats';
  (listeners.hashchange||[]).forEach(cb=>cb());
  console.log('✓ 触发 #/seats 守卫无错误');
} catch(e){
  console.error('✗ #/seats 错误:', e.message);
  process.exit(1);
}
console.log('冒烟测试通过 ✔');
