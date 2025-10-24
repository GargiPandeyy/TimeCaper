// simple typing effect function
function type_effect(element, text, on_complete) {
    let i = 0;
    element.innerHTML = "";
    
    // create blinking cursor
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    element.appendChild(cursor);

    function typing() {
        if (i < text.length) {
            // add one character at a time
            cursor.insertAdjacentHTML('beforebegin', text.charAt(i));
            i++;
            
            // play click sound every 3 characters
            if (i % 3 === 0) {
                play_sound('click');
            }
            
            // continue typing after short delay
            setTimeout(typing, 30);
        } else {
            // remove cursor when done
            cursor.remove();
            if (on_complete) on_complete();
        }
    }
    
    typing();
}

// typing cursor animation
.typing-cursor {
    display: inline-block;
    width: 10px;
    height: 1.2em;
    background: var(--glow);
    margin-left: 5px;
    animation: blink 0.7s infinite;
}

@keyframes blink {
    0% { opacity: 1; }
    50% { opacity: 0; }
    100% { opacity: 1; }
}
