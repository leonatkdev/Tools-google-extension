chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("messageBackground", message);
  if (message.action === "capturePage") {
    // Now capture the visible tab

    console.log("messageBackground2");
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      // And send it to the content script
      console.log("messageBackgrounddataUrl", dataUrl);
      chrome.tabs.sendMessage(message.tabId, {
        action: "capture",
        screenshotUrl: dataUrl,
      });
    });
  }
});

let lastPickedColor = "#000000"; // Default color

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "colorPicked") {
    console.log("lastPickedColor", request.color);
    lastPickedColor = request.color;
  }
});

// Listen for a message from the popup
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "getColor") {
    console.log("idk");
    sendResponse({ color: lastPickedColor });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Received from content script:", request);

  // You can also relay this message to your popup script if needed
  // For now, let's just send a simple response back
  sendResponse({ status: "Received by background script" });
});
