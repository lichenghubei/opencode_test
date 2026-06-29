# BGM Files for Thunder Strike

Place music files in this directory. **支持 .mp3 和 .ogg 格式**（游戏会自动检测，优先 .mp3）。

## 快速获取方式

### 方式 1：从 Free Music Archive 下载（推荐）

访问 https://freemusicarchive.org 搜索以下风格：

| 关卡 | 推荐风格 | 搜索关键词 |
|------|----------|-----------|
| L1-L2 | Ambient/电子 | "space ambient electronic" |
| L3-L4 | 管弦乐/史诗 | "orchestral epic cinematic" |
| L5-L6 | 摇滚/电子 | "rock industrial electronic" |
| L7-L8 | 黑暗管弦乐 | "dark orchestral cinematic" |

### 方式 2：从 Pixabay Music 下载（免费，无需署名）

访问 https://pixabay.com/music/search/ 搜索以下关键词下载：
- "cinematic epic" → 适合 L3/L4/L8
- "space ambient" → 适合 L1/L2
- "action battle" → 适合 Boss 阶段
- "victory" → 适合过关音乐

### 方式 3：从 OpenGameArt 下载（CC-BY 许可，需署名）

下载 Oblidivm 的免费太空射击游戏音乐包：
https://opengameart.org/content/space-shooter-music

包含 11 首曲目：Space Heroes、Battle in the Stars、Alone Against Enemy、Without Fear、Rain of Lasers、Epic End 等

Boss 战斗音乐：
https://opengameart.org/content/boss-battle-music

Victory 音乐：
https://opengameart.org/content/victory-5

### 方式 4：从 FiftySounds 下载（免费，需署名）

https://www.fiftysounds.com/royalty-free-music/cinematic-epic.html

## 命名规则 (17 个文件)

### Level BGM (16 文件)
| 文件名 | 关卡 | 推荐风格 |
|--------|------|----------|
| `l1_normal.mp3` | L1 星云深处 | ambient/electronic |
| `l1_boss.mp3` | L1 Boss | intense tense |
| `l2_normal.mp3` | L2 云端之上 | ethereal/orchestral |
| `l2_boss.mp3` | L2 Boss | intense |
| `l3_normal.mp3` | L3 怒海争锋 | epic orchestral |
| `l3_boss.mp3` | L3 Boss | intense |
| `l4_normal.mp3` | L4 峡谷穿梭 | western/canyon |
| `l4_boss.mp3` | L4 Boss | intense |
| `l5_normal.mp3` | L5 熔岩炼狱 | heavy rock/metal |
| `l5_boss.mp3` | L5 Boss | intense |
| `l6_normal.mp3` | L6 钢铁废墟 | industrial electronic |
| `l6_boss.mp3` | L6 Boss | intense |
| `l7_normal.mp3` | L7 冰封极地 | ethereal/choir |
| `l7_boss.mp3` | L7 Boss | intense |
| `l8_normal.mp3` | L8 深渊黑洞 | dark orchestral |
| `l8_boss.mp3` | L8 Boss | intense |

### Victory
| 文件名 | 用途 |
|--------|------|
| `victory.mp3` 或 `victory.ogg` | 每关过关音乐 |

## 格式说明
- 支持 .mp3 和 .ogg 格式
- 游戏会自动检测：先找 .mp3，找不到则尝试 .ogg
- Looping 曲目效果最佳（文件会自动循环播放）
