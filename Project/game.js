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
let direction = 3;      // 3 = down (framåt)
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
    if (dx < 0) direction = 2; // left
    else if (dx > 0) direction = 0; // right
    else if (dy < 0) direction = 1; // up
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

  const nextTileX = Math.floor(player.x + player.vx);
  const nextTileY = Math.floor(player.y + player.vy);

  if (nextTileY >= 0 && nextTileY < map.length && nextTileX >= 0 && nextTileX < map[0].length && map[nextTileY][nextTileX] !== "#") {
    player.x += player.vx;
    player.y += player.vy;
  } else {
    player.vx = 0;
    player.vy = 0;
  }
}

// Draw
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

  if (playerSpriteLoaded && runSpriteLoaded) {
    const frameIndex = playerFrame % Math.max(1, currentAnimLength);
    const sx = (currentFrameStart + frameIndex) * playerFrameWidth;
    const sy = currentRow * playerFrameHeight + playerSourceYOffset;
    console.log(`Frame info: image=${currentImage.src.split('/').pop()}, row=${currentRow}, frameIndex=${frameIndex}, sx=${sx}, sy=${sy}, dir=${direction}, moving=${isMoving}`);

    const maxFitScale = Math.max(1, Math.floor(tileSize / playerFrameHeight));
    const scale = fitToTile ? Math.max(1, Math.min(playerDrawScale, maxFitScale)) : Math.max(1, playerDrawScale);
    const destW = playerFrameWidth * scale;
    const destH = playerFrameHeight * scale;

    const destX = player.x * tileSize + Math.floor((tileSize - destW) / 2);
    const destY = player.y * tileSize + tileSize - Math.floor(playerFeetY * scale);

    ctx.drawImage(currentImage, sx, sy, playerFrameWidth, playerFrameHeight, destX, destY, destW, destH);
  } else if (playerSpriteLoaded) {
    const frameIndex = playerFrame % Math.max(1, playerAnimLength);
    const sx = (playerFrameStart + frameIndex) * playerFrameWidth;
    const sy = playerRow * playerFrameHeight + playerSourceYOffset;
    console.log(`Fallback: sx=${sx}, sy=${sy}`);
    const scale = playerDrawScale;
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
    playerFrame = (playerFrame + 1) % Math.max(1, currentAnimLength);
  }
  draw();
  requestAnimationFrame(gameLoop);
}

