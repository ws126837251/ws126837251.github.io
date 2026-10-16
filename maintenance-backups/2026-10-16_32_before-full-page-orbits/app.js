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
    period: 10,
    opacity: 0.52,
    strokeWidth: 1.35,
    rings: [
      { x: 0.28, y: 0.18, rotation: 8 },
      { x: 0.2, y: 0.3, rotation: 55 },
    ],
  },
  {
    name: "inner",
    direction: -1,
    period: 16,
    opacity: 0.42,
    strokeWidth: 1.2,
    rings: [
      { x: 0.48, y: 0.26, rotation: -12 },
      { x: 0.32, y: 0.5, rotation: 42 },
    ],
  },
  {
    name: "middle",
    direction: 1,
    period: 24,
    opacity: 0.3,
    strokeWidth: 1.1,
    rings: [
      { x: 0.7, y: 0.34, rotation: 17 },
      { x: 0.52, y: 0.64, rotation: -38 },
    ],
  },
  {
    name: "outer",
    direction: 1,
    period: 32,
    opacity: 0.24,
    strokeWidth: 1,
    rings: [
      { x: 0.92, y: 0.4, rotation: -9 },
      { x: 0.68, y: 0.88, rotation: 34 },
    ],
  },
];

function initializeOrbitField() {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("orbit-field");
  svg.setAttribute("preserveAspectRatio", "none");
  svg.setAttribute("aria-hidden", "true");

  const createOrbitGroup = (layer) => {
    const group = document.createElementNS(svgNamespace, "g");
    group.classList.add("orbit-track", `orbit-${layer.name}`);
    group.setAttribute("fill", "none");
    group.setAttribute("stroke", "#6e8f84");
    group.setAttribute("stroke-linecap", "round");
    group.setAttribute("opacity", String(layer.opacity));
    svg.append(group);
    return group;
  };

  const orbitGroups = new Map(
    orbitLayerConfig.map((layer) => [layer.name, createOrbitGroup(layer)]),
  );

  document.body.prepend(svg);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = null;
  let startedAt = 0;
  let layoutFrame = null;
  let orbitCenter = { cx: 0, cy: 0 };

  const layoutOrbits = () => {
    const viewportWidth = Math.max(window.innerWidth, 1);
    const viewportHeight = Math.max(window.innerHeight, 1);
    const sceneHeight = 1000;
    const sceneWidth = (viewportWidth / viewportHeight) * sceneHeight;
    const avatar = document.querySelector(".avatar-wrap");
    const avatarBounds = avatar?.getBoundingClientRect();
    const avatarX = avatarBounds
      ? avatarBounds.left + avatarBounds.width / 2
      : viewportWidth / 2;
    const avatarY = avatarBounds
      ? avatarBounds.top + avatarBounds.height / 2
      : viewportHeight * 0.43;

    orbitCenter = {
      cx: (avatarX / viewportWidth) * sceneWidth,
      cy: (avatarY / viewportHeight) * sceneHeight,
    };
    svg.setAttribute("viewBox", `0 0 ${sceneWidth.toFixed(2)} ${sceneHeight}`);

    const safeX = Math.max(1, Math.min(orbitCenter.cx, sceneWidth - orbitCenter.cx) - 24);
    const safeY = Math.max(1, Math.min(orbitCenter.cy, sceneHeight - orbitCenter.cy) - 24);
    const orbitRadius = Math.min(safeX, safeY) * 0.92;

    for (const layer of orbitLayerConfig) {
      const group = orbitGroups.get(layer.name);
      const rings = layer.rings.map((ring) => {
        const ellipse = document.createElementNS(svgNamespace, "ellipse");
        ellipse.setAttribute("cx", "0");
        ellipse.setAttribute("cy", "0");
        ellipse.setAttribute("rx", (orbitRadius * ring.x).toFixed(2));
        ellipse.setAttribute("ry", (orbitRadius * ring.y).toFixed(2));
        ellipse.setAttribute("stroke-width", String(layer.strokeWidth));
        ellipse.setAttribute("vector-effect", "non-scaling-stroke");
        ellipse.setAttribute("transform", `rotate(${ring.rotation})`);
        return ellipse;
      });
      group.replaceChildren(...rings);
    }
  };

  const updateOrbits = (elapsedSeconds) => {
    for (const layer of orbitLayerConfig) {
      const angle = (elapsedSeconds * 360 * layer.direction) / layer.period;
      orbitGroups
        .get(layer.name)
        .setAttribute(
          "transform",
          `translate(${orbitCenter.cx.toFixed(2)} ${orbitCenter.cy.toFixed(2)}) rotate(${angle.toFixed(2)})`,
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

  const syncLayout = () => {
    if (layoutFrame !== null) {
      return;
    }
    layoutFrame = window.requestAnimationFrame(() => {
      layoutFrame = null;
      layoutOrbits();
      updateOrbits(reduceMotion.matches ? 0 : (performance.now() - startedAt) / 1000);
    });
  };

  layoutOrbits();
  syncMotion();
  window.addEventListener("resize", syncLayout, { passive: true });
  window.addEventListener("load", syncLayout, { once: true });
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
