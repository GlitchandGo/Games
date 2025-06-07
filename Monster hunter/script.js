// script.js

// Global game state
const gameState = {
  world: 1,
  position: 0,
  hp: 100,
  maxHp: 100,
  gold: 0,
  board: [],
  usedItemThisTurn: false,
  activeDiceItem: null, // Options: "double", "triple", "golden", "picky", "reroll"
  inventory: {
    sword: "Wood",             // Default Sword
    swordReduction: 0.80,        // 80% of incoming damage taken
    maxBoosterCount: 0,          // Can buy up to 3
    dice: { double: 0, triple: 0, golden: 0, picky: 0, reroll: 0 },
    healingPotions: 0
  }
};

// Base monster damage per world
const monsterDamage = {
  1: 25,
  2: 50,
  3: 100,
  4: 200,
  5: 400
};

// Predefined gold values for spaces (lookup per world)
const goldValues = {
  1: { gold3: 3, gold5: 5 },
  2: { gold3: 5, gold5: 8 },
  3: { gold3: 8, gold5: 13 },
  4: { gold3: 12, gold5: 20 },
  5: { gold3: 18, gold5: 30 }
};

// Shop items definition
const shopItems = [
  {
    id: "stoneSword",
    name: "Stone Sword (65% damage taken)",
    cost: 50,
    type: "sword",
    reduction: 0.65
  },
  {
    id: "silverSword",
    name: "Silver Sword (50% damage taken)",
    cost: 75,
    type: "sword",
    reduction: 0.50
  },
  {
    id: "goldSword",
    name: "Gold Sword (40% damage taken)",
    cost: 100,
    type: "sword",
    reduction: 0.40
  },
  {
    id: "diamondSword",
    name: "Diamond Sword (25% damage taken)",
    cost: 150,
    type: "sword",
    reduction: 0.25
  },
  {
    id: "healingPotion",
    name: "Healing Potion (+50 HP)",
    cost: 20,
    type: "consumable"
  },
  {
    id: "maxBooster",
    name: "Max Booster (+50 Max HP)",
    cost: 100,
    type: "maxBooster"
  },
  {
    id: "doubleDie",
    name: "Double Die (Roll 2 dice next turn)",
    cost: 15,
    type: "dice",
    diceType: "double"
  },
  {
    id: "tripleDie",
    name: "Triple Die (Roll 3 dice next turn)",
    cost: 25,
    type: "dice",
    diceType: "triple"
  },
  {
    id: "goldenDie",
    name: "Golden Die (Guaranteed 6 on next turn)",
    cost: 30,
    type: "dice",
    diceType: "golden"
  },
  {
    id: "pickyDie",
    name: "Picky Die (Choose your dice number)",
    cost: 50,
    type: "dice",
    diceType: "picky"
  },
  {
    id: "reroll",
    name: "Reroll (Re-roll dice)",
    cost: 10,
    type: "dice",
    diceType: "reroll"
  }
];

// Generate a board for the current world.
// For every 10 spaces: 2 gold3, 2 gold5, 2 heal, 2 monster, 2 back5.
function generateBoard() {
  let types = ["gold3", "gold3", "gold5", "gold5", "heal", "heal", "monster", "monster", "back5", "back5"];
  // Shuffle the array (Fisher–Yates shuffle)
  for (let i = types.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [types[i], types[j]] = [types[j], types[i]];
  }
  return types.map(t => ({ type: t }));
}

// Initialize (or reset) the game state
function initGame() {
  gameState.world = 1;
  gameState.position = 0;
  gameState.hp = 100;
  gameState.maxHp = 100;
  gameState.gold = 0;
  gameState.usedItemThisTurn = false;
  gameState.activeDiceItem = null;
  gameState.inventory = {
    sword: "Wood",
    swordReduction: 0.80,
    maxBoosterCount: 0,
    dice: { double: 0, triple: 0, golden: 0, picky: 0, reroll: 0 },
    healingPotions: 0
  };
  gameState.board = generateBoard();
  updateUI();
}

