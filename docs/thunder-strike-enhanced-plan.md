# Thunder Strike 8关增强版 — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development or executing-plans to implement this plan task-by-task.

**Goal:** Add 8-level system, per-level BGM, dynamic scrolling backgrounds, and level transition screens to the existing thunder-strike.html

**Architecture:** Single-file HTML app with 5 new code modules (LevelManager, BackgroundRenderer, AudioManager, EnemyScaler, TransitionUI) integrated into the existing game loop.

**Tech Stack:** Pure HTML5 Canvas + JavaScript ES6 + Web Audio API (no external dependencies)

---

### Task 1: Level Manager — Data & State Machine

**Files:**
- Modify: `thunder-strike.html` (after line 562, before game state variables)

- [ ] **Step 1: Add LEVELS configuration array and level state variables**

Insert after line 562 (`createShipImage('boss');`) and replace the existing `gameState` variable initialization section.

Add this after the `createShipImage` calls:

```javascript
// === Level Manager ===
const LEVELS = [
  { id: 1, name: '星云深处',   theme: 'space',   enemyMult: 1.00, waves: 3, bossHp: 30, bgColor: '#0a0a1a' },
  { id: 2, name: '云端之上',   theme: 'cloud',   enemyMult: 1.10, waves: 3, bossHp: 35, bgColor: '#1a1a2e' },
  { id: 3, name: '怒海争锋',   theme: 'ocean',   enemyMult: 1.21, waves: 4, bossHp: 40, bgColor: '#0a1a2e' },
  { id: 4, name: '峡谷穿梭',   theme: 'canyon',  enemyMult: 1.33, waves: 4, bossHp: 46, bgColor: '#1a0e0a' },
  { id: 5, name: '熔岩炼狱',   theme: 'volcano', enemyMult: 1.46, waves: 5, bossHp: 53, bgColor: '#1a0a0a' },
  { id: 6, name: '钢铁废墟',   theme: 'ruins',   enemyMult: 1.61, waves: 5, bossHp: 61, bgColor: '#0e0e12' },
  { id: 7, name: '冰封极地',   theme: 'ice',     enemyMult: 1.77, waves: 6, bossHp: 70, bgColor: '#0a1220' },
  { id: 8, name: '深渊黑洞',   theme: 'void',    enemyMult: 1.95, waves: 6, bossHp: 80, bgColor: '#080008' },
];

let currentLevel = 0;       // 0-based index
let currentWave = 0;
let bossPhase = false;
let stageClearTimer = 0;
let levelIntroTimer = 0;
let levelIntroText = '';
let gameOverTriggered = false;
```

Then **replace** the existing variable declarations (lines 563-579):

```javascript
let gameState = 'menu';
let score = 0;
let highScore = parseInt(localStorage.getItem('thunderStrikeHighScore')) || 0;
let player = null;
let bullets = [];
let enemyBullets = [];
let enemies = [];
let powerups = [];
let explosions = [];
let stars = [];
let boss = null;
let bombs = 2;
let waveTimer = 0;
let waveCount = 0;
let lastScore = 0;
let gameTime = 0;

// State: 'menu' | 'levelIntro' | 'playing' | 'boss' | 'stageClear' | 'gameover' | 'victory'
let gameState = 'menu';
```

- [ ] **Step 2: Add level transition helper functions**

After the LEVELS array, add:

```javascript
function startLevel(levelIndex) {
  currentLevel = levelIndex;
  currentWave = 0;
  bossPhase = false;
  waveTimer = 0;
  waveCount = 0;
  gameOverTriggered = false;
  
  const level = LEVELS[levelIndex];
  gameState = 'levelIntro';
  levelIntroTimer = 180; // 3s at 60fps
  levelIntroText = 'LEVEL ' + (levelIndex + 1) + ' — ' + level.name;
  
  // Reset game entities
  player = new Player();
  bullets = [];
  enemyBullets = [];
  enemies = [];
  powerups = [];
  explosions = [];
  boss = null;
  
  // Init background stars for this level
  stars = [];
  for (let i = 0; i < 80; i++) {
    stars.push(new Star());
  }
  
  bombs = 2;
  
  if (audioManager) {
    audioManager.load(levelIndex);
  }
  
  updateUI();
  updatePowerBar();
}

function startNextLevel() {
  if (currentLevel + 1 >= LEVELS.length) {
    // Victory
    gameState = 'victory';
    if (audioManager) audioManager.stop();
    return;
  }
  startLevel(currentLevel + 1);
}
```

