document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    ["colorPickerCanvas", "zoomLens", "zoomGridSquares"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });

    //document.removeEventListener("mousemove", handleMouseMove);
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

      // SVG grid pattern
      // const gridPattern = "data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='30' height='30' fill='black'/%3E%3C/svg%3E";

      // Layering the grid pattern over the zoomed background
      lens.style.backgroundImage = `${backgroundImage}`;
      lens.style.backgroundSize = `${backgroundSize}, 100px 100px`;
      lens.style.backgroundPosition = `${backgroundPosition}, 0 0`;

      gridSquares.style.left = `${x - lens.offsetWidth / 2}px`;
      gridSquares.style.top = `${y - lens.offsetHeight / 2}px`;
      gridSquares.style.backgroundSize = `10px 10px`;
      gridSquares.style.backgroundPosition = `3px 3px`;

      // console.log(rgba); // Log or use the RGBA value as needed
    });
  };

  // canvas.addEventListener("click", function (event) {
  //   console.log("click");
  //   const x = event.clientX;
  //   const y = event.clientY;
  //   const pixel = ctx.getImageData(x, y, 1, 1);
  //   const data = pixel.data;
  //   const hex =
  //     "#" +
  //     ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2])
  //       .toString(16)
  //       .slice(1);

  //   // Send message to background script
  //   chrome.runtime.sendMessage({ type: "colorPicked", color: hex });
  // });

  // lens.addEventListener("click", function (event) {
  //   console.log('lens')
  // })

  gridSquares.addEventListener("click", function (event) {
    console.log("grid");
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



let isExtensionActive = false;

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "enable") {
        isExtensionActive = true;
        sendResponse({status: "Extension enabled"});
    } else if (request.action === "disable") {
        isExtensionActive = false;
        sendResponse({status: "Extension disabled"});
    }
});


document.addEventListener("mouseup", function (e) {
  if (!isExtensionActive) return; 
  let selection = window.getSelection();
  if (!selection.rangeCount) return; // No selection made
  
  let style = window.getComputedStyle(selection.anchorNode.parentElement);
  let fontSize = style.fontSize;
  let fontWeight = style.fontWeight;
  let lineHeight = style.lineHeight;

  chrome.runtime.sendMessage({
    action: "updateSelection",
    data: {
      fontSize: fontSize,
      fontWeight: fontWeight,
      lineHeight: lineHeight,
    },
  });
});

/// Tooltip
document.addEventListener("mouseup", function (e) {
  if (!isExtensionActive) return; 

  let selection = window.getSelection();
  let selectedText = selection.toString();
  if (selectedText.length > 0) {
    // Get the selection's properties
    let style = window.getComputedStyle(selection.anchorNode.parentNode);
    let fontSize = style.fontSize;
    let fontWeight = style.fontWeight;
    let lineHeight = style.lineHeight;

    // Create or update tooltip
    let tooltip = document.getElementById("extension-tooltip");
    let textSpan = document.createElement("span");
    let actionButton = document.createElement("button");

    if (tooltip) {
      
    } 

    if (!tooltip) {
      tooltip = document.createElement("div");
      tooltip.id = "extension-tooltip";
      tooltip.style.position = "absolute";
      tooltip.style.zIndex = "10000";
      tooltip.style.backgroundColor = "#FFF";
      tooltip.style.border = "1px solid #000";
      tooltip.style.borderRadius = "24px";
      tooltip.style.fontSize = "12px";
      tooltip.style.fontFamily = "Arial, sans-serif";
      document.body.appendChild(tooltip);

      textSpan.style.padding = "6px 12px";
      textSpan.style.display = "block";
      textSpan.textContent = `Size: ${fontSize}, Weight: ${fontWeight}, Line: ${lineHeight}`;

      actionButton.textContent = "Save";
      actionButton.style.border = "none";
      actionButton.style.borderTopRightRadius = "24px";
      actionButton.style.borderBottomRightRadius = "24px";
      actionButton.style.backgroundColor = "#007bff";
      actionButton.style.color = "white";
      // Handle button click event
      actionButton.onclick = function () {
        console.log("Button clicked!");
      };
    }

    actionButton.onclick = function () {
      if (!isExtensionActive) return; // Stop if the extension is not active

      let dataToSend = {
        fontSize: fontSize,
        lineHeight: lineHeight,
        fontWeight: fontWeight,
      };

      chrome.runtime.sendMessage(dataToSend, function (response) {
        console.log("Response from extension:", response);
      });
    };

    // Set the tooltip text

    // Append elements to the tooltip
    tooltip.appendChild(textSpan);
    tooltip.appendChild(actionButton);

    // Position the tooltip
    let rect = selection.getRangeAt(0).getBoundingClientRect();
    let top = window.scrollY + rect.top - tooltip.offsetHeight - 5; // 5px above the selection
    let left =
      window.scrollX + rect.left + (rect.width - tooltip.offsetWidth) / 2; // Centered above the selection
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;

    // Show the tooltip
    tooltip.style.display = "flex";
  } else {
    // Hide the tooltip if there's no selection
    let tooltip = document.getElementById("extension-tooltip");
    if (tooltip) {
      tooltip.style.display = "none";
    }
  }
});



// document.addEventListener("mouseup", function (e) {
//   let selection = window.getSelection();
//   let selectedText = selection.toString();
//   if (selectedText.length > 0) {
//     let style = window.getComputedStyle(selection.anchorNode.parentNode);
//     let fontSize = style.fontSize;
//     let fontWeight = style.fontWeight;
//     let lineHeight = style.lineHeight;

//     let tooltip = document.getElementById("extension-tooltip");
//     if (tooltip) {
//       tooltip.innerHTML = '';
//     } else {
//       tooltip = document.createElement("div");
//       tooltip.id = "extension-tooltip";
//     }

//     let textSpan = document.createElement("span");
//     textSpan.textContent = `Size: ${fontSize}, Weight: ${fontWeight}, Line: ${lineHeight}`;
//     tooltip.appendChild(textSpan);


//     if (!document.body.contains(tooltip)) {
//       document.body.appendChild(tooltip);
//     }

//     positionTooltip(selection, tooltip);

//     tooltip.style.display = "flex";
//   } else {
//     let tooltip = document.getElementById("extension-tooltip");
//     if (tooltip) {
//       tooltip.style.display = "none";
//     }
//   }
// });

// function positionTooltip(selection, tooltip) {
//   let rect = selection.getRangeAt(0).getBoundingClientRect();
//   let top = window.scrollY + rect.top - tooltip.offsetHeight - 5; 
//   let left = window.scrollX + rect.left + (rect.width - tooltip.offsetWidth) / 2;
//   tooltip.style.top = `${top}px`;
//   tooltip.style.left = `${left}px`;
// }
