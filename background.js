chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("messageBackground", message);
  if (message.action === "capturePage") {

    console.log("messageBackground2");
    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      console.log("messageBackgrounddataUrl", dataUrl);
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
    console.log("lastPickedColor", request.color);
    lastPickedColor = request.color;
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.type === "getColor") {
    console.log("idk");
    sendResponse({ color: lastPickedColor });
  }
});

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  console.log("Received from content script:", request);

  sendResponse({ status: "Received by background script" });
});

let extensionData = {
  isActive: false,
  fontSize: '',
  lineHeight: '',
  fontWeight: ''
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'updateFontProperties') {
    extensionData = { ...extensionData, ...message.data };
    chrome.storage.local.set({extensionData}, () => {
      console.log('Font properties updated and saved.');
    });
  } else if (message.type === 'toggleActivation') {
    extensionData.isActive = !extensionData.isActive;
    chrome.storage.local.set({extensionData}, () => {
      console.log('Activation state updated and saved.');
    });
  }
  
  else if (message.type === 'fetchData') {
    chrome.storage.local.get('extensionData', (result) => {
      if (result.extensionData) {
        sendResponse(result.extensionData);
      }
    });
    return true; 
  }
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.get('extensionData', (result) => {
    if (result.extensionData) {
      extensionData = result.extensionData;
    }
  });
});