---

### Task 2: Audio Manager

**Files:**
- Modify: `thunder-strike.html` (after the level manager functions)

- [ ] **Step 1: Add AudioManager singleton**

Insert after `startNextLevel()`:

```javascript
// === Audio Manager ===
const audioManager = {
  normalAudio: null,
  bossAudio: null,
  victoryAudio: null,
  currentPhase: null,
  loaded: false,
  levelIndex: -1,

  load(levelIndex) {
    if (this.levelIndex === levelIndex && this.loaded) return;
    this.levelIndex = levelIndex;
    this.loaded = false;
    this.stop();

    const level = LEVELS[levelIndex];
    if (!level) return;

    this.normalAudio = new Audio('bgm/l' + (levelIndex + 1) + '_normal.mp3');
    this.bossAudio = new Audio('bgm/l' + (levelIndex + 1) + '_boss.mp3');
    this.victoryAudio = new Audio('bgm/victory.mp3');

    this.normalAudio.loop = true;
    this.bossAudio.loop = true;

    this.normalAudio.addEventListener('canplaythrough', () => {
      this.loaded = true;
    }, { once: true });
  },

  play(phase) {
    if (phase === this.currentPhase) return;
    this.stop();

    switch (phase) {
      case 'normal':
        if (this.normalAudio) {
          this.normalAudio.currentTime = 0;
          this.normalAudio.play().catch(() => {});
          this.currentPhase = 'normal';
        }
        break;
      case 'boss':
        if (this.bossAudio) {
          this.bossAudio.currentTime = 0;
          this.bossAudio.play().catch(() => {});
          this.currentPhase = 'boss';
        }
        break;
      case 'victory':
        if (this.victoryAudio) {
          this.victoryAudio.currentTime = 0;
          this.victoryAudio.play().catch(() => {});
          this.currentPhase = 'victory';
        }
        break;
    }
  },

  stop() {
    if (this.normalAudio) { this.normalAudio.pause(); this.normalAudio.currentTime = 0; }
    if (this.bossAudio) { this.bossAudio.pause(); this.bossAudio.currentTime = 0; }
    if (this.victoryAudio) { this.victoryAudio.pause(); this.victoryAudio.currentTime = 0; }
    this.currentPhase = null;
  }
};
```

---

### Task 3: Transition UI — Level Intro, Stage Clear, Victory

**Files:**
- Modify: `thunder-strike.html` (after AudioManager)

- [ ] **Step 1: Add TransitionUI rendering functions**

Insert after audioManager:

```javascript
// === Transition UI ===
function renderLevelIntro(ctx) {
  if (gameState !== 'levelIntro') return;
  
  ctx.save();
  
  // Dim background
  ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  // Calculate alpha based on timer
  let alpha = 1;
  if (levelIntroTimer > 150) alpha = (180 - levelIntroTimer) / 30;        // fade in
  else if (levelIntroTimer > 60) alpha = 1;                                // hold
  else alpha = levelIntroTimer / 60;                                        // fade out
  
  ctx.globalAlpha = alpha;
  
  // Level title
  const levelNum = currentLevel + 1;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowColor = '#00ffff';
  ctx.shadowBlur = 30;
  ctx.font = '48px Orbitron, monospace';
  ctx.fillStyle = '#00ffff';
  ctx.fillText('LEVEL ' + levelNum, WIDTH / 2, HEIGHT / 2 - 40);
  
  ctx.shadowBlur = 20;
  ctx.font = '24px Orbitron, monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(LEVELS[currentLevel].name, WIDTH / 2, HEIGHT / 2 + 20);
  
  ctx.shadowBlur = 10;
  ctx.font = '14px Orbitron, monospace';
  ctx.fillStyle = '#888888';
  ctx.fillText(LEVELS[currentLevel].theme.toUpperCase(), WIDTH / 2, HEIGHT / 2 + 55);
  
  ctx.restore();
}

function renderStageClear(ctx) {
  if (gameState !== 'stageClear') return;
  
  ctx.save();
  
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  const elapsed = 120 - stageClearTimer;
  let alpha = 1;
  if (elapsed < 20) alpha = elapsed / 20;
  
  ctx.globalAlpha = alpha;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  ctx.shadowColor = '#00ff88';
  ctx.shadowBlur = 40;
  ctx.font = '48px Orbitron, monospace';
  ctx.fillStyle = '#00ff88';
  ctx.fillText('STAGE CLEAR', WIDTH / 2, HEIGHT / 2 - 30);
  
  ctx.shadowBlur = 20;
  ctx.font = '20px Orbitron, monospace';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('SCORE: ' + score, WIDTH / 2, HEIGHT / 2 + 30);
  
  ctx.restore();
}

function renderVictory(ctx) {
  if (gameState !== 'victory') return;
  
  ctx.save();
  
  // Animated background
  const hue = (gameTime * 0.5) % 360;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Pulsing glow
  const pulse = Math.sin(gameTime * 0.05) * 0.3 + 0.7;
  ctx.globalAlpha = pulse;
  ctx.shadowColor = 'hsl(' + hue + ', 100%, 50%)';
  ctx.shadowBlur = 50;
  ctx.font = '36px Orbitron, monospace';
  ctx.fillStyle = '#ffff00';
  ctx.fillText('MISSION COMPLETE', WIDTH / 2, HEIGHT / 2 - 50);
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 20;
  ctx.shadowColor = '#00ff88';
  ctx.font = '24px Orbitron, monospace';
  ctx.fillStyle = '#00ff88';
  ctx.fillText('TOTAL SCORE: ' + score, WIDTH / 2, HEIGHT / 2 + 10);
  
  ctx.shadowBlur = 0;
  ctx.font = '14px Orbitron, monospace';
  ctx.fillStyle = '#888888';
  ctx.fillText('Click to return to menu', WIDTH / 2, HEIGHT / 2 + 60);
  
  ctx.restore();
}
```

