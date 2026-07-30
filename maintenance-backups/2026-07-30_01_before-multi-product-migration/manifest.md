# 多产品教程站迁移前快照

- 创建时间：2026-07-30（Asia/Shanghai）
- 任务：将现有 Giffgaff 单产品站拆分为教程中心、Giffgaff 子站和 Lebara 子站
- 原始分支：`main`
- 原始提交：`aca9f5070e8b5f20e046f2af9a3d34659fb1e9d0`

## 已保存的源文件

- `AGENTS.md`
- `README.md`
- `config.json`
- `.github/workflows/Gmeek.yml`

`docs/`、`backup/` 和 `blogBase.json` 为自动生成内容，未单独复制。

## 恢复方法

将本目录内的文件按原相对路径复制回仓库根目录，然后重新运行 Gmeek 工作流。文章正文以迁移前的 GitHub Issues 为准。
