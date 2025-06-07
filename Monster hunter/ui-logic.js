// ui-logic.js
// This file wires up the UI elements and user interactions.

// Wait for the DOM to load before attaching event listeners.
document.addEventListener("DOMContentLoaded", () => {
  
  // Roll Button event listener.
  document.getElementById("roll-button").addEventListener("click", () => {
    // Use any available dice item if the player has chosen to use one.
    playerRollDice(function(rollValue) {
      takeTurn(rollValue);
    });
  });
  
  // Shop icon click: open the shop modal.
  document.getElementById("shop-icon").addEventListener("click", () => {
    showShop();
  });
  
  // Close shop modal when clicking the close (×) button.
  document.querySelector("#shop-modal .close").addEventListener("click", closeShop);

  // Close picky modal when clicking its close (×) button.
  document.querySelector("#picky-modal .close-picky").addEventListener("click", () => {
    document.getElementById("picky-modal").style.display = "none";
  });
  
});
