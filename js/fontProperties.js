"use strict";

// Initialize event listeners when the DOM content is fully loaded
document.addEventListener("DOMContentLoaded", init);

function init() {
  // setupToggleButton();
  setupActivateButton();
  loadFontDataFromStorage();
  setupInputChangeListener();
  setupResetButton();
}

document.addEventListener("DOMContentLoaded", function () {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const tab = tabs[0];

    if (tab.url.startsWith("chrome://")) {
      document.getElementById("activateButton").disabled = true;
      document
        .querySelectorAll("#errorMessage")
        .forEach(
          (err) => (
            (err.style.display = "flex"),
            (err.textContent =
              "This functionality is not available on chrome:// pages.")
          )
        );
    }
  });
});

// function setupToggleButton() {
//   const toggleButton = document.getElementById("toggleButton");
//   toggleButton?.addEventListener("click", function () {
//     const versionsContainer = document.getElementById("versionsContainer");
//     versionsContainer.style.display = (versionsContainer.style.display === "none" || versionsContainer.style.display === "") ? "flex" : "none";
//   });
// }

function setupActivateButton() {
  const activateButton = document.getElementById("activateButton");
  activateButton.addEventListener("click", function () {
    const isActive = activateButton.textContent.includes("Activate");
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
              console.error(
                `Error injecting script: ${chrome.runtime.lastError.message}`
              );
            } else {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: isActive ? "enable" : "disable",
              });
            }
          }
        );
      } else {
        console.log("Cannot inject content script into chrome:// URL.");
      }
    });
    activateButton.textContent = isActive
      ? "Disable on the tab"
      : "Activate on the tab";
    activateButton.style.backgroundColor = isActive ? "red" : "#007bff";
  });
}

function loadFontDataFromStorage() {
  chrome.storage.local.get(["fontData"], function (result) {
    if (result.fontData) {
      updateFontInputs(result.fontData);
    }
  });
}

function updateFontInputs(fontData) {
  Object.keys(fontData).forEach((fontId) => {
    const fontConfig = fontData[fontId];
    const id = Number(fontConfig?.id?.split("font")[1]) + 1; // Assuming 'font1', 'font2', etc.

    console.log("fontData", fontData);

    updateInputValue(`input-${id}-size`, fontConfig.size);
    updateInputValue(`input-${id}-line`, fontConfig.lineHeight);
    updateInputValue(`input-${id}-weight`, fontConfig.weight);
  });
}

function updateInputValue(inputId, value) {
  const input = document.getElementById(inputId);
  if (input) {
    input.value = value;
  }
}

function setupInputChangeListener() {
  document.querySelectorAll(".inputContainer").forEach((input) => {
    input.addEventListener("input", saveInputDataOnChange);
  });
}

function saveInputDataOnChange() {
  const fontData = {};
  document.querySelectorAll(".inputContainer").forEach((input) => {
    fontData[input.id] = input.value;
  });
  chrome.storage.local.remove([fontData], (result) => {});
}

function setupResetButton() {
  document.getElementById("reset").addEventListener("click", function () {
    document.querySelectorAll(".inputContainer").forEach((input) => {
      input.value = "";
    });
    chrome.storage.local.set({ fontData: {} });
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "updateSelection") {
    updateFontInputs(request.data);
    sendResponse({ status: "Popup inputs updated" });
  }
});
