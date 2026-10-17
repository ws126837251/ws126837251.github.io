import { products as fallbackProducts } from "./products.js";

const defaultAnimationSettings = {
  avatar: {
    spinDuration: 18,
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
    fragment.append(createButton(siteContent.navigation.aboutLabel, siteContent.navigation.aboutUrl));
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

function normalizeAvatarSettings(rawSettings) {
  const raw =
    rawSettings && typeof rawSettings === "object" ? rawSettings : {};
  const fallback = defaultAnimationSettings.avatar;
  return {
    spinDuration: clampNumber(
      raw.spinDuration,
      fallback.spinDuration,
      4,
      120,
    ),
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

function initializeAvatarAnimation(rawSettings) {
  const avatarSettings = normalizeAvatarSettings(rawSettings);
  const avatar = document.querySelector(".avatar-disc");
  if (!avatar || typeof avatar.animate !== "function") {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const spinDuration = avatarSettings.spinDuration * 1000;
  let baseAnimation = null;
  let hoverAnimation = null;
  let motionEnabled = true;
  let pointerInside = false;

  const normalizeAngle = (angle) => ((angle % 360) + 360) % 360;
  const getBaseAngle = () => {
    const currentTime = Number(baseAnimation?.currentTime ?? 0);
    if (!Number.isFinite(currentTime)) {
      return 0;
    }
    return normalizeAngle((currentTime / spinDuration) * 360);
  };
  const getRenderedAngle = () => {
    const angle = Number.parseFloat(getComputedStyle(avatar).rotate);
    return Number.isFinite(angle) ? angle : 0;
  };
  const startBaseAnimation = (startAngle = 0) => {
    baseAnimation = avatar.animate(
      [{ rotate: "0deg" }, { rotate: "360deg" }],
      {
        duration: spinDuration,
        iterations: Infinity,
        easing: "linear",
        fill: "both",
      },
    );
    baseAnimation.currentTime =
      (normalizeAngle(startAngle) / 360) * spinDuration;
  };
  const stopAnimations = () => {
    if (hoverAnimation) {
      hoverAnimation.cancel();
      hoverAnimation = null;
    }
    if (baseAnimation) {
      baseAnimation.cancel();
      baseAnimation = null;
    }
    avatar.style.removeProperty("rotate");
  };
  const resumeBaseAnimation = (angle) => {
    if (!baseAnimation) {
      startBaseAnimation(angle);
      return;
    }
    baseAnimation.currentTime =
      (normalizeAngle(angle) / 360) * spinDuration;
    baseAnimation.play();
  };
  const finishHover = () => {
    if (pointerInside) {
      return;
    }
    const finishedAnimation = hoverAnimation;
    hoverAnimation = null;
    finishedAnimation?.cancel();
    if (motionEnabled) {
      resumeBaseAnimation(getRenderedAngle());
    }
  };
  const startHover = () => {
    pointerInside = true;
    if (!motionEnabled || !baseAnimation || hoverAnimation) {
      return;
    }

    baseAnimation.pause();
    const startAngle = getBaseAngle();
    const normalizedStartAngle = normalizeAngle(startAngle);
    const toUpright =
      normalizedStartAngle < 0.01 ? 360 : 360 - normalizedStartAngle;
    const minimumRotation = Math.max(0, avatarSettings.hoverRotation);
    const extraTurns = Math.max(
      0,
      Math.ceil((minimumRotation - toUpright) / 360),
    );
    const endAngle = startAngle + toUpright + extraTurns * 360;
    hoverAnimation = avatar.animate(
      [
        { rotate: `${startAngle}deg` },
        { rotate: `${endAngle}deg` },
      ],
      {
        duration: avatarSettings.hoverDuration * 1000,
        easing: "ease-out",
        fill: "forwards",
      },
    );
    hoverAnimation.addEventListener(
      "finish",
      finishHover,
      { once: true },
    );
  };
  const endHover = () => {
    pointerInside = false;
    if (!motionEnabled || !baseAnimation) {
      return;
    }
    const currentAngle = getRenderedAngle();
    if (hoverAnimation) {
      hoverAnimation.cancel();
      hoverAnimation = null;
    }
    resumeBaseAnimation(currentAngle);
  };
  const syncMotion = () => {
    if (reduceMotion.matches) {
      motionEnabled = false;
      stopAnimations();
      return;
    }
    motionEnabled = true;
    if (!baseAnimation) {
      startBaseAnimation();
    }
  };

  avatar.addEventListener("pointerenter", startHover, { passive: true });
  avatar.addEventListener("pointerleave", endHover, { passive: true });
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
  applyAvatarSettings(siteContent.animation?.avatar);
  initializeAvatarAnimation(siteContent.animation?.avatar);
  document.documentElement.classList.remove("no-js");
}

initializePage().catch((error) => {
  console.error(error);
  document.documentElement.classList.remove("no-js");
});
