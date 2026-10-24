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
const assetVersions = Object.fromEntries(
  ["style.css", "app.js"].map((name) => [
    name,
    createHash("sha256").update(fs.readFileSync(path.join(hubDir, "assets", name)))
      .digest("hex").slice(0, 12),
  ]),
);
const cardIcons = {
  "shop": "<svg width=\"21\" height=\"21\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z\"></path> <path d=\"M3 6h18\"></path> <path d=\"M16 10a4 4 0 0 1-8 0\"></path> </svg>",
  "sim": "<svg width=\"21\" height=\"21\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"></rect> <path d=\"M8 7v4\"></path> <path d=\"M16 7v4\"></path> <path d=\"M8 17v-2\"></path> <path d=\"M16 17v-2\"></path> <path d=\"M12 7v10\"></path> </svg>",
  "globe": "<svg width=\"21\" height=\"21\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20\"></path> <path d=\"M2 12h20\"></path> </svg>",
  "signal": "<svg width=\"21\" height=\"21\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"currentColor\" stroke-width=\"2\" stroke-linecap=\"round\" stroke-linejoin=\"round\"> <path d=\"M4.9 19.1C1 15.2 1 8.8 4.9 4.9\"></path> <path d=\"M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5\"></path> <circle cx=\"12\" cy=\"12\" r=\"2\"></circle> <path d=\"M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5\"></path> <path d=\"M19.1 4.9C23 8.8 23 15.2 19.1 19.1\"></path> </svg>"
};

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

function renderCard({ label, href, badge, description, icon, highlight = false }) {
  if (!(href.startsWith("/") && !href.startsWith("//")) && !href.startsWith("https://")) {
    throw new Error("Navigation link must be a site path or HTTPS URL: " + href);
  }
  return `      <a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer" class="nav-card">
        <div class="card-icon-box" aria-hidden="true">${cardIcons[icon] || cardIcons.sim}</div>
        <div class="card-content">
          <div class="card-header-row">
            <span class="card-title">${escapeHtml(label)}</span>
            ${badge ? `<span class="card-badge${highlight ? " badge-highlight" : ""}">${escapeHtml(badge)}</span>` : ""}
          </div>
          <p class="card-desc">${escapeHtml(description)}</p>
        </div>
        <div class="card-arrow" aria-hidden="true">
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M7 17 17 7"></path><path d="M7 7h10v10"></path>
          </svg>
        </div>
      </a>`;
}

function renderCatalog(html) {
  const startMarker = "    <!-- BUTTONS_FALLBACK_START -->";
  const endMarker = "    <!-- BUTTONS_FALLBACK_END -->";
  const startIndex = html.indexOf(startMarker);
  const endIndex = html.indexOf(endMarker);
  if (startIndex === -1 || endIndex === -1 || endIndex <= startIndex) {
    throw new Error("Homepage button markers are missing or out of order.");
  }

  const { navigation } = siteContent;
  const buttons = [
    renderCard({
      label: navigation.aboutLabel, href: navigation.aboutUrl,
      badge: navigation.aboutBadge, description: navigation.aboutDescription,
      icon: "shop", highlight: true,
    }),
    ...sortedProducts.map((product) => renderCard({
      label: product.name, href: product.path, badge: product.badge,
      description: product.summary, icon: product.icon,
    })),
    renderCard({
      label: navigation.cardLabel, href: navigation.cardUrl,
      badge: navigation.cardBadge, description: navigation.cardDescription,
      icon: "signal",
    }),
  ].join("\n");

  return (
    html.slice(0, startIndex) +
    `${startMarker}\n${buttons}\n${endMarker}` +
    html.slice(endIndex + endMarker.length)
  );
}

function renderAssetsAndAnimation(html, fileName) {
  for (const [name, version] of Object.entries(assetVersions)) {
    const assetPattern = new RegExp(
      '"/assets/' + escapeRegExp(name) + '(?:\\?v=[^"]*)?"', "g",
    );
    if (!assetPattern.test(html)) throw new Error("Missing " + name + " in " + fileName);
    html = html.replace(assetPattern, '"/assets/' + name + "?v=" + version + '"');
  }
  const settingsPattern = /(<script type="application\/json" id="avatarSettings">)[\s\S]*?(<\/script>)/;
  if (!settingsPattern.test(html)) throw new Error("Missing avatar settings in " + fileName);
  return html.replace(settingsPattern, (_, start, end) =>
    start + JSON.stringify(siteContent.animation.avatar).replaceAll("<", "\\u003c") + end);
}

let indexHtml = renderConfiguredCopy(
  fs.readFileSync(indexPath, "utf8"),
  "hub/index.html",
);
indexHtml = renderCatalog(indexHtml);
indexHtml = renderAssetsAndAnimation(indexHtml, "hub/index.html");

const notFoundHtml = renderAssetsAndAnimation(
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
console.log(`Rendered site copy and ${products.length} product navigation cards.`);
