document.addEventListener('DOMContentLoaded', () => {
    const headers = document.querySelectorAll('.header');

    headers.forEach(header => {
        header.addEventListener('click', () => {
            const content = header.nextElementSibling;
            console.log('content', content )
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

document.getElementById('pickColor').addEventListener('click', function() {
    console.log('activateZoom')
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
        chrome.tabs.sendMessage(tabs[0].id, {action: "activateZoom"});
    });
});
