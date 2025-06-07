// ==== GAME STATE ====

let hp = 100;
let maxHp = 100;
let gold = 0;
let tileIndex = 0;
let world = 1;
let inventory = [];
let maxHpBoosts = 0;
let sword = "Basic Sword";
let swordTiers = ["Basic Sword", "Wooden Sword", "Stone Sword", "Silver Sword", "Gold Sword", "Diamond Sword"];
let swordMultipliers = {
  "Basic Sword": 1.0,
  "Wooden Sword": 0.85,
  "Stone Sword": 0.7,
  "Silver Sword": 0.55,
  "Gold Sword": 0.4,
  "Diamond Sword": 0.25,
};
let itemQueue = [];

let tiles = [];

const healPerTile = 50;

// ==== INIT GAME ====

function initializeGame() {
  generateTiles();
  renderBoard();
  updateStats();
}

function generateTiles() {
  tiles = [];
  for (let i = 0; i < 200; i++) {
    if (i === 199) {
      tiles.push("Final Monster");
      continue;
    }
    if (i % 10 === 0) {
      let miniSet = ["+5 Gold", "+5 Gold", "+3 Gold", "+3 Gold", "Heal", "Heal", "Monster", "Monster", "Back", "Nothing"];
      shuffle(miniSet);
      tiles.push(...miniSet);
    }
  }
}

// ==== GAME LOOP ====

function rollDice() {
  if (itemQueue.length > 0) {
    const item = itemQueue.shift();
    useItemEffect(item);
    return;
  }

  const roll = Math.floor(Math.random() * 6) + 1;
  displayRollResult(roll);
  movePlayer(roll);
}

function movePlayer(amount) {
  tileIndex += amount;
  if (tileIndex >= 199) tileIndex = 199;

  const tileType = tiles[tileIndex];
  processTile(tileType);
  renderBoard();
  updateStats();
}

function processTile(type) {
  switch (type) {
    case "+5 Gold":
      gold += 5;
      logMessage("You found 5 gold!");
      break;
    case "+3 Gold":
      gold += 3;
      logMessage("You found 3 gold!");
      break;
    case "Heal":
      hp = Math.min(maxHp, hp + healPerTile);
      logMessage("You healed 50 HP!");
      break;
    case "Back":
      tileIndex = Math.max(0, tileIndex - 5);
      logMessage("Trap! You go back 5 spaces.");
      break;
    case "Monster":
      handleMonster(false);
      break;
    case "Final Monster":
      handleMonster(true);
      break;
    default:
      logMessage("Nothing here...");
  }
}

function handleMonster(isFinal) {
  const baseDamage = isFinal ? 999 : [25, 50, 100, 150, 500][world - 1];
  const multiplier = swordMultipliers[sword] || 1;
  const finalDamage = Math.round(baseDamage * multiplier);
  hp -= finalDamage;

  if (hp <= 0) {
    hp = 0;
    logMessage("You died! Refresh to restart.");
  } else {
    logMessage(`You fought a monster and took ${finalDamage} damage.`);
  }
  updateStats();
}

// ==== ITEMS ====

function buyItem(type) {
  if (inventory.length >= 3) return logMessage("Inventory full!");

  const costs = { golden: 20, picky: 35, doubler: 25 };
  const cost = costs[type];

  if (gold < cost) return logMessage("Not enough gold!");

  gold -= cost;
  inventory.push(type);
  updateInventory();
  logMessage(`${capitalize(type)} Roll added to inventory.`);
}

function useItem(index) {
  const item = inventory[index];
  if (!item) return;

  inventory.splice(index, 1);
  itemQueue.push(item);
  logMessage(`${capitalize(item)} Roll activated for next turn.`);
  updateInventory();
}

function useItemEffect(type) {
  let roll = 1;

  if (type === "golden") roll = 6;
  else if (type === "picky") {
    let pick = parseInt(prompt("Pick a number between 1 and 6:"));
    if (isNaN(pick)) pick = 1;
    roll = Math.max(1, Math.min(6, pick));
  } else if (type === "doubler") {
    roll = (Math.floor(Math.random() * 6) + 1) * 2;
  }

  displayRollResult(roll, type);
  movePlayer(roll);
}

// ==== SHOP ====

function buyHealingPotion() {
  if (gold < 10) return logMessage("Not enough gold!");
  inventory.push("potion");
  gold -= 10;
  updateInventory();
  logMessage("Healing Potion bought!");
}

function useHealingPotion() {
  const index = inventory.indexOf("potion");
  if (index === -1) return logMessage("No potions available!");

  inventory.splice(index, 1);
  hp = Math.min(maxHp, hp + 50);
  updateInventory();
  updateStats();
  logMessage("You used a Healing Potion!");
}

function buyMaxHP() {
  if (maxHpBoosts >= 3) return logMessage("Limit reached.");
  if (gold < 150) return logMessage("Not enough gold!");

  maxHp += 50;
  hp += 50;
  gold -= 150;
  maxHpBoosts++;
  updateStats();
  logMessage("Max HP increased by 50!");
}

function buySword() {
  const currentIndex = swordTiers.indexOf(sword);
  if (currentIndex >= swordTiers.length - 1) return logMessage("Max sword reached.");

  const nextSword = swordTiers[currentIndex + 1];
  const cost = (currentIndex + 1) * 20 + 10;

  if (gold < cost) return logMessage(`You need ${cost} gold for ${nextSword}.`);

  gold -= cost;
  sword = nextSword;
  updateStats();
  logMessage(`You bought a ${nextSword}.`);
}

function changeBackground(color, cost) {
  if (document.body.style.backgroundColor === color) return logMessage("Already selected.");
  if (gold < cost) return logMessage("Not enough gold!");

  gold -= cost;
  document.body.style.backgroundColor = color;
  updateStats();
  logMessage(`Background changed to ${color}.`);
}

// ==== UTILS ====

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
