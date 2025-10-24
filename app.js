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

// simple sound function (placeholder for now)
function play_sound(type) {
    // will add real sound later
    console.log('playing sound:', type);
}

// show screen function
function show_screen(screen) {
    // hide all screens
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    // show selected screen
    screen.classList.add('active');
}

// initialize the game
document.addEventListener('DOMContentLoaded', () => {
    // get story elements
    const story_text = document.getElementById('story-text-1');
    const start_btn = document.getElementById('start-btn');
    const story_screen = document.getElementById('story-screen');
    const main_app = document.getElementById('main-app');
    
    // story text to display
    const story = "Agent, you're online. A temporal crisis is unfolding. Unknown anachronisms are appearing across the timeline, threatening to unravel reality. Your mission: find these artifacts and retrieve them before the timeline destabilizes. Access the Time Hub to see active hotspots.";
    
    // start typing effect
    type_effect(story_text, story, () => {
        // show start button when typing is done
        start_btn.style.display = 'block';
    });
    
    // start button click handler
    start_btn.addEventListener('click', () => {
        play_sound('click');
        show_screen(main_app);
    });
});
