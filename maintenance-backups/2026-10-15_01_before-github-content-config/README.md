# 无风小卖部

生产站点：<https://tutorials.wufeng.de/>

这是 `ws126837251` 账号的 GitHub Pages 用户站点，作为多个电话卡品牌教程的统一目录：

- [Giffgaff 使用指南](https://tutorials.wufeng.de/giffgaff/)
- [Lebara 使用指南](https://tutorials.wufeng.de/lebara/)

主站静态文件位于 `hub/`，由 `.github/workflows/tutorials-pages.yml` 部署。各产品教程使用独立仓库和 GitHub Issues 维护。

首页目录由 `hub/assets/products.js` 驱动。新增电话卡品牌时，在该文件增加一条产品配置，并同步更新 `hub/sitemap.xml`；搜索、地区筛选、品牌数量和卡片布局会自动适配，部署时也会自动生成无 JavaScript 的品牌入口。

每小时的 GitHub Actions 构建会运行 `scripts/sync-product-counts.mjs`，读取产品仓库的公开 Issues 数量并更新本次部署中的指南数量。`articleCount` 是本地构建前的兜底值，不会被自动同步结果提交回源码仓库。
