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

// play sound effects
function play_sound(type) {
    if (!window.audio_ctx || window.is_muted) return;
    
    let freq, duration, gain_val, wave_type;
    
    switch (type) {
        case 'click':
            freq = 2500; duration = 0.05; gain_val = 0.1; wave_type = 'triangle';
            break;
        case 'correct':
            freq = 800; duration = 0.1; gain_val = 0.2; wave_type = 'sine';
            break;
        case 'incorrect':
            freq = 200; duration = 0.2; gain_val = 0.2; wave_type = 'square';
            break;
        case 'vortex':
            freq = 100; duration = 1.0; gain_val = 0.5; wave_type = 'sawtooth';
            break;
        case 'beep-high':
            freq = 2000; duration = 0.05; gain_val = 0.05; wave_type = 'sine';
            break;
        case 'beep-low':
            freq = 1000; duration = 0.05; gain_val = 0.05; wave_type = 'sine';
            break;
        default: return;
    }
    
    // create oscillator
    const oscillator = window.audio_ctx.createOscillator();
    const gain_node = window.audio_ctx.createGain();
    oscillator.connect(gain_node);
    gain_node.connect(window.audio_ctx.destination);
    
    oscillator.type = wave_type;
    oscillator.frequency.setValueAtTime(freq, window.audio_ctx.currentTime);
    gain_node.gain.setValueAtTime(gain_val, window.audio_ctx.currentTime);
    gain_node.gain.exponentialRampToValueAtTime(0.001, window.audio_ctx.currentTime + duration);
    
    oscillator.start(window.audio_ctx.currentTime);
    oscillator.stop(window.audio_ctx.currentTime + duration);
    
    // add second tone for correct answer
    if (type === 'correct') {
        const osc2 = window.audio_ctx.createOscillator();
        osc2.connect(gain_node);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, window.audio_ctx.currentTime);
        osc2.start(window.audio_ctx.currentTime);
        osc2.stop(window.audio_ctx.currentTime + duration);
    }
    
    // add frequency sweep for vortex
    if (type === 'vortex') {
        oscillator.frequency.exponentialRampToValueAtTime(800, window.audio_ctx.currentTime + duration);
    }
}

// initialize audio context
function init_audio() {
    try {
        window.audio_ctx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
        console.warn('web audio api not supported');
    }
}

