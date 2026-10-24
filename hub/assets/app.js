const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
document.documentElement.classList.remove("no-js");

function initializeTheme() {
  const toggle = document.getElementById("themeToggle");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = null;
  try {
    const saved = localStorage.getItem("wf-theme");
    if (saved === "light" || saved === "dark") preference = saved;
  } catch {
    // Theme switching remains usable when browser storage is unavailable.
  }

  function applyTheme(dark) {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    const label = dark ? "切换到浅色模式" : "切换到深色模式";
    toggle?.setAttribute("aria-label", label);
    toggle?.setAttribute("title", label);
    toggle?.setAttribute("aria-pressed", String(dark));
    document.dispatchEvent(new Event("themechange"));
  }

  applyTheme(preference ? preference === "dark" : prefersDark.matches);
  toggle?.addEventListener("click", () => {
    preference = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
    try {
      localStorage.setItem("wf-theme", preference);
    } catch {
      // Keep the selected theme for this visit even without persistent storage.
    }
    applyTheme(preference === "dark");
  });
  prefersDark.addEventListener("change", (event) => {
    if (!preference) applyTheme(event.matches);
  });
}

// Pause work in background tabs and stop it entirely for reduced motion.
function startMotionLoop(render, reset) {
  let frameId = null;
  let previousTime = null;

  function frame(now) {
    const delta = previousTime === null ? 0 : Math.min(now - previousTime, 50) / 1000;
    previousTime = now;
    render(delta);
    frameId = requestAnimationFrame(frame);
  }

  function sync() {
    if (frameId !== null) cancelAnimationFrame(frameId);
    frameId = null;
    previousTime = null;
    if (reduceMotion.matches) {
      reset();
    } else if (!document.hidden) {
      frameId = requestAnimationFrame(frame);
    }
  }

  reduceMotion.addEventListener("change", sync);
  document.addEventListener("visibilitychange", sync);
  sync();
}

function loadAvatarSettings() {
  let raw = {};
  try {
    raw = JSON.parse(document.getElementById("avatarSettings")?.textContent || "{}");
  } catch {
    // Static navigation and the reference animation work without configuration.
  }
  const bounded = (value, fallback, min, max) =>
    Number.isFinite(Number(value)) ? Math.min(max, Math.max(min, Number(value))) : fallback;
  return {
    spinDuration: bounded(raw.spinDuration, 3, 1, 120),
    hoverDuration: bounded(raw.hoverDuration, 0.95, 0.1, 6),
    hoverRotation: bounded(raw.hoverRotation, 360, 360, 1080),
    hoverScale: bounded(raw.hoverScale, 1, 0.8, 2.5),
  };
}

function initializeAvatarAnimation() {
  const avatar = document.getElementById("avatarDisc");
  const image = document.getElementById("avatarImage");
  const fallback = document.getElementById("avatarFallback");
  if (!avatar || !image) return;

  const settings = loadAvatarSettings();
  avatar.style.setProperty("--avatar-hover-scale", settings.hoverScale);
  function showFallback() {
    image.style.display = "none";
    if (fallback) fallback.style.display = "flex";
  }
  image.addEventListener("error", showFallback);
  if (image.complete && image.naturalWidth === 0) showFallback();

  let angle = 0;
  let spinning = false;
  let settled = false;
  let hovering = false;
  let keyboardFocused = false;
  let spinElapsed = 0;
  let spinStart = 0;
  let spinTarget = 0;

  function beginSpin() {
    if (reduceMotion.matches || spinning) return;
    spinStart = angle;
    const normalized = ((angle % 360) + 360) % 360;
    spinTarget = angle + ((360 - normalized) % 360) +
      Math.ceil(settings.hoverRotation / 360) * 360;
    spinElapsed = 0;
    settled = false;
    spinning = true;
  }

  function release() {
    if (!hovering && !keyboardFocused) settled = false;
  }

  avatar.addEventListener("pointerenter", (event) => {
    if (event.pointerType === "touch") return;
    hovering = true;
    beginSpin();
  });
  avatar.addEventListener("pointerleave", () => {
    hovering = false;
    release();
  });
  avatar.addEventListener("focus", () => {
    keyboardFocused = avatar.matches(":focus-visible");
    if (keyboardFocused) beginSpin();
  });
  avatar.addEventListener("blur", () => {
    keyboardFocused = false;
    release();
  });
  // Native button activation covers mouse, touch, Enter, and Space.
  avatar.addEventListener("click", beginSpin);

  startMotionLoop((delta) => {
    if (spinning) {
      spinElapsed += delta;
      const progress = Math.min(spinElapsed / settings.hoverDuration, 1);
      const c1 = 1.35;
      const eased = 1 + (c1 + 1) * Math.pow(progress - 1, 3) +
        c1 * Math.pow(progress - 1, 2);
      angle = spinStart + (spinTarget - spinStart) * eased;
      if (progress >= 1) {
        spinning = false;
        settled = hovering || keyboardFocused;
        angle = 0;
      }
    } else if (!settled) {
      angle = (angle + (360 / settings.spinDuration) * delta) % 360;
    }
    avatar.style.transform = "rotate(" + angle.toFixed(2) + "deg)";
  }, () => {
    angle = 0;
    spinning = false;
    settled = false;
    avatar.style.transform = "rotate(0deg)";
  });
}

function initializeWeatherEffect() {
  const canvas = document.getElementById("rainCanvas");
  const context = canvas?.getContext("2d");
  if (!context) return;
  let width = 0;
  let height = 0;
  let drops = [];
  let rainColor = "";

  function syncColor() {
    rainColor = getComputedStyle(document.documentElement)
      .getPropertyValue("--rain-color").trim();
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    drops = Array.from({ length: 44 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      length: 12 + Math.random() * 18,
      speed: 2.4 + Math.random() * 3.5,
      slant: -1.2,
    }));
  }

  syncColor();
  resize();
  document.addEventListener("themechange", syncColor);
  window.addEventListener("resize", resize, { passive: true });
  startMotionLoop((delta) => {
    context.clearRect(0, 0, width, height);
    context.strokeStyle = rainColor;
    context.lineWidth = 1.1;
    context.lineCap = "round";
    const frameScale = delta * 60;
    for (const drop of drops) {
      context.beginPath();
      context.moveTo(drop.x, drop.y);
      context.lineTo(drop.x + drop.slant * (drop.length / 5), drop.y + drop.length);
      context.stroke();
      drop.y += drop.speed * frameScale;
      drop.x += drop.slant * (drop.speed / 4) * frameScale;
      if (drop.y > height || drop.x < -30) {
        drop.y = -25;
        drop.x = Math.random() * width;
      }
    }
  }, () => context.clearRect(0, 0, width, height));
}

initializeTheme();
initializeAvatarAnimation();
initializeWeatherEffect();
