# 无风小卖部维护规则

## 项目概览

- 本仓库是 `ws126837251` 的 GitHub Pages 用户站点。
- 生产站点：`https://tutorials.wufeng.de/`
- 主站源码：`hub/`
- 部署工作流：`.github/workflows/tutorials-pages.yml`
- 产品教程使用独立项目仓库：
  - `ws126837251/giffgaff`
  - `ws126837251/lebara`

## 文件职责

- `hub/index.html`：电话卡教程目录首页。
- `hub/assets/style.css`：主站样式。
- `hub/assets/products.js`：电话卡品牌与入口数据。
- `hub/assets/app.js`：目录搜索、地区筛选和卡片渲染。
- `scripts/render-catalog.mjs`：根据产品数据生成首页静态兜底卡片和统计。
- `hub/404.html`：主站未找到页面。
- `hub/og-directory.png`：当前社交分享预览图。
- `hub/robots.txt`、`hub/sitemap.xml`：搜索引擎入口。
- `.github/workflows/tutorials-pages.yml`：GitHub Pages 部署流程。

## 修改原则

- 主站只负责产品入口和公共说明，不在本仓库维护产品教程正文。
- Giffgaff 文章在 `ws126837251/giffgaff` 的 GitHub Issues 中维护。
- Lebara 文章在 `ws126837251/lebara` 的 GitHub Issues 中维护。
- 新增产品时使用稳定的小写英文仓库名和路径，在 `hub/assets/products.js` 增加配置，并同步更新站点地图。
- 首页不得针对固定的两个品牌设计；目录、统计和筛选必须能适应品牌数量增长。
- 保留中文内容和 UTF-8 编码。
- 不直接修改各产品仓库由 Gmeek 自动生成的文章 HTML。

## 维护备份规则

- 每次人工修改源文件之前，在 `maintenance-backups/` 下创建独立快照。
- 快照目录使用 `YYYY-MM-DD_序号_before-任务名` 命名，并包含 `manifest.md`。
- 人工维护快照只保留最新 3 个版本；超过时按目录名删除最早版本。

## 验证要求

- 检查首页全部内部链接和产品路径。
- 检查 HTML、CSS、站点地图和 Web App Manifest。
- 检查桌面端与移动端布局，以及键盘焦点和减少动态效果设置。
- 修改工作流后检查 YAML 语法、Pages 权限、上传目录和部署结果。
- 发布后检查首页、404 页面、Giffgaff 子站和 Lebara 子站。

## 发布与安全

- 未经用户明确确认，不执行 `git push`、不触发生产部署、不修改域名或 DNS。
- 不删除产品文章或 Issues。
- 不把令牌、Cookie、私钥或其他秘密写入仓库。
- 不在日志中输出敏感环境变量。
