import { products } from "./products.js";

document.documentElement.classList.remove("no-js");

const productGrid = document.querySelector("#product-grid");
const searchInput = document.querySelector("#product-search");
const regionFilters = document.querySelector("#region-filters");
const catalogCount = document.querySelector("#catalog-count");
const emptyState = document.querySelector("#empty-state");
const resetSearch = document.querySelector("#reset-search");

const brandCount = document.querySelector("#brand-count");
const guideCount = document.querySelector("#guide-count");
const regionCount = document.querySelector("#region-count");

const sortedProducts = [...products].sort((first, second) =>
  first.name.localeCompare(second.name, "zh-CN", {
    numeric: true,
    sensitivity: "base",
  }),
);

const regionMap = new Map();
for (const product of products) {
  for (const region of product.regions) {
    regionMap.set(region.code, region);
  }
}

const regions = [
  { code: "all", name: "全部" },
  ...[...regionMap.values()].sort((first, second) =>
    first.name.localeCompare(second.name, "zh-CN"),
  ),
];

let activeRegion = "all";

function normalize(value) {
  return value.trim().toLocaleLowerCase("zh-CN");
}

function matchesSearch(product, query) {
  if (!query) {
    return true;
  }

  const searchable = [
    product.name,
    product.summary,
    ...product.topics,
    ...product.regions.flatMap((region) => [region.name, region.code]),
  ].join(" ");

  return normalize(searchable).includes(query);
}

function appendTextElement(parent, tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  element.textContent = text;
  parent.append(element);
  return element;
}

function createProductCard(product, index) {
  const card = document.createElement("a");
  card.className = "product-card";
  card.href = product.path;
  card.style.setProperty("--product-accent", product.accent);
  card.style.setProperty("--product-accent-soft", product.accentSoft);
  card.setAttribute("aria-label", `进入 ${product.name} 使用指南`);

  const head = document.createElement("div");
  head.className = "product-card-head";
  appendTextElement(head, "span", "product-mark", product.mark);
  const state = appendTextElement(head, "span", "product-state", product.status);
  if (product.state === "building") {
    state.classList.add("product-state-building");
  }

  const body = document.createElement("div");
  body.className = "product-card-body";
  const regionLabel = product.regions
    .map((region) => `${region.code} · ${region.name}`)
    .join(" / ");
  appendTextElement(body, "p", "", regionLabel);
  appendTextElement(body, "h3", "", product.name);
  appendTextElement(body, "span", "", product.summary);

  const topicList = document.createElement("ul");
  topicList.className = "topic-list";
  topicList.setAttribute("aria-label", `${product.name} 教程主题`);
  for (const topic of product.topics) {
    appendTextElement(topicList, "li", "", topic);
  }

  const foot = document.createElement("div");
  foot.className = "product-card-foot";
  appendTextElement(foot, "span", "", String(index + 1).padStart(2, "0"));
  const linkText = appendTextElement(foot, "strong", "", "查看教程 ");
  const arrow = appendTextElement(linkText, "i", "", "↗");
  arrow.setAttribute("aria-hidden", "true");

  card.append(head, body, topicList, foot);
  return card;
}

function updateFilterState() {
  for (const button of regionFilters.querySelectorAll(".filter-chip")) {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.region === activeRegion),
    );
  }
}

function renderFilters() {
  const fragment = document.createDocumentFragment();

  for (const region of regions) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "filter-chip";
    button.textContent = region.name;
    button.dataset.region = region.code;
    button.setAttribute("aria-pressed", String(region.code === activeRegion));
    button.addEventListener("click", () => {
      activeRegion = region.code;
      updateFilterState();
      renderProducts();
    });
    fragment.append(button);
  }

  regionFilters.replaceChildren(fragment);
}

function renderProducts() {
  const query = normalize(searchInput.value);
  const filtered = sortedProducts.filter((product) => {
    const regionMatches =
      activeRegion === "all" ||
      product.regions.some((region) => region.code === activeRegion);
    return regionMatches && matchesSearch(product, query);
  });

  const fragment = document.createDocumentFragment();
  filtered.forEach((product, index) => {
    fragment.append(createProductCard(product, index));
  });

  productGrid.replaceChildren(fragment);
  catalogCount.textContent = `共 ${filtered.length} 个品牌`;
  emptyState.hidden = filtered.length !== 0;
  productGrid.hidden = filtered.length === 0;
}

function resetCatalog() {
  activeRegion = "all";
  searchInput.value = "";
  updateFilterState();
  renderProducts();
  searchInput.focus();
}

searchInput.addEventListener("input", renderProducts);
resetSearch.addEventListener("click", resetCatalog);

brandCount.textContent = String(products.length);
guideCount.textContent = `${products.reduce(
  (total, product) => total + product.articleCount,
  0,
)}+`;
regionCount.textContent = String(regionMap.size);

renderFilters();
renderProducts();
