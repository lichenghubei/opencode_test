# Thunder Strike ⚡ — 星球大战

**Thunder Strike** is a single-file HTML5 Canvas 2D space shooter (bullet hell / vertical scrolling shooter) with 8 themed levels, progressive difficulty, boss battles, particle explosions, dynamic scrolling backgrounds, synthesized sound effects, and background music. Zero runtime dependencies — open it in a browser and play.

---

## Features

- **8 Themed Levels** — Nebula, Cloud, Ocean, Canyon, Volcano, Ruins, Ice, Void — each with unique procedural background rendering.
- **3 Enemy Types** — Small / Medium / Large with per-level stat scaling, movement patterns, and shooting behavior.
- **Epic Boss Fights** — End-of-level bosses with entry animation, 360° attack patterns, and reward drops.
- **5-Tier Weapon System** — Upgrade your ship's power level (1–5) with faster fire rate, wider spread, and homing missiles.
- **Powerups** — Collect Power, Speed, Bomb, Life, and Shield drops from defeated enemies.
- **Screen-Clearing Bomb** — Devastating area-of-effect attack that wipes all enemies and bullets.
- **Particle Explosions** — Procedural particle system with variable count, size, and decay per entity.
- **Synthesized SFX** — 8 sound effects generated via Web Audio API (no audio files needed).
- **Background Music** — Level-specific BGM via HTMLAudioElement, auto-fallback `.mp3` → `.ogg`.
- **Multi-Input Controls** — Keyboard (Arrow/WASD + Space + B), Mouse (track + click), Touch (drag + tap + bomb button).
- **PWA Ready** — Web manifest with fullscreen portrait mode, installable on mobile devices.
- **Comprehensive Test Suite** — 26 test suites covering game logic, collision, state machine, edge cases with Vitest + jsdom.

---

## Quick Start

### Play Directly

Open `thunder-strike.html` in any modern web browser. No build step, no server, no installation needed.

```bash
# Just open the file
start thunder-strike.html
```

### Run Tests

```bash
# Install dev dependencies (once)
npm install

# Run tests
npm test

# Watch mode
npm run test:watch
```

---

## Usage

### Controls

| Action       | Keyboard          | Mouse       | Touch         |
|-------------|-------------------|-------------|---------------|
| Move        | Arrow Keys / WASD | Mouse move  | Drag          |
| Shoot       | Space             | Left click  | Tap           |
| Bomb        | B                 | —           | Bomb button   |

### Game Flow

```
Menu → Level Intro → Playing → Boss → Stage Clear → (next level or victory)
                                       ↓ (death)
                                    Game Over → Menu
```

- Survive all **8 levels** to win.
- Collect **powerups** to strengthen your ship.
- Use **bombs** (limited) to survive tough situations.
- Each boss requires more hits and smarter play.

---

## Configuration

All game constants are at the top of the `<script>` block in `thunder-strike.html`:

| Constant           | Default | Description                          |
|--------------------|---------|--------------------------------------|
| `WIDTH` / `HEIGHT` | 480/720 | Canvas logical dimensions            |
| `PLAYER_SPEED`     | 5       | Player movement speed (px/frame)     |
| `MAX_POWER`        | 5       | Maximum weapon power level           |
| `MAX_BOMBS`        | 3       | Maximum bombs carried                |
| `INITIAL_LIVES`    | 3       | Starting lives                       |
| `INVINCIBLE_TIME`  | 90      | Invincibility frames after respawn   |
| `POWERUP_DROP_RATE`| 0.25    | Probability of powerup on enemy kill |

Level difficulty is defined in the `LEVELS` array:

```js
{ name: '星云深处', theme: 'space',     diffMult: 1.00, bossHP: 30 }
{ name: '云端之上', theme: 'cloud',     diffMult: 1.10, bossHP: 35 }
{ name: '怒海争锋', theme: 'ocean',     diffMult: 1.21, bossHP: 40 }
// ... up to level 8
```

Background themes are implemented as procedural Canvas 2D renderers in the `backgroundRenderer` object.

---

## Project Structure

```
thunder-strike/
├── thunder-strike.html        # Complete game (2588 lines, single file)
├── thunder-strike.test.ts     # Test suite (1227 lines, 26 suites)
├── thunder-strike.webmanifest # PWA manifest
├── vitest.config.ts           # Vitest configuration
├── package.json               # NPM metadata (ISC license)
├── bgm/                       # Background music (ogg files)
│   └── README.md              # BGM download guide
└── docs/                      # Design docs and implementation plans
    ├── SUMMARY.md
    ├── design-thunder-strike-enhanced.md
    └── thunder-strike-enhanced-plan.md
```

---

## Contributing

Contributions are welcome! Here's how to get started:

1. **Fork** the repository.
2. **Create a feature branch**: `git checkout -b feat/your-feature`
3. **Make changes** — the entire game is in `thunder-strike.html`.
4. **Run tests**: `npm test` — ensure all tests pass.
5. **Submit a pull request**.

Please follow the existing code style (ES6 classes, camelCase variables, inline documentation for non-obvious logic).

---

## License

ISC License — see [package.json](./package.json). A permissive open-source license equivalent to MIT. You are free to use, modify, and distribute this project.
