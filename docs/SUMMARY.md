# Thunder Strike 太空射击游戏 — 开发总结

## 一、项目概述

Thunder Strike 是一款纯前端 Canvas 2D 太空射击游戏，**单 HTML 文件**，零外部依赖（除 BGM 音频文件外）。通过 8 个主题关卡、渐进难度、动态背景和 BGM 系统，提供完整的街机射击体验。

### 技术栈
- **渲染**: HTML5 Canvas 2D
- **音频**: Web Audio API (SFX) + HTMLAudioElement (BGM)
- **语言**: 纯 JavaScript (ES6+)，无框架
- **文件结构**: 单文件 `thunder-strike.html` (~2500 行)

---

## 二、核心架构 — 状态机

游戏核心是一个**有限状态机**，每一帧通过 `gameState` 变量决定渲染和逻辑分支：

```
menu → levelIntro → playing → boss → stageClear → (next level 或 victory) → menu
                                        ↓ (死亡)
                                     gameOver → menu
```

每个状态在 `gameLoop()` 中有独立处理分支，确保了逻辑解耦和可维护性。

### 状态定义
| 状态 | 触发条件 | 行为 |
|------|---------|------|
| `menu` | 页面加载 / 游戏结束 | 显示标题菜单 |
| `levelIntro` | 进入新关卡 | 渐入动画 + 背景渲染 |
| `playing` | 关卡开始 | 刷敌、碰撞、移动、射击 |
| `boss` | 2分钟到 | 播放 BOSS 音乐，BOSS 行为 |
| `stageClear` | BOSS 被击败 | 分数叠加动画 → 下一关 |
| `gameover` | 生命归零 | 显示分数 + 重新开始 |
| `victory` | 第8关通关 | 胜利画面 + 点击菜单 |

---

## 三、八大模块

### 1. 关卡管理器 (Level Manager)
- **8 个关卡配置** (`LEVELS` 数组)
- 每关独立 `enemyMult` 系数（1.00 → 1.95，每级 +10%）
- 时间驱动（非波次驱动）：2 分钟定长关卡
- 每关只产出 1 个护盾，过关保留武器等级

### 2. 玩家系统 (Player)
- `Player` 类：坐标、速度、生命、武器等级(1-5)
- 无限射击（空格/鼠标长按）
- 5 级武器系统，子弹数量 + 散布 + 追踪导弹递增
- 护盾 (`shield` 布尔)：吸收一次伤害
- 重生机制：被击毁后 1 秒延迟，满位置重生，3 秒无敌

### 3. 敌人系统 (Enemy)
- 3 种基础类型：`small` / `medium` / `large`，体型 + HP + 攻击方式递增
- `getScaledStats()` 按关卡系数缩放 HP、移速
- 所有敌人属性通过该函数计算，保证难度曲线平滑

### 4. 子弹与伤害系统 (Bullet / Missile)
- `Bullet` 类带 `damage` 属性（1-3，按武器等级决定）
- `Missile` 追踪导弹，伤害更高（2-4）
- 碰撞检测采用 **AABB（轴对齐包围盒）**：`bullet.xy` ∈ `entity.rect`

### 5. BOSS 系统 (Boss)
- 每关一个 BOSS，120 秒时生成
- HP = `bossHp * enemyMult`（可缩放到 150+）
- 子弹散射 + 360° 特殊攻击
- 击败后爆炸+屏幕震动+5 个道具奖励

### 6. 视觉效果
- **背景渲染器** (`backgroundRenderer`)：8 种 Canvas 2D 主题（星云、云海、怒海、峡谷、熔岩、废墟、冰原、黑洞）
- **爆炸系统** (`Explosion`)：粒子系统，粒子数 1-60，大小/速度/衰减按规模自适应
- **武器视觉**：按等级叠加效果（Lv3 翼尖光晕，Lv4 双喷焰，Lv5 能量光环）
- **屏幕震动** (`screenShake`)：受击/爆炸时用 `ctx.translate()` 实现随机偏移
- **护盾泡泡**：半透明蓝色圆形描边

### 7. 音频系统
- **BGM** (`AudioManager`)：按关卡加载 `lX_normal/bgm/victory`，自动 `.mp3` → `.ogg` 回退
- **SFX** (`sfx` 对象)：Web Audio API 实时合成，8 种音效（shoot1/shoot2/missile/hit/explode/shield/collect），无外部文件

