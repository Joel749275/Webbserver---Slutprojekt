const socket = io();
const otherPlayers = {};
const emojis = { "1": "👍", "2": "💀", "3": "😭", "4": "😮" };
const playerEmojis = {}; // { [id]: { emoji, time } }

document.addEventListener("keydown", (e) => {
  if (emojis[e.key]) {
    playerEmojis[socket.id] = { emoji: emojis[e.key], time: Date.now() };
    socket.emit("emoji", emojis[e.key]);
  }
});

socket.on("playerEmoji", (data) => {
  playerEmojis[data.id] = { emoji: data.emoji, time: Date.now() };
});

socket.on("currentPlayers", (players) => {
  for (const id in players) {
    if (id !== socket.id) otherPlayers[id] = players[id];
  }
});
socket.on("playerJoined", (data) => { otherPlayers[data.id] = { x: data.x, y: data.y, name: data.name ?? "Anonym" }; });
socket.on("playerMoved",  (data) => { if (otherPlayers[data.id]) { otherPlayers[data.id].x = data.x; otherPlayers[data.id].y = data.y; otherPlayers[data.id].direction = data.direction; }});
socket.on("playerLeft",   (id)   => { delete otherPlayers[id]; });

const myName = prompt("Vad heter du?") || "Player";
socket.emit("setName", myName);

socket.on("chat", (data) => {
  const log = document.getElementById("chatLog");
  const p   = document.createElement("p");
  p.style.margin = "2px 0";
  p.innerHTML = `<b style="color:#5bc0eb">${data.name}:</b> ${data.msg}`;
  log.appendChild(p);
  log.scrollTop = log.scrollHeight;
});

document.getElementById("chatInput").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    const input = document.getElementById("chatInput");
    const msg   = input.value.trim();
    if (msg) socket.emit("chat", msg);
    input.value = "";
    e.preventDefault();
  }
});


// Init: canvas och tileset
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const tileset = new Image();
tileset.src = "assets\\Modern tiles_Free\\Interiors_free\\32x32\\Room_Builder_free_32x32.png";

const tileSize = 32;

// Karta (test)
const map = [
  "##################################################",
  "#.......................#........................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "#................................................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "##########..########################..############",
  "#.......................#........................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "#................................................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "#.......................#........................#",
  "##################################################",
];

function setCanvasSize() {
  canvas.width = 640;
  canvas.height = 480;
}

// Tile-mappning
const tileMap = {
  '#': { tx: 0, ty: 20 },  //Stenruta
  '.': { tx: 1, ty: 14 },  //Trägolv
  'P': { tx: 0, ty: 14 }
};

// Laddning och player-inställningar
let tilesetLoaded = false;
let gameStarted = false;

const playerSprite = new Image(); // Idle
playerSprite.src = "assets\\Modern tiles_Free\\Characters_free\\Bob_idle_anim_16x16.png";
let playerSpriteLoaded = false;

const runSprite = new Image(); // Run
runSprite.src = "assets\\Modern tiles_Free\\Characters_free\\Bob_run_16x16.png";
let runSpriteLoaded = false;

let playerFrame = 0;
let playerFrameCount = 1;
let playerFrameWidth = 16;
let playerFrameHeight = 32;
let playerRow = 0;
let playerFrameStart = 6;
let playerAnimLength = 6;
let playerSourceYOffset = 0;
let playerDrawScale = 1.67;
let playerFeetY = 16;
let fitToTile = false;
let frameTick = 0;
const frameTickRate = 10;

// Animation state
let currentImage;
let currentRow = 0;
let currentFrameStart = 6;
let currentAnimLength = 6;
let isMoving = false;
let direction = 3;
let prevDirection = 3;

tileset.onload = () => {
  tilesetLoaded = true;
  startGameIfReady();
};

if (tileset.complete) {
  tilesetLoaded = true;
  startGameIfReady();
}

