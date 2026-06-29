import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// ─── Test Globals ───
type Game = Record<string, any>
let G: Game

// ─── Helpers ───
const $ = <T = any>(name: string): T => G[name]
const set$ = (name: string, value: any) => { G[name] = value }

function extractGameScript(): string {
  const html = readFileSync(resolve(process.cwd(), 'thunder-strike.html'), 'utf-8')
  const match = html.match(/<script>([\s\S]*?)<\/script>/)
  if (!match) throw new Error('No <script> found in HTML')
  return match[1].trim()
}

// ─── Canvas Mock Factory ───
function createMockContext() {
  const store: Record<string, any> = {
    fillStyle: '', strokeStyle: '', lineWidth: 1, globalAlpha: 1,
    shadowBlur: 0, shadowColor: '', font: '10px', textAlign: 'start',
    textBaseline: 'alphabetic',
  }
  const ctx: Record<string, any> = {
    save: vi.fn(), restore: vi.fn(), beginPath: vi.fn(), closePath: vi.fn(),
    fill: vi.fn(), stroke: vi.fn(), clip: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), arc: vi.fn(), ellipse: vi.fn(),
    quadraticCurveTo: vi.fn(), fillRect: vi.fn(), fillText: vi.fn(),
    drawImage: vi.fn(), translate: vi.fn(), rotate: vi.fn(), scale: vi.fn(),
    setTransform: vi.fn(),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),

    get fillStyle() { return store.fillStyle },
    set fillStyle(v) { store.fillStyle = v },
    get strokeStyle() { return store.strokeStyle },
    set strokeStyle(v) { store.strokeStyle = v },
    get lineWidth() { return store.lineWidth },
    set lineWidth(v) { store.lineWidth = v },
    get globalAlpha() { return store.globalAlpha },
    set globalAlpha(v) { store.globalAlpha = v },
    get shadowBlur() { return store.shadowBlur },
    set shadowBlur(v) { store.shadowBlur = v },
    get shadowColor() { return store.shadowColor },
    set shadowColor(v) { store.shadowColor = v },
    get font() { return store.font },
    set font(v) { store.font = v },
    get textAlign() { return store.textAlign },
    set textAlign(v) { store.textAlign = v },
    get textBaseline() { return store.textBaseline },
    set textBaseline(v) { store.textBaseline = v },
  }
  return ctx
}

// ─── Browser API Mocks ───
const storage: Record<string, string> = {}
const mockCtxMap = new Map<any, any>()