---

### Task 4: Background Renderer — 8 Theme Renderers

**Files:**
- Modify: `thunder-strike.html` (after TransitionUI)

- [ ] **Step 1: Add BackgroundRenderer with all 8 theme renderers**

This is the largest new code block. Insert after the TransitionUI section:

```javascript
// === Background Renderer ===
const backgroundRenderer = {
  render(ctx, gameTime, theme) {
    switch (theme) {
      case 'space':  this.renderSpace(ctx, gameTime); break;
      case 'cloud':  this.renderCloud(ctx, gameTime); break;
      case 'ocean':  this.renderOcean(ctx, gameTime); break;
      case 'canyon': this.renderCanyon(ctx, gameTime); break;
      case 'volcano': this.renderVolcano(ctx, gameTime); break;
      case 'ruins':  this.renderRuins(ctx, gameTime); break;
      case 'ice':    this.renderIce(ctx, gameTime); break;
      case 'void':   this.renderVoid(ctx, gameTime); break;
    }
  },

  renderSpace(ctx, t) {
    // Enhanced starfield with nebula effect
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#050510');
    grad.addColorStop(0.5, '#0a0a2a');
    grad.addColorStop(1, '#050510');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // Distant nebula clouds
    ctx.save();
    ctx.globalAlpha = 0.15;
    for (let i = 0; i < 3; i++) {
      const cx = WIDTH * (0.2 + 0.6 * Math.sin(t * 0.001 + i * 2));
      const cy = HEIGHT * (0.3 + 0.4 * Math.cos(t * 0.0015 + i * 3));
      const r = 100 + 50 * Math.sin(t * 0.002 + i);
      const grad2 = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
      const hue = [200, 280, 160][i];
      grad2.addColorStop(0, 'hsla(' + hue + ', 80%, 50%, 0.3)');
      grad2.addColorStop(1, 'hsla(' + hue + ', 80%, 50%, 0)');
      ctx.fillStyle = grad2;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  renderCloud(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(0.5, '#2a2a4e');
    grad.addColorStop(1, '#1a1a2e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    // 3 layers of clouds at different speeds
    ctx.save();
    const layers = [
      { speed: 0.3, alpha: 0.08, yOff: 0, scale: 1.0 },
      { speed: 0.6, alpha: 0.12, yOff: 40, scale: 0.7 },
      { speed: 1.0, alpha: 0.06, yOff: -20, scale: 1.3 },
    ];
    for (const layer of layers) {
      ctx.globalAlpha = layer.alpha;
      for (let x = -50; x < WIDTH + 50; x += 60 * layer.scale) {
        const xOff = (x + t * layer.speed) % (WIDTH + 100) - 50;
        const yBase = (HEIGHT * 0.5) + layer.yOff + Math.sin(x * 0.02 + t * 0.002) * 60;
        ctx.fillStyle = '#aaccee';
        ctx.beginPath();
        ctx.ellipse(xOff, yBase, 40 * layer.scale, 15 * layer.scale, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(xOff + 25 * layer.scale, yBase - 5, 30 * layer.scale, 12 * layer.scale, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
    
    // Lightning flashes
    if (Math.random() < 0.003) {
      ctx.save();
      ctx.strokeStyle = '#ffffff';
      ctx.shadowColor = '#ffff00';
      ctx.shadowBlur = 20;
      ctx.lineWidth = 3;
      let lx = Math.random() * WIDTH, ly = 0;
      ctx.beginPath();
      ctx.moveTo(lx, ly);
      for (let i = 0; i < 5; i++) {
        lx += (Math.random() - 0.5) * 30;
        ly += 20 + Math.random() * 30;
        ctx.lineTo(lx, ly);
      }
      ctx.stroke();
      ctx.restore();
    }
  },

  renderOcean(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#0a1a3e');
    grad.addColorStop(0.3, '#0a2a5e');
    grad.addColorStop(1, '#051530');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.save();
    // 2 wave layers
    for (let layer = 0; layer < 2; layer++) {
      ctx.globalAlpha = 0.3 + layer * 0.15;
      ctx.fillStyle = layer === 0 ? '#0a4a8a' : '#0a6aaa';
      ctx.beginPath();
      ctx.moveTo(0, HEIGHT);
      for (let x = 0; x <= WIDTH; x += 5) {
        const y = HEIGHT * 0.6 + layer * 40
          + Math.sin(x * 0.02 + t * 0.02 + layer * 2) * 30
          + Math.sin(x * 0.04 + t * 0.03) * 15;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(WIDTH, HEIGHT);
      ctx.closePath();
      ctx.fill();
    }
    
    // Sunlight reflections
    ctx.globalAlpha = 0.2;
    for (let i = 0; i < 5; i++) {
      const rx = WIDTH * (0.1 + 0.8 * Math.sin(t * 0.01 + i * 1.3));
      const ry = HEIGHT * 0.5 + Math.sin(t * 0.02 + i) * 30;
      ctx.fillStyle = '#88ddff';
      ctx.beginPath();
      ctx.ellipse(rx, ry, 15, 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  renderCanyon(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#1a0e0a');
    grad.addColorStop(0.3, '#2a1a0e');
    grad.addColorStop(1, '#0a0502');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.save();
    // Canyon walls (parallax)
    const layers = [
      { color: '#2a1a0e', offset: 0, speed: 0.3, amp: 40 },
      { color: '#3a2a1e', offset: 0, speed: 0.6, amp: 30 },
    ];
    for (let l = 0; l < layers.length; l++) {
      const layer = layers[l];
      ctx.fillStyle = layer.color;
      ctx.beginPath();
      ctx.moveTo(0, HEIGHT);
      for (let x = 0; x <= WIDTH; x += 5) {
        const wallLeft = 20 + x * (0.15 - l * 0.05) 
          + Math.sin(x * 0.01 + t * 0.005 * layer.speed) * layer.amp
          + Math.sin(x * 0.02 + t * 0.003) * 15;
        const wallRight = WIDTH - 20 - x * (0.15 - l * 0.05)
          + Math.sin(x * 0.01 + t * 0.005 * layer.speed + 2) * layer.amp
          + Math.sin(x * 0.02 + t * 0.003) * 15;
        ctx.lineTo(Math.max(0, wallLeft), x);
      }
      for (let x = WIDTH; x >= 0; x -= 5) {
        const wallRight = WIDTH - 20 - x * (0.15 - l * 0.05)
          + Math.sin(x * 0.01 + t * 0.005 * layer.speed + 2) * layer.amp
          + Math.sin(x * 0.02 + t * 0.003) * 15;
        ctx.lineTo(Math.min(WIDTH, wallRight), x);
      }
      ctx.closePath();
      ctx.fill();
    }
    
    // Distant sun
    ctx.globalAlpha = 0.3;
    const sunX = WIDTH * 0.3;
    const sunY = HEIGHT * 0.15;
    const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, 60);
    sunGrad.addColorStop(0, '#ff8844');
    sunGrad.addColorStop(1, 'rgba(255, 136, 68, 0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 60, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  renderVolcano(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#1a0505');
    grad.addColorStop(0.4, '#2a0a05');
    grad.addColorStop(0.7, '#3a1a05');
    grad.addColorStop(1, '#1a0a00');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.save();
    // Ground with lava cracks
    for (let x = 0; x < WIDTH; x += 3) {
      const groundY = HEIGHT * 0.75 + Math.sin(x * 0.03) * 20 + Math.sin(x * 0.07) * 10;
      ctx.fillStyle = '#1a0a00';
      ctx.fillRect(x, groundY, 3, HEIGHT - groundY);
      
      // Lava glow in cracks
      if (Math.random() < 0.3) {
        ctx.fillStyle = '#ff4400';
        ctx.globalAlpha = 0.2 + Math.random() * 0.3;
        ctx.fillRect(x, groundY, 3, 3 + Math.random() * 5);
      }
    }
    
    // Smoke particles
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 15; i++) {
      const px = (WIDTH * 0.3 + Math.sin(t * 0.003 + i * 2) * 100 + i * 30) % WIDTH;
      const py = (HEIGHT * 0.6 - (t * 0.5 + i * 40) % 200);
      const size = 10 + (t * 0.5 + i * 40) % 100 * 0.3;
      ctx.fillStyle = '#333333';
      ctx.beginPath();
      ctx.arc(px, py, Math.min(size, 40), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  renderRuins(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#0e0e12');
    grad.addColorStop(0.5, '#16161e');
    grad.addColorStop(1, '#0a0a0e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.save();
    // Building silhouettes at different layers
    const buildings = [
      { x: 30, w: 50, h: 120, layer: 0 },
      { x: 110, w: 40, h: 180, layer: 0 },
      { x: 200, w: 60, h: 90, layer: 1 },
      { x: 290, w: 35, h: 200, layer: 1 },
      { x: 350, w: 55, h: 140, layer: 0 },
      { x: 420, w: 30, h: 100, layer: 1 },
      { x: 60, w: 45, h: 70, layer: 2 },
      { x: 160, w: 50, h: 110, layer: 2 },
      { x: 310, w: 40, h: 80, layer: 2 },
      { x: 400, w: 50, h: 60, layer: 2 },
    ];
    
    for (const b of buildings) {
      const layerSpeed = 0.3 + b.layer * 0.2;
      const yOff = (t * layerSpeed) % (HEIGHT + b.h);
      const screenY = HEIGHT - yOff + b.h;
      
      ctx.fillStyle = `rgba(10, 10, 15, ${0.6 + b.layer * 0.15})`;
      ctx.fillRect(b.x, screenY - b.h, b.w, b.h);
      
      // Windows with occasional glow
      for (let wy = screenY - b.h + 10; wy < screenY - 10; wy += 15) {
        for (let wx = b.x + 5; wx < b.x + b.w - 5; wx += 12) {
          if (Math.sin(wx * 0.1 + wy * 0.1 + t * 0.02) > 0.3) {
            ctx.fillStyle = '#ffaa44';
            ctx.globalAlpha = 0.15 + Math.sin(t * 0.03 + wx) * 0.1;
            ctx.fillRect(wx, wy, 6, 8);
          }
        }
      }
    }
    
    // Fire glow
    ctx.globalAlpha = 0.1 + Math.sin(t * 0.02) * 0.05;
    const fireGrad = ctx.createRadialGradient(WIDTH * 0.7, HEIGHT * 0.5, 0, WIDTH * 0.7, HEIGHT * 0.5, 80);
    fireGrad.addColorStop(0, '#ff6600');
    fireGrad.addColorStop(1, 'rgba(255, 102, 0, 0)');
    ctx.fillStyle = fireGrad;
    ctx.beginPath();
    ctx.arc(WIDTH * 0.7, HEIGHT * 0.5, 80, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  },

  renderIce(ctx, t) {
    const grad = ctx.createLinearGradient(0, 0, 0, HEIGHT);
    grad.addColorStop(0, '#0a1220');
    grad.addColorStop(0.3, '#0e1a30');
    grad.addColorStop(1, '#061020');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.save();
    // Aurora borealis
    ctx.globalAlpha = 0.25;
    for (let i = 0; i < 4; i++) {
      const hue = 160 + i * 40 + Math.sin(t * 0.002 + i) * 20;
      const ax = WIDTH * (0.1 + 0.8 * (i / 4));
      ctx.fillStyle = 'hsla(' + hue + ', 80%, 60%, 0.15)';
      ctx.beginPath();
      ctx.moveTo(ax - 80, 0);
      ctx.quadraticCurveTo(
        ax - 40 + Math.sin(t * 0.01 + i) * 60,
        HEIGHT * 0.2 + Math.sin(t * 0.008 + i * 2) * 40,
        ax + Math.sin(t * 0.012 + i) * 50,
        HEIGHT * 0.4
      );
      ctx.quadraticCurveTo(
        ax + 40 + Math.sin(t * 0.015 + i) * 40,
        HEIGHT * 0.2 + Math.sin(t * 0.01 + i * 3) * 30,
        ax + 80,
        0
      );
      ctx.closePath();
      ctx.fill();
    }
    
    // Snow particles
    ctx.globalAlpha = 0.5;
    for (let i = 0; i < 40; i++) {
      const sx = (i * 13 + t * 0.3) % WIDTH;
      const sy = (i * 17 + t * 0.8) % HEIGHT;
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  },

  renderVoid(ctx, t) {
    const grad = ctx.createRadialGradient(WIDTH / 2, HEIGHT * 0.3, 0, WIDTH / 2, HEIGHT * 0.3, HEIGHT * 0.8);
    grad.addColorStop(0, '#1a0020');
    grad.addColorStop(0.3, '#0e0015');
    grad.addColorStop(0.6, '#080010');
    grad.addColorStop(1, '#020005');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    
    ctx.save();
    // Accretion disk
    ctx.translate(WIDTH / 2, HEIGHT * 0.35);
    ctx.globalAlpha = 0.3;
    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2 + t * 0.005;
      const dist = 80 + 40 * Math.sin(i * 0.3);
      const px = Math.cos(angle) * dist;
      const py = Math.sin(angle) * dist * 0.3;
      const size = 2 + Math.sin(i * 0.5) * 1.5;
      const hue = 280 + Math.sin(i * 0.2) * 40;
      ctx.fillStyle = 'hsla(' + hue + ', 80%, 60%, 0.4)';
      ctx.beginPath();
      ctx.arc(px, py, size, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Distorted stars
    ctx.globalAlpha = 0.6;
    for (let i = 0; i < 30; i++) {
      const a = i * 1.2 + t * 0.003;
      const d = 60 + i * 8 + Math.sin(i * 0.7 + t * 0.01) * 20;
      const sx = Math.cos(a) * d;
      const sy = Math.sin(a) * d * 0.3;
      const stretch = 1 + Math.sin(a * 2 + t * 0.02) * 2;
      ctx.fillStyle = '#8866cc';
      ctx.beginPath();
      ctx.ellipse(sx, sy, 1.5 + stretch, 1, -a * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }
};
```

