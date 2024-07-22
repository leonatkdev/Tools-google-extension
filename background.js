chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capturePage") {
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      chrome.tabs.sendMessage(message.tabId, {
        action: "capture",
        screenshotUrl: dataUrl,
      });
    });
  }
});

let lastPickedColor = "#000000";
let recentColors = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "colorPicked") {
    // console.log("colorPicked", message.color);
    lastPickedColor = message.color;
    // Add the new color to the start of the array and remove duplicates
    recentColors = [message.color, ...new Set(recentColors)];
    // Ensure we only keep up to 9 recent colors
    recentColors = recentColors.slice(0, 9);
    // Save the recent colors in chrome.storage.local
    chrome.storage.local.set({ recentColors: recentColors }, function () {
      if (chrome.runtime.lastError) {
        console.error(
          `Error saving recent colors: ${chrome.runtime.lastError.message}`
        );
      }
    });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getColor") {
    // console.log('getColor', recentColors);
    sendResponse({ color: recentColors[0] || "#000000" });
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "getRecentColors") {
    // console.log('getRecentColors', recentColors);
    chrome.storage.local.get("recentColors", function (data) {
      // console.log('data', data)
      sendResponse({ recentColors: data.recentColors || [] });
    });
    return true; // Needed to indicate that sendResponse will be called asynchronously
  }
});

////Typography
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "saveFontData") {
    chrome.storage.local.set({ fontData: message.fontData }, function () {
      console.log("Font data saved in background:", message.fontData);
    });
  }
});

