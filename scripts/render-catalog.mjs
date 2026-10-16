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

function renderCard(product, index) {
  const regionLabel = product.regions
    .map((region) => `${region.code} · ${region.name}`)
    .join(" / ");
  const cardAria = formatTemplate(siteContent.catalog.cardAriaTemplate, {
    name: product.name,
  });

  return `      <a
        class="product-card product-card-static"
        href="${escapeHtml(product.path)}"
        aria-label="${escapeHtml(cardAria)}"
      >
        <span class="product-card-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="product-mark" aria-hidden="true">${escapeHtml(product.mark)}</span>
        <span class="product-card-main">
          <span class="product-card-region">${escapeHtml(regionLabel)}</span>
          <strong class="product-card-name">${escapeHtml(product.name)}</strong>
          <span class="product-card-status">${escapeHtml(product.status)}</span>
        </span>
        <span class="product-card-arrow" aria-hidden="true">↗</span>
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
indexHtml = replaceElementText(
  indexHtml,
  "catalog-count",
  formatTemplate(siteContent.catalog.countTemplate, { count: products.length }),
);

const notFoundHtml = renderConfiguredCopy(
  fs.readFileSync(notFoundPath, "utf8"),
  "hub/404.html",
);
const compatibilitySource = `// Generated from ../site-content.json. Edit that file instead.\nexport const products = ${JSON.stringify(products, null, 2)};\n`;

fs.writeFileSync(indexPath, indexHtml, "utf8");
fs.writeFileSync(notFoundPath, notFoundHtml, "utf8");
fs.writeFileSync(compatibilityProductsPath, compatibilitySource, "utf8");
console.log(`Rendered site copy and ${products.length} catalog fallback cards.`);
