document.addEventListener("DOMContentLoaded", () => {
  // GLOBAL GAME STATE
  const gameState = {
    stage: "welcome",
    role: "", // "Investigator" or "Deceiver" for the user
    user: null, // { username, role, alive }
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

  // Dynamic AI personalites for bots
  const personalities = [
    "False Accusations",
    "Fabricated Events",
    "Selective",
    "Red Herrings",
    "Mimicry",
    "Silence",
    "Logic Manipulation",
  ];

  // --- UTILITY FUNCTIONS ---
  function showScreen(screenId) {
    document.querySelectorAll(".screen").forEach((screen) => {
      if (screen.id === screenId) {
        screen.classList.remove("hidden");
      } else {
        screen.classList.add("hidden");
      }
    });
  }

  // Fade out an element with a 0.5s transition before calling a callback
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

  // Shuffle an array (Fisher-Yates)
  function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
  }

  // Get a random alive player (other than the given one) filtered by role if needed
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

  // --- INITIAL SCREEN HANDLERS ---
  const startBtn = document.getElementById("start-btn");
  startBtn.addEventListener("click", () => {
    const welcomeScreen = document.getElementById("welcome-screen");
    fadeOut(welcomeScreen, () => {
      showScreen("menu-screen");
      welcomeScreen.style.opacity = 1; // reset for restarts
    });
  });

  document.getElementById("join-btn").addEventListener("click", () => {
    showScreen("lobby-screen");
    generateLobbies();
  });

  document.getElementById("create-btn").addEventListener("click", () => {
    // For now, Create Lobby is treated like Join.
    showScreen("lobby-screen");
    generateLobbies();
  });

  // --- LOBBY PHASE ---
  function generateLobbies() {
    const lobbyList = document.getElementById("lobby-list");
    lobbyList.innerHTML = "";
    for (let i = 0; i < 10; i++) {
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
    // Create 14 bots with randomly assigned personality.
    for (let i = 1; i <= 14; i++) {
      const personality = personalities[getRandomInt(0, personalities.length - 1)];
      gameState.players.push({
        username: `Bot${i}`,
        role: "Investigator", // default role
        alive: true,
        personality: personality,
        investigationResult: "", // to be set in bot investigation simulation
      });
    }
    // Now assign deceiver roles among bots so that total deceivers = 4.
    const deceiversNeeded = userIsDeceiver ? 3 : 4;
    const botIndices = [...Array(14).keys()].map((i) => i + 1);
    shuffleArray(botIndices);
    for (let i = 0; i < deceiversNeeded; i++) {
      const idx = botIndices[i];
      gameState.players[idx].role = "Deceiver";
    }
    // Simulate bot investigations after a short delay.
    simulateBotInvestigations();
    startGamePhase();
  }

  function startGamePhase() {
    // Restore background color.
    document.body.style.backgroundColor = "#222";
    if (gameState.user.role === "Investigator") {
      showScreen("investigation-screen");
      document.getElementById("role-display").textContent = "Role: Investigator";
      // User can manually pick a room. (The investigation result is shown below.)
    } else {
      // Deceivers now also see a clickable investigation interface,
      // but later their investigation clue may be altered.
      showScreen("investigation-screen");
      document.getElementById("role-display").textContent = "Role: Deceiver";
    }
    // Automatically call meeting after 30 seconds.
    setTimeout(callMeeting, 30000);
  }

  // --- USER INVESTIGATION HANDLER ---
  const roomButtons = document.querySelectorAll(".room-btn");
  roomButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (gameState.user.role !== "Investigator" && gameState.user.role !== "Deceiver") return;
      investigateRoom(this.dataset.room);
    });
  });

  function investigateRoom(roomId) {
    // Allow user to click investigation only once per round.
    roomButtons.forEach((btn) => (btn.disabled = true));
    const resultDiv = document.getElementById("investigation-result");
    resultDiv.textContent = "Investigating...";
    const duration = getRandomInt(3000, 8000);
    setTimeout(() => {
      // For user-investigation, generate a result based on unbiased random chance.
      const findingNum = getRandomInt(0, 5); // 0 means nothing
      let message = "";
      if (findingNum === 0) {
        message = "You found nothing.";
      } else {
        const possibleFindings = [
          "You found a book on Magic Spells.",
          "You discovered an old key.",
          "You found mysterious footprints.",
          "You discovered a torn map.",
          "You found an ancient coin.",
        ];
        message = possibleFindings[getRandomInt(0, possibleFindings.length - 1)];
      }
      resultDiv.textContent = message;
      gameState.investigationClue = message;
    }, duration);
  }

  // --- SIMULATE BOT INVESTIGATIONS ---
  function simulateBotInvestigations() {
    // Each bot (not user) receives an investigation result for a random room.
    gameState.players.forEach((player) => {
      if (player.username === "You") return;
      const roomId = getRandomInt(1, 5);
      const delay = getRandomInt(3000, 8000);
      setTimeout(() => {
        player.investigationResult = getBotInvestigationResult(player, roomId);
      }, delay);
    });
  }

  // Produce a bot's investigation result based on role and personality.
  function getBotInvestigationResult(bot, roomId) {
    // Base truthful investigation result (same for investigators):
    const findingNum = getRandomInt(0, 5);
    let result = "";
    if (findingNum === 0) {
      result = "found nothing.";
    } else {
      const truths = [
        "found a book on Magic Spells.",
        "discovered an old key.",
        "found mysterious footprints.",
        "discovered a torn map.",
        "found an ancient coin.",
      ];
      result = truths[getRandomInt(0, truths.length - 1)];
    }
    // If bot is a deceiver, they may alter or replace the info.
    if (bot.role === "Deceiver") {
      // 50% chance to alter the result.
      if (Math.random() < 0.5) {
        const falseFindings = [
          "claimed to have found a secret weapon.",
          "alleged to have discovered incriminating evidence.",
          "insisted they found a hidden dossier.",
          "declared they uncovered a mysterious relic.",
        ];
        result = falseFindings[getRandomInt(0, falseFindings.length - 1)];
      }
    }
    // Optionally include room number.
    return `in Room ${roomId}, ${result}`;
  }

  // --- MEETING PHASE ---
  function callMeeting() {
    showScreen("meeting-screen");
    populatePlayerList();
    // Start bot chat simulation with dynamic AI
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

  // --- DYNAMIC BOT CHAT SIMULATION ---
  function startChatSimulation() {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
    function botChat() {
      // Pick a random alive bot (exclude user)
      const aliveBots = gameState.players.filter(
        (p) => p.alive && p.username !== "You"
      );
      if (aliveBots.length === 0) return;
      const bot = aliveBots[getRandomInt(0, aliveBots.length - 1)];
      const message = generateBotChat(bot);
      if (message && message.trim() !== "") {
        appendChatMessage(bot.username, message);
      }
    }
    gameState.meetingChatInterval = setInterval(() => {
      botChat();
    }, getRandomInt(500, 3000));
  }

  function generateBotChat(bot) {
    // Depending on personality, generate a clue message.
    let msg = "";
    // For Mimicry, try to copy the previous message if exists.
    if (bot.personality === "Mimicry") {
      const chatBox = document.getElementById("chat-box");
      if (chatBox.children.length > 0) {
        const lastMsg = chatBox.children[chatBox.children.length - 1].textContent;
        msg = "Echoing: " + lastMsg;
      } else {
        msg = "I have nothing to say...";
      }
      return msg;
    }
    // For Silence, 70% chance to say nothing.
    if (bot.personality === "Silence") {
      if (Math.random() < 0.7) return "";
      else msg = " ... "; // a very minimal message.
    }
    // For others, sometimes incorporate their investigation result if available.
    if (bot.investigationResult && Math.random() < 0.6) {
      msg = "I " + bot.investigationResult;
    }
    // Otherwise, pick a message based on personality type.
    switch (bot.personality) {
      case "False Accusations":
        {
          const target = getRandomPlayer(bot.username);
          if (target)
            msg += `I think ${target.username} is clearly hiding something!`;
        }
        break;
      case "Fabricated Events":
        {
          const target = getRandomPlayer(bot.username);
          if (target)
            msg += `I saw ${target.username} sneaking around earlier...`;
        }
        break;
      case "Selective":
        {
          msg += "I found something in my room... but I'm not entirely sure what it means.";
        }
        break;
      case "Red Herrings":
        {
          msg += "There was something odd going on — it might be a red herring, though.";
        }
        break;
      case "Logic Manipulation":
        {
          const cand1 = getRandomPlayer(bot.username);
          const cand2 = getRandomPlayer(bot.username, cand1 ? gameState.players.find(p => p.username === cand1.username).role : null);
          msg += `If ${cand1 ? cand1.username : "someone"} is innocent, then ${cand2 ? cand2.username : "another"} must be lying.`;
        }
        break;
      default:
        break;
    }
    return msg;
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

  // When vote button is clicked, stop chat simulation and switch to the voting screen.
  document.getElementById("vote-btn").addEventListener("click", () => {
    clearInterval(gameState.meetingChatInterval);
    showVotingScreen();
  });

  // --- VOTING PHASE (Dynamic Voting Based on Chat Clues) ---
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

  document.getElementById("submit-vote-btn").addEventListener("click", () => {
    if (gameState.userVotes.length !== 2) {
      alert("Please select exactly 2 players to vote out.");
      return;
    }
    simulateVoting();
  });

  // NEW: Voting simulation where each bot “listens to clues” in the chat.
  function simulateVoting() {
    const voteCounts = {};
    gameState.players.forEach((player) => {
      if (player.alive) voteCounts[player.username] = 0;
    });
    // Include the user's votes
    gameState.userVotes.forEach((idx) => {
      const votedPlayer = gameState.players[idx];
      if (votedPlayer && votedPlayer.alive) {
        voteCounts[votedPlayer.username]++;
      }
    });
    // For each alive bot (excluding the user), determine votes based on weighted chance.
    const chatClues = computeChatClueCounts();
    gameState.players.forEach((player) => {
      if (player.alive && player.username !== "You") {
        const rand = getRandomInt(1, 100);
        let targets = [];
        if (rand <= 75) {
          // Vote 1 investigator and 1 deceiver.
          targets.push(
            pickTargetFromCategory("Investigator", player.username, chatClues)
          );
          targets.push(
            pickTargetFromCategory("Deceiver", player.username, chatClues)
          );
        } else if (rand <= 91) {
          // Vote 2 investigators.
          targets.push(
            pickTargetFromCategory("Investigator", player.username, chatClues)
          );
          targets.push(
            pickTargetFromCategory("Investigator", player.username, chatClues, targets)
          );
        } else {
          // Vote 2 deceivers.
          targets.push(
            pickTargetFromCategory("Deceiver", player.username, chatClues)
          );
          targets.push(
            pickTargetFromCategory("Deceiver", player.username, chatClues, targets)
          );
        }
        targets.forEach((target) => {
          if (target && target.alive) voteCounts[target.username] =
            (voteCounts[target.username] || 0) + 1;
        });
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
      // For demo purposes, if neither condition is reached we call it an investigators win.
      resultMsg = "Investigators win!";
    }
    showResult(resultMsg);
  }

  // Compute how many times each player's name appears in the chat.
  function computeChatClueCounts() {
    const counts = {};
    const chatBox = document.getElementById("chat-box");
    const messages = chatBox.innerText.split("\n");
    gameState.players.forEach((player) => {
      counts[player.username] = 0;
    });
    messages.forEach((msg) => {
      gameState.players.forEach((player) => {
        if (msg.includes(player.username)) counts[player.username]++;
      });
    });
    return counts;
  }

  // Pick target from a given role category—prefer the one with the highest chat count.
  function pickTargetFromCategory(role, selfName, chatClues, alreadyPicked = []) {
    let candidates = gameState.players.filter(
      (p) =>
        p.alive &&
        p.username !== selfName &&
        (!alreadyPicked.includes(p.username)) &&
        p.role === role
    );
    if (candidates.length === 0) {
      // Fallback: pick from any alive player except self.
      candidates = gameState.players.filter((p) => p.alive && p.username !== selfName && !alreadyPicked.includes(p.username));
    }
    // Look for candidate with highest chat clue count.
    candidates.sort((a, b) => (chatClues[b.username] || 0) - (chatClues[a.username] || 0));
    if (candidates.length > 0 && (chatClues[candidates[0].username] || 0) > 0) {
      return candidates[0];
          } else {
      // Otherwise pick randomly.
      return candidates[getRandomInt(0, candidates.length - 1)];
    }
  }

  function showResult(message) {
    showScreen("result-screen");
    const resultMessage = document.getElementById("result-message");
    if (
      (gameState.user.role === "Investigator" && message === "Investigators win!") ||
      (gameState.user.role === "Deceiver" && message === "Deceivers win!")
    ) {
      resultMessage.textContent = `You win! ${message}`;
    } else {
      resultMessage.textContent = `You lose! ${message}`;
    }
  }

  // Restart game (reloads the page).
  document.getElementById("restart-btn").addEventListener("click", () => {
    window.location.reload();
  });
});
