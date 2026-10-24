# WuFeng·Blog 全站程序维护说明

本项目不是单独的一套页面，而是由一个教程中心和三个 Gmeek 教程站组成。修改前先判断要改的是哪个站点：

| 站点 | 线上地址 | GitHub 仓库 | 主要用途 |
| --- | --- | --- | --- |
| 教程中心 | <https://blog.wufeng.de/> | `ws126837251/ws126837251.github.io` | 首页、品牌入口、公共导航 |
| Giffgaff | <https://blog.wufeng.de/giffgaff/> | `ws126837251/giffgaff` | Giffgaff 文章和分类 |
| Lebara | <https://blog.wufeng.de/lebara/> | `ws126837251/lebara` | Lebara 文章和分类 |
| 卡圈情报站 | <https://blog.wufeng.de/card/> | `ws126837251/card` | 电话卡、U 卡、薅羊毛和一图流教程 |

## 一、教程中心怎么改

教程中心的源码在本仓库的 `hub/` 目录，部署工作流是 `.github/workflows/tutorials-pages.yml`。

| 要修改的内容 | 修改文件 | 说明 |
| --- | --- | --- |
| 网站名称、首页说明、页脚文字 | `hub/site-content.json` | 改引号里的值，不要删除字段名、逗号或括号 |
| 首页按钮、品牌名称、链接、简介、文章数量 | `hub/site-content.json` | 品牌入口放在 `products`；公共入口放在 `navigation` |
| 首页头像动画 | `hub/site-content.json` | 修改 `animation.avatar` 中的参数 |
| 渐变背景、布局、卡片外观 | `hub/assets/style.css` | 只改样式，不要把内容硬编码到 CSS |
| 深浅主题、头像旋转、雨线动画 | `hub/assets/app.js` | 修改交互逻辑 |
| 页面骨架和无脚本兜底 | `hub/index.html`、`hub/404.html` | 只有确实需要改 HTML 结构时才修改 |
| 搜索引擎入口 | `hub/sitemap.xml`、`hub/robots.txt` | 新增或更换站点路径时同步更新 |
| 部署流程 | `.github/workflows/tutorials-pages.yml` | 一般不需要改；改后要检查 YAML 和 Pages 权限 |

`hub/assets/products.js` 是根据 `site-content.json` 生成的兼容文件，不要直接修改。修改内容后可在仓库根目录执行：

```powershell
node scripts/render-catalog.mjs
node scripts/validate-site.mjs
```

新增品牌时，在 `site-content.json` 的 `products` 数组增加完整配置（`slug`、`name`、`path`、`issuesRepo`、地区、简介、主题和数量），然后在 `hub/sitemap.xml` 增加对应的完整网址。不要为了新增一个教程站去复制一份首页程序。

首页沿用提供的参考 HTML：浅蓝/深蓝渐变、透明头像、竖排卡片与雨线。内容和头像参数在构建时写入 HTML，首屏无需等待 JSON 请求；更改配置后仍运行上面的生成命令。头像 `spinDuration` 为每圈秒数，`hoverDuration` 为回正时间，`hoverRotation` 为额外旋转角度，`hoverScale` 为悬停缩放。主题自动跟随系统，手动选择后记住偏好；减少动态效果时停用动画。

字体在 `hub/assets/fonts/` 本地加载，保留参考版的 Plus Jakarta Sans 和 Noto Sans SC。中文字体是当前首页及 404 文案的子集，后续新增字符会使用系统字体兜底；需要同字体时应更新子集。许可证也在该目录。

## 二、三个教程站怎么改

Giffgaff、Lebara 和卡圈情报站都使用 Gmeek 模板。每个仓库的配置入口都是根目录的 `config.json`：

- `title`：网页标题。
- `subTitle`：标题下面的介绍。
- `avatarUrl`：头像图片地址。
- `homeUrl`：当前站点的规范首页地址。
- `bottomText`：页脚说明。
- `allHead`：全局样式、背景和雨效等页面头部代码。
- `script`：文章页或全局脚本。
- `indexScript`：首页按钮、分类按钮和首页专用脚本。
- `GMEEK_VERSION`：使用的 Gmeek 版本。

