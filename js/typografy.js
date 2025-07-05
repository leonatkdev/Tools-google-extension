("use strict");

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
      color,
    };

    chrome.storage.local.set({ fontData: fontData }, function () {
      console.log("Font data saved:", fontData);
    });

    // Change the button background
    activateButton.style.background = "red";

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
              console.error(
                `Error injecting script: ${chrome.runtime.lastError.message}`
              );
            } else {
              chrome.tabs.sendMessage(tabs[0].id, {
                action: "activateTypography",
                fontData: fontData,
              });
              // Close the extension popup
              window.close();
            }
          }
        );
      } else {
        const errorMessage = document.getElementById("errorMessage");
        errorMessage.style.display = "block";
        errorMessage.textContent =
          "This functionality is not available on chrome:// pages.";
      }
    });
  });
});

document.addEventListener("DOMContentLoaded", init);

function init() {
  loadFontDataFromStorage();
  setupResetButton();
  setupCopyButton();
}

const NodeHTMLElement = document.getElementById("htmlTag");
const FontFamilyInput = document.getElementById("fontFamily");
const SizeInput = document.getElementById("input-1-size");
const FontWeightInput = document.getElementById("input-1-weight");
const LineHeightinput = document.getElementById("input-1-line");
const ColorInput = document.getElementById("input-1-color");

const CopyBTN = document.getElementById("CopyCSSInput");

function loadFontDataFromStorage() {
  chrome.storage.local.get(["fontData"], function (result) {
    if (result.fontData) {
      updateFontInputs(result.fontData);
    }
  });
}

function updateFontInputs(fontData) {
  NodeHTMLElement.textContent = fontData.elementSelectedTag || "-";
  FontFamilyInput.textContent = fontData.fontFamily || "-";
  SizeInput.value = fontData.fontSize || "";
  FontWeightInput.value = fontData.fontWeight || "";
  LineHeightinput.value = fontData.lineHeight || "";
  ColorInput.value = fontData.color || "";
  document.getElementById("colorPreview").style.background =
    fontData.color || "";
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

function copyAllToClipboard(fontFamily, fontSize, fontWeight, lineHeight, color) {
  const text = `font-family: ${fontFamily};
font-size: ${fontSize};
font-weight: ${fontWeight};
line-height: ${lineHeight};
color: ${color};`;

  navigator.clipboard.writeText(text).then(() => {
    // Optionally, provide user feedback here
    console.log("CSS copied to clipboard!");
    CopyBTN.style.background = "#6467f2"
      CopyBTN.style.color = "#fff"
        CopyBTN.style.border = "1px solid #fff "
  }).catch(err => {
    alert("Couldn't copy something went wrong")
  });
}

function setupCopyButton() {
  CopyBTN.addEventListener("click", () => {
    copyAllToClipboard(
      FontFamilyInput.textContent,
      SizeInput.value,
      FontWeightInput.value,
      LineHeightinput.value,
      ColorInput.value
    );
  });
}