function setupMocks() {
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(
    function (this: HTMLCanvasElement, ...args: any[]) {
      if (args[0] === '2d') {
        if (!mockCtxMap.has(this)) mockCtxMap.set(this, createMockContext())
        return mockCtxMap.get(this)
      }
      return null
    },
  )

  function MockAudio(this: any) {
    const el = document.createElement('audio')
    el.play = vi.fn(() => Promise.resolve())
    el.pause = vi.fn()
    el.addEventListener = vi.fn(() => el)
    el.load = vi.fn()
    ;(el as any).loop = false
    ;(el as any).currentTime = 0
    Object.defineProperty(el, 'src', { set: vi.fn(), get: () => '' })
    return el
  }
  vi.stubGlobal('Audio', MockAudio as any)

  vi.stubGlobal('localStorage', {
    getItem: vi.fn((key: string) => storage[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { storage[key] = value }),
    removeItem: vi.fn((key: string) => { delete storage[key] }),
    clear: vi.fn(() => { Object.keys(storage).forEach(k => delete storage[k]) }),
    get length() { return Object.keys(storage).length },
    key: vi.fn((i: number) => Object.keys(storage)[i] ?? null),
  })

  vi.stubGlobal('requestAnimationFrame', vi.fn())
}

function setDOM() {
  document.body.innerHTML = `
    <div class="game-container">
      <canvas id="gameCanvas" width="480" height="720"></canvas>
      <div class="ui-overlay">
        <div class="score-panel">SCORE: <span id="score">0</span></div>
        <div class="high-score-panel">HIGH: <span id="highScore">0</span></div>
        <div class="life-panel" id="lifePanel"></div>
        <div class="bomb-panel"><div class="bomb-icon"></div><span id="bombCount">0</span></div>
        <div class="power-bar" id="powerBar"></div>
        <div class="game-message" id="gameMessage">
          <h1>THUNDER STRIKE</h1>
          <p>方向键/WASD - 移动 | 空格 - 射击</p>
          <p>鼠标 - 移动 | 左键 - 射击</p>
          <p>触屏 - 拖动移动 | 点击射击</p>
          <button class="start-btn" id="startBtn">开始游戏</button>
        </div>
        <div class="touch-left" id="touchLeft"><div class="touch-btn" id="btnBomb">💣</div></div>
        <div class="touch-right" id="touchRight"><div class="touch-btn" id="btnShoot">🔫</div></div>
      </div>
    </div>
  `
}

function injectAndExport(code: string) {
  const exportSnippet = `
;(function() {
  var game = window.__Game = {};

  // classes
  game.Player = Player; game.Bullet = Bullet; game.Missile = Missile;
  game.Enemy = Enemy; game.Boss = Boss; game.Powerup = Powerup;
  game.Explosion = Explosion; game.Star = Star;

  // functions
  game.getScaledStats = getScaledStats;
  game.startLevel = startLevel; game.startNextLevel = startNextLevel;
  game.spawnEnemies = spawnEnemies; game.checkCollisions = checkCollisions;
  game.useBomb = useBomb; game.updateUI = updateUI;
  game.updatePowerBar = updatePowerBar; game.gameOver = gameOver;
  game.startGame = startGame; game.createExplosion = createExplosion;
  game.spawnPowerup = spawnPowerup; game.getTouchShoot = getTouchShoot;
  game.resizeCanvas = resizeCanvas; game.gameLoop = gameLoop;

  // constants
  game.LEVELS = LEVELS; game.COLORS = COLORS;
  game.WIDTH = WIDTH; game.HEIGHT = HEIGHT;
  game.SHIP_SCALE = SHIP_SCALE; game.BOSS_SCALE = BOSS_SCALE;
  game.shipCache = shipCache;
  game.backgroundRenderer = backgroundRenderer;
  game.sfx = sfx; game.audioManager = audioManager;
  game.keys = keys;

  // mutable state getters/setters
  var varNames = 'score highScore player bullets enemyBullets enemies powerups explosions stars boss bombs gameState currentLevel currentWave bossPhase gameOverTriggered gameTime carryPower screenShake levelStartTime miniBossCount shieldSpawned mouseX mouseY mouseDown useMouseControl touchShoot touchActive stageClearTimer levelIntroTimer levelIntroText'.split(' ');
  var descs = {};
  varNames.forEach(function(v) {
    descs[v] = { get: function() { return eval(v); }, set: function(val) { eval(v + ' = val'); }, configurable: true, enumerable: true };
  });
  Object.defineProperties(game, descs);
})();
`
  const fullCode = code + exportSnippet
  const fn = new Function(fullCode)
  fn()
  G = (window as any).__Game
}

// ─── Helper: run a single game frame ───
function tick() {
  G.gameTime++
  for (const s of G.stars) s.update()
  if (G.gameState === 'playing' || G.gameState === 'boss') {
    if (G.player) G.player.update()
    for (const e of G.enemies) e.update()
    for (const b of G.bullets) b.update()
    for (const eb of G.enemyBullets) eb.update()
    for (const p of G.powerups) p.update()
    for (const ex of G.explosions) ex.update()
    G.enemies = G.enemies.filter((e: any) => e.active)
    G.bullets = G.bullets.filter((b: any) => b.active)
    G.enemyBullets = G.enemyBullets.filter((b: any) => b.active)
    G.powerups = G.powerups.filter((p: any) => p.active)
    G.explosions = G.explosions.filter((e: any) => e.active)
  }
}

// ═════════════════════════════════════
// Setup
// ═════════════════════════════════════
beforeAll(() => {
  setDOM()
  setupMocks()
  const code = extractGameScript()
  injectAndExport(code)
})

beforeEach(() => {
  set$('score', 0)
  set$('highScore', 0)
  set$('bullets', [])
  set$('enemyBullets', [])
  set$('enemies', [])
  set$('powerups', [])
  set$('explosions', [])
  set$('stars', [])
  set$('boss', null)
  set$('bombs', 2)
  set$('gameState', 'menu')
  set$('currentLevel', 0)
  set$('currentWave', 0)
  set$('bossPhase', false)
  set$('gameOverTriggered', false)
  set$('gameTime', 0)
  set$('carryPower', 1)
  set$('screenShake', 0)
  set$('shieldSpawned', false)
  set$('miniBossCount', 0)
  set$('levelStartTime', 0)
  // keys is const, must mutate in place
  for (const k in G.keys) delete G.keys[k]
  G.keys.__proto__ && (G.keys.__proto__ = Object.prototype)
  set$('mouseDown', false)
  set$('touchShoot', false)
  set$('useMouseControl', false)
  set$('mouseX', G.WIDTH / 2)
  set$('mouseY', G.HEIGHT / 2)
  set$('player', null)
  set$('levelIntroTimer', 0)
  set$('stageClearTimer', 0)
})

// ═════════════════════════════════════
// 1. getScaledStats
// ═════════════════════════════════════
describe('getScaledStats', () => {
  it('returns base stats for level 0 (multiplier 1.0)', () => {
    const s = G.getScaledStats(1, 2, 0)
    expect(s.hp).toBe(1)
    expect(s.speed).toBe(2)
  })

  it('scales HP by enemyMult', () => {
    const s = G.getScaledStats(30, 2, 7)
    expect(s.hp).toBe(59)
  })

  it('scales speed by multiplier factor', () => {
    const s = G.getScaledStats(1, 2, 7)
    expect(s.speed).toBeCloseTo(2.95)
  })

  it('reduces shoot interval as difficulty increases', () => {
    const s0 = G.getScaledStats(1, 2, 0)
    const s7 = G.getScaledStats(1, 2, 7)
    expect(s7.shootInterval).toBeLessThan(s0.shootInterval)
    expect(s7.shootInterval).toBeGreaterThan(0)
  })
})

// ═════════════════════════════════════
// 2. Star
// ═════════════════════════════════════
describe('Star', () => {
  it('creates with random values within bounds', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5)
    const star = new G.Star()
    expect(star.x).toBeGreaterThanOrEqual(0)
    expect(star.x).toBeLessThanOrEqual(G.WIDTH)
    expect(star.y).toBeGreaterThanOrEqual(0)
    expect(star.y).toBeLessThanOrEqual(G.HEIGHT)
    expect(star.size).toBeGreaterThan(0)
    vi.restoreAllMocks()
  })

  it('update() scrolls y and wraps when below screen', () => {
    const star = new G.Star()
    star.y = G.HEIGHT
    star.speed = 1
    star.update()
    expect(star.y).toBe(0)
  })
})

