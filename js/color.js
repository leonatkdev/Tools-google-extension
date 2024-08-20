document.addEventListener("DOMContentLoaded", () => {
  initializeUI();
  setupColorConversionListeners();


    // Initialize selection and deletion for both Recent and Favorite colors
    initializeColorSelection('.selectRecentColor', '.colorTabRecent', 'recentColors', '.deleteRecentContainer');
    initializeColorSelection('.selectFavColor', '.colorTabFavorite', 'favoriteColors', '.deleteContainer');

});

function initializeUI() {
  setupStarClicks();
  loadFavoriteColors();
  setupFavResetButton();
  setupRecentColorResetButton();
  setRecentColors();
  setupColorCanvas();
  setupPickColorButton();
  setupCopyColorInputButton();
}

function setRecentColors() {
  function updateRecentColorsUI(colors) {
    const recentColorElements = document.querySelectorAll(".colorTabRecent");
    colors.slice(0, 20).reverse().forEach((color, index) => {
      if (recentColorElements[index]) {
        recentColorElements[index].style.backgroundColor = color.startsWith('#') ? color : rgbaToHex(parseRgba(color));
      }
    });
  }

  chrome.runtime.sendMessage({ type: "getRecentColors" }, (response) => {
    if (response.recentColors && response.recentColors.length > 0) {
      updateRecentColorsUI(response.recentColors);
    }
  });
}

function enableFavoriteColorSelection() {
  const favoriteTabs = document.querySelectorAll(".colorTabFavorite");
  favoriteTabs.forEach(tab => {
    tab.addEventListener('click', toggleColorSelection);
    tab.style.cursor = 'pointer';
  });
}

function initializeColorSelection(selectClass, colorClass, storageKey, deleteContainerClass) {
  const selectElement = document.querySelector(selectClass);
  selectElement.addEventListener('click', () => {
    toggleSelectionMode(selectElement, colorClass, deleteContainerClass);
  });

  document.querySelector(`${deleteContainerClass} div:first-child`).addEventListener('click', () => {
    deleteSelectedColors(colorClass, storageKey);
  });
}

function toggleSelectionMode(selectElement, colorClass, deleteContainerClass) {
  if (selectElement.textContent === 'Select') {
    selectElement.textContent = 'Cancel';
    document.querySelector(deleteContainerClass).style.display = 'flex';
    enableColorSelection(colorClass);
  } else {
    selectElement.textContent = 'Select';
    document.querySelector(deleteContainerClass).style.display = 'none';
    disableColorSelection(colorClass);
  }
}

function enableColorSelection(colorClass) {
  const colorTabs = document.querySelectorAll(colorClass);
  colorTabs.forEach(tab => {
    tab.addEventListener('click', toggleColorSelection);
    tab.style.cursor = 'pointer';
  });
}

function disableColorSelection(colorClass) {
  const colorTabs = document.querySelectorAll(colorClass);
  colorTabs.forEach(tab => {
    tab.removeEventListener('click', toggleColorSelection);
    tab.classList.remove('selected-for-deletion');
    tab.style.cursor = 'default';
  });
}

function toggleColorSelection(event) {
  event.currentTarget.classList.toggle('selected-for-deletion');
}

function deleteSelectedColors(colorClass, storageKey) {
  const selectedTabs = document.querySelectorAll(`${colorClass}.selected-for-deletion`);
  chrome.storage.local.get({ [storageKey]: [] }, function (result) {
    let colors = result[storageKey];
    selectedTabs.forEach(tab => {
      const color = window.getComputedStyle(tab).backgroundColor;
      const rgbaColor = parseRgba(color);
      const hexColor = rgbaToHex(rgbaColor.r, rgbaColor.g, rgbaColor.b, rgbaColor.a);

      // Remove the color from the array
      colors = colors.filter(col => col !== hexColor);

      // Reset the tab's background color
      tab.style.backgroundColor = "#f1f1f1";
    }); 

    // Update storage and UI
    chrome.storage.local.set({ [storageKey]: colors }, function () {
      if (storageKey === 'favoriteColors') {
        updateFavoriteColorUI(colors);
      } else if (storageKey === 'recentColors') {
        updateRecentColorsUI(colors);
      }
    });
  });
}

