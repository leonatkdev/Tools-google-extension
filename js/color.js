// Improved/refactored color.js main logic with better edge case handling and more robust code

document.addEventListener("DOMContentLoaded", () => {
  try {
    initializeUI();
    setupColorConversionListeners();

    // Enable selection and deletion for both Recent and Favorite colors
    initializeColorSelection(
      ".selectFavColor",
      ".colorTabFavorite",
      "favoriteColors",
      ".deleteContainer"
    );
    // Uncomment below if you want to enable for recent colors as well
    // initializeColorSelection(
    //   ".selectRecentColor",
    //   ".colorTabRecent",
    //   "recentColors",
    //   ".deleteRecentContainer"
    // );
  } catch (e) {
    console.error("Error initializing color tool:", e);
  }
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
  for (let i = 0; i < recentColorElements.length; i++) {
    if (colors[i]) {
      let color = colors[i];
      try {
        if (typeof color !== "string") throw new Error("Color is not a string");
        if (color.startsWith("#")) {
          recentColorElements[i].style.backgroundColor = color;
        } else if (color.startsWith("rgba")) {
          recentColorElements[i].style.backgroundColor = rgbaToHex(...Object.values(parseRgba(color)));
        } else if (color.startsWith("hsl")) {
          const rgba = hslToRgba(parseHsl(color));
          recentColorElements[i].style.backgroundColor = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
        } else {
          // fallback: try to parse as rgb
          recentColorElements[i].style.backgroundColor = color;
        }
      } catch (e) {
        recentColorElements[i].style.backgroundColor = "#f1f1f1";
      }
    } else {
      recentColorElements[i].style.backgroundColor = "#f1f1f1";
    }
  }
}

function setRecentColors() {
  chrome.runtime.sendMessage({ type: "getRecentColors" }, (response) => {
    if (response && Array.isArray(response.recentColors)) {
      updateRecentColorsUI(response.recentColors);
    } else {
      updateRecentColorsUI([]);
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
  const deleteBtn = document.querySelector(`${deleteContainerClass} div:first-child`);
  if (!selectElement || !deleteBtn) return;

  selectElement.addEventListener("click", () => {
    toggleSelectionMode(selectElement, colorClass, deleteContainerClass);
  });

  deleteBtn.addEventListener("click", () => {
    deleteSelectedColors(colorClass, storageKey);
  });
}

function toggleSelectionMode(selectElement, colorClass, deleteContainerClass) {
  if (!selectElement) return;
  const deleteContainer = document.querySelector(deleteContainerClass);
  if (!deleteContainer) return;

  if (selectElement.textContent.trim().toLowerCase() === "select") {
    selectElement.textContent = "Cancel";
    deleteContainer.style.display = "flex";
    enableColorSelection(colorClass);
  } else {
    selectElement.textContent = "Select";
    deleteContainer.style.display = "none";
    disableColorSelection(colorClass);
  }
}

function enableColorSelection(colorClass) {
  const colorTabs = document.querySelectorAll(colorClass);
  colorTabs.forEach((tab) => {
    if (!tab.classList.contains("selection-enabled")) {
      tab.addEventListener("click", toggleColorSelection);
      tab.classList.add("selection-enabled");
    }
    tab.style.cursor = "pointer";
  });
}

function disableColorSelection(colorClass) {
  const colorTabs = document.querySelectorAll(colorClass);
  colorTabs.forEach((tab) => {
    tab.removeEventListener("click", toggleColorSelection);
    tab.classList.remove("selected-for-deletion", "selection-enabled");
    tab.style.cursor = "default";
  });
}

function toggleColorSelection(event) {
  if (!event.currentTarget) return;
  event.currentTarget.classList.toggle("selected-for-deletion");
}

function deleteSelectedColors(colorClass, storageKey) {
  const selectedTabs = document.querySelectorAll(
    `${colorClass}.selected-for-deletion`
  );
  if (!selectedTabs.length) return;

  chrome.storage.local.get({ [storageKey]: [] }, function (result) {
    let colors = Array.isArray(result[storageKey]) ? result[storageKey] : [];
    // Remove selected colors (by hex) from the array
    selectedTabs.forEach((tab) => {
      const color = window.getComputedStyle(tab).backgroundColor;
      let hexColor;
      try {
        if (color.startsWith("#")) {
          hexColor = color;
        } else if (color.startsWith("rgba")) {
          const rgba = parseRgba(color);
          hexColor = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
        } else if (color.startsWith("rgb")) {
          const rgba = parseRgba(color);
          hexColor = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
        } else if (color.startsWith("hsl")) {
          const rgba = hslToRgba(parseHsl(color));
          hexColor = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
        } else {
          hexColor = color;
        }
      } catch (e) {
        hexColor = color;
      }
      // Remove all occurrences (in case of duplicates)
      colors = colors.filter(c => c !== hexColor);
    });

    chrome.storage.local.set({ [storageKey]: colors }, function () {
      if (storageKey === "favoriteColors") {
        updateFavoriteColorUI(colors);
      } else if (storageKey === "recentColors") {
        updateRecentColorsUI(colors);
      }
      selectedTabs.forEach((tab) => {
        tab.classList.remove("selected-for-deletion");
      });
    });
  });
}

function showModal(modalId, onConfirm) {
  const modal = document.getElementById(modalId);
  if (!modal) return;
  modal.style.display = "flex";

  if (onConfirm) {
    const confirmBtn = modal.querySelector("#confirmDeleteBtn");
    if (confirmBtn) {
      confirmBtn.addEventListener(
        "click",
        function handler() {
          onConfirm();
          closeModal(modal);
          confirmBtn.removeEventListener("click", handler);
        },
        { once: true }
      );
    }
  }

  const closeButtons = modal.querySelectorAll("button:not(#confirmDeleteBtn)");
  closeButtons.forEach((button) => {
    button.addEventListener("click", function () {
      closeModal(modal);
    });
  });
}

function closeModal(modal) {
  if (modal) modal.style.display = "none";
}

function setupStarClicks() {
  const starBtn = document.getElementById("star");
  if (!starBtn) return;
  starBtn.addEventListener("click", function () {
    const input = document.querySelector("#colorValue");
    if (!input) return;
    const colorValue = input.value.trim();
    if (!colorValue) return;

    chrome.storage.local.get({ favoriteColors: [] }, function (result) {
      let favorites = Array.isArray(result.favoriteColors) ? result.favoriteColors : [];
      const maxFavorites = 24;
      if (favorites.length >= maxFavorites) {
        showModal("favoriteFullModal");
        return;
      }

      let hexColor;
      try {
        if (colorValue.startsWith("#")) {
          hexColor = colorValue;
        } else if (colorValue.startsWith("hsl")) {
          let rgbConverted = hslToRgba(parseHsl(colorValue));
          hexColor = rgbaToHex(rgbConverted.r, rgbConverted.g, rgbConverted.b, rgbConverted.a);
        } else if (colorValue.startsWith("rgba") || colorValue.startsWith("rgb")) {
          const rgba = parseRgba(colorValue);
          hexColor = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
        } else {
          // fallback: try to parse as hex
          hexColor = colorValue;
        }
      } catch (e) {
        hexColor = "#000000";
      }

      // Prevent duplicates
      favorites = favorites.filter(c => c !== hexColor);
      favorites.unshift(hexColor);
      if (favorites.length > maxFavorites) favorites = favorites.slice(0, maxFavorites);

      chrome.storage.local.set({ favoriteColors: favorites }, function () {
        updateFavoriteColorUI(favorites);
      });
    });
  });
}

function updateFavoriteColorUI(favorites) {
  const colorTabs = document.querySelectorAll(".colorTabFavorite");
  for (let i = 0; i < colorTabs.length; i++) {
    if (favorites[i]) {
      try {
        colorTabs[i].style.backgroundColor = favorites[i];
      } catch (e) {
        colorTabs[i].style.backgroundColor = "#f1f1f1";
      }
    } else {
      colorTabs[i].style.backgroundColor = "#f1f1f1";
    }
  }
}

function loadFavoriteColors() {
  chrome.storage.local.get({ favoriteColors: [] }, function (result) {
    const favorites = Array.isArray(result.favoriteColors) ? result.favoriteColors : [];
    updateFavoriteColorUI(favorites);
  });
}

function setupFavResetButton() {
  const resetRecentBtn = document.getElementById("resetRecent");
  const resetFavBtn = document.getElementById("resetFav");
  if (resetRecentBtn) {
    resetRecentBtn.addEventListener("click", function () {
      showModal("confirmDeleteModal", function () {
        document.querySelectorAll(".colorTabRecent").forEach((box) => {
          box.style.backgroundColor = "#f1f1f1";
        });
        chrome.storage.local.set({ recentColors: [] }, function () {
          chrome.runtime.sendMessage({ type: "recentColorsCleared" });
        });
      });
    });
  }
  if (resetFavBtn) {
    resetFavBtn.addEventListener("click", function () {
      showModal("confirmDeleteModal", function () {
        document.querySelectorAll(".colorTabFavorite").forEach((box) => {
          box.style.backgroundColor = "#f1f1f1";
        });
        chrome.storage.local.set({ favoriteColors: [] });
      });
    });
  }
}

function setupColorConversionListeners() {
  const colorTypeSelect = document.querySelector(".colorTypeTabs");
  const colorInput = document.getElementById("colorValue");
  if (!colorTypeSelect || !colorInput) return;

  colorTypeSelect.addEventListener("change", function () {
    const selectedOption = colorTypeSelect.options[colorTypeSelect.selectedIndex];
    if (!selectedOption) return;
    const newInputId = selectedOption.value;
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
    let r, g, b, a, rgba, h, s, l;
    switch (type) {
      case "hex":
        if (value.startsWith("#")) {
          colorInput.value = value;
        } else if (value.startsWith("rgba") || value.startsWith("rgb")) {
          ({ r, g, b, a } = parseRgba(value));
          colorInput.value = rgbaToHex(r, g, b, a);
        } else if (value.startsWith("hsl")) {
          rgba = hslToRgba(parseHsl(value));
          colorInput.value = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
        }
        break;
      case "rgba":
        if (value.startsWith("#")) {
          rgba = hexToRgba(value);
        } else if (value.startsWith("hsl")) {
          rgba = hslToRgba(parseHsl(value));
        } else {
          rgba = parseRgba(value);
        }
        colorInput.value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${parseFloat(rgba.a).toFixed(2)})`;
        break;
      case "hsl":
        if (value.startsWith("#")) {
          ({ r, g, b, a } = hexToRgba(value));
        } else if (value.startsWith("rgba") || value.startsWith("rgb")) {
          ({ r, g, b, a } = parseRgba(value));
        } else {
          ({ r, g, b, a } = hslToRgba(parseHsl(value)));
        }
        [h, s, l] = rgbToHsl(r, g, b);
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
  // Accepts rgb(), rgba(), or fallback to black
  if (typeof rgbaString !== "string") return { r: 0, g: 0, b: 0, a: 1 };
  const match = rgbaString.match(/(\d+\.?\d*)/g);
  if (!match) {
    console.error("Invalid RGBA string:", rgbaString);
    return { r: 0, g: 0, b: 0, a: 1 };
  }
  const [r = 0, g = 0, b = 0, a = 1] = match.map(Number);
  return { r: +r, g: +g, b: +b, a: parseFloat(a !== undefined ? a : 1) };
}

function parseHsl(hslString) {
  // Accepts hsl() or hsla()
  if (typeof hslString !== "string") return { h: 0, s: 0, l: 0, a: 1 };
  const match = hslString.match(/(\d+\.?\d*)/g);
  if (!match) {
    console.error("Invalid HSL string:", hslString);
    return { h: 0, s: 0, l: 0, a: 1 };
  }
  const [h = 0, s = 0, l = 0, a = 1] = match.map(Number);
  return { h: +h, s: +s, l: +l, a: parseFloat(a !== undefined ? a : 1) };
}

function setupPickColorButton() {
  const pickColorBtn = document.getElementById("pickColor");
  if (!pickColorBtn) return;
  pickColorBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
      const tab = tabs[0];
      if (!tab || !tab.url || tab.url.startsWith("chrome://")) {
        alert("This functionality is not available on chrome:// pages.");
        return;
      }
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
              tabId: tab.id,
            });
            window.close();
          }
        }
      );
    });
    chrome.runtime.sendMessage({ action: "activatePicker" });
  });
}

function setupCopyColorInputButton() {
  const copyColorBtn = document.getElementById("copyColorInput");
  if (!copyColorBtn) return;
  copyColorBtn.addEventListener("click", function () {
    const colorInput = document.getElementById("colorValue");
    if (!colorInput) return;
    colorInput.select();
    colorInput.setSelectionRange(0, 99999);
    copyColorBtn.style.backgroundColor = "#007bff";
    const img = copyColorBtn.querySelector("img");
    if (img) img.style.filter = "invert(1)";
    try {
      document.execCommand("copy");
      // Optionally, show a tooltip or feedback
    } catch (err) {
      console.error("Failed to copy color:", err);
    }
  });
}

function setupColorCanvas() {
  const colorCanvas = document.getElementById("colorCanvas");
  if (!colorCanvas) return;
  const ctx = colorCanvas.getContext("2d", { willReadFrequently: true });
  const hueRange = document.getElementById("hueRange");
  const alphaRange = document.getElementById("alphaRange");
  const selectedColorDiv = document.getElementById("selectedColor");
  const colorInput = document.getElementById("colorValue");
  if (!ctx || !hueRange || !alphaRange || !selectedColorDiv || !colorInput) return;

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
    ctx.save();
    ctx.shadowColor = "black";
    ctx.shadowBlur = 2;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    ctx.lineWidth = 4;
    ctx.strokeStyle = "white";
    ctx.fillStyle = "rgba(255, 255, 255, 0)";
    ctx.beginPath();
    ctx.arc(ballPosition.x, ballPosition.y, 10, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(ballPosition.x, ballPosition.y - 5);
    ctx.lineTo(ballPosition.x, ballPosition.y + 5);
    ctx.moveTo(ballPosition.x - 5, ballPosition.y);
    ctx.lineTo(ballPosition.x + 5, ballPosition.y);
    ctx.stroke();
    ctx.restore();
  }

  function pickColor(hexColor, rgba, hsl) {
    drawOffscreenColorSpectrum(currentHue, currentAlpha);

    const imageData = offscreenCtx.getImageData(
      Math.round(ballPosition.x),
      Math.round(ballPosition.y),
      1,
      1
    ).data;

    // Use the provided props or calculate from the canvas if not provided
    let hex, rgbaString, hslString;
    if (hexColor) {
      hex = hexColor;
    } else {
      hex = rgbaToHex(imageData[0], imageData[1], imageData[2], currentAlpha);
    }
    if (rgba) {
      rgbaString = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${parseFloat(rgba.a).toFixed(2)})`;
    } else {
      rgbaString = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${currentAlpha})`;
    }
    if (hsl) {
      hslString = `hsl(${hsl[0]}, ${hsl[1]}%, ${hsl[2]}%)`;
    } else {
      const [h, s, l] = rgbToHsl(imageData[0], imageData[1], imageData[2]);
      hslString = `hsl(${h}, ${s}%, ${l}%)`;
    }

    const activeTypeSpan = document.querySelector(".colorTypeTabs")?.value || "hex";

    if (!manualHexInput) {
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
    selectedColorDiv.style.backgroundColor = rgbaString;
  }

  colorCanvas.addEventListener("mousedown", function (e) {
    manualHexInput = false;
    const rect = colorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    ballPosition.x = Math.max(0, Math.min(colorCanvas.width, x));
    ballPosition.y = Math.max(0, Math.min(colorCanvas.height, y));
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();
    isDragging = true;
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
    currentHue = Number(this.value) || 0;
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();
  });

  alphaRange.addEventListener("input", function () {
    manualHexInput = false;
    currentAlpha = parseFloat(this.value) || 1;
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();
  });

  colorInput.addEventListener("input", (e) => {
    manualHexInput = true;
    const inputValue = e.target.value.trim();
    let hexColor;
    try {
      if (inputValue.startsWith("#")) {
        hexColor = inputValue;
      } else if (inputValue.startsWith("hsl")) {
        let rgbConverted = hslToRgba(parseHsl(inputValue));
        hexColor = rgbaToHex(rgbConverted.r, rgbConverted.g, rgbConverted.b, rgbConverted.a);
      } else if (inputValue.startsWith("rgba") || inputValue.startsWith("rgb")) {
        const rgba = parseRgba(inputValue);
        hexColor = rgbaToHex(rgba.r, rgba.g, rgba.b, rgba.a);
      } else {
        hexColor = inputValue;
      }
    } catch (e) {
      hexColor = "#000000";
    }
    setColorFromHex(hexColor);
  });

  function setColorFromHex(hexColor) {
    let { r, g, b, a } = hexToRgba(hexColor);
    let [h, s, l] = rgbToHsl(r, g, b);
    currentHue = Number(h);
    currentAlpha = Number(a);
    hueRange.value = h;
    alphaRange.value = a;
    drawOffscreenColorSpectrum(currentHue, currentAlpha);

    // Find closest match for the canvas
    function colorMatches(r1, g1, b1, r2, g2, b2, tolerance = 2) {
      return (
        Math.abs(r1 - r2) <= tolerance &&
        Math.abs(g1 - g2) <= tolerance &&
        Math.abs(b1 - b2) <= tolerance
      );
    }
    let found = false;
    for (let y = 0; y < offscreenCanvas.height && !found; y++) {
      for (let x = 0; x < offscreenCanvas.width; x++) {
        const imageData = offscreenCtx.getImageData(x, y, 1, 1).data;
        if (colorMatches(imageData[0], imageData[1], imageData[2], r, g, b)) {
          ballPosition.x = x;
          ballPosition.y = y;
          found = true;
          break;
        }
      }
    }
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor(hexColor, { r, g, b, a }, [h, s, l]);
  }

  // Load initial color from background or default
  chrome.runtime.sendMessage({ type: "getColor" }, (response) => {
    let color = "#000000";
    if (response && typeof response.color === "string" && response.color) {
      color = response.color;
    }
    colorInput.value = color;
    setColorFromHex(color);
  });

  setColorFromHex("#000000");

  // recent and favorite color clicks
  document
    .querySelectorAll(".colorTabRecent, .colorTabFavorite")
    .forEach((tab) => {
      tab.addEventListener("click", function () {
        const color = window.getComputedStyle(tab).backgroundColor;
        let hexColor;
        try {
          if (color.startsWith("#")) {
            hexColor = color;
          } else if (color.startsWith("rgba") || color.startsWith("rgb")) {
            const rgbaColor = parseRgba(color);
            hexColor = rgbaToHex(rgbaColor.r, rgbaColor.g, rgbaColor.b, rgbaColor.a);
          } else if (color.startsWith("hsl")) {
            const rgbaColor = hslToRgba(parseHsl(color));
            hexColor = rgbaToHex(rgbaColor.r, rgbaColor.g, rgbaColor.b, rgbaColor.a);
          } else {
            hexColor = color;
          }
        } catch (e) {
          hexColor = "#000000";
        }
        setColorFromHex(hexColor);
      });
    });
}

// Utility functions
function hexToRgba(hex) {
  if (typeof hex !== "string" || !hex.startsWith("#")) return { r: 0, g: 0, b: 0, a: 1 };
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
  return { r, g, b, a: parseFloat(a.toFixed(2)) };
}

function hslToRgb(h, s, l) {
  h = Number(h);
  s = Number(s);
  l = Number(l);
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
  s = Number(s) / 100;
  l = Number(l) / 100;
  const [r, g, b] = hslToRgb(h, s, l);
  return { r, g, b, a: parseFloat(a) };
}

function rgbaToHex(r, g, b, a = 1) {
  r = Math.round(r); g = Math.round(g); b = Math.round(b);
  let hex = "#" +
    [r, g, b].map((x) => x.toString(16).padStart(2, "0")).join("");
  if (a < 1) {
    hex += Math.round(a * 255).toString(16).padStart(2, "0");
  }
  return hex;
}

function rgbToHsl(r, g, b) {
  r = Number(r) / 255;
  g = Number(g) / 255;
  b = Number(b) / 255;
  let max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0, l = (max + min) / 2;
  let c = max - min;
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
    (h * 360).toFixed(2),
    (s * 100).toFixed(2),
    (l * 100).toFixed(2)
  ];
}
