document.addEventListener("DOMContentLoaded", function () {
  const activateButton = document.getElementById("activateButton");
  activateButton.addEventListener("click", function () {
    activateButton.style.background='red';
      chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          const tab = tabs[0];
          if (!tab.url.startsWith("chrome://")) {
              chrome.scripting.executeScript(
                  {
                      target: { tabId: tab.id },
                      files: ["contentScript.js"],
                  },
                  () => {
                      if (chrome.runtime.lastError) {
                          console.error(`Error injecting script: ${chrome.runtime.lastError.message}`);
                      } else {
                          chrome.tabs.sendMessage(tabs[0].id, { action: "activateTypography" });
                      }
                  }
              );
          } else {
              const errorMessage = document.getElementById("errorMessage");
              errorMessage.style.display = "block";
              errorMessage.textContent = "This functionality is not available on chrome:// pages.";
          }
      });
  });
});


"use strict";

document.addEventListener("DOMContentLoaded", init);

function init() {
    loadFontDataFromStorage();
    setupResetButton();
}

function loadFontDataFromStorage() {
    chrome.storage.local.get(["fontData"], function (result) {
        if (result.fontData) {
            updateFontInputs(result.fontData);
        }
    });
}

function updateFontInputs(fontData) {
    document.getElementById("input-1-family").value = fontData.fontFamily || "";
    document.getElementById("input-1-size").value = fontData.fontSize || "";
    document.getElementById("input-1-weight").value = fontData.fontWeight || "";
    document.getElementById("input-1-line").value = fontData.lineHeight || "";
    document.getElementById("input-1-color").value = fontData.color || "";
}

function setupResetButton() {
    document.getElementById("reset").addEventListener("click", function () {
        document.querySelectorAll(".inputContainer").forEach((input) => {
            input.value = "";
        });
        chrome.storage.local.set({ fontData: {} });
    });
}
