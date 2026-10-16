# 无风小卖部

生产站点：<https://blog.wufeng.de/>

这是 `ws126837251` 账号的 GitHub Pages 用户站点，作为多个电话卡品牌教程的统一目录：

- [Giffgaff 使用指南](https://blog.wufeng.de/giffgaff/)
- [Lebara 使用指南](https://blog.wufeng.de/lebara/)

主站静态文件位于 `hub/`，由 `.github/workflows/tutorials-pages.yml` 部署。各产品教程使用独立仓库和 GitHub Issues 维护。

网站全部公开文案和品牌资料集中在 [`hub/site-content.json`](hub/site-content.json)。在 GitHub 中打开该文件，点击编辑按钮，修改引号内的文字并提交到 `main`，部署工作流会自动重新生成首页与 404 页面。不要删除字段名、引号、逗号或括号。

新增电话卡品牌时，在 `site-content.json` 的 `products` 数组中增加一条产品配置，并同步更新 `hub/sitemap.xml`；首页目录、品牌数量和卡片布局会自动适配。`hub/assets/products.js` 是部署时生成的兼容文件，不要直接修改。

每小时的 GitHub Actions 构建会运行 `scripts/sync-product-counts.mjs`，读取产品仓库的公开 Issues 数量并更新本次部署中的指南数量。`articleCount` 是本地构建前的兜底值，不会被自动同步结果提交回源码仓库。

## 动画设置

首页动画也集中在 `hub/site-content.json` 的 `animation` 中，可以直接在 GitHub 网页编辑：

- `animation.orbit.layerCount`：轨道总层数，建议 6–16。
- `animation.orbit.coreCount`：中心清晰轨道层数。
- `animation.orbit.aspects`：每层椭圆扁平程度，越小越扁；层数超过数组长度时会循环使用。
- `animation.orbit.rotations`：每层椭圆的初始倾斜角度。
- `animation.orbit.periodStart` / `periodStep`：旋转周期，数值越小越快。
- `animation.orbit.directions`：方向数组，`-1` 和 `1` 分别代表两个相反方向，例如 `[-1, 1]` 为逆顺交替。
- `animation.orbit.strokeColor`、透明度和线宽字段：调整颜色、深浅和线条粗细。
- `animation.pointer`：鼠标反馈强度；设为 `enabled: false` 可关闭。
- `animation.avatar`：头像悬停放大倍数、旋转角度和持续时间。

网页编辑后提交到 `main`，Actions 会自动生成并部署。数值超出安全范围时，前端会自动限制到安全值；JSON 语法错误会让 Actions 构建标红，需要先修正逗号、引号或括号。
