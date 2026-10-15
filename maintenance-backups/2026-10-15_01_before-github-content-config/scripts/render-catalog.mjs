import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(scriptDir);
const indexPath = path.join(rootDir, "hub", "index.html");
const productsUrl = pathToFileURL(
  path.join(rootDir, "hub", "assets", "products.js"),
).href;

const { products } = await import(productsUrl);
const sortedProducts = [...products].sort((first, second) =>
  first.name.localeCompare(second.name, "zh-CN", {
    numeric: true,
    sensitivity: "base",
  }),
);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function assertColor(value, productName) {
  if (!/^#[0-9a-f]{6}$/i.test(value)) {
    throw new Error(`Invalid catalog color for ${productName}: ${value}`);
  }
  return value;
}

function renderCard(product, index) {
  const stateClass =
    product.state === "building" ? " product-state-building" : "";
  const regionLabel = product.regions
    .map((region) => `${region.code} · ${region.name}`)
    .join(" / ");
  const topics = product.topics
    .map((topic) => `          <li>${escapeHtml(topic)}</li>`)
    .join("\n");

  return `      <a
        class="product-card product-card-static"
        href="${escapeHtml(product.path)}"
        style="--product-accent: ${assertColor(product.accent, product.name)}; --product-accent-soft: ${assertColor(product.accentSoft, product.name)}"
        aria-label="进入 ${escapeHtml(product.name)} 使用指南"
      >
        <div class="product-card-head">
          <span class="product-mark" aria-hidden="true">${escapeHtml(product.mark)}</span>
          <span class="product-state${stateClass}">${escapeHtml(product.status)}</span>
        </div>
        <div class="product-card-body">
          <p>${escapeHtml(regionLabel)}</p>
          <h3>${escapeHtml(product.name)}</h3>
          <span>${escapeHtml(product.summary)}</span>
        </div>
        <ul class="topic-list" aria-label="${escapeHtml(product.name)} 教程主题">
${topics}
        </ul>
        <div class="product-card-foot">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>查看教程 <i aria-hidden="true">↗</i></strong>
        </div>
      </a>`;
}

const startMarker = "        <!-- CATALOG_FALLBACK_START -->";
const endMarker = "        <!-- CATALOG_FALLBACK_END -->";
const cards = sortedProducts.map(renderCard).join("\n");
const fallback = `${startMarker}\n${cards}\n${endMarker}`;

let indexHtml = fs.readFileSync(indexPath, "utf8");
const startIndex = indexHtml.indexOf(startMarker);
const endIndex = indexHtml.indexOf(endMarker);
if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
  throw new Error("Catalog fallback markers are missing or out of order.");
}

indexHtml =
  indexHtml.slice(0, startIndex) +
  fallback +
  indexHtml.slice(endIndex + endMarker.length);

const guideTotal = products.reduce(
  (total, product) => total + product.articleCount,
  0,
);
const regionTotal = new Set(
  products.flatMap((product) => product.regions.map((region) => region.code)),
).size;

const replacements = new Map([
  ["brand-count", String(products.length)],
  ["guide-count", `${guideTotal}+`],
  ["region-count", String(regionTotal)],
  ["catalog-count", `共 ${products.length} 个品牌`],
]);

for (const [id, value] of replacements) {
  const pattern = new RegExp(`(<[^>]+id="${id}"[^>]*>)[^<]*(</[^>]+>)`);
  if (!pattern.test(indexHtml)) {
    throw new Error(`Unable to update catalog value: ${id}`);
  }
  indexHtml = indexHtml.replace(pattern, `$1${value}$2`);
}

fs.writeFileSync(indexPath, indexHtml, "utf8");
console.log(`Rendered ${products.length} catalog fallback cards.`);
