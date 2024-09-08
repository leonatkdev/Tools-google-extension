chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capturePage") {
    // Step 1: Send a cleanup request to the content script
    chrome.tabs.sendMessage(message.tabId, { action: "cleanup" }, () => {
      // Step 2: After cleanup, capture the screenshot
      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        if (chrome.runtime.lastError) {
          console.error(`Error capturing page: ${chrome.runtime.lastError.message}`);
          return;
        }

        chrome.tabs.sendMessage(message.tabId, {
          action: "capture",
          screenshotUrl: dataUrl,
        });
      });
    });
  }
});


let lastPickedColor = "#000000";  
let recentColors = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "colorPicked") {
    lastPickedColor = message.color;

    // Remove duplicates and ensure new color is first
    recentColors = [message.color, ...recentColors.filter(color => color !== message.color)];

    // Ensure we only keep up to 20 recent colors
    recentColors = recentColors.slice(0, 20);

    // Save the recent colors in chrome.storage.local
    chrome.storage.local.set({ recentColors: recentColors }, function () {
      if (chrome.runtime.lastError) {
        console.error(`Error saving recent colors: ${chrome.runtime.lastError.message}`);
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getColor") {
    sendResponse({ color: recentColors[0] || "#000000" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getRecentColors") {
    // Fetch recent colors from storage
    chrome.storage.local.get("recentColors", function (data) {
      sendResponse({ recentColors: data.recentColors || [] });
    });
    return true; // Needed to indicate that sendResponse will be called asynchronously
  }
});

////Typography
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveFontData") {
    chrome.storage.local.set({ fontData: message.fontData }, function () {
    });
  }
});

