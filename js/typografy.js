document.addEventListener("DOMContentLoaded", function () {
    const activateButton = document.getElementById("activateButton");
  
    activateButton.addEventListener("click", function () {
      // Get the values from the inputs
      const htmlTag = document.getElementById("htmlTag").textContent;
      const fontFamily = document.getElementById("fontFamily").textContent;
      const fontSize = document.getElementById("input-1-size").value;
      const fontWeight = document.getElementById("input-1-weight").value;
      const lineHeight = document.getElementById("input-1-line").value;
      const color = document.getElementById("input-1-color").value;
  
      // Save the values to Chrome storage
      const fontData = {
        htmlTag,
        fontFamily,
        fontSize,
        fontWeight,
        lineHeight,
        color
      };
  
      chrome.storage.local.set({ fontData: fontData }, function () {
        console.log("Font data saved:", fontData);
      });
  
      // Change the button background
      activateButton.style.background = 'red';
  
      // Activate typography mode on the active tab
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
                chrome.tabs.sendMessage(tabs[0].id, { action: "activateTypography", fontData: fontData });
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
    document.getElementById("htmlTag").textContent = fontData.elementSelectedTag || "-";
    document.getElementById("fontFamily").textContent = fontData.fontFamily || "-";
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
      document.getElementById("htmlTag").textContent = "-";
      document.getElementById("fontFamily").textContent = "-";
      chrome.storage.local.set({ fontData: {} });
    });
  }
  