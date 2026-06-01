/**
 * SpeedUp — Content Script
 * Injects into every page and controls all <video> elements' playback rate.
 * Shows an on-screen overlay whenever the speed changes.
 */

(() => {
  "use strict";

  const STEP = 0.25;
  const MIN_SPEED = 0.25;
  const MAX_SPEED = 16;
  const OVERLAY_DURATION = 1200; // ms

  let currentSpeed = 1;
  let overlayTimeout = null;
  let myTabId = null;

  // ─── Setup Per-Tab Storage & Sync ───────────────────────────
  try {
    chrome.runtime.sendMessage({ action: "get-tab-id" }, (response) => {
      if (response && response.tabId) {
        myTabId = response.tabId;
        const storageKey = `speedup_rate_${myTabId}`;
        
        // Restore speed on page load for this tab
        chrome.storage.local.get(storageKey, (data) => {
          if (data[storageKey] && data[storageKey] !== 1) {
            applySpeed(data[storageKey]);
          }
        });

        // Listen for storage changes ONLY for this tab (syncs iframes)
        chrome.storage.onChanged.addListener((changes, area) => {
          if (area === "local" && changes[storageKey] && changes[storageKey].newValue !== undefined) {
            const newSpeed = changes[storageKey].newValue;
            if (newSpeed !== currentSpeed) {
              applySpeed(newSpeed);
            }
          }
        });
      }
    });
  } catch (_) {}

  // ─── Overlay ───────────────────────────────────────────────
  let overlay = null;

  function ensureOverlay() {
    if (overlay && document.body.contains(overlay)) return overlay;
    overlay = document.createElement("div");
    overlay.id = "speedup-overlay";
    overlay.setAttribute("aria-hidden", "true");
    document.body.appendChild(overlay);
    return overlay;
  }

  function showOverlay(speed) {
    const el = ensureOverlay();
    el.textContent = speed + "×";
    el.classList.remove("speedup-overlay-hide");
    el.classList.add("speedup-overlay-show");

    clearTimeout(overlayTimeout);
    overlayTimeout = setTimeout(() => {
      el.classList.remove("speedup-overlay-show");
      el.classList.add("speedup-overlay-hide");
    }, OVERLAY_DURATION);
  }

  // ─── Speed control ────────────────────────────────────────
  function getAllVideos() {
    const videos = Array.from(document.querySelectorAll("video"));
    // Pierce shadow DOMs for custom video players
    document.querySelectorAll("*").forEach(el => {
      if (el.shadowRoot) {
        videos.push(...el.shadowRoot.querySelectorAll("video"));
      }
    });
    return videos;
  }

  function applySpeed(speed) {
    speed = Math.round(speed * 100) / 100; // avoid float weirdness
    speed = Math.max(MIN_SPEED, Math.min(MAX_SPEED, speed));
    currentSpeed = speed;

    getAllVideos().forEach((v) => {
      v.playbackRate = speed;
      v.defaultPlaybackRate = speed;
      
      // Browsers mute audio at speeds > 4x if pitch preservation is enabled.
      // We only disable pitch preservation for extreme speeds so it doesn't mute.
      // For 4x and below, we ensure pitch preservation is ON so voices sound normal!
      try { 
        v.preservesPitch = (speed <= 4); 
      } catch (e) {}
    });

    showOverlay(speed);

    // Persist per-tab so popup and other frames in this tab can read it
    try {
      if (myTabId !== null) {
        chrome.storage.local.set({ [`speedup_rate_${myTabId}`]: speed });
      }
    } catch (_) {}
  }

  function increaseSpeed() {
    applySpeed(currentSpeed + STEP);
  }

  function decreaseSpeed() {
    applySpeed(currentSpeed - STEP);
  }

  function resetSpeed() {
    applySpeed(1);
  }

  // ─── Keyboard shortcuts (in-page) ─────────────────────────
  document.addEventListener("keydown", (e) => {
    // Only fire when no text input is focused
    const tag = (e.target.tagName || "").toLowerCase();
    if (["input", "textarea", "select"].includes(tag) || e.target.isContentEditable) return;

    if (e.altKey && e.key === ".") {
      e.preventDefault();
      increaseSpeed();
    } else if (e.altKey && e.key === ",") {
      e.preventDefault();
      decreaseSpeed();
    } else if (e.altKey && e.key === "0") {
      e.preventDefault();
      resetSpeed();
    }
  });

  // ─── Messages from popup / background ─────────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === "set-speed" && typeof msg.speed === "number") {
      applySpeed(msg.speed);
      sendResponse({ speed: currentSpeed });
    } else if (msg.action === "get-speed") {
      sendResponse({ speed: currentSpeed });
    } else if (msg.action === "speed-up") {
      increaseSpeed();
      sendResponse({ speed: currentSpeed });
    } else if (msg.action === "speed-down") {
      decreaseSpeed();
      sendResponse({ speed: currentSpeed });
    } else if (msg.action === "speed-reset") {
      resetSpeed();
      sendResponse({ speed: currentSpeed });
    }
  });

  // ─── MutationObserver: auto-apply speed to dynamically added videos ──
  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeName === "VIDEO") {
          node.playbackRate = currentSpeed;
        }
        if (node.querySelectorAll) {
          node.querySelectorAll("video").forEach((v) => {
            v.playbackRate = currentSpeed;
          });
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });

  // ─── Speed Enforcer Interval ──────────────────────────────
  // Sites like YouTube aggressively reset playback rate using their own internal state.
  // Since content scripts run in an isolated world, overriding the prototype doesn't work.
  // Polling every 400ms ensures the speed stays exactly where you set it.
  setInterval(() => {
    if (currentSpeed !== 1) {
      const videos = getAllVideos();
      for (const v of videos) {
        // Enforce the speed if the site tried to change it
        if (v.playbackRate !== currentSpeed) {
          v.playbackRate = currentSpeed;
        }
      }
    }
  }, 400);

  // (Per-tab restore handles initialization on load)
})();