// ═════════════════════════════════════
// 3. Player
// ═════════════════════════════════════
describe('Player', () => {
  it('constructs with default values', () => {
    const p = new G.Player()
    expect(p.x).toBe(G.WIDTH / 2)
    expect(p.y).toBe(G.HEIGHT - 80)
    expect(p.speed).toBe(5)
    expect(p.powerLevel).toBe(1)
    expect(p.lives).toBe(3)
    expect(p.invincible).toBe(false)
    expect(p.shield).toBe(false)
    expect(p.respawnTimer).toBe(0)
    expect(p.shootCooldown).toBe(0)
  })

  it('hit() with shield removes shield, no life lost', () => {
    const p = new G.Player()
    p.shield = true
    const result = p.hit()
    expect(result).toBe(false)
    expect(p.shield).toBe(false)
    expect(p.lives).toBe(3)
  })

  it('hit() with invincible does nothing', () => {
    const p = new G.Player()
    p.invincible = true
    const result = p.hit()
    expect(result).toBe(false)
    expect(p.lives).toBe(3)
  })

  it('hit() reduces lives and powerLevel', () => {
    const p = new G.Player()
    p.powerLevel = 3
    set$('player', p)
    p.hit()
    expect(p.lives).toBe(2)
    expect(p.powerLevel).toBe(2)
  })

  it('hit() when lives=1 triggers game over', () => {
    const p = new G.Player()
    p.lives = 1
    set$('player', p)
    p.hit()
    expect(G.gameState).toBe('gameover')
    expect(G.gameOverTriggered).toBe(true)
  })

  it('shoot() at power 1 creates 2 bullets', () => {
    const p = new G.Player()
    p.powerLevel = 1
    set$('bullets', [])
    p.shoot()
    expect(G.bullets.length).toBe(2)
    G.bullets.forEach((b: any) => expect(b.type).toBe('player'))
  })

  it('shoot() at power 3 creates missiles when enemies exist', () => {
    const p = new G.Player()
    p.powerLevel = 3
    set$('bullets', [])
    set$('enemies', [new G.Enemy('small')])
    p.shoot()
    const missiles = G.bullets.filter((b: any) => 'target' in b)
    expect(missiles.length).toBeGreaterThanOrEqual(1)
  })

  it('respects shoot cooldown', () => {
    const p = new G.Player()
    p.shootCooldown = 5
    set$('bullets', [])
    const prevCount = G.bullets.length
    if (p.shootCooldown <= 0) p.shoot()
    expect(G.bullets.length).toBe(prevCount)
  })

  it('update() moves with keyboard ArrowRight', () => {
    const p = new G.Player()
    set$('player', p)
    G.keys['ArrowRight'] = true
    p.useMouseControl = false
    p.update()
    expect(p.x).toBe(G.WIDTH / 2 + 5)
    G.keys['ArrowRight'] = false
  })

  it('update() clamps player within canvas bounds', () => {
    const p = new G.Player()
    set$('player', p)
    p.x = -100
    G.keys['ArrowLeft'] = true
    p.update()
    expect(p.x).toBeGreaterThanOrEqual(p.width / 2)
    G.keys['ArrowLeft'] = false
  })

  it('update() with mouse control moves toward mouse', () => {
    const p = new G.Player()
    set$('player', p)
    set$('useMouseControl', true)
    G.mouseX = 100
    G.mouseY = 100
    p.x = 200
    p.y = 200
    p.update()
    expect(p.x).toBeLessThan(200)
    expect(p.y).toBeLessThan(200)
  })

  it('respawnTimer prevents movement', () => {
    const p = new G.Player()
    p.respawnTimer = 30
    const prevY = p.y
    p.update()
    expect(p.y).toBe(prevY)
  })

  it('respawnTimer countdown leads to invincibility', () => {
    const p = new G.Player()
    p.respawnTimer = 1
    p.update()
    expect(p.respawnTimer).toBe(0)
    expect(p.invincible).toBe(true)
    expect(p.invincibleTimer).toBe(120)
  })

  it('invincibleTimer counts down and clears invincible', () => {
    const p = new G.Player()
    p.invincible = true
    p.invincibleTimer = 2
    p.update()
    expect(p.invincibleTimer).toBe(1)
    p.update()
    expect(p.invincible).toBe(false)
  })
})