Note: The cloud renderer uses `ctx.currentX_` / `ctx.currentY_` which is not a real Canvas API. This needs to be fixed. Let me correct the lightning section. I'll make it simpler - track last point manually.

Actually, I realize the lightning flash in `renderCloud` has a bug. Let me fix it in the actual implementation to use a simple sequential approach.

---

### Task 5: Enemy Scaler — Apply Level Multipliers

**Files:**
- Modify: `thunder-strike.html` (after BackgroundRenderer)

- [ ] **Step 1: Add enemy scaling function**

Insert after background renderer:

```javascript
// === Enemy Scaler ===
function getScaledStats(baseHP, baseSpeed, levelIndex) {
  const mult = LEVELS[levelIndex].enemyMult;
  return {
    hp: Math.round(baseHP * mult),
    speed: baseSpeed * (1 + (mult - 1) * 0.5),
    shootInterval: Math.round(90 / mult),
    spawnInterval: Math.round((120 - levelIndex * 5) / mult)
  };
}
```

- [ ] **Step 2: Modify Enemy constructor to use scaling**

In the Enemy class, change the `switch(type)` block to use scaled values.

Replace lines 867-895 (the switch inside Enemy constructor) with:

```javascript
const scaled = getScaledStats(1, 2, currentLevel);
switch (type) {
  case 'small':
    this.width = 30;
    this.height = 30;
    this.hp = scaled.hp;
    this.maxHp = scaled.hp;
    this.speed = scaled.speed;
    this.color = COLORS.enemySmall;
    this.score = 100;
    break;
  case 'medium':
    this.width = 40;
    this.height = 40;
    this.hp = Math.round(scaled.hp * 2);
    this.maxHp = Math.round(scaled.hp * 2);
    this.speed = scaled.speed * 0.75;
    this.color = COLORS.enemyMedium;
    this.score = 300;
    break;
  case 'large':
    this.width = 60;
    this.height = 50;
    this.hp = Math.round(scaled.hp * 4);
    this.maxHp = Math.round(scaled.hp * 4);
    this.speed = scaled.speed * 0.4;
    this.color = COLORS.enemyLarge;
    this.score = 500;
    break;
}
```

