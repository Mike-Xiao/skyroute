# 部署到 Cloudflare Pages（免费 + HTTPS + 公网可访问）

项目已是纯静态站，无需任何改动即可部署。两种方式任选其一。

## 方式 A：直接上传（最快，1 分钟上线）

在项目根目录 `booking-learn/` 下执行：

```bash
# 1. 安装 wrangler（Cloudflare 官方 CLI）
npx wrangler@latest pages deploy . --project-name skyroute

# 首次运行会弹出浏览器让你登录 Cloudflare（免费注册即可）
# 登录后自动上传，完成后输出公网地址：
#   https://skyroute-xxxx.pages.dev
```

> 之后改了代码，再跑一次同一条命令即可更新上线。

## 方式 B：连 GitHub 仓库（自动部署）

1. 把 `booking-learn/` 推到你的 GitHub 仓库：
   ```bash
   git init
   git add .
   git commit -m "init skyroute"
   git branch -M main
   git remote add origin https://github.com/你的用户名/skyroute.git
   git push -u origin main
   ```
2. 登录 [Cloudflare Pages 控制台](https://dash.cloudflare.com/?to=/:account/pages) → Create project → Connect to Git → 选仓库
3. 构建设置：Framework = None，Build command 留空，Output dir = `/`（根目录）
4. Save and Deploy → 得到 `xxx.pages.dev` 地址
5. 以后 `git push` 自动更新上线

## 常见问题
- **国内访问**：Cloudflare Pages 在国内通常可访问，偶尔波动；若要更稳，可绑定自己的域名（Pages 控制台 Custom domains）。
- **要不要备案**：用 Cloudflare 自带 `*.pages.dev` 域名不需要国内备案；若绑定自己域名且服务器/CDN在国内则需备案。本站用 Cloudflare 边缘，无需备案。
- **改代码后**：方式 A 重跑命令；方式 B `git push` 即自动部署。
- **数据/支付**：本站为 mock，上线后"订票""支付"仍是浏览器里的模拟，不接真实接口——适合展示/学习，不适合真卖票。

## 项目部署就绪检查（已通过）
- `index.html` 在根目录 ✅
- 所有资源路径相对（`js/bundle.js`、`css/style.css`） ✅
- hash 路由（无需服务器 SPA 回退配置） ✅
- 无后端依赖 ✅