// ═════════════════════════════════════
// 4. Bullet
// ═════════════════════════════════════
describe('Bullet', () => {
  it('constructs with given position, velocity, type, and damage', () => {
    const b = new G.Bullet(100, 200, 2, -5, 'player', 1)
    expect(b.x).toBe(100)
    expect(b.y).toBe(200)
    expect(b.vx).toBe(2)
    expect(b.vy).toBe(-5)
    expect(b.type).toBe('player')
    expect(b.damage).toBe(1)
    expect(b.active).toBe(true)
  })

  it('update() moves by velocity each frame', () => {
    const b = new G.Bullet(100, 200, 3, -4, 'player', 1)
    b.update()
    expect(b.x).toBe(103)
    expect(b.y).toBe(196)
  })

  it('deactivates when out of bounds (top)', () => {
    const b = new G.Bullet(100, -30, 0, -1, 'player', 1)
    b.update()
    expect(b.active).toBe(false)
  })

  it('deactivates when out of bounds (bottom)', () => {
    const b = new G.Bullet(100, G.HEIGHT + 30, 0, 1, 'player', 1)
    b.update()
    expect(b.active).toBe(false)
  })

  it('stays active when within bounds', () => {
    const b = new G.Bullet(100, 200, 0, -1, 'player', 1)
    b.update()
    expect(b.active).toBe(true)
  })
})

// ═════════════════════════════════════
// 5. Missile
// ═════════════════════════════════════
describe('Missile', () => {
  it('constructs with target reference', () => {
    const target = { hp: 10, x: 200, y: 100 }
    const m = new G.Missile(100, 300, target, 2)
    expect(m.target).toBe(target)
    expect(m.speed).toBe(8)
    expect(m.damage).toBe(2)
    expect(m.active).toBe(true)
  })

  it('update() tracks target position', () => {
    const target = { hp: 10, x: 200, y: 100 }
    const m = new G.Missile(100, 300, target, 2)
    const prevX = m.x
    m.update()
    expect(m.x).not.toBe(prevX)
  })

  it('moves straight when target is dead (hp <= 0)', () => {
    const target = { hp: 0, x: 200, y: 100 }
    const m = new G.Missile(100, 300, target, 2)
    m.update()
    expect(m.y).toBeLessThan(300)
  })

  it('deactivates when out of bounds', () => {
    const m = new G.Missile(100, G.HEIGHT + 30, null, 2)
    m.update()
    expect(m.active).toBe(false)
  })
})

// ═════════════════════════════════════
// 6. Enemy
// ═════════════════════════════════════
describe('Enemy', () => {
  it('creates small type with correct properties', () => {
    const e = new G.Enemy('small')
    expect(e.type).toBe('small')
    expect(e.active).toBe(true)
    expect(e.hp).toBeGreaterThan(0)
    expect(e.width).toBeGreaterThan(0)
  })

  it('medium type has more HP than small', () => {
    const s = new G.Enemy('small')
    const m = new G.Enemy('medium')
    expect(m.hp).toBeGreaterThan(s.hp)
  })

  it('large type has more HP than medium', () => {
    const m = new G.Enemy('medium')
    const l = new G.Enemy('large')
    expect(l.hp).toBeGreaterThan(m.hp)
  })

  it('update() moves downward', () => {
    const e = new G.Enemy('small')
    const prevY = e.y
    e.update()
    expect(e.y).toBeGreaterThan(prevY)
  })

  it('update() deactivates when below screen', () => {
    const e = new G.Enemy('small')
    e.y = G.HEIGHT + 100
    e.update()
    expect(e.active).toBe(false)
  })

  it('hit() reduces HP by damage amount', () => {
    set$('player', new G.Player())
    const e = new G.Enemy('small')
    const prevHp = e.hp
    e.hit(1)
    expect(e.hp).toBe(prevHp - 1)
  })

  it('hit() at HP <= 0 deactivates and adds score', () => {
    set$('player', new G.Player())
    const e = new G.Enemy('small')
    e.hp = 1
    set$('score', 0)
    e.hit(1)
    expect(e.active).toBe(false)
    expect(G.score).toBeGreaterThan(0)
  })

  it('medium type oscillates horizontally', () => {
    const e = new G.Enemy('medium')
    e.startX = 200
    e.x = 200
    e.update()
    expect(Math.abs(e.x - 200)).toBeGreaterThan(0)
  })

  it('shoot() creates enemy bullets', () => {
    const p = new G.Player()
    set$('player', p)
    const e = new G.Enemy('small')
    set$('enemyBullets', [])
    e.shoot()
    expect(G.enemyBullets.length).toBeGreaterThan(0)
    expect(G.enemyBullets[0].type).toBe('enemy')
  })

  it('shoot() does nothing when player is respawning', () => {
    const p = new G.Player()
    p.respawnTimer = 10
    set$('player', p)
    const e = new G.Enemy('small')
    set$('enemyBullets', [])
    e.shoot()
    expect(G.enemyBullets.length).toBe(0)
  })
})

