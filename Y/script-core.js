/******** Global Variables & Persistent Storage ********/
// A simple helper to safely get a JSON-parsed value with fallback
function getLocalStorageJSON(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    if (item === null || item === undefined) {
      localStorage.setItem(key, JSON.stringify(fallback));
      return fallback;
    }
    return JSON.parse(item);
  } catch (e) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return fallback;
  }
}

let points = parseInt(localStorage.getItem("points")) || 0;
localStorage.setItem("points", points);

let startTime = parseInt(localStorage.getItem("startTime"));
if (!startTime) {
  startTime = Date.now();
  localStorage.setItem("startTime", startTime);
}

let totalClicks = parseInt(localStorage.getItem("totalClicks")) || 0;
localStorage.setItem("totalClicks", totalClicks);

let shopPriceMultiplier = parseFloat(localStorage.getItem("shopPriceMultiplier")) || 1;
localStorage.setItem("shopPriceMultiplier", shopPriceMultiplier);

let upstageCount = parseInt(localStorage.getItem("upstageCount")) || 0;
localStorage.setItem("upstageCount", upstageCount);

let logData = getLocalStorageJSON("logData", []);
let ownedBackgrounds = getLocalStorageJSON("ownedBackgrounds", {});
let ownedSeasonalBackgrounds = getLocalStorageJSON("ownedSeasonalBackgrounds", {});
let activeBackground = localStorage.getItem("activeBackground") || "Light Blue";
localStorage.setItem("activeBackground", activeBackground);
let activeSeasonalBackground = localStorage.getItem("activeSeasonalBackground") || "";
localStorage.setItem("activeSeasonalBackground", activeSeasonalBackground);

/******** Control Flags ********/
let autoInterval = null;
let doublePointsActive = false;
let goldenClickReady = false;
let luckBoostActive = false;
let timeFreezeActive = false;
let goldenModeActive = false;
let timeWarpActive = false;
let stabilizerActive = false;

/******** Timer Setup ********/
function updateTimer() {
  if (!timeFreezeActive) {
    const now = Date.now();
    const elapsedSeconds = ((now - startTime) / 1000).toFixed(1);
    const timerElem = document.getElementById("timer");
    if (timerElem) {
      timerElem.innerText = "Time: " + elapsedSeconds + "s";
    }
    localStorage.setItem("elapsedTime", elapsedSeconds);
  }
}
window.addEventListener("load", function () {
  const timerElem = document.getElementById("timer");
  let savedTime = localStorage.getItem("elapsedTime");
  if (timerElem) {
    if (savedTime) {
      timerElem.innerText = "Time: " + savedTime + "s";
    } else {
      startTime = Date.now();
      localStorage.setItem("startTime", startTime);
    }
  }
  setInterval(updateTimer, 100);
});

