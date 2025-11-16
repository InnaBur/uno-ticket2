/** TICKET 1
 * 
 * UNO GAME 
 
 * Global State & Constants
 * DOM References
 * Utility & Helper Functions
 * Game Setup & Initialization
 * Core Game Logic (play, draw, render)
 * Animations & UI Effects
 * Game End Handling
**/

/* 
GLOBAL CONSTANTS & STATE
========================================================== */
const baseUrl = "https://nowaunoweb.azurewebsites.net/api/game";
const defaultNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let gameId = "";
let players = [];
let currentPlayer = "";
let currentColor = "";
let displayedColor = "";
let topCard = null;
let hands = {};

const selectedAvatars = {
  1: "avatars/avatar1.png",
  2: "avatars/avatar2.png",
  3: "avatars/avatar3.png",
  4: "avatars/avatar4.png",
};

/* 
   DOM REFERENCES
========================================================== */
const setupEl = document.getElementById("setup");
const gameEl = document.getElementById("game");
const topCardEl = document.getElementById("topCard");
const currentPlayerEl = document.getElementById("currentPlayer");
const colorEl = document.getElementById("currentColor");

const modal = document.getElementById("gameOverModal");
const winnerText = document.getElementById("winnerText");
const scoresText = document.getElementById("scoresText");
const restartBtn = document.getElementById("restartBtn");

const canvas = document.getElementById("fireworksCanvas");
const ctx = canvas.getContext("2d");

const playerInputs = Array.from({ length: 4 }, (_, i) =>
  document.getElementById(`player${i + 1}`)
);

/* 
   UTILITY & HELPER FUNCTIONS
========================================================== */

//  Network Helpers
async function postJson(url, body) {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}


// Game State Reset
function resetGameState() {
  gameId = "";
  players = [];
  currentPlayer = "";
  currentColor = "";
  displayedColor = "";
  topCard = null;
  hands = {};
}

// UI Alerts
function showServerAlert(message, bgColor = "#4caf50") {
  const alertDiv = document.createElement("div");
  alertDiv.className = "server-alert";
  alertDiv.textContent = message;
  alertDiv.style.backgroundColor = bgColor;
  document.body.appendChild(alertDiv);

  const overlay = document.createElement("div");
  overlay.className = "blink-overlay";
  document.body.appendChild(overlay);

  // Remove overlay after animation
  setTimeout(() => overlay.remove(), 1000);

  // Fade out alert after 2s
  setTimeout(() => {
    alertDiv.classList.add("fade-out");
    setTimeout(() => alertDiv.remove(), 500);
  }, 2000);
}


//  Player Helpers
function getPlayerPosition(player) {
  return ["player-top", "player-right", "player-bottom", "player-left"][
    players.indexOf(player)
  ];
}

function calculatePoints(player) {
  return hands[player].reduce((sum, c) => sum + c.Score, 0);
}

/* 
   GAME SETUP & INITIALIZATION
========================================================== */

// Initialize Canvas for Fireworks
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

//  Player Validation
function validatePlayers(players) {
  return players.length === 4 && !players.includes("") && new Set(players).size === 4;
}

// Start Game
async function startGame() {
  // players = playerInputs.map((input) => input.value.trim().toUpperCase());
  
  players = playerInputs.map((input, i) => {
  const name = input.value.trim();
  return (name !== "" ? name : defaultNames[i]).toUpperCase();
});
  if (!validatePlayers(players)) {
    showServerAlert("Enter 4 different player names!", "#ffcc00");
    return;
  }

  try {
    const data = await postJson(`${baseUrl}/start`, players);
    initializeGameState(data);
    await updateHands();
    toggleSetupGameUI();
    renderGame();
  } catch (err) {
    showServerAlert("Error starting game: " + err.message, "#ff4444");
  }
}

function initializeGameState(data) {
  gameId = data.Id;
  currentPlayer = data.NextPlayer;
  topCard = data.TopCard;
  currentColor = displayedColor = topCard.Color;
}

function toggleSetupGameUI() {
  setupEl.style.display = "none";
  gameEl.style.display = "block";
}

async function updateHands() {
  for (const player of players) {
    const res = await fetch(
      `${baseUrl}/GetCards/${gameId}?playerName=${encodeURIComponent(player)}`
    );
    const data = await res.json();
    hands[player] = data.Cards;
  }
}

// Rules Link
const rulesLink = document.createElement("a");
rulesLink.href = "https://www.ultraboardgames.com/uno/game-rules.php";
rulesLink.target = "_blank";
rulesLink.textContent = "Read UNO Game Rules";
rulesLink.id = "unoRulesLink";
document.body.appendChild(rulesLink);


/* TICKET 2
   RENDERING & PLAYER INTERACTION
========================================================== */

function renderGame() {
  if (!topCard) return;
  updateTopCardDisplay();
  updateCenterInfo();
  setupDrawPileClick();
  setupPlayerDrawButtons();
  renderAllPlayers();
}


// Update Top Card 
function updateTopCardDisplay() {
     if (!topCard) return;

    const fileName = `${topCard.Color.toLowerCase()}${topCard.Value}.png`;
    topCardEl.src = `images/${fileName}`;
    topCardEl.alt = topCard.DisplayValue;

}

// Center Info (current player, color) 
function updateCenterInfo() {
  currentPlayerEl.textContent = `Current Player: ${currentPlayer}`;
  colorEl.textContent = `Current Color: ${displayedColor}`;
  colorEl.style.backgroundColor = displayedColor.toLowerCase();
}


