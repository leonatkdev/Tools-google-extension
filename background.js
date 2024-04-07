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

// let extensionData = {
//   isActive: false,
//   fontSize: '',
//   lineHeight: '',
//   fontWeight: ''
// };

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   if (message.type === 'updateFontProperties') {
//     extensionData = { ...extensionData, ...message.data };
//     chrome.storage.local.set({extensionData}, () => {
//       console.log('Font properties updated and saved.');
//     });
//   } else if (message.type === 'toggleActivation') {
//     extensionData.isActive = !extensionData.isActive;
//     chrome.storage.local.set({extensionData}, () => {
//       console.log('Activation state updated and saved.');
//     });
//   }
  
//   else if (message.type === 'fetchData') {
//     chrome.storage.local.get('extensionData', (result) => {
//       if (result.extensionData) {
//         sendResponse(result.extensionData);
//       }
//     });
//     return true; 
//   }
// });

// chrome.runtime.onStartup.addListener(() => {
//   chrome.storage.local.get('extensionData', (result) => {
//     if (result.extensionData) {
//       extensionData = result.extensionData;
//     }
//   });
// });

let extensionData = {
  isActive: false,
  fontData: {}
};

// Listen for when the extension is installed or updated
// chrome.runtime.onInstalled.addListener(() => {
//   console.log('Extension installed/updated');
//   // Perform initialization if necessary
//   chrome.storage.local.set({extensionData}, () => console.log('Initial data set'));
// });

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "toggleActivation") {
      extensionData.isActive = !extensionData.isActive;
      chrome.storage.local.set({extensionData}, () => {
          console.log('Activation state updated:', extensionData.isActive);
          sendResponse({isActive: extensionData.isActive});
      });
      // Indicate that we want to send a response asynchronously
      return true; // Important for asynchronous sendResponse
  } else if (message.action === "updateSelection") {
    console.log('extensionData', extensionData)
      extensionData.fontData = { ...extensionData.fontData, ...message.data };
      chrome.storage.local.set({"fontData": extensionData.fontData}, () => {
          // sendResponse({status: "Font data updated"});
      });
      return true;
  } else if (message.action === "fetchData") {
      // Respond with the current state
      chrome.storage.local.get('extensionData', (result) => {
          if (result.extensionData) {
              sendResponse(result.extensionData);
          }
      });
      return true; // Keep the messaging channel open for the response
  }
});

// Optional: Respond to changes in active tab or other events
// chrome.tabs.onActivated.addListener(activeInfo => {
//   console.log('Tab activated:', activeInfo.tabId);
//   // You can perform actions here based on the new active tab
// });


