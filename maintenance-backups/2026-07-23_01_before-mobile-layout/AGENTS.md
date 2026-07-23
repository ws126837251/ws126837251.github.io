# Giffgaff 使用指南网站维护规则

## 项目概览

- 本仓库是由 Gmeek 生成并通过 GitHub Pages 发布的静态博客。
- 生产站点：`https://giffgaff.wufeng.de`
- 主要配置：`config.json`
- 自动化工作流：`.github/workflows/Gmeek.yml`
- 文章的原始内容来自本仓库的 GitHub Issues。
- 工作流会在 Issue 新建或编辑、手动触发以及每日定时任务运行时重新生成并发布网站。

## 文件职责

- `config.json`：站点标题、说明、主题注入脚本和 Gmeek 版本等源配置。
- `.github/workflows/Gmeek.yml`：生成、定制、验证和部署流程。
- `docs/`：工作流生成的发布文件，不应直接手工维护。
- `backup/`：工作流生成的文章备份，不应作为文章的主要编辑入口。
- `blogBase.json`：Gmeek 生成的数据文件，不应直接编辑。

## 修改原则

- 修改文章内容时，优先编辑对应的 GitHub Issue，不要直接修改 `docs/post/*.html` 或 `backup/*.md`。
- 修改站点样式或功能时，先判断应修改 `config.json` 的注入内容，还是修改 `.github/workflows/Gmeek.yml` 的生成后处理。
- 不要为了修复生成结果而直接编辑生成文件；应修复配置或生成流程，再让工作流重新生成。
- 保留现有中文内容和 UTF-8 编码，避免使用会造成中文乱码的默认编码写入方式。
- 对工作流做最小范围修改，不随意扩大 GitHub Actions 权限，不引入未经说明的第三方 Action。
- `GMEEK_VERSION` 当前为 `main`。除非用户明确要求，不要擅自切换版本或固定到其他提交。

## 验证要求

- 修改 `config.json` 后，必须验证它是合法 JSON。
- 修改内嵌 HTML、CSS 或 JavaScript 后，检查 JSON 转义、浏览器控制台错误和移动端显示。
- 修改工作流后，检查 YAML 语法、触发条件、权限、生成目录以及 Pages 部署步骤。
- 发布前优先查看 GitHub Actions 构建结果，并检查首页、文章页、标签页和 RSS。
- UI 修改至少检查桌面端和移动端。

## 发布与安全

- 未经用户明确确认，不执行 `git push`、不触发生产部署、不修改域名或 GitHub Pages 设置。
- 未经用户明确确认，不关闭或删除工作流、Issue、文章和生成文件。
- 不把令牌、Cookie、私钥或其他秘密写入仓库。
- 不在日志中输出敏感环境变量。
- 若需要 GitHub 写操作，优先使用用户授权的 GitHub 连接；执行前明确说明会修改什么。
