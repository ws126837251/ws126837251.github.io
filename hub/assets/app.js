import { products as fallbackProducts } from "./products.js";

function formatTemplate(template, values) {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    template,
  );
}

function getContentValue(source, key) {
  return key.split(".").reduce((current, part) => current?.[part], source);
}

async function loadSiteContent() {
  const response = await fetch("/site-content.json", { cache: "no-cache" });
  if (!response.ok) {
    throw new Error(`Unable to load site content: ${response.status}`);
  }
  return response.json();
}

function applyContent(siteContent) {
  for (const element of document.querySelectorAll("[data-content]")) {
    const key = element.dataset.content;
    const value = getContentValue(siteContent, key);
    if (typeof value === "string" || typeof value === "number") {
      if (element.dataset.contentAttr) {
        element.setAttribute(element.dataset.contentAttr, String(value));
      } else {
        element.textContent = String(value);
      }
    }
  }
}

function renderProducts(products, siteContent) {
  const productGrid = document.querySelector("#product-grid");
  const catalogCount = document.querySelector("#catalog-count");
  const emptyState = document.querySelector("#empty-state");
  const catalogCopy = siteContent.catalog;
  const sortedProducts = [...products].sort((first, second) =>
    first.name.localeCompare(second.name, "zh-CN", {
      numeric: true,
      sensitivity: "base",
    }),
  );
  const fragment = document.createDocumentFragment();

  sortedProducts.forEach((product, index) => {
    const card = document.createElement("a");
    card.className = "product-card";
    card.href = product.path;
    card.setAttribute(
      "aria-label",
      formatTemplate(catalogCopy.cardAriaTemplate, { name: product.name }),
    );

    const number = document.createElement("span");
    number.className = "product-card-number";
    number.textContent = String(index + 1).padStart(2, "0");

    const mark = document.createElement("span");
    mark.className = "product-mark";
    mark.setAttribute("aria-hidden", "true");
    mark.textContent = product.mark;

    const main = document.createElement("span");
    main.className = "product-card-main";
    const region = document.createElement("span");
    region.className = "product-card-region";
    region.textContent = product.regions
      .map((item) => `${item.code} · ${item.name}`)
      .join(" / ");
    const name = document.createElement("strong");
    name.className = "product-card-name";
    name.textContent = product.name;
    const status = document.createElement("span");
    status.className = "product-card-status";
    status.textContent = product.status;
    main.append(region, name, status);

    const arrow = document.createElement("span");
    arrow.className = "product-card-arrow";
    arrow.setAttribute("aria-hidden", "true");
    arrow.textContent = "↗";

    card.append(number, mark, main, arrow);
    fragment.append(card);
  });

  productGrid.replaceChildren(fragment);
  catalogCount.textContent = formatTemplate(catalogCopy.countTemplate, {
    count: sortedProducts.length,
  });
  productGrid.hidden = sortedProducts.length === 0;
  emptyState.hidden = sortedProducts.length !== 0;
}

async function initializeCatalog() {
  let siteContent;
  try {
    siteContent = await loadSiteContent();
  } catch (error) {
    console.error(error);
    siteContent = {
      catalog: {
        cardAriaTemplate: "进入 {name} 使用指南",
        countTemplate: "共 {count} 个品牌",
      },
      products: fallbackProducts,
    };
  }

  const products = Array.isArray(siteContent.products)
    ? siteContent.products
    : fallbackProducts;
  applyContent(siteContent);
  renderProducts(products, siteContent);
  document.documentElement.classList.remove("no-js");
}

initializeCatalog().catch((error) => {
  console.error(error);
  document.documentElement.classList.remove("no-js");
});
