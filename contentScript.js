document.addEventListener('keydown', function(event) {
  if (event.key === "Escape") {
      // Remove the canvas
      const canvas = document.getElementById('colorPickerCanvas');
      if (canvas) {
          canvas.remove();
      }
      
      // Remove the zoom lens div
      const zoomLens = document.getElementById('zoomLens');
      if (zoomLens) {
          zoomLens.remove();
      }
      
      // Optionally, remove the event listener for mousemove if you added one for the zoom functionality
      document.removeEventListener('mousemove', handleMouseMove);
  }
});


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
  lens.style.backgroundImage = `url("data:image/svg+xml,%3Csvg width='12' height='12' xmlns='http://www.w3.org/2000/svg'%3E%3Crect x='0' y='0' width='12' height='12' fill='none' stroke='black' stroke-width='1'/%3E%3Crect x='1' y='1' width='10' height='10' fill='transparent'/%3E%3C/svg%3E")`;
  lens.style.backgroundPosition = "center";
  document.body.appendChild(lens);

  return { canvas, lens };
}

// Activates the zoom and color picking functionality
function activateZoom(dataUrl) {
  const { canvas, lens } = injectUI();
  const ctx = canvas.getContext("2d", { willreadfrequently: true });
  const img = new Image();


  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    document.addEventListener("mousemove", (event) => {
      const x = event.clientX;
      const y = event.clientY;
      const pixel = ctx.getImageData(x, y, 1, 1, {willreadfrequently: true});
      const data = pixel.data;
      const rgba = `rgba(${data[0]}, ${data[1]}, ${data[2]}, ${data[3] / 255})`;

      // Update the lens position and background for zoom effect
      lens.style.left = `${x - lens.offsetWidth / 2}px`;
      lens.style.top = `${y - lens.offsetHeight / 2}px`;
      
      // The zoomed image as the background
      const backgroundImage = `url('${dataUrl}')`;
      const backgroundSize = `${canvas.width * 20}px ${canvas.height * 20}px`;
      const backgroundPosition = `-${x * 20 - lens.offsetWidth / 20}px -${y * 20 - lens.offsetHeight / 20}px`;

      // SVG grid pattern
      // const gridPattern = "data:image/svg+xml,%3Csvg width='30' height='30' xmlns='http://www.w3.org/2000/svg'%3E%3Crect width='30' height='30' fill='black'/%3E%3C/svg%3E";

      // Layering the grid pattern over the zoomed background
      lens.style.backgroundImage = `${backgroundImage}`;
      lens.style.backgroundSize = `${backgroundSize}, 100px 100px`;
      lens.style.backgroundPosition = `${backgroundPosition}, 0 0`;

      console.log(rgba); // Log or use the RGBA value as needed
    });
  };
    img.src = dataUrl;
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("messageContent", message);
  if (message.action === "capture") {
    activateZoom(message.screenshotUrl);
  }
});
