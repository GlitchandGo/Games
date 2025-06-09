// game.js
document.addEventListener("DOMContentLoaded", () => {
  // ROLE ASSIGNMENT & GAME SETUP
  // This function is called by lobby.js after the countdown.
  window.assignRoles = function () {
    // Create 15 players: one user and 14 bots.
    gameState.players = [];
    const userIsDeceiver = Math.random() < 4 / 15;
    gameState.role = userIsDeceiver ? "Deceiver" : "Investigator";
    // Use the provided username if available.
    const finalUsername = gameState.userNameOverride || "You";
    gameState.user = { username: finalUsername, role: gameState.role, alive: true };
    gameState.players.push(gameState.user);
    // Make a copy of the botUsernamePool so names aren’t reused.
    const availableNames = [...botUsernamePool];
    shuffleArray(availableNames);
    // Create 14 bots with a randomly chosen username and AI personality.
    for (let i = 0; i < 14; i++) {
      const personality = personalities[getRandomInt(0, personalities.length - 1)];
      const botName = availableNames.pop() || `Bot${i + 1}`;
      gameState.players.push({
        username: botName,
        role: "Investigator",
        alive: true,
        personality: personality,
        investigationResult: "",
      });
    }
    // Assign deceiver roles among bots so that total deceivers equal 4.
    const deceiversNeeded = userIsDeceiver ? 3 : 4;
    let botIndices = [...Array(14).keys()].map((i) => i + 1);
    shuffleArray(botIndices);
    for (let i = 0; i < deceiversNeeded; i++) {
      const idx = botIndices[i];
      gameState.players[idx].role = "Deceiver";
    }
    // Simulate bot investigations.
    simulateBotInvestigations();
    startGamePhase();
  };

  function startGamePhase() {
    document.body.style.backgroundColor = "#222";
    if (gameState.user.role === "Investigator") {
      showScreen("investigation-screen");
      document.getElementById("role-display").textContent =
        "Role: Investigator";
    } else {
      showScreen("investigation-screen");
      document.getElementById("role-display").textContent =
        "Role: Deceiver";
    }
    // Automatically call the meeting after 30 seconds.
    setTimeout(callMeeting, 30000);
  }

  // --- USER INVESTIGATION ---
  const roomButtons = document.querySelectorAll(".room-btn");
  roomButtons.forEach((btn) => {
    btn.addEventListener("click", function () {
      if (
        gameState.user.role !== "Investigator" &&
        gameState.user.role !== "Deceiver"
      )
        return;
      investigateRoom(this.dataset.room);
    });
  });

  function investigateRoom(roomName) {
    // Disable investigation buttons for this round.
    roomButtons.forEach((btn) => (btn.disabled = true));
    const resultDiv = document.getElementById("investigation-result");
    resultDiv.textContent = "Investigating...";
    const duration = getRandomInt(3000, 8000);
    setTimeout(() => {
      const findingNum = getRandomInt(0, 5);
      let message = "";
      if (findingNum === 0) {
        message = "You found nothing.";
      } else {
        const possibleFindings = [
          "found a book on Magic Spells.",
          "discovered an old key.",
          "found mysterious footprints.",
          "discovered a torn map.",
          "found an ancient coin.",
        ];
        message =
          "You " +
          possibleFindings[getRandomInt(0, possibleFindings.length - 1)];
      }
      resultDiv.textContent = `${message} (in ${roomName})`;
      gameState.investigationClue = `${message} (in ${roomName})`;
    }, duration);
  }

  // --- SIMULATE BOT INVESTIGATIONS ---
  function simulateBotInvestigations() {
    gameState.players.forEach((player) => {
      if (player.username === gameState.user.username) return;
      const roomName = roomNames[getRandomInt(0, roomNames.length - 1)];
      const delay = getRandomInt(3000, 8000);
      setTimeout(() => {
        player.investigationResult = getBotInvestigationResult(player, roomName);
      }, delay);
    });
  }

  function getBotInvestigationResult(bot, roomName) {
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
    // If the bot is a deceiver, it has a 50% chance to alter the outcome.
    if (bot.role === "Deceiver" && Math.random() < 0.5) {
      const falseFindings = [
        "claimed to have found a secret weapon.",
        "alleged to have discovered incriminating evidence.",
        "insisted they found a hidden dossier.",
        "declared they uncovered a mysterious relic.",
      ];
      result = falseFindings[getRandomInt(0, falseFindings.length - 1)];
    }
    return `in ${roomName}, ${result}`;
  }

  // --- MEETING PHASE & CHAT ---
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

  // Dynamic Bot Chat Simulation – each bot speaks based on its personality.
  function startChatSimulation() {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
    function botChat() {
      const aliveBots = gameState.players.filter(
        (p) => p.alive && p.username !== gameState.user.username
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
    let msg = "";
    // Mimicry: copy the last message in the chat.
    if (bot.personality === "Mimicry") {
      const chatBox = document.getElementById("chat-box");
      if (chatBox.children.length > 0) {
        const lastMsg =
          chatBox.children[chatBox.children.length - 1].textContent;
        msg = "Echoing: " + lastMsg;
      } else {
        msg = "I have nothing to say...";
      }
      return msg;
    }
    // Silence: mostly say nothing.
    if (bot.personality === "Silence") {
      if (Math.random() < 0.7) return "";
      else msg = " ... ";
    }
    // Sometimes include their investigation result.
    if (bot.investigationResult && Math.random() < 0.6) {
      msg = "I " + bot.investigationResult;
    }
    // Other personality-specific messages.
    switch (bot.personality) {
      case "False Accusations": {
        const target = getRandomPlayer(bot.username);
        if (target) msg += `I think ${target.username} is clearly hiding something!`;
        break;
      }
      case "Fabricated Events": {
        const target = getRandomPlayer(bot.username);
        if (target) msg += `I saw ${target.username} sneaking around earlier...`;
        break;
      }
      case "Selective": {
        msg += "I found something in my room... but I'm not entirely sure what it means.";
        break;
      }
      case "Red Herrings": {
        msg += "There was something odd going on — could be a red herring.";
        break;
      }
      case "Logic Manipulation": {
        const cand1 = getRandomPlayer(bot.username);
        const cand2 = getRandomPlayer(
          bot.username,
          cand1 ? gameState.players.find((p) => p.username === cand1.username).role : null
        );
        msg += `If ${cand1 ? cand1.username : "someone"} is innocent, then ${
          cand2 ? cand2.username : "another"
        } must be lying.`;
        break;
      }
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

  // --- USER CHAT ---
  document.getElementById("send-chat").addEventListener("click", () => {
    const chatInput = document.getElementById("chat-input");
    const userMsg = chatInput.value.trim();
    if (userMsg !== "") {
      appendChatMessage("You", userMsg);
      chatInput.value = "";
    }
  });

  // When the Vote button is clicked, stop bot chat and show the voting screen.
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
      if (player.alive && player.username !== gameState.user.username) {
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

  function simulateVoting() {
    const voteCounts = {};
    gameState.players.forEach((player) => {
      if (player.alive) voteCounts[player.username] = 0;
    });
    // Include user votes.
    gameState.userVotes.forEach((idx) => {
      const votedPlayer = gameState.players[idx];
      if (votedPlayer && votedPlayer.alive) {
        voteCounts[votedPlayer.username]++;
      }
    });
    // For each alive bot (excluding the user), determine votes based on weighted chance.
    const chatClues = computeChatClueCounts();
    gameState.players.forEach((player) => {
      if (player.alive && player.username !== gameState.user.username) {
        const rand = getRandomInt(1, 100);
        let targets = [];
        if (rand <= 75) {
          targets.push(
            pickTargetFromCategory("Investigator", player.username, chatClues)
          );
          targets.push(
            pickTargetFromCategory("Deceiver", player.username, chatClues)
          );
        } else if (rand <= 91) {
          targets.push(
            pickTargetFromCategory("Investigator", player.username, chatClues)
          );
          targets.push(
            pickTargetFromCategory("Investigator", player.username, chatClues, targets)
          );
        } else {
          targets.push(
            pickTargetFromCategory("Deceiver", player.username, chatClues)
          );
          targets.push(
            pickTargetFromCategory("Deceiver", player.username, chatClues, targets)
          );
        }
        targets.forEach((target) => {
          if (target && target.alive)
            voteCounts[target.username] = (voteCounts[target.username] || 0) + 1;
        });
      }
    });
    const sortedPlayers = Object.keys(voteCounts).sort(
      (a, b) => voteCounts[b] - voteCounts[a]
    );
    const eliminated = sortedPlayers.slice(0, 2);
    gameState.players.forEach((player) => {
      if (eliminated.includes(player.username)) {
        player.alive = false;
      }
    });
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
      resultMsg = "Investigators win!";
    }
    showResult(resultMsg);
  }

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

  function pickTargetFromCategory(role, selfName, chatClues, alreadyPicked = []) {
    let candidates = gameState.players.filter(
      (p) =>
        p.alive &&
        p.username !== selfName &&
        (!alreadyPicked.includes(p.username)) &&
        p.role === role
    );
    if (candidates.length === 0) {
      candidates = gameState.players.filter(
        (p) =>
          p.alive &&
          p.username !== selfName &&
          !alreadyPicked.includes(p.username)
      );
    }
    candidates.sort(
      (a, b) => (chatClues[b.username] || 0) - (chatClues[a.username] || 0)
    );
    if (
      candidates.length > 0 &&
      (chatClues[candidates[0].username] || 0) > 0
    ) {
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
      (gameState.user.role === "Investigator" &&
        message === "Investigators win!") ||
      (gameState.user.role === "Deceiver" && message === "Deceivers win!")
    ) {
      resultMessage.textContent = `You win! ${message}`;
    } else {
      resultMessage.textContent = `You lose! ${message}`;
    }
  }

  document.getElementById("restart-btn").addEventListener("click", () => {
    window.location.reload();
  });
});
