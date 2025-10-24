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

// show mode function
function show_mode(mode) {
    // hide all modes
    document.querySelectorAll('.app-mode').forEach(m => m.classList.remove('active'));
    // show selected mode
    mode.classList.add('active');
}

// setup navigation
function setup_nav() {
    // get nav buttons
    const nav_hub = document.getElementById('nav-hub');
    const nav_trophy = document.getElementById('nav-trophy');
    
    // get mode containers
    const hub_mode = document.getElementById('main-hub');
    const trophy_mode = document.getElementById('trophy-room');
    
    // hub button click
    nav_hub.addEventListener('click', () => {
        play_sound('click');
        show_mode(hub_mode);
        nav_hub.classList.add('active');
        nav_trophy.classList.remove('active');
        update_companion('Welcome, Agent. Select a mission from the Time Hub.');
    });
    
    // trophy button click
    nav_trophy.addEventListener('click', () => {
        play_sound('click');
        show_mode(trophy_mode);
        nav_trophy.classList.add('active');
        nav_hub.classList.remove('active');
        update_companion('Viewing collected anachronisms.');
    });
}

// update companion message
function update_companion(text) {
    const companion_bubble = document.getElementById('companionBubble');
    companion_bubble.textContent = text;
}

// load missions from json file
async function load_missions() {
    try {
        const response = await fetch('data/missions.json');
        if (!response.ok) throw new Error('failed to load missions');
        const missions = await response.json();
        return missions;
    } catch (error) {
        console.error('error loading missions:', error);
        update_companion('error: could not load mission data');
        return null;
    }
}

// render missions in the grid
function render_missions(missions, trophies) {
    const mission_grid = document.getElementById('mission-grid');
    mission_grid.innerHTML = '';
    
    missions.forEach(mission => {
        const card = document.createElement('div');
        card.className = 'mission-card';
        card.innerHTML = `<h3>${mission.title}</h3>`;
        
        // check if mission is completed
        if (trophies.find(t => t.id === mission.id)) {
            card.classList.add('completed');
            card.innerHTML += `<p><strong>[ SECURED ]</strong></p>`;
        } else {
            // add click handler for incomplete missions
            card.addEventListener('click', () => start_mission(mission));
        }
        
        mission_grid.appendChild(card);
    });
}

// start a mission
function start_mission(mission) {
    play_sound('click');
    update_companion(mission.description);
    
    // show mission screen
    const mission_screen = document.getElementById('mission-screen');
    const mission_title = document.getElementById('mission-title');
    const scene_viewer = document.getElementById('scene-viewer');
    
    mission_title.textContent = `Mission: ${mission.title}`;
    scene_viewer.style.backgroundImage = `url(${mission.image})`;
    
    show_mode(mission_screen);
    activate_scanner(mission);
}

// activate scanner for mission
function activate_scanner(mission) {
    const scanner = document.getElementById('scanner');
    const scanner_readout = document.getElementById('scanner-readout');
    const scene_viewer = document.getElementById('scene-viewer');
    
    scanner.style.display = 'block';
    
    // get artifact position
    const clue_pos = mission.artifactPosition;
    const clue_x = parseFloat(clue_pos.x);
    const clue_y = parseFloat(clue_pos.y);
    
    // mouse move handler
    const on_mouse_move = (e) => {
        const scene_rect = scene_viewer.getBoundingClientRect();
        const mouse_x = e.clientX;
        const mouse_y = e.clientY;
        
        // move scanner to mouse position
        scanner.style.left = `${mouse_x}px`;
        scanner.style.top = `${mouse_y}px`;
        
        // check if mouse is over scene
        if (mouse_x > scene_rect.left && mouse_x < scene_rect.right &&
            mouse_y > scene_rect.top && mouse_y < scene_rect.bottom) {
            
            // calculate distance to artifact
            const rel_x = ((mouse_x - scene_rect.left) / scene_rect.width) * 100;
            const rel_y = ((mouse_y - scene_rect.top) / scene_rect.height) * 100;
            const dist = Math.sqrt(Math.pow(rel_x - clue_x, 2) + Math.pow(rel_y - clue_y, 2));
            const dist_meters = Math.round(dist * 10);
            
            scanner_readout.textContent = `Dist: ${dist_meters}m`;
            
            // play beep sounds based on distance
            if (dist < 5) {
                scanner_readout.textContent = `LOCKED`;
                play_sound('beep-high');
            } else if (dist < 20) {
                play_sound('beep-low');
            }
        } else {
            scanner_readout.textContent = `NO SIGNAL`;
        }
    };
    
    // add mouse move listener
    document.addEventListener('mousemove', on_mouse_move);
    
    // scene click handler
    const on_scene_click = (e) => {
        const scene_rect = scene_viewer.getBoundingClientRect();
        const rel_x = ((e.clientX - scene_rect.left) / scene_rect.width) * 100;
        const rel_y = ((e.clientY - scene_rect.top) / scene_rect.height) * 100;
        const dist = Math.sqrt(Math.pow(rel_x - clue_x, 2) + Math.pow(rel_y - clue_y, 2));
        
        // check if clicked on artifact
        if (dist < 5) {
            play_sound('correct');
            scanner.style.display = 'none';
            
            // remove event listeners
            document.removeEventListener('mousemove', on_mouse_move);
            scene_viewer.removeEventListener('click', on_scene_click);
            
            // show found message
            update_companion('Anachronism found! Stabilizing timeline... Prepare for Temporal Lock.');
            
            // trigger vortex animation
            trigger_vortex_animation(e.clientX, e.clientY);
            
            // load quiz after delay
            setTimeout(() => {
                load_quiz(mission.quizDataFile);
            }, 1500);
        }
    };
    
    // add click listener to scene
    scene_viewer.addEventListener('click', on_scene_click);
}

// trigger vortex animation
function trigger_vortex_animation(x, y) {
    play_sound('vortex');
    const container = document.getElementById('animation-container');
    
    for (let i = 0; i < 5; i++) {
        setTimeout(() => {
            const ring = document.createElement('div');
            ring.className = 'vortex-ring';
            ring.style.left = `${x}px`;
            ring.style.top = `${y}px`;
            container.appendChild(ring);
            
            setTimeout(() => ring.remove(), 1000);
        }, i * 150);
    }
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
    start_btn.addEventListener('click', async () => {
        play_sound('click');
        show_screen(main_app);
        
        // load missions and setup navigation
        const missions = await load_missions();
        const trophies = JSON.parse(localStorage.getItem('timeCaperTrophies')) || [];
        
        if (missions) {
            render_missions(missions, trophies);
        }
        
        setup_nav();
    });
});
