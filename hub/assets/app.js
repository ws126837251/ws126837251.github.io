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

const orbitGroupConfig = {
  inner: {
    radii: [
      { rx: 310, ry: 105, rotation: -12 },
      { rx: 350, ry: 120, rotation: 14 },
      { rx: 390, ry: 140, rotation: -27 },
    ],
    strokeWidth: 1.4,
    opacity: 0.34,
  },
  outer: {
    radii: [
      { rx: 650, ry: 235, rotation: -8 },
      { rx: 590, ry: 285, rotation: 18 },
      { rx: 700, ry: 165, rotation: -24 },
      { rx: 930, ry: 480, rotation: -18 },
      { rx: 980, ry: 390, rotation: 22 },
    ],
    strokeWidth: 1.2,
    opacity: 0.2,
  },
};

const orbitCenter = { cx: 800, cy: 430 };

const orbitStarConfig = [
  { group: "inner", rx: 310, ry: 105, rotation: -12, period: 18, phase: 0.2, spinPeriod: 4.5, radius: 2.2 },
  { group: "inner", rx: 350, ry: 120, rotation: 14, period: 24, phase: 2.3, spinPeriod: 6.5, radius: 1.8 },
  { group: "inner", rx: 390, ry: 140, rotation: -27, period: 29, phase: 4.7, spinPeriod: 5.5, radius: 2.5, tone: "cool" },
  { group: "inner", rx: 310, ry: 105, rotation: -12, period: 21, phase: 3.4, spinPeriod: 7.5, radius: 1.5, tone: "cool" },
  { group: "outer", rx: 650, ry: 235, rotation: -8, period: 38, phase: 1.2, spinPeriod: 8, radius: 2.4 },
  { group: "outer", rx: 590, ry: 285, rotation: 18, period: 47, phase: 3.1, spinPeriod: 11, radius: 1.7, tone: "cool" },
  { group: "outer", rx: 700, ry: 165, rotation: -24, period: 55, phase: 5.4, spinPeriod: 9, radius: 2.1 },
  { group: "outer", rx: 650, ry: 235, rotation: -8, period: 43, phase: 4.2, spinPeriod: 13, radius: 1.4, tone: "cool" },
];

function initializeOrbitField() {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("orbit-field");
  svg.setAttribute("viewBox", "0 0 1600 1000");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  const createOrbitGroup = (groupName) => {
    const config = orbitGroupConfig[groupName];
    const group = document.createElementNS(svgNamespace, "g");
    group.setAttribute("fill", "none");
    group.setAttribute("stroke", "#6e8f84");
    group.setAttribute("stroke-linecap", "round");
    group.setAttribute("stroke-width", String(config.strokeWidth));
    group.setAttribute("opacity", String(config.opacity));

    for (const radius of config.radii) {
      const ellipse = document.createElementNS(svgNamespace, "ellipse");
      ellipse.setAttribute("cx", "800");
      ellipse.setAttribute("cy", "430");
      ellipse.setAttribute("rx", String(radius.rx));
      ellipse.setAttribute("ry", String(radius.ry));
      ellipse.setAttribute(
        "transform",
        `rotate(${radius.rotation} 800 430)`,
      );
      ellipse.setAttribute("vector-effect", "non-scaling-stroke");
      group.append(ellipse);
    }

    svg.append(group);
    return group;
  };

  const orbitGroups = {
    inner: createOrbitGroup("inner"),
    outer: createOrbitGroup("outer"),
  };

  const stars = orbitStarConfig.map((config) => {
    const star = document.createElementNS(svgNamespace, "g");
    star.classList.add("orbit-star");
    if (config.tone === "cool") {
      star.classList.add("cool");
    }

    const point = config.radius * 0.3;
    const shape = document.createElementNS(svgNamespace, "path");
    shape.setAttribute(
      "d",
      `M 0 ${-config.radius} L ${point} ${-point} L ${config.radius} 0 L ${point} ${point} L 0 ${config.radius} L ${-point} ${point} L ${-config.radius} 0 L ${-point} ${-point} Z`,
    );
    const core = document.createElementNS(svgNamespace, "circle");
    core.setAttribute("r", String(config.radius * 0.28));
    star.append(shape, core);
    svg.append(star);
    return { config, element: star };
  });

  document.body.prepend(svg);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = null;
  let startedAt = 0;

  const updateStars = (elapsedSeconds) => {
    const innerAngle = (elapsedSeconds * 360) / 24;
    const outerAngle = -(elapsedSeconds * 360) / 42;
    orbitGroups.inner.setAttribute("transform", `rotate(${innerAngle} 800 430)`);
    orbitGroups.outer.setAttribute("transform", `rotate(${outerAngle} 800 430)`);

    for (const { config, element } of stars) {
      const angle = config.phase + (elapsedSeconds * Math.PI * 2) / config.period;
      const groupAngle = config.group === "inner" ? innerAngle : outerAngle;
      const rotation = ((config.rotation + groupAngle) * Math.PI) / 180;
      const cosAngle = Math.cos(angle);
      const sinAngle = Math.sin(angle);
      const x =
        orbitCenter.cx +
        config.rx * cosAngle * Math.cos(rotation) -
        config.ry * sinAngle * Math.sin(rotation);
      const y =
        orbitCenter.cy +
        config.rx * cosAngle * Math.sin(rotation) +
        config.ry * sinAngle * Math.cos(rotation);
      const spin = (elapsedSeconds * 360) / config.spinPeriod + (config.phase * 180) / Math.PI;
      element.setAttribute(
        "transform",
        `translate(${x.toFixed(2)} ${y.toFixed(2)}) rotate(${spin.toFixed(2)})`,
      );
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
  } else if (typeof reduceMotion.addListener === "function") {
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

initializeOrbitField();
initializePage().catch((error) => {
  console.error(error);
  document.documentElement.classList.remove("no-js");
});
