import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(scriptDir);
const hubDir = path.join(rootDir, "hub");
const indexPath = path.join(hubDir, "index.html");
const notFoundPath = path.join(hubDir, "404.html");
const contentPath = path.join(hubDir, "site-content.json");
const compatibilityProductsPath = path.join(hubDir, "assets", "products.js");

const siteContent = JSON.parse(fs.readFileSync(contentPath, "utf8"));
const { products } = siteContent;
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

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getContentValue(key) {
  const value = key.split(".").reduce((current, part) => current?.[part], siteContent);
  if (typeof value !== "string" && typeof value !== "number") {
    throw new Error(`Content value must be text or a number: ${key}`);
  }
  return String(value);
}

function formatTemplate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function renderConfiguredCopy(html, fileName) {
  const attributePattern =
    /<([a-z][\w:-]*)([^>]*\sdata-content-attr="([^"]+)"[^>]*\sdata-content="([^"]+)"[^>]*)>/gi;
  html = html.replace(
    attributePattern,
    (fullMatch, tagName, attributes, attributeName, contentKey) => {
      const value = escapeHtml(getContentValue(contentKey));
      const valuePattern = new RegExp(
        `(\\s${escapeRegExp(attributeName)}=")[^"]*(")`,
      );
      if (!valuePattern.test(attributes)) {
        throw new Error(
          `Unable to update ${attributeName} from ${contentKey} in ${fileName}`,
        );
      }
      return `<${tagName}${attributes.replace(valuePattern, `$1${value}$2`)}>`;
    },
  );

  const textPattern =
    /(<([a-z][\w:-]*)\b[^>]*\sdata-content="([^"]+)"[^>]*>)([^<]*)(<\/\2>)/gi;
  html = html.replace(
    textPattern,
    (fullMatch, openingTag, tagName, contentKey, oldValue, closingTag) =>
      `${openingTag}${escapeHtml(getContentValue(contentKey))}${closingTag}`,
  );

  return html;
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
  const cardAria = formatTemplate(siteContent.catalog.cardAriaTemplate, {
    name: product.name,
  });
  const topicsAria = formatTemplate(siteContent.catalog.topicsAriaTemplate, {
    name: product.name,
  });

  return `      <a
        class="product-card product-card-static"
        href="${escapeHtml(product.path)}"
        style="--product-accent: ${assertColor(product.accent, product.name)}; --product-accent-soft: ${assertColor(product.accentSoft, product.name)}"
        aria-label="${escapeHtml(cardAria)}"
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
        <ul class="topic-list" aria-label="${escapeHtml(topicsAria)}">
${topics}
        </ul>
        <div class="product-card-foot">
          <span>${String(index + 1).padStart(2, "0")}</span>
          <strong>${escapeHtml(siteContent.catalog.cardAction)} <i aria-hidden="true">↗</i></strong>
        </div>
      </a>`;
}

function renderCatalog(html) {
  const startMarker = "        <!-- CATALOG_FALLBACK_START -->";
  const endMarker = "        <!-- CATALOG_FALLBACK_END -->";
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Catalog fallback markers are missing or out of order.");
  }

  const cards = sortedProducts.map(renderCard).join("\n");
  return (
    html.slice(0, startIndex) +
    `${startMarker}\n${cards}\n${endMarker}` +
    html.slice(endIndex + endMarker.length)
  );
}

function replaceElementText(html, id, value) {
  const pattern = new RegExp(`(<[^>]+id="${id}"[^>]*>)[^<]*(</[^>]+>)`);
  if (!pattern.test(html)) {
    throw new Error(`Unable to update catalog value: ${id}`);
  }
  return html.replace(pattern, `$1${escapeHtml(value)}$2`);
}

let indexHtml = renderConfiguredCopy(
  fs.readFileSync(indexPath, "utf8"),
  "hub/index.html",
);
indexHtml = renderCatalog(indexHtml);

const guideTotal = products.reduce(
  (total, product) => total + product.articleCount,
  0,
);
const regionTotal = new Set(
  products.flatMap((product) => product.regions.map((region) => region.code)),
).size;
const catalogCount = formatTemplate(siteContent.catalog.countTemplate, {
  count: products.length,
});

for (const [id, value] of [
  ["brand-count", products.length],
  ["guide-count", `${guideTotal}+`],
  ["region-count", regionTotal],
  ["catalog-count", catalogCount],
]) {
  indexHtml = replaceElementText(indexHtml, id, value);
}

const notFoundHtml = renderConfiguredCopy(
  fs.readFileSync(notFoundPath, "utf8"),
  "hub/404.html",
);
const compatibilitySource = `// Generated from ../site-content.json. Edit that file instead.\nexport const products = ${JSON.stringify(products, null, 2)};\n`;

fs.writeFileSync(indexPath, indexHtml, "utf8");
fs.writeFileSync(notFoundPath, notFoundHtml, "utf8");
fs.writeFileSync(compatibilityProductsPath, compatibilitySource, "utf8");
console.log(`Rendered site copy and ${products.length} catalog fallback cards.`);
