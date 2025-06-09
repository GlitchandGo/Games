// banned.js
document.addEventListener("DOMContentLoaded", function () {
  // Lists of banned (censored) words for usernames and chat messages.
  // (These words are censored in the source code.)
  const mildBannedWords = [
    "tit",
    "fag",
    "fuck",
    "shit",
    "damn",
    "fuc",
    "fuk",
    "reta",
    "bitch",
    "ass",
    "gay",
    "suck",
    "cock",
    "sugma",
    "dick",
    "balls",
    "testic",
    "deez",
    "nuts",
    "shi"
  ];

  const severeBannedWords = [
    "n#####", // was "nig" or similar
    "cunt",
    "n#####", // was "nij"
    "jew",
    "k#####", // was "kike"
    "hitler",
    "kik"
  ];

  // Build regex patterns for banned words (case-insensitive).
  const mildPattern = new RegExp(mildBannedWords.join("|"), "i");
  const severePattern = new RegExp(severeBannedWords.join("|"), "i");

  // Ban duration settings (in milliseconds):
  // Mild offenses: [warning, 1 day, 3 days, 7 days, 10 days]
  const mildBanDurations = [0, 86400000, 3 * 86400000, 7 * 86400000, 10 * 86400000];
  // Severe offenses: [7 days, 30 days, 60 days, permanent]
  const severeBanDurations = [7 * 86400000, 30 * 86400000, 60 * 86400000, Infinity];

  // For usernames, enforce that only letters are allowed and maximum length is 10.
  const usernameAllowedRegex = /^[A-Za-z]+$/;
  const MAX_USERNAME_LENGTH = 10;

  // For chat messages, only letters are allowed.
  const chatAllowedRegex = /^[A-Za-z]+$/;

  // Helper: sanitize banned word entries for substring matching.
  function sanitize(word) {
    return word.replace(/\*/g, "");
  }
  const sanitizedMildWords = mildBannedWords.map(sanitize);
  const sanitizedSevereWords = severeBannedWords.map(sanitize);

  // --- Offense Checking and Tiered Ban System ---

  // Returns an object { mild: Boolean, severe: Boolean } based on the text.
  function checkForOffense(text) {
    const lowerText = text.toLowerCase();
    return {
      mild: mildPattern.test(lowerText),
      severe: severePattern.test(lowerText)
    };
  }

  // Retrieve and increment offense counts in localStorage.
  function getOffenseCount(key) {
    return Number(localStorage.getItem(key)) || 0;
  }
  function incrementOffenseCount(key) {
    let count = getOffenseCount(key);
    count++;
    localStorage.setItem(key, count);
    return count;
  }

  // Apply ban by storing ban expiration in localStorage.
  function applyBan(offenseType, count) {
    let banDuration;
    if (offenseType === "mild") {
      if (count === 1) {
        // First offense is simply a warning.
        return 0;
      } else if (count <= 4) {
        banDuration = mildBanDurations[count - 1];
      } else {
        banDuration = mildBanDurations[4];
      }
    } else if (offenseType === "severe") {
      if (count <= 4) {
        banDuration = severeBanDurations[count - 1];
      } else {
        banDuration = severeBanDurations[3]; // permanent ban.
      }
    }
    localStorage.setItem("bannedUntil", Date.now() + banDuration);
    return banDuration;
  }

  // Process an offense for a given context ("username" or "chat").
  function processOffense(contextKey, text) {
    // For usernames, enforce allowed characters and maximum length.
    if (contextKey === "username") {
      if (!usernameAllowedRegex.test(text) || text.length > MAX_USERNAME_LENGTH) {
        alert("Only letters and a maximum of 10 letters are allowed in usernames");
        // Automatically change the username input value to "Player"
        const usernameInput = document.getElementById("username-input");
        if (usernameInput) { usernameInput.value = "Player"; }
        return { banned: true };
      }
      // Then check if the username includes any banned term.
      const lowerText = text.toLowerCase();
      for (let term of [...sanitizedMildWords, ...sanitizedSevereWords]) {
        if (lowerText.includes(term)) {
          alert("Your username contains prohibited content");
          // Automatically change the username to "Player"
          const usernameInput = document.getElementById("username-input");
          if (usernameInput) { usernameInput.value = "Player"; }
          // Immediately treat as an offense.
          const localKey = contextKey + "_auto_offense";
          let count = incrementOffenseCount(localKey);
          // For an auto-ban due to inclusion, treat it as severe.
          let banDuration = applyBan("severe", count);
          notifyAdmin(contextKey, text, count, "severe (auto)");
          return { banned: true, banDuration, offenseType: "severe", count };
        }
      }
    }
    // For chat messages, enforce allowed characters.
    if (contextKey === "chat") {
      if (!chatAllowedRegex.test(text)) {
        alert("Only letters are allowed in chat messages");
        return { banned: true };
      }
    }
    // Perform banned word checking.
    const offense = checkForOffense(text);
    let offenseType = null;
    if (offense.severe) {
      offenseType = "severe";
    } else if (offense.mild) {
      offenseType = "mild";
    }
    if (offenseType) {
      const localKey = contextKey + "_" + offenseType + "_offenseCount";
      let count = incrementOffenseCount(localKey);
      notifyAdmin(contextKey, text, count, offenseType);
      const banDuration = applyBan(offenseType, count);
      return { banned: banDuration > 0, banDuration, offenseType, count };
    }
    return { banned: false };
  }

  // Check if the user is already banned.
  function isBanned() {
    const bannedUntil = Number(localStorage.getItem("bannedUntil"));
    return bannedUntil && Date.now() < bannedUntil;
  }

  // Display the banned modal and disable all buttons.
  function showBanScreen() {
    const banModal = document.getElementById("ban-modal");
    if (banModal) {
      banModal.classList.remove("hidden");
    }
    document.querySelectorAll("button").forEach((btn) => {
      btn.disabled = true;
    });
  }

  // --- Admin Notification ---
  function notifyAdmin(contextKey, text, count, offenseType) {
    const webhookURL = "YOUR_WEBHOOK_URL_HERE"; // Replace with your actual webhook URL.
    const payload = {
      content:
        `[${contextKey.toUpperCase()}] New offense detected:\n` +
        `"${text}"\n` +
        `Type: ${offenseType}\n` +
        `Offense Count: ${count}`
    };
    fetch(webhookURL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).catch((e) => {
      console.error("Failed to notify admin", e);
    });
  }

  // --- Username Check on Home Screen ---
  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    startBtn.addEventListener("click", function (event) {
      const usernameInput = document.getElementById("username-input");
      if (usernameInput) {
        const username = usernameInput.value.trim();
        if (isBanned()) {
          showBanScreen();
          event.preventDefault();
          return;
        }
        const result = processOffense("username", username);
        if (result.banned) {
          showBanScreen();
          event.preventDefault();
          return;
        }
      }
    });
  }

  // --- Chat Message Check ---
  const sendChatBtn = document.getElementById("send-chat");
  if (sendChatBtn) {
    sendChatBtn.addEventListener("click", function (event) {
      const chatInput = document.getElementById("chat-input");
      if (chatInput) {
        const message = chatInput.value;
        if (processOffense("chat", message).banned) {
          showBanScreen();
          event.preventDefault();
          return;
        }
      }
    });
  }

  // Intercept the Enter key in the chat input.
  const chatInputField = document.getElementById("chat-input");
  if (chatInputField) {
    chatInputField.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const message = chatInputField.value;
        if (processOffense("chat", message).banned) {
          showBanScreen();
          e.preventDefault();
          return;
        }
      }
    });
  }
});
