# 维护快照

- 时间：2026-10-16
- 任务：按 Gmeek 原始页面结构重做教程首页
- 变更前文件：`README.md`、`hub/index.html`、`hub/404.html`、`hub/assets/app.js`、`hub/assets/style.css`、`hub/assets/products.js`、`hub/assets/wufeng-avatar.png`、`hub/site-content.json`、`hub/site.webmanifest`、`hub/og-directory.png`、`scripts/render-catalog.mjs`、`scripts/validate-site.mjs`
- 说明：快照保留上一版首页及资源，用于在本地提交前回滚。
- 恢复方法：将快照中的文件复制回原路径；如不再需要头像资源，可移除 `hub/assets/wufeng-avatar.png`。