### 8. Boss 与关卡过渡
- **0-120s**: 持续刷普通敌人
- **~15s**: 产出护盾
- **40s / 80s**: 各出 1 个迷你 BOSS（强化版 Large）
- **120s**: 大 BOSS 登场
- BOSS 击败 → `stageClear` 状态 → 180帧过渡动画 → `startNextLevel()`

---

## 四、关键设计原则

### 4.1 单文件哲学
- 所有代码在单一 HTML 中，方便部署和分发
- 使用 IIFE 和对象字面量模拟模块化（如 `backgroundRenderer`、`audioManager`）
- 全局变量管理状态，避免模块间通信复杂化

### 4.2 状态驱动
- `gameState` 是唯一真相来源
- 每一帧先检查状态，再分发逻辑
- 状态转换只在明确触发点发生（BOSS 死亡、计时器到期、玩家阵亡）

### 4.3 数据驱动
- `LEVELS` 数组集中管理所有关卡参数
- `getScaledStats()` 集中管理难度曲线
- `COLORS` 对象集中管理配色
- `SHIP_SCALE` / `BOSS_SCALE` 常量集中控制所有实体大小

### 4.4 粒子系统
- `Explosion` 类：生成 → 更新（速度 + 衰减）→ 绘制（透明度 + 阴影）
- 参数根据 `size` 自适应：大爆炸 = 更多粒子 + 更大 + 更快 + 更持久
- 生命周期由 `decay` 控制，统一在 `explosions[]` 中管理和清理

### 4.5 碰撞检测
- AABB 矩形碰撞（轴上对齐）
- 玩家无敌帧（`invincibleTimer`）和重生计时（`respawnTimer`）跳过碰撞
- 子弹-敌人碰撞使用 `bullet.damage`，支持等级伤害

---

## 五、可复用模式

以下模式可直接复制到下一款游戏中：

| 模式 | 实现代码位置 | 说明 |
|------|-------------|------|
| 状态机 | `gameLoop()` + `gameState` | 游戏主循环分发 |
| 实体池 | `bullets[]` + `enemies[]` + `filter(active)` | 用数组+活性标记管理实体 |
| 粒子系统 | `Explosion` class | 通用视觉反馈 |
| 音效合成 | `sfx` 对象 | 无文件依赖的即时音效 |
| 难度曲线 | `getScaledStats()` | 数据驱动缩放 |
| Canvas 缩放 | `SHIP_SCALE` + `ctx.scale()` | 统一实体大小控制 |
| 屏幕震动 | `screenShake` + `ctx.translate()` | 简单有力的反馈机制 |

---

## 六、迭代过程

1. **基础射击** → Player 移动 + 射击 + 简单敌人
2. **关卡系统** → 8 关配置 + 状态机
3. **BGM + SFX** → AudioManager + Web Audio SFX
4. **视觉升级** → 背景渲染器 + 粒子爆炸 + 屏幕震动
5. **平衡性** → HP 缩放 + 伤害等级 + BOSS 设计
6. **Polish** → 重生动画、护盾、迷你 BOSS、武器外观

---

## 七、文件清单

```
thunder-strike/
├── thunder-strike.html      # 主游戏文件（~2600行）
├── thunder-strike.webmanifest  # PWA 配置（可选）
├── bgm/
│   ├── l1_normal.ogg       # L1 背景音乐
│   ├── l3_boss.ogg         # L3 BOSS 音乐
│   ├── l4_normal.ogg       # L4 背景音乐
│   ├── l5_normal.ogg       # L5 背景音乐
│   ├── l8_normal.ogg       # L8 背景音乐
│   ├── victory.ogg         # 胜利音乐
│   └── README.md           # 音乐下载指南（含缺失文件列表）
├── docs/
│   ├── design-thunder-strike-enhanced.md  # 原始设计文档
│   ├── thunder-strike-enhanced-plan.md    # 实现计划
│   └── SUMMARY.md          # 本文档
└── openspec/               # AI 辅助规范
```

缺失的 BGM 文件（11个）可从 `bgm/README.md` 列出的免费音乐网站下载，放入 `bgm/` 目录后即可生效。
