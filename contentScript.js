document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    // Remove the canvas, zoom lens, and grid squares
    ["colorPickerCanvas", "zoomLens", "zoomGridSquares"].forEach((id) => {
      const element = document.getElementById(id);
      if (element) {
        element.remove();
      }
    });

    // Optionally, remove the event listener for mousemove if you added one for the zoom functionality
    document.removeEventListener("mousemove", handleMouseMove);
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
  const ctx = canvas.getContext("2d", { willreadfrequently: true });
  const img = new Image();

  img.onload = () => {
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    document.addEventListener("mousemove", (event) => {
      const x = event.clientX;
      const y = event.clientY;
      const pixel = ctx.getImageData(x, y, 1, 1, { willreadfrequently: true });
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
    console.log('grid')
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

  })

  img.src = dataUrl;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("messageContent", message);
  if (message.action === "capture") {
    activateZoom(message.screenshotUrl);
  }
});
