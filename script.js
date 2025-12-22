const CONFIG = {
  countApi: {
    namespace: "luca-discord-landing",
    key: "visits",
  },
  backgroundVideoSrc: "./bg.mp4",
  avatar: {
    src: "https://media.discordapp.net/attachments/1311059805313695815/1452639906420621312/IMG_7425.jpg?ex=694a8bd6&is=69493a56&hm=1aa4141824de339b5ae96444518157107fd3790a10c26db674630bdc3b4a4bf8&=&format=webp&width=894&height=739",
  },
  handle: "@𝐋𝙪cα 𝐟𝙪ᥣᥣ 𝗮cc𝙪ຮꫀ𝙙.exe",
};

const bgVideo = document.getElementById("bgVideo");
const enterOverlay = document.getElementById("enterOverlay");
const volumeSlider = document.getElementById("volumeSlider");
const muteBtn = document.getElementById("muteBtn");
const volumeWidget = document.getElementById("volumeWidget");
const viewCountEl = document.getElementById("viewCount");
const avatarEl = document.getElementById("avatar");
const handleEl = document.getElementById("handle");

let lastNonZeroVolume = 0.25;

function setBackgroundVideoSrc(src) {
  const source = bgVideo.querySelector("source");
  source.src = src;
  bgVideo.load();
}

function setHandleText(text) {
  handleEl.textContent = text;
}

function setAvatarSrc(src) {
  const clean = String(src || "");
  const isMp4 = clean.toLowerCase().split("?")[0].endsWith(".mp4");

  avatarEl.innerHTML = "";

  if (isMp4) {
    const v = document.createElement("video");
    v.src = clean;
    v.autoplay = true;
    v.loop = true;
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.setAttribute("preload", "auto");
    avatarEl.appendChild(v);
    return;
  }

  const img = document.createElement("img");
  img.src = clean;
  img.alt = "Avatar";
  img.draggable = false;
  avatarEl.appendChild(img);
}

function formatCount(value) {
  if (typeof value !== "number") return "—";
  return String(value);
}

function incrementLocalFallbackCount() {
  try {
    const key = "discord-landing-local-visits";
    const curr = Number(localStorage.getItem(key) || "0") || 0;
    const next = curr + 1;
    localStorage.setItem(key, String(next));
    return next;
  } catch {
    return null;
  }
}

async function incrementAndRenderCount() {
  if (navigator.onLine === false) {
    const local = incrementLocalFallbackCount();
    viewCountEl.textContent = formatCount(typeof local === "number" ? local : NaN);
    return;
  }

  const { namespace, key } = CONFIG.countApi;
  const url = `https://api.countapi.xyz/hit/${encodeURIComponent(
    namespace,
  )}/${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`CountAPI error: ${res.status}`);
    const data = await res.json();
    viewCountEl.textContent = formatCount(data.value);
  } catch {
    const local = incrementLocalFallbackCount();
    viewCountEl.textContent = formatCount(typeof local === "number" ? local : NaN);
  }
}

function setVideoVolume(nextVolume) {
  const v = Math.max(0, Math.min(1, Number(nextVolume)));

  bgVideo.volume = v;
  bgVideo.muted = v === 0;

  if (v > 0) lastNonZeroVolume = v;
  volumeSlider.value = String(v);
}

function toggleMute() {
  if (bgVideo.muted || bgVideo.volume === 0) {
    setVideoVolume(lastNonZeroVolume || 0.25);
  } else {
    setVideoVolume(0);
  }
}

function setVolumeWidgetOpen(isOpen) {
  const open = Boolean(isOpen);
  volumeWidget?.classList.toggle("is-open", open);
  volumeWidget?.setAttribute("aria-expanded", open ? "true" : "false");
}

async function enterSite() {
  if (document.body.classList.contains("entered")) return;

  document.body.classList.add("entered");

  bgVideo.muted = false;
  setVideoVolume(Number(volumeSlider.value || 0.25));

  try {
    await bgVideo.play();
  } catch {
    // Autoplay con audio potrebbe essere bloccato: resta comunque con UI pronta.
  }
}

function init() {
  setBackgroundVideoSrc(CONFIG.backgroundVideoSrc);
  setAvatarSrc(CONFIG.avatar.src);
  setHandleText(CONFIG.handle);

  setVideoVolume(Number(volumeSlider.value || 0.25));

  incrementAndRenderCount();

  enterOverlay.addEventListener("click", enterSite);
  enterOverlay.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") enterSite();
  });

  volumeSlider.addEventListener("input", (e) => {
    setVideoVolume(e.target.value);
  });

  muteBtn.addEventListener("click", (e) => {
    const isTouch = navigator.maxTouchPoints > 0;
    const isOpen = volumeWidget?.classList.contains("is-open");

    if (isTouch && !isOpen) {
      e.preventDefault();
      setVolumeWidgetOpen(true);
      return;
    }

    toggleMute();
  });

  volumeWidget?.addEventListener(
    "pointerleave",
    () => {
      if (navigator.maxTouchPoints > 0) return;
      setVolumeWidgetOpen(false);
    },
    { passive: true },
  );

  document.addEventListener(
    "pointerdown",
    (e) => {
      if (navigator.maxTouchPoints === 0) return;
      if (!volumeWidget) return;
      if (volumeWidget.contains(e.target)) return;
      setVolumeWidgetOpen(false);
    },
    { passive: true },
  );

  document.addEventListener(
    "visibilitychange",
    () => {
      if (document.hidden) return;
      if (document.body.classList.contains("entered")) {
        bgVideo.play().catch(() => undefined);
      }
    },
    { passive: true },
  );
}

init();
