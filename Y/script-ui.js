/******** UI Update Functions ********/
function updateShopDisplays() {
  document.getElementById("pointsDisplay").innerText = points;
  document.getElementById("autoCount").innerText = autoClickersCount;
  document.getElementById("doubleStatus").innerText = doublePointsActive ? "On" : "Off";
  document.getElementById("goldenStatus").innerText = goldenClickReady ? "Ready" : "Not Ready";
  document.getElementById("luckBoostStatus").innerText = luckBoostActive ? "Active" : "Inactive";
  document.getElementById("timeFreezeStatus").innerText = timeFreezeActive ? "Active" : "Inactive";
  document.getElementById("goldenModeStatus").innerText = goldenModeActive ? "Active" : "Inactive";
}

function updateLogElement() {
  const logElem = document.getElementById("log");
  logElem.innerHTML = "";
  // Sort logData by rarityPoints (lowest to highest)
  logData.sort((a, b) => (rarityPoints[a] || 0) - (rarityPoints[b] || 0));
  logData.forEach(rarity => {
    let li = document.createElement("li");
    li.textContent = rarity;
    li.className = rarity.toLowerCase().replace(/ /g, "-");
    logElem.appendChild(li);
  });
}

function updateStats() {
  document.getElementById("totalClicks").textContent = totalClicks;
  
  // Build a list of all rarity names (including seasonal and holiday)
  let allRarityNames = rarities.map(r => r.name)
    .concat(seasonalRarities.map(r => r.name))
    .concat(holidayRarities.map(r => r.name));
  let missing = allRarityNames.filter(name => !logData.includes(name));
  let rarest = missing.length === 0 ? "All Rarities Unlocked" : "None";
  document.getElementById("rarestFind").textContent = rarest;
  
  const chancesList = document.getElementById("chancesList");
  chancesList.innerHTML = "";
  rarities.forEach(rarity => {
    // Only display Glitched chance if all other rarities (except Timeless) are unlocked.
    if (rarity.name === "Glitched" && !allRarityNames.filter(n => n !== "Timeless").every(n => logData.includes(n))) return;
    let li = document.createElement("li");
    li.textContent = logData.includes(rarity.name)
      ? (rarity.name + ": " + rarity.chance + "%")
      : "???";
    chancesList.appendChild(li);
  });
  seasonalRarities.forEach(r => {
    let now = new Date();
    let seasonMatch = false;
    if (r.season === "spring" && (now.getMonth() >= 2 && now.getMonth() <= 4)) seasonMatch = true;
    if (r.season === "summer" && (now.getMonth() >= 5 && now.getMonth() <= 7)) seasonMatch = true;
    if (r.season === "autumn" && (now.getMonth() >= 8 && now.getMonth() <= 10)) seasonMatch = true;
    if (r.season === "winter" && ((now.getMonth() === 11) || (now.getMonth() >= 0 && now.getMonth() <= 1))) seasonMatch = true;
    if (!seasonMatch) return;
    let li = document.createElement("li");
    li.textContent = logData.includes(r.name)
      ? (r.name + ": " + r.chance + "%")
      : "???";
    chancesList.appendChild(li);
  });
  holidayRarities.forEach(r => {
    let now = new Date();
    let monthMatch = false;
    if (r.holiday === "christmas" && now.getMonth() === 11) monthMatch = true;
    if (r.holiday === "easter" && (now.getMonth() === 2 || now.getMonth() === 3)) monthMatch = true;
    if (r.holiday === "halloween" && now.getMonth() === 9) monthMatch = true;
    if (r.holiday === "valentines" && now.getMonth() === 1) monthMatch = true;
    if (r.holiday === "july4" && now.getMonth() === 6) monthMatch = true;
    if (r.holiday === "newyear" && now.getMonth() === 0) monthMatch = true;
    if (!monthMatch) return;
    let li = document.createElement("li");
    li.textContent = logData.includes(r.name)
      ? (r.name + ": " + r.chance + "%")
      : "???";
    chancesList.appendChild(li);
  });
  
  // Mastery Medals: Awarded if all rarities are unlocked, at least one upstage was performed, and every permanent background was bought.
  let allBackgrounds = Object.keys(backgroundsPermanent);
  let backgroundsUnlocked = allBackgrounds.every(bg => ownedBackgrounds[bg]);
  let allRaritiesUnlocked = allRarityNames.every(name => logData.includes(name));
  let medal1 = allRaritiesUnlocked ? "🏅" : "";
  let medal2 = (backgroundsUnlocked && seasonalMainUnlocked()) ? "🏅" : "";
  let medal3 = (upstageCount > 0) ? "🏅" : "";
  document.getElementById("masteryMedals").innerText = "Mastery Medals: " + medal1 + medal2 + medal3;
  
  // Upstage Button: Display it if every Tier 7 rarity (Impossible level) is unlocked.
  let tier7Rarities = rarities.filter(r => {
    let pt = rarityPoints[r.name] || 0;
    return pt >= 21 && pt <= 40;
  });
  let unlockUpstage = tier7Rarities.every(r => logData.includes(r.name));
  document.getElementById("upstageButton").style.display = unlockUpstage ? "block" : "none";
}

