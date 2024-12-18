document.addEventListener("DOMContentLoaded", () => {
  initializeUI();
  setupColorConversionListeners();

  // Initialize selection and deletion for both Recent and Favorite colors
  // initializeColorSelection(
  //   ".selectRecentColor",
  //   ".colorTabRecent",
  //   "recentColors",
  //   ".deleteRecentContainer"
  // );
  initializeColorSelection(
    ".selectFavColor",
    ".colorTabFavorite",
    "favoriteColors",
    ".deleteContainer"
  );
});

function initializeUI() {
  setupStarClicks();
  loadFavoriteColors();
  setupFavResetButton();
  setRecentColors();
  setupColorCanvas();
  setupPickColorButton();
  setupCopyColorInputButton();
}

function updateRecentColorsUI(colors) {
  const recentColorElements = document.querySelectorAll(".colorTabRecent");
  colors.slice(0, 12).forEach((color, index) => {
    if (recentColorElements[index]) {
      recentColorElements[index].style.backgroundColor = color.startsWith("#")
        ? color
        : rgbaToHex(parseRgba(color));
    }
  });

  // Clear any remaining tabs if the number of recent colors is less than 12
  for (let i = colors.length; i < recentColorElements.length; i++) {
    recentColorElements[i].style.backgroundColor = "#f1f1f1"; // Default background color
  }
}

function setRecentColors() {
  chrome.runtime.sendMessage({ type: "getRecentColors" }, (response) => {
    if (response.recentColors && response.recentColors.length > 0) {
      updateRecentColorsUI(response.recentColors);
    }
  });
}

function enableFavoriteColorSelection() {
  const favoriteTabs = document.querySelectorAll(".colorTabFavorite");
  favoriteTabs.forEach((tab) => {
    tab.addEventListener("click", toggleColorSelection);
    tab.style.cursor = "pointer";
  });
}

function initializeColorSelection(
  selectClass,
  colorClass,
  storageKey,
  deleteContainerClass
) {
  const selectElement = document.querySelector(selectClass);
  selectElement.addEventListener("click", () => {
    toggleSelectionMode(selectElement, colorClass, deleteContainerClass);
  });

  document
    .querySelector(`${deleteContainerClass} div:first-child`)
    .addEventListener("click", () => {
      deleteSelectedColors(colorClass, storageKey);
    });
}

function toggleSelectionMode(selectElement, colorClass, deleteContainerClass) {
  if (selectElement.textContent.trim() === "Select") {
    selectElement.textContent = "Cancel";
    document.querySelector(deleteContainerClass).style.display = "flex";
    enableColorSelection(colorClass);
  } else {
    selectElement.textContent = "Select";
    document.querySelector(deleteContainerClass).style.display = "none";
    disableColorSelection(colorClass);
  }
}

function enableColorSelection(colorClass) {
  const colorTabs = document.querySelectorAll(colorClass);
  colorTabs.forEach((tab) => {
    tab.addEventListener("click", toggleColorSelection);
    tab.style.cursor = "pointer";
  });
}

function disableColorSelection(colorClass) {
  const colorTabs = document.querySelectorAll(colorClass);
  colorTabs.forEach((tab) => {
    tab.removeEventListener("click", toggleColorSelection);
    tab.classList.remove("selected-for-deletion");
    tab.style.cursor = "default";
  });
}

function toggleColorSelection(event) {
  event.currentTarget.classList.toggle("selected-for-deletion");
}

function deleteSelectedColors(colorClass, storageKey) {
  const selectedTabs = document.querySelectorAll(
    `${colorClass}.selected-for-deletion`
  );

  chrome.storage.local.get({ [storageKey]: [] }, function (result) {
    let colors = result[storageKey];

    // Iterate over each selected tab and remove its corresponding color from the array
    selectedTabs.forEach((tab) => {
      const color = window.getComputedStyle(tab).backgroundColor;
      const rgbaColor = parseRgba(color);
      const hexColor = rgbaToHex(
        rgbaColor.r,
        rgbaColor.g,
        rgbaColor.b,
        rgbaColor.a
      );

      // Remove the first occurrence of this color in the array
      const colorIndex = colors.indexOf(hexColor);
      if (colorIndex > -1) {
        colors.splice(colorIndex, 1);
      }
    });

    // Update storage with the new array
    chrome.storage.local.set({ [storageKey]: colors }, function () {
      // Refresh the UI using the existing update functions
      if (storageKey === "favoriteColors") {
        updateFavoriteColorUI(colors);
      } else if (storageKey === "recentColors") {
        updateRecentColorsUI(colors);
      }

      // Deselect all selected tabs after deletion
      selectedTabs.forEach((tab) => {
        tab.classList.remove("selected-for-deletion");
      });
    });
  });
}

