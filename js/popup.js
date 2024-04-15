"use strict";

document.addEventListener("DOMContentLoaded", () => {
  initializeUI();
  setupColorConversionListeners();
  // setupColorPickListener();
  // fetchInitialColor();
});

function initializeUI() {
  setupToggleHeaders();

  setupStarClicks();
  setupColorCanvas();
  setupPickColorButton();
}

function setupToggleHeaders() {
  document.querySelectorAll(".header").forEach((header) => {
    header.addEventListener("click", () => toggleContent(header));
  });
}

function toggleContent(header) {
  const content = header.nextElementSibling;
  content.style.display = content.style.display === "flex" ? "none" : "flex";
  header.classList.toggle("active");
}

// const handleStarClick = function (event) {
//   const input = document.querySelector("#hex");
//   const colorValue = input.value;

//   const colorTabs = document.querySelectorAll(".colorTab");
//   for (let tab of colorTabs) {
//     const currentColor = tab.style.backgroundColor;
//     if (currentColor === "rgb(241, 241, 241)" || currentColor === "") {
//       tab.style.backgroundColor = colorValue;
//       break; // Exit the loop after setting the color
//     }
//   }
// };

function setupStarClicks() {
  document.getElementById('star').addEventListener('click', function() {
    const input = document.querySelector("#hex");
    const colorValue = input.value;

    const colorTabs = document.querySelectorAll(".colorTabFavorite");
    for (let tab of colorTabs) {
      const currentColor = tab.style.backgroundColor;
      if (currentColor === "rgb(241, 241, 241)" || currentColor === "") {
        tab.style.backgroundColor = colorValue;
        break; // Exit the loop after setting the color
      }
    }
  });
}

// function fetchInitialColor() {
//   // Fetch and set the initial color from storage or a default
//   chrome.runtime.sendMessage({ type: "getColor" }, (response) => {
//     document.getElementById("hex").value = response.color;
//     // You might want to trigger conversion here to update other inputs
//   });
// }

function setupColorConversionListeners() {
  const colorTypeSpans = document.querySelectorAll("#colorType");
  const colorInput = document.getElementById("hex"); // Initial input ID is 'hex'

  colorTypeSpans.forEach((span) => {
    span.addEventListener("click", function () {
      const activeTypeSpan = document.querySelector("span.activeType");

      if (activeTypeSpan.textContent === span.textContent) return;

      activeTypeSpan.classList.remove("activeType");
      span.classList.add("activeType");

      const newInputId = span.textContent.trim().toLowerCase();
      colorInput.id = newInputId;

      convertColorInput(colorInput.value, newInputId);
    });
  });
}

function convertColorInput(value, type) {
  switch (type) {
    case "hex":
      const { r, g, b, a } = value.startsWith("rgba")
        ? parseRgba(value)
        : hslToRgba(parseHsl(value));
      document.getElementById(type).value = rgbaToHex(r, g, b, a);
      break;
    case "rgba":
      const rgba = value.startsWith("#")
        ? hexToRgba(value)
        : hslToRgba(parseHsl(value));
      document.getElementById(
        type
      ).value = `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a})`;
      break;
    case "hls": 
      const {
        r: hr,
        g: hg,
        b: hb,
      } = value.startsWith("#") ? hexToRgba(value) : parseRgba(value);
      const [h, s, l] = rgbToHsl(hr, hg, hb);
      document.getElementById(type).value = `hsl(${h}, ${s}%, ${l}%)`;
      break;
    default:
      console.error("Unsupported type for conversion.");
  }
}

function parseRgba(rgbaString) {
  const [r, g, b, a] = rgbaString.match(/\d+\.?\d*/g).map(Number);
  return { r, g, b, a };
}

function parseHsl(hslString) {
  const [h, s, l] = hslString.match(/\d+\.?\d*/g).map(Number);
  return { h, s, l };
}

function hslToRgba({ h, s, l }) {
  s /= 100;
  l /= 100;
  const [r, g, b] = hslToRgb(h, s, l);
  console.log(`Converted RGB: r=${r}, g=${g}, b=${b}`);
  return { r, g, b, a: 1 }; 
}

