"use strict"
function updateFontInputs(newFontSize, newLineHeight, newFontWeight) {
    let currentFont1Size = document.getElementById('input-1-size').value;
    let currentFont1Line = document.getElementById('input-1-line').value;
    let currentFont1Weight = document.getElementById('input-1-weight').value;
  
    let currentFont2Size = document.getElementById('input-2-size').value;
    let currentFont2Line = document.getElementById('input-2-line').value;
    let currentFont2Weight = document.getElementById('input-2-weight').value;
  
    document.getElementById('input-1-size').value = newFontSize;
    document.getElementById('input-1-line').value = newLineHeight;
    document.getElementById('input-1-weight').value = newFontWeight;
  
    document.getElementById('input-2-size').value = currentFont1Size;
    document.getElementById('input-2-line').value = currentFont1Line;
    document.getElementById('input-2-weight').value = currentFont1Weight;
  
    document.getElementById('input-3-size').value = currentFont2Size;
    document.getElementById('input-3-line').value = currentFont2Line;
    document.getElementById('input-3-weight').value = currentFont2Weight;
  }
  
  chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    if (request.action === "updateSelection") {
      updateFontInputs(request.data.fontSize, request.data.lineHeight, request.data.fontWeight);
      sendResponse({status: "Popup inputs updated"});
    }
  });
  
  document.addEventListener('DOMContentLoaded', function () {
    const activateButton = document.getElementById('activateButton');
  
    activateButton.addEventListener('click', function () {
        const isActive = activateButton.textContent.includes('Activate');
        
        chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {action: isActive ? "enable" : "disable"}, function(response) {
                // console.log(response);
            });
        });
  
        activateButton.textContent = isActive ? 'Disable on the tab' : 'Activate on the tab';
    });
  });

document.addEventListener('DOMContentLoaded', function () {
  chrome.storage.local.get(["fontData"], function(data) {
      if (data.fontData) {
            updateFontInputs(data.fontData.fontSize, data.fontData.lineHeight, data.fontData.fontWeight);
      }
  });

  // Save data on input change
  document.querySelectorAll('.inputContainer').forEach(input => {
      input.addEventListener('input', function() {
          const fontData = {};
          document.querySelectorAll('.inputContainer').forEach(input => {
              fontData[input.id] = input.value;
          });
          chrome.storage.local.set({fontData});
      });
  });
});

