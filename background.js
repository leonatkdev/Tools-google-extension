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

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "colorPicked") {
    lastPickedColor = request.color;
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "getColor") {
    sendResponse({ color: lastPickedColor });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  sendResponse({ status: "Received by background script" });
});

let extensionData = {
  isActive: false,
  fontData: {
    font0: { size: "", lineHeight: "", weight: "" },
    font1: { size: "", lineHeight: "", weight: "" },
    font2: { size: "", lineHeight: "", weight: "" },
  },
  currentFontIndex: 0,
};

const index = 0;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleActivation") {
    extensionData.isActive = !extensionData.isActive;
    chrome.storage.local.set({ extensionData }, () => {
      sendResponse({ isActive: extensionData.isActive });
    });
    // Indicate that we want to send a response asynchronously
    return true; // Important for asynchronous sendResponse
  } else if (message.action === "updateSelection") {
    const fontId = `font${extensionData.currentFontIndex}`;

    // Update the specified font's data within fontData
    extensionData.fontData[fontId] = {
      id: fontId,
      size: message.data.fontSize,
      lineHeight: message.data.lineHeight,
      weight: message.data.fontWeight,
    };

    chrome.storage.local.set({ fontData: extensionData.fontData }, () => {
    });

    // Cycle through font indices (0 to 2, in this case)
    extensionData.currentFontIndex = (extensionData.currentFontIndex + 1) % 3;

    sendResponse({
      status: "Font data updated",
      currentFontIndex: extensionData.currentFontIndex,
    });
    return true;
  } else if (message.action === "fetchData") {
    // Respond with the current state
    chrome.storage.local.get("extensionData", (result) => {
      if (result.extensionData) {
        sendResponse(result.extensionData);
      }
    });
    return true; // Keep the messaging channel open for the response
  }
});
