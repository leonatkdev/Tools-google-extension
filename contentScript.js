document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    ["colorPickerCanvas", "zoomLens", "zoomGridSquares"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });

    document.removeEventListener("mousemove", () => {});
  }
});

function injectUI() {
  if (document.getElementById("colorPickerCanvas")) return;

  const canvas = document.createElement("canvas");
  canvas.id = "colorPickerCanvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.zIndex = "999999";
  canvas.style.pointerEvents = "none";
  document.body.appendChild(canvas);

  const lens = document.createElement("div");
  lens.id = "zoomLens";
  lens.style.position = "fixed";
  lens.style.border = "1px solid #000";
  lens.style.borderRadius = "50%";
  lens.style.width = "100px";
  lens.style.height = "100px";
  lens.style.overflow = "hidden";
  lens.style.pointerEvents = "none";
  lens.style.zIndex = "100000000";
  lens.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='12' height='12' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='1' width='10' height='10' fill='transparent'/%3E%3C/svg%3E")`;
  lens.style.backgroundPosition = "center";
  document.body.appendChild(lens);

  const gridSquares = document.createElement("div");
  gridSquares.id = "zoomGridSquares";
  gridSquares.style.overflow = "hidden";
  gridSquares.style.zIndex = "100000000";
  gridSquares.style.width = "100px";
  gridSquares.style.height = "100px";
  gridSquares.style.borderRadius = "50%";
  gridSquares.style.position = "fixed";
  gridSquares.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='12' height='12' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='1' width='10' height='10' fill='transparent'/%3E%3C/svg%3E")`;
  gridSquares.style.backgroundPosition = "center";
  document.body.appendChild(gridSquares);

  return { canvas, lens, gridSquares };
}

// Activates the zoom and color picking functionality
function activateZoom(dataUrl) {
  const { canvas, lens, gridSquares } = injectUI();
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = new Image();

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    document.addEventListener("mousemove", (event) => {
      const x = event.clientX;
      const y = event.clientY;
      const pixel = ctx.getImageData(x, y, 1, 1);
      const data = pixel.data;
      const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;

      // Update the lens position and background for zoom effect
      lens.style.left = `${x - lens.offsetWidth / 2}px`;
      lens.style.top = `${y - lens.offsetHeight / 2}px`;

      // The zoomed image as the background
      const backgroundImage = `url('${dataUrl}')`;
      const backgroundSize = `${canvas.width * 10}px ${canvas.height * 10}px`;
      const backgroundPosition = `-${x * 10 - lens.offsetWidth / 10}px -${
        y * 10 - lens.offsetHeight / 10
      }px`;

    
      lens.style.backgroundImage = `${backgroundImage}`;
      lens.style.backgroundSize = `${backgroundSize}, 100px 100px`;
      lens.style.backgroundPosition = `${backgroundPosition}, 0 0`;

      gridSquares.style.left = `${x - lens.offsetWidth / 2}px`;
      gridSquares.style.top = `${y - lens.offsetHeight / 2}px`;
      gridSquares.style.backgroundSize = `10px 10px`;
      gridSquares.style.backgroundPosition = `3px 3px`;

    });
  };

  gridSquares.addEventListener("click", function (event) {
    const x = event.clientX;
    const y = event.clientY;
    const pixel = ctx.getImageData(x, y, 1, 1);
    const data = pixel.data;
    const hex =
      "#" +
      ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2])
        .toString(16)
        .slice(1);

    // Send message to background script
    chrome.runtime.sendMessage({ type: "colorPicked", color: hex });

    // Remove the canvas, zoom lens, and grid squares
    ["colorPickerCanvas", "zoomLens", "zoomGridSquares"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });
  });

  img.src = dataUrl;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("messageContent", message);
  if (message.action === "capture") {
    activateZoom(message.screenshotUrl);
  }
});

/// Tooltip
let isExtensionActive = false;

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "enable") {
    isExtensionActive = true;
    // sendResponse({status: "Extension enabled"});
  } else if (request.action === "disable") {
    isExtensionActive = false; 
    const element = document.getElementById("extension-tooltip");
    if (element) {
      element.remove();
    }
    // sendResponse({status: "Extension disabled"});
  }
});


document.addEventListener("mouseup", function (e) {
  if (!isExtensionActive) return; // Exit if extension is not active

  let selection = window.getSelection();
  let selectedText = selection.toString();
  if (!selection.rangeCount || selectedText.length === 0) return; // No selection made

  let style = window.getComputedStyle(selection.anchorNode.parentNode);
  let fontSize = style.fontSize;
  let fontWeight = style.fontWeight;
  let lineHeight = style.lineHeight;

  let tooltip = document.getElementById("extension-tooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    document.body.appendChild(tooltip);
    tooltip.id = "extension-tooltip";
    tooltip.style.position = "absolute";
    tooltip.style.zIndex = "10000";
    tooltip.style.backgroundColor = "#FFF";
    tooltip.style.border = "1px solid #000";
    tooltip.style.borderRadius = "24px";
    tooltip.style.fontSize = "12px";
    tooltip.style.fontFamily = "Arial, sans-serif";
    tooltip.style.display = "flex";
  } else {
    tooltip.innerHTML = "";
  }


  let textSpan = document.createElement("span");
  textSpan.style.padding = "6px 12px";
  textSpan.style.color = "black";
  textSpan.textContent = `Size: ${fontSize}, Weight: ${fontWeight}, Line: ${lineHeight}`;
  tooltip.appendChild(textSpan);

  let actionButton = document.createElement("div");
  actionButton.id = "extension-save-button";
  actionButton.textContent = "Save";
  actionButton.style.border = "none";
  actionButton.style.padding = "6px 12px";
  actionButton.style.cursor = "pointer";
  actionButton.style.zIndex = "10000000000 !important";
  actionButton.style.backgroundColor = "#007bff";
  actionButton.style.color = "black";
  actionButton.style.color = "white";

  actionButton.addEventListener("click", function (event) {
    console.log("Button !", { fontSize, fontWeight, lineHeight });
    chrome.runtime.sendMessage({
      action: "updateSelection",
      data: {
        fontSize: fontSize,
        fontWeight: fontWeight,
        lineHeight: lineHeight,
      },
    });
  });

  tooltip.appendChild(actionButton);

  let closeButton = document.createElement("div");
  closeButton.id = "close-tooltip-button";
  closeButton.textContent = "Close";
  closeButton.style.color = "black";
  closeButton.style.padding = "6px 12px";

  closeButton.addEventListener("click", function (event) {
    tooltip.remove();
  });

  tooltip.appendChild(closeButton);

  // Position the tooltip
  let rect = selection.getRangeAt(0).getBoundingClientRect();
  tooltip.style.top = `${
    window.scrollY + rect.top - tooltip.offsetHeight - 5
  }px`; // 5px above the selection
  tooltip.style.left = `${
    window.scrollX + rect.left + (rect.width - tooltip.offsetWidth) / 2
  }px`; // Centered above the selection
});
