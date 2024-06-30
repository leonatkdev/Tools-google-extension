document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    ["colorPickerCanvas", "zoomLens", "zoomGridSquares", "colorPickerOverlay"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });

    document.removeEventListener("mousemove", () => {});
  }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("messageContent", message);
  if (message.action === "capture") {
    activateZoom(message.screenshotUrl);
  }
});

function injectUI() {
  if (document.getElementById("colorPickerCanvas")) return;

  const overlay = document.createElement("div");
  overlay.id = "colorPickerOverlay";
  overlay.style.cssText = "position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 999998; background: rgba(0, 0, 0, 0.5); pointer-events: none;";
  document.body.appendChild(overlay);

  const canvas = document.createElement("canvas");
  canvas.id = "colorPickerCanvas";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.cssText = "position: fixed; top: 0; left: 0; z-index: 999999; pointer-events: none;";
  document.body.appendChild(canvas);

  const lens = document.createElement("div");
  lens.id = "zoomLens";
  lens.style.cssText = "position: fixed; border: 1px solid #000; border-radius: 50%; width: 100px; height: 100px; overflow: hidden; pointer-events: none; z-index: 100000000; background-position: center;";
  document.body.appendChild(lens);

  const gridSquares = document.createElement("div");
  gridSquares.id = "zoomGridSquares";
  gridSquares.style.cssText = "overflow: hidden; z-index: 100000000; width: 100px; height: 100px; border-radius: 50%; position: fixed; background-position: center;";
  gridSquares.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='12' height='12' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='1' width='10' height='10' fill='transparent'/%3E%3C/svg%3E")`;
  gridSquares.style.backgroundSize = `10px 10px`;
  gridSquares.style.backgroundPosition = `5px 5px`;
  document.body.appendChild(gridSquares);

  gridSquares.innerHTML += `
    <style>
      #zoomGridSquares::after {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        width: 10px;
        height: 10px;
        border: 2px solid red; /* Change color as needed */
      }
    </style>
  `;

  return { canvas, lens, gridSquares, overlay };
}

function updateZoomLensPosition(event) {
  const x = event.clientX;
  const y = event.clientY;
  const lens = document.getElementById("zoomLens");
  const gridSquares = document.getElementById("zoomGridSquares");

  // Adjust these offsets based on your specific UI needs
  const offsetX = x + 150 + 100 > window.innerWidth ? -150 : 150; // Adjusts to not overflow the screen
  const offsetY = y + 100 + 100 > window.innerHeight ? -100 : 100; // Adjusts to not overflow the screen

  if (!lens || !gridSquares) return;

  lens.style.left = `${x - lens.offsetWidth / 2 + offsetX}px`;
  lens.style.top = `${y - lens.offsetHeight / 2 + offsetY}px`;

  gridSquares.style.left = `${x - gridSquares.offsetWidth / 2 + offsetX}px`;
  gridSquares.style.top = `${y - gridSquares.offsetHeight / 2 + offsetY}px`;
}

function updateZoomBackground(canvas, lens, x, y, dataUrl) {
  const scaleFactor = 10; // Adjust based on desired zoom level
  const offsetX = x * scaleFactor - lens.offsetWidth / 2;
  const offsetY = y * scaleFactor - lens.offsetHeight / 2;
  const backgroundImage = `url('${dataUrl}')`;

  lens.style.backgroundImage = `${backgroundImage}`;
  lens.style.backgroundSize = `${canvas.width * scaleFactor}px ${canvas.height * scaleFactor}px`;
  lens.style.backgroundPosition = `-${offsetX}px -${offsetY}px`;
}

function activateZoom(dataUrl) {
  const { canvas, lens, gridSquares, overlay } = injectUI();
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  const img = new Image();
  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    document.addEventListener("mousemove", (event) => {
      const x = event.clientX;
      const y = event.clientY;

      updateZoomLensPosition(event);
      updateZoomBackground(canvas, lens, x, y, dataUrl);
    });

    document.addEventListener("click", (event) => {
      event.preventDefault(); // Prevent default click behavior
      console.log("click");
      const x = event.clientX;
      const y = event.clientY;
      const pixel = ctx.getImageData(x, y, 1, 1);
      const data = pixel.data;
      const hex = "#" + ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2]).toString(16).slice(1);

      console.log("hex", hex);

      chrome.runtime.sendMessage({ type: "colorPicked", color: hex });

      ["colorPickerCanvas", "zoomLens", "zoomGridSquares", "colorPickerOverlay"].forEach((id) => {
        const element = document.getElementById(id);
        if (element) {
          element.remove();
        }
      });
    });
  };

  img.src = dataUrl;
}


// document.addEventListener("keydown", function (event) {
//   if (event.key === "Escape") {
//     ["colorPickerCanvas", "zoomLens", "zoomGridSquares"].forEach((id) => {
//       const element = document.getElementById(id);
//       if (element) {
//         element.remove();
//       }
//     });

