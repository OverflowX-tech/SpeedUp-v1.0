/**
 * SpeedUp — Popup Script
 * Handles UI interactions and communicates with the content script.
 */

(() => {
  "use strict";

  const CIRCUMFERENCE = 2 * Math.PI * 52; // ring radius = 52
  const MAX_SPEED = 16;
  const STEP = 0.25;

  // ─── DOM refs ──────────────────────────────────────────────
  const speedValue = document.getElementById("speed-value");
  const ringProgress = document.getElementById("ring-progress");
  const slider = document.getElementById("speed-slider");
  const customInput = document.getElementById("custom-input");
  const btnApply = document.getElementById("btn-apply");
  const btnPlus = document.getElementById("btn-plus");
  const btnMinus = document.getElementById("btn-minus");
  const presetBtns = document.querySelectorAll(".preset-btn");

  // Inject SVG gradient into the ring (can't use CSS gradients on SVG stroke)
  const svgEl = document.querySelector(".ring-svg");
  const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
  defs.innerHTML = `
    <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#7C3AED"/>
      <stop offset="100%" stop-color="#EC4899"/>
    </linearGradient>
  `;
  svgEl.prepend(defs);

  // ─── Update UI ─────────────────────────────────────────────
  function updateUI(speed) {
    speed = Math.round(speed * 100) / 100;

    // Display value
    speedValue.textContent = speed + "×";
    speedValue.classList.remove("pop");
    // Trigger reflow for re-animation
    void speedValue.offsetWidth;
    speedValue.classList.add("pop");

    // Ring progress
    const fraction = Math.min(speed / MAX_SPEED, 1);
    const offset = CIRCUMFERENCE * (1 - fraction);
    ringProgress.style.strokeDasharray = CIRCUMFERENCE;
    ringProgress.style.strokeDashoffset = offset;

    // Slider
    slider.value = speed;

    // Preset active states
    presetBtns.forEach((btn) => {
      const btnSpeed = parseFloat(btn.dataset.speed);
      btn.classList.toggle("active", btnSpeed === speed);
    });
  }

  // ─── Send speed to content script ─────────────────────────
  function setSpeed(speed) {
    speed = Math.max(0.25, Math.min(MAX_SPEED, speed));
    speed = Math.round(speed * 100) / 100;

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        const tabId = tabs[0].id;
        
        // Save speed PER TAB to prevent cross-tab bleeding
        const storageKey = `speedup_rate_${tabId}`;
        chrome.storage.local.set({ [storageKey]: speed });

        chrome.tabs.sendMessage(
          tabId,
          { action: "set-speed", speed: speed },
          (response) => {
            if (chrome.runtime.lastError) {
              updateUI(speed);
              return;
            }
            if (response && response.speed !== undefined) {
              updateUI(response.speed);
            }
          }
        );
      }
    });

    updateUI(speed);
  }

  // ─── Events ────────────────────────────────────────────────
  // Preset buttons
  presetBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      setSpeed(parseFloat(btn.dataset.speed));
    });
  });

  // Slider
  slider.addEventListener("input", () => {
    setSpeed(parseFloat(slider.value));
  });

  // Step buttons
  btnPlus.addEventListener("click", () => {
    setSpeed(parseFloat(slider.value) + STEP);
  });

  btnMinus.addEventListener("click", () => {
    setSpeed(parseFloat(slider.value) - STEP);
  });

  // Custom input
  btnApply.addEventListener("click", () => {
    const val = parseFloat(customInput.value);
    if (!isNaN(val) && val >= 0.25 && val <= MAX_SPEED) {
      setSpeed(val);
      customInput.value = "";
    }
  });

  customInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      btnApply.click();
    }
  });

  // ─── Init: get current speed from content script ──────────
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(
        tabs[0].id,
        { action: "get-speed" },
        (response) => {
          if (chrome.runtime.lastError) {
            updateUI(1);
            return;
          }
          if (response && response.speed !== undefined) {
            updateUI(response.speed);
          } else {
            updateUI(1);
          }
        }
      );
    } else {
      updateUI(1);
    }
  });
})();
