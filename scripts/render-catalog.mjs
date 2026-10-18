import fs from "node:fs";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.dirname(scriptDir);
const hubDir = path.join(rootDir, "hub");
const indexPath = path.join(hubDir, "index.html");
const notFoundPath = path.join(hubDir, "404.html");
const contentPath = path.join(hubDir, "site-content.json");
const compatibilityProductsPath = path.join(hubDir, "assets", "products.js");
const stylesheetPath = path.join(hubDir, "assets", "style.css");
const stylesheetVersion = createHash("sha256")
  .update(fs.readFileSync(stylesheetPath))
  .digest("hex")
  .slice(0, 12);

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
  return html.replace(
    textPattern,
    (fullMatch, openingTag, tagName, contentKey, oldValue, closingTag) =>
      `${openingTag}${escapeHtml(getContentValue(contentKey))}${closingTag}`,
  );
}

function renderButton(label, href) {
  return `    <a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="button">${escapeHtml(label)}</a>`;
}

function renderCatalog(html) {
  const startMarker = "    <!-- BUTTONS_FALLBACK_START -->";
  const endMarker = "    <!-- BUTTONS_FALLBACK_END -->";
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Homepage button markers are missing or out of order.");
  }

  const buttons = [
    renderButton(siteContent.navigation.aboutLabel, siteContent.navigation.aboutUrl),
    ...sortedProducts.map((product) => renderButton(product.name, product.path)),
  ].join("\n");

  return (
    html.slice(0, startIndex) +
    `${startMarker}\n${buttons}\n${endMarker}` +
    html.slice(endIndex + endMarker.length)
  );
}

function renderStylesheetVersion(html, fileName) {
  const stylesheetPattern = /href="\/assets\/style\.css(?:\?v=[^"]*)?"/g;
  if (!stylesheetPattern.test(html)) {
    throw new Error(`Stylesheet link is missing in ${fileName}`);
  }
  return html.replace(
    stylesheetPattern,
    `href="/assets/style.css?v=${stylesheetVersion}"`,
  );
}

let indexHtml = renderConfiguredCopy(
  fs.readFileSync(indexPath, "utf8"),
  "hub/index.html",
);
indexHtml = renderCatalog(indexHtml);
indexHtml = renderStylesheetVersion(indexHtml, "hub/index.html");

const notFoundHtml = renderStylesheetVersion(
  renderConfiguredCopy(
    fs.readFileSync(notFoundPath, "utf8"),
    "hub/404.html",
  ),
  "hub/404.html",
);
const compatibilitySource = `// Generated from ../site-content.json. Edit that file instead.\nexport const products = ${JSON.stringify(products, null, 2)};\n`;

fs.writeFileSync(indexPath, indexHtml, "utf8");
fs.writeFileSync(notFoundPath, notFoundHtml, "utf8");
fs.writeFileSync(compatibilityProductsPath, compatibilitySource, "utf8");
console.log(`Rendered site copy and ${products.length} product buttons.`);