- [ ] **Step 3: Modify Boss constructor HP**

In the Boss class constructor, change `this.hp = 30 + waveCount * 5;` to:

```javascript
const scaled = getScaledStats(LEVELS[currentLevel].bossHp, 2, currentLevel);
this.hp = Math.round(scaled.hp);
this.maxHp = this.hp;
```

---

### Task 6: Boss Phase Detection & Spawn

**Files:**
- Modify: `thunder-strike.html` (modify `spawnEnemies` function and game loop)

- [ ] **Step 1: Redesign `spawnEnemies` for level-based spawning**

Replace the existing `spawnEnemies()` function (lines 1233-1262):

```javascript
function spawnEnemies() {
  if (!player) return;
  if (bossPhase || gameState !== 'playing') return;
  
  waveTimer++;
  const level = LEVELS[currentLevel];
  const scaled = getScaledStats(1, 2, currentLevel);
  const spawnInterval = Math.max(40, scaled.spawnInterval);
  
  if (waveTimer >= spawnInterval && !boss) {
    waveTimer = 0;
    waveCount++;
    
    const enemyCount = Math.min(5, 2 + Math.floor(currentLevel * 0.5 + waveCount / 3));
    
    for (let i = 0; i < enemyCount; i++) {
      let type = 'small';
      if (currentLevel > 2 && Math.random() < 0.25) type = 'medium';
      if (currentLevel > 4 && Math.random() < 0.15) type = 'large';
      
      const enemy = new Enemy(type);
      enemy.x = (WIDTH / (enemyCount + 1)) * (i + 1);
      enemy.y = -50 - i * 80;
      enemies.push(enemy);
    }
  }
  
  // Check if all waves for this level are done
  if (waveCount >= level.waves && enemies.length === 0 && !boss) {
    bossPhase = true;
    audioManager.play('boss');
    boss = new Boss();
  }
}
```

