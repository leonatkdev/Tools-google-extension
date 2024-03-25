// chrome.action.onClicked.addListener((tab) => {
//   console.log('tab', tab)
//     chrome.scripting.executeScript({
//       target: {tabId: tab.id},
//       function: capturePage
//     });
//   });
  
//   function capturePage() {
//     chrome.tabs.captureVisibleTab(null, {format: 'png'}, function(dataUrl) {
//       // Now, send this dataUrl to the content script
//       chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//         chrome.tabs.sendMessage(tabs[0].id, {action: "renderCanvas", dataUrl: dataUrl});
//       });
//     });
//   }
  

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "capturePage") {
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
        sendResponse({imageSrc: dataUrl});
      });
      return true; // Indicate that sendResponse will be called asynchronously
    }
  });