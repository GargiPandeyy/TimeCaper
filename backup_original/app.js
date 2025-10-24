document.addEventListener('DOMContentLoaded', () => {
    const screens = {
        story: document.getElementById('story-screen'),
        mainApp: document.getElementById('main-app'),
    };
    const nav = {
        hub: document.getElementById('nav-hub'),
        trophy: document.getElementById('nav-trophy'),
    };
    const modes = {
        hub: document.getElementById('main-hub'),
        mission: document.getElementById('mission-screen'),
        quiz: document.getElementById('quiz-mode'),
        trophy: document.getElementById('trophy-room'),
    };
    const companion = {
        avatar: document.getElementById('companionAvatar'),
        bubble: document.getElementById('companionBubble'),
    };
    const missionElements = {
        grid: document.getElementById('mission-grid'),
        scene: document.getElementById('scene-viewer'),
        title: document.getElementById('mission-title'),
    };
    const quizElements = {
        container: document.getElementById('quizContainer'),
        question: document.getElementById('questionText'),
        options: document.getElementById('quizOptions'),
        score: document.getElementById('quizScore'),
        total: document.getElementById('quizTotal'),
        nextBtn: document.getElementById('next-question'),
    };
    const trophyElements = {
        grid: document.getElementById('trophy-grid'),
    };
    const scanner = {
        element: document.getElementById('scanner'),
        readout: document.getElementById('scanner-readout'),
    };
    const buttons = {
        start: document.getElementById('start-btn'),
        mute: document.getElementById('muteBtn'),
    };
    const storyText = {
        one: document.getElementById('story-text-1'),
    };
    const parallaxLayers = {
        back: document.getElementById('parallax-bg-back'),
        mid: document.getElementById('parallax-bg-mid'),
        front: document.getElementById('parallax-bg-front'),
    };

    let missions = [];
    let currentMission = null;
    let quiz = [];
    let currentQuestionIndex = 0;
    let score = 0;
    let trophies = JSON.parse(localStorage.getItem('timeCaperTrophies')) || [];
    let scannerActive = false;
    let audioCtx;
    let isMuted = false;

    function initAudio() {
        try {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn("Web Audio API is not supported in this browser");
        }
    }

    function playSound(type) {
        if (!audioCtx || isMuted) return;

        let freq, duration, gainVal, waveType;

        switch (type) {
            case 'click':
                freq = 2500; duration = 0.05; gainVal = 0.1; waveType = 'triangle';
                break;
            case 'correct':
                freq = 800; duration = 0.1; gainVal = 0.2; waveType = 'sine';
                break;
            case 'incorrect':
                freq = 200; duration = 0.2; gainVal = 0.2; waveType = 'square';
                break;
            case 'vortex':
                freq = 100; duration = 1.0; gainVal = 0.5; waveType = 'sawtooth';
                break;
            case 'beep-high':
                freq = 2000; duration = 0.05; gainVal = 0.05; waveType = 'sine';
                break;
            case 'beep-low':
                freq = 1000; duration = 0.05; gainVal = 0.05; waveType = 'sine';
                break;
            default: return;
        }

        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        oscillator.type = waveType;
        oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
        gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
        oscillator.start(audioCtx.currentTime);
        oscillator.stop(audioCtx.currentTime + duration);

        if (type === 'correct') {
            const osc2 = audioCtx.createOscillator();
            osc2.connect(gainNode);
            osc2.type = 'sine';
            osc2.frequency.setValueAtTime(1200, audioCtx.currentTime);
            osc2.start(audioCtx.currentTime);
            osc2.stop(audioCtx.currentTime + duration);
        }
        
        if (type === 'vortex') {
             oscillator.frequency.exponentialRampToValueAtTime(800, audioCtx.currentTime + duration);
        }
    }

    buttons.mute.addEventListener('click', () => {
        isMuted = !isMuted;
        buttons.mute.textContent = isMuted ? '🔇 Sound' : '🔊 Sound';
        if (!isMuted && !audioCtx) {
            initAudio();
        }
        playSound('click');
    });

    function typeEffect(element, text, onComplete) {
        let i = 0;
        element.innerHTML = "";
        const cursor = document.createElement('span');
        cursor.className = 'typing-cursor';
        element.appendChild(cursor);

        function typing() {
            if (i < text.length) {
                cursor.insertAdjacentHTML('beforebegin', text.charAt(i));
                i++;
                if (i % 3 === 0) playSound('click');
                setTimeout(typing, 30);
            } else {
                cursor.remove();
                if (onComplete) onComplete();
            }
        }
        typing();
    }

    function showScreen(screen) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    function showMode(mode) {
        Object.values(modes).forEach(m => m.classList.remove('active'));
        mode.classList.add('active');
    }

    function setupNav() {
        nav.hub.addEventListener('click', () => {
            playSound('click');
            showMode(modes.hub);
            nav.hub.classList.add('active');
            nav.trophy.classList.remove('active');
            updateCompanion('Welcome, Agent. Select a mission from the Time Hub.');
        });
        nav.trophy.addEventListener('click', () => {
            playSound('click');
            showMode(modes.trophy);
            nav.trophy.classList.add('active');
            nav.hub.classList.remove('active');
            updateCompanion(`Viewing ${trophies.length} collected anachronisms.`);
            renderTrophyRoom();
        });
    }

    async function initializeGame() {
        document.body.addEventListener('click', () => {
             if (!audioCtx && !isMuted) initAudio();
        }, { once: true });


        const story = "Agent, you're online. A temporal crisis is unfolding. Unknown anachronisms are appearing across the timeline, threatening to unravel reality. Your mission: find these artifacts and retrieve them before the timeline destabilizes. Access the Time Hub to see active hotspots.";
        typeEffect(storyText.one, story, () => {
            buttons.start.style.display = 'block';
        });

        buttons.start.addEventListener('click', () => {
            playSound('click');
            showScreen(screens.mainApp);
            loadMissions();
            setupNav();
        });

        createFlyingClocks();
        
        createMatrixEffect();
    }

    async function loadMissions() {
        missions = await loadJSON('data/missions.json');
        if (missions) {
            renderMissions();
        } else {
            updateCompanion("CRITICAL ERROR: Could not load mission data. Check console.");
        }
    }

    function renderMissions() {
        missionElements.grid.innerHTML = "";
        missions.forEach(mission => {
            const card = document.createElement('div');
            card.className = 'mission-card';
            card.innerHTML = `<h3>${mission.title}</h3>`; 
            
            if (trophies.find(t => t.id === mission.id)) {
                card.classList.add('completed');
                card.innerHTML += `<p><strong>[ SECURED ]</strong></p>`;
            } else {
                card.addEventListener('click', () => startMission(mission));
            }
            missionElements.grid.appendChild(card);
        });
    }

    function startMission(mission) {
        playSound('click');
        currentMission = mission;
        
        missionElements.title.textContent = `Mission: ${mission.title}`;
        missionElements.scene.style.backgroundImage = `url(${mission.image})`;
        updateCompanion(mission.description);
        
        parallaxLayers.back.style.backgroundImage = '';
        parallaxLayers.mid.style.backgroundImage = '';
        parallaxLayers.front.style.backgroundImage = 'linear-gradient(rgba(42, 161, 152, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(42, 161, 152, 0.1) 1px, transparent 1px)';


        showMode(modes.mission);
        activateScanner(mission);
    }

    function activateScanner(mission) {
        scannerActive = true;
        scanner.element.style.display = 'block';

        const cluePos = mission.artifactPosition;
        if (!cluePos) {
            console.error("Mission is missing artifactPosition!", mission);
            updateCompanion("Error: Scanner malfunction. No artifact coordinates found.");
            return;
        }

        const clueX = parseFloat(cluePos.x);
        const clueY = parseFloat(cluePos.y);

        const onMouseMove = (e) => {
            if (!scannerActive) return;
            const sceneRect = missionElements.scene.getBoundingClientRect();
            
            const mouseX = e.clientX;
            const mouseY = e.clientY;

            scanner.element.style.left = `${mouseX}px`;
            scanner.element.style.top = `${mouseY}px`;

            if (
                mouseX > sceneRect.left && mouseX < sceneRect.right &&
                mouseY > sceneRect.top && mouseY < sceneRect.bottom
            ) {
                const relX = ((mouseX - sceneRect.left) / sceneRect.width) * 100;
                const relY = ((mouseY - sceneRect.top) / sceneRect.height) * 100;

                const dist = Math.sqrt(Math.pow(relX - clueX, 2) + Math.pow(relY - clueY, 2));
                const distMeters = Math.round(dist * 10);
                scanner.readout.textContent = `Dist: ${distMeters}m`;

                if (dist < 5) {
                    scanner.readout.textContent = `LOCKED`;
                    if(audioCtx) playSound('beep-high');
                } else if (dist < 20) {
                     if(audioCtx) playSound('beep-low');
                }

            } else {
                scanner.readout.textContent = `NO SIGNAL`;
            }
        };

        const onSceneClick = (e) => {
            if (!scannerActive) return;
            const sceneRect = missionElements.scene.getBoundingClientRect();
            const relX = ((e.clientX - sceneRect.left) / sceneRect.width) * 100;
            const relY = ((e.clientY - sceneRect.top) / sceneRect.height) * 100;
            const dist = Math.sqrt(Math.pow(relX - clueX, 2) + Math.pow(relY - clueY, 2));

            if (dist < 5) {
                playSound('correct');
                scannerActive = false;
                scanner.element.style.display = 'none';
                document.removeEventListener('mousemove', onMouseMove);
                missionElements.scene.removeEventListener('click', onSceneClick);
                
                triggerVortexAnimation(e.clientX, e.clientY);
                updateCompanion("Anachronism found! Stabilizing timeline... Prepare for Temporal Lock.");
                
                setTimeout(() => {
                    loadQuiz(currentMission.quizDataFile);
                }, 1500);
            }
        };

        document.addEventListener('mousemove', onMouseMove);
        missionElements.scene.addEventListener('click', onSceneClick);
    }

    async function loadQuiz(quizFile) {
        quiz = await loadJSON(quizFile);
        if (!quiz || quiz.length === 0) {
            console.error("Failed to load quiz or quiz is empty:", quizFile);
            updateCompanion("Error: Could not load Temporal Lock data. Aborting.");
            showMode(modes.hub);
            return;
        }

        currentQuestionIndex = 0;
        score = 0;
        quizElements.total.textContent = quiz.length;
        quizElements.score.textContent = score;
        showMode(modes.quiz);
        displayQuestion();
    }

    function displayQuestion() {
        const q = quiz[currentQuestionIndex];
        quizElements.question.textContent = q.question;
        quizElements.options.innerHTML = "";
        quizElements.nextBtn.style.display = 'none';

        const shuffledOptions = [...q.options].sort(() => Math.random() - 0.5);

        shuffledOptions.forEach(option => {
            const button = document.createElement('button');
            button.className = 'btn quiz-option';
            button.textContent = option;
            button.addEventListener('click', () => selectAnswer(option, q.correctAnswer));
            quizElements.options.appendChild(button);
        });
    }

    function selectAnswer(selectedOption, correctAnswer) {
        playSound('click');
        quizElements.nextBtn.style.display = 'block';

        const buttons = quizElements.options.querySelectorAll('button');
        buttons.forEach(button => {
            button.disabled = true;
            if (button.textContent === correctAnswer) {
                button.classList.add('correct');
            } else if (button.textContent === selectedOption) {
                button.classList.add('incorrect');
            }
        });

        if (selectedOption === correctAnswer) {
            score++;
            quizElements.score.textContent = score;
            playSound('correct');
            updateCompanion("Correct. Security layer bypassed.");
        } else {
            playSound('incorrect');
            updateCompanion("Incorrect. Temporal field unstable... try the next layer.");
        }

        quizElements.nextBtn.onclick = () => {
            currentQuestionIndex++;
            if (currentQuestionIndex < quiz.length) {
                displayQuestion();
            } else {
                finishQuiz();
            }
        };
    }

    function finishQuiz() {
        if (score / quiz.length >= 0.6) {
            updateCompanion(`Timeline stabilized! Anachronism '${currentMission.artifactName}' secured. Returning to Hub.`);
            playSound('vortex');
            
            trophies.push({
                id: currentMission.id,
                name: currentMission.artifactName,
                icon: currentMission.artifactIcon
            });
            localStorage.setItem('timeCaperTrophies', JSON.stringify(trophies));

        } else {
            updateCompanion("Timeline lock failed! Anomaly remains. Returning to Time Hub for redeployment.");
            playSound('incorrect');
        }
        
        showMode(modes.hub);
        renderMissions();
    }

    function renderTrophyRoom() {
        trophyElements.grid.innerHTML = "";
        if (trophies.length === 0) {
            trophyElements.grid.innerHTML = "<p>Trophy Room is empty. Secure anachronisms to fill it.</p>";
            return;
        }
        trophies.forEach(trophy => {
            const card = document.createElement('div');
            card.className = 'trophy-card';
            card.innerHTML = `<h3>${trophy.icon}</h3><p>${trophy.name}</p>`;
            trophyElements.grid.appendChild(card);
        });
    }

    async function loadJSON(url) {
        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error(`Failed to fetch ${url} (Status: ${res.status})`);
            return await res.json();
        } catch (err) {
            console.error(err);
            updateCompanion(`Error: Could not load critical data from ${url}.`);
            return null;
        }
    }

    function updateCompanion(text) {
        companion.bubble.textContent = text;
    }

    function triggerVortexAnimation(x, y) {
        playSound('vortex');
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

    function createFlyingClocks() {
        const container = document.getElementById('flying-clocks-container');
        if (!container) return;
        
        const clockEmojis = ['🕐', '🕑', '🕒', '🕓', '🕔', '🕕', '🕖', '🕗', '🕘', '🕙', '🕚', '🕛', '🕜', '🕝', '🕞', '🕟', '🕠', '🕡', '🕢', '🕣', '🕤', '🕥', '🕦', '🕧'];
        
        function createSingleClock() {
            const clock = document.createElement('div');
            clock.className = 'flying-clock';
            clock.textContent = clockEmojis[Math.floor(Math.random() * clockEmojis.length)];
            
            const startY = Math.random() * 70 + 15;
            const duration = Math.random() * 8 + 22;
            const scale = Math.random() * 0.3 + 0.7;

            clock.style.top = `${startY}vh`;
            clock.style.left = '0px';
            clock.style.animationDuration = `${duration}s, 1.5s`;
            clock.style.animationDelay = '0s, 0s';
            clock.style.transform = `scale(${scale})`;

            container.appendChild(clock);
            
            setTimeout(() => {
                if (clock.parentNode) {
                    clock.parentNode.removeChild(clock);
                }
            }, duration * 1000);
        }
        
        for (let i = 0; i < 3; i++) {
            setTimeout(() => createSingleClock(), i * 2000);
        }
        
        setInterval(() => {
            createSingleClock();
        }, Math.random() * 2000 + 4000);
    }
//matrix
    function createMatrixEffect() {
        const container = document.getElementById('matrix-container');
        if (!container) return;
        
        const matrixChars = [
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
        
        function createMatrixColumn() {
            const column = document.createElement('div');
            column.className = 'matrix-column';
            
            const xPosition = Math.random() * 100;
            column.style.left = `${xPosition}%`;
            
            const duration = Math.random() * 4 + 2;
            column.style.animationDuration = `${duration}s`;
            
            const charCount = Math.floor(Math.random() * 31) + 30;
            
            for (let i = 0; i < charCount; i++) {
                const char = document.createElement('div');
                char.className = 'matrix-character';
                char.textContent = matrixChars[Math.floor(Math.random() * matrixChars.length)];
                
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
        
        for (let i = 0; i < 50; i++) {
            setTimeout(() => createMatrixColumn(), i * 100);
        }
        
        setInterval(() => {
            const columnsToCreate = Math.floor(Math.random() * 3) + 2;
            for (let i = 0; i < columnsToCreate; i++) {
                setTimeout(() => createMatrixColumn(), i * 50);
            }
        }, Math.random() * 150 + 50);
    }

    initializeGame();

});

