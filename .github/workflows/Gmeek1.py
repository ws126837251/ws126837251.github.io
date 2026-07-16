name: build Gmeek custom

on:
  workflow_dispatch:
  issues:
    types: [opened, edited]
  schedule:
    - cron: "0 16 * * *"

jobs:
  build:
    name: Generate blog
    runs-on: ubuntu-24.04

    if: >-
      ${{
        github.event_name == 'workflow_dispatch' ||
        github.event_name == 'schedule' ||
        github.event.repository.owner.id == github.event.sender.id
      }}

    permissions: write-all

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Pages
        id: pages
        uses: actions/configure-pages@v4

      - name: Install jq
        run: |
          sudo apt-get update
          sudo apt-get install -y jq

      - name: Set up Python
        uses: actions/setup-python@v5
        with:
          python-version: "3.8"

      - name: Clone Gmeek
        run: |
          GMEEK_VERSION=$(jq -r ".GMEEK_VERSION" config.json)

          git clone https://github.com/Meekdai/Gmeek.git /opt/Gmeek
          cd /opt/Gmeek

          if [ "$GMEEK_VERSION" = "last" ]; then
            LAST_TAG=$(git describe --tags "$(git rev-list --tags --max-count=1)")
            git checkout "$LAST_TAG"
          else
            git checkout "$GMEEK_VERSION"
          fi

      - name: Copy repository files
        run: |
          cp -r "${{ github.workspace }}/." /opt/Gmeek/

      - name: Patch Gmeek
        run: |
          python <<'PY'
          from pathlib import Path
          import re

          gmeek = Path("/opt/Gmeek/Gmeek.py")
          template = Path("/opt/Gmeek/templates/plist.html")

          source = gmeek.read_text(encoding="utf-8")

          # PyGithub 默认返回新到旧。
          # 在获取 issues 后直接反转为旧到新。
          patterns = [
              (
                  r"(issues\s*=\s*self\.repo\.get_issues\([^\n]*\))",
                  r"\1\n        issues = list(issues)[::-1]"
              ),
              (
                  r"(issues\s*=\s*self\.repo\.get_issues\(\))",
                  r"\1\n        issues = list(issues)[::-1]"
              )
          ]

          patched = False

          for pattern, replacement in patterns:
              new_source, count = re.subn(
                  pattern,
                  replacement,
                  source,
                  count=1
              )

              if count:
                  source = new_source
                  patched = True
                  break

          if not patched:
              raise RuntimeError(
                  "未找到 Gmeek 的 issue 获取代码，停止构建。"
              )

          gmeek.write_text(source, encoding="utf-8")

          html = template.read_text(encoding="utf-8")

          # 去掉文章日期显示
          html = html.replace(
              "{{ postListJson[num]['createdDate'] }}",
              ""
          )

          html = html.replace(
              '{{ postListJson[num]["createdDate"] }}',
              ""
          )

          # 将 RSS 链接指向首页
          html = html.replace(
              "{{ blogBase['homeUrl'] }}/rss.xml",
              "https://giffgaff.wufeng.de/"
          )

          html = html.replace(
              '{{ blogBase["homeUrl"] }}/rss.xml',
              "https://giffgaff.wufeng.de/"
          )

          template.write_text(html, encoding="utf-8")

          print("PATCH_SUCCESS")
          PY

      - name: Verify patch
        run: |
          echo "====== verify workflow patch ======"

          grep -n "issues = list(issues)\[::-1\]" \
            /opt/Gmeek/Gmeek.py

          if grep -q "createdDate" \
            /opt/Gmeek/templates/plist.html; then
            echo "ERROR: createdDate is still present"
            exit 1
          fi

          echo "PATCH_VERIFIED"

      - name: Install dependencies
        run: |
          python -m pip install --upgrade pip
          pip install -r /opt/Gmeek/requirements.txt

      - name: Generate HTML
        run: |
          cd /opt/Gmeek

          python Gmeek.py \
            "${{ secrets.GITHUB_TOKEN }}" \
            "${{ github.repository }}" \
            --issue_number '${{ github.event.issue.number }}'

      - name: Verify generated page
        run: |
          if grep -E "20[0-9]{2}-[0-9]{2}-[0-9]{2}" \
            /opt/Gmeek/docs/index.html; then
            echo "ERROR: 首页仍存在日期标签"
            exit 1
          fi

          echo "GENERATED_PAGE_VERIFIED"

      - name: Copy generated files
        run: |
          rm -rf "${{ github.workspace }}/docs"
          rm -rf "${{ github.workspace }}/backup"

          cp -a /opt/Gmeek/docs "${{ github.workspace }}/"
          cp -a /opt/Gmeek/backup "${{ github.workspace }}/"
          cp /opt/Gmeek/blogBase.json "${{ github.workspace }}/"

      - name: Commit generated files
        run: |
          cd "${{ github.workspace }}"

          git config --local user.email \
            "$(jq -r ".email" config.json)"

          git config --local user.name \
            "${{ github.repository_owner }}"

          git add docs backup blogBase.json

          git commit \
            -m "🎉 auto update by customized Gmeek action" \
            || echo "nothing to commit"

          git push

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: "docs/."

  deploy:
    name: Deploy blog
    runs-on: ubuntu-24.04
    needs: build

    permissions:
      contents: write
      pages: write
      id-token: write

    concurrency:
      group: "pages"
      cancel-in-progress: false

    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}

    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