// setup mute button
function setup_mute_button() {
    const mute_btn = document.getElementById('muteBtn');
    window.is_muted = false;
    
    mute_btn.addEventListener('click', () => {
        window.is_muted = !window.is_muted;
        mute_btn.textContent = window.is_muted ? '🔇 Sound' : '🔊 Sound';
        
        if (!window.is_muted && !window.audio_ctx) {
            init_audio();
        }
        
        play_sound('click');
    });
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
        render_trophy_room();
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
    
    // store current mission
    window.current_mission = mission;
    
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

// load quiz from json file
async function load_quiz(quiz_file) {
    try {
        const response = await fetch(quiz_file);
        if (!response.ok) throw new Error('failed to load quiz');
        const quiz = await response.json();
        
        if (!quiz || quiz.length === 0) {
            console.error('quiz is empty:', quiz_file);
            update_companion('error: could not load temporal lock data');
            return;
        }
        
        // start quiz
        start_quiz(quiz);
    } catch (error) {
        console.error('error loading quiz:', error);
        update_companion('error: could not load temporal lock data');
    }
}

// start quiz
function start_quiz(quiz) {
    // reset quiz state
    window.current_question = 0;
    window.quiz_score = 0;
    window.quiz_data = quiz;
    
    // update score display
    const quiz_score = document.getElementById('quizScore');
    const quiz_total = document.getElementById('quizTotal');
    quiz_score.textContent = window.quiz_score;
    quiz_total.textContent = quiz.length;
    
    // show quiz mode
    const quiz_mode = document.getElementById('quiz-mode');
    show_mode(quiz_mode);
    
    // display first question
    display_question();
}

// display current question
function display_question() {
    const question_text = document.getElementById('questionText');
    const quiz_options = document.getElementById('quizOptions');
    const next_btn = document.getElementById('next-question');
    
    const question = window.quiz_data[window.current_question];
    question_text.textContent = question.question;
    quiz_options.innerHTML = '';
    next_btn.style.display = 'none';
    
    // shuffle options
    const shuffled_options = [...question.options].sort(() => Math.random() - 0.5);
    
    // create option buttons
    shuffled_options.forEach(option => {
        const button = document.createElement('button');
        button.className = 'btn quiz-option';
        button.textContent = option;
        button.addEventListener('click', () => select_answer(option, question.correctAnswer));
        quiz_options.appendChild(button);
    });
}

// select answer
function select_answer(selected_option, correct_answer) {
    play_sound('click');
    
    const next_btn = document.getElementById('next-question');
    next_btn.style.display = 'block';
    
    // disable all buttons
    const buttons = document.querySelectorAll('.quiz-option');
    buttons.forEach(button => {
        button.disabled = true;
        if (button.textContent === correct_answer) {
            button.classList.add('correct');
        } else if (button.textContent === selected_option) {
            button.classList.add('incorrect');
        }
    });
    
    // check if answer is correct
    if (selected_option === correct_answer) {
        window.quiz_score++;
        const quiz_score = document.getElementById('quizScore');
        quiz_score.textContent = window.quiz_score;
        play_sound('correct');
        update_companion('Correct. Security layer bypassed.');
    } else {
        play_sound('incorrect');
        update_companion('Incorrect. Temporal field unstable... try the next layer.');
    }
    
    // setup next button
    next_btn.onclick = () => {
        window.current_question++;
        if (window.current_question < window.quiz_data.length) {
            display_question();
        } else {
            finish_quiz();
        }
    };
}

// finish quiz
function finish_quiz() {
    const score_percentage = window.quiz_score / window.quiz_data.length;
    
    if (score_percentage >= 0.6) {
        update_companion('Timeline stabilized! Anachronism secured. Returning to Hub.');
        play_sound('vortex');
        
        // add trophy to storage
        const trophies = JSON.parse(localStorage.getItem('timeCaperTrophies')) || [];
        const current_mission = window.current_mission;
        
        if (current_mission) {
            trophies.push({
                id: current_mission.id,
                name: current_mission.artifactName,
                icon: current_mission.artifactIcon
            });
            localStorage.setItem('timeCaperTrophies', JSON.stringify(trophies));
        }
    } else {
        update_companion('Timeline lock failed! Anomaly remains. Returning to Time Hub.');
        play_sound('incorrect');
    }
    
    // return to hub
    const hub_mode = document.getElementById('main-hub');
    show_mode(hub_mode);
    
    // reload missions to show completed status
    load_missions().then(missions => {
        if (missions) {
            const trophies = JSON.parse(localStorage.getItem('timeCaperTrophies')) || [];
            render_missions(missions, trophies);
        }
    });
}

// render trophy room
function render_trophy_room() {
    const trophy_grid = document.getElementById('trophy-grid');
    const trophies = JSON.parse(localStorage.getItem('timeCaperTrophies')) || [];
    
    trophy_grid.innerHTML = '';
    
    if (trophies.length === 0) {
        trophy_grid.innerHTML = '<p>Trophy Room is empty. Secure anachronisms to fill it.</p>';
        return;
    }
    
    trophies.forEach(trophy => {
        const card = document.createElement('div');
        card.className = 'trophy-card';
        card.innerHTML = `<h3>${trophy.icon}</h3><p>${trophy.name}</p>`;
        trophy_grid.appendChild(card);
    });
}

// create flying clocks
function create_flying_clocks() {
    const container = document.getElementById('flying-clocks-container');
    if (!container) return;
    
    const clock_emojis = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛'];
    
    function create_single_clock() {
        const clock = document.createElement('div');
        clock.className = 'flying-clock';
        clock.textContent = clock_emojis[Math.floor(Math.random() * clock_emojis.length)];
        
        const start_y = Math.random() * 70 + 15;
        const duration = Math.random() * 8 + 22;
        const scale = Math.random() * 0.3 + 0.7;
        
        clock.style.top = `${start_y}vh`;
        clock.style.left = '0px';
        clock.style.animationDuration = `${duration}s`;
        clock.style.transform = `scale(${scale})`;
        
        container.appendChild(clock);
        
        setTimeout(() => {
            if (clock.parentNode) {
                clock.parentNode.removeChild(clock);
            }
        }, duration * 1000);
    }
    
    // create initial clocks
    for (let i = 0; i < 3; i++) {
        setTimeout(() => create_single_clock(), i * 2000);
    }
    
    // create clocks periodically
    setInterval(() => {
        create_single_clock();
    }, Math.random() * 2000 + 4000);
}

// create matrix effect
function create_matrix_effect() {
    const container = document.getElementById('matrix-container');
    if (!container) return;
    
    const matrix_chars = [
        'ア', 'イ', 'ウ', 'エ', 'オ', 'カ', 'キ', 'ク', 'ケ', 'コ',
        'サ', 'シ', 'ス', 'セ', 'ソ', 'タ', 'チ', 'ツ', 'テ', 'ト',
        'ナ', 'ニ', 'ヌ', 'ネ', 'ノ', 'ハ', 'ヒ', 'フ', 'ヘ', 'ホ',
        'マ', 'ミ', 'ム', 'メ', 'モ', 'ヤ', 'ユ', 'ヨ', 'ラ', 'リ',
        'ル', 'レ', 'ロ', 'ワ', 'ヲ', 'ン', '0', '1', '2', '3',
        '4', '5', '6', '7', '8', '9', 'A', 'B', 'C', 'D',
        'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N',
        'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X',
        'Y', 'Z', '!', '@', '#', '$', '%', '^', '&', '*',
        '(', ')', '-', '_', '=', '+', '[', ']', '{', '}',
        '|', '\\', ':', ';', '"', "'", '<', '>', ',', '.',
        '?', '/', '~', '`'
    ];
    
    function create_matrix_column() {
        const column = document.createElement('div');
        column.className = 'matrix-column';
        
        const x_position = Math.random() * 100;
        column.style.left = `${x_position}%`;
        
        const duration = Math.random() * 4 + 2;
        column.style.animationDuration = `${duration}s`;
        
        const char_count = Math.floor(Math.random() * 31) + 30;
        
        for (let i = 0; i < char_count; i++) {
            const char = document.createElement('div');
            char.className = 'matrix-character';
            char.textContent = matrix_chars[Math.floor(Math.random() * matrix_chars.length)];
            
            if (Math.random() < 0.15) {
                char.classList.add('highlight');
            }
            
            column.appendChild(char);
        }
        
        container.appendChild(column);
        
        setTimeout(() => {
            if (column.parentNode) {
                column.parentNode.removeChild(column);
            }
        }, duration * 1000);
    }
    
    // create initial columns
    for (let i = 0; i < 50; i++) {
        setTimeout(() => create_matrix_column(), i * 100);
    }
    
    // create columns periodically
    setInterval(() => {
        const columns_to_create = Math.floor(Math.random() * 3) + 2;
        for (let i = 0; i < columns_to_create; i++) {
            setTimeout(() => create_matrix_column(), i * 50);
        }
    }, Math.random() * 150 + 50);
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
        setup_mute_button();
        create_flying_clocks();
        create_matrix_effect();
    });
});
