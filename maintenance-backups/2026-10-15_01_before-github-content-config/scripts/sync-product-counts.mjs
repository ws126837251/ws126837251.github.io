import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const productsFileArg = process.argv.indexOf("--products-file");
const productsFileOverride =
  productsFileArg >= 0 ? process.argv[productsFileArg + 1] : undefined;
const productsPath = path.resolve(
  productsFileOverride ??
    process.env.PRODUCTS_FILE ??
    path.join(rootDir, "hub", "assets", "products.js"),
);
const dryRun = process.argv.includes("--dry-run");

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "tutorials-hub-count-sync",
};

if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
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

function updateProductBlock(source, product, count) {
  const blockPattern = new RegExp(
    `(\\{\\s*slug:\\s*"${escapeRegExp(product.slug)}"[\\s\\S]*?\\n  \\},)`,
  );
  const match = source.match(blockPattern);
  if (!match) {
    throw new Error(`Product block not found: ${product.slug}`);
  }

  const status = count > 0 ? `${count} 篇指南` : "内容建设中";
  const state = count > 0 ? "available" : "building";
  const updatedBlock = match[1]
    .replace(/state:\s*"[^"]+"/, `state: "${state}"`)
    .replace(/status:\s*"[^"]+"/, `status: "${status}"`)
    .replace(/articleCount:\s*\d+/, `articleCount: ${count}`);

  return source.replace(match[1], updatedBlock);
}

const moduleUrl = `${pathToFileURL(productsPath).href}?cacheBust=${Date.now()}`;
const { products } = await import(moduleUrl);
let source = await fs.readFile(productsPath, "utf8");
const updates = [];

for (const product of products) {
  if (!product.issuesRepo) {
    continue;
  }

  const count = await fetchIssueCount(product.issuesRepo);
  source = updateProductBlock(source, product, count);
  updates.push(`${product.name}: ${product.articleCount} -> ${count}`);
}

for (const update of updates) {
  console.log(update);
}

if (!dryRun) {
  await fs.writeFile(productsPath, source, "utf8");
  console.log(`Updated ${productsPath}`);
} else {
  console.log("Dry run: no files changed.");
}
