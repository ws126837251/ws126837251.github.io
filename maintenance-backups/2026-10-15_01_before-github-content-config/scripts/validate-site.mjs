import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(scriptDir);
const hubDir = path.join(rootDir, "hub");

const requiredFiles = [
  "index.html",
  "404.html",
  "assets/style.css",
  "assets/app.js",
  "assets/products.js",
  "og-directory.png",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
];

for (const relativePath of requiredFiles) {
  const filePath = path.join(hubDir, relativePath);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: hub/${relativePath}`);
  }
}

const indexHtml = fs.readFileSync(path.join(hubDir, "index.html"), "utf8");
for (const requiredValue of [
  "/assets/style.css",
  "/assets/app.js",
  "/og-directory.png",
  "https://tutorials.wufeng.de/",
  "无风小卖部",
  "全球 SIM 卡使用指南",
  'id="product-grid"',
  'id="product-search"',
  'id="region-filters"',
  'class="no-js"',
  "CATALOG_FALLBACK_START",
  "CATALOG_FALLBACK_END",
]) {
  if (!indexHtml.includes(requiredValue)) {
    throw new Error(`Homepage is missing: ${requiredValue}`);
  }
}

if (indexHtml.includes("Giffgaff 与 Lebara")) {
  throw new Error("Homepage metadata is still limited to two brands.");
}

if (indexHtml.includes("无风电话卡教程")) {
  throw new Error("Homepage still contains the retired site name.");
}

if (indexHtml.includes("全球 SIM 卡中文使用指南")) {
  throw new Error("Homepage still contains the retired subtitle.");
}

JSON.parse(
  fs.readFileSync(path.join(hubDir, "site.webmanifest"), "utf8"),
);

const productsUrl = pathToFileURL(
  path.join(hubDir, "assets/products.js"),
).href;
const { products } = await import(productsUrl);

if (!Array.isArray(products) || products.length < 2) {
  throw new Error("Product catalog must contain at least two entries.");
}

const slugs = new Set();
const paths = new Set();
for (const product of products) {
  for (const field of [
    "slug",
    "name",
    "mark",
    "path",
    "summary",
    "status",
    "accent",
    "accentSoft",
  ]) {
    if (!product[field]) {
      throw new Error(`Product ${product.name ?? "unknown"} is missing ${field}.`);
    }
  }

  if (!product.path.startsWith("/") || !product.path.endsWith("/")) {
    throw new Error(`Product path must start and end with /: ${product.path}`);
  }

  if (!Array.isArray(product.topics) || product.topics.length === 0) {
    throw new Error(`Product must include at least one topic: ${product.name}`);
  }

  if (!Array.isArray(product.regions) || product.regions.length === 0) {
    throw new Error(`Product must include at least one region: ${product.name}`);
  }

  for (const region of product.regions) {
    if (!region.code || !region.name) {
      throw new Error(`Product has an incomplete region: ${product.name}`);
    }
  }

  if (!Number.isInteger(product.articleCount) || product.articleCount < 0) {
    throw new Error(`Product articleCount must be a non-negative integer: ${product.name}`);
  }

  if (!/^[^/]+\/[^/]+$/.test(product.issuesRepo ?? "")) {
    throw new Error(`Product issuesRepo must be owner/repository: ${product.name}`);
  }

  if (slugs.has(product.slug) || paths.has(product.path)) {
    throw new Error(`Duplicate product slug or path: ${product.slug}`);
  }

  slugs.add(product.slug);
  paths.add(product.path);

  if (!indexHtml.includes(`href="${product.path}"`)) {
    throw new Error(`Static catalog fallback is missing: ${product.path}`);
  }
}

const css = fs.readFileSync(path.join(hubDir, "assets/style.css"), "utf8");
const openingBraces = (css.match(/{/g) ?? []).length;
const closingBraces = (css.match(/}/g) ?? []).length;
if (openingBraces !== closingBraces) {
  throw new Error("CSS opening and closing braces do not match.");
}

const sitemap = fs.readFileSync(path.join(hubDir, "sitemap.xml"), "utf8");
if (!sitemap.includes("<urlset") || !sitemap.includes("</urlset>")) {
  throw new Error("Sitemap does not contain a complete urlset.");
}

for (const product of products) {
  const productUrl = `https://tutorials.wufeng.de${product.path}`;
  if (!sitemap.includes(productUrl)) {
    throw new Error(`Sitemap is missing product URL: ${productUrl}`);
  }
}

const appJs = fs.readFileSync(path.join(hubDir, "assets/app.js"), "utf8");
for (const requiredBehavior of [
  "renderProducts",
  "renderFilters",
  "updateFilterState",
  "matchesSearch",
  "localeCompare",
  "aria-pressed",
]) {
  if (!appJs.includes(requiredBehavior)) {
    throw new Error(`Catalog behavior is missing: ${requiredBehavior}`);
  }
}

const renderScript = path.join(rootDir, "scripts", "render-catalog.mjs");
if (!fs.existsSync(renderScript)) {
  throw new Error("Catalog fallback renderer is missing.");
}

const syncScript = path.join(rootDir, "scripts", "sync-product-counts.mjs");
if (!fs.existsSync(syncScript)) {
  throw new Error("Product count sync script is missing.");
}

const socialImage = fs.statSync(path.join(hubDir, "og-directory.png"));
if (socialImage.size < 100_000) {
  throw new Error("Social preview image appears to be incomplete.");
}

console.log("Tutorials hub validation passed.");
