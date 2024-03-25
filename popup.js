document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('.header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            content.style.display = content.style.display === 'flex' ? 'none' : 'flex';
            header.classList.toggle('active');
        });
    });
});

document.getElementById('toggleButton').addEventListener('click', function() {
    var versionsContainer = document.getElementById('versionsContainer');
    if (versionsContainer.style.display === "none" || versionsContainer.style.display === "") {
        versionsContainer.style.display = "flex";
    } else {
        versionsContainer.style.display = "none";
    }
});


// document.getElementById('pickColor').addEventListener('click', function() {
//     console.log('clicked')
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//       chrome.tabs.sendMessage(tabs[0].id, {action: "activateZoom"});
//     });
//   });


document.getElementById('pickColor').addEventListener('click', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        // This sends a message to the background script to capture the screen
        chrome.runtime.sendMessage({action: "capturePage", tabId: tabs[0].id});
    });
});