// utils.js
// GLOBAL GAME STATE and UTILITY FUNCTIONS

const gameState = {
  stage: "welcome",
  role: "", // "Investigator" or "Deceiver" for the user
  user: null, // { username, role, alive }
  // If the user provides a custom username on the welcome screen, it is stored here.
  userNameOverride: null,
  players: [], // 15 players (user + 14 bots)
  investigationClue: "",
  lobby: {
    currentPlayers: 0,
    maxPlayers: 15,
    intervalId: null,
  },
  meetingChatInterval: null,
  userVotes: [],
};

// Dynamic AI personalities for bots
const personalities = [
  "False Accusations",
  "Fabricated Events",
  "Selective",
  "Red Herrings",
  "Mimicry",
  "Silence",
  "Logic Manipulation",
];

// Predefined room names (used in buttons)
const roomNames = ["Basement", "Garage", "Attic", "Kitchen", "Library"];

// A pool of realistic bot usernames that resemble what gamers might use.
const botUsernamePool = [
  "Death", "SnapBoy", "monkey_69", "xXShadowXx", "NoobSlayer", "EpicGamer",
  "Legend27", "AceOfSpades", "CyberWolf", "LunaFrost", "RageQuit", "PixelPunk",
  "TechNinja", "GhostRider", "Blaze", "Overlord", "Vortex", "Mystic", "Rogue", "DarkSoul",
  "SnipeKing", "ZeroCool", "QuickSilver", "Phantom", "RedRebel", "FrostByte", "IronFist",
  "NovaStar", "StormRider", "Quantum", "Venom", "ArcadeKing", "ShadowStrike", "LoneWolf",
  "Viper", "Chaos", "Sinister", "FallenAngel", "JuiceBox", "Turbo", "Savage", "Maverick",
  "Pixel", "Voltage"
];

// Utility function: Show one screen and hide the rest.
function showScreen(screenId) {
  document.querySelectorAll(".screen").forEach((screen) => {
    if (screen.id === screenId) screen.classList.remove("hidden");
    else screen.classList.add("hidden");
  });
}

// Fade out an element with a 0.5-second transition before calling a callback.
function fadeOut(element, callback) {
  element.style.opacity = 1;
  const fadeEffect = setInterval(() => {
    if (Number(element.style.opacity) > 0) {
      element.style.opacity = Number(element.style.opacity) - 0.05;
    } else {
      clearInterval(fadeEffect);
      callback && callback();
    }
  }, 25);
}

// Returns a random integer between min and max (inclusive)
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fisher-Yates shuffle to randomize an array.
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// Get a random alive player (other than the given one) with an optional role filter.
function getRandomPlayer(excludeUsername, roleFilter = null) {
  let candidates = gameState.players.filter(
    (p) =>
      p.alive &&
      p.username !== excludeUsername &&
      (roleFilter ? p.role === roleFilter : true)
  );
  if (candidates.length === 0) return null;
  return candidates[getRandomInt(0, candidates.length - 1)];
}
