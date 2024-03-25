// Injects the canvas and lens into the webpage
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
  document.body.appendChild(lens);

  return { canvas, lens };
}

// Activates the zoom and color picking functionality
function activateZoom(dataUrl) {
  console.log("dataUrl", dataUrl);
  const { canvas, lens } = injectUI();
  const ctx = canvas.getContext("2d", { willreadfrequently: true });
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
      lens.style.backgroundImage = `url('${dataUrl}')`;
      lens.style.backgroundSize = `${canvas.width * 2}px ${
        canvas.height * 2
      }px`;
      lens.style.backgroundPosition = `-${x * 2 - lens.offsetWidth / 2}px -${
        y * 2 - lens.offsetHeight / 2
      }px`;

      console.log(rgba); // Log or use the RGBA value as needed
    });
  };
  img.src = dataUrl;
}

// activateZoom()

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("messageContent", message);
  if (message.action === "capture") {
    activateZoom(message.screenshotUrl);
  }
});