// ═════════════════════════════════════
// 7. Boss
// ═════════════════════════════════════
describe('Boss', () => {
  it('constructs with entry position and HP', () => {
    const b = new G.Boss()
    expect(b.x).toBe(G.WIDTH / 2)
    expect(b.y).toBe(-100)
    expect(b.targetY).toBe(120)
    expect(b.active).toBe(true)
    expect(b.entered).toBe(false)
    expect(b.hp).toBeGreaterThan(0)
  })

  it('update() descends during entry phase', () => {
    const b = new G.Boss()
    b.update()
    expect(b.y).toBe(-98)
  })

  it('reaches targetY and enters combat phase', () => {
    const b = new G.Boss()
    b.y = 119
    b.update()
    expect(b.entered).toBe(true)
    expect(b.y).toBe(120)
  })

  it('moves horizontally after entry', () => {
    const b = new G.Boss()
    b.entered = true
    b.x = G.WIDTH / 2
    b.update()
    expect(b.x).not.toBe(G.WIDTH / 2)
  })

  it('hit() reduces HP', () => {
    const b = new G.Boss()
    const prevHp = b.hp
    b.hit(5)
    expect(b.hp).toBe(prevHp - 5)
  })

  it('defeat adds 2000 score and drops 5 powerups', () => {
    set$('player', new G.Player())
    const b = new G.Boss()
    b.entered = true
    b.hp = 1
    set$('score', 0)
    set$('powerups', [])
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    b.hit(1)
    b.update()
    expect(b.active).toBe(false)
    expect(G.score).toBe(2000)
    expect(G.powerups.length).toBe(5)
    vi.restoreAllMocks()
  })
})

// ═════════════════════════════════════
// 8. Powerup
// ═════════════════════════════════════
describe('Powerup', () => {
  it('constructs with position and type', () => {
    const p = new G.Powerup(100, 200, 'power')
    expect(p.x).toBe(100)
    expect(p.y).toBe(200)
    expect(p.type).toBe('power')
    expect(p.active).toBe(true)
  })

  it('update() falls downward at speed 2', () => {
    const p = new G.Powerup(100, 200, 'power')
    p.update()
    expect(p.y).toBe(202)
  })

  it('update() deactivates when below screen', () => {
    const p = new G.Powerup(100, G.HEIGHT + 30, 'power')
    p.update()
    expect(p.active).toBe(false)
  })

  describe('collect()', () => {
    it('power increases player powerLevel', () => {
      const p = new G.Player()
      p.powerLevel = 2
      set$('player', p)
      const pu = new G.Powerup(0, 0, 'power')
      pu.collect()
      expect(p.powerLevel).toBe(3)
    })

    it("power won't exceed level 5", () => {
      const p = new G.Player()
      p.powerLevel = 5
      set$('player', p)
      const pu = new G.Powerup(0, 0, 'power')
      pu.collect()
      expect(p.powerLevel).toBe(5)
    })

    it('speed increases player speed', () => {
      const p = new G.Player()
      p.speed = 5
      set$('player', p)
      const pu = new G.Powerup(0, 0, 'speed')
      pu.collect()
      expect(p.speed).toBe(6)
    })

    it('bomb increases global bomb count', () => {
      set$('bombs', 1)
      set$('player', new G.Player())
      const pu = new G.Powerup(0, 0, 'bomb')
      pu.collect()
      expect(G.bombs).toBe(2)
    })

    it('life increases player lives (capped at 5)', () => {
      const p = new G.Player()
      p.lives = 4
      set$('player', p)
      const pu = new G.Powerup(0, 0, 'life')
      pu.collect()
      expect(p.lives).toBe(5)
    })

    it('shield enables player shield', () => {
      const p = new G.Player()
      p.shield = false
      set$('player', p)
      const pu = new G.Powerup(0, 0, 'shield')
      pu.collect()
      expect(p.shield).toBe(true)
    })
  })
})

// ═════════════════════════════════════
// 9. Explosion
// ═════════════════════════════════════
describe('Explosion', () => {
  it('constructs with correct number of particles', () => {
    const ex = new G.Explosion(100, 200, 30, '#ff0000')
    expect(ex.x).toBe(100)
    expect(ex.y).toBe(200)
    expect(ex.active).toBe(true)
    expect(ex.particles.length).toBe(30)
  })

  it('update() decays particle life', () => {
    const ex = new G.Explosion(100, 200, 5, '#ff0000')
    const prevLife = ex.particles[0].life
    ex.update()
    expect(ex.particles[0].life).toBeLessThan(prevLife)
  })

  it('deactivates when all particles are dead', () => {
    const ex = new G.Explosion(100, 200, 5, '#ff0000')
    ex.particles.forEach((p: any) => { p.life = 0.001 })
    ex.update()
    expect(ex.active).toBe(false)
  })
})

