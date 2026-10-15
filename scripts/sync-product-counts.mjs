import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const contentFileArg = process.argv.indexOf("--content-file");
const contentFileOverride =
  contentFileArg >= 0 ? process.argv[contentFileArg + 1] : undefined;
const contentPath = path.resolve(
  contentFileOverride ??
    process.env.SITE_CONTENT_FILE ??
    path.join(rootDir, "hub", "site-content.json"),
);
const dryRun = process.argv.includes("--dry-run");

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "tutorials-hub-count-sync",
};

if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

async function fetchIssueCount(repository) {
  let page = 1;
  let count = 0;

  while (true) {
    const url = new URL(`https://api.github.com/repos/${repository}/issues`);
    url.searchParams.set("state", "open");
    url.searchParams.set("per_page", "100");
    url.searchParams.set("page", String(page));

    const response = await fetch(url, { headers });
    if (!response.ok) {
      throw new Error(`GitHub API returned ${response.status} for ${repository}`);
    }

    const issues = await response.json();
    count += issues.filter((issue) => !issue.pull_request).length;

    if (issues.length < 100) {
      return count;
    }

    page += 1;
  }
}

const siteContent = JSON.parse(await fs.readFile(contentPath, "utf8"));
if (!Array.isArray(siteContent.products)) {
  throw new Error("site-content.json must contain a products array.");
}

const updates = [];
for (const product of siteContent.products) {
  if (!product.issuesRepo) {
    continue;
  }

  const count = await fetchIssueCount(product.issuesRepo);
  updates.push(`${product.name}: ${product.articleCount} -> ${count}`);
  product.articleCount = count;
  product.status = count > 0 ? `${count} 篇指南` : "内容建设中";
  product.state = count > 0 ? "available" : "building";
}

for (const update of updates) {
  console.log(update);
}

if (!dryRun) {
  await fs.writeFile(
    contentPath,
    `${JSON.stringify(siteContent, null, 2)}\n`,
    "utf8",
  );
  console.log(`Updated ${contentPath}`);
} else {
  console.log("Dry run: no files changed.");
}
