# 云途出行 SkyRoute · 订票流程学习站

> 个人学习项目。所有数据为虚构 mock，**不接入真实订票/支付，不采集真实信息，不使用任何真实 OTA 的品牌/视觉资产**。

## 运行方式
**双击 `index.html` 即可在浏览器打开运行**。项目已用 `bundle.py` 把 ES module 源码打包成单文件经典脚本 `js/bundle.js`（file:// 下浏览器禁止 ES module 的 import，故必须用经典脚本；index.html 已加载它）。

修改源码后，重新生成 bundle：
```bash
cd booking-learn
python bundle.py
```

若想以 ES module 原始方式运行（便于在 IDE/调试看模块），可用本地服务器并把 index.html 的 `<script src="js/bundle.js">` 改回 `<script type="module" src="js/router.js">`：
```bash
python -m http.server 8080
# 访问 http://localhost:8080
```

## 功能与流程
1. **搜索**：机票/火车票切换、单程/往返、城市选择器（热门+拼音首字母+搜索）、日期选择（往返联动）、舱位/席别、人数（成人/儿童/婴儿，婴儿≤成人校验）
2. **结果列表**：左侧筛选（航司/铁路局、时段、价格、直飞/中转）、排序（时间/价格/时长）、卡片列表、低价标
3. **选座/选铺**：机票客舱座位图（可选/已选/已售/锁定）、火车按席别选铺（上中下）
4. **旅客信息**：多人表单、证件校验（身份证 18 位）、联系人手机校验、发票抬头
5. **支付**：订单明细、15 分钟倒计时、模拟支付方式（不跳真实）、退改说明
6. **订单完成**：电子行程单、退改说明、再次预订

## 目录结构
```
index.html              应用外壳（顶栏+步骤条+路由挂载）
css/style.css           原创设计系统（CSS 变量）
js/data.js              mock 数据：城市/航班/车次/座位图/舱位席别
js/store.js             sessionStorage 状态层
js/router.js            hash 路由 + 流程守卫 + 步骤高亮
js/ui.js                通用组件：城市/日期选择器、弹层、Toast、倒计时
js/pages/search.js      ① 搜索
js/pages/results.js     ② 结果列表
js/pages/seats.js       ③ 选座/选铺
js/pages/passengers.js  ④ 旅客
js/pages/payment.js     ⑤ 支付
js/pages/order.js       ⑥ 订单
```

## 对应的 OTA 设计模式（学习索引）
- `index.html` 顶栏步骤条 → 全局流程导航
- `search.js` 表单分组+联动校验 → 联动表单/默认值
- `results.js` 筛选-列表-排序三栏 → 三栏式结果页/价格锚点
- `seats.js` 座位网格状态机 → 稀缺资源锁定/可视化选座
- `passengers.js` 重复行表单 → 多人表单/证件校验/草稿
- `payment.js` 倒计时+价格明细 → 紧迫感/透明定价/信任要素
- `order.js` 完成态+行程单 → 反馈/二次转化

## 自定义
- 城市在 `js/data.js` 的 `CITIES` 增删
- 航司/铁路局在 `AIRLINES` / `RAILWAYS` 改名（已虚构）
- 配色在 `css/style.css` 的 `:root` 变量改

## 说明
- 数据用种子伪随机生成，同一搜索条件结果稳定（刷新一致）
- 婴儿/儿童人数、往返日期联动、证件号格式、手机号均有前端校验演示
- 无任何后端、无真实支付、无数据外发