因此，想改某个教程站的名称、背景、头像、首页按钮、分类按钮或动画，改对应仓库的 `config.json`，不要改另一个仓库。

文章正文不在本教程中心维护，而是在对应仓库的 GitHub Issues 中维护：

1. 打开对应仓库的 Issues。
2. 新建或编辑 Issue，标题就是文章标题，正文就是文章内容。
3. 用 Label 设置分类，例如“教程”“注意事项”“杂谈”“百科全书”。
4. 保存后等待 `.github/workflows/Gmeek.yml` 自动生成页面并部署。

卡圈情报站也是同样的流程，直接在 `ws126837251/card` 的 Issues 中写文章。它是独立站点，但沿用 Giffgaff 的模板方案。

### 不要直接改的文件

以下内容由 Gmeek 自动生成，手工改动会在下次构建时被覆盖：

- `docs/`
- `backup/`
- `blogBase.json`

只有在需要调整“生成规则”时，才修改 `.github/workflows/Gmeek.yml`。例如首页日期处理、标签页标题、返回教程中心按钮、统计脚本等，都属于工作流中的生成后处理逻辑。

## 三、常见修改位置

### 改首页标题或说明

- 教程中心：改 `hub/site-content.json` 的 `meta`、`brand`。
- Giffgaff、Lebara、卡圈情报站：改各自的 `config.json` 的 `title`、`subTitle`。

### 改首页按钮

- 教程中心的品牌卡片：修改 `products` 中对应产品的 `name`、`path`、`summary`、`badge`；`icon` 可用 `sim`、`globe`、`shop`、`signal`。
- 教程中心的公共卡片：修改 `navigation` 下的 `aboutLabel/aboutUrl/aboutBadge/aboutDescription` 或 `cardLabel/cardUrl/cardBadge/cardDescription`。
- 教程站顶部的首页图标和“教程中心”按钮：修改对应 `config.json` 的 `indexScript` 或 `script`。

### 改分类

教程站首页的分类按钮在 `config.json` 的 `indexScript` 中；文章的实际分类来自 Issue Label。新增分类时，两处要保持同名，并确认生成后的 `tag.html` 可以打开。

### 改浏览量

浏览量由页面中的统计脚本按网址统计，不要手工填写一个“看起来正确”的数字。若两个站点的统计混在一起，应检查统计脚本发送的规范网址和域名映射，而不是修改页面文字。

## 四、标准修改和发布流程

1. 先确认目标仓库、目标文件和线上地址。
2. 在该仓库的 `maintenance-backups/YYYY-MM-DD_序号_before-任务名/` 保存修改前文件，并写入 `manifest.md`。
3. 修改源文件；不要覆盖无关改动，也不要删除文章、Issues、密钥或有效 Git 历史。
4. 做最小验证：
   - 教程中心：运行 `node scripts/render-catalog.mjs` 和 `node scripts/validate-site.mjs`。
   - Gmeek 站点：检查 `config.json` 是有效 JSON，检查工作流 YAML，确认 Issue 标签和链接没有拼写错误。
5. 使用中文 Commit 描述，格式为：

   ```
   <type>: <中文描述>
   ```

   例如：`docs: 完善全站维护说明`。

6. 推送到对应仓库的 `main`，等待 GitHub Actions 完成。
7. 最后直接打开真实网址验收：首页、文章页、分类页、返回首页按钮和移动端布局都要检查。HTTP 200 只代表服务器响应，不代表页面内容正确。

教程中心的 Pages 工作流只在 `hub/**`、`scripts/**` 或部署工作流改变时触发；只修改本 README 不会重新部署页面。Gmeek 站点则由 `config.json`、工作流改动、Issue 变更和定时任务触发。

## 五、安全和维护边界

- 不把令牌、Cookie、私钥、邮箱密码等写入仓库。
- 不直接编辑生成的文章 HTML，不删除产品仓库的文章或 Issues。
- 不使用强制推送，不覆盖其他人的改动。
- 修改前保留快照，修改后只提交当前任务相关文件。
- 修改部署、域名、DNS、统计归属或删除唯一数据前，先确认影响范围并保留回滚路径。
