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

function init() {
    loadProgress();
    const storyText = document.getElementById('story-text');
    typeWriter(storyText, story);

    document.addEventListener('click', initAudio, { once: true });
}

window.addEventListener('load', init);