/******** Rarity Definitions ********/
const rarities = [
  // Tier 1 – Common (0 pts)
  { name: "Dusty", chance: 15 },
  { name: "Basic", chance: 8 },
  { name: "Standard", chance: 6 },
  { name: "Plain", chance: 4 },
  { name: "Faded", chance: 3 },
  { name: "Neutral", chance: 2 },
  { name: "Average", chance: 1.5 },
  { name: "Typical", chance: 0.5 },
  // Tier 2 – Uncommon (1–3 pts)
  { name: "Uncommon", chance: 6 },
  { name: "Distinct", chance: 4 },
  { name: "Noticeable", chance: 3 },
  { name: "Elevated", chance: 2.5 },
  { name: "Unique", chance: 2 },
  { name: "Rareish", chance: 1.5 },
  { name: "Vibrant", chance: 1.2 },
  { name: "Striking", chance: 1.1 },
  { name: "Polished", chance: 1 },
  { name: "Featured", chance: 0.7 },
  { name: "Specialty", chance: 0.5 },
  // Tier 3 – Rare (4–6 pts)
  { name: "Rare", chance: 3 },
  { name: "Pristine", chance: 2.5 },
  { name: "Hidden", chance: 2 },
  { name: "Sleek", chance: 1.8 },
  { name: "Shimmering", chance: 1.5 },
  { name: "Vivid", chance: 1.2 },
  { name: "Brilliant", chance: 1 },
  { name: "Prominent", chance: 0.8 },
  { name: "Gemlike", chance: 0.7 },
  { name: "Exotic", chance: 0.5 },
  // Tier 4 – Epic (7–10 pts)
  { name: "Epic", chance: 2.5 },
  { name: "Dynamic", chance: 2 },
  { name: "Complex", chance: 1.5 },
  { name: "Unbelievable", chance: 1.2 },
  { name: "Experimental", chance: 1 },
  { name: "Transcendent", chance: 0.8 },
  { name: "Phenomenal", chance: 0.7 },
  { name: "Visionary", chance: 0.5 },
  { name: "Supreme", chance: 0.3 },
  { name: "Celestial", chance: 0.2 },
  // Tier 5 – Legendary (11–15 pts)
  { name: "Legendary", chance: 1.5 },
  { name: "Revered", chance: 1.2 },
  { name: "Hallmarked", chance: 1.1 },
  { name: "Fabled", chance: 1 },
  { name: "Unmatched", chance: 0.7 },
  // Tier 6 – Mythic (16–20 pts)
  { name: "Mythic", chance: 0.8 },
  { name: "Astral", chance: 0.7 },
  { name: "Cosmic", chance: 0.6 },
  { name: "Hyper", chance: 0.5 },
  { name: "Illusive", chance: 0.5 },
  { name: "Ancient", chance: 0.4 },
  // Tier 7 – Impossible (21–40 pts)
  { name: "Forbidden", chance: 0.5 },
  { name: "Beyond", chance: 0.4 },
  { name: "Paranormal", chance: 0.3 },
  { name: "Supernatural", chance: 0.2 },
  { name: "Impossible", chance: 0.2 },
  { name: "Chroma", chance: 0.1 },
  // Tier 8 – Ultra-Rare (41–60 pts)
  { name: "Miraculous", chance: 0.1 },
  { name: "Unattainable", chance: 0.08 },
  { name: "Ethereal", chance: 0.07 },
  { name: "Extraordinary", chance: 0.06 },
  { name: "Stellar", chance: 0.05 },
  // Tier 9 – Beyond Reality (fixed values)
  { name: "Glitched", chance: 0.001 },
  { name: "Unknown", chance: 0.002 },
  { name: "Fractured", chance: 0.0015 },
  { name: "Singularity", chance: 0.0012 },
  { name: "Timeless", chance: 0.0003 }
];

/* Integer-only rarity points */
const rarityPoints = {
  "Dusty": 0, "Basic": 0, "Standard": 0, "Plain": 0, "Faded": 0, "Neutral": 0, "Average": 0, "Typical": 0,
  "Uncommon": 1, "Distinct": 1, "Noticeable": 2, "Elevated": 2, "Unique": 2,
  "Rareish": 2, "Vibrant": 2, "Striking": 3, "Polished": 3, "Featured": 3, "Specialty": 3,
  "Rare": 4, "Pristine": 4, "Hidden": 5, "Sleek": 5, "Shimmering": 5,
  "Vivid": 5, "Brilliant": 5, "Prominent": 6, "Gemlike": 6, "Exotic": 6,
  "Epic": 7, "Dynamic": 8, "Complex": 8, "Unbelievable": 8, "Experimental": 9,
  "Transcendent": 9, "Phenomenal": 9, "Visionary": 10, "Supreme": 10, "Celestial": 10,
  "Legendary": 11, "Revered": 12, "Hallmarked": 13, "Fabled": 14, "Unmatched": 15,
  "Mythic": 16, "Astral": 17, "Cosmic": 18, "Hyper": 19, "Illusive": 19, "Ancient": 20,
  "Forbidden": 21, "Beyond": 25, "Paranormal": 29, "Supernatural": 33, "Impossible": 37, "Chroma": 40,
  "Miraculous": 41, "Unattainable": 45, "Ethereal": 50, "Extraordinary": 55, "Stellar": 60,
  "Glitched": 666, "Unknown": 100, "Fractured": 120, "Singularity": 150, "Timeless": 2025
};