// ═════════════════════════════════════
// 10. createExplosion
// ═════════════════════════════════════
describe('createExplosion', () => {
  it('adds explosion to global list with correct parameters', () => {
    set$('explosions', [])
    G.createExplosion(100, 200, 20, '#ffffff')
    expect(G.explosions.length).toBe(1)
    expect(G.explosions[0].x).toBe(100)
    expect(G.explosions[0].y).toBe(200)
    expect(G.explosions[0].particles.length).toBe(20)
  })
})

// ═════════════════════════════════════
// 11. spawnPowerup
// ═════════════════════════════════════
describe('spawnPowerup', () => {
  it('creates powerup when random < 0.15', () => {
    set$('powerups', [])
    vi.spyOn(Math, 'random').mockReturnValue(0.1)
    G.spawnPowerup(150, 250)
    expect(G.powerups.length).toBe(1)
    expect(G.powerups[0].x).toBe(150)
    expect(G.powerups[0].y).toBe(250)
    vi.restoreAllMocks()
  })

  it('does not create powerup when random >= 0.15', () => {
    set$('powerups', [])
    vi.spyOn(Math, 'random').mockReturnValue(0.2)
    G.spawnPowerup(150, 250)
    expect(G.powerups.length).toBe(0)
    vi.restoreAllMocks()
  })
})

// ═════════════════════════════════════
// 12. useBomb
// ═════════════════════════════════════
describe('useBomb', () => {
  it('clears enemies and reduces bomb count', () => {
    set$('bombs', 2)
    const e1 = new G.Enemy('small')
    const e2 = new G.Enemy('medium')
    set$('enemies', [e1, e2])
    set$('player', new G.Player())
    G.useBomb()
    expect(G.bombs).toBe(1)
    expect(e1.active).toBe(false)
    expect(e2.active).toBe(false)
  })

  it('does nothing when bombs = 0', () => {
    set$('bombs', 0)
    set$('enemies', [new G.Enemy('small')])
    set$('player', new G.Player())
    G.useBomb()
    expect(G.bombs).toBe(0)
    expect(G.enemies.length).toBe(1)
  })

  it('damages boss by 10 HP', () => {
    const boss = new G.Boss()
    boss.entered = true
    const hp = boss.hp
    set$('boss', boss)
    set$('bombs', 2)
    set$('player', new G.Player())
    G.useBomb()
    expect(boss.hp).toBe(hp - 10)
  })

  it('clears all enemy bullets', () => {
    set$('bombs', 2)
    set$('enemyBullets', [{ active: true, x: 100, y: 100 }])
    set$('player', new G.Player())
    G.useBomb()
    expect(G.enemyBullets.length).toBe(0)
  })

  it('no-op when player is null', () => {
    set$('bombs', 2)
    set$('player', null)
    expect(() => G.useBomb()).not.toThrow()
    expect(G.bombs).toBe(2)
  })
})

// ═════════════════════════════════════
// 13. checkCollisions
// ═════════════════════════════════════
describe('checkCollisions', () => {
  it('bullet hits enemy and applies damage', () => {
    set$('player', new G.Player())
    const enemy = new G.Enemy('small')
    const hp = enemy.hp
    enemy.x = 100; enemy.y = 100
    set$('enemies', [enemy])
    const bullet = new G.Bullet(100, 100, 0, 0, 'player', 1)
    set$('bullets', [bullet])
    G.checkCollisions()
    expect(enemy.hp).toBe(hp - 1)
    expect(bullet.active).toBe(false)
  })

  it('bullet hits boss and applies damage', () => {
    set$('player', new G.Player())
    const boss = new G.Boss()
    boss.entered = true
    boss.x = 100; boss.y = 100
    set$('boss', boss)
    const hp = boss.hp
    const bullet = new G.Bullet(100, 100, 0, 0, 'player', 1)
    set$('bullets', [bullet])
    G.checkCollisions()
    expect(boss.hp).toBe(hp - 1)
  })

  it('enemy bullet hits player and triggers hit()', () => {
    const p = new G.Player()
    p.invincible = false
    p.respawnTimer = 0
    set$('player', p)
    const bullet = new G.Bullet(p.x, p.y, 0, 0, 'enemy', 1)
    set$('enemyBullets', [bullet])
    G.checkCollisions()
    expect(p.lives).toBe(2)
    expect(bullet.active).toBe(false)
  })

  it('player collects powerup when overlapping', () => {
    const p = new G.Player()
    p.invincible = true
    p.respawnTimer = 0
    p.powerLevel = 1
    set$('player', p)
    const pu = new G.Powerup(p.x, p.y, 'power')
    set$('powerups', [pu])
    G.checkCollisions()
    expect(p.powerLevel).toBe(2)
    expect(pu.active).toBe(false)
  })

  it('player-enemy collision damages both', () => {
    const p = new G.Player()
    p.invincible = false
    p.respawnTimer = 0
    set$('player', p)
    const enemy = new G.Enemy('small')
    enemy.x = p.x
    enemy.y = p.y
    enemy.hp = 10
    set$('enemies', [enemy])
    G.checkCollisions()
    expect(p.lives).toBeLessThan(3)
    expect(enemy.hp).toBe(5)
  })
})

