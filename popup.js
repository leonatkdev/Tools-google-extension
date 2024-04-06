"use strict";
document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll(".header");

  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      content.style.display =
        content.style.display === "flex" ? "none" : "flex";
      header.classList.toggle("active");
    });
  });

  document.querySelectorAll("#font-container").forEach((parentDiv) => {
    const button = parentDiv.querySelector(".versionBtn");
    button.addEventListener("click", function () {
      const inputs = parentDiv.querySelectorAll("input");
      inputs?.forEach((input) => {
        input.classList.toggle("showInput");
      });
    });
  });


  document
    .getElementById("toggleButton")
    .addEventListener("click", function () {
      var versionsContainer = document.getElementById("versionsContainer");
      if (
        versionsContainer.style.display === "none" ||
        versionsContainer.style.display === ""
      ) {
        versionsContainer.style.display = "flex";
      } else {
        versionsContainer.style.display = "none";
      }
    });

  const hexInput = document.querySelector("#hex");
  const rgbaInput = document.querySelector("#rgba");
  const hslInput = document.querySelector("#hls"); 

  hexInput.addEventListener("input", () => {
    const { r, g, b, a } = hexToRgba(hexInput.value);
    rgbaInput.value = `rgba(${r}, ${g}, ${b}, ${a})`;
    const [h, s, l] = rgbToHsl(r, g, b);
    hslInput.value = `hsl(${h}, ${s}%, ${l}%)`;
  });

  rgbaInput.addEventListener("input", () => {
    const rgba = rgbaInput.value.match(/\d+/g).map(Number);
    hexInput.value = rgbaToHex(...rgba);
    const [h, s, l] = rgbToHsl(...rgba);
    hslInput.value = `hsl(${h}, ${s}%, ${l}%)`;
  });

  hslInput.addEventListener("input", () => {
    const hsl = hslInput.value.match(/\d+/g).map(Number);
    const [r, g, b] = hslToRgb(...hsl);
    rgbaInput.value = `rgba(${r}, ${g}, ${b}, 1)`;
    hexInput.value = rgbaToHex(r, g, b, 1);
  });

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

  const stars = document.querySelectorAll('span[id="star"]');

  const handleStarClick = function (event) {
    const input = document.querySelector("#hex");
    const colorValue = input.value;

    const colorTabs = document.querySelectorAll(".colorTab");
    for (let tab of colorTabs) {
      const currentColor = tab.style.backgroundColor;
      if (currentColor === "rgb(241, 241, 241)" || currentColor === "") {
        tab.style.backgroundColor = colorValue;
        break; // Exit the loop after setting the color
      }
    }
  };

  stars.forEach((star) => {
    star.addEventListener("click", handleStarClick);
  });

  const colorCanvas = document.getElementById("colorCanvas");
  const ctx = colorCanvas.getContext("2d", { willreadfrequently: true });
  const hueRange = document.getElementById("hueRange");
  const alphaRange = document.getElementById("alphaRange");
  const selectedColorDiv = document.getElementById("selectedColor");

  let currentHue = 0;
  let currentAlpha = 1;

  let ballPosition = { x: colorCanvas.width / 2, y: colorCanvas.height / 2 };
  let isDragging = false; // Track if the ball is being dragged

  function drawColorSpectrum(hue, alpha) {
    // Clear the canvas
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

    // Draw the ball
    drawBall();
  }

  function drawBall() {
    ctx.beginPath();
    ctx.arc(ballPosition.x, ballPosition.y, 10, 0, 2 * Math.PI); // Ball radius
    ctx.fillStyle = "black"; // Ball color
    ctx.fill();
  }

  function pickColor() {
    const imageData = ctx.getImageData(
      ballPosition.x,
      ballPosition.y,
      1,
      1
    ).data;
    if (selectedColorDiv) {
    selectedColorDiv.style.backgroundColor = `rgba(${imageData[0]}, ${imageData[1]}, ${imageData[2]}, ${currentAlpha})`;
    }
  }

  colorCanvas.addEventListener("mousedown", function (e) {
    const rect = colorCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    // Check if the click is inside the ball
    if (Math.sqrt((x - ballPosition.x) ** 2 + (y - ballPosition.y) ** 2) < 10) {
      isDragging = true;
    }
  });

  window.addEventListener("mousemove", function (e) {
    if (isDragging) {
      const rect = colorCanvas.getBoundingClientRect();
      ballPosition.x = e.clientX - rect.left;
      ballPosition.y = e.clientY - rect.top;
      drawColorSpectrum(currentHue, currentAlpha);
      pickColor(); // Update the selected color based on the new ball position
    }
  });

  window.addEventListener("mouseup", function () {
    isDragging = false;
  });

  hueRange.addEventListener("input", function () {
    currentHue = this.value;
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor(); // Also update the selected color based on the new hue
  });

  alphaRange.addEventListener("input", function () {
    currentAlpha = this.value;
    drawColorSpectrum(currentHue, currentAlpha);
    pickColor(); // Update the selected color based on the new alpha
  });

  // Initialize with the default hue, full alpha, and selected color
  drawColorSpectrum(currentHue, currentAlpha);
  pickColor(); // Initialize the selected color based on the ball's starting position
});

document.getElementById("pickColor").addEventListener("click", function () {
  console.log("click");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // This sends a message to the background script to capture the screen
    chrome.runtime.sendMessage({ action: "capturePage", tabId: tabs[0].id });
  });
});

document.getElementById("pickColor").addEventListener("click", function () {
  console.log("click");
  chrome.runtime.sendMessage({ action: "activatePicker" });
});

document.addEventListener("DOMContentLoaded", function () {
  console.log("here");
  chrome.runtime.sendMessage({ type: "getColor" }, function (response) {
    document.getElementById("hex").value = response.color;
  });
});

