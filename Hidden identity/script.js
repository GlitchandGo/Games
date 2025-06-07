document.addEventListener("DOMContentLoaded", () => {
  // Global game state
  const gameState = {
    stage: "welcome", // current stage
    role: "", // "Investigator" or "Deceiver"
    user: null, // user info object
    players: [], // array of all players (user + bots)
    investigationClue: "",
    lobby: {
      currentPlayers: 0,
      maxPlayers: 15,
      intervalId: null,
    },
    meetingChatInterval: null,
    userVotes: [],
  };

  // Utility: Show one screen and hide others
  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => {
      if (screen.id === screenId) {
        screen.classList.remove("hidden");
      } else {
        screen.classList.add("hidden");
      }
    });
  }

  // Fade out element (with a 0.5s transition) before calling a callback
  function fadeOut(element, callback) {
    element.style.opacity = 1;
    const fadeEffect = setInterval(() => {
      if (element.style.opacity > 0) {
        element.style.opacity -= 0.05;
      } else {
        clearInterval(fadeEffect);
        callback && callback();
      }
    }, 25);
  }

  // --- INITIAL SCREEN HANDLERS ---
  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", () => {
    const welcomeScreen = document.getElementById("welcome-screen");
    fadeOut(welcomeScreen, () => {
      showScreen("menu-screen");
      welcomeScreen.style.opacity = 1; // reset for restart
    });
  });

  document.getElementById("join-btn").addEventListener("click", () => {
    showScreen("lobby-screen");
    generateLobbies();
  });

  document.getElementById("create-btn").addEventListener("click", () => {
    // For now, "Create Lobby" acts the same as join.
    showScreen("lobby-screen");
    generateLobbies();
  });

  // --- LOBBY PHASE ---
  function generateLobbies() {
    const lobbyList = document.getElementById("lobby-list");
    lobbyList.innerHTML = "";
    for (let i = 0; i < 10; i++) {
      // Random current players between 2 and 14 for display purposes
      const playersCount = getRandomInt(2, 14);
      const lobbyDiv = document.createElement("div");
      lobbyDiv.className = "lobby-item";
      lobbyDiv.textContent = `Berwyn Lobby ${i + 1}: ${playersCount}/${gameState.lobby.maxPlayers} players`;
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
    // Simulate bot joining at a random interval between 5 and 20 sec
    gameState.lobby.intervalId = setInterval(() => {
      if (gameState.lobby.currentPlayers < gameState.lobby.maxPlayers) {
        gameState.lobby.currentPlayers++;
        updateLobbyStatus();
      }
      if (gameState.lobby.currentPlayers >= gameState.lobby.maxPlayers) {
        clearInterval(gameState.lobby.intervalId);
        startCountdown();
      }
    }, getRandomInt(5000, 20000));
  }

  function updateLobbyStatus() {
    const status = document.getElementById("lobby-status");
    status.textContent = `Players: ${gameState.lobby.currentPlayers}/${gameState.lobby.maxPlayers}`;
  }

  // --- COUNTDOWN & TRANSITION TO GAME ---
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
          document.body.style.backgroundColor = "#000"; // fade-to-black effect
          setTimeout(() => {
            assignRoles();
          }, 1000);
        });
      }
    }, 1000);
  }

  // --- ROLE ASSIGNMENT & GAME SETUP ---
  function assignRoles() {
    // Create 15 players: one user and 14 bots.
    gameState.players = [];
    // User role: chance 4/15 to be a deceiver.
    const userIsDeceiver = Math.random() < 4 / 15;
    gameState.role = userIsDeceiver ? "Deceiver" : "Investigator";
    gameState.user = { username: "You", role: gameState.role, alive: true };
    gameState.players.push(gameState.user);
    // Create 14 bots.
    for (let i = 1; i <= 14; i++) {
      gameState.players.push({ username: `Bot${i}`, role: "Investigator", alive: true });
    }
    // Now assign deceiver roles among bots so that total deceivers = 4.
    const deceiversNeeded = userIsDeceiver ? 3 : 4;
    const botIndices = [...Array(14).keys()].map((i) => i + 1);
    shuffleArray(botIndices);
    for (let i = 0; i < deceiversNeeded; i++) {
      const idx = botIndices[i];
      gameState.players[idx].role = "Deceiver";
    }
    startGamePhase();
  }

  function startGamePhase() {
    // Restore background color.
    document.body.style.backgroundColor = "#222";
    if (gameState.user.role === "Investigator") {
      showScreen("investigation-screen");
      document.getElementById("role-display").textContent = "Role: Investigator";
      // Automatically call the meeting after 30 seconds if no investigation is made.
      setTimeout(callMeeting, 30000);
    } else {
      showScreen("investigation-screen");
      document.getElementById("role-display").textContent = "Role: Deceiver";
      document.getElementById("investigation-panel").innerHTML =
        "<p>You are a Deceiver. Wait for the meeting.</p>";
      setTimeout(callMeeting, 30000);
    }
  }

  // --- INVESTIGATION PHASE ---
  const roomButtons = document.querySelectorAll(".room-btn");
  roomButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (gameState.user.role !== "Investigator") return; // only allow investigators to investigate
      investigateRoom(this.dataset.room);
    });
  });

  function investigateRoom(roomId) {
    // Disable buttons to prevent multiple clicks.
    roomButtons.forEach((btn) => (btn.disabled = true));
    const resultDiv = document.getElementById("investigation-result");
    resultDiv.textContent = "Investigating...";
    // Investigate between 3–8 seconds.
    const duration = getRandomInt(3000, 8000);
    setTimeout(() => {
      const findings = getRandomInt(0, 5);
      let message = "";
      if (findings === 0) {
        message = "You found nothing.";
      } else {
        const possibleFindings = [
          "You found a book on Magic Spells.",
          "You discovered an old key.",
          "You found mysterious footprints.",
          "You discovered a torn map.",
          "You found an ancient coin.",
        ];
        message =
          possibleFindings[getRandomInt(0, possibleFindings.length - 1)];
      }
      resultDiv.textContent = message;
      gameState.investigationClue = message;
    }, duration);
  }

  // --- MEETING PHASE ---
  function callMeeting() {
    showScreen("meeting-screen");
    populatePlayerList();
    startChatSimulation();
  }

  function populatePlayerList() {
    const playerListDiv = document.getElementById("player-list");
    playerListDiv.innerHTML = "<h3>Players:</h3>";
    gameState.players.forEach((player) => {
      if (player.alive) {
        const pItem = document.createElement("span");
        pItem.className = "player-item";
        pItem.textContent = player.username;
        playerListDiv.appendChild(pItem);
      }
    });
  }

  // --- CHAT SIMULATION ---
  function startChatSimulation() {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
    function botChat() {
      const aliveBots = gameState.players.filter(
        (p) => p.alive && p.username !== "You"
      );
      if (aliveBots.length === 0) return;
      const randomBot =
        aliveBots[getRandomInt(0, aliveBots.length - 1)];
      const messages = [
        "I think Bot3 is acting weird.",
        "I found something interesting in my room.",
        "Not sure about what I saw.",
        "Maybe we should vote carefully.",
        "I have a feeling someone is lying.",
      ];
      const message = messages[getRandomInt(0, messages.length - 1)];
      appendChatMessage(randomBot.username, message);
    }
    gameState.meetingChatInterval = setInterval(() => {
      botChat();
    }, getRandomInt(500, 3000));
  }

  function appendChatMessage(username, message) {
    const chatBox = document.getElementById("chat-box");
    const msgDiv = document.createElement("div");
    msgDiv.textContent = `${username}: ${message}`;
    chatBox.appendChild(msgDiv);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // Send user chat messages
  document.getElementById("send-chat").addEventListener("click", () => {
    const chatInput = document.getElementById("chat-input");
    const userMsg = chatInput.value.trim();
    if (userMsg !== "") {
      appendChatMessage("You", userMsg);
      chatInput.value = "";
    }
  });

  // When vote button is clicked, stop chat simulation and move to voting phase.
  document.getElementById("vote-btn").addEventListener("click", () => {
    clearInterval(gameState.meetingChatInterval);
    showVotingScreen();
  });

  // --- VOTING PHASE ---
  function showVotingScreen() {
    showScreen("voting-screen");
    const votingListDiv = document.getElementById("voting-player-list");
    votingListDiv.innerHTML = "";
    gameState.players.forEach((player, index) => {
      if (player.alive && player.username !== "You") {
        const playerDiv = document.createElement("div");
        playerDiv.className = "voting-player-item";
        playerDiv.textContent = player.username;
        playerDiv.dataset.index = index;
        playerDiv.addEventListener("click", () => {
          toggleVote(playerDiv);
        });
        votingListDiv.appendChild(playerDiv);
      }
    });
  }

  function toggleVote(div) {
    if (div.classList.contains("selected")) {
      div.classList.remove("selected");
      const idx = gameState.userVotes.indexOf(div.dataset.index);
      if (idx > -1) gameState.userVotes.splice(idx, 1);
    } else {
      if (gameState.userVotes.length < 2) {
        div.classList.add("selected");
        gameState.userVotes.push(div.dataset.index);
      }
    }
  }

  document
    .getElementById("submit-vote-btn")
    .addEventListener("click", () => {
      if (gameState.userVotes.length !== 2) {
        alert("Please select exactly 2 players to vote out.");
        return;
      }
      simulateVoting();
    });

  // Simulate bot and user votes, eliminate two players, and check win conditions.
  function simulateVoting() {
    const voteCounts = {};
    gameState.players.forEach((player) => {
      if (player.alive) voteCounts[player.username] = 0;
    });
    // Add user's votes.
    gameState.userVotes.forEach((idx) => {
      const votedPlayer = gameState.players[idx];
      if (votedPlayer && votedPlayer.alive) {
        voteCounts[votedPlayer.username]++;
      }
    });
    // Each alive bot votes (randomly, excluding themselves).
    gameState.players.forEach((player) => {
      if (player.alive && player.username !== "You") {
        const voteOptions = gameState.players.filter(
          (p) => p.alive && p.username !== player.username
        );
        const randomChoice =
          voteOptions[getRandomInt(0, voteOptions.length - 1)];
        voteCounts[randomChoice.username]++;
      }
    });
    // Determine the two players with the highest votes.
    const sortedPlayers = Object.keys(voteCounts).sort(
      (a, b) => voteCounts[b] - voteCounts[a]
    );
    const eliminated = sortedPlayers.slice(0, 2);
    gameState.players.forEach((player) => {
      if (eliminated.includes(player.username)) {
        player.alive = false;
      }
    });
    // Count remaining deceivers and investigators.
    const deceiversLeft = gameState.players.filter(
      (p) => p.alive && p.role === "Deceiver"
    ).length;
    const investigatorsLeft = gameState.players.filter(
      (p) => p.alive && p.role === "Investigator"
    ).length;
    let resultMsg = "";
    if (deceiversLeft === 0) {
      resultMsg = "Investigators win!";
    } else if (deceiversLeft >= investigatorsLeft) {
      resultMsg = "Deceivers win!";
    } else {
      // For our demo, if neither condition is reached we call it a win for investigators.
      resultMsg = "Investigators win!";
    }
    showResult(resultMsg);
  }

  function showResult(message) {
    showScreen("result-screen");
    const resultMessage = document.getElementById("result-message");
    if (
      (gameState.user.role === "Investigator" &&
        message === "Investigators win!") ||
      (gameState.user.role === "Deceiver" &&
        message === "Deceivers win!")
    ) {
      resultMessage.textContent = `You win! ${message}`;
    } else {
      resultMessage.textContent = `You lose! ${message}`;
    }
  }

  // Restart game: reload the page.
  document.getElementById("restart-btn").addEventListener("click", () => {
    window.location.reload();
  });

  // --- UTILITY FUNCTIONS ---
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
});
