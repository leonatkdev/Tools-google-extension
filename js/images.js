document.addEventListener('DOMContentLoaded', function() {
  const addImage = document.getElementById('addImage');
  const upload = document.getElementById('upload');
  const downloadButton = document.getElementById('download-button');
  const formatSelect = document.getElementById('diffFormatContainer');
  const autoDownloadCheckbox = document.getElementById('autoDownload');
  const canvasImgUploaded = document.getElementById('ImgUploaded');
  const ctxImgUploaded = canvasImgUploaded.getContext('2d');
  const statusContainer = document.getElementById('statusContainer');
  const fileNameDisplay = document.getElementById('fileName');
  const format =  document.getElementById('fileFormat');
  const cancelButton = document.getElementById('cancelButton');
  const imageInfoContainer = document.getElementById('imageInfoContainer');
  const widthInput = document.getElementById('width');
  const heightInput = document.getElementById('height');
  const originalWidth = document.getElementById('originalWidth');
  const originalHeight = document.getElementById('originalHeight');
  const sameAspectCheckbox = document.getElementById('aspectCheckbox');
  const sameAspectCheckboxSVGConatiner = document.querySelector('.linkContainerStyle');
  const zoomInButton = document.getElementById('zoomIn');
  const zoomOutButton = document.getElementById('zoomOut');
  let originalImage = null;
  let zoomFactor = 1;
  let dragStartX = 0, dragStartY = 0;
  let imgOffsetX = 0, imgOffsetY = 0;
  let isDragging = false;
  let fileReader = null;
  let selectedFormat = 'original';
  let originalFileType = '';
  const supportedFormats = ['jpeg', 'png', 'webp', 'svg+xml'];

  function updateIconVisibility() {
    if (sameAspectCheckbox.checked) {
      linkIcon.style.display = 'inline-block';
      unlinkIcon.style.display = 'none';
      sameAspectCheckboxSVGConatiner.style.background='#fff'
    } else {
      linkIcon.style.display = 'none';
      unlinkIcon.style.display = 'inline-block';
       sameAspectCheckboxSVGConatiner.style.background='#ededed'
    }
  }

  updateIconVisibility();

  // Zoom In
  zoomInButton?.addEventListener('click', function() {
    if (originalImage) {
      zoomFactor *= 1.1;
      drawZoomedImage();
    }
  });

  // Zoom Out
  zoomOutButton?.addEventListener('click', function() {
    if (originalImage) {
      zoomFactor /= 1.1;
      drawZoomedImage();
    }
  });

  // Handle dragging
  canvasImgUploaded.addEventListener('mousedown', function(event) {
    if (originalImage) {
      isDragging = true;
      dragStartX = event.clientX - imgOffsetX;
      dragStartY = event.clientY - imgOffsetY;
    }
  });

  canvasImgUploaded.addEventListener('mousemove', function(event) {
    if (isDragging) {
      imgOffsetX = event.clientX - dragStartX;
      imgOffsetY = event.clientY - dragStartY;
      drawZoomedImage();
    }
  });

  canvasImgUploaded.addEventListener('mouseup', function() {
    isDragging = false;
  });

  canvasImgUploaded.addEventListener('mouseleave', function() {
    isDragging = false;
  });



  sameAspectCheckbox.addEventListener('change', function() {
    updateIconVisibility();
    if (this.checked && originalImage) {
      const aspectRatio = originalImage.width / originalImage.height;
      heightInput.value = Math.round(widthInput.value / aspectRatio);
    }
  });

  
  sameAspectCheckboxSVGConatiner.addEventListener('click', function() {
    // Toggle the checkbox state
    sameAspectCheckbox.checked = !sameAspectCheckbox.checked;

    // Manually trigger the 'change' event
    sameAspectCheckbox.dispatchEvent(new Event('change'));
});


  widthInput.addEventListener('input', function() {
    if (sameAspectCheckbox.checked && originalImage) {
      const aspectRatio = originalImage.width / originalImage.height;
      heightInput.value = Math.round(this.value / aspectRatio);
    }
  });

  heightInput.addEventListener('input', function() {
    if (sameAspectCheckbox.checked && originalImage) {
      const aspectRatio = originalImage.height / originalImage.width;
      widthInput.value = Math.round(this.value / aspectRatio);
    }
  });

  function drawZoomedImage() {
    const canvasWidth = canvasImgUploaded.width;
    const canvasHeight = canvasImgUploaded.height;
    const scaledWidth = originalImage.width * zoomFactor;
    const scaledHeight = originalImage.height * zoomFactor;

    ctxImgUploaded.clearRect(0, 0, canvasWidth, canvasHeight);
    ctxImgUploaded.drawImage(
      originalImage,
      imgOffsetX, imgOffsetY, scaledWidth, scaledHeight // Draw with current offset
    );
  }

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

  
  function saveImageData(dataURL) {
    try {
      localStorage.setItem('savedImageData', dataURL);
      localStorage.setItem('savedImageFileName', fileNameDisplay.value);
      localStorage.setItem('savedImageFileType', originalFileType);
      localStorage.setItem('savedImageWidth', widthInput.value);
      localStorage.setItem('savedImageHeight', heightInput.value);
      // Save any other necessary state, like selectedFormat
      localStorage.setItem('savedSelectedFormat', selectedFormat);
    } catch (e) {
      console.error('Failed to save image data to localStorage:', e);
    }
  }

  const savedImageData = localStorage.getItem('savedImageData');
  if (savedImageData) {
    const img = new Image();
    img.onload = function() {
      originalImage = img;
      widthInput.value = localStorage.getItem('savedImageWidth') || img.width;
      heightInput.value = localStorage.getItem('savedImageHeight') || img.height;
      originalWidth.textContent = img.width + ' PX';
      originalHeight.textContent = img.height + ' PX';
      fileNameDisplay.value = localStorage.getItem('savedImageFileName') || 'Saved Image';
      format.textContent = localStorage.getItem('savedImageFileType') || '';
      selectedFormat = localStorage.getItem('savedSelectedFormat') || 'original';
      setFormat(selectedFormat);
      drawImageWithObjectFit(ctxImgUploaded, img, 350, 175, 'contain');

      statusContainer.style.display = 'flex';
      imageInfoContainer.style.display = 'flex';
      addImage.style.display = 'none';
    };
    img.onerror = function() {
      console.error('Failed to load saved image.');
      resetState();
    };
    img.src = savedImageData;
  }
  

  function handleFileUpload(file) {
    const fileType = file.type.split('/')[1];
    if (!supportedFormats.includes(fileType)) {
      alert("Format not supported");
      return;
    }
  
    fileReader = new FileReader();
    fileNameDisplay.value = file.name;
    format.textContent = fileType;
    statusContainer.style.display = 'flex';
    imageInfoContainer.style.display = 'flex';
    originalFileType = fileType;
  
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
        drawImageWithObjectFit(ctxImgUploaded, img, 350, 175, 'contain');
        hideStatusMessage();
  
        // Save image data to localStorage
        saveImageData(event.target.result);
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

  // Add event listener for the change event
  formatSelect.addEventListener('change', (event) => {
    const selectedFormat = event.target.value.toLowerCase(); // Get selected value and convert to lowercase
    setFormat(selectedFormat); // Call setFormat with the selected format
  });

  function setFormat(format) {
    selectedFormat = format;
    document.querySelectorAll('#format button').forEach(button => {
      button.style.background = '';
      button.style.color = '';
    });
    const selectedButton = document.getElementById(format + 'Format');
    if(selectedButton){
    selectedButton.style.background = '#6467f2';
    selectedButton.style.color = 'white';
    }
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

      let resizedImage;
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
      link.href = resizedImage;

      if (autoDownloadCheckbox.checked) {
        link.download = `resized-image.${selectedFormat === 'original' ? originalFileType : selectedFormat}`;
      } else {
        const fileName = prompt('Please enter the file name', 'resized-image');
        if (fileName) {
          link.download = `${fileName}.${selectedFormat === 'original' ? originalFileType : selectedFormat}`;
        } else {
          // Exit if the user cancels the prompt
          return;
        }
      }

      link.click();
    } else {
      alert('Please resize the image first.');
    }
  });

  function showStatusMessage(message, isError = false) {
    fileNameDisplay.value = message;
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
  fileNameDisplay.value = '';
  widthInput.value = '';
  heightInput.value = '';
  originalWidth.textContent = '';
  originalHeight.textContent = '';
  addImage.style.display = 'flex';
  addImage.style.backgroundColor = ''; // Reset background color
  statusContainer.style.display = 'none';
  imageInfoContainer.style.display = 'none';
  ctxImgUploaded.clearRect(0, 0, canvasImgUploaded.width, canvasImgUploaded.height);

  // Reset format buttons
  setFormat('original');

  // Clear saved image data
  localStorage.removeItem('savedImageData');
  localStorage.removeItem('savedImageFileName');
  localStorage.removeItem('savedImageFileType');
  localStorage.removeItem('savedImageWidth');
  localStorage.removeItem('savedImageHeight');
  localStorage.removeItem('savedSelectedFormat');
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
