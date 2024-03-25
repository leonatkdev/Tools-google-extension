// // contentScript.js
// function injectCanvas() {
//   const canvas = document.createElement("canvas");
//   canvas.id = "colorPickerCanvas";
//   canvas.width = window.innerWidth;
//   canvas.height = window.innerHeight;
//   canvas.style.position = "fixed";
//   canvas.style.top = "0";
//   canvas.style.left = "0";
//   canvas.style.zIndex = "10000";
//   canvas.style.pointerEvents = "none";
//   document.body.appendChild(canvas);
//   return canvas.getContext("2d");
// }

// function activateZoom() {
//   chrome.runtime.sendMessage({action: "capturePage"}, (response) => {
//     const imageSrc = response.imageSrc;
//     const img = new Image();
//     img.src = imageSrc;
//     img.onload = () => {
//       const canvasContext = injectCanvas();
//       document.addEventListener("mousemove", function(e) {
//         canvasContext.clearRect(0, 0, window.innerWidth, window.innerHeight);
//         // Example zoom effect: draw the full page image at mouse location
//         canvasContext.drawImage(img, e.clientX - 100, e.clientY - 100, 200, 200, e.clientX - 50, e.clientY - 50, 100, 100);
//       });
//     };
//   });
// }

// chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
//   if (request.action === "activateZoom") {
//     activateZoom();
//   }
// });



// contentScript.js
function createZoomLens() {
  const lens = document.createElement("div");
  lens.id = "zoomLens";
  lens.style.position = "fixed";
  lens.style.border = "1px solid #000";
  lens.style.borderRadius = "50%"; // Circular lens
  lens.style.width = "200px"; // Adjust size as needed
  lens.style.height = "200px"; // Adjust size as needed
  lens.style.overflow = "hidden";
  lens.style.pointerEvents = "none"; // Ensure clicks pass through
  lens.style.zIndex = "10001";
  document.body.appendChild(lens);
  return lens;
}

function activateZoom() {
  const lens = createZoomLens();
  const img = new Image();
  chrome.runtime.sendMessage({action: "capturePage"}, (response) => {
    img.src = response.imageSrc;
    img.onload = () => {
      document.addEventListener("mousemove", function(e) {
        lens.style.left = `${e.clientX - lens.offsetWidth / 2}px`;
        lens.style.top = `${e.clientY - lens.offsetHeight / 2}px`;

        // Adjust the background image position based on the cursor
        const lensX = e.clientX - lens.offsetWidth / 2;
        const lensY = e.clientY - lens.offsetHeight / 2;
        lens.style.backgroundImage = `url('${img.src}')`;
        lens.style.backgroundSize = `${window.innerWidth * 2}px ${window.innerHeight * 2}px`; // Example zoom factor of 2
        lens.style.backgroundPosition = `-${lensX * 2 - 100}px -${lensY * 2 - 100}px`;
      });
    };
  });
}

chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if (request.action === "activateZoom") {
    activateZoom();
  }
});

