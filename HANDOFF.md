# 无风小卖部教程站阶段交接文档

> 写给下一位没有本会话上下文的维护者。本文记录截至 2026-10-17 的仓库、线上站点、动画行为、验证结果和后续操作边界。

## 1. 我们在做什么

这是“无风小卖部”的全球 SIM 卡使用指南站点。首页负责展示品牌目录和进入各品牌教程，教程正文不在本仓库维护，而是放在各品牌独立仓库的 GitHub Issues 中，由 Gmeek 等流程生成品牌页面。

当前站点结构：

- 主站首页：<https://blog.wufeng.de/>
- Giffgaff 教程：<https://blog.wufeng.de/giffgaff/>
- Lebara 教程：<https://blog.wufeng.de/lebara/>
- Giffgaff 文章仓库：`ws126837251/giffgaff`
- Lebara 文章仓库：`ws126837251/lebara`

目标是让首页可以继续扩展更多电话卡或其他产品，而不是只为 Giffgaff 和 Lebara 固定设计；品牌入口、统计和头像动画参数应尽量通过配置维护。

## 2. 仓库和部署信息

- GitHub 仓库：`ws126837251/ws126837251.github.io`
- 分支：`main`
- 本地唯一源码目录：`H:\codex\Workspace\10-projects\tutorials-hub\src`
- GitHub Pages 部署目录：`hub/`
- 生产域名配置：`hub/CNAME` 内容为 `blog.wufeng.de`
- 部署工作流：`.github/workflows/tutorials-pages.yml`
- 交接前最后一个网站功能提交：`7d3c42744186f6ca3917b40334d449f843b9cd10`，提交说明 `fix: 悬停正位后暂停头像`
- 当前 `HEAD` 与 `origin/main` 一致
- 最近一次 Pages 工作流：`38991550939`，结果为 `success`

工作流在以下情况自动运行：

- 推送到 `main`，且改动涉及 `hub/**`、`scripts/**` 或部署工作流本身；
- GitHub Actions 的定时任务每小时运行一次，用于同步公开 Issues 数量。

只修改根目录的 `HANDOFF.md`、`README.md` 等说明文件不会触发 Pages 部署；如果任务同时修改网站源码，才需要等待 Pages 工作流并检查线上页面。

## 3. 已完成的工作

### 3.1 首页和品牌目录

- 首页定位已统一为“无风小卖部”，不是“无风电话卡教程”。
- 首页文案使用“全球 SIM 卡使用指南”。
- 产品目录目前包含 Giffgaff 和 Lebara，并保留继续增加产品的配置结构。
- Giffgaff 和 Lebara 入口分别使用 `/giffgaff/`、`/lebara/`。
- 产品数量和指南数量可由配置及 Actions 的公开 Issues 同步逻辑更新。

### 3.2 头像素材

- `hub/assets/wufeng-avatar.png` 已更新。
- 图案下方的大字和副标语已去掉。
- 图案内部的“无风小卖部”改为“无风”。
- 图案保持居中，作为圆形头像使用。

### 3.3 头像旋转行为

当前实现位于 `hub/assets/app.js` 的 `initializeAvatarAnimation`：

1. 正常状态：头像持续顺时针旋转。
2. 鼠标移入头像：暂停基础自转，读取当前显示角度。
3. 悬停动画：顺时针继续转至少配置的 `hoverRotation`，并在下一次正位（0°）结束。
4. 到达正位后：保持正位并暂停，只要鼠标仍在头像上就不会继续转。
5. 鼠标移开：读取当前角度，取消悬停动画，从该角度恢复顺时针自转，不会跳回初始角度。
6. 设置了 `prefers-reduced-motion` 时，会尊重系统的减少动态效果偏好。

当前头像动画参数：

```json
"avatar": {
  "spinDuration": 18,
  "hoverScale": 1.15,
  "hoverRotation": 360,
  "hoverDuration": 0.8
}
```

含义：

