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
    name: "near",
    direction: -1,
    period: 4.6,
    opacity: 0.44,
    strokeWidth: 1.2,
    distance: 0.09,
    rings: [{ aspect: 0.8, rotation: 15 }],
  },
  {
    name: "inner",
    direction: 1,
    period: 6.7,
    opacity: 0.4,
    strokeWidth: 1.15,
    distance: 0.14,
    rings: [{ aspect: 0.75, rotation: -34 }],
  },
  {
    name: "middle-one",
    direction: -1,
    period: 9.1,
    opacity: 0.36,
    strokeWidth: 1.1,
    distance: 0.2,
    rings: [{ aspect: 0.86, rotation: 49 }],
  },
  {
    name: "middle-two",
    direction: 1,
    period: 12.1,
    opacity: 0.33,
    strokeWidth: 1.05,
    distance: 0.29,
    rings: [{ aspect: 0.72, rotation: -64 }],
  },
  {
    name: "broad-one",
    direction: -1,
    period: 15.4,
    opacity: 0.3,
    strokeWidth: 1.02,
    distance: 0.4,
    rings: [{ aspect: 0.9, rotation: 27 }],
  },
  {
    name: "broad-two",
    direction: 1,
    period: 19.1,
    opacity: 0.27,
    strokeWidth: 0.98,
    distance: 0.54,
    rings: [{ aspect: 0.77, rotation: -18 }],
  },
  {
    name: "edge-one",
    direction: -1,
    period: 23.2,
    opacity: 0.25,
    strokeWidth: 0.95,
    distance: 0.7,
    rings: [{ aspect: 0.93, rotation: 62 }],
  },
  {
    name: "edge-two",
    direction: 1,
    period: 27.8,
    opacity: 0.23,
    strokeWidth: 0.92,
    distance: 0.87,
    rings: [{ aspect: 0.84, rotation: -45 }],
  },
  {
    name: "edge-three",
    direction: -1,
    period: 32.7,
    opacity: 0.22,
    strokeWidth: 0.9,
    distance: 0.99,
    rings: [{ aspect: 0.96, rotation: 14 }],
  },
  {
    name: "horizon",
    direction: 1,
    period: 38,
    opacity: 0.2,
    strokeWidth: 0.88,
    distance: 1.08,
    rings: [{ aspect: 0.88, rotation: -28 }],
  },
];

function initializeOrbitField() {
  const svgNamespace = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(svgNamespace, "svg");
  svg.classList.add("orbit-field");
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
      ellipse.setAttribute("stroke-width", String(layer.strokeWidth));
      ellipse.setAttribute("vector-effect", "non-scaling-stroke");
      ellipse.setAttribute("opacity", String(ring.opacity));
      group.append(ellipse);
    }

    svg.append(group);
    orbitGroups.set(layer.name, group);
  }

  document.body.prepend(svg);

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let animationFrame = null;
  let layoutFrame = null;
  let startedAt = 0;
  let orbitCenter = { cx: window.innerWidth / 2, cy: window.innerHeight / 2 };

  const layoutOrbits = () => {
    const viewportWidth = Math.max(window.innerWidth, 1);
    const viewportHeight = Math.max(window.innerHeight, 1);
    const avatar = document.querySelector(".avatar-wrap");
    const avatarBounds = avatar?.getBoundingClientRect();
    const avatarDiameter = avatarBounds
      ? Math.max(avatarBounds.width, avatarBounds.height)
      : Math.min(viewportWidth, viewportHeight) * 0.12;

    orbitCenter = {
      cx: avatarBounds
        ? avatarBounds.left + avatarBounds.width / 2
        : viewportWidth / 2,
      cy: avatarBounds
        ? avatarBounds.top + avatarBounds.height / 2
        : viewportHeight / 2,
    };

    svg.setAttribute(
      "viewBox",
      `0 0 ${viewportWidth.toFixed(2)} ${viewportHeight.toFixed(2)}`,
    );

    const furthestHorizontal = Math.max(
      orbitCenter.cx,
      viewportWidth - orbitCenter.cx,
    );
    const furthestVertical = Math.max(
      orbitCenter.cy,
      viewportHeight - orbitCenter.cy,
    );
    const coverageRadius = Math.hypot(furthestHorizontal, furthestVertical);
    const minimumRadius = avatarDiameter * 0.78;

    for (const layer of orbitLayerConfig) {
      const group = orbitGroups.get(layer.name);
      const layerRadius = Math.max(
        minimumRadius,
        coverageRadius * layer.distance,
      );
      const ellipses = group.querySelectorAll("ellipse");

      layer.rings.forEach((ring, ringIndex) => {
        const ellipse = ellipses[ringIndex];
        ellipse.setAttribute("rx", layerRadius.toFixed(2));
        ellipse.setAttribute(
          "ry",
          (layerRadius * ring.aspect).toFixed(2),
        );
        ellipse.setAttribute("transform", `rotate(${ring.rotation})`);
      });
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
      updateOrbits(
        reduceMotion.matches ? 0 : (performance.now() - startedAt) / 1000,
      );
    });
  };

  layoutOrbits();
  syncMotion();
  window.addEventListener("resize", syncLayout, { passive: true });
  window.addEventListener("load", syncLayout, { once: true });
  window.addEventListener("orbit-layout", syncLayout);
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
  window.dispatchEvent(new Event("orbit-layout"));
  document.documentElement.classList.remove("no-js");
}

initializeOrbitField();
initializePointerFeedback();
initializePage().catch((error) => {
  console.error(error);
  document.documentElement.classList.remove("no-js");
});
