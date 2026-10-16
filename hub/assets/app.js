import { products as fallbackProducts } from "./products.js";

const defaultAnimationSettings = {
  orbit: {
    layerCount: 11,
    coreCount: 3,
    startGap: 0.03,
    spacingRatio: 1.32,
    periodStart: 4.6,
    periodStep: 3.1,
    minimumRadiusFactor: 0.78,
    strokeColor: "#6e8f84",
    strokeWidthStart: 1.18,
    strokeWidthStep: 0.03,
    strokeWidthMinimum: 0.84,
    coreOpacityStart: 0.5,
    coreOpacityStep: 0.04,
    outerOpacityStart: 0.34,
    outerOpacityStep: 0.026,
    minimumOpacity: 0.16,
    directions: [-1, 1],
    aspects: [0.62, 0.7, 0.78, 0.58, 0.68, 0.76, 0.6, 0.72, 0.8, 0.64, 0.74],
    rotations: [15, -34, 49, -64, 27, -18, 62, -45, 14, -28, 41],
  },
  pointer: {
    enabled: true,
    maxX: 36,
    maxY: 28,
    followStrength: 0.16,
    shift: 0.45,
  },
  avatar: {
    hoverScale: 1.15,
    hoverRotation: 360,
    hoverDuration: 0.8,
  },
};

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
  animation: defaultAnimationSettings,
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

function clampNumber(value, fallback, minimum, maximum) {
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return fallback;
  }
  return Math.min(maximum, Math.max(minimum, number));
}

function pickArrayValue(values, index, fallback) {
  return Array.isArray(values) && values.length > 0
    ? values[index % values.length]
    : fallback;
}

function normalizeOrbitSettings(rawSettings) {
  const raw =
    rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const fallback = defaultAnimationSettings.orbit;
  const layerCount = Math.round(
    clampNumber(raw.layerCount, fallback.layerCount, 1, 32),
  );
  const coreCount = Math.round(
    clampNumber(raw.coreCount, fallback.coreCount, 0, layerCount),
  );
  const aspects = Array.from({ length: layerCount }, (_, index) => {
    const fallbackAspect =
      fallback.aspects[index % fallback.aspects.length];
    return clampNumber(
      pickArrayValue(raw.aspects, index, fallbackAspect),
      fallbackAspect,
      0.35,
      1,
    );
  });
  const rotations = Array.from({ length: layerCount }, (_, index) => {
    const fallbackRotation =
      fallback.rotations[index % fallback.rotations.length];
    return clampNumber(
      pickArrayValue(raw.rotations, index, fallbackRotation),
      fallbackRotation,
      -180,
      180,
    );
  });
  const directions =
    Array.isArray(raw.directions) && raw.directions.length > 0
      ? raw.directions.map((direction) => (Number(direction) < 0 ? -1 : 1))
      : fallback.directions;

  const strokeColor =
    typeof raw.strokeColor === "string" &&
    /^#(?:[0-9a-f]{3}|[0-9a-f]{4}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(
      raw.strokeColor,
    )
      ? raw.strokeColor
      : fallback.strokeColor;

  return {
    layerCount,
    coreCount,
    startGap: clampNumber(raw.startGap, fallback.startGap, 0.001, 0.5),
    spacingRatio: clampNumber(
      raw.spacingRatio,
      fallback.spacingRatio,
      1.01,
      2.2,
    ),
    periodStart: clampNumber(
      raw.periodStart,
      fallback.periodStart,
      0.5,
      120,
    ),
    periodStep: clampNumber(
      raw.periodStep,
      fallback.periodStep,
      0,
      60,
    ),
    minimumRadiusFactor: clampNumber(
      raw.minimumRadiusFactor,
      fallback.minimumRadiusFactor,
      0.5,
      1.5,
    ),
    strokeColor,
    strokeWidthStart: clampNumber(
      raw.strokeWidthStart,
      fallback.strokeWidthStart,
      0.3,
      4,
    ),
    strokeWidthStep: clampNumber(
      raw.strokeWidthStep,
      fallback.strokeWidthStep,
      0,
      0.5,
    ),
    strokeWidthMinimum: clampNumber(
      raw.strokeWidthMinimum,
      fallback.strokeWidthMinimum,
      0.3,
      4,
    ),
    coreOpacityStart: clampNumber(
      raw.coreOpacityStart,
      fallback.coreOpacityStart,
      0,
      1,
    ),
    coreOpacityStep: clampNumber(
      raw.coreOpacityStep,
      fallback.coreOpacityStep,
      0,
      0.5,
    ),
    outerOpacityStart: clampNumber(
      raw.outerOpacityStart,
      fallback.outerOpacityStart,
      0,
      1,
    ),
    outerOpacityStep: clampNumber(
      raw.outerOpacityStep,
      fallback.outerOpacityStep,
      0,
      0.5,
    ),
    minimumOpacity: clampNumber(
      raw.minimumOpacity,
      fallback.minimumOpacity,
      0,
      1,
    ),
    directions,
    aspects,
    rotations,
  };
}