/******** Seasonal & Holiday Rarities ********/
const seasonalRarities = [
  { name: "Blooming Essence", chance: 0.1, points: 50, season: "spring" },
  { name: "Radiant Flame", chance: 0.1, points: 50, season: "summer" },
  { name: "Golden Harvest", chance: 0.1, points: 50, season: "autumn" },
  { name: "Frozen Echo", chance: 0.1, points: 50, season: "winter" }
];
const holidayRarities = [
  { name: "Starlit Gift", chance: 0.05, points: 80, holiday: "christmas" },
  { name: "Eggstravagant Surprise", chance: 0.05, points: 80, holiday: "easter" },
  { name: "Phantom Whisper", chance: 0.05, points: 80, holiday: "halloween" },
  { name: "Heartbound Charm", chance: 0.05, points: 80, holiday: "valentines" },
  { name: "Patriot Spark", chance: 0.05, points: 80, holiday: "july4" },
  { name: "Timeless Burst", chance: 0.05, points: 80, holiday: "newyear" }
];

/******** Background Data ********/
const backgroundsPermanent = {
  "White": { cost: 200, requiredRarity: "Common", color: "#ffffff" },
  "Light Red": { cost: 200, requiredRarity: "Mythic", color: "#ffcccb" },
  "Medium Red": { cost: 200, requiredRarity: "Mythic", color: "#ff6666" },
  "Dark Red": { cost: 200, requiredRarity: "Mythic", color: "#8b0000" },
  "Light Blue": { cost: 200, requiredRarity: "Rare", color: "#add8e6" },
  "Medium Blue": { cost: 200, requiredRarity: "Rare", color: "#6495ed" },
  "Dark Blue": { cost: 200, requiredRarity: "Rare", color: "#00008b" },
  "Light Yellow": { cost: 200, requiredRarity: "Legendary", color: "#fffacd" },
  "Medium Yellow": { cost: 200, requiredRarity: "Legendary", color: "#f0e68c" },
  "Dark Yellow": { cost: 200, requiredRarity: "Legendary", color: "#ffd700" },
  // New Gradient Backgrounds (400 pts each)
  "Orange-Green Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, orange, green)" },
  "Orange-Purple Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, orange, purple)" },
  "Green-Purple Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, green, purple)" },
  "Red-Orange Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, red, orange)" },
  "Red-Green Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, red, green)" },
  "Red-Purple Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, red, purple)" },
  "Blue-Orange Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, blue, orange)" },
  "Blue-Green Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, blue, green)" },
  "Blue-Purple Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, blue, purple)" },
  "Yellow-Orange Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, yellow, orange)" },
  "Yellow-Green Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, yellow, green)" },
  "Yellow-Purple Gradient": { cost: 400, requiredRarity: "Rare", color: "linear-gradient(45deg, yellow, purple)" }
};

// (Optional) Seasonal backgrounds arrays; leave empty if not used.
let seasonalMainBackgrounds = [];
let seasonalEventBackgrounds = [];