---

### Task 7: Update Game Loop

**Files:**
- Modify: `thunder-strike.html` (modify `gameLoop`, `startGame`, `gameOver`)

- [ ] **Step 1: Modify `gameLoop` to integrate all new systems**

Replace the `gameLoop` function (starts at line 1445):

```javascript
function gameLoop() {
  gameTime++;
  
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  
  // Render level background
  if (gameState === 'playing' || gameState === 'boss' || gameState === 'levelIntro' || gameState === 'stageClear') {
    const theme = LEVELS[currentLevel].theme;
    backgroundRenderer.render(ctx, gameTime, theme);
  } else if (gameState === 'victory') {
    backgroundRenderer.render(ctx, gameTime, 'void');
  } else {
    // Menu state: original dark background
    ctx.fillStyle = '#0a0a1a';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  
  // Render stars on top of background
  if (gameState !== 'menu') {
    for (const star of stars) {
      star.update();
      star.draw();
    }
    ctx.globalAlpha = 1;
  }
  
  if (gameState === 'levelIntro') {
    levelIntroTimer--;
    renderLevelIntro(ctx);
    if (levelIntroTimer <= 0) {
      gameState = 'playing';
      audioManager.play('normal');
    }
  } else if (gameState === 'playing' || gameState === 'boss') {
    spawnEnemies();
    
    if (player) {
      player.update();
      player.draw();
    }
    
    for (const enemy of enemies) {
      enemy.update();
      enemy.draw();
    }
    enemies = enemies.filter(e => e.active);
    
    if (boss) {
      boss.update();
      boss.draw();
      if (!boss.active && bossPhase) {
        // Boss defeated
        bossPhase = false;
        gameState = 'stageClear';
        stageClearTimer = 180; // 3s
        audioManager.play('victory');
      }
    }
    
    for (const bullet of bullets) {
      bullet.update();
      bullet.draw();
    }
    bullets = bullets.filter(b => b.active);
    
    for (const bullet of enemyBullets) {
      bullet.update();
      bullet.draw();
    }
    enemyBullets = enemyBullets.filter(b => b.active);
    
    for (const powerup of powerups) {
      powerup.update();
      powerup.draw();
    }
    powerups = powerups.filter(p => p.active);
    
    for (const explosion of explosions) {
      explosion.update();
      explosion.draw();
    }
    explosions = explosions.filter(e => e.active);
    
    checkCollisions();
    
  } else if (gameState === 'stageClear') {
    stageClearTimer--;
    renderStageClear(ctx);
    
    // Keep drawing remaining entities
    for (const enemy of enemies) {
      enemy.update();
      enemy.draw();
    }
    enemies = enemies.filter(e => e.active);
    
    for (const explosion of explosions) {
      explosion.update();
      explosion.draw();
    }
    explosions = explosions.filter(e => e.active);
    
    if (stageClearTimer <= 0) {
      startNextLevel();
    }
    
  } else if (gameState === 'victory') {
    renderVictory(ctx);
  }
  
  requestAnimationFrame(gameLoop);
}
```

