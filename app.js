let audioContext;
let isMuted = false;
let currentMission = null;
let currentEra = null;
let gameProgress = {
    completedMissions: [],
    trophies: []
};

const story = "ALERT: Timeline fracture detected. Modern objects infiltrating historical eras. Your mission: locate anachronisms, restore timeline integrity. Scan environments carefully. Lock each era with knowledge verification. Time is collapsing. Agent, you're our only hope.";

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

function init() {
    loadProgress();
    const storyText = document.getElementById('story-text');
    typeWriter(storyText, story);

    document.addEventListener('click', initAudio, { once: true });
}

window.addEventListener('load', init);
