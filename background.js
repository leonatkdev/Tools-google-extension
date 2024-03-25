chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('messageBackground', message)
  if (message.action === "capturePage") {
      // Now capture the visible tab

      console.log('messageBackground2')
      chrome.tabs.captureVisibleTab(null, {format: 'png'}, (dataUrl) => {
          // And send it to the content script
          console.log('messageBackgrounddataUrl', dataUrl)
          chrome.tabs.sendMessage(message.tabId, {action: "capture", screenshotUrl: dataUrl});
      });
  }
});