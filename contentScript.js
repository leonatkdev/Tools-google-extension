(function () {
  let isColorPicked = false;

  document.addEventListener("keydown", function (event) {
    if (event?.key === "Escape") {
      cleanUp();
      isColorPicked = true;
    }
  });

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "cleanup") {
      // Clean up any existing UI elements
      cleanUp();
      // Send a response back to indicate cleanup is complete
      sendResponse({ status: "cleanup complete" });
    }

    if (message.action === "capture") {
      try {
        activateZoom(message.screenshotUrl);
        isColorPicked = false
      } catch (e) {
        console.error("Failed to activate zoom:", e);
      }
    }
  });

  function createAndAppendElement(tag, id, styles) {
    const element = document.createElement(tag);
    element.id = id;
    Object.assign(element.style, styles);
    document.body.appendChild(element);
    return element;
  }

  function injectUI() {
    cleanUp(); // Ensure all elements and listeners are cleaned up before injecting new ones

    const overlay = createAndAppendElement("div", "colorPickerOverlay", {
      position: "fixed",
      top: "0",
      left: "0",
      width: "100%",
      height: "100%",
      zIndex: "999998",
      background: "rgba(0, 0, 0, 0.5)",
      pointerEvents: "none",
    });

    const canvas = createAndAppendElement("canvas", "colorPickerCanvas", {
      position: "fixed",
      top: "0",
      left: "0",
      zIndex: "999999",
      pointerEvents: "none",
    });
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const lens = createAndAppendElement("div", "zoomLens", {
      position: "fixed",
      borderRadius: "50%",
      width: "150px",
      height: "150px",
      overflow: "hidden",
      pointerEvents: "none",
      zIndex: "100000000",
    });

    const gridSquares = createAndAppendElement("div", "zoomGridSquares", {
      overflow: "hidden",
      zIndex: "100000000",
      width: "150px",
      height: "150px",
      borderRadius: "50%",
      position: "fixed",
      pointerEvents: "none",
      boxShadow: "0px 0px 2px 2px lightgrey",
    });
    gridSquares.innerHTML = `
    <style>
      #zoomGridSquares::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 10px;
        height: 10px;
        border: 2px solid red;
      }
    </style>
  `;

    const colorHex = createAndAppendElement("div", "colorHexDisplay", {
      position: "fixed",
      zIndex: "100000001",
      padding: "5px 8px",
      background: "white",
      color: "black",
      fontSize: "12px",
      borderRadius: "8px",
      border: "1px solid lightgray",
      pointerEvents: "none",
    });

    return { canvas, lens, gridSquares, overlay, colorHex };
  }

  function activateZoom(dataUrl) {
    const { canvas, lens, gridSquares, overlay, colorHex } = injectUI();
    if (!canvas || !lens || !gridSquares || !overlay || !colorHex) {
      console.error("Failed to inject UI elements.");
      return;
    }

    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const img = new Image();
    img.onload = () => {
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const handleMouseMove = (event) => {
        !isColorPicked ? onDocumentMouseMove(event, ctx, canvas, lens) : {};
      };
      const handleClick = (event) => {
        !isColorPicked
          ? onDocumentClick(event, ctx, canvas, handleMouseMove)
          : {};
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("click", handleClick);
    };

    img.onerror = () => console.error("Failed to load image for zoom.");
    img.src = dataUrl;
  }

  function onDocumentMouseMove(event, ctx, canvas, lens) {
    const x = event.clientX;
    const y = event.clientY;
    updateZoomLensPosition(event, ctx);
    updateZoomBackground(canvas, lens, x, y);
  }

  function onDocumentClick(event, ctx, canvas, handleMouseMove) {
    event.preventDefault();
    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const pixel = ctx.getImageData(x - 1, y - 1, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
      .toString(16)
      .slice(1)}`;

    console.log("Picked color:", hex);
    chrome.runtime.sendMessage({ type: "colorPicked", color: hex });

    // Clean up event listeners and UI elements
    cleanUp();

    isColorPicked = true;
  }

  function updateZoomLensPosition(event, ctx) {
    const x = event.clientX;
    const y = event.clientY;
    const lens = document.getElementById("zoomLens");
    const gridSquares = document.getElementById("zoomGridSquares");
    const colorHexDisplay = document.getElementById("colorHexDisplay");

    // Adjust the sampling point slightly to align with the red square
    const pixel = ctx.getImageData(x - 1, y - 1, 1, 1).data;
    const hex = `#${((1 << 24) + (pixel[0] << 16) + (pixel[1] << 8) + pixel[2])
      .toString(16)
      .slice(1)}`;

    const offsetX = x + 150 + 100 > window.innerWidth ? -150 : 150;
    const offsetY = y + 100 + 100 > window.innerHeight ? -100 : 100;

    if (!lens || !gridSquares) return;

    lens.style.left = `${x - lens.offsetWidth / 2 + offsetX}px`;
    lens.style.top = `${y - lens.offsetHeight / 2 + offsetY}px`;

    gridSquares.style.left = `${x - gridSquares.offsetWidth / 2 + offsetX}px`;
    gridSquares.style.top = `${y - gridSquares.offsetHeight / 2 + offsetY}px`;

    // Optionally, apply the correct border color to gridSquares
    gridSquares.style.border = `12px solid ${hex}`;

    if (colorHexDisplay) {
      colorHexDisplay.textContent = hex;
      colorHexDisplay.style.left = `${
        x - lens.offsetWidth / 2 + offsetX + 45
      }px`;
      colorHexDisplay.style.top = `${
        y - lens.offsetHeight / 2 + offsetY + 125
      }px`;
    }
  }

  function updateZoomBackground(canvas, lens, x, y) {
    const scaleFactor = 10;
    const lensSize = lens.offsetWidth;
    const gridSquares = document.getElementById("zoomGridSquares");
    const ctx = canvas.getContext("2d");

    const startX = Math.max(0, x - lensSize / (2 * scaleFactor));
    const startY = Math.max(0, y - lensSize / (2 * scaleFactor));
    const width = Math.min(lensSize / scaleFactor, canvas.width - startX);
    const height = Math.min(lensSize / scaleFactor, canvas.height - startY);

    if (width <= 0 || height <= 0) return;

    const pixelData = ctx.getImageData(startX, startY, width, height).data;
    const pixelatedCanvas = document.createElement("canvas");
    const pixelatedCtx = pixelatedCanvas.getContext("2d");

    pixelatedCanvas.width = width;
    pixelatedCanvas.height = height;

    for (let i = 0; i < pixelData.length; i += 4) {
      const r = pixelData[i];
      const g = pixelData[i + 1];
      const b = pixelData[i + 2];
      const a = pixelData[i + 3] / 255;

      const col = (i / 4) % width;
      const row = Math.floor(i / 4 / width);

      pixelatedCtx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`;
      pixelatedCtx.fillRect(col, row, 1, 1);
    }

    const pixelatedDataUrl = pixelatedCanvas.toDataURL();

    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");

    tempCanvas.width = lensSize;
    tempCanvas.height = lensSize;

    tempCtx.msImageSmoothingEnabled = false;
    tempCtx.mozImageSmoothingEnabled = false;
    tempCtx.webkitImageSmoothingEnabled = false;
    tempCtx.imageSmoothingEnabled = false;

    const img = new Image();
    img.onload = () => {
      tempCtx.drawImage(img, 0, 0, tempCanvas.width, tempCanvas.height);
      lens.style.backgroundImage = `url('${tempCanvas.toDataURL()}')`;
      lens.style.backgroundSize = `${lensSize}px ${lensSize}px`;

      const gridSize = lensSize / scaleFactor;
      gridSquares.style.backgroundSize = `${gridSize}px ${gridSize}px`;
    };
    img.src = pixelatedDataUrl;
  }

  function cleanUp() {
    [
      "colorPickerCanvas",
      "zoomLens",
      "zoomGridSquares",
      "colorPickerOverlay",
      "colorHexDisplay",
    ].forEach((id) => {
      const element = document.getElementById(id);
      if (element) element.remove();
    });

    document.removeEventListener("mousemove", onDocumentMouseMove);
    document.removeEventListener("click", onDocumentClick);
  }
})();

