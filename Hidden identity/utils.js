// utils.js
document.addEventListener("DOMContentLoaded", () => {
  // GLOBAL GAME STATE
  const gameState = {
    stage: "welcome",
    role: "", // "Investigator" or "Deceiver"
    user: null,
    players: [],
    investigationClue: "",
    lobby: {
      currentPlayers: 0,
      maxPlayers: 15,
      intervalId: null,
    },
    meetingChatInterval: null,
    userVotes: []
  };
  
  window.gameState = gameState; // Expose for use in other files
  
  // Utility functions
  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach(screen => {
      screen.id === screenId
        ? screen.classList.remove("hidden")
        : screen.classList.add("hidden");
    });
  }
  
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
  
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = getRandomInt(0, i);
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
  
  window.showScreen = showScreen;
  window.fadeOut = fadeOut;
  window.getRandomInt = getRandomInt;
  window.shuffleArray = shuffleArray;
});
