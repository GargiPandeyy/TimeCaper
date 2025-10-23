let audioContext;
let isMuted = false;
let currentMission = null;
let currentEra = null;
let gameProgress = {
    completedMissions: [],
    trophies: []
};

const story = "ALERT: Timeline fracture detected. Modern objects infiltrating historical eras. Your mission: locate anachronisms, restore timeline integrity. Scan environments carefully. Lock each era with knowledge verification. Time is collapsing. Agent, you're our only hope.";

const missions = [
    { id: 'ancient-egypt', name: 'Ancient Egypt', era: '3100 BC', anachronism: 'Smartphone', x: 65, y: 40 },
    { id: 'roman-empire', name: 'Roman Empire', era: '27 BC', anachronism: 'Sunglasses', x: 50, y: 55 },
    { id: 'medieval-europe', name: 'Medieval Europe', era: '1200 AD', anachronism: 'Laptop', x: 70, y: 30 },
    { id: 'renaissance', name: 'Renaissance', era: '1500 AD', anachronism: 'Headphones', x: 45, y: 60 },
    { id: 'industrial-revolution', name: 'Industrial Revolution', era: '1800 AD', anachronism: 'Digital Watch', x: 55, y: 45 },
    { id: 'wild-west', name: 'Wild West', era: '1880 AD', anachronism: 'Tablet', x: 60, y: 50 },
    { id: 'victorian-era', name: 'Victorian Era', era: '1890 AD', anachronism: 'Gaming Console', x: 40, y: 35 },
    { id: 'roaring-twenties', name: 'Roaring Twenties', era: '1920 AD', anachronism: 'Drone', x: 75, y: 55 },
    { id: 'wwii', name: 'World War II', era: '1940 AD', anachronism: 'USB Drive', x: 50, y: 40 },
    { id: 'space-race', name: 'Space Race', era: '1960 AD', anachronism: 'Smartwatch', x: 65, y: 50 }
];

const quizData = {
    'ancient-egypt': { question: 'What was the primary writing system in Ancient Egypt?', options: ['Hieroglyphics', 'Cuneiform', 'Latin', 'Sanskrit'], correct: 0 },
    'roman-empire': { question: 'Who was the first Roman Emperor?', options: ['Julius Caesar', 'Augustus', 'Nero', 'Constantine'], correct: 1 },
    'medieval-europe': { question: 'What was the feudal system based on?', options: ['Democracy', 'Land ownership and loyalty', 'Maritime trade', 'Industrial production'], correct: 1 },
    'renaissance': { question: 'Where did the Renaissance begin?', options: ['France', 'England', 'Italy', 'Spain'], correct: 2 },
    'industrial-revolution': { question: 'Which invention powered the Industrial Revolution?', options: ['Electricity', 'Steam engine', 'Gasoline engine', 'Nuclear power'], correct: 1 },
    'wild-west': { question: 'What year did the Transcontinental Railroad complete?', options: ['1869', '1875', '1880', '1865'], correct: 0 },
    'victorian-era': { question: 'Who ruled during the Victorian Era?', options: ['Queen Elizabeth I', 'Queen Victoria', 'King George III', 'Queen Anne'], correct: 1 },
    'roaring-twenties': { question: 'What amendment prohibited alcohol in the US?', options: ['16th', '17th', '18th', '19th'], correct: 2 },
    'wwii': { question: 'What year did World War II end?', options: ['1944', '1945', '1946', '1947'], correct: 1 },
    'space-race': { question: 'Who was the first human in space?', options: ['Neil Armstrong', 'Buzz Aldrin', 'Yuri Gagarin', 'John Glenn'], correct: 2 }
};

function typeWriter(element, text, speed = 50) {
    let i = 0;
    element.textContent = '';

    function type() {
        if (i < text.length) {
            element.textContent += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }

    type();
}

function initAudio() {
    if (!audioContext) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playSound(frequency, duration) {
    if (!audioContext || isMuted) return;

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + duration);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + duration);
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.getElementById(screenId + '-screen').classList.add('active');
    playSound(800, 0.1);
}

