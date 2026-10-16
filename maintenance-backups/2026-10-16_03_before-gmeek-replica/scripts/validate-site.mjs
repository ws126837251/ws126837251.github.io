import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(scriptDir);
const hubDir = path.join(rootDir, "hub");

const requiredFiles = [
  "index.html",
  "404.html",
  "CNAME",
  "site-content.json",
  "assets/style.css",
  "assets/app.js",
  "assets/products.js",
  "assets/wufeng-avatar.png",
  "og-directory.png",
  "robots.txt",
  "sitemap.xml",
  "site.webmanifest",
];

for (const relativePath of requiredFiles) {
  if (!fs.existsSync(path.join(hubDir, relativePath))) {
    throw new Error(`Missing required file: hub/${relativePath}`);
  }
}

const indexHtml = fs.readFileSync(path.join(hubDir, "index.html"), "utf8");
const notFoundHtml = fs.readFileSync(path.join(hubDir, "404.html"), "utf8");
if (fs.readFileSync(path.join(hubDir, "CNAME"), "utf8").trim() !== "blog.wufeng.de") {
  throw new Error("hub/CNAME must point to blog.wufeng.de.");
}
const siteContent = JSON.parse(
  fs.readFileSync(path.join(hubDir, "site-content.json"), "utf8"),
);
const { products } = siteContent;

function getContentValue(key) {
  return key.split(".").reduce((current, part) => current?.[part], siteContent);
}

for (const requiredValue of [
  "/assets/style.css",
  "/assets/app.js",
  "/og-directory.png",
  "https://blog.wufeng.de/",
  'id="product-grid"',
  'id="catalog-count"',
  'class="no-js"',
  "CATALOG_FALLBACK_START",
  "CATALOG_FALLBACK_END",
  'data-content="brand.tagline"',
  siteContent.meta.title,
  siteContent.brand.name,
  siteContent.catalog.title,
  siteContent.footer.editUrl,
]) {
  if (!indexHtml.includes(requiredValue)) {
    throw new Error(`Homepage is missing: ${requiredValue}`);
  }
}

for (const html of [indexHtml, notFoundHtml]) {
  const contentKeys = [
    ...html.matchAll(/data-content="([^"]+)"/g),
  ].map((match) => match[1]);
  for (const contentKey of contentKeys) {
    const value = getContentValue(contentKey);
    if (typeof value !== "string" && typeof value !== "number") {
      throw new Error(`HTML references an invalid content key: ${contentKey}`);
    }
  }
}

for (const requiredKey of [
  "catalog.cardAction",
  "catalog.cardAriaTemplate",
  "catalog.countTemplate",
]) {
  if (typeof getContentValue(requiredKey) !== "string") {
    throw new Error(`Site content is missing: ${requiredKey}`);
  }
}

for (const retiredValue of [
  "Giffgaff 与 Lebara",
  "无风电话卡教程",
  "全球 SIM 卡中文使用指南",
]) {
  if (indexHtml.includes(retiredValue)) {
    throw new Error(`Homepage still contains retired copy: ${retiredValue}`);
  }
}

JSON.parse(fs.readFileSync(path.join(hubDir, "site.webmanifest"), "utf8"));

if (!Array.isArray(products) || products.length < 2) {
  throw new Error("Product catalog must contain at least two entries.");
}

const compatibilityUrl = `${pathToFileURL(
  path.join(hubDir, "assets", "products.js"),
).href}?validate=${Date.now()}`;
const compatibilityModule = await import(compatibilityUrl);
if (JSON.stringify(compatibilityModule.products) !== JSON.stringify(products)) {
  throw new Error("Generated products.js does not match site-content.json.");
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
    throw new Error(`Product articleCount must be non-negative: ${product.name}`);
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

const css = fs.readFileSync(path.join(hubDir, "assets", "style.css"), "utf8");
if ((css.match(/{/g) ?? []).length !== (css.match(/}/g) ?? []).length) {
  throw new Error("CSS opening and closing braces do not match.");
}
for (const requiredAccessibilityRule of [
  ":focus-visible",
  "prefers-reduced-motion: reduce",
  ".avatar-disc",
  "@keyframes avatar-spin",
  ".line-field",
]) {
  if (!css.includes(requiredAccessibilityRule)) {
    throw new Error(`CSS is missing accessibility rule: ${requiredAccessibilityRule}`);
  }
}

const sitemap = fs.readFileSync(path.join(hubDir, "sitemap.xml"), "utf8");
if (!sitemap.includes("<urlset") || !sitemap.includes("</urlset>")) {
  throw new Error("Sitemap does not contain a complete urlset.");
}
for (const product of products) {
  const productUrl = `https://blog.wufeng.de${product.path}`;
  if (!sitemap.includes(productUrl)) {
    throw new Error(`Sitemap is missing product URL: ${productUrl}`);
  }
}

const appJs = fs.readFileSync(path.join(hubDir, "assets", "app.js"), "utf8");
for (const requiredBehavior of [
  "loadSiteContent",
  "applyContent",
  "renderProducts",
  "localeCompare",
  "/site-content.json",
  "product-card",
]) {
  if (!appJs.includes(requiredBehavior)) {
    throw new Error(`Catalog behavior is missing: ${requiredBehavior}`);
  }
}

for (const scriptName of ["render-catalog.mjs", "sync-product-counts.mjs"]) {
  if (!fs.existsSync(path.join(rootDir, "scripts", scriptName))) {
    throw new Error(`Required script is missing: ${scriptName}`);
  }
}

if (fs.statSync(path.join(hubDir, "og-directory.png")).size < 100_000) {
  throw new Error("Social preview image appears to be incomplete.");
}

if (fs.statSync(path.join(hubDir, "assets", "wufeng-avatar.png")).size < 100_000) {
  throw new Error("Avatar image appears to be incomplete.");
}

console.log("Tutorials hub validation passed.");
