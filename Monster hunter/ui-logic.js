// ==== UI ELEMENTS ====

const board = document.getElementById("board");
const stats = document.getElementById("stats");
const inventoryEl = document.getElementById("inventory");
const logEl = document.getElementById("log");
const rollButton = document.getElementById("rollButton");

// ==== UI INIT ====

document.addEventListener("DOMContentLoaded", () => {
  initializeGame();
  setupEventListeners();
});

// ==== EVENT LISTENERS ====

function setupEventListeners() {
  document.getElementById("buyPotion").addEventListener("click", buyHealingPotion);
  document.getElementById("usePotion").addEventListener("click", useHealingPotion);
  document.getElementById("buyMaxHP").addEventListener("click", buyMaxHP);
  document.getElementById("buySword").addEventListener("click", buySword);

  document.getElementById("buyGolden").addEventListener("click", () => buyItem("golden"));
  document.getElementById("buyPicky").addEventListener("click", () => buyItem("picky"));
  document.getElementById("buyDoubler").addEventListener("click", () => buyItem("doubler"));

  document.getElementById("bgGreen").addEventListener("click", () => changeBackground("lightgreen", 0));
  document.getElementById("bgYellow").addEventListener("click", () => changeBackground("lightyellow", 10));
  document.getElementById("bgOrange").addEventListener("click", () => changeBackground("lightsalmon", 15));
  document.getElementById("bgPink").addEventListener("click", () => changeBackground("lightpink", 20));
  document.getElementById("bgWhite").addEventListener("click", () => changeBackground("white", 5));

  rollButton.addEventListener("click", rollDice);
}

// ==== UI RENDERING ====

function renderBoard() {
  board.innerHTML = "";

  for (let i = 0; i < tiles.length; i++) {
    const tile = document.createElement("div");
    tile.className = "tile";

    if (i === tileIndex) tile.classList.add("player");

    tile.innerText = tiles[i];
    tile.style.transform = `skew(-20deg)`;
    board.appendChild(tile);
  }
}

function updateStats() {
  stats.innerHTML = `
    <p><strong>HP:</strong> ${hp}/${maxHp}</p>
    <p><strong>Gold:</strong> ${gold}</p>
    <p><strong>Tile:</strong> ${tileIndex + 1} / 200</p>
    <p><strong>World:</strong> ${world}</p>
    <p><strong>Sword:</strong> ${sword}</p>
  `;

  world = Math.floor(tileIndex / 40) + 1;
}

function updateInventory() {
  inventoryEl.innerHTML = "<strong>Inventory:</strong><br>";
  inventory.forEach((item, i) => {
    const btn = document.createElement("button");
    btn.textContent = capitalize(item);
    btn.addEventListener("click", () => {
      if (item === "potion") {
        useHealingPotion();
      } else {
        useItem(i);
      }
    });
    inventoryEl.appendChild(btn);
  });
}

function logMessage(msg) {
  const entry = document.createElement("div");
  entry.textContent = msg;
  logEl.prepend(entry);
}

function displayRollResult(roll, type = null) {
  logMessage(`🎲 You rolled a ${roll}${type ? ` (${capitalize(type)} Roll)` : ""}!`);
}
