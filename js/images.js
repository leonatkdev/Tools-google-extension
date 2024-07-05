document.addEventListener('DOMContentLoaded', function() {
  const addImage = document.getElementById('addImage');
  const upload = document.getElementById('upload');
  const resizeButton = document.getElementById('resize-button');
  const downloadButton = document.getElementById('download-button');
  const canvas = document.getElementById('Imagecanvas');
  const ctx = canvas.getContext('2d');
  const statusContainer = document.getElementById('statusContainer');
  const fileNameDisplay = document.getElementById('fileName');
  const cancelButton = document.getElementById('cancelButton');
  const progressBar = document.getElementById('progressBar');
  const formatSelect = document.getElementById('format');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const originalWidth = document.getElementById('originalWidth');
  const originalHeight = document.getElementById('originalHeight');
  let originalImage = null;
  let resizedImage = null;
  let fileReader = null;

  // Handle drag and drop
  addImage.addEventListener('dragover', function(event) {
    event.preventDefault();
    event.stopPropagation();
    addImage.classList.add('dragover');
  });

  addImage.addEventListener('dragleave', function(event) {
    event.preventDefault();
    event.stopPropagation();
    addImage.classList.remove('dragover');
  });

  addImage.addEventListener('drop', function(event) {
    event.preventDefault();
    event.stopPropagation();
    addImage.classList.remove('dragover');
    const files = event.dataTransfer.files;
    if (files.length) {
      handleFileUpload(files[0]);
    }
  });

  // Handle file select
  addImage.querySelector('.fileSelectImage').addEventListener('click', function() {
    upload.click();
  });

  upload.addEventListener('change', function(event) {
    const files = event.target.files;
    if (files.length) {
      handleFileUpload(files[0]);
    }
  });

  function handleFileUpload(file) {
    fileReader = new FileReader();
    fileNameDisplay.textContent = file.name;
    statusContainer.style.display = 'flex';
    progressBar.value = 0;

    fileReader.onprogress = function(event) {
      if (event.lengthComputable) {
        const percentLoaded = Math.round((event.loaded / event.total) * 100);
        progressBar.value = percentLoaded;
      }
    };

    fileReader.onloadstart = function() {
      showStatusMessage(`Uploading ${file.name}...`);
    };

    fileReader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        originalImage = img;
        widthInput.value = img.width;
        heightInput.value = img.height;
        originalWidth.textContent = img.width;
        originalHeight.textContent = img.height;
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0, img.width, img.height);
        hideStatusMessage();
      }
      img.onerror = function() {
        showStatusMessage(`Error loading ${file.name}.`, true);
      }
      img.src = event.target.result;
    };

    fileReader.onerror = function() {
      showStatusMessage(`Error reading ${file.name}.`, true);
    };

    fileReader.readAsDataURL(file);
  }

  cancelButton.addEventListener('click', function() {
    if (fileReader) {
      fileReader.abort();
      hideStatusMessage();
      statusContainer.style.display = 'none';
    }
  });

  // Handle resize
  resizeButton.addEventListener('click', function() {
    const width = parseInt(widthInput.value, 10);
    const height = parseInt(heightInput.value, 10);
    const format = formatSelect.value;
    if (originalImage && width && height) {
      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d');

      offscreenCanvas.width = originalImage.width;
      offscreenCanvas.height = originalImage.height;
      offscreenCtx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height);

      canvas.width = width;
      canvas.height = height;
      ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(offscreenCanvas, 0, 0, originalImage.width, originalImage.height, 0, 0, width, height);

      if (format === 'jpeg') {
        resizedImage = canvas.toDataURL('image/jpeg', 0.9); // Use quality parameter for JPEG
      } else if (format === 'webp') {
        resizedImage = canvas.toDataURL('image/webp', 0.9); // Use quality parameter for WebP
      } else {
        resizedImage = canvas.toDataURL('image/png');
      }
    }
  });

  // Handle download
  downloadButton.addEventListener('click', function() {
    if (resizedImage) {
      const format = formatSelect.value;
      const link = document.createElement('a');
      link.download = `resized-image.${format}`;
      link.href = resizedImage;
      link.click();
    } else {
      alert('Please resize the image first.');
    }
  });

  function showStatusMessage(message, isError = false) {
    fileNameDisplay.textContent = message;
    fileNameDisplay.style.color = isError ? 'red' : 'black';
  }

  function hideStatusMessage() {
    fileNameDisplay.textContent = '';
  }
});