function renderAllPlayers() {
  const positions = ['player-bottom', 'player-top', 'player-left', 'player-right'];
  
  players.forEach((player, index) => {
    const playerDiv = document.getElementById(positions[index]);
    if (!playerDiv) return; 
    
    const nameEl = playerDiv.querySelector('.player-name');
    if (nameEl) nameEl.textContent = player;
    
    const avatarImg = playerDiv.querySelector('.player-avatar');
    if (avatarImg) avatarImg.src = selectedAvatars[index + 1];
    
    const drawBtn = playerDiv.querySelector('.draw-btn');
    if (drawBtn) drawBtn.dataset.player = player;
    
    const cardsDiv = playerDiv.querySelector('.player-hand');
    if (cardsDiv) {
      cardsDiv.innerHTML = "";
      const playerCards = hands[player] || [];
      playerCards.forEach((card) => {
        const cardEl = createCardElement(card, player === currentPlayer);
        cardsDiv.appendChild(cardEl);
      });
    }
  });
}

//  Create a Card Element 
function createCardElement(card, isClickable = false) {

  const img = document.createElement("img");
  
  const fileName = `${card.Color.toLowerCase()}${card.Value}.png`;
  img.src = `images/${fileName}`;
  img.alt = card.DisplayValue;
  img.className = "card-image";
  
  if (isClickable) {
    img.classList.add("clickable");
    img.addEventListener("click", () => {
      if (card.Color === "WILD" || card.Color === "BLACK") {
        handleWildCard(card);
      } else {
        playCard(card);
      }
    });
  }

  return img;
}

//  Draw Pile Click Setup 
function setupDrawPileClick() {
  const drawPile = document.getElementById("drawPile");
  drawPile.onclick = async () => {
    if (currentPlayer === "") return;
    await drawCard(currentPlayer);
  };
}
 
//  Draw Card Button Setup 
function setupPlayerDrawButtons() {
  const drawButtons = document.querySelectorAll(".draw-btn");
  drawButtons.forEach((btn) => {
    btn.onclick = async () => {
      const player = btn.dataset.player;
      await drawCard(player);
    };
  });
}

//  PLAY CARD 
async function playCard(card) {
  if (currentPlayer === "") return;
  try {
    const body = { gameId, playerName: currentPlayer, card };
    const res = await postJson(`${baseUrl}/Play`, body);

    if (res.IsSuccess) {
      showServerAlert(`${currentPlayer} played ${card.DisplayValue}!`);
      topCard = res.TopCard;
      currentColor = displayedColor = res.CurrentColor;
      currentPlayer = res.NextPlayer;
      await updateHands();
      renderGame();

      if (res.GameOver) handleGameOver(res);
    } else {
      showServerAlert(res.Message, "#ffcc00");
    }
  } catch (err) {
    showServerAlert("Error playing card: " + err.message, "#ff4444");
  }
}

//  DRAW CARD LOGIC 
async function drawCard(player) {
  try {
    const res = await fetch(
      `${baseUrl}/Draw/${gameId}?playerName=${encodeURIComponent(player)}`,
        { method: "PUT" } 
    );
    const data = await res.json();

    if (data.IsSuccess) {
      showServerAlert(`${player} drew a card`);
      await updateHands();
      renderGame();
    } else {
      showServerAlert(data.Message, "#ffcc00");
    }
  } catch (err) {
    showServerAlert("Error drawing card: " + err.message, "#ff4444");
  }
}

//  COLOR PICKER FOR WILD CARDS
function showColorPicker(onColorSelect) {
  const picker = document.createElement("div");
  picker.className = "color-picker";

  ["RED", "BLUE", "GREEN", "YELLOW"].forEach((color) => {
    const btn = document.createElement("button");
    btn.textContent = color;
    btn.style.backgroundColor = color.toLowerCase();
    btn.onclick = () => {
      onColorSelect(color);
      picker.remove();
    };
    picker.appendChild(btn);
  });

  document.body.appendChild(picker);
}

  async function handleWildCard(card) {
   showColorPicker(async (color) => {
    const body = { gameId, playerName: currentPlayer, card, chosenColor: color };
    const res = await postJson(`${baseUrl}/Play`, body);

    if (res.IsSuccess) {
      topCard = res.TopCard;
      currentColor = displayedColor = color;
      currentPlayer = res.NextPlayer;
      await updateHands();
      renderGame();
      if (res.GameOver) handleGameOver(res);
    } else {
      showServerAlert(res.Message, "#ffcc00");
    }
  });
}

// //  HANDLE WILD CARDS 
// async function handleWildCard(card) {
//   showColorPicker(async (color) => {
//     const body = { gameId, playerName: currentPlayer, card, chosenColor: color };
//     const res = await postJson(`${baseUrl}/Play`, body);
//     if (res.IsSuccess) {
//       topCard = res.TopCard;
//       currentColor = displayedColor = color;
//       currentPlayer = res.NextPlayer;
//       await updateHands();
//       renderGame();
//       if (res.GameOver) handleGameOver(res);
//     } else {
//       showServerAlert(res.Message, "#ffcc00");
//     }
//   });
// }

// RESTART GAME
async function restartGame() {
  modal.style.display = "none";
  resetGameState();
  setupEl.style.display = "block";
  gameEl.style.display = "none";
  playerInputs.forEach(input => input.value = "");
}

// Handle Game Over
function handleGameOver(res) {
  const scores = players.map(p => ({
    name: p,
    points: calculatePoints(p)
  })).sort((a, b) => a.points - b.points);

  winnerText.textContent = `🏆 Winner: ${scores[0].name}!`;
  scoresText.innerHTML = scores.map((s, i) => 
    `<div>${i + 1}. ${s.name}: ${s.points} points</div>`
  ).join('');

  modal.style.display = "flex";
  launchFireworks();
}
//  Event Listeners
document.getElementById("startBtn").addEventListener("click", startGame);
restartBtn.addEventListener("click", restartGame);