- `spinDuration`：平时转一圈的秒数，越小越快。
- `hoverRotation`：鼠标移入后至少顺时针转多少度，默认 360°；动画会继续调整到正位。
- `hoverDuration`：悬停回正过程的秒数。
- `hoverScale`：鼠标移入时头像放大倍数。

## 4. 当前卡在哪

当前没有已知的代码阻塞或未完成的发布步骤：

- 源码已经提交并推送。
- Pages 工作流已成功。
- 首页、404、Giffgaff 子站、Lebara 子站均已做 HTTP 检查。
- `/assets/app.js` 和 `/site-content.json` 在线版本包含最新头像动画逻辑和参数。

后续真正需要用户决定的是视觉微调，而不是修复已知故障，例如：头像大小、按钮文案、是否新增品牌。不要把这些偏好当成当前阻塞。

工作区中还有一个预先存在、与本次任务无关的未跟踪目录：

`maintenance-backups/2026-08-08_01_before-lebara-pinned-sync/`

不要擅自删除或覆盖它。它不是当前源码改动，也不应被本次提交带入。

## 5. 下一步计划

### 如果只是改首页文字或头像动画参数

1. 先运行 `git status --short`，确认没有把无关改动混入任务。
2. 在 `maintenance-backups/` 新建本次修改前快照，命名格式为 `YYYY-MM-DD_序号_before-任务名`，并写 `manifest.md`。
3. 编辑 `hub/site-content.json`：
   - 普通文案、品牌资料、产品入口在 `meta`、`brand`、`navigation`、`footer`、`products`。
   - 头像动画在 `animation.avatar`。
4. 运行验证：

   ```powershell
   node scripts/render-catalog.mjs
   node scripts/validate-site.mjs
   git diff --check
   ```

5. 检查桌面和移动端：首页、键盘焦点、`prefers-reduced-motion`、按钮路径、404 页面。
6. 按当前用户授权，常规网站任务可直接提交、推送并部署；提交格式使用 `<type>: <中文描述>`，例如：

   ```text
   fix: 调整首页头像动画
   ```

7. 推送后等待 `.github/workflows/tutorials-pages.yml` 成功，再检查真实网址，不要只以本地构建成功或 HTTP 200 判定完成。

### 如果要新增品牌

1. 在 `hub/site-content.json` 的 `products` 数组增加一项，使用稳定的小写英文 `slug`。
2. 设置 `name`、`mark`、`path`、`issuesRepo`、`regions`、`state`、`summary`、`topics`、颜色和兜底 `articleCount`。
3. 同步更新 `hub/sitemap.xml`，确认新路径可访问。
4. 运行 `node scripts/render-catalog.mjs`，让生成的 `hub/assets/products.js` 与配置一致；不要直接编辑生成文件。
5. 新产品教程正文放在独立 GitHub 仓库的 Issues，不要在本仓库硬编码文章 HTML。

### 如果要改产品教程正文

- Giffgaff：到 `ws126837251/giffgaff` 的 GitHub Issues 修改。
- Lebara：到 `ws126837251/lebara` 的 GitHub Issues 修改。
- 不要直接修改这些产品仓库由 Gmeek 生成的文章 HTML。

## 6. 文件职责速查

- `hub/index.html`：首页 HTML 结构和无 JS 时的静态兜底。
- `hub/404.html`：未找到页面。
- `hub/site-content.json`：可编辑的站点文案、品牌入口、动画参数；优先改这里。
- `hub/assets/app.js`：目录渲染、搜索/筛选和头像动画。
- `hub/assets/style.css`：布局、颜色、响应式样式、按钮和头像外观。
- `hub/assets/products.js`：由配置生成的兼容文件，不要直接修改。
- `hub/assets/wufeng-avatar.png`：头像图片资源。
- `hub/sitemap.xml`：搜索引擎站点地图。
- `hub/site.webmanifest`：Web App Manifest。
- `hub/robots.txt`：爬虫入口规则。
- `scripts/render-catalog.mjs`：从配置生成目录兜底和统计。
- `scripts/sync-product-counts.mjs`：从产品仓库公开 Issues 同步文章数量。
- `scripts/validate-site.mjs`：检查必需文件、JSON、链接关键字、动画设置和生成文件一致性。
- `.github/workflows/tutorials-pages.yml`：GitHub Pages 构建、上传和部署。
- `README.md`：维护者使用说明和动画字段说明。
- `HANDOFF.md`：本阶段交接文档；只记录状态，不参与网站渲染。

