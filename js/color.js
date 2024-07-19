document.addEventListener("DOMContentLoaded", () => {
  initializeUI();
  setupColorConversionListeners();
});

function initializeUI() {
  setupStarClicks();
  loadFavoriteColors();
  setupFavResetButton();
  setupRecentColorResetButton();
  setRecentColors();
  setupColorCanvas();
  setupPickColorButton();
}

function setRecentColors() {
  function updateRecentColorsUI(colors) {
    const recentColorElements = document.querySelectorAll(".colorTabRecent");
    colors.forEach((color, index) => {
      if (recentColorElements[index]) {
        recentColorElements[index].style.backgroundColor = color;
      }
    });
  }

  chrome.runtime.sendMessage({ type: "getRecentColors" }, (response) => {
    if (response.recentColors && response.recentColors.length > 0) {
      updateRecentColorsUI(response.recentColors);
    }
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

function setupStarClicks() {
  document.getElementById("star").addEventListener("click", function () {
    const input = document.querySelector("#colorValue");
    const colorValue = input.value;

    chrome.storage.local.get({ favoriteColors: [] }, function (result) {
      let favorites = result.favoriteColors;
      const maxFavorites = 9;
      if (favorites.length < maxFavorites) {
        const hexColor = colorValue.startsWith('#') ? colorValue : rgbaToHex(...parseRgba(colorValue));
        favorites.push(hexColor);
        chrome.storage.local.set({ favoriteColors: favorites }, function () {
          updateFavoriteColorUI(favorites);
        });
      } else {
        console.error("Maximum number of favorite colors reached.");
      }
    });
  });
}

function updateFavoriteColorUI(favorites) {
  const colorTabs = document.querySelectorAll(".colorTabFavorite");
  favorites.forEach((color, index) => {
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
  document.getElementById("resetFav").addEventListener("click", function () {
    document.querySelectorAll(".colorTabFavorite").forEach((box) => {
      box.style.backgroundColor = "#f1f1f1";
    });
    chrome.storage.local.set({ favoriteColors: [] });
  });
}

function setupColorConversionListeners() {
  const colorTypeSpans = document.querySelectorAll("#hex, #rgba");
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
          : hexToRgba(value);
        colorInput.value = rgbaToHex(r, g, b, a);
        break;
      case "rgba":
        const rgba = value.startsWith("#")
          ? hexToRgba(value)
          : parseRgba(value);
        colorInput.value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
        break;
      default:
        console.error("Unsupported type for conversion.");
    }
  } catch (error) {
    console.error("Error during conversion: ", error);
  }
}

function parseRgba(rgbaString) {
  const rgbaArray = rgbaString.match(/\d+\.?\d*/g).map(Number);
  const [r, g, b, a = 1] = rgbaArray; // Default alpha to 1 if not present
  return { r, g, b, a };
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

function setupColorCanvas() {
  const colorCanvas = document.getElementById("colorCanvas");
  const ctx = colorCanvas.getContext("2d", { willReadFrequently: true });
  const hueRange = document.getElementById("hueRange");
  const alphaRange = document.getElementById("alphaRange");
  const selectedColorDiv = document.getElementById("selectedColor");
  const colorInput = document.getElementById("colorValue");

  let manualHexInput = false;

  let offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = colorCanvas.width;
  offscreenCanvas.height = colorCanvas.height;
  let offscreenCtx = offscreenCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  let currentHue = 0;
  let currentAlpha = 1;

  let ballPosition = { x: colorCanvas.width / 2, y: colorCanvas.height / 2 };
  let isDragging = false;

  function drawOffscreenColorSpectrum(hue, alpha) {
    console.log('hue', hue)
    console.log('alpha', alpha)
    offscreenCtx.clearRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const colorGradient = offscreenCtx.createLinearGradient(0, 0, offscreenCanvas.width, 0);
    colorGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    colorGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${alpha})`);
    offscreenCtx.fillStyle = colorGradient;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);

    const hueGradient = offscreenCtx.createLinearGradient(0, 0, 0, offscreenCanvas.height);
    hueGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    hueGradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    offscreenCtx.fillStyle = hueGradient;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  }

  function drawColorSpectrum(hue, alpha) {
    ctx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);
  
    const colorGradient = ctx.createLinearGradient(0, 0, colorCanvas.width, 0);
    colorGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    colorGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${alpha})`);
    ctx.fillStyle = colorGradient;
    ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);
  
    const hueGradient = ctx.createLinearGradient(0, 0, 0, colorCanvas.height);
    hueGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    hueGradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    ctx.fillStyle = hueGradient;
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
    const rgba = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${currentAlpha})`;
  
    const activeTypeSpan = document.querySelector("span.activeType").id;
  
    if (!manualHexInput) {
      switch (activeTypeSpan) {
        case "hex":
          colorInput.value = hex;
          break;
        case "rgba":
          colorInput.value = rgba;
          break;
        default:
          colorInput.value = hex;
      }
    }
  
    selectedColorDiv.style.backgroundColor = hex;
  }

  colorCanvas.addEventListener("mousedown", function (e) {
    manualHexInput = false;
    const rect = colorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    ballPosition.x = x;
    ballPosition.y = y;

    console.log(' ballPosition.x',  ballPosition.x)
    console.log(' ballPosition.y',  ballPosition.y)

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
    currentAlpha = this.value;
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();
  });

  colorInput.addEventListener("input", (e) => {
    manualHexInput = true;
    setColorFromHex(e.target.value);
  });


  function setColorFromHex(hexColor) {
    console.log('Setting color from hex:', hexColor);
    const { r, g, b, a } = hexToRgba(hexColor);
    console.log('RGBA:', r, g, b, a);
  
    const { h, s, l } = rgbToHsl(r, g, b);
    console.log('HSL:', h, s, l);
  
    currentHue = h;
    currentAlpha = a;
    hueRange.value = currentHue;
    alphaRange.value = currentAlpha;
  
    // Update ball position based on saturation and lightness
    ballPosition.x = (s / 100) * colorCanvas.width;
    ballPosition.y = colorCanvas.height - ((l / 100) * colorCanvas.height); // Correct mapping of lightness to canvas
  
    console.log('Ball position:', ballPosition.x, ballPosition.y);
  
    drawColorSpectrum(currentHue, currentAlpha);
    drawBall();
    pickColor();
  }
  

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
      console.log('color', color)
      const rgbaColor = parseRgba(color);
      const hexColor = rgbaToHex(rgbaColor.r, rgbaColor.g, rgbaColor.b, rgbaColor.a);
      console.log('hexColor', hexColor)
      setColorFromHex(hexColor);
    });
  });
}

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
  return { r, g, b, a };
}


function rgbToHsl(r, g, b) {
  r /= 255, g /= 255, b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
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