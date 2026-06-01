// Background service worker — handles keyboard shortcut commands & tab sessions

chrome.commands.onCommand.addListener((command) => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: command }).catch(() => {});
    }
  });
});

// Provide content scripts with their tab ID
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "get-tab-id" && sender.tab) {
    sendResponse({ tabId: sender.tab.id });
  }
});

// Cleanup stored speed when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  chrome.storage.local.remove(`speedup_rate_${tabId}`);
});
