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
}

window.addEventListener('load', init);
