// Init: canvas och tileset
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const tileset = new Image();
tileset.src = "assets\\Modern tiles_Free\\Interiors_free\\32x32\\Room_Builder_free_32x32.png";

// Konfiguration
const tileSize = 32;

// Karta (test)
const map = [
  "####################",
  "#..................#",
  "#..................#",
  "#..................#",
  "#..................#",
  "#.........P........#",
  "#..................#",
  "####################"
];

// Anpassa canvas efter kartan
function setCanvasSize() {
  canvas.width = map[0].length * tileSize;
  canvas.height = map.length * tileSize;
}

// Tile-mappning: vilket område i tilesetet motsvarar ett tecken
const tileMap = {
  '#': { tx: 4, ty: 4 },
  '.': { tx: 1, ty: 14 },
  'P': { tx: 2, ty: 0 }
};

// Laddning och player-inställningar
let tilesetLoaded = false;
let gameStarted = false;

const playerSprite = new Image();
playerSprite.src = "assets\\Modern tiles_Free\\Characters_free\\Bob_idle_anim_16x16.png";
let playerSpriteLoaded = false;
let playerFrame = 0;
let playerFrameCount = 1;
let playerFrameWidth = 16;
let playerFrameHeight = 32;
let playerRow = 0;
let playerFrameStart = 9;
let playerAnimLength = 5;
let playerSourceYOffset = 0;
let playerDrawScale = 1.67;
let playerFeetY = 16;
let fitToTile = false;
let frameTick = 0;
const frameTickRate = 10;

// Starta spelet när tileset är laddat
tileset.onload = () => {
  tilesetLoaded = true;
  if (playerSpriteLoaded) {
    setCanvasSize();
    if (!gameStarted) {
      gameStarted = true;
      gameLoop();
    }
  }
};

if (tileset.complete) {
  tilesetLoaded = true;
  if (playerSprite.complete) {
    playerSpriteLoaded = true;
    playerFrameCount = Math.max(1, Math.floor(playerSprite.width / playerFrameWidth));
    if (playerFrameStart + playerAnimLength > playerFrameCount) {
      playerAnimLength = Math.max(1, playerFrameCount - playerFrameStart);
    }
    setCanvasSize();
    gameStarted = true;
    gameLoop();
  }
}

// Starta spelet när player-spritesheet är laddad
playerSprite.onload = () => {
  playerSpriteLoaded = true;
  playerFrameCount = Math.max(1, Math.floor(playerSprite.width / playerFrameWidth));
  if (playerFrameStart + playerAnimLength > playerFrameCount) {
    playerAnimLength = Math.max(1, playerFrameCount - playerFrameStart);
  }
  if (tilesetLoaded && !gameStarted) {
    setCanvasSize();
    gameStarted = true;
    gameLoop();
  }
};

if (playerSprite.complete) {
  playerSpriteLoaded = true;
  playerFrameCount = Math.max(1, Math.floor(playerSprite.width / playerFrameWidth));
  if (playerFrameStart + playerAnimLength > playerFrameCount) {
    playerAnimLength = Math.max(1, playerFrameCount - playerFrameStart);
  }
}

// Spelarposition och kontroller
const player = { x: 5, y: 5 };

const keys = {};
document.addEventListener("keydown", (e) => { keys[e.key] = true; });
document.addEventListener("keyup", (e) => { keys[e.key] = false; });

// Uppdatera: rörelse och kollision
function update() {
  let newX = player.x;
  let newY = player.y;
  if (keys["ArrowUp"] || keys["w"]) newY--;
  if (keys["ArrowDown"] || keys["s"]) newY++;
  if (keys["ArrowLeft"] || keys["a"]) newX--;
  if (keys["ArrowRight"] || keys["d"]) newX++;

  if (newY < 0 || newY >= map.length || newX < 0 || newX >= map[0].length) return;
  if (map[newY][newX] !== "#") {
    player.x = newX;
    player.y = newY;
  }
}

// Rendera karta och spelare
function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.imageSmoothingEnabled = false;
  try { canvas.style.imageRendering = 'pixelated'; } catch (e) {}

  for (let row = 0; row < map.length; row++) {
    for (let col = 0; col < map[row].length; col++) {
      const tile = map[row][col];
      const x = col * tileSize;
      const y = row * tileSize;

      if (tilesetLoaded && tileMap[tile]) {
        const t = tileMap[tile];
        const sx = t.tx * tileSize;
        const sy = t.ty * tileSize;
        ctx.drawImage(tileset, sx, sy, tileSize, tileSize, x, y, tileSize, tileSize);
      } else {
        if (tile === '#') {
          ctx.fillStyle = "gray";
        } else if (tile === 'P') {
          ctx.fillStyle = "green";
        } else {
          ctx.fillStyle = "lightgreen";
        }
        ctx.fillRect(x, y, tileSize, tileSize);
      }
    }
  }

  if (playerSpriteLoaded) {
    const frameIndex = playerFrame % Math.max(1, playerAnimLength);
    const sx = (playerFrameStart + frameIndex) * playerFrameWidth;
    const sy = playerRow * playerFrameHeight + playerSourceYOffset;

    const maxFitScale = Math.max(1, Math.floor(tileSize / playerFrameHeight));
    const scale = fitToTile ? Math.max(1, Math.min(playerDrawScale, maxFitScale)) : Math.max(1, playerDrawScale);
    const destW = playerFrameWidth * scale;
    const destH = playerFrameHeight * scale;

    const destX = player.x * tileSize + Math.floor((tileSize - destW) / 2);
    const destY = player.y * tileSize + tileSize - Math.floor(playerFeetY * scale);

    ctx.drawImage(playerSprite, sx, sy, playerFrameWidth, playerFrameHeight, destX, destY, destW, destH);
  } else {
    ctx.fillStyle = "blue"; 
    ctx.fillRect(player.x * tileSize, player.y * tileSize, tileSize, tileSize);
  }
}

// Huvudloop
function gameLoop() {
  update();
  frameTick++;
  if (frameTick >= frameTickRate) {
    frameTick = 0;
    playerFrame = (playerFrame + 1) % Math.max(1, playerAnimLength);
  }
  draw();
  requestAnimationFrame(gameLoop);
}