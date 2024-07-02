document.addEventListener("DOMContentLoaded", () => {
  const uploadInput = document.getElementById("upload");
  const widthInput = document.getElementById("width");
  const heightInput = document.getElementById("height");
  const canvas = document.getElementById("Imagecanvas");
  const ctx = canvas.getContext("2d");
  const resizeButton = document.getElementById("resize-button");
  const downloadButton = document.getElementById("download-button");
  const addImageContainer = document.querySelector(".addImage");
  const fileSelectButton = document.querySelector(".fileSelectImage");
  let originalImage = new Image();
  let originalWidth, originalHeight;

  // Handle file input click
  fileSelectButton.addEventListener("click", () => {
    uploadInput.click();
  });

  // Handle image upload
  uploadInput.addEventListener("change", (e) => {
    handleFileUpload(e.target.files[0]);
  });

  // Handle drag and drop
  addImageContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    addImageContainer.classList.add("drag-over");
  });

  addImageContainer.addEventListener("dragleave", (e) => {
    e.preventDefault();
    addImageContainer.classList.remove("drag-over");
  });

  addImageContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    addImageContainer.classList.remove("drag-over");
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  });

  // Handle file upload
  function handleFileUpload(file) {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        originalImage.onload = () => {
          originalWidth = originalImage.width;
          originalHeight = originalImage.height;
          canvas.width = originalWidth;
          canvas.height = originalHeight;
          ctx.drawImage(originalImage, 0, 0, originalWidth, originalHeight);
          widthInput.value = originalWidth;
          heightInput.value = originalHeight;
        };
        originalImage.src = event.target.result;
      };
      reader.readAsDataURL(file);
    } else {
      alert("Unsupported file type. Please upload an image file.");
    }
  }

  // Handle resizing the image
  resizeButton.addEventListener("click", () => {
    const newWidth = parseInt(widthInput.value) || originalWidth;
    const newHeight = parseInt(heightInput.value) || originalHeight;

    canvas.width = newWidth;
    canvas.height = newHeight;
    ctx.drawImage(originalImage, 0, 0, newWidth, newHeight);
  });

  // Handle downloading the resized image
  downloadButton.addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "resized-image.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  });
});