function seasonalMainUnlocked() {
  // For simplicity, return true if any seasonal background is owned.
  return Object.keys(ownedSeasonalBackgrounds).length > 0;
}

/******** Background Shop Update Functions ********/
function updateBackgroundShop() {
  const list = document.getElementById("backgroundShopList");
  list.innerHTML = "";
  const headerFixed = document.createElement("h5");
  headerFixed.textContent = "Permanent Backgrounds";
  list.appendChild(headerFixed);
  for (const bgName in backgroundsPermanent) {
    const bgData = backgroundsPermanent[bgName];
    const li = document.createElement("li");
    li.style.background = bgData.color;
    const textOverlay = document.createElement("div");
    textOverlay.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
    textOverlay.style.padding = "5px";
    textOverlay.textContent = `${bgName} - ${bgData.cost} pts (Requires ${bgData.requiredRarity})`;
    li.appendChild(textOverlay);
    if (ownedBackgrounds[bgName]) {
      if (activeBackground === bgName) {
        const activeLabel = document.createElement("div");
        activeLabel.textContent = "Active";
        activeLabel.style.backgroundColor = "rgba(0,0,0,0.7)";
        activeLabel.style.color = "white";
        activeLabel.style.padding = "5px";
        li.appendChild(activeLabel);
      } else {
        const selectBtn = document.createElement("button");
        selectBtn.textContent = "Select";
        selectBtn.onclick = () => setBackground(bgName);
        li.appendChild(selectBtn);
      }
    } else {
      if (points >= bgData.cost && logHasRarity(bgData.requiredRarity)) {
        const buyBtn = document.createElement("button");
        buyBtn.textContent = "Buy";
        buyBtn.onclick = () => purchaseBackground(bgName);
        li.appendChild(buyBtn);
      } else {
        li.classList.add("disabled");
      }
    }
    list.appendChild(li);
  }
}

