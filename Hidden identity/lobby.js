// lobby.js
document.addEventListener("DOMContentLoaded", () => {
  // Attach event listeners for Join and Create buttons.
  document.getElementById("join-btn").addEventListener("click", () => {
    showScreen("lobby-screen");
    generateLobbies();
  });
  
  document.getElementById("create-btn").addEventListener("click", () => {
    showScreen("lobby-screen");
    generateLobbies();
  });
  
  function generateLobbies() {
    const lobbyList = document.getElementById("lobby-list");
    lobbyList.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      const playersCount = getRandomInt(2, 14);
      const lobbyDiv = document.createElement("div");
      lobbyDiv.className = "lobby-item";
      lobbyDiv.textContent = `Berwyn Lobby ${i + 1}: ${playersCount}/15 players`;
      lobbyDiv.addEventListener("click", () => {
        joinLobby(playersCount);
      });
      lobbyList.appendChild(lobbyDiv);
    }
  }
  
  function joinLobby(initialCount) {
    gameState.lobby.currentPlayers = initialCount;
    showScreen("waiting-lobby-screen");
    updateLobbyStatus();
    gameState.lobby.intervalId = setInterval(() => {
      if (gameState.lobby.currentPlayers < gameState.lobby.maxPlayers) {
        gameState.lobby.currentPlayers++;
        updateLobbyStatus();
      }
      if (gameState.lobby.currentPlayers >= gameState.lobby.maxPlayers) {
        clearInterval(gameState.lobby.intervalId);
        startCountdown();
      }
    }, getRandomInt(500, 5000));
  }
  
  function updateLobbyStatus() {
    const status = document.getElementById("lobby-status");
    status.textContent = `Players: ${gameState.lobby.currentPlayers}/15`;
  }
  
  function startCountdown() {
    showScreen("countdown-screen");
    let count = 3;
    const countdownText = document.getElementById("countdown-text");
    countdownText.textContent = count;
    const countdownInterval = setInterval(() => {
      count--;
      if (count > 0) {
        countdownText.textContent = count;
      } else {
        clearInterval(countdownInterval);
        fadeOut(document.getElementById("countdown-screen"), () => {
          document.body.style.backgroundColor = "#000";
          setTimeout(() => {
            assignRoles();
          }, 1000);
        });
      }
    }, 1000);
  }
});
