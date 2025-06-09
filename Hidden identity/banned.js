// banned.js
document.addEventListener("DOMContentLoaded", function () {
  // Lists of banned words for usernames and chat messages.
  const bannedWords = ["titties", "tit", "fuck", "shit", "fucker", "nig-", "ni-", "nig", "uraretard", "retard", "retarded", "bitch", "ass", "youaregay", "urgay", "cock", "sugma", "bigdick", "suckmydick"];
  const extremeBannedWords = ["nigga", "hairycunt", "nigger", "nick urr", "kike", "fuckalljews", "fuckjews"];

  // Checks a string (username or chat message) for extreme or regular banned words.
  // If an extreme banned word is found, sets the ban for one month.
  // If a regular banned word is found, ban for one day.
  function checkAndBan(text) {
    const lowerText = text.toLowerCase();
    if (extremeBannedWords.some((word) => lowerText.includes(word))) {
      // Ban for one month (2592000000 milliseconds)
      localStorage.setItem("bannedUntil", Date.now() + 2592000000);
      return true;
    }
    if (bannedWords.some((word) => lowerText.includes(word))) {
      // Ban for one day (86400000 milliseconds)
      localStorage.setItem("bannedUntil", Date.now() + 86400000);
      return true;
    }
    return false;
  }

  // Check whether the user is banned already.
  function isBanned() {
    const bannedUntil = localStorage.getItem("bannedUntil");
    return bannedUntil && Date.now() < Number(bannedUntil);
  }

  // Display the banned modal and disable all interaction.
  function showBanScreen() {
    const banModal = document.getElementById("ban-modal");
    if (banModal) {
      banModal.classList.remove("hidden");
    }
    // Disable all buttons on the page.
    document.querySelectorAll("button").forEach((btn) => {
      btn.disabled = true;
    });
  }

  // --- Username Check on Home Screen ---
  // When the user clicks "START", check the username for banned words.
  const startBtn = document.getElementById("start-btn");
  if (startBtn) {
    startBtn.addEventListener("click", function (event) {
      const usernameInput = document.getElementById("username-input");
      if (usernameInput) {
        const username = usernameInput.value.trim();
        // Check if the user is already banned from before.
        if (isBanned()) {
          showBanScreen();
          event.preventDefault();
          return;
        }
        // Check if the username is inappropriate.
        if (checkAndBan(username)) {
          showBanScreen();
          event.preventDefault();
          return;
        }
        // Otherwise, the username is OK and it will be processed by lobby.js.
      }
    });
  }

  // --- Chat Message Check ---
  // Override the Send button logic.
  const sendChatBtn = document.getElementById("send-chat");
  if (sendChatBtn) {
    sendChatBtn.addEventListener("click", function (event) {
      const chatInput = document.getElementById("chat-input");
      if (chatInput) {
        const message = chatInput.value;
        if (checkAndBan(message)) {
          showBanScreen();
          event.preventDefault();
          return;
        }
      }
    });
  }

  // Also intercept the Enter key in the chat input.
  const chatInputField = document.getElementById("chat-input");
  if (chatInputField) {
    chatInputField.addEventListener("keypress", function (e) {
      if (e.key === "Enter") {
        const message = chatInputField.value;
        if (checkAndBan(message)) {
          showBanScreen();
          e.preventDefault();
          return;
        }
      }
    });
  }
});