//     document.removeEventListener("mousemove", () => {});
//   }
// });

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("messageContent", message);
//   if (message.action === "capture") {
//     activateZoom(message.screenshotUrl);
//   }
// });

// function injectUI() {
//   if (document.getElementById("colorPickerCanvas")) return;

//   const canvas = document.createElement("canvas");
//   canvas.id = "colorPickerCanvas";
//   canvas.width = window.innerWidth;
//   canvas.height = window.innerHeight;
//   canvas.style.cssText =
//     "position: fixed; top: 0; left: 0; z-index: 999999; pointer-events: none;";
//   document.body.appendChild(canvas);

//   const lens = document.createElement("div");
//   lens.id = "zoomLens";
//   lens.style.cssText =
//     "position: fixed; border: 1px solid #000; border-radius: 50%; width: 100px; height: 100px; overflow: hidden; pointer-events: none; z-index: 100000000;  background-position: center;";

//   document.body.appendChild(lens);

//   const gridSquares = document.createElement("div");
//   gridSquares.id = "zoomGridSquares";
//   gridSquares.style.cssText =
//     "overflow: hidden; z-index: 100000000; width: 100px; height: 100px; border-radius: 50%; position: fixed;  background-position: center;";
//   gridSquares.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='12' height='12' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='1' width='10' height='10' fill='transparent'/%3E%3C/svg%3E")`;
//   gridSquares.style.backgroundSize = `10px 10px`;
//   gridSquares.style.backgroundPosition = `5px 5px`;
//   document.body.appendChild(gridSquares);

//   // gridSquares.style.position = "relative";
//   gridSquares.innerHTML += `
//     <style>
//       #zoomGridSquares::after {
//         content: '';
//         position: absolute;
//         top: 50%;
//         left: 50%;
//         transform: translate(-50%, -50%);
//         width: 10px;
//         height: 10px;
//         border: 2px solid red; /* Change color as needed */
//       }
//     </style>
//   `;

//   return { canvas, lens, gridSquares };
// }

// function updateZoomLensPosition(event) {
//   const x = event.clientX;
//   const y = event.clientY;
//   const lens = document.getElementById("zoomLens");
//   const gridSquares = document.getElementById("zoomGridSquares");

//   // Adjust these offsets based on your specific UI needs
//   const offsetX = x + 150 + 100 > window.innerWidth ? -150 : 150; // Adjusts to not overflow the screen
//   const offsetY = y + 100 + 100 > window.innerHeight ? -100 : 100; // Adjusts to not overflow the screen

//   if (!lens || !gridSquares) return;

//   lens.style.left = `${x - lens.offsetWidth / 2 + offsetX}px`;
//   lens.style.top = `${y - lens.offsetHeight / 2 + offsetY}px`;

//   gridSquares.style.left = `${x - gridSquares.offsetWidth / 2 + offsetX}px`;
//   gridSquares.style.top = `${y - gridSquares.offsetHeight / 2 + offsetY}px`;
// }

// function updateZoomBackground(canvas, lens, x, y, dataUrl) {
//   const scaleFactor = 10; // Adjust based on desired zoom level
//   const offsetX = x * scaleFactor - lens.offsetWidth / 2;
//   const offsetY = y * scaleFactor - lens.offsetHeight / 2;
//   const backgroundImage = `url('${dataUrl}')`;

//    lens.style.backgroundImage = `${backgroundImage}`;
//   lens.style.backgroundSize = `${canvas.width * scaleFactor}px ${
//     canvas.height * scaleFactor
//   }px`;
//   lens.style.backgroundPosition = `-${offsetX}px -${offsetY}px`;
// }

// function activateZoom(dataUrl) {
//   const { canvas, lens, gridSquares } = injectUI();
//   const ctx = canvas.getContext("2d", { willReadFrequently: true });
//   const img = new Image();
//   img.onload = () => {
//     ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

//     document.addEventListener("mousemove", (event) => {
//       const x = event.clientX;
//       const y = event.clientY;

//       updateZoomLensPosition(event);
//       updateZoomBackground(canvas, lens, x, y, dataUrl);
//     });

//   };

//   document.addEventListener("click", (event) => {
//     console.log("click");
//     const x = event.clientX;
//     const y = event.clientY;
//     const pixel = ctx.getImageData(x, y, 1, 1);
//     const data = pixel.data;
//     const hex =
//       "#" +
//       ((1 << 24) + (data[0] << 16) + (data[1] << 8) + data[2])
//         .toString(16)
//         .slice(1);

//     console.log("hex", hex);

//     chrome.runtime.sendMessage({ type: "colorPicked", color: hex });

//     ["colorPickerCanvas", "zoomLens", "zoomGridSquares"].forEach((id) => {
//       const element = document.getElementById(id);
//       if (element) {
//         element.remove();
//       }
//     });
//   });

//   img.src = dataUrl;
// }