## 7. GitHub 网页编辑入口

最常用的配置编辑地址：

<https://github.com/ws126837251/ws126837251.github.io/edit/main/hub/site-content.json>

网页修改时只改 JSON 值，不要删除字段名、引号、逗号或括号。提交到 `main` 后，若改动路径命中部署工作流，Actions 会自动发布。

## 8. 已踩过的坑，不要再踩

### 8.1 不要把“构建成功”当成上线成功

必须同时确认 GitHub Actions 成功、真实域名内容已更新、子页面可访问、关键资源返回正确内容。Cloudflare/CDN 缓存可能让旧页面短时间继续出现，必要时带查询参数重新检查。

### 8.2 不要只修生成文件

`hub/assets/products.js` 是生成/兼容文件。产品和入口源数据在 `hub/site-content.json`，直接改生成文件会在下一次构建时被覆盖。

### 8.3 不要直接改 Gmeek 生成的文章 HTML

文章源头是产品仓库的 GitHub Issues。应在对应 Issues 修改，等待产品仓库自己的生成流程更新。

### 8.4 不要把固定两个品牌写死到首页逻辑

首页必须从 `products` 数组渲染，统计、筛选、按钮和布局要能适应第三个及更多产品。

### 8.5 不要让动画逻辑互相抢写 `transform`

头像基础动画使用 Web Animations API 的 `rotate` 属性，CSS 只负责缩放和兜底样式。不要重新给头像同时添加 CSS `transform: rotate(...)`、JS `transform` 和 Web Animations 的旋转，否则会出现跳转、遮挡、悬停不能停止或移开时角度突变。

### 8.6 不要破坏悬停状态机

悬停时要暂停基础自转，回到正位后保持停止；移开时应从当前角度恢复，而不是重置到 0°。改动 `initializeAvatarAnimation` 后必须用鼠标实际测试“移入—回正—停住—移出—继续转”完整流程。

### 8.7 不要为了小改动覆盖用户现有改动

每次操作前先看 `git status --short`。只暂存本次相关文件；当前已有的 `maintenance-backups/2026-08-08_01_before-lebara-pinned-sync/` 未跟踪目录属于既有内容，不要带入提交。

### 8.8 不要泄露凭据

不要把密码、令牌、Cookie、私钥或 GitHub Actions secret 写入源码、日志、交接文档或回复。账号和认证信息只按仓库维护规则保存在指定凭据位置。

### 8.9 快照只保留最新三份

人工修改前创建快照，目录包含 `manifest.md`。完成后按目录名清理更早的人工快照，但不要删除产品文章、Issues、密钥、有效 Git 历史或用户唯一数据。

## 9. 新会话接手时的第一轮检查

```powershell
Set-Location 'H:\codex\Workspace\10-projects\tutorials-hub\src'
git status --short
git log -5 --oneline --decorate
node scripts/validate-site.mjs
```

然后打开：

- <https://blog.wufeng.de/>
- <https://blog.wufeng.de/404-check>
- <https://blog.wufeng.de/giffgaff/>
- <https://blog.wufeng.de/lebara/>

重点确认：头像默认顺时针转；移入后顺时针回正并停止；移开后恢复旋转；移动端头像和按钮不过大，按钮按列居中；减少动态效果设置生效。

## 10. 一句话交接结论

这个阶段已经完成并发布：无风小卖部首页、Giffgaff/Lebara 入口和“移入回正停住、移开继续转”的头像逻辑均已上线；下一会话只需在保留快照和验证流程的前提下继续做头像视觉参数或新增品牌内容，不需要从头重做。