function updateSeasonalBackgroundShop() {
  const list = document.getElementById("backgroundShopList");
  const headerMain = document.createElement("h5");
  headerMain.textContent = "Seasonal Backgrounds";
  list.appendChild(headerMain);
  const now = new Date();
  const currentMonth = now.getMonth();
  seasonalMainBackgrounds.forEach(bg => {
    let available = false;
    if (bg.availableMonths) {
      if (bg.availableMonths.includes(currentMonth)) available = true;
    } else if (bg.availableDates) {
      if (now >= bg.availableDates.start && now <= bg.availableDates.end) available = true;
    }
    if (available) {
      const li = document.createElement("li");
      li.style.background = bg.color;
      li.style.position = "relative";
      const textOverlay = document.createElement("div");
      textOverlay.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      textOverlay.style.padding = "5px";
      textOverlay.textContent = `${bg.name} - ${bg.cost} pts`;
      li.appendChild(textOverlay);
      if (ownedSeasonalBackgrounds[bg.name]) {
        if (activeSeasonalBackground === bg.name) {
          const activeLabel = document.createElement("div");
          activeLabel.textContent = "Active";
          activeLabel.style.backgroundColor = "rgba(0,0,0,0.7)";
          activeLabel.style.color = "white";
          activeLabel.style.padding = "5px";
          li.appendChild(activeLabel);
        } else {
          const selectBtn = document.createElement("button");
          selectBtn.textContent = "Select";
          selectBtn.onclick = () => setSeasonalBackground(bg.name, bg.color);
          li.appendChild(selectBtn);
        }
      } else {
        if (points >= bg.cost) {
          const buyBtn = document.createElement("button");
          buyBtn.textContent = "Buy";
          buyBtn.onclick = () => {
            points -= bg.cost;
            localStorage.setItem("points", points);
            ownedSeasonalBackgrounds[bg.name] = true;
            localStorage.setItem("ownedSeasonalBackgrounds", JSON.stringify(ownedSeasonalBackgrounds));
            updateShopDisplays();
            updateSeasonalBackgroundShop();
          };
          li.appendChild(buyBtn);
        } else {
          li.classList.add("disabled");
        }
      }
      list.appendChild(li);
    }
  });
  const headerEvent = document.createElement("h5");
  headerEvent.textContent = "Special Event Backgrounds";
  list.appendChild(headerEvent);
  seasonalEventBackgrounds.forEach(bg => {
    let available = false;
    if (bg.availableDates) {
      if (new Date() >= bg.availableDates.start && new Date() <= bg.availableDates.end) available = true;
    } else if (bg.availableMonths) {
      if (bg.availableMonths.includes(currentMonth)) available = true;
    }
    if (available) {
      const li = document.createElement("li");
      li.style.background = bg.color;
      li.style.position = "relative";
      const limitedIcon = document.createElement("div");
      limitedIcon.textContent = "🕘";
      limitedIcon.className = "seasonal-event-icon";
      li.appendChild(limitedIcon);
      const textOverlay = document.createElement("div");
      textOverlay.style.backgroundColor = "rgba(255, 255, 255, 0.7)";
      textOverlay.style.padding = "5px";
      textOverlay.textContent = `${bg.name} - ${bg.cost} pts`;
      li.appendChild(textOverlay);
      if (ownedSeasonalBackgrounds[bg.name]) {
        if (activeSeasonalBackground === bg.name) {
          const activeLabel = document.createElement("div");
          activeLabel.textContent = "Active";
          activeLabel.style.backgroundColor = "rgba(0,0,0,0.7)";
          activeLabel.style.color = "white";
          activeLabel.style.padding = "5px";
          li.appendChild(activeLabel);
        } else {
          const selectBtn = document.createElement("button");
          selectBtn.textContent = "Select";
          selectBtn.onclick = () => setSeasonalBackground(bg.name, bg.color);
          li.appendChild(selectBtn);
        }
      } else {
        if (points >= bg.cost) {
          const buyBtn = document.createElement("button");
          buyBtn.textContent = "Buy";
          buyBtn.onclick = () => {
            points -= bg.cost;
            localStorage.setItem("points", points);
            ownedSeasonalBackgrounds[bg.name] = true;
            localStorage.setItem("ownedSeasonalBackgrounds", JSON.stringify(ownedSeasonalBackgrounds));
            updateShopDisplays();
            updateSeasonalBackgroundShop();
          };
          li.appendChild(buyBtn);
        } else {
          li.classList.add("disabled");
        }
      }
      list.appendChild(li);
    }
  });
}

/******** Miscellaneous UI Functions ********/
function setBackground(bgName) {
  if (!ownedBackgrounds[bgName]) return;
  activeBackground = bgName;
  localStorage.setItem("activeBackground", bgName);
  if (bgName === "Rainbow") {
    document.body.style.background =
      "linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)";
  } else if (backgroundsPermanent[bgName]) {
    document.body.style.background = backgroundsPermanent[bgName].color;
  } else {
    document.body.style.background = "";
  }
}

function setSeasonalBackground(bgName, color) {
  activeSeasonalBackground = bgName;
  localStorage.setItem("activeSeasonalBackground", bgName);
  document.body.style.background = color;
}

function logHasRarity(requiredRarity) {
  return logData.includes(requiredRarity);
}

function toggleSettingsModal() {
  const modal = document.getElementById("settingsModal");
  modal.style.display = modal.style.display === "block" ? "none" : "block";
  updateShopDisplays();
  updateBackgroundShop();
  updateStats();
}

function resetGame() {
  if (confirm("Are you sure you want to reset the game? This will clear all progress.")) {
    points = 0;
    localStorage.setItem("points", points);
    autoClickersCount = 0;
    doublePointsActive = false;
    goldenClickReady = false;
    luckBoostActive = false;
    timeFreezeActive = false;
    goldenModeActive = false;
    ownedBackgrounds = {};
    activeBackground = "Light Blue";
    localStorage.removeItem("ownedBackgrounds");
    localStorage.removeItem("activeBackground");
    localStorage.removeItem("logData");
    localStorage.removeItem("totalClicks");
    logData = [];
    totalClicks = 0;
    ownedSeasonalBackgrounds = {};
    localStorage.removeItem("ownedSeasonalBackgrounds");
    activeSeasonalBackground = "";
    localStorage.removeItem("activeSeasonalBackground");
    if (autoInterval) {
      clearInterval(autoInterval);
      autoInterval = null;
    }
    document.getElementById("log").innerHTML = "";
    updateShopDisplays();
    startTime = Date.now();
    localStorage.setItem("startTime", startTime);
    setDefaultBackground();
    updateBackgroundShop();
    updateStats();
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
