"use strict";

// lorem ipsum generator
const sentences = [
    "Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.",
    "Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.",
    "Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.",
    "Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "Praesent commodo cursus magna, vel scelerisque nisl consectetur et.",
    "Vestibulum id ligula porta felis euismod semper.",
    "Curabitur blandit tempus porttitor.",
    "Cras mattis consectetur purus sit amet fermentum.",
    "Aenean lacinia bibendum nulla sed consectetur.",
    "Nulla vitae elit libero, a pharetra augue.",
    "Integer posuere erat a ante venenatis dapibus posuere velit aliquet.",
    "Donec ullamcorper nulla non metus auctor fringilla.",
    "Morbi leo risus, porta ac consectetur ac, vestibulum at eros.",
    "Aenean eu leo quam. Pellentesque ornare sem lacinia quam venenatis vestibulum.",
    "Sed posuere consectetur est at lobortis.",
    "Cras justo odio, dapibus ac facilisis in, egestas eget quam.",
    "Maecenas faucibus mollis interdum.",
    "Vivamus sagittis lacus vel augue laoreet rutrum faucibus dolor auctor.",
    "Etiam porta sem malesuada magna mollis euismod.",
    "Fusce dapibus, tellus ac cursus commodo, tortor mauris condimentum nibh, ut fermentum massa justo sit amet risus.",
    "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium.",
    "Totam rem aperiam, eaque ipsa quae ab illo inventore veritatis et quasi architecto beatae vitae dicta sunt explicabo.",
    "Nemo enim ipsam voluptatem quia voluptas sit aspernatur aut odit aut fugit.",
    "Neque porro quisquam est, qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.",
    "At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident.",
    "Similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
    "Et harum quidem rerum facilis est et expedita distinctio.",
    "Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus.",
    "Omnis voluptas assumenda est, omnis dolor repellendus.",
    "Temporibus autem quibusdam et aut officiis debitis aut rerum necessitatibus saepe eveniet ut et voluptates repudiandae sint et molestiae non recusandae.",
    "Itaque earum rerum hic tenetur a sapiente delectus, ut aut reiciendis voluptatibus maiores alias consequatur aut perferendis doloribus asperiores repellat."
];

function getRandomSentence() {
    return sentences[Math.floor(Math.random() * sentences.length)];
}

function generateLoremIpsum(type, amount) {
    switch(type) {
        case 'paragraphs':
            return generateParagraphs(amount);
        case 'words':
            return generateWords(amount);
        case 'bytes':
            return generateBytes(amount);
        case 'lists':
            return generateList(amount);
        default:
            return '';
    }
}

function generateParagraphs(amount) {
    let paragraphs = ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."];
    for (let i = 1; i < amount; i++) {
        let paragraph = [];
        for (let j = 0; j < 5; j++) {  // Adjust number of sentences per paragraph
            paragraph.push(getRandomSentence());
        }
        paragraphs.push(paragraph.join(' '));
    }
    return paragraphs.join('\n\n');
}

function generateWords(amount) {
    let words = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.".split(' ');
    while (words.length < amount) {
        words = words.concat(getRandomSentence().split(' '));
    }
    return words.slice(0, amount).join(' ') + '...';
}

function generateBytes(amount) {
    let result = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. ";
    while (result.length < amount) {
        result += getRandomSentence() + ' ';
    }
    return result.substring(0, amount) + '...';
}

function generateList(amount) {
    let list = ["Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua."];
    for (let i = 0; i < amount - 1; i++) {
        list.push(getRandomSentence());
    }
    return list.join('\n');
}

document.addEventListener('DOMContentLoaded', () => {
    let selectedType = "paragraphs";
    document.getElementById(selectedType).classList.add("loremTypeSelected");

    const copyBtn = document.getElementById('loremCopyBtn')

    const amountInput = document.getElementById('loremAmount');

    const updateText = () => {
        const amount = parseInt(amountInput.value);
        const loremArea = document.getElementById('loremArea');
        loremArea.value = generateLoremIpsum(selectedType, amount);
        updateWordCount();
        resetCopyButton(); // Reset the copy button on text update
    };

    const updateWordCount = () => {
        const loremArea = document.getElementById('loremArea');
        const text = loremArea.value;
        const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        document.getElementById('wordCount').textContent = `${words} Words`;
    };

    const resetCopyButton = () => {
        copyBtn.classList.remove("copyButtonAnimation");
        copyBtn.innerHTML = 'Copy <img src="images/copy.svg" alt="Copy Icon" />';
    };

    document.getElementById('paragraphs').addEventListener('click', () => {
        document.getElementById(selectedType).classList.remove("loremTypeSelected");
        selectedType = 'paragraphs';
        document.getElementById(selectedType).classList.add("loremTypeSelected");
        updateText();
    });

    document.getElementById('words').addEventListener('click', () => {
        document.getElementById(selectedType).classList.remove("loremTypeSelected");
        selectedType = 'words';
        document.getElementById(selectedType).classList.add("loremTypeSelected");
        updateText();
    });

    document.getElementById('bytes').addEventListener('click', () => {
        document.getElementById(selectedType).classList.remove("loremTypeSelected");
        selectedType = 'bytes';
        document.getElementById(selectedType).classList.add("loremTypeSelected");
        updateText();
    });

    document.getElementById('lists').addEventListener('click', () => {
        document.getElementById(selectedType).classList.remove("loremTypeSelected");
        selectedType = 'lists';
        document.getElementById(selectedType).classList.add("loremTypeSelected");
        updateText();
    });

    amountInput.addEventListener('input', updateText);

    copyBtn.addEventListener('click', () => {
        const loremText = document.getElementById('loremArea').value;
        navigator.clipboard.writeText(loremText).then(() => {
            console.log('copiedTest')
            copyBtn.classList.add("copyButtonAnimation");
            copyBtn.textContent = "Copied";
        }).catch(err => {
            alert('Failed to copy text: ', err);
        });
    });

    document.getElementById('scrollTopBtn').addEventListener('click', () => {
        document.getElementById('loremArea').scrollTop = 0;
    });

    document.getElementById('loremArea').addEventListener('input', updateWordCount);

    updateText();  // Initial text generation
});