// Roll dice based on the current active dice item.
// A callback is used to pass the resulting roll value onward.
function rollDice(callback) {
  let rollValue = 0;
  if (gameState.activeDiceItem) {
    switch(gameState.activeDiceItem) {
      case "double":
        rollValue = rollDie() + rollDie();
        break;
      case "triple":
        rollValue = rollDie() + rollDie() + rollDie();
        break;
      case "golden":
        rollValue = 6;
        break;
      case "picky":
        // For picky die, show the modal to let player choose the number.
        showPickyModal(callback);
        return; // Exit early – the callback will later be called.
      case "reroll":
        // In a reroll, we simply roll a standard die.
        rollValue = rollDie();
        break;
      default:
        rollValue = rollDie();
    }
  } else {
    rollValue = rollDie();
  }
  // Reset dice item and mark item as used.
  gameState.activeDiceItem = null;
  gameState.usedItemThisTurn = true;
  callback(rollValue);
}

// Standard die roll: random number between 1 and 6.
function rollDie() {
  return Math.floor(Math.random() * 6) + 1;
}

// Process the effect of landing on a board space.
function processSpace(spaceType) {
  let message = "";
  switch(spaceType) {
    case "gold3":
      var goldEarned = goldValues[gameState.world].gold3;
      gameState.gold += goldEarned;
      message = `You found a gold space! Gained ${goldEarned} gold.`;
      break;
    case "gold5":
      var goldEarned = goldValues[gameState.world].gold5;
      gameState.gold += goldEarned;
      message = `You found a richer gold space! Gained ${goldEarned} gold.`;
      break;
    case "heal":
      let healAmt = 50;
      let oldHP = gameState.hp;
      gameState.hp = Math.min(gameState.hp + healAmt, gameState.maxHp);
      message = `You landed on a heal space! Restored ${gameState.hp - oldHP} HP.`;
      break;
    case "monster":
      let baseDamage = monsterDamage[gameState.world];
      // Damage taken is reduced by sword (rounded to nearest whole number)
      let damage = Math.round(baseDamage * gameState.inventory.swordReduction);
      gameState.hp -= damage;
      // Bonus gold for defeating a monster.
      gameState.gold += 10;
      message = `A monster attacked! You took ${damage} damage (with your ${gameState.inventory.sword} Sword) and earned 10 gold.`;
      break;
    case "back5":
      gameState.position = Math.max(gameState.position - 5, 0);
      message = "You hit a trap! Moved back 5 spaces.";
      break;
    default:
      message = "Nothing happens...";
  }
  showMessage(message);
  checkGameStatus();
}

// Check if the player has run out of HP or if the world has been completed.
function checkGameStatus() {
  if (gameState.hp <= 0) {
    alert("Game Over! You have perished in the dungeon.");
    initGame();
  } else if (gameState.position >= gameState.board.length) {
    if (gameState.world === 5) {
      alert("Congratulations! You've completed Monster Hunter!");
      initGame();
    } else {
      gameState.world += 1;
      gameState.position = 0;
      gameState.board = generateBoard();
      showMessage(`Welcome to World ${gameState.world}! A new dungeon awaits.`);
    }
  }
  updateUI();
}

// Move the player along the board based on the roll value.
function movePlayer(spacesMoved) {
  gameState.position += spacesMoved;
  if (gameState.position >= gameState.board.length) {
    // If overshooting, clamp to board's last space.
    gameState.position = gameState.board.length - 1;
  }
  processSpace(gameState.board[gameState.position].type);
}

// Called at the end of a dice roll to execute the turn.
function takeTurn(diceRoll) {
  showMessage(`You rolled a ${diceRoll}.`);
  movePlayer(diceRoll);
  // Reset the one-item-per-turn flag for the next turn.
  gameState.usedItemThisTurn = false;
  updateUI();
}

// Expose a player roll dice function (used by UI event handlers)
function playerRollDice(callback) {
  rollDice(callback);
}

// For the picky die – resolve the chosen number.
function resolvePickyDie(chosenNumber, callback) {
  let number = parseInt(chosenNumber);
  if (isNaN(number) || number < 1 || number > 6) {
    alert("Invalid entry. Please choose a number between 1 and 6.");
    return;
  }
  gameState.activeDiceItem = null;
  gameState.usedItemThisTurn = true;
  callback(number);
}