/////Typography
(function () {
  if (typeof window.typographyMode === "undefined") {
    window.typographyMode = false;

    function createQuitButton() {
      const button = document.createElement("button");
      button.id = "quitTypographyButton";
      button.innerText = "Quit Typography Mode";
      button.style.position = "fixed";
      button.style.top = "10px";
      button.style.right = "10px";
      button.style.padding = "10px 20px";
      button.style.backgroundColor = "#dc3545";
      button.style.color = "#fff";
      button.style.border = "none";
      button.style.borderRadius = "5px";
      button.style.cursor = "pointer";
      button.style.zIndex = 10001;
      document.body.appendChild(button);

      button.addEventListener("click", () => {
        window.typographyMode = false;
        document.removeEventListener("click", handleClick, true);
        removeAllModals();
        button.remove();
      });
    }

    function removeAllModals() {
      const modals = document.querySelectorAll(".typography-modal");
      modals.forEach((modal) => modal.remove());
    }

    function handleClick(event) {
      if (
        event.target.id === "quitTypographyButton" ||
        event.target.closest("#quitTypographyButton")
      ) {
        return;
      }

      if (event.target.closest(".typography-modal")) {
        return;
      }

      if (window.typographyMode) {
        const tagName = event.target.tagName.toLowerCase();
        if (tagName === "a" || tagName === "button") {
          // Allow links and buttons to work normally
          return;
        }

        event.preventDefault();
        event.stopPropagation();

        const computedStyle = window.getComputedStyle(event.target);
        const fontData = {
          elementSelectedTag: event?.target?.nodeName || "",
          fontFamily: computedStyle.fontFamily,
          fontSize: computedStyle.fontSize,
          fontWeight: computedStyle.fontWeight,
          lineHeight: computedStyle.lineHeight,
          color: computedStyle.color,
        };

        // Send the font data to the background script to save it
        chrome.runtime.sendMessage({
          action: "saveFontData",
          fontData: fontData,
        });

        showModal(fontData, event.pageX, event.pageY);
      }
    }

    function showModal(fontData, pageX, pageY) {
      const modal = document.createElement("div");
      modal.className = "typography-modal";
      Object.assign(modal.style, modalStyles);

      modal.innerHTML = ` 
        <div class="ModalTypographyTopPart">
          <span>${fontData.elementSelectedTag}</span>
          <button id="closeButton">
            <svg stroke="currentColor" fill="currentColor" stroke-width="0" viewBox="0 0 512 512" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" style="width: 24px; height: 24px;">
              <path d="m289.94 256 95-95A24 24 0 0 0 351 127l-95 95-95-95a24 24 0 0 0-34 34l95 95-95 95a24 24 0 1 0 34 34l95-95 95 95a24 24 0 0 0 34-34z"></path>
            </svg>
          </button>
        </div>
        <div>
          <label>Font Family:</label>
          <span>${fontData.fontFamily}</span>
        </div>
        <div class="ModalTypographyContainer">
          <div>
            <label>Font Size:</label>
            <span>${fontData.fontSize}</span>
          </div>
          <div>
            <label>Font Weight:</label>
            <span>${fontData.fontWeight}</span>
          </div>
          <div>
            <label>Line Height:</label>
            <span>${fontData.lineHeight}</span>
          </div>
          <div>
            <label>Color:</label>
            <span>${fontData.color}</span>
          </div>
        </div>
        <button id="copyButton">Copy All</button>
      `;

      document.body.appendChild(modal);

      modal
        .querySelectorAll("div")
        .forEach((div) => Object.assign(div.style, divStyle));
      modal
        .querySelectorAll("label")
        .forEach((label) => Object.assign(label.style, labelStyles));
      modal
        .querySelectorAll("span")
        .forEach((span) => Object.assign(span.style, spanStyles));
      modal
        .querySelectorAll(".ModalTypographyContainer")
        .forEach((div) => Object.assign(div.style, divStyleTest));
      modal
        .querySelectorAll(".ModalTypographyTopPart")
        .forEach((div) => Object.assign(div.style, ModalTypographyTopPart));

      Object.assign(modal.querySelector("#copyButton").style, copyButtonStyles);
      Object.assign(
        modal.querySelector("#closeButton").style,
        closeButtonStyles
      );

      const modalRect = modal.getBoundingClientRect();
      const viewportX = pageX - window.scrollX;
      const viewportY = pageY - window.scrollY;

      if (viewportX + modalRect.width > window.innerWidth) {
        pageX = window.innerWidth - modalRect.width - 10 + window.scrollX;
      }
      if (viewportY + modalRect.height > window.innerHeight) {
        pageY = window.innerHeight - modalRect.height - 10 + window.scrollY;
      }

      modal.style.left = `${pageX}px`;
      modal.style.top = `${pageY}px`;

      modal.querySelector("#copyButton").addEventListener("click", () => {
        copyAllToClipboard(
          fontData.fontFamily,
          fontData.fontSize,
          fontData.fontWeight,
          fontData.lineHeight,
          fontData.color
        );
      });
      modal.querySelector("#closeButton").addEventListener("click", () => {
        modal.remove();
      });
    }

    function copyAllToClipboard(
      fontFamily,
      fontSize,
      fontWeight,
      lineHeight,
      color
    ) {
      const text = `font-family: ${fontFamily};\nfont-size: ${fontSize};\nfont-weight: ${fontWeight};\nline-height: ${lineHeight};\ncolor: ${color};`;
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }

    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      if (message.action === "activateTypography") {
        window.typographyMode = true;
        document.addEventListener("click", handleClick, true);
        createQuitButton();
      }
    });

    const modalStyles = {
      position: "absolute",
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "16px",
      zIndex: 10000,
      maxWidth: "425px",
      width: "425px",
      borderRadius: "8px",
      border: "1px solid lightgray",
      display: "flex",
      gap: "12px",
      flexDirection: "column",
    };

    const ModalTypographyTopPart = {
      flexDirection: "row",
      justifyContent: "space-between",
    };

    const divStyle = {
      display: "flex",
      flexDirection: "column",
    };

    const divStyleTest = {
      display: "grid",
      gridTemplateColumns: "1fr 1fr",
      gap: "8px",
    };

    const labelStyles = {
      fontSize: "14px",
      color: "gray",
    };

    const spanStyles = {
      color: "#21272a",
      fontSize: "16px",
    };

    const copyButtonStyles = {
      padding: "12px 16px",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      backgroundColor: "#007bff",
      color: "white",
      fontSize: "15px",
      fontWeight: "500",
      justifyContent: "space-between",
    };

    const closeButtonStyles = {
      border: "none",
      backgroundColor: "transparent",
    };
  }
})();
