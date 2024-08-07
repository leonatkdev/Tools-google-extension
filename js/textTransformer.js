document.addEventListener('DOMContentLoaded', () => {
    const actions = {
        'sentence-case': 'sentence',
        'lower-case': 'lower',
        'upper-case': 'upper',
        'capitalized-case': 'capitalized',
        'alternating-case': 'alternating',
        'title-case': 'title',
        'inverse-case': 'inverse'
    };

    document.querySelectorAll('.textTransformerActions button').forEach(button => {
        button.addEventListener('click', () => {
            const caseType = actions[button.id];
            formatText(caseType);
            setActiveButton(button.id);
        });
    });

    document.getElementById('download-text').addEventListener('click', downloadText);
    document.getElementById('copy-text').addEventListener('click', copyToClipboard);
    document.getElementById('clear-text').addEventListener('click', clearText);

    document.getElementById('texttArea').addEventListener('input', updateWordCount);
});

function setActiveButton(activeButtonId) {
    document.querySelectorAll('.textTransformerActions button').forEach(button => {
        button.classList.remove('textActionActive');
    });
    document.getElementById(activeButtonId).classList.add('textActionActive');
}

function formatText(caseType) {
    const textarea = document.getElementById('texttArea');
    let text = textarea.value;
    let formattedText = '';

    switch (caseType) {
        case 'sentence':
            formattedText = text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
            break;
        case 'lower':
            formattedText = text.toLowerCase();
            break;
        case 'upper':
            formattedText = text.toUpperCase();
            break;
        case 'capitalized':
            formattedText = text.replace(/\b\w/g, char => char.toUpperCase());
            break;
        case 'alternating':
            formattedText = text.split('').map((char, index) =>
                index % 2 === 0 ? char.toLowerCase() : char.toUpperCase()
            ).join('');
            break;
        case 'title':
            formattedText = text.replace(/\b\w/g, char => char.toUpperCase()).replace(/\s+/g, ' ');
            break;
        case 'inverse':
            formattedText = text.split('').map(char =>
                char === char.toUpperCase() ? char.toLowerCase() : char.toUpperCase()
            ).join('');
            break;
    }

    textarea.value = formattedText;
    updateWordCount();
}

function downloadText() {
    const text = document.getElementById('texttArea').value;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'formatted_text.txt';
    a.click();
    URL.revokeObjectURL(url);
}

function copyToClipboard() {
    const text = document.getElementById('texttArea').value;
    navigator.clipboard.writeText(text).then(() => {
        alert('Text copied to clipboard');
    });
}

function clearText() {
    document.getElementById('texttArea').value = '';
    updateWordCount();
}

function updateWordCount() {
    const text = document.getElementById('texttArea').value;
    const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;
    document.getElementById('wordCountTextt').innerText = `${wordCount} Words`;
}

let undoStack = [];
let redoStack = [];

document.getElementById('texttArea').addEventListener('input', () => {
    undoStack.push(document.getElementById('texttArea').value);
    redoStack = [];
});

function undo() {
    if (undoStack.length > 1) {
        redoStack.push(undoStack.pop());
        document.getElementById('texttArea').value = undoStack[undoStack.length - 1];
        updateWordCount();
    }
}

function redo() {
    if (redoStack.length > 0) {
        const value = redoStack.pop();
        undoStack.push(value);
        document.getElementById('texttArea').value = value;
        updateWordCount();
    }
}