function showModal(modalId, onConfirm) {
  const modal = document.getElementById(modalId);
  modal.style.display = "flex";

  if (onConfirm) {
    const confirmBtn = modal.querySelector("#confirmDeleteBtn");
    confirmBtn.addEventListener(
      "click",
      function () {
        onConfirm();
        closeModal(modal);
      },
      { once: true }
    );
  }

  const closeButtons = modal.querySelectorAll("button:not(#confirmDeleteBtn)");
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      closeModal(modal);
    });
  });
}

function closeModal(modal) {
  modal.style.display = "none";
}

function setupStarClicks() {
  document.getElementById("star").addEventListener("click", function () {
    const input = document.querySelector("#colorValue");
    const colorValue = input.value;

    chrome.storage.local.get({ favoriteColors: [] }, function (result) {
      let favorites = result.favoriteColors;
      const maxFavorites = 24;
      if (favorites.length < maxFavorites) {
        const rgba = parseRgba(colorValue);

        let hexColor;

        if (colorValue.startsWith("#")) {
          hexColor = colorValue;
        } else if (colorValue.startsWith("hsl")) {
          let rgbConverted = hslToRgba(parseHsl(colorValue));
          hexColor = rgbaToHex(
            rgbConverted.r,
            rgbConverted.g,
            rgbConverted.b,
            rgbConverted.a
          );
        } else {
          hexColor = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
        }
        // const hexColor = colorValue.startsWith("#")
        //   ? colorValue
        //   : colorValue.startsWith("hsl") ?
        //   :rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
        favorites.unshift(hexColor); // Add to the start of the array
        chrome.storage.local.set({ favoriteColors: favorites }, function () {
          updateFavoriteColorUI(favorites);
        });
      } else {
        showModal("favoriteFullModal");
      }
    });
  });
}

function updateFavoriteColorUI(favorites) {
  const colorTabs = document.querySelectorAll(".colorTabFavorite");
  favorites.slice(0, 24).forEach((color, index) => {
    if (colorTabs[index]) {
      colorTabs[index].style.backgroundColor = color;
    }
  });

  // Clear any remaining tabs if the number of favorites is less than 24
  for (let i = favorites.length; i < colorTabs.length; i++) {
    colorTabs[i].style.backgroundColor = "#f1f1f1"; // Default background color
  }
}

function loadFavoriteColors() {
  chrome.storage.local.get({ favoriteColors: [] }, function (result) {
    const favorites = result.favoriteColors;
    updateFavoriteColorUI(favorites);
  });
}

function setupFavResetButton() {
  document.getElementById("resetRecent").addEventListener("click", function () {
    showModal("confirmDeleteModal", function () {
      // Proceed with deletion after confirmation
      document.querySelectorAll(".colorTabRecent").forEach((box) => {
        box.style.backgroundColor = "#f1f1f1";
      });
  
      // Clear recent colors in storage and notify the background script
      chrome.storage.local.set({ recentColors: [] }, function () {
        chrome.runtime.sendMessage({ type: "recentColorsCleared" });
      });
    });
  });

  document.getElementById("resetFav").addEventListener("click", function () {
    showModal("confirmDeleteModal", function () {
      // Proceed with deletion after confirmation
      document.querySelectorAll(".colorTabFavorite").forEach((box) => {
        box.style.backgroundColor = "#f1f1f1";
      });
      chrome.storage.local.set({ favoriteColors: [] });
    });
  });
}


function setupColorConversionListeners() {
  const colorTypeSelect = document.querySelector(".colorTypeTabs");
  const colorInput = document.getElementById("colorValue");

  // Add a change event listener to the <select> element
  colorTypeSelect.addEventListener("change", function () {
    const selectedOption = colorTypeSelect.options[colorTypeSelect.selectedIndex];
    const newInputId = selectedOption.value; // Get the value of the selected option

    // Call the convertColorInput function with the current color input and the new format
    convertColorInput(colorInput.value, newInputId);
  });
}

