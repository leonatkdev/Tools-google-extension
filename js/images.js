document.addEventListener('DOMContentLoaded', function() {
  const addImage = document.getElementById('addImage');
  const upload = document.getElementById('upload');
  const downloadButton = document.getElementById('download-button');
  const canvasImgUploaded = document.getElementById('ImgUploaded');
  const ctxImgUploaded = canvasImgUploaded.getContext('2d');
  const statusContainer = document.getElementById('statusContainer');
  const fileNameDisplay = document.getElementById('fileName');
  const cancelButton = document.getElementById('cancelButton');
  const progressBar = document.getElementById('progressBar');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const originalWidth = document.getElementById('originalWidth');
  const originalHeight = document.getElementById('originalHeight');
  let originalImage = null;
  let resizedImage = null;
  let fileReader = null;
  let selectedFormat = 'original';
  let originalFileType = '';
  const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB in bytes

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
    if (file.size > MAX_FILE_SIZE) {
      alert('The file size exceeds the maximum limit of 100MB.');
      return;
    }

    fileReader = new FileReader();
    fileNameDisplay.textContent = file.name;
    statusContainer.style.display = 'flex';
    progressBar.value = 0;
    originalFileType = file.type.split('/')[1];

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
        originalWidth.textContent = img.width + ' PX';
        originalHeight.textContent = img.height + ' PX';
        drawImageWithObjectFit(ctxImgUploaded, img, 300, 150, 'contain');
        hideStatusMessage();
      };
      img.onerror = function() {
        showStatusMessage(`Error loading ${file.name}.`, true);
      };
      img.src = event.target.result;
      showStatusMessage(`${file.name}`);
      addImage.style.display = 'none';
    };

    fileReader.onerror = function() {
      showStatusMessage(`Error reading ${file.name}.`, true);
    };

    fileReader.readAsDataURL(file);
  }

  cancelButton.addEventListener('click', function() {
    if (fileReader) {
      fileReader.abort();
    }
    resetState();
  });

  document.getElementById('originalFormat').addEventListener('click', () => setFormat('original'));
  document.getElementById('pngFormat').addEventListener('click', () => setFormat('png'));
  document.getElementById('jpegFormat').addEventListener('click', () => setFormat('jpeg'));
  document.getElementById('webpFormat').addEventListener('click', () => setFormat('webp'));

  function setFormat(format) {
    selectedFormat = format;
    document.querySelectorAll('#format button').forEach(button => {
      button.style.background = '';
      button.style.color = '';
    });
    const selectedButton = document.getElementById(format + 'Format');
    selectedButton.style.background = '#4083F1';
    selectedButton.style.color = 'white';
  }

  // Handle download
  downloadButton.addEventListener('click', function() {
    const width = parseInt(widthInput.value, 10);
    const height = parseInt(heightInput.value, 10);

    if (originalImage && width && height) {
      const offscreenCanvas = document.createElement('canvas');
      const offscreenCtx = offscreenCanvas.getContext('2d');

      offscreenCanvas.width = width;
      offscreenCanvas.height = height;
      offscreenCtx.drawImage(originalImage, 0, 0, originalImage.width, originalImage.height, 0, 0, width, height);

      if (selectedFormat === 'jpeg') {
        resizedImage = offscreenCanvas.toDataURL('image/jpeg', 0.9); // Use quality parameter for JPEG
      } else if (selectedFormat === 'webp') {
        resizedImage = offscreenCanvas.toDataURL('image/webp', 0.9); // Use quality parameter for WebP
      } else if (selectedFormat === 'png') {
        resizedImage = offscreenCanvas.toDataURL('image/png');
      } else {
        resizedImage = offscreenCanvas.toDataURL(`image/${originalFileType}`);
      }

      const link = document.createElement('a');
      link.download = `resized-image.${selectedFormat === 'original' ? originalFileType : selectedFormat}`;
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
    // fileNameDisplay.textContent = '';
  }

  function drawImageWithObjectFit(ctx, img, canvasWidth, canvasHeight, fitType) {
    const imageAspectRatio = img.width / img.height;
    const canvasAspectRatio = canvasWidth / canvasHeight;
    let width, height, x, y;

    if (fitType === 'cover') {
      if (canvasAspectRatio > imageAspectRatio) {
        width = canvasWidth;
        height = canvasWidth / imageAspectRatio;
        x = 0;
        y = -(height - canvasHeight) / 2;
      } else {
        width = canvasHeight * imageAspectRatio;
        height = canvasHeight;
        x = -(width - canvasWidth) / 2;
        y = 0;
      }
    } else if (fitType === 'contain') {
      if (canvasAspectRatio > imageAspectRatio) {
        width = canvasHeight * imageAspectRatio;
        height = canvasHeight;
        x = (canvasWidth - width) / 2;
        y = 0;
      } else {
        width = canvasWidth;
        height = canvasWidth / imageAspectRatio;
        x = 0;
        y = (canvasHeight - height) / 2;
      }
    } else if (fitType === 'fill') {
      width = canvasWidth;
      height = canvasHeight;
      x = 0;
      y = 0;
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);
    ctx.drawImage(img, x, y, width, height);
  }

  function resetState() {
    // Reset variables
    originalImage = null;
    resizedImage = null;
    fileReader = null;
    selectedFormat = 'original';
    originalFileType = '';

    // Reset UI elements
    fileNameDisplay.textContent = '';
    progressBar.value = 0;
    widthInput.value = '';
    heightInput.value = '';
    originalWidth.textContent = '';
    originalHeight.textContent = '';
    addImage.style.display = 'flex';
    statusContainer.style.display = 'none';
    ctxImgUploaded.clearRect(0, 0, canvasImgUploaded.width, canvasImgUploaded.height);

    // Reset format buttons
    setFormat('original');
  }

  // Validate input values
  widthInput.addEventListener('input', validateInput);
  heightInput.addEventListener('input', validateInput);

  function validateInput(event) {
    const input = event.target;
    const value = input.value;

    // Remove non-digit characters
    const sanitizedValue = value.replace(/\D/g, '');

    // Ensure value is not negative and within valid range
    if (sanitizedValue !== '' && parseInt(sanitizedValue, 10) >= 0) {
      input.value = parseInt(sanitizedValue, 10);
      input.style.borderColor = ''; // Reset border color if valid
    } else {
      input.style.borderColor = 'red'; // Set border color to red if invalid
    }
  }
});