// Player sprite onload
playerSprite.onload = () => {
  playerSpriteLoaded = true;
  playerFrameCount = Math.max(1, Math.floor(playerSprite.width / playerFrameWidth));
  playerAnimLength = Math.max(1, playerFrameCount - playerFrameStart);
  console.log('Idle size:', playerSprite.naturalWidth, 'x', playerSprite.naturalHeight);
  startGameIfReady();
};

if (playerSprite.complete) {
  playerSpriteLoaded = true;
  playerFrameCount = Math.max(1, Math.floor(playerSprite.width / playerFrameWidth));
  playerAnimLength = Math.max(1, playerFrameCount - playerFrameStart);
}

// Run sprite onload
runSprite.onload = () => {
  runSpriteLoaded = true;
  console.log('Run size:', runSprite.naturalWidth, 'x', runSprite.naturalHeight);
  startGameIfReady();
};

if (runSprite.complete) {
  runSpriteLoaded = true;
}

function startGameIfReady() {
  if (tilesetLoaded && playerSpriteLoaded && runSpriteLoaded && !gameStarted) {
    setCanvasSize();
    gameStarted = true;
    gameLoop();
  } else if (tilesetLoaded && playerSpriteLoaded && !gameStarted) {
    setCanvasSize();
    gameStarted = true;
    gameLoop();
  }
}

// Spelarposition och kontroller
const player = { x: 5, y: 5, vx: 0, vy: 0 };

const keys = {};
const moveSpeed = 0.13;

