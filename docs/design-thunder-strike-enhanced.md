# Thunder Strike 8关增强版 — 设计文档

## 概述
- **项目**: `thunder-strike.html` 单文件竖版太空射击游戏
- **改动范围**: 保持单文件结构，增加关卡系统、BGM、动态背景、过场动画
- **外部资源**: 用户提供 16 首 MP3 (每关普通 + Boss 各一) + 部分关卡图片素材

## 1. 架构模块

| 模块 | 职责 |
|------|------|
| LevelManager | 关卡配置、流程控制、难度缩放 |
| BackgroundRenderer | 8 种视差滚动背景（程序化/图片混合） |
| AudioManager | BGM 切换、Boss 音乐、胜利音效、音量控制 |
| EnemyScaler | 按 level.enemyMul 缩放敌机属性 |
| TransitionUI | 关卡过场、Stage Clear、通关画面 |
| Game (现有扩展) | 适配关卡系统、Boss 阶段检测 |

## 2. 关卡配置

8 关，`enemyMul = 1.1^(level-1)` 逐关叠乘 10%。

| # | 名称 | 主题 | 波数 | Boss HP | enemyMul |
|---|------|------|------|---------|----------|
| 1 | 星云深处 | space | 3 | 30 | 1.00 |
| 2 | 云端之上 | cloud | 3 | 35 | 1.10 |
| 3 | 怒海争锋 | ocean | 4 | 40 | 1.21 |
| 4 | 峡谷穿梭 | canyon | 4 | 46 | 1.33 |
| 5 | 熔岩炼狱 | volcano | 5 | 53 | 1.46 |
| 6 | 钢铁废墟 | ruins | 5 | 61 | 1.61 |
| 7 | 冰封极地 | ice | 6 | 70 | 1.77 |
| 8 | 深渊黑洞 | void | 6 | 80 | 1.95 |

## 3. 关卡流程

```
LevelManager.init(levelIndex)
  → TransitionUI.showLevelIntro("LEVEL 1", "星云深处")
     → 渐入 2s + 保持 2s + 渐出 1s
  → AudioManager.playBGM(levelIndex, phase="normal")
  → 波次循环 (level.waves 波)
     → EnemyScaler.spawn(wave, level.enemyMul)
     → 全部消灭 → 下一波
  → 所有波次完成 → AudioManager.playBGM(levelIndex, phase="boss")
     → Boss 登场
     → Boss 击败 → AudioManager.playVictory()
     → TransitionUI.showStageClear(score, time)
       → 3s 后自动进入下一关
  → 第 8 关通关 → "MISSION COMPLETE" + 总分 → 返回主菜单
```

## 4. 难度缩放公式

| 属性 | 缩放方式 |
|------|----------|
| 敌机 HP | `baseHP * enemyMul` |
| 敌机速度 | `baseSpeed * (1 + (enemyMul-1)*0.5)` |
| 射速间隔 | `baseInterval / enemyMul` |
| 生成间隔 | `baseSpawnInterval / enemyMul` |
| Boss HP | `baseBossHP * enemyMul` |

## 5. 背景渲染 (BackgroundRenderer)

每关 `render(ctx, gameTime)` 在游戏逻辑前绘制。

| 主题 | 实现方式 | 视觉元素 |
|------|----------|----------|
| space | 程序化 | 现有星空增强 + 彩色星云渐变 + 行星远景 |
| cloud | 程序化 | 3 层透明云带 (sin运动 + 不同速度) + 闪电 |
| ocean | 程序化 | 2 层 sin 波浪 + 水面高光 + 浪花 |
| canyon | 程序化 | 山脊多边形轮廓 + 前景岩石纹理 |
| volcano | 程序化 | 岩浆流粒子 + 黑色烟雾 + 红色辉光 |
| ruins | 程序化 | 建筑剪影多边形 + 闪烁火光 |
| ice | 程序化 | 极光渐变弧线 + 冰晶雪花粒子 |
| void | 程序化 | 暗红紫黑渐变 + 粒子吸积盘旋转 |

## 6. 音频管理 (AudioManager)

```javascript
const audioManager = {
  bgm: { normal: null, boss: null },
  victory: null,
  currentBgm: null,
  load(levelIndex) { /* 加载 bgm/l{n}_{phase}.mp3 */ },
  play(phase) { /* "normal" | "boss" | "victory" */ },
  stop() { /* 暂停重置 */ }
}
```

文件结构:
```
thunder-strike/
  bgm/
    l1_normal.mp3 ~ l8_normal.mp3
    l1_boss.mp3 ~ l8_boss.mp3
    victory.mp3
  thunder-strike.html
```

## 7. 过场动画 (TransitionUI)

- **Level Intro**: Canvas 上层绘制半透明遮罩 → 大字 "LEVEL X — 关名" + 辉光特效
- **Stage Clear**: "STAGE CLEAR" + 得分总结 → 3s 自动下一关
- **通关**: "MISSION COMPLETE" + 总耗时 + 总分 → "返回主菜单" 按钮