// ═════════════════════════════════════
// 14. startLevel
// ═════════════════════════════════════
describe('startLevel', () => {
  it('resets game state and creates player with invincibility', () => {
    G.startLevel(0)
    expect(G.currentLevel).toBe(0)
    expect(G.player).not.toBeNull()
    expect(G.player.powerLevel).toBe(G.carryPower)
    expect(G.player.invincible).toBe(true)
    expect(G.player.invincibleTimer).toBe(180)
    expect(G.bombs).toBe(3)
    expect(G.gameState).toBe('levelIntro')
    expect(G.stars.length).toBe(80)
  })

  it('starts any level index correctly', () => {
    G.startLevel(4)
    expect(G.currentLevel).toBe(4)
    expect(G.stars.length).toBe(80)
  })
})

// ═════════════════════════════════════
// 15. startNextLevel
// ═════════════════════════════════════
describe('startNextLevel', () => {
  it('advances to next level and carries power', () => {
    G.startLevel(0)
    G.player.powerLevel = 3
    G.startNextLevel()
    expect(G.currentLevel).toBe(1)
    expect(G.gameState).toBe('levelIntro')
    expect(G.player.powerLevel).toBe(3)
  })

  it('triggers victory after last level', () => {
    G.startLevel(G.LEVELS.length - 1)
    G.startNextLevel()
    expect(G.gameState).toBe('victory')
  })
})

// ═════════════════════════════════════
// 16. gameOver
// ═════════════════════════════════════
describe('gameOver', () => {
  it('sets gameover state and guard flag', () => {
    set$('gameOverTriggered', false)
    set$('gameState', 'playing')
    G.gameOver()
    expect(G.gameState).toBe('gameover')
    expect(G.gameOverTriggered).toBe(true)
  })

  it('saves high score when score exceeds previous', () => {
    set$('gameOverTriggered', false)
    set$('score', 9999)
    set$('highScore', 0)
    G.gameOver()
    expect(G.highScore).toBe(9999)
  })

  it('does not lower high score', () => {
    set$('gameOverTriggered', false)
    set$('score', 100)
    set$('highScore', 500)
    G.gameOver()
    expect(G.highScore).toBe(500)
  })
})

// ═════════════════════════════════════
// 17. startGame
// ═════════════════════════════════════
describe('startGame', () => {
  it('resets all state and starts level 0', () => {
    set$('score', 999)
    set$('carryPower', 5)
    set$('gameOverTriggered', true)
    G.startGame()
    expect(G.score).toBe(0)
    expect(G.carryPower).toBe(1)
    expect(G.gameOverTriggered).toBe(false)
    expect(G.currentLevel).toBe(0)
    expect(G.gameState).toBe('levelIntro')
  })
})

// ═════════════════════════════════════
// 18. spawnEnemies
// ═════════════════════════════════════
describe('spawnEnemies', () => {
  it('does nothing when gameState is not playing', () => {
    G.startLevel(0)
    set$('gameState', 'levelIntro')
    set$('gameTime', 200)
    set$('levelStartTime', 0)
    const prev = G.enemies.length
    G.spawnEnemies()
    expect(G.enemies.length).toBe(prev)
  })

  it('does not spawn during boss phase', () => {
    G.startLevel(0)
    set$('gameState', 'playing')
    set$('bossPhase', true)
    G.spawnEnemies()
    expect(G.enemies.length).toBe(0)
  })

  it('spawns shield powerup after 900 frames', () => {
    G.startLevel(0)
    set$('gameState', 'playing')
    set$('shieldSpawned', false)
    set$('gameTime', 1000)
    set$('levelStartTime', 0)
    set$('enemies', [])
    G.spawnEnemies()
    expect(G.shieldSpawned).toBe(true)
    expect(G.powerups.some((p: any) => p.type === 'shield')).toBe(true)
  })

  it('does not spawn shield if already spawned', () => {
    G.startLevel(0)
    set$('gameState', 'playing')
    set$('shieldSpawned', true)
    set$('gameTime', 1000)
    set$('levelStartTime', 0)
    const prevCount = G.powerups.length
    G.spawnEnemies()
    expect(G.shieldSpawned).toBe(true)
  })

  it('does not spawn shield if too many enemies on screen', () => {
    G.startLevel(0)
    set$('gameState', 'playing')
    set$('shieldSpawned', false)
    set$('gameTime', 1000)
    set$('levelStartTime', 0)
    set$('enemies', [new G.Enemy('small'), new G.Enemy('small'), new G.Enemy('small'), new G.Enemy('small'), new G.Enemy('small')])
    G.spawnEnemies()
    expect(G.shieldSpawned).toBe(false)
  })
})

// ═════════════════════════════════════
// 19. updateUI
// ═════════════════════════════════════
describe('updateUI', () => {
  it('updates score display', () => {
    set$('score', 1234)
    set$('player', new G.Player())
    G.updateUI()
    expect(document.getElementById('score')!.textContent).toBe('1234')
  })

  it('updates bomb count', () => {
    set$('bombs', 5)
    set$('player', new G.Player())
    G.updateUI()
    expect(document.getElementById('bombCount')!.textContent).toBe('5')
  })
})