function hslToRgb(h, s, l) {
  let r, g, b;

  if (s === 0) {
    r = g = b = l; // achromatic
  } else {
    function hue2rgb(p, q, t) {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    }

    let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    let p = 2 * l - q;
    h /= 360;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    // b = hue
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
}
function rgbaToHex(r, g, b, a) {
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
function rgbToHsl(r, g, b) {
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
  return [Math.round(h * 360), Math.round(s * 100), Math.round(l * 100)];
}
function hexToRgba(hex) {
  let r = 0,
    g = 0,
    b = 0,
    a = 1;
  if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  }
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
  const hexInput = document.getElementById("hex");

  let manualHexInput = false;

  console.log("colorCanvas.width", colorCanvas.width);
  console.log(" colorCanvas.height", colorCanvas.height);

  // Create an offscreen canvas for color picking
  let offscreenCanvas = document.createElement("canvas");
  offscreenCanvas.width = colorCanvas.width;
  offscreenCanvas.height = colorCanvas.height;
  let offscreenCtx = offscreenCanvas.getContext("2d", {
    willReadFrequently: true,
  });

  let currentHue = 0;
  let currentAlpha = 1;

  let ballPosition = { x: colorCanvas.width / 2, y: colorCanvas.height / 2 };
  let isDragging = false; // Track if the ball is being dragged

  // Draws the color spectrum on the offscreen canvas
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

    const hueGradient = offscreenCtx.createLinearGradient(
      0,
      0,
      0,
      offscreenCanvas.height
    );
    hueGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    hueGradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    offscreenCtx.fillStyle = hueGradient;
    offscreenCtx.fillRect(0, 0, offscreenCanvas.width, offscreenCanvas.height);
  }

  function drawColorSpectrum(hue, alpha) {
    ctx.clearRect(0, 0, colorCanvas.width, colorCanvas.height);

    // Color gradient (horizontal)
    const colorGradient = ctx.createLinearGradient(0, 0, colorCanvas.width, 0);
    colorGradient.addColorStop(0, `rgba(255, 255, 255, ${alpha})`);
    colorGradient.addColorStop(1, `hsla(${hue}, 100%, 50%, ${alpha})`);
    ctx.fillStyle = colorGradient;
    ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    // Saturation to black gradient (vertical)
    const hueGradient = ctx.createLinearGradient(0, 0, 0, colorCanvas.height);
    hueGradient.addColorStop(0, `rgba(0, 0, 0, 0)`);
    hueGradient.addColorStop(1, `rgba(0, 0, 0, ${alpha})`);
    ctx.fillStyle = hueGradient;
    ctx.fillRect(0, 0, colorCanvas.width, colorCanvas.height);

    drawBall();
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(ballPosition.x, ballPosition.y, 10, 0, 2 * Math.PI); // Ball radius
    ctx.fillStyle = "white";
    ctx.fill();
  }

  function pickColor() {
    // Ensure the offscreen canvas is always in sync with the color spectrum
    drawOffscreenColorSpectrum(currentHue, currentAlpha);

    // Use the offscreen canvas to pick the color
    const imageData = offscreenCtx.getImageData(
      ballPosition.x,
      ballPosition.y,
      1,
      1
    ).data;

    const hex = rgbaToHex(
      imageData[0],
      imageData[1],
      imageData[2],
      currentAlpha
    );

    console.log("manualHexInput", manualHexInput);

    if (!manualHexInput) {
      hexInput.value = hex;
    }

    // hexInput.value = hexInput.value; // Update HEX input with the newly picked color

    selectedColorDiv.style.backgroundColor = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${currentAlpha})`;
  }

  colorCanvas.addEventListener("mousedown", function (e) {
    manualHexInput = false;
    const rect = colorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
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
      pickColor(); // Update the selected color
    }
  });

  window.addEventListener("mouseup", function () {
    isDragging = false;
  });

  hueRange.addEventListener("input", function () {
    manualHexInput = false;
    currentHue = this.value;
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor(); // Update the selected color based on hue
  });

  alphaRange.addEventListener("input", function () {
    manualHexInput = false;
    currentAlpha = this.value;
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor(); // Update based on alpha
  });

  hexInput.addEventListener("input", (e) => {
    manualHexInput = true;
    setColorFromHex(e.target.value);
  });

  // function isValidHex(hex) {
  //   return /^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3}|[a-fA-F0-9]{8}|[a-fA-F0-9]{4})$/.test(
  //     hex
  //   );
  // }

  function setColorFromHex(hexColor) {
    console.log("hex", hexColor);

    // if (!isValidHex(hexColor)) {
    //   // Optionally, provide feedback or simply return without updating
    //   console.log("Invalid HEX code:", hexColor);
    //   hexInput.style.borderColor = "red";
    //   return;
    // }

    // Assuming hexToRgba and rgbToHsl are already defined
    const { r, g, b, a } = hexToRgba(hexColor);
    const [h, s, l] = rgbToHsl(r, g, b);
    currentHue = h;
    currentAlpha = a;
    hueRange.value = h;
    alphaRange.value = a;

    ballPosition.x = (s / 100) * colorCanvas.width;
    ballPosition.y = colorCanvas.height - (l / 100) * colorCanvas.height;

    drawColorSpectrum(currentHue, currentAlpha);
    pickColor();
  }

  // Initial setup
  chrome.runtime.sendMessage({ type: "getColor" }, (response) => {
    console.log("response.color", response.color);
    if (response.color) {
      setColorFromHex(response.color);
    } else {
      setColorFromHex("#000000");
    }
    // You might want to trigger conversion here to update other inputs
  });
  setColorFromHex("#000000"); // Set a default HEX color if needed
}
