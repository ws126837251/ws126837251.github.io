# 维护快照

- 时间：2026-10-16
- 任务：将教程首页改为简约固定配色、旋转头像和线条背景
- 变更前文件：`README.md`、`hub/index.html`、`hub/404.html`、`hub/assets/style.css`、`hub/assets/app.js`、`hub/og-directory.png`、`hub/site-content.json`、`hub/site.webmanifest`、`scripts/render-catalog.mjs`、`scripts/validate-site.mjs`
- 说明：头像使用用户提供的无风小卖部图片；社交预览图也改用该图片。
- 恢复方法：将快照中的文件复制回原路径，移除 `hub/assets/wufeng-avatar.png`，重新运行站点校验。