/******** Core Game Functions ********/
function generateRarity(isManual = true) {
  totalClicks++;
  localStorage.setItem("totalClicks", totalClicks);
  
  const now = new Date();
  // Check Holiday Rarities:
  for (const r of holidayRarities) {
    let monthMatch = false;
    if (r.holiday === "christmas" && now.getMonth() === 11) monthMatch = true;
    if (r.holiday === "easter" && (now.getMonth() === 2 || now.getMonth() === 3)) monthMatch = true;
    if (r.holiday === "halloween" && now.getMonth() === 9) monthMatch = true;
    if (r.holiday === "valentines" && now.getMonth() === 1) monthMatch = true;
    if (r.holiday === "july4" && now.getMonth() === 6) monthMatch = true;
    if (r.holiday === "newyear" && now.getMonth() === 0) monthMatch = true;
    if (monthMatch && Math.random() * 100 < r.chance) {
      logData.push(r.name);
      points += r.points;
      localStorage.setItem("logData", JSON.stringify(logData));
      updateLogElement();
      updateStats();
      document.getElementById("result").innerText = "You got: " + r.name + " (+" + r.points + " pts)";
      document.getElementById("result").className = r.holiday;
      localStorage.setItem("points", points);
      updateShopDisplays();
      return;
    }
  }
  
  // Check Seasonal Rarities:
  for (const r of seasonalRarities) {
    let seasonMatch = false;
    if (r.season === "spring" && (now.getMonth() >= 2 && now.getMonth() <= 4)) seasonMatch = true;
    if (r.season === "summer" && (now.getMonth() >= 5 && now.getMonth() <= 7)) seasonMatch = true;
    if (r.season === "autumn" && (now.getMonth() >= 8 && now.getMonth() <= 10)) seasonMatch = true;
    if (r.season === "winter" && ((now.getMonth() === 11) || (now.getMonth() >= 0 && now.getMonth() <= 1))) seasonMatch = true;
    if (seasonMatch && Math.random() * 100 < r.chance) {
      logData.push(r.name);
      points += r.points;
      localStorage.setItem("logData", JSON.stringify(logData));
      updateLogElement();
      updateStats();
      document.getElementById("result").innerText = "You got: " + r.name + " (+" + r.points + " pts)";
      document.getElementById("result").className = r.season;
      localStorage.setItem("points", points);
      updateShopDisplays();
      return;
    }
  }
  
  // Regular Rarities:
  let canGlitch = rarities
    .filter(r => r.name !== "Glitched" && r.name !== "Timeless")
    .every(r => logData.includes(r.name));
  if (canGlitch && Math.random() < 0.00001) {
    logData.push("Glitched");
    points += rarityPoints["Glitched"];
    localStorage.setItem("logData", JSON.stringify(logData));
    updateLogElement();
    updateStats();
    document.getElementById("result").innerText = "You got: Glitched (+" + rarityPoints["Glitched"] + " pts)";
    document.getElementById("result").className = "glitched";
    localStorage.setItem("points", points);
    updateShopDisplays();
    return;
  }
  
  let foundRarity = "";
  let multiplier = 1;
  
  if (isManual && goldenClickReady) {
    let eligible = rarities.filter(r => (rarityPoints[r.name] || 0) >= rarityPoints["Legendary"]);
    let totalChance = eligible.reduce((sum, r) => sum + r.chance, 0);
    let roll = Math.random() * totalChance;
    let cumulative = 0;
    for (const r of eligible) {
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
    goldenClickReady = false;
  } else if (goldenModeActive) {
    let eligible = rarities.filter(r => (rarityPoints[r.name] || 0) >= rarityPoints["Legendary"]);
    let totalChance = eligible.reduce((sum, r) => sum + r.chance, 0);
    let roll = Math.random() * totalChance;
    let cumulative = 0;
    for (const r of eligible) {
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
  } else if (luckBoostActive) {
    let roll = Math.random() * 100;
    let cumulative = 0;
    for (const r of rarities) {
      if (r.name === "Glitched") continue;
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
  } else {
    let roll = Math.random() * 100;
    let cumulative = 0;
    for (const r of rarities) {
      if (r.name === "Glitched") continue;
      cumulative += r.chance;
      if (roll <= cumulative) {
        foundRarity = r.name;
        break;
      }
    }
  }
  
  if (doublePointsActive) multiplier *= 2;
  let basePts = rarityPoints[foundRarity] || 0;
  points += basePts * multiplier;
  localStorage.setItem("points", points);
  updateShopDisplays();
  
  document.getElementById("result").innerText =
    "You got: " + foundRarity + " (+" + (basePts * multiplier) + " pts)";
  document.getElementById("result").className = foundRarity.toLowerCase().replace(/ /g, "-");
  
  if (!logData.includes(foundRarity)) {
    logData.push(foundRarity);
    localStorage.setItem("logData", JSON.stringify(logData));
    updateLogElement();
  }
  updateStats();
}

function purchaseAutoClicker() {
  const cost = 50 * shopPriceMultiplier;
  if (typeof autoClickersCount === "undefined") {
    autoClickersCount = 0;
  }
  if (autoClickersCount >= 6) {
    alert("Auto Clickers Unavailable");
    return;
  }
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    autoClickersCount++;
    updateShopDisplays();
    if (autoClickersCount === 1 && !timeFreezeActive) {
      autoInterval = setInterval(() => {
        for (let i = 0; i < autoClickersCount; i++) {
          generateRarity(false);
        }
      }, 2000);
    }
  } else {
    alert("Not enough pts for Auto Clicker!");
  }
}

function purchaseDoublePoints() {
  const cost = 150 * shopPriceMultiplier;
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    doublePointsActive = true;
    updateShopDisplays();
    setTimeout(() => {
      doublePointsActive = false;
      updateShopDisplays();
    }, 30000);
  } else {
    alert("Not enough pts for Double Points!");
  }
}

function purchaseGoldenClick() {
  const cost = 200 * shopPriceMultiplier;
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    goldenClickReady = true;
    updateShopDisplays();
  } else {
    alert("Not enough pts for Golden Click!");
  }
}

