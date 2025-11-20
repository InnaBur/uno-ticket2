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
const baseUrl = "https://nowaunoweb.azurewebsites.net/api/Game";
const defaultNames = ["Player 1", "Player 2", "Player 3", "Player 4"];

let gameId = "";
let players = [];
let currentPlayer = "";
let currentColor = "";
let displayedColor = "";
let topCard = null;
let hands = {};
let isInitialDeal = true;
let playDirection = 1;

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

  if (bgColor !== "#4caf50") {
    const overlay = document.createElement("div");
    overlay.className = "blink-overlay";
    document.body.appendChild(overlay);

    // Remove overlay after animation
    setTimeout(() => overlay.remove(), 1000);
  }
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
    return (name !== "" ? name : defaultNames[i]).trim().toUpperCase();   // 🔥 додано .trim()
  });
  if (!validatePlayers(players)) {
    showServerAlert("Enter 4 different player names!", "#ffcc00");
    return;
  }

  try {
    isInitialDeal = true;
    const data = await postJson(`${baseUrl}/Start`, players);
    initializeGameState(data);

    await updateHands();

    toggleSetupGameUI();
    showServerAlert("Dealind...", "#4caf50");
    setTimeout(() => {

      renderGame();
      setTimeout(() => {
        isInitialDeal = false;
      }, 2000);
    }, 500);
  } catch (err) {
    showServerAlert("Error starting game: " + err.message, "#ff4444");
  }

  renderGame();
}

function initializeGameState(data) {
  gameId = data.Id;

  currentPlayer = data.NextPlayer
    ? data.NextPlayer.trim().toUpperCase()
    : "";

  if (data.TopCard) {
    topCard = data.TopCard;
    currentColor = displayedColor = topCard.Color;
  } else {
    topCard = null;
    currentColor = displayedColor = "";
    console.warn("Top card not returned from server!");
  }
}

function toggleSetupGameUI() {
  setupEl.style.display = "none";
  gameEl.style.display = "block";
}

async function updateHands() {
  console.log("Updating hands for players:", players);
  for (const player of players) {
    const res = await fetch(
      `${baseUrl}/GetCards/${gameId}?playerName=${encodeURIComponent(player)}`
    );
    const data = await res.json();
    console.log(`Cards for ${player}:`, data.Cards);
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
  if (!topCard) {
    console.warn("Cannot render game: topCard not defined");
    return;
  }
  updateTopCardDisplay();
  updateCenterInfo();
  setupDrawPileClick();
  setupPlayerDrawButtons();
  renderAllPlayers();
}

function getNextPlayer() {
    const currentIndex = players.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % players.length;
    return players[nextIndex];
}

function updateTopCardDisplay() {
  if (!topCard) return;

  const fileName = `${topCard.Color.toLowerCase()}${topCard.Value}.png`;
  topCardEl.src = `images/${fileName}`;
  topCardEl.alt = topCard.DisplayValue;

}

//Update Top Card 
async function updateTopCard() {
  try {
    const res = await fetch(`${baseUrl}/TopCard/${gameId}`);
    const data = await res.json();
    topCard = data;
    currentColor = displayedColor = data.Color;
  } catch (err) {
    console.error("Error fetching top card:", err);
  }
}

function updateTopCardDisplay() {
  if (!topCard) return;
  const fileName = `${topCard.Color.toLowerCase()}${topCard.Value}.png`;
  topCardEl.src = `images/${fileName}`;
  topCardEl.alt = topCard.DisplayValue || `${topCard.Color} ${topCard.Value}`;
}

// Center Info (current player, color) 
function updateCenterInfo() {
  currentPlayerEl.textContent = `Current Player: ${currentPlayer}`;
  colorEl.textContent = `Current Color: ${displayedColor}`;
  // colorEl.style.backgroundColor = displayedColor.toLowerCase();
  if (displayedColor) {
    try {
      colorEl.style.backgroundColor = displayedColor.toLowerCase();
    } catch (e) {
      colorEl.style.backgroundColor = "transparent";
    }
  } else {
    colorEl.style.backgroundColor = "transparent";
  }
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

     const isCurrentPlayer = player === currentPlayer;

    if (isCurrentPlayer) {
      playerDiv.classList.add('active');
    } else {
      playerDiv.classList.remove('active');
    }

    const cardsDiv = playerDiv.querySelector('.player-hand');
    if (cardsDiv) {
      cardsDiv.innerHTML = "";
      const playerCards = hands[player] || [];
      const isCurrentPlayer = player === currentPlayer;

      playerCards.forEach((card, cardIndex) => {
        const cardEl = createCardElement(card, isCurrentPlayer, cardIndex, isCurrentPlayer);
        cardsDiv.appendChild(cardEl);
      });
    }
  });
}

