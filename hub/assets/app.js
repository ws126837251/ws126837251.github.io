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

const orbitLayerConfig = [
  {
    name: "micro",
    direction: -1,
    period: 5.5,
    opacity: 0.45,
    strokeWidth: 1.28,
    rings: [
      { rx: 72, ry: 112, rotation: 18, opacity: 0.82 },
      { rx: 108, ry: 70, rotation: -46, opacity: 0.66 },
      { rx: 126, ry: 94, rotation: 61, opacity: 0.52 },
    ],
  },
  {
    name: "inner",
    direction: 1,
    period: 7.5,
    opacity: 0.39,
    strokeWidth: 1.2,
    rings: [
      { rx: 145, ry: 92, rotation: -30, opacity: 0.78 },
      { rx: 177, ry: 128, rotation: 18, opacity: 0.62 },
      { rx: 194, ry: 75, rotation: 62, opacity: 0.48 },
    ],
  },
  {
    name: "middle",
    direction: -1,
    period: 10.5,
    opacity: 0.34,
    strokeWidth: 1.14,
    rings: [
      { rx: 208, ry: 152, rotation: 51, opacity: 0.75 },
      { rx: 242, ry: 112, rotation: -17, opacity: 0.58 },
      { rx: 274, ry: 182, rotation: 29, opacity: 0.46 },
    ],
  },
  {
    name: "wide",
    direction: 1,
    period: 14,
    opacity: 0.29,
    strokeWidth: 1.08,
    rings: [
      { rx: 290, ry: 205, rotation: -23, opacity: 0.7 },
      { rx: 324, ry: 250, rotation: 35, opacity: 0.55 },
      { rx: 349, ry: 150, rotation: 70, opacity: 0.42 },
    ],
  },
  {
    name: "outer",
    direction: -1,
    period: 18,
    opacity: 0.25,
    strokeWidth: 1.02,
    rings: [
      { rx: 355, ry: 272, rotation: 31, opacity: 0.67 },
      { rx: 390, ry: 205, rotation: -38, opacity: 0.51 },
      { rx: 414, ry: 325, rotation: 11, opacity: 0.39 },
    ],
  },
  {
    name: "horizon",
    direction: 1,
    period: 23,
    opacity: 0.21,
    strokeWidth: 0.98,
    rings: [
      { rx: 412, ry: 350, rotation: -48, opacity: 0.63 },
      { rx: 440, ry: 255, rotation: 18, opacity: 0.47 },
      { rx: 452, ry: 380, rotation: 52, opacity: 0.35 },
    ],
  },
  {
    name: "perimeter",
    direction: -1,
    period: 29,
    opacity: 0.18,
    strokeWidth: 0.94,
    rings: [
      { rx: 438, ry: 410, rotation: 9, opacity: 0.6 },
      { rx: 465, ry: 315, rotation: -29, opacity: 0.45 },
      { rx: 475, ry: 355, rotation: 57, opacity: 0.32 },
    ],
  },
  {
    name: "boundary",
    direction: 1,
    period: 36,
    opacity: 0.16,
    strokeWidth: 0.9,
    rings: [
      { rx: 456, ry: 438, rotation: -23, opacity: 0.55 },
      { rx: 480, ry: 285, rotation: 41, opacity: 0.4 },
      { rx: 420, ry: 472, rotation: 68, opacity: 0.29 },
    ],
  },
];

function initializeOrbitField() {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const orbitCenter = { cx: 500, cy: 500 };
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("orbit-field");
  svg.setAttribute("viewBox", "0 0 1000 1000");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  const orbitGroups = new Map();

  for (const layer of orbitLayerConfig) {
    const group = document.createElementNS(svgNamespace, "g");
    group.classList.add("orbit-track", `orbit-${layer.name}`);
    group.setAttribute("fill", "none");
    group.setAttribute("stroke", "#6e8f84");
    group.setAttribute("stroke-linecap", "round");
    group.setAttribute("opacity", String(layer.opacity));

    for (const ring of layer.rings) {
      const ellipse = document.createElementNS(svgNamespace, "ellipse");
      ellipse.setAttribute("cx", "0");
      ellipse.setAttribute("cy", "0");
      ellipse.setAttribute("rx", String(ring.rx));
      ellipse.setAttribute("ry", String(ring.ry));
      ellipse.setAttribute("stroke-width", String(layer.strokeWidth));
      ellipse.setAttribute("vector-effect", "non-scaling-stroke");
      ellipse.setAttribute("opacity", String(ring.opacity));
      ellipse.setAttribute("transform", `rotate(${ring.rotation})`);
      group.append(ellipse);
    }

    svg.append(group);
    orbitGroups.set(layer.name, group);
  }

  document.body.prepend(svg);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = null;
  let startedAt = 0;

  const updateOrbits = (elapsedSeconds) => {
    for (const layer of orbitLayerConfig) {
      const angle = (elapsedSeconds * 360 * layer.direction) / layer.period;
      orbitGroups
        .get(layer.name)
        .setAttribute(
          "transform",
          `translate(${orbitCenter.cx} ${orbitCenter.cy}) rotate(${angle.toFixed(2)})`,
        );
    }
  };

  const stopMotion = () => {
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    updateOrbits(0);
  };

  const tick = (now) => {
    updateOrbits((now - startedAt) / 1000);
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

function initializePointerFeedback() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) {
    return;
  }

  const orbitField = document.querySelector(".orbit-field");
  let targetX = 0;
  let targetY = 0;
  let currentX = 0;
  let currentY = 0;
  let animationFrame = null;
  let motionEnabled = true;

  const animate = () => {
    if (!motionEnabled) {
      animationFrame = null;
      return;
    }

    currentX += (targetX - currentX) * 0.16;
    currentY += (targetY - currentY) * 0.16;
    if (orbitField) {
      orbitField.style.transform = `translate3d(${(currentX * 0.45).toFixed(2)}px, ${(currentY * 0.45).toFixed(2)}px, 0)`;
    }

    if (Math.abs(targetX - currentX) > 0.05 || Math.abs(targetY - currentY) > 0.05) {
      animationFrame = window.requestAnimationFrame(animate);
    } else {
      animationFrame = null;
    }
  };

  const start = () => {
    if (animationFrame === null && motionEnabled) {
      animationFrame = window.requestAnimationFrame(animate);
    }
  };

  const move = (event) => {
    const width = Math.max(window.innerWidth, 1);
    const height = Math.max(window.innerHeight, 1);
    targetX = ((event.clientX / width) - 0.5) * 36;
    targetY = ((event.clientY / height) - 0.5) * 28;
    start();
  };

  const reset = () => {
    targetX = 0;
    targetY = 0;
    start();
  };

  window.addEventListener("pointermove", move, { passive: true });
  window.addEventListener("pointerleave", reset);
  const syncMotion = (event) => {
    motionEnabled = !event.matches;
    if (motionEnabled) {
      start();
      return;
    }

    targetX = 0;
    targetY = 0;
    if (animationFrame !== null) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = null;
    }
    currentX = 0;
    currentY = 0;
    if (orbitField) {
      orbitField.style.transform = "none";
    }
  };

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
initializePointerFeedback();
initializePage().catch((error) => {
  console.error(error);
  document.documentElement.classList.remove("no-js");
});