function setupRecentColorResetButton() {
  document.getElementById("resetRecent").addEventListener("click", function () {
    document.querySelectorAll(".colorTabRecent").forEach((box) => {
      box.style.backgroundColor = "#f1f1f1";
    });
    chrome.storage.local.set({ recentColors: [] });
  });
}
function showModal(modalId, onConfirm) {
  const modal = document.getElementById(modalId);
  modal.style.display = "flex";

  if (onConfirm) {
      const confirmBtn = modal.querySelector("#confirmDeleteBtn");
      confirmBtn.addEventListener("click", function () {
          onConfirm();
          closeModal(modal);
      }, { once: true });
  }

  const closeButtons = modal.querySelectorAll("button:not(#confirmDeleteBtn)");
  closeButtons.forEach(button => {
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
          const maxFavorites = 20;
          if (favorites.length < maxFavorites) {
              const rgba = parseRgba(colorValue);
              const hexColor = colorValue.startsWith('#') ? colorValue : rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
              favorites.unshift(hexColor);  // Add to the start of the array
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
  favorites.slice(0, 20).forEach((color, index) => {
    if (colorTabs[index]) {
      colorTabs[index].style.backgroundColor = color;
    }
  });
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
        chrome.storage.local.set({ recentColors: [] });
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
  const colorTypeSpans = document.querySelectorAll("#hex, #rgba, #hsl");
  const colorInput = document.getElementById("colorValue");

  colorTypeSpans.forEach((span) => {
    span.addEventListener("click", function () {
      const activeTypeSpan = document.querySelector("span.activeType");

      if (activeTypeSpan.textContent === span.textContent) return;

      activeTypeSpan.classList.remove("activeType");
      span.classList.add("activeType");

      const newInputId = span.textContent.trim().toLowerCase();
      convertColorInput(colorInput.value, newInputId);
    });
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
        colorInput.value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${parseFloat(rgba.a).toFixed(2)})`;
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
    copyColorBtn.style.backgroundColor = '#007bff'
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
  const offscreenCtx = offscreenCanvas.getContext("2d", { willReadFrequently: true });

  let currentHue = 0;
  let currentAlpha = 1;

  let ballPosition = { x: colorCanvas.width / 2, y: colorCanvas.height / 2 };
  let isDragging = false;

  function drawOffscreenColorSpectrum(hue, alpha) {
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
    const colorGradient = offscreenCtx.createLinearGradient(0, 0, offscreenCanvas.width, 0);
    colorGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    colorGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${alpha})`);
    offscreenCtx.fillStyle = colorGradient;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  
    const alphaGradient = offscreenCtx.createLinearGradient(0, 0, 0, offscreenCanvas.height);
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

  function pickColor() {
    drawOffscreenColorSpectrum(currentHue, currentAlpha);

    const imageData = offscreenCtx.getImageData(ballPosition.x, ballPosition.y, 1, 1).data;

    const hex = rgbaToHex(imageData[0], imageData[1], imageData[2], currentAlpha);
    const rgba = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${parseFloat(currentAlpha).toFixed(2)})`;
    const [h, s, l] = rgbToHsl(imageData[0], imageData[1], imageData[2], currentAlpha);

    const activeTypeSpan = document.querySelector("span.activeType").id;

    if (!manualHexInput) {
      switch (activeTypeSpan) {
        case "hex":
          colorInput.value = hex;
          break;
        case "rgba":
          colorInput.value = rgba;
          break;
        case "hsl":
          colorInput.value = `hsl(${h}, ${s}%, ${l}%)`;
          break;
        default:
          colorInput.value = hex;
      }
    }

    selectedColorDiv.style.backgroundColor = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${currentAlpha})`;
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
      ballPosition.x = Math.max(0, Math.min(colorCanvas.width, e.clientX - rect.left));
      ballPosition.y = Math.max(0, Math.min(colorCanvas.height, e.clientY - rect.top));
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
    setColorFromHex(e.target.value);
  });



  function setColorFromHex(hexColor) {
    const { r, g, b, a } = hexToRgba(hexColor);
    const [h, s, l] = rgbToHsl(r, g, b);
  
    currentHue = h;
    currentAlpha = a;
    hueRange.value = h;
    alphaRange.value = a;
  
    drawOffscreenColorSpectrum(currentHue, currentAlpha);
  
    let found = false;
    for (let y = 0; y < offscreenCanvas.height; y++) {
      for (let x = 0; x < offscreenCanvas.width; x++) {
        const imageData = offscreenCtx.getImageData(x, y, 1, 1).data;
        if (
          imageData[0] === r &&
          imageData[1] === g &&
          imageData[2] === b
        ) {
          ballPosition.x = x;
          ballPosition.y = y;
          found = true;
          break;
        }
      }
      if (found) break;
    }
  
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();
  }

  // function locateColorOnCanvas(r, g, b, a) {
  //   const targetRgba = `rgba(${r}, ${g}, ${b}, ${a})`;
  //   let found = false;

  //   for (let y = 0; y < offscreenCanvas.height; y++) {
  //     for (let x = 0; x < offscreenCanvas.width; x++) {
  //       const imageData = offscreenCtx.getImageData(x, y, 1, 1).data;
  //       const canvasColor = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${parseFloat(imageData[3] / 255).toFixed(2)})`;
        
  //       if (canvasColor === targetRgba) {
  //         ballPosition.x = x;
  //         ballPosition.y = y;
  //         found = true;
  //         break;
  //       }
  //     }
  //     if (found) break;
  //   }
  // }

  chrome.runtime.sendMessage({ type: "getColor" }, (response) => {
    if (response.color) {
      setColorFromHex(response.color);
    } else {
      setColorFromHex("#000000");
    }
  });

  setColorFromHex("#000000");

  //recent and favorite color clicks
  document.querySelectorAll(".colorTabRecent, .colorTabFavorite").forEach(tab => {
    tab.addEventListener("click", function () {
      const color = window.getComputedStyle(tab).backgroundColor;
      const rgbaColor = parseRgba(color);
      const hexColor = rgbaToHex(rgbaColor.r, rgbaColor.g, rgbaColor.b, rgbaColor.a);
      setColorFromHex(hexColor);
    });
  });
}

// Utility functions
function hexToRgba(hex) {
  let r = 0, g = 0, b = 0, a = 1;
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

function rgbToHsl(r, g, b, a = 1) {
  (r /= 255), (g /= 255), (b /= 255);
  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    let d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100), parseFloat(a.toFixed(2))];
}