//  Create a Card Element 
function createCardElement(card, isClickable = false, cardIndex = 0, showFront = false) {

  const img = document.createElement("img");

  if (showFront) {

    const fileName = `${card.Color.toLowerCase()}${card.Value}.png`;
    img.src = `images/${fileName}`;
    img.className = "card-image card-front";
  } else {
    img.src = `images/back0.png`;
    img.className = "card-image card-back";
  }

  img.alt = card.DisplayValue || `${card.Color} ${card.Value}`;

  //animation with timeout
  if (isInitialDeal) {
    img.style.animation = `dealCard 1s ease-out ${cardIndex * 0.1}s both`;

    setTimeout(() => {
      img.style.animation = '';
      img.style.transform = showFront ? "rotateY(0deg)" : "rotateY(180deg)";
    }, 1000 + (cardIndex * 100));
  } else {
    img.style.transform = showFront ? "rotateY(0deg)" : "rotateY(180deg)";
  }


  if (isClickable && showFront) {
    img.classList.add("clickable");
    img.addEventListener("click", () => {
      if (currentPlayer === "" || !players.includes(currentPlayer)) {
        showServerAlert("Invalid current player", "#ffcc00");
        return;
      }
      if (card.Color === "WILD" || card.Color === "BLACK") {
        handleWildCard(card);
      } else {
        playCard(currentPlayer, card);
      }
    });
  }
  img.dataset.cardData = JSON.stringify(card);

  return img;
}

//  Draw Pile Click Setup 
function setupDrawPileClick() {
  const drawPile = document.getElementById("drawPile");
  if (!drawPile) {
    console.error("discardPile element not found!");
    return;
  }
  drawPile.onclick = async () => {
    if (!currentPlayer) return;
    await drawCard(currentPlayer);
  };
}

//  Draw Card Button Setup 
function setupPlayerDrawButtons() {
  const drawButtons = document.querySelectorAll(".draw-btn");
  drawButtons.forEach((btn) => {
    btn.onclick = async () => {
      const player = btn.dataset.player;
      if (player !== currentPlayer) {
        showServerAlert("It's not your turn to draw.", "#ffcc00");
        return;
      }
      await drawCard(player);
    };
  });
}

//  PLAY CARD 
async function playCard(player, card, wildColor = null) {
    if (player !== currentPlayer) {
    showServerAlert("It's not your turn!", "#ffcc00");
    return;
  }

  // if (!currentPlayer) return;

  // const playerHand = hands[currentPlayer] || [];
  // if (!playerHand.find(c => c.Value === card.Value && c.Color === card.Color)) {
  //   showServerAlert("You cannot play a card you don't have!", "#ffcc00");
  //   return;
  // }
   const playerHand = hands[player] || [];
  if (!playerHand.find(c => c.Value === card.Value && c.Color === card.Color)) {
    showServerAlert("You cannot play a card you don't have!", "#ffcc00");
    return;
  }

  try {
   


    const finalWildColor = wildColor || card.Color;

    let url = `${baseUrl}/PlayCard/${gameId}?value=${card.Value}&color=${card.Color}&wildColor=${finalWildColor}`;

    console.log("Playing card URL:", url);

    const res = await fetch(
      url, {
      method: "PUT",
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`Server returned ${res.status} ${res.statusText} ${text}`);
    }
    const data = await res.json();
    if (!data) {
      showServerAlert("No response from server", "#ffcc00");
      return;
    }

    if (data.Message) {
      showServerAlert(data.Message, "#ffcc00");
      return;
    }
    if (data.TopCard) {
      topCard = data.TopCard;
      currentColor = displayedColor = topCard.Color;
    } else {
      await updateTopCard();
    }
    await updateHands();
currentPlayer = getNextPlayer();
    // if (data.NextPlayer) {
    //   currentPlayer = data.NextPlayer.trim().toUpperCase();
    // }
    renderGame();
    showServerAlert(`${currentPlayer} played ${card.DisplayValue || `${card.Color} ${card.Value}`}!`);

    if (data.GameOver) handleGameOver(data);

  } catch (err) {
    showServerAlert("Error playing card: " + err.message, "#ff4444");
  }
}

//  DRAW CARD LOGIC 
async function drawCard(player) {
  try {
    if (player !== currentPlayer) {
      showServerAlert("You can draw only on your turn.", "#ffcc00");
      return;
    }

    const url = `${baseUrl}/DrawCard/${gameId}?playerName=${encodeURIComponent(player)}`;
    console.log("Drawing card URL:", url);
    const res = await fetch(
      url,
      { method: "PUT" }
    );

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const data = await res.json();
    console.log("Draw card response:", data);

    if (!data) {
      showServerAlert("No response from server", "#ffcc00");
      return;
    }
    if (data.Message) {
      showServerAlert(data.Message, "#ffcc00");
      return;
    }
    showServerAlert(`${player} drew a card`);

    await updateHands();
    await updateTopCard();

    if (data.NextPlayer) {
      currentPlayer = data.NextPlayer.trim().toUpperCase();
    }
    renderGame();

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
    await playCard(currentPlayer, card, color);
  });
}


// RESTART GAME
async function restartGame() {
  modal.style.display = "none";
  resetGameState();
  isInitialDeal = true;
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