function renderMissions() {
    const grid = document.getElementById('missions-grid');
    const companionMsg = document.getElementById('companion-msg');
    companionMsg.textContent = 'Select an era to investigate. Scan for anomalies and stabilize the timeline.';

    grid.innerHTML = '';
    missions.forEach(mission => {
        const card = document.createElement('div');
        card.className = 'mission-card';
        if (gameProgress.completedMissions.includes(mission.id)) {
            card.classList.add('completed');
        }

        card.innerHTML = `
            <h3>${mission.name}</h3>
            <p>${mission.era}</p>
            <p>Target: ${mission.anachronism}</p>
        `;

        card.addEventListener('click', () => selectMission(mission));
        grid.appendChild(card);
    });
}

function selectMission(mission) {
    currentMission = mission;
    playSound(1000, 0.15);
    showScreen('mission');

    document.getElementById('mission-title').textContent = mission.name;
    const info = document.getElementById('mission-info');
    info.innerHTML = `
        <p>ERA: ${mission.era}</p>
        <p>MISSION: Locate the ${mission.anachronism} using your scanner</p>
        <p>Press SPACE to activate scanner</p>
    `;

    setupMissionScene(mission);
}

let scannerActive = false;
let scannerX = 0;
let scannerY = 0;

function toggleScanner() {
    const scanner = document.getElementById('scanner');
    scannerActive = !scannerActive;

    if (scannerActive) {
        scanner.classList.add('active');
        playSound(600, 0.1);
    } else {
        scanner.classList.remove('active');
    }
}

function updateScannerPosition(e) {
    if (!scannerActive) return;

    const scene = document.getElementById('mission-scene');
    const rect = scene.getBoundingClientRect();
    scannerX = e.clientX - rect.left;
    scannerY = e.clientY - rect.top;

    const scanner = document.getElementById('scanner');
    scanner.style.left = (scannerX - 40) + 'px';
    scanner.style.top = (scannerY - 40) + 'px';

    checkAnachronismDetection();
}

function setupMissionScene(mission) {
    const anachronism = document.getElementById('anachronism');
    const scene = document.getElementById('mission-scene');
    const rect = scene.getBoundingClientRect();

    anachronism.style.left = mission.x + '%';
    anachronism.style.top = mission.y + '%';
    anachronism.style.display = 'block';

    anachronism.onclick = () => detectAnachronism(mission);
}

function checkAnachronismDetection() {
    if (!currentMission || !scannerActive) return;

    const anachronism = document.getElementById('anachronism');
    const rect = anachronism.getBoundingClientRect();
    const scene = document.getElementById('mission-scene');
    const sceneRect = scene.getBoundingClientRect();

    const objX = rect.left - sceneRect.left + rect.width / 2;
    const objY = rect.top - sceneRect.top + rect.height / 2;

    const distance = Math.sqrt(Math.pow(scannerX - objX, 2) + Math.pow(scannerY - objY, 2));

    if (distance < 50) {
        anachronism.style.opacity = '1';
        playSound(1200, 0.05);
    } else {
        anachronism.style.opacity = '0.3';
    }
}

function detectAnachronism(mission) {
    playSound(1500, 0.2);
    document.getElementById('anachronism').style.display = 'none';
    scannerActive = false;
    document.getElementById('scanner').classList.remove('active');

    setTimeout(() => {
        startQuiz(mission);
    }, 500);
}

function init() {
    loadProgress();
    const storyText = document.getElementById('story-text');
    typeWriter(storyText, story);

    document.addEventListener('click', initAudio, { once: true });

    document.getElementById('start-btn').addEventListener('click', () => {
        showScreen('hub');
        renderMissions();
    });

    document.querySelectorAll('.nav-btn[data-screen]').forEach(btn => {
        btn.addEventListener('click', () => {
            const screen = btn.dataset.screen;
            showScreen(screen);
            if (screen === 'hub') renderMissions();
            if (screen === 'trophy') renderTrophies();
        });
    });

    document.getElementById('back-btn').addEventListener('click', () => {
        showScreen('hub');
        renderMissions();
    });

    document.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            toggleScanner();
        }
    });

    document.getElementById('mission-scene').addEventListener('mousemove', updateScannerPosition);
}

window.addEventListener('load', init);