- [ ] **Step 2: Modify `startGame` to begin at level 0**

Replace `startGame` function:

```javascript
function startGame() {
  score = 0;
  gameOverTriggered = false;
  document.getElementById('gameMessage').classList.add('hidden');
  startLevel(0);
}
```

- [ ] **Step 3: Modify `gameOver` to reset properly**

Update `gameOver` to save state and allow restart:

```javascript
function gameOver() {
  if (gameOverTriggered) return;
  gameOverTriggered = true;
  gameState = 'gameover';
  audioManager.stop();
  
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('thunderStrikeHighScore', highScore);
    document.getElementById('highScore').textContent = highScore;
  }
  
  const messageEl = document.getElementById('gameMessage');
  messageEl.innerHTML = `
    <h1>GAME OVER</h1>
    <p style="font-size: 24px; color: #00ff88; margin: 20px 0;">SCORE: ${score}</p>
    <p style="font-size: 14px; color: #888;">Reached: LEVEL ${currentLevel + 1} — ${LEVELS[currentLevel].name}</p>
    <button class="start-btn" onclick="startGame()">重新开始</button>
  `;
  messageEl.classList.remove('hidden');
}
```

---

### Task 8: Create `bgm/` Directory & README

**Files:**
- Create: `bgm/README.md`

