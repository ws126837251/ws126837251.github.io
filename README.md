# 无风小卖部

生产站点：<https://tutorials.wufeng.de/>

这是 `ws126837251` 账号的 GitHub Pages 用户站点，作为多个电话卡品牌教程的统一目录：

- [Giffgaff 使用指南](https://tutorials.wufeng.de/giffgaff/)
- [Lebara 使用指南](https://tutorials.wufeng.de/lebara/)

主站静态文件位于 `hub/`，由 `.github/workflows/tutorials-pages.yml` 部署。各产品教程使用独立仓库和 GitHub Issues 维护。

网站全部公开文案和品牌资料集中在 [`hub/site-content.json`](hub/site-content.json)。在 GitHub 中打开该文件，点击编辑按钮，修改引号内的文字并提交到 `main`，部署工作流会自动重新生成首页与 404 页面。不要删除字段名、引号、逗号或括号。

新增电话卡品牌时，在 `site-content.json` 的 `products` 数组中增加一条产品配置，并同步更新 `hub/sitemap.xml`；搜索、地区筛选、品牌数量和卡片布局会自动适配。`hub/assets/products.js` 是部署时生成的兼容文件，不要直接修改。

每小时的 GitHub Actions 构建会运行 `scripts/sync-product-counts.mjs`，读取产品仓库的公开 Issues 数量并更新本次部署中的指南数量。`articleCount` 是本地构建前的兜底值，不会被自动同步结果提交回源码仓库。
