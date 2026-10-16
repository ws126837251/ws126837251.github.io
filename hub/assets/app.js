import { products as fallbackProducts } from "./products.js";

const fallbackContent = {
  brand: {
    name: "无风小卖部",
    homeLabel: "无风小卖部首页",
    avatarAlt: "无风小卖部头像",
  },
  navigation: {
    editLabel: "GitHub",
    editUrl:
      "https://github.com/ws126837251/ws126837251.github.io/edit/main/hub/site-content.json",
    aboutLabel: "Wufeng",
    aboutUrl: "https://wufeng.de/",
  },
  footer: {
    copyright: "Copyright ©",
    linkLabel: "Wufeng",
    linkUrl: "https://wufeng.de/",
  },
  notFound: {
    title: "页面未找到",
    description: "这个页面不存在，返回首页继续选择品牌教程。",
    action: "返回首页",
  },
  products: fallbackProducts,
};

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
    const value = getContentValue(siteContent, element.dataset.content);
    if (typeof value !== "string" && typeof value !== "number") {
      continue;
    }

    if (element.dataset.contentAttr) {
      element.setAttribute(element.dataset.contentAttr, String(value));
    } else {
      element.textContent = String(value);
    }
  }
}

function createButton(label, href) {
  const link = document.createElement("a");
  link.className = "button";
  link.href = href;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  return link;
}

function renderButtons(siteContent) {
  const buttonList = document.querySelector("#buttonList");
  if (!buttonList) {
    return;
  }

  const fragment = document.createDocumentFragment();
  if (document.body.dataset.page === "not-found") {
    fragment.append(createButton(siteContent.notFound.action, "/"));
  } else {
    const products = Array.isArray(siteContent.products)
      ? [...siteContent.products].sort((first, second) =>
          first.name.localeCompare(second.name, "zh-CN", {
            numeric: true,
            sensitivity: "base",
          }),
        )
      : [];
    for (const product of products) {
      fragment.append(createButton(product.name, product.path));
    }
    fragment.append(
      createButton(siteContent.navigation.editLabel, siteContent.navigation.editUrl),
      createButton(siteContent.navigation.aboutLabel, siteContent.navigation.aboutUrl),
    );
  }

  buttonList.replaceChildren(fragment);
}

const orbitStarConfig = [
  { cx: 800, cy: 430, rx: 310, ry: 105, rotation: -12, period: 24, phase: 0.2, radius: 2.2 },
  { cx: 800, cy: 430, rx: 350, ry: 120, rotation: 14, period: 31, phase: 2.3, radius: 1.8 },
  { cx: 800, cy: 430, rx: 390, ry: 140, rotation: -27, period: 38, phase: 4.7, radius: 2.5 },
  { cx: 800, cy: 430, rx: 310, ry: 105, rotation: -12, period: 27, phase: 3.4, radius: 1.5 },
  { cx: 800, cy: 430, rx: 650, ry: 235, rotation: -8, period: 52, phase: 1.2, radius: 2.4 },
  { cx: 800, cy: 430, rx: 590, ry: 285, rotation: 18, period: 67, phase: 3.1, radius: 1.7 },
  { cx: 800, cy: 430, rx: 700, ry: 165, rotation: -24, period: 81, phase: 5.4, radius: 2.1 },
  { cx: 800, cy: 430, rx: 650, ry: 235, rotation: -8, period: 61, phase: 4.2, radius: 1.4 },
];

function initializeOrbitStars() {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("orbit-stars");
  svg.setAttribute("viewBox", "0 0 1600 1000");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  const stars = orbitStarConfig.map((config) => {
    const star = document.createElementNS(svgNamespace, "circle");
    star.classList.add("orbit-star");
    star.setAttribute("r", String(config.radius));
    svg.append(star);
    return { config, element: star };
  });

  document.body.prepend(svg);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = null;
  let startedAt = 0;

  const updateStars = (elapsedSeconds) => {
    for (const { config, element } of stars) {
      const angle = config.phase + (elapsedSeconds * Math.PI * 2) / config.period;
      const rotation = (config.rotation * Math.PI) / 180;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const x =
        config.cx +
        config.rx * cosAngle * Math.cos(rotation) -
        config.ry * sinAngle * Math.sin(rotation);
      const y =
        config.cy +
        config.rx * cosAngle * Math.sin(rotation) +
        config.ry * sinAngle * Math.cos(rotation);
      element.setAttribute("transform", `translate(${x.toFixed(2)} ${y.toFixed(2)})`);
    }
  };

  const stopMotion = () => {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    updateStars(0);
  };

  const tick = (now) => {
    updateStars((now - startedAt) / 1000);
    animationFrame = window.requestAnimationFrame(tick);
  };

  const startMotion = () => {
    stopMotion();
    startedAt = performance.now();
    animationFrame = window.requestAnimationFrame(tick);
  };

  const syncMotion = () => {
    if (reduceMotion.matches) {
      stopMotion();
    } else {
      startMotion();
    }
  };

  syncMotion();
  if (typeof reduceMotion.addEventListener === "function") {
    reduceMotion.addEventListener("change", syncMotion);
  } else {
    reduceMotion.addListener(syncMotion);
  }
}

async function initializePage() {
  let siteContent;
  try {
    siteContent = await loadSiteContent();
  } catch (error) {
    console.error(error);
    siteContent = fallbackContent;
  }

  applyContent(siteContent);
  renderButtons(siteContent);
  document.documentElement.classList.remove("no-js");
}

initializeOrbitStars();
initializePage().catch((error) => {
  console.error(error);
  document.documentElement.classList.remove("no-js");
});