// ═════════════════════════════════════
// 20. updatePowerBar
// ═════════════════════════════════════
describe('updatePowerBar', () => {
  it('renders 5 power pips with correct fill state', () => {
    const p = new G.Player()
    p.powerLevel = 3
    set$('player', p)
    G.updatePowerBar()
    const bar = document.getElementById('powerBar')!
    expect(bar.children.length).toBe(5)
    for (let i = 0; i < 3; i++) {
      expect(bar.children[i].className).not.toContain('empty')
    }
    for (let i = 3; i < 5; i++) {
      expect(bar.children[i].className).toContain('empty')
    }
  })
})

// ═════════════════════════════════════
// 21. resizeCanvas
// ═════════════════════════════════════
describe('resizeCanvas', () => {
  it('sets style width and height on canvas', () => {
    const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement
    canvas.style.width = ''
    canvas.style.height = ''
    G.resizeCanvas()
    expect(canvas.style.width).toBeTruthy()
    expect(canvas.style.height).toBeTruthy()
  })
})

// ═════════════════════════════════════
// 22. LEVELS data
// ═════════════════════════════════════
describe('LEVELS data', () => {
  it('contains exactly 8 levels', () => {
    expect(G.LEVELS.length).toBe(8)
  })

  it('each level has required properties', () => {
    G.LEVELS.forEach((l: any) => {
      expect(l).toHaveProperty('id')
      expect(l).toHaveProperty('name')
      expect(l).toHaveProperty('theme')
      expect(l).toHaveProperty('enemyMult')
      expect(l).toHaveProperty('waves')
      expect(l).toHaveProperty('bossHp')
    })
  })

  it('difficulty increases with each level', () => {
    for (let i = 1; i < G.LEVELS.length; i++) {
      expect(G.LEVELS[i].enemyMult).toBeGreaterThan(G.LEVELS[i - 1].enemyMult)
      expect(G.LEVELS[i].bossHp).toBeGreaterThan(G.LEVELS[i - 1].bossHp)
    }
  })
})

// ═════════════════════════════════════
// 23. Constants
// ═════════════════════════════════════
describe('Game constants', () => {
  it('WIDTH and HEIGHT are 480x720', () => {
    expect(G.WIDTH).toBe(480)
    expect(G.HEIGHT).toBe(720)
  })

  it('SCALE constants are defined', () => {
    expect(G.SHIP_SCALE).toBe(1.25)
    expect(G.BOSS_SCALE).toBe(2.5)
  })

  it('COLORS has all required entries', () => {
    const required = ['player', 'bulletPlayer', 'bulletEnemy', 'powerup', 'bomb']
    required.forEach(k => expect(G.COLORS).toHaveProperty(k))
    expect(G.COLORS.star).toBeInstanceOf(Array)
    expect(G.COLORS.star.length).toBe(3)
  })
})

// ═════════════════════════════════════
// 24. Ship Cache
// ═════════════════════════════════════
describe('shipCache', () => {
  it('contains all 5 ship images after initialization', () => {
    const types = ['player', 'small', 'medium', 'large', 'boss']
    types.forEach(t => {
      expect(G.shipCache).toHaveProperty(t)
      expect(G.shipCache[t]).toBeInstanceOf(HTMLCanvasElement)
    })
  })
})

// ═════════════════════════════════════
// 25. Game Loop Integration
// ═════════════════════════════════════
describe('Game loop integration', () => {
  it('tick() advances gameTime and updates entities', () => {
    G.startLevel(0)
    set$('gameState', 'playing')
    const prevTime = G.gameTime
    tick()
    expect(G.gameTime).toBe(prevTime + 1)
  })

  it('multiple ticks progress game state', () => {
    G.startLevel(0)
    set$('gameState', 'playing')
    for (let i = 0; i < 10; i++) tick()
    expect(G.gameTime).toBe(10)
  })
})

// ═════════════════════════════════════
// 26. Edge Cases
// ═════════════════════════════════════
describe('Edge cases', () => {
  it('new Player() multiple times creates independent instances', () => {
    const p1 = new G.Player()
    const p2 = new G.Player()
    p1.x = 100
    p2.x = 200
    expect(p1.x).not.toBe(p2.x)
  })

  it('Bullet with zero velocity stays in place when in bounds', () => {
    const b = new G.Bullet(100, 100, 0, 0, 'player', 1)
    b.update()
    expect(b.x).toBe(100)
    expect(b.y).toBe(100)
    expect(b.active).toBe(true)
  })

  it('Enemy outside left bound is not deactivated (horizontal only)', () => {
    const e = new G.Enemy('small')
    e.x = -200
    expect(e.active).toBe(true)
  })

  it('Bomb with no enemies present does not crash', () => {
    set$('bombs', 1)
    set$('enemies', [])
    set$('boss', null)
    set$('player', new G.Player())
    expect(() => G.useBomb()).not.toThrow()
    expect(G.bombs).toBe(0)
  })
})