function purchaseLuckBoost() {
  const cost = 300 * shopPriceMultiplier;
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    luckBoostActive = true;
    updateShopDisplays();
    setTimeout(() => {
      luckBoostActive = false;
      updateShopDisplays();
    }, 60000);
  } else {
    alert("Not enough pts for Luck Boost!");
  }
}

function purchaseTimeFreeze() {
  const cost = 200 * shopPriceMultiplier;
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    updateShopDisplays();
    if (!timeFreezeActive) {
      timeFreezeActive = true;
      let freezeStart = Date.now();
      if (autoInterval) {
        clearInterval(autoInterval);
        autoInterval = null;
      }
      setTimeout(() => {
        timeFreezeActive = false;
        let freezeDuration = Date.now() - freezeStart;
        startTime += freezeDuration;
        localStorage.setItem("startTime", startTime);
        updateShopDisplays();
        if (autoClickersCount > 0) {
          autoInterval = setInterval(() => {
            for (let i = 0; i < autoClickersCount; i++) {
              generateRarity(false);
            }
          }, 2000);
        }
      }, 30000);
    }
  } else {
    alert("Not enough pts for Time Freeze!");
  }
}

function purchaseGoldenMode() {
  const cost = 1500 * shopPriceMultiplier;
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    updateShopDisplays();
    if (!goldenModeActive) {
      goldenModeActive = true;
      document.body.style.background = "#FFD700";
      setTimeout(() => {
        goldenModeActive = false;
        setDefaultBackground();
        updateShopDisplays();
      }, 3000);
    }
  } else {
    alert("Not enough pts for Golden Mode!");
  }
}

function purchaseTimeWarp() {
  const cost = 500 * shopPriceMultiplier;
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    timeWarpActive = true;
    updateShopDisplays();
    if (autoClickersCount > 0 && !timeFreezeActive) {
      clearInterval(autoInterval);
      autoInterval = setInterval(() => {
        for (let i = 0; i < autoClickersCount; i++) {
          generateRarity(false);
        }
      }, 1333);
    }
    setTimeout(() => {
      timeWarpActive = false;
      if (autoClickersCount > 0 && !timeFreezeActive) {
        clearInterval(autoInterval);
        autoInterval = setInterval(() => {
          for (let i = 0; i < autoClickersCount; i++) {
            generateRarity(false);
          }
        }, 2000);
      }
      updateShopDisplays();
    }, 30000);
  } else {
    alert("Not enough pts for Time Warp!");
  }
}

function purchaseStabilizer() {
  const cost = 1200 * shopPriceMultiplier;
  if (points >= cost) {
    points -= cost;
    localStorage.setItem("points", points);
    stabilizerActive = true;
    updateShopDisplays();
    let originalGenerate = generateRarity;
    generateRarity = function (isManual) {
      let found = "";
      while (true) {
        originalGenerate(isManual);
        found = logData[logData.length - 1];
        if (["Dusty", "Basic", "Standard"].indexOf(found) === -1) break;
      }
    };
    setTimeout(() => {
      stabilizerActive = false;
      generateRarity = originalGenerate;
      updateShopDisplays();
    }, 180000);
  } else {
    alert("Not enough pts for Stabilizer!");
  }
}

function setDefaultBackground() {
  if (activeBackground === "Light Blue") {
    document.body.style.background = "#e0f7fa";
  } else if (backgroundsPermanent[activeBackground]) {
    document.body.style.background = backgroundsPermanent[activeBackground].color;
  } else if (activeBackground === "Rainbow") {
    document.body.style.background =
      "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)";
  }
}
