# ⚡ SpeedUp — Video Speed Controller

[![Version](https://img.shields.io/badge/version-1.0.0-blueviolet.svg?style=flat-square)]()
[![Manifest](https://img.shields.io/badge/manifest-v3-blue.svg?style=flat-square)]()
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)]()

**SpeedUp** is a sleek, premium, and robust Manifest V3 Chrome Extension that unlocks advanced playback speed control for any HTML5 video player. Easily break through standard player limitations (typically capped at 2x) to run videos at up to **16x** speed with flawless audio handling and interactive controls.

Perfect for power-learners watching lectures, tutorials, or webinars on YouTube, Coursera, Udemy, and beyond.

---

## ✨ Features

- **🚀 Extreme Speed range:** Scale from **0.25x** up to **16x** speed in standard increments of `0.25x` or input any specific custom speed (e.g. `3.57x`).
- **🎧 Intelligent Pitch Optimization:** 
  - *Voices sound natural:* Pitch preservation remains **enabled** for speeds $\le$ **4x** so speakers sound normal.
  - *Mute prevention:* Browsers automatically mute audio above 4x speed when pitch preservation is enabled. SpeedUp automatically **disables** pitch preservation at extreme speeds (> 4x) to keep the audio flowing.
- **✨ Visual HUD Overlay:** A gorgeous, sleek overlay displays the speed on screen (e.g. `3.25×`) for 1.2 seconds in the viewport whenever speed changes.
- **🔒 Aggressive Speed Enforcer:** Sophisticated polling mechanics (every 400ms) counteract sites like YouTube that aggressively reset the playback rate to their own internal states.
- **🌐 Deep DOM Piercing:** Automatically traverses custom elements and pierces **Shadow DOMs** to find and speed up custom video players.
- **🛡️ Isolated Per-Tab Storage:** Playback speed settings are tied uniquely to their respective browser tab, preventing cross-tab "speed bleeding".
- **🔄 Sync Across Frames (iframes):** Integrates seamless communication between nested pages and cross-origin iframes in a single tab via `chrome.storage.local`.
- **⌨️ Intuitive Hotkeys:** Complete keyboard-centric workflow that automatically suspends itself when typing in text fields or input boxes.

---

## 🎨 Premium User Interface

The extension features a stunning, premium dark-themed popup UI featuring:
*   **Glow Radial Speed Ring:** Visual circular progress arc displaying the speed relative to the 16x limit.
*   **Quick Presets:** Instant speed changes with active indicator badges for standard levels.
*   **Precise Fine Tuning:** Responsive range slider and step buttons (`-` / `+`).
*   **Custom Speed Input:** Numeric keyboard input for pixel-perfect adjustments.

---

## ⌨️ Keyboard Shortcuts

SpeedUp is designed to be operated completely from the keyboard for uninterrupted viewing:

| Shortcut | Description | Step Size |
| :--- | :--- | :--- |
| <kbd>Alt</kbd> + <kbd>.</kbd> | **Increase** Playback Speed | `+0.25x` |
| <kbd>Alt</kbd> + <kbd>,</kbd> | **Decrease** Playback Speed | `-0.25x` |
| <kbd>Alt</kbd> + <kbd>0</kbd> | **Reset** Speed to Normal | `1.0x` |

> 💡 *Note: Keyboard inputs are disabled inside `<input>`, `<textarea>`, `<select>`, and `contenteditable` elements to avoid interrupting text editing.*

---

## 🛠️ Installation & Setup (Developer / Manual Load)

Since SpeedUp is fully compliant with modern **Chrome Manifest V3 (MV3)**, loading it locally is fast and straightforward:

1.  **Download or Clone** the repository to your local machine.
2.  Open your Google Chrome browser and navigate to `chrome://extensions/`.
3.  In the top-right corner, toggle the **Developer mode** switch to **ON**.
4.  In the top-left corner, click **Load unpacked**.
5.  Select the `speedup` directory containing the `manifest.json` file.
6.  *Success!* The SpeedUp icon will appear in your extensions list. Pin it for instant access.

---

## 📂 Project Architecture

```bash
speedup/
├── manifest.json       # Extension metadata, MV3 permissions, commands, and script registrations
├── background.js       # Background service worker (resolves unique tab IDs for isolated states)
├── content.js          # Core injection engine (detects videos, applies playback rates, handles overlay & keys)
├── overlay.css         # Styling for the subtle viewport visual feedback HUD
├── popup.html          # HTML structure for the premium extension popup card
├── popup.css           # Premium styling, typography (Inter), glassmorphic design & dark mode
├── popup.js            # Interactive popup UI controls, syncs values with content script
└── icons/              # Scalable SVG icons for Chrome's interface
    ├── icon16.svg
    ├── icon48.svg
    └── icon128.svg
```

---

## ⚙️ Technical Details & Mechanics

### Shadow DOM Traversal
Many modern players encapsulate the `<video>` tag within a Shadow Root (e.g. customized video skins). SpeedUp searches the regular document and programmatically pierces shadow boundaries to ensure all players are targeted:
```javascript
function getAllVideos() {
  const videos = Array.from(document.querySelectorAll("video"));
  document.querySelectorAll("*").forEach(el => {
    if (el.shadowRoot) {
      videos.push(...el.shadowRoot.querySelectorAll("video"));
    }
  });
  return videos;
}
```

### Smart Pitch vs. Muting Logic
To avoid browser-enforced muting at extreme speeds, SpeedUp dynamically changes the `preservesPitch` attribute:
```javascript
try {
  // Browsers mute audio at speeds > 4x if preservesPitch is enabled.
  // Pitch preservation is left active for speeds <= 4x to keep voices sounding natural.
  v.preservesPitch = (speed <= 4);
} catch (e) {}
```

---

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.
