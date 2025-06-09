// game.js
document.addEventListener("DOMContentLoaded", () => {
  // Role assignment & game setup.
  window.assignRoles = function() {
    gameState.players = [];
    const userIsDeceiver = Math.random() < 4 / 15;
    gameState.role = userIsDeceiver ? "Deceiver" : "Investigator";
  
    // Create user using the provided username (default to "Player").
    const usernameInput = document.getElementById("username-input");
    const username = usernameInput ? usernameInput.value.trim() : "Player";
    gameState.user = { username: username, role: gameState.role, alive: true };
    gameState.players.push(gameState.user);
  
    // Create 14 bots using a simple list.
    const botNames = ["Alpha", "Bravo", "Charlie", "Delta", "Echo", "Foxtrot", "Golf", "Hotel", "India", "Juliet", "Kilo", "Lima", "Mike", "November"];
    shuffleArray(botNames);
    for (let i = 0; i < 14; i++) {
      const botName = botNames[i % botNames.length] + i;
      gameState.players.push({
        username: botName,
        role: "Investigator",
        alive: true,
        personality: ["False Accusations", "Fabricated Events", "Selective", "Red Herrings", "Mimicry", "Silence", "Logic Manipulation"][getRandomInt(0, 6)],
        investigationResult: ""
      });
    }
  
    // Assign deceiver roles among bots.
    const deceiversNeeded = userIsDeceiver ? 3 : 4;
    let botIndices = [];
    for (let i = 1; i < gameState.players.length; i++) {
      botIndices.push(i);
    }
    shuffleArray(botIndices);
    for (let i = 0; i < deceiversNeeded; i++) {
      let idx = botIndices[i];
      gameState.players[idx].role = "Deceiver";
    }
  
    simulateBotInvestigations();
    startGamePhase();
  };
  
  function startGamePhase() {
    document.body.style.backgroundColor = "#000";
    if (gameState.user.role === "Investigator") {
      showScreen("investigation-screen");
      document.getElementById("role-display").textContent = "Role: Investigator";
    } else {
      showScreen("investigation-screen");
      document.getElementById("role-display").textContent = "Role: Deceiver";
    }
    // Also set a fallback auto-call meeting timeout.
    setTimeout(callMeeting, 30000);
  }
  
  // Meeting can be called via the "Call Meeting" button or after 30 sec.
  window.callMeeting = function() {
    clearInterval(gameState.meetingChatInterval);
    showScreen("meeting-screen");
    populatePlayerList();
    startChatSimulation();
  };
  
  const callMeetingBtn = document.getElementById("call-meeting-btn");
  if (callMeetingBtn) {
    callMeetingBtn.addEventListener("click", function() {
      callMeeting();
    });
  }
  
  // User investigation.
  const roomButtons = document.querySelectorAll(".room-btn");
  roomButtons.forEach(btn => {
    btn.addEventListener("click", function() {
      if (gameState.user.role !== "Investigator" && gameState.user.role !== "Deceiver") return;
      investigateRoom(this.dataset.room);
    });
  });
  
  function investigateRoom(roomName) {
    roomButtons.forEach(btn => btn.disabled = true);
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
          "found a mysterious key.",
          "discovered strange footprints.",
          "found an old map fragment.",
          "discovered an ancient coin.",
          "found a cryptic note."
        ];
        message = "You " + possibleFindings[getRandomInt(0, possibleFindings.length - 1)];
      }
      resultDiv.textContent = `${message} (in ${roomName})`;
      gameState.investigationClue = `${message} (in ${roomName})`;
    }, duration);
  }
  
  function simulateBotInvestigations() {
    gameState.players.forEach(player => {
      if (player.username === gameState.user.username) return;
      const roomNames = ["Basement", "Garage", "Attic", "Kitchen", "Library"];
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
        "found a mysterious key.",
        "discovered strange footprints.",
        "found an old map fragment.",
        "discovered an ancient coin.",
        "found a cryptic note."
      ];
      result = truths[getRandomInt(0, truths.length - 1)];
    }
    if (bot.role === "Deceiver" && Math.random() < 0.5) {
      const falseFindings = [
        "claimed to have found a secret weapon.",
        "alleged to have discovered incriminating evidence.",
        "insisted they found a hidden dossier.",
        "declared they uncovered a mysterious relic."
      ];
      result = falseFindings[getRandomInt(0, falseFindings.length - 1)];
    }
    return `in ${roomName}, ${result}`;
  }
  
  function populatePlayerList() {
    const playerListDiv = document.getElementById("player-list");
    playerListDiv.innerHTML = "<h3>Players:</h3>";
    gameState.players.forEach(player => {
      if (player.alive) {
        const span = document.createElement("span");
        span.className = "player-item";
        span.textContent = player.username;
        playerListDiv.appendChild(span);
      }
    });
  }
  
  function startChatSimulation() {
    const chatBox = document.getElementById("chat-box");
    chatBox.innerHTML = "";
    function botChat() {
      const aliveBots = gameState.players.filter(p => p.alive && p.username !== gameState.user.username);
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
    if (bot.personality === "Mimicry") {
      const chatBox = document.getElementById("chat-box");
      if (chatBox.children.length > 0) {
        const lastMsg = chatBox.children[chatBox.children.length - 1].textContent;
        msg = "Echo: " + lastMsg;
      } else {
        msg = "I have nothing to add...";
      }
      return msg;
    }
    if (bot.personality === "Silence") {
      if (Math.random() < 0.7) return "";
      else msg = " ... ";
    }
    if (bot.investigationResult && Math.random() < 0.6) {
      msg = "I " + bot.investigationResult;
    }
    switch (bot.personality) {
      case "False Accusations":
        {
          const target = getRandomPlayer(bot.username);
          if (target) msg += ` I suspect ${target.username} is hiding something!`;
          break;
        }
      case "Fabricated Events":
        {
          const target = getRandomPlayer(bot.username);
          if (target) msg += ` I saw ${target.username} lurking around earlier...`;
          break;
        }
      case "Selective":
        {
          msg += "I found something odd, but I'm not sure what it means.";
          break;
        }
      case "Red Herrings":
        {
          msg += "I think it's a red herring.";
          break;
        }
      case "Logic Manipulation":
        {
          const cand1 = getRandomPlayer(bot.username);
          const cand2 = getRandomPlayer(
            bot.username,
            cand1 ? gameState.players.find(p => p.username === cand1.username).role : null
          );
          msg += `If ${cand1 ? cand1.username : "someone"} is innocent, then ${cand2 ? cand2.username : "another"} must be lying.`;
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
  
  document.getElementById("send-chat").addEventListener("click", () => {
    const chatInput = document.getElementById("chat-input");
    const userMsg = chatInput.value.trim();
    if (userMsg !== "") {
      appendChatMessage("You", userMsg);
      chatInput.value = "";
    }
  });
  
  document.getElementById("vote-btn").addEventListener("click", () => {
    clearInterval(gameState.meetingChatInterval);
    showVotingScreen();
  });
  
  function showVotingScreen() {
    showScreen("voting-screen");
    const votingListDiv = document.getElementById("voting-player-list");
    votingListDiv.innerHTML = "";
    gameState.players.forEach((player, index) => {
      if (player.alive && player.username !== gameState.user.username) {
        const div = document.createElement("div");
        div.className = "voting-player-item";
        div.textContent = player.username;
        div.dataset.index = index;
        div.addEventListener("click", () => {
          toggleVote(div);
        });
        votingListDiv.appendChild(div);
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
    gameState.players.forEach(player => {
      if (player.alive) voteCounts[player.username] = 0;
    });
    gameState.userVotes.forEach(idx => {
      const voted = gameState.players[idx];
      if (voted && voted.alive) {
        voteCounts[voted.username]++;
      }
    });
  
    const sortedPlayers = Object.keys(voteCounts).sort((a, b) => voteCounts[b] - voteCounts[a]);
    const eliminated = sortedPlayers.slice(0, 2);
    gameState.players.forEach(player => {
      if (eliminated.includes(player.username)) {
        player.alive = false;
      }
    });
  
    const deceiversLeft = gameState.players.filter(p => p.alive && p.role === "Deceiver").length;
    const investigatorsLeft = gameState.players.filter(p => p.alive && p.role === "Investigator").length;
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
  
  document.getElementById("restart-btn").addEventListener("click", () => {
    window.location.reload();
  });
  
  function getRandomPlayer(excludeUsername, roleFilter = null) {
    let candidates = gameState.players.filter(
      p => p.alive && p.username !== excludeUsername && (roleFilter ? p.role === roleFilter : true)
    );
    if (candidates.length === 0) return null;
    return candidates[getRandomInt(0, candidates.length - 1)];
  }
});