- [ ] **Step 1: Create bgm directory with instructions**

```bash
mkdir -p bgm
```

- [ ] **Step 2: Create README**

Create `bgm/README.md`:

```markdown
# BGM Files for Thunder Strike

Place MP3 files in this directory with the following naming convention:

## Required files (17 total)

### Level BGM (16 files)
- `l1_normal.mp3` — Level 1 ambient/electronic
- `l1_boss.mp3` — Level 1 boss battle (tense)
- `l2_normal.mp3` — Level 2 ethereal/orchestral
- `l2_boss.mp3` — Level 2 boss battle
- `l3_normal.mp3` — Level 3 epic orchestral
- `l3_boss.mp3` — Level 3 boss battle
- `l4_normal.mp3` — Level 4 western/canyon
- `l4_boss.mp3` — Level 4 boss battle
- `l5_normal.mp3` — Level 5 heavy rock/metal
- `l5_boss.mp3` — Level 5 boss battle
- `l6_normal.mp3` — Level 6 industrial electronic
- `l6_boss.mp3` — Level 6 boss battle
- `l7_normal.mp3` — Level 7 ethereal/choir
- `l7_boss.mp3` — Level 7 boss battle
- `l8_normal.mp3` — Level 8 dark orchestral
- `l8_boss.mp3` — Level 8 boss battle

### Victory
- `victory.mp3` — Played after each stage clear

## Format
- Format: MP3
- Any bitrate (128kbps+ recommended)
- Looping tracks recommended (files will loop automatically)
```

---

### Task 9: Integration Verification

- [ ] **Step 1: Verify all references are correct**

Check that:
- All function calls match their definitions
- `audioManager` is defined before `startLevel()` which references it
- `backgroundRenderer` is defined before `gameLoop()` which references it
- All `LEVELS[currentLevel]` accesses happen when currentLevel is valid

- [ ] **Step 2: Manual testing checklist**
1. Menu → Click Start → Level 1 intro animates (3s) → BGM starts → Game plays
2. Kill all waves → Boss phase triggers → Boss BGM switches → Boss appears
3. Kill boss → "STAGE CLEAR" → Victory music → Next level starts
4. Level 2 has different background (clouds) and harder enemies
5. On level 8 clear → "MISSION COMPLETE" screen
6. Dying → "GAME OVER" with level info → Can restart
7. High score saved to localStorage
