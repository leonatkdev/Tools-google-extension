"use strict";

///Images uploaded
document.getElementById("upload").addEventListener("change", handleImageUpload);
document.getElementById("resize-button").addEventListener("click", resizeImage);
document
  .getElementById("download-button")
  .addEventListener("click", downloadImage);

let originalImage = new Image();

function handleImageUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function (e) {
    originalImage.src = e.target.result;
    document.getElementById("preview").src = e.target.result;
    document.getElementById("download-button").classList.add("hidden");
  };

  reader.readAsDataURL(file);
}

function resizeImage() {
  const width = document.getElementById("width").value;
  const height = document.getElementById("height").value;
  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = width;
  canvas.height = height;

  // Set image smoothing quality to high
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";

  ctx.drawImage(originalImage, 0, 0, width, height);

  document.getElementById("preview").src = canvas.toDataURL();
  document.getElementById("download-button").classList.remove("hidden");
}

function downloadImage() {
  const canvas = document.getElementById("canvas");
  const link = document.createElement("a");

  link.download = "resized-image.png";
  link.href = canvas.toDataURL();
  link.click();
}
