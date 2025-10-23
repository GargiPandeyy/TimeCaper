let audioContext;
let isMuted = false;
let currentMission = null;
let currentEra = null;
let gameProgress = {
    completedMissions: [],
    trophies: []
};

const story = "ALERT: Timeline fracture detected. Modern objects infiltrating historical eras. Your mission: locate anachronisms, restore timeline integrity. Scan environments carefully. Lock each era with knowledge verification. Time is collapsing. Agent, you're our only hope.";

function init() {
    loadProgress();
}

window.addEventListener('load', init);