function convertColorInput(value, type) {
  try {
    const colorInput = document.getElementById("colorValue");
    if (!colorInput) {
      console.error("colorValue input not found.");
      return;
    }

    switch (type) {
      case "hex":
        const { r, g, b, a } = value.startsWith("rgba")
          ? parseRgba(value)
          : hslToRgba(parseHsl(value));
        colorInput.value = rgbaToHex(r, g, b, a);
        break;
      case "rgba":
        const rgba = value.startsWith("#")
          ? hexToRgba(value)
          : hslToRgba(parseHsl(value));
        colorInput.value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${parseFloat(
          rgba.a
        ).toFixed(2)})`;
        break;
      case "hsl":
        const {
          r: hr,
          g: hg,
          b: hb,
        } = value.startsWith("#") ? hexToRgba(value) : parseRgba(value);
        const [h, s, l] = rgbToHsl(hr, hg, hb);
        colorInput.value = `hsl(${h}, ${s}%, ${l}%)`;
        break;
      default:
        console.error("Unsupported type for conversion.");
    }
  } catch (error) {
    console.error("Error during conversion: ", error);
  }
}

function parseRgba(rgbaString) {
  const match = rgbaString.match(/\d+\.?\d*/g);
  if (!match) {
    console.error("Invalid RGBA string:", rgbaString);
    return { r: 0, g: 0, b: 0, a: 1 }; // Default to black with full opacity if invalid
  }
  const rgbaArray = match.map(Number);
  const [r, g, b, a = 1] = rgbaArray; // Default alpha to 1 if not present
  return { r, g, b, a: parseFloat(a.toFixed(2)) }; // Ensure alpha is limited to two decimal places
}

function parseHsl(hslString) {
  const [h, s, l] = hslString.match(/\d+\.?\d*/g).map(Number);
  return { h, s, l };
}

function setupPickColorButton() {
  document.getElementById("pickColor").addEventListener("click", () => {
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
              chrome.runtime.sendMessage({
                action: "capturePage",
                tabId: tabs[0].id,
              });
              // Close the extension popup
              window.close();
            }
          }
        );
      } else {
        alert("This functionality is not available on chrome:// pages.");
      }
    });
    chrome.runtime.sendMessage({ action: "activatePicker" });
  });
}

function setupCopyColorInputButton() {
  const copyColorBtn = document.getElementById("copyColorInput");
  copyColorBtn.addEventListener("click", function () {
    const colorInput = document.getElementById("colorValue");
    colorInput.select();
    colorInput.setSelectionRange(0, 99999); // For mobile devices
    copyColorBtn.style.backgroundColor = "#007bff";
    copyColorBtn.querySelector("img").style.filter = "invert(1)";

    try {
      document.execCommand("copy");
      console.log("Color copied to clipboard:", colorInput.value);
    } catch (err) {
      console.error("Failed to copy color:", err);
    }
  });
}

function setupColorCanvas() {
  const colorCanvas = document.getElementById("colorCanvas");
  const ctx = colorCanvas.getContext("2d", { willReadFrequently: true });
  const hueRange = document.getElementById("hueRange");
  const alphaRange = document.getElementById("alphaRange");
  const selectedColorDiv = document.getElementById("selectedColor");
  const colorInput = document.getElementById("colorValue");

  let manualHexInput = false;

  const offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = colorCanvas.width;
  offscreenCanvas.height = colorCanvas.height;
  const offscreenCtx = offscreenCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  let currentHue = 0;
  let currentAlpha = 1;

  let ballPosition = { x: colorCanvas.width / 2, y: colorCanvas.height / 2 };
  let isDragging = false;

  function drawOffscreenColorSpectrum(hue, alpha) {
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const colorGradient = offscreenCtx.createLinearGradient(
      0,
      0,
      offscreenCanvas.width,
      0
    );
    colorGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    colorGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${alpha})`);
    offscreenCtx.fillStyle = colorGradient;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const alphaGradient = offscreenCtx.createLinearGradient(
      0,
      0,
      0,
      offscreenCanvas.height
    );
    alphaGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    alphaGradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    offscreenCtx.fillStyle = alphaGradient;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  }

  function drawColorSpectrum(hue, alpha) {
    ctx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);

    const colorGradient = ctx.createLinearGradient(0, 0, colorCanvas.width, 0);
    colorGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    colorGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${alpha})`);
    ctx.fillStyle = colorGradient;
    ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    const alphaGradient = ctx.createLinearGradient(0, 0, 0, colorCanvas.height);
    alphaGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    alphaGradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    ctx.fillStyle = alphaGradient;
    ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    drawBall();
  }

  function drawBall() {
    // Save the current state
    ctx.save();

    // Draw box shadow
    ctx.shadowColor = "black";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;

    // Draw border
    ctx.lineWidth = 4;
    ctx.strokeStyle = "white";

    // Draw transparent middle
    ctx.fillStyle = "rgba(255, 255, 255, 0)"; // Transparent fill

    ctx.beginPath();
    ctx.arc(ballPosition.x, ballPosition.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    // Draw plus sign
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    // Vertical line
    ctx.moveTo(ballPosition.x, ballPosition.y - 5);
    ctx.lineTo(ballPosition.x, ballPosition.y + 5);
    // Horizontal line
    ctx.moveTo(ballPosition.x - 5, ballPosition.y);
    ctx.lineTo(ballPosition.x + 5, ballPosition.y);
    ctx.stroke();

    // Restore the previous state
    ctx.restore();
  }

  function pickColor(hexColor, rgba, hsl) {
    drawOffscreenColorSpectrum(currentHue, currentAlpha);

    const imageData = offscreenCtx.getImageData(
      ballPosition.x,
      ballPosition.y,
      1,
      1
    ).data;
  
    // Use the provided props or calculate from the canvas if not provided
    const hex = hexColor
      ? hexColor
      : rgbaToHex(
        imageData[0],
        imageData[1],
        imageData[2],
        currentAlpha
      );
  
    const rgbaString = rgba
      ? `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${parseFloat(rgba.a).toFixed(2)})`
      : `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${currentAlpha})`;
  
    const hslString = hsl
      ? `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`
      : (() => {
        const [h, s, l] = rgbToHsl(
          imageData[0],
          imageData[1],
          imageData[2],
          currentAlpha
        );
          return `hsl(${h}, ${s}%, ${l}%)`;
        })();
  
    const activeTypeSpan = document.querySelector(".colorTypeTabs").value;
  
    if (!manualHexInput) {
      // Update input based on the active color type
      switch (activeTypeSpan) {
        case "hex":
          colorInput.value = hex;
          break;
        case "rgba":
          colorInput.value = rgbaString;
          break;
        case "hsl":
          colorInput.value = hslString;
          break;
      }
    }
  
    // Update the selected color preview
    selectedColorDiv.style.backgroundColor = rgbaString;
  }
  
  
  

  colorCanvas.addEventListener("mousedown", function (e) {
    manualHexInput = false;
    const rect = colorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ballPosition.x = x;
    ballPosition.y = y;

    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();

    if (Math.sqrt((x - ballPosition.x) ** 2 + (y - ballPosition.y) ** 2) < 10) {
      isDragging = true;
    }
  });

  window.addEventListener("mousemove", function (e) {
    if (isDragging) {
      const rect = colorCanvas.getBoundingClientRect();
      ballPosition.x = Math.max(
        0,
        Math.min(colorCanvas.width, e.clientX - rect.left)
      );
      ballPosition.y = Math.max(
        0,
        Math.min(colorCanvas.height, e.clientY - rect.top)
      );
      drawColorSpectrum(currentHue, currentAlpha);
      pickColor();
    }
  });

  window.addEventListener("mouseup", function () {
    isDragging = false;
  });

  hueRange.addEventListener("input", function () {
    manualHexInput = false;
    currentHue = this.value;
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();
  });

  alphaRange.addEventListener("input", function () {
    manualHexInput = false;
    currentAlpha = parseFloat(this.value);
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();
  });

  colorInput.addEventListener("input", (e) => {
    manualHexInput = true;

    inputValue = e.target.value;
    let hexColor;

    const rgba = parseRgba(inputValue);
    if (inputValue.startsWith("#")) {
      hexColor = inputValue;
    } else if (inputValue.startsWith("hsl")) {
      let rgbConverted = hslToRgba(parseHsl(inputValue));
      hexColor = rgbaToHex(
        rgbConverted.r,
        rgbConverted.g,
        rgbConverted.b,
        rgbConverted.a
      );
    } else {
      hexColor = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
    }

    setColorFromHex(hexColor);
  });

  function setColorFromHex(hexColor) {
    const { r, g, b, a } = hexToRgba(hexColor);
    const [h, s, l] = rgbToHsl(r, g, b);
  
    currentHue = h;
    currentAlpha = a;
    hueRange.value = h;
    alphaRange.value = a;
  
    drawOffscreenColorSpectrum(currentHue, currentAlpha);
  
    // If it's not an exact color, find the closest match using colorMatches for the canvas 
    // { This part of the code
      function colorMatches(r1, g1, b1, r2, g2, b2, tolerance = 2) {
        return (
          Math.abs(r1 - r2) <= tolerance &&
          Math.abs(g1 - g2) <= tolerance &&
          Math.abs(b1 - b2) <= tolerance
        );
      }
  
      let found = false;
      for (let y = 0; y < offscreenCanvas.height; y++) {
        for (let x = 0; x < offscreenCanvas.width; x++) {
          const imageData = offscreenCtx.getImageData(x, y, 1, 1).data;
  
          if (colorMatches(imageData[0], imageData[1], imageData[2], r, g, b)) {
            ballPosition.x = x;
            ballPosition.y = y;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      // }
  
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor(hexColor, { r, g, b, a }, [h, s, l]); // Ensures consistent rendering
  }
  
  
  
  chrome.runtime.sendMessage({ type: "getColor" }, (response) => {
    if (response.color) {
      const exactColor = response.color; // Exact color from getColor
      colorInput.value = exactColor; // Update the input directly
      setColorFromHex(exactColor, true); // Exact color for canvas rendering
    } else {
      const defaultColor = "#000000";
      colorInput.value = defaultColor;
      setColorFromHex(defaultColor, true);
    }
  });
  
  

  setColorFromHex("#000000");

  //recent and favorite color clicks
  document
    .querySelectorAll(".colorTabRecent, .colorTabFavorite")
    .forEach((tab) => {
      tab.addEventListener("click", function () {
        const color = window.getComputedStyle(tab).backgroundColor;
        const rgbaColor = parseRgba(color);
        const hexColor = rgbaToHex(
          rgbaColor.r,
          rgbaColor.g,
          rgbaColor.b,
          rgbaColor.a
        );
        setColorFromHex(hexColor, true);
      });
    });
}

// Utility functions
function hexToRgba(hex) {
  let r = 0,
    g = 0,
    b = 0,
    a = 1;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else if (hex.length === 9) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
    a = parseInt(hex.slice(7, 9), 16) / 255;
  }
  return { r, g, b, a: parseFloat(a.toFixed(2)) }; // Ensure alpha is limited to two decimal places
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l;
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    h /= 360;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}

function hslToRgba({ h, s, l, a = 1 }) {
  s /= 100;
  l /= 100;
  const [r, g, b] = hslToRgb(h, s, l);
  return { r, g, b, a };
}

function rgbaToHex(r, g, b, a = 1) {
  return (
    "#" +
    [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("") +
    (a < 1
      ? Math.round(a * 255)
          .toString(16)
          .padStart(2, "0")
      : "")
  );
}

// function rgbToHsl(r, g, b, a = 1) {
//   r /= 255;
//   g /= 255;
//   b /= 255;
//   let max = Math.max(r, g, b),
//     min = Math.min(r, g, b);
//   let h = 0,
//     s,
//     l = (max + min) / 2;

//   if (max === min) {
//     h = s = 0; // achromatic
//   } else {
//     let d = max - min;
//     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
//     switch (max) {
//       case r:
//         h = (g - b) / d + (g < b ? 6 : 0);
//         break;
//       case g:
//         h = (b - r) / d + 2;
//         break;
//       case b:
//         h = (r - g) / d + 4;
//         break;
//     }
//     h /= 6;
//     h = h < 0 ? h + 1 : h; // Ensure h is not negative
//   }

//   return [
//     (h * 360).toFixed(1), // Hue with one decimal place
//     (s * 100).toFixed(1), // Saturation with one decimal place
//     (l * 100).toFixed(1), // Lightness with one decimal place
//     a.toFixed(2), // Alpha with two decimal places
//   ];
// }

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;

  var max = Math.max(r, g, b);
  var min = Math.min(r, g, b);
  var h = 0,
    s = 0,
    l = (max + min) / 2;
  var c = max - min;

  if (c !== 0) {
    s = l > 0.5 ? c / (2 - max - min) : c / (max + min);

    switch (max) {
      case r:
        h = (g - b) / c + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / c + 2;
        break;
      case b:
        h = (r - g) / c + 4;
        break;
    }
    h /= 6;
  }

  return [
    (h * 360).toFixed(2), // Hue with two decimal places
    (s * 100).toFixed(2), // Saturation with two decimal places
    (l * 100).toFixed(2), // Lightness with two decimal places
  ];
}
