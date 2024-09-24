// background.js
// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "capturePage") {
    // Send a cleanup request to the content script
    chrome.tabs.sendMessage(message.tabId, { action: "cleanup" }, (response) => {
      if (chrome.runtime.lastError) {
        console.error('Error sending cleanup message:', chrome.runtime.lastError.message);
        // Optionally notify the user or handle the error
        return;
      }

      if (response && response.status === "cleanup complete") {
        // Wait a short delay before capturing the screenshot
        setTimeout(() => {
          // Capture the screenshot
          chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
            if (chrome.runtime.lastError) {
              console.error(`Error capturing page: ${chrome.runtime.lastError.message}`);
              return;
            }

            // Send the capture message to the content script
            chrome.tabs.sendMessage(message.tabId, {
              action: "capture",
              screenshotUrl: dataUrl,
            }, (response) => {
              if (chrome.runtime.lastError) {
                console.error('Error sending capture message:', chrome.runtime.lastError.message);
              }
              // Optionally handle the response from the content script
            });
          });
        }, 100); // Adjust delay if necessary
      } else {
        console.error('Cleanup not completed properly or no response received.');
      }
    });
    // Return true to indicate sendResponse will be called asynchronously
    return true;
  }
});



let lastPickedColor = "#000000";
let recentColors = [];

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "colorPicked") {
    lastPickedColor = message.color;

    chrome.action.setBadgeBackgroundColor({ color: message.color });
    chrome.action.setBadgeText({ text: " " });

    // Remove duplicates and ensure new color is first
    recentColors = [
      message.color,
      ...recentColors.filter((color) => color !== message.color),
    ];

    // Ensure we only keep up to 20 recent colors
    recentColors = recentColors.slice(0, 22);

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
    chrome.storage.local.set({ fontData: message.fontData }, function () {});
  }
});

//Lorem right click

const staticWords = {
  5: "Lorem ipsum dolor sit amet",
  10: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed",
  15: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod",
  20: "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut",
};

const staticWordsWithLink = {
  5: `Lorem ipsum dolor <a href="https://www.google.com/" target="_blank">LINK</a> sit amet`,
  10: `Lorem ipsum dolor <a href="https://www.google.com/" target="_blank">LINK</a> sit amet consectetur adipiscing elit sed`,
  15: `Lorem ipsum dolor <a href="https://www.google.com/" target="_blank">LINK</a> sit amet consectetur adipiscing elit sed do eiusmod`,
  20: `Lorem ipsum dolor <a href="https://www.google.com/" target="_blank">LINK</a> sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut`,
};

const staticParagraphs = {
  1: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
  2: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
  3: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.\n\nUt enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.\n\nDuis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
};

chrome.runtime.onInstalled.addListener(() => {
  // Create the main "DesignSuite" menu
  chrome.contextMenus.create({
    id: "toolkitPro",
    title: "DesignSuite - Generate Lorem Ipsum",
    contexts: ["editable"],
  });

  // Add options for words under "DesignSuite"
  chrome.contextMenus.create({
    id: "5Words",
    parentId: "toolkitPro",
    title: "Generate 5 Words",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "10Words",
    parentId: "toolkitPro",
    title: "Generate 10 Words",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "15Words",
    parentId: "toolkitPro",
    title: "Generate 15 Words",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "20Words",
    parentId: "toolkitPro",
    title: "Generate 20 Words",
    contexts: ["editable"],
  });

  // Add options for words with Link under "DesignSuite"
  chrome.contextMenus.create({
    id: "5WordsLink",
    parentId: "toolkitPro",
    title: "Generate 5 Words with Link",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "10WordsLink",
    parentId: "toolkitPro",
    title: "Generate 10 Words with Link",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "15WordsLink",
    parentId: "toolkitPro",
    title: "Generate 15 Words with Link",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "20WordLinks",
    parentId: "toolkitPro",
    title: "Generate 20 Words with Link",
    contexts: ["editable"],
  });

  // Add options for paragraphs under "DesignSuite"
  chrome.contextMenus.create({
    id: "1Paragraph",
    parentId: "toolkitPro",
    title: "Generate 1 Paragraph",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "2Paragraphs",
    parentId: "toolkitPro",
    title: "Generate 2 Paragraphs",
    contexts: ["editable"],
  });

  chrome.contextMenus.create({
    id: "3Paragraphs",
    parentId: "toolkitPro",
    title: "Generate 3 Paragraphs",
    contexts: ["editable"],
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  let loremText = "";

  switch (info.menuItemId) {
    case "5Words":
      loremText = staticWords[5];
      break;
    case "10Words":
      loremText = staticWords[10];
      break;
    case "15Words":
      loremText = staticWords[15];
      break;
    case "20Words":
      loremText = staticWords[20];
      break;
    case "5WordsLink":
      loremText = staticWordsWithLink[5];
      break;
    case "10WordsLink":
      loremText = staticWordsWithLink[10];
      break;
    case "15WordsLink":
      loremText = staticWordsWithLink[15];
      break;
    case "20WordLinks":
      loremText = staticWordsWithLink[20];
      break;
    case "1Paragraph":
      loremText = staticParagraphs[1];
      break;
    case "2Paragraphs":
      loremText = staticParagraphs[2];
      break;
    case "3Paragraphs":
      loremText = staticParagraphs[3];
      break;
  }

  if (loremText) {
    chrome.scripting.executeScript({
      target: { tabId: tab.id, frameIds: [info.frameId] },
      function: insertLoremIpsum,
      args: [loremText],
    });
  }
});

// Function to insert Lorem Ipsum into the active element
function insertLoremIpsum(text) {
  console.log('document.activeElement', document.activeElement.tagName)
  if (
    document.activeElement.tagName === "TEXTAREA" ||
    document.activeElement.tagName === "INPUT"
  ) {
    document.activeElement.value += text;
  }
}