document.addEventListener("keydown", (e) => { keys[e.key] = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

function updateAnimState(dx, dy) {
  isMoving = (dx !== 0 || dy !== 0);
  if (isMoving) {
    if (dx < 0) direction = 2;
    else if (dx > 0) direction = 0;
    else if (dy < 0) direction = 1;
    else direction = 3; // down
  } else {
    direction = prevDirection;
  }
  
  const useIdle = !isMoving;
  if (useIdle) {
  currentImage = playerSprite;
  currentRow = 0;

  currentFrameStart = prevDirection * 6;
  currentAnimLength = 6;
} else {
  currentImage = runSprite;
  currentRow = 0;
  currentFrameStart = direction * 6;
  currentAnimLength = 6;
}
  
  if (direction !== prevDirection || useIdle !== prevUseIdle) {
    playerFrame = 0;
  }
  prevDirection = direction;
  prevUseIdle = useIdle;
}

// Global for prev
let prevUseIdle = true;

// Uppdatera
function update() {
  let dx = 0, dy = 0;
  if (keys["ArrowLeft"] || keys["a"]) dx = -1;
  if (keys["ArrowRight"] || keys["d"]) dx = 1;
  if (keys["ArrowUp"] || keys["w"]) dy = -1;
  if (keys["ArrowDown"] || keys["s"]) dy = 1;

  if (dx !== 0 && dy !== 0) {
    dx *= 0.707;
    dy *= 0.707;
  }

  updateAnimState(dx, dy);

  player.vx = dx * moveSpeed;
  player.vy = dy * moveSpeed;

function isSolid(x, y) {
  const col = Math.floor(x);
  const row = Math.floor(y);
  if (row < 0 || row >= map.length || col < 0 || col >= map[0].length) return true;
  return map[row][col] === "#";
}

// Hitbox vid spelarens fötter
const cx = player.x + 0.5;
const cy = player.y + 1.7;
const hw = 0.3;
const hh = 0.3;

const nx = cx + player.vx;
const ny = cy + player.vy;

// Kolla X separat
if (!isSolid(nx - hw, cy - hh) && !isSolid(nx + hw, cy - hh) &&
    !isSolid(nx - hw, cy + hh) && !isSolid(nx + hw, cy + hh)) {
  player.x += player.vx;
}

// Kolla Y separat
if (!isSolid(cx - hw, ny - hh) && !isSolid(cx + hw, ny - hh) &&
    !isSolid(cx - hw, ny + hh) && !isSolid(cx + hw, ny + hh)) {
  player.y += player.vy;
}

socket.emit("move", { x: player.x, y: player.y, direction: direction });
}

// Draw
function drawEmoji(id, x, y) {
  const e = playerEmojis[id];
  if (!e || Date.now() - e.time > 3000) return;
  ctx.save();
  ctx.globalAlpha = Math.max(0, 1 - (Date.now() - e.time) / 3000);
  ctx.font = "20px serif";
  ctx.textAlign = "center";
  ctx.fillText(e.emoji, x * tileSize + tileSize / 2, y * tileSize - 5);
  ctx.restore();
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;

  const camX = Math.round(Math.max(0, Math.min(player.x * tileSize - canvas.width / 2, map[0].length * tileSize - canvas.width)));
  const camY = Math.round(Math.max(0, Math.min(player.y * tileSize - canvas.height / 2, map.length * tileSize - canvas.height)));
  ctx.save();
  ctx.translate(-camX, -camY);

  // Rita karta
  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      const x = col * tileSize;
      const y = row * tileSize;
      if (tilesetLoaded && tileMap[tile]) {
        const t = tileMap[tile];
        ctx.drawImage(tileset, t.tx * tileSize, t.ty * tileSize, tileSize, tileSize, x, y, tileSize, tileSize);
      } else {
        ctx.fillStyle = tile === '#' ? "gray" : "lightgreen";
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  // Rita andra spelare
  for (const id in otherPlayers) {
    const o = otherPlayers[id];
    const scale = playerDrawScale;
    const destW = playerFrameWidth * scale;
    const destH = playerFrameHeight * scale;
    const destX = o.x * tileSize + Math.floor((tileSize - destW) / 2);
    const destY = o.y * tileSize + tileSize - Math.floor(playerFeetY * scale);
    const sx = (o.direction ?? 3) * 6 * playerFrameWidth;
    ctx.drawImage(playerSprite, sx, 0, playerFrameWidth, playerFrameHeight, destX, destY, destW, destH);

    // Namn
    ctx.save();
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    let tw = ctx.measureText(o.name ?? "Anonym").width;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(destX + destW / 2 - tw / 2 - 3, destY - 14, tw + 6, 14);
    ctx.fillStyle = "#f4d03f";
    ctx.fillText(o.name ?? "Anonym", destX + destW / 2, destY - 3);
    ctx.restore();

    // Emoji
    drawEmoji(id, o.x, o.y);
  }

  // Rita spelare
  const scale = playerDrawScale;
  const destW = playerFrameWidth * scale;
  const destH = playerFrameHeight * scale;
  const destX = player.x * tileSize + Math.floor((tileSize - destW) / 2);
  const destY = player.y * tileSize + tileSize - Math.floor(playerFeetY * scale);
  const frameIndex = playerFrame % Math.max(1, currentAnimLength);
  const sx = (currentFrameStart + frameIndex) * playerFrameWidth;
  const sy = currentRow * playerFrameHeight + playerSourceYOffset;
  ctx.drawImage(currentImage ?? playerSprite, sx, sy, playerFrameWidth, playerFrameHeight, destX, destY, destW, destH);

  // Namn
  ctx.save();
  ctx.font = "bold 12px monospace";
  ctx.textAlign = "center";
  let tw = ctx.measureText(myName).width;
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(destX + destW / 2 - tw / 2 - 3, destY - 14, tw + 6, 14);
  ctx.fillStyle = "#ffffff";
  ctx.fillText(myName, destX + destW / 2, destY - 3);
  ctx.restore();

  // Emoji
  drawEmoji(socket.id, player.x, player.y);

  ctx.restore();
}

// Huvudloop
function gameLoop() {
  update();
  frameTick++;
  if (frameTick >= frameTickRate) {
    frameTick = 0;
    playerFrame = (playerFrame + 1) % Math.max(1, currentAnimLength);
  }
  draw();
  requestAnimationFrame(gameLoop);
}