// Display the picky die modal.
function showPickyModal(callback) {
  const modal = document.getElementById("picky-modal");
  modal.style.display = "block";
  const confirmBtn = document.getElementById("picky-confirm");
  confirmBtn.onclick = function() {
    let input = document.getElementById("picky-input").value;
    modal.style.display = "none";
    resolvePickyDie(input, callback);
  };
}

// Shop purchase: deduct gold and apply the item’s effect immediately or add to inventory.
function purchaseItem(itemId) {
  const item = shopItems.find(i => i.id === itemId);
  if (!item) return;
  if (gameState.gold < item.cost) {
    alert("Not enough gold!");
    return;
  }
  gameState.gold -= item.cost;
  switch(item.type) {
    case "sword":
      gameState.inventory.sword = item.name.split(" ")[0];
      gameState.inventory.swordReduction = item.reduction;
      showMessage(`Upgraded to ${item.name}`);
      break;
    case "consumable":
      gameState.inventory.healingPotions += 1;
      showMessage(`Purchased a Healing Potion.`);
      break;
    case "maxBooster":
      if (gameState.inventory.maxBoosterCount >= 3) {
        alert("Max Booster limit reached!");
        return;
      }
      gameState.inventory.maxBoosterCount += 1;
      gameState.maxHp += 50;
      gameState.hp += 50;
      showMessage("Max Booster purchased! Max HP increased by 50.");
      break;
    case "dice":
      gameState.inventory.dice[item.diceType] += 1;
      showMessage(`Purchased ${item.name}.`);
      break;
  }
  closeShop(); // Close shop modal after purchase.
  updateUI();
}

// Update the UI elements to reflect current game state.
function updateUI() {
  document.getElementById("world").innerText = gameState.world;
  document.getElementById("position").innerText = gameState.position;
  document.getElementById("hp").innerText = gameState.hp;
  document.getElementById("max-hp").innerText = gameState.maxHp;
  document.getElementById("gold").innerText = gameState.gold;
  
  // Update sword info.
  document.getElementById("sword").innerText = `${gameState.inventory.sword} (${Math.round(gameState.inventory.swordReduction * 100)}% damage taken)`;
  
  // Update active dice item display (if any; otherwise show inventory summary)
  let diceInfo = [];
  for (let [key, value] of Object.entries(gameState.inventory.dice)) {
    if (value > 0) diceInfo.push(`${key}: ${value}`);
  }
  document.getElementById("dice-item").innerText = diceInfo.length > 0 ? diceInfo.join(", ") : "None";
  
  // Render the board
  updateBoardUI();
}

// Render the game board.
function updateBoardUI() {
  const boardDiv = document.getElementById("board");
  boardDiv.innerHTML = "";
  gameState.board.forEach((space, index) => {
    const spaceDiv = document.createElement("div");
    spaceDiv.classList.add("board-space");
    if (index === gameState.position) {
      spaceDiv.classList.add("current-space");
    }
    spaceDiv.innerText = space.type;
    boardDiv.appendChild(spaceDiv);
  });
}

// Show a message in the #message area.
function showMessage(message) {
  const messageDiv = document.getElementById("message");
  messageDiv.innerText = message;
}

// Shop display functions.
function showShop() {
  const shopModal = document.getElementById("shop-modal");
  shopModal.style.display = "block";
  const shopItemsDiv = document.getElementById("shop-items");
  shopItemsDiv.innerHTML = "";
  shopItems.forEach(item => {
    const itemDiv = document.createElement("div");
    itemDiv.classList.add("shop-item");
    itemDiv.innerHTML = `<strong>${item.name}</strong> - Cost: ${item.cost} gold <button onclick="purchaseItem('${item.id}')">Buy</button>`;
    shopItemsDiv.appendChild(itemDiv);
  });
}

function closeShop() {
  document.getElementById("shop-modal").style.display = "none";
}

// Close modals if user clicks outside the modal content.
window.onclick = function(event) {
  const shopModal = document.getElementById("shop-modal");
  const pickyModal = document.getElementById("picky-modal");
  if (event.target === shopModal) {
    shopModal.style.display = "none";
  }
  if (event.target === pickyModal) {
    pickyModal.style.display = "none";
  }
};

// Initialize the game on load.
initGame();
