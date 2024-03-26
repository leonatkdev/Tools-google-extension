document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll(".header");

  headers.forEach((header) => {
    header.addEventListener("click", () => {
      const content = header.nextElementSibling;
      content.style.display =
        content.style.display === "flex" ? "none" : "flex";
      header.classList.toggle("active");
    });
  });

  document.querySelectorAll(".versionBtn").forEach((button) => {
    button.addEventListener("click", function () {
      const parentDiv = this.closest('div[style*="flex-direction: column"]');
      const inputs = parentDiv.querySelectorAll('input[type="text"]');
      inputs.forEach((input) => input.classList.toggle("showInput"));
    });
  });


const hex = document.querySelector("#hex");


hex.addEventListener("input", function () {
  const hexValue = hex.value;
  const rgbaValue = hexToRgba(hexValue);
  const hslValue = rgbaToHsl(
    rgbaValue.r,
    rgbaValue.g,
    rgbaValue.b,
    rgbaValue.a
  );
  const rgba = `rgba(${rgbaValue.r}, ${rgbaValue.g}, ${rgbaValue.b}, ${rgbaValue.a})`;
  const hsl = `hsl(${hslValue[0]}, ${hslValue[1]}%, ${hslValue[2]}%, ${hslValue[3]})`;

  document.querySelector("#rgba").value = rgba;
  document.querySelector("#hsl").value = hsl;
});
});

document.getElementById("toggleButton").addEventListener("click", function () {
  var versionsContainer = document.getElementById("versionsContainer");
  if (
    versionsContainer.style.display === "none" ||
    versionsContainer.style.display === ""
  ) {
    versionsContainer.style.display = "flex";
  } else {
    versionsContainer.style.display = "none";
  }
});

document.getElementById("pickColor").addEventListener("click", function () {
  console.log("click");
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    // This sends a message to the background script to capture the screen
    chrome.runtime.sendMessage({ action: "capturePage", tabId: tabs[0].id });
  });
});


function hexToRgba(hex) {
    const hexValue = hex.replace("#", "");
    const r = parseInt(hexValue.substring(0, 2), 16);
    const g = parseInt(hexValue.substring(2, 4), 16);
    const b = parseInt(hexValue.substring(4, 6), 16);
    const a = parseInt(hexValue.substring(6, 8), 16) / 255 || 1;
    
    return { r, g, b, a };
}

function rgbaToHex(r, g, b, a) {
  return (
    "#" +
    [r, g, b]
      .map((x) => {
        const hex = x.toString(16);
        return hex.length === 1 ? "0" + hex : hex;
      })
      .join("") +
    Math.round(a * 255)
      .toString(16)
      .padStart(2, "0")
  );
}

function rgbaToHsl(r, g, b, a) {
  (r /= 255), (g /= 255), (b /= 255);
  const max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    l = (max + min) / 2;

  if (max === min) {
    h = s = 0; // achromatic
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return [h * 360, s * 100, l * 100, a];
}