function normalizePointerSettings(rawSettings) {
  const raw =
    rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const fallback = defaultAnimationSettings.pointer;
  return {
    enabled: raw.enabled !== false,
    maxX: clampNumber(raw.maxX, fallback.maxX, 0, 200),
    maxY: clampNumber(raw.maxY, fallback.maxY, 0, 200),
    followStrength: clampNumber(
      raw.followStrength,
      fallback.followStrength,
      0.01,
      0.8,
    ),
    shift: clampNumber(raw.shift, fallback.shift, 0, 2),
  };
}

function normalizeAvatarSettings(rawSettings) {
  const raw =
    rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const fallback = defaultAnimationSettings.avatar;
  return {
    hoverScale: clampNumber(raw.hoverScale, fallback.hoverScale, 0.8, 2.5),
    hoverRotation: clampNumber(
      raw.hoverRotation,
      fallback.hoverRotation,
      -1080,
      1080,
    ),
    hoverDuration: clampNumber(
      raw.hoverDuration,
      fallback.hoverDuration,
      0.1,
      6,
    ),
  };
}

function applyAvatarSettings(rawSettings) {
  const avatarSettings = normalizeAvatarSettings(rawSettings);
  const rootStyle = document.documentElement.style;
  rootStyle.setProperty(
    "--avatar-hover-scale",
    String(avatarSettings.hoverScale),
  );
  rootStyle.setProperty(
    "--avatar-hover-rotation",
    avatarSettings.hoverRotation + "deg",
  );
  rootStyle.setProperty(
    "--avatar-hover-duration",
    avatarSettings.hoverDuration + "s",
  );
}

function buildOrbitLayerConfig(settings) {
  return Array.from({ length: settings.layerCount }, (_, index) => {
    const distance =
      index === 0
        ? 0
        : Number(
            (
              (settings.startGap *
                (Math.pow(settings.spacingRatio, index) - 1)) /
              (settings.spacingRatio - 1)
            ).toFixed(4),
          );
    const isCoreLayer = index < settings.coreCount;
    const opacity = Math.max(
      settings.minimumOpacity,
      isCoreLayer
        ? settings.coreOpacityStart - index * settings.coreOpacityStep
        : settings.outerOpacityStart -
            (index - settings.coreCount) * settings.outerOpacityStep,
    );

    return {
      name: "layer-" + String(index + 1).padStart(2, "0"),
      direction: settings.directions[index % settings.directions.length],
      period: settings.periodStart + index * settings.periodStep,
      opacity: Number(opacity.toFixed(3)),
      strokeWidth: Number(
        Math.max(
          settings.strokeWidthMinimum,
          settings.strokeWidthStart - index * settings.strokeWidthStep,
        ).toFixed(2),
      ),
      distance,
      rings: [
        {
          aspect: settings.aspects[index],
          rotation: settings.rotations[index],
        },
      ],
    };
  });
}
function initializeOrbitField(rawSettings) {
  const orbitSettings = normalizeOrbitSettings(rawSettings);
  const orbitLayerConfig = buildOrbitLayerConfig(orbitSettings);
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
    group.setAttribute("stroke", orbitSettings.strokeColor);
    group.setAttribute("stroke-linecap", "round");
    group.setAttribute("opacity", String(layer.opacity));

    for (const ring of layer.rings) {
      const ellipse = document.createElementNS(svgNamespace, "ellipse");
      ellipse.setAttribute("cx", "0");
      ellipse.setAttribute("cy", "0");
      ellipse.setAttribute("stroke-width", String(layer.strokeWidth));
      ellipse.setAttribute("vector-effect", "non-scaling-stroke");
      ellipse.setAttribute("opacity", "1");
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
    const minimumRadius = avatarDiameter * orbitSettings.minimumRadiusFactor;

    for (const layer of orbitLayerConfig) {
      const group = orbitGroups.get(layer.name);
      const layerRadius =
        minimumRadius + coverageRadius * layer.distance;
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

function initializePointerFeedback(rawSettings) {
  const pointerSettings = normalizePointerSettings(rawSettings);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (!pointerSettings.enabled || reduceMotion.matches) {
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

    currentX += (targetX - currentX) * pointerSettings.followStrength;
    currentY += (targetY - currentY) * pointerSettings.followStrength;
    if (orbitField) {
      orbitField.style.transform = `translate3d(${(currentX * pointerSettings.shift).toFixed(2)}px, ${(currentY * pointerSettings.shift).toFixed(2)}px, 0)`;
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
    targetX = ((event.clientX / width) - 0.5) * pointerSettings.maxX;
    targetY = ((event.clientY / height) - 0.5) * pointerSettings.maxY;
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
  applyAvatarSettings(siteContent.animation?.avatar);
  initializeOrbitField(siteContent.animation?.orbit);
  initializePointerFeedback(siteContent.animation?.pointer);
  window.dispatchEvent(new Event("orbit-layout"));
  document.documentElement.classList.remove("no-js");
}

initializePage().catch((error) => {
  console.error(error);
  document.documentElement.classList.remove("no-js");
});
