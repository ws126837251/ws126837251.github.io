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

const orbitCenter = { cx: 800, cy: 430 };

const orbitStarConfig = [
  { group: "inner", cx: 720, cy: 430, orbitRadius: 320, period: 10, phase: 0.2, spinPeriod: 3, radius: 2.2 },
  { group: "inner", cx: 880, cy: 430, orbitRadius: 320, period: 14, phase: 2.3, spinPeriod: 4.5, radius: 1.8 },
  { group: "inner", cx: 800, cy: 430, orbitRadius: 270, period: 17, phase: 4.7, spinPeriod: 3.8, radius: 2.5, tone: "cool" },
  { group: "inner", cx: 720, cy: 430, orbitRadius: 320, period: 12, phase: 3.4, spinPeriod: 5.5, radius: 1.5, tone: "cool" },
  { group: "outer", cx: 570, cy: 430, orbitRadius: 560, period: 24, phase: 1.2, spinPeriod: 6, radius: 2.4 },
  { group: "outer", cx: 1030, cy: 430, orbitRadius: 560, period: 30, phase: 3.1, spinPeriod: 8, radius: 1.7, tone: "cool" },
  { group: "outer", cx: 800, cy: 430, orbitRadius: 680, period: 36, phase: 5.4, spinPeriod: 7, radius: 2.1 },
  { group: "outer", cx: 570, cy: 430, orbitRadius: 560, period: 28, phase: 4.2, spinPeriod: 9, radius: 1.4, tone: "cool" },
];

function initializeOrbitField() {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("orbit-field");
  svg.setAttribute("viewBox", "0 0 1600 1000");
  svg.setAttribute("preserveAspectRatio", "xMidYMid slice");
  svg.setAttribute("aria-hidden", "true");

  const createOrbitGroup = (groupName) => {
    const group = document.createElementNS(svgNamespace, "g");
    group.classList.add("orbit-track", groupName);
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
    const innerAngle = (elapsedSeconds * 360) / 14;
    const outerAngle = -(elapsedSeconds * 360) / 26;
    orbitGroups.inner.setAttribute("transform", `rotate(${innerAngle} 800 430)`);
    orbitGroups.outer.setAttribute("transform", `rotate(${outerAngle} 800 430)`);

    for (const { config, element } of stars) {
      const angle = config.phase + (elapsedSeconds * Math.PI * 2) / config.period;
      const groupAngle = config.group === "inner" ? innerAngle : outerAngle;
      const groupRotation = (groupAngle * Math.PI) / 180;
      const offsetX = config.cx - orbitCenter.cx;
      const offsetY = config.cy - orbitCenter.cy;
      const orbitCenterX =
        orbitCenter.cx +
        offsetX * Math.cos(groupRotation) -
        offsetY * Math.sin(groupRotation);
      const orbitCenterY =
        orbitCenter.cy +
        offsetX * Math.sin(groupRotation) +
        offsetY * Math.cos(groupRotation);
      const orbitAngle = angle + groupRotation;
      const x = orbitCenterX + config.orbitRadius * Math.cos(orbitAngle);
      const y = orbitCenterY + config.orbitRadius * Math.sin(orbitAngle);
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

function initializePointerFeedback() {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (reduceMotion.matches) {
    return;
  }

  const root = document.documentElement;
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
    root.style.setProperty("--orbit-mouse-x", `${currentX.toFixed(2)}px`);
    root.style.setProperty("--orbit-mouse-y", `${currentY.toFixed(2)}px`);
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
    root.style.setProperty("--orbit-mouse-x", "0px");
    root.style.setProperty("--orbit-mouse-y", "0px");
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
