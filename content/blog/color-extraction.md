---
title: "图片主色调提取：从像素到翠绿、宝蓝"
date: "2026-06-16"
tags: ["Canvas", "JavaScript", "前端", "算法"]
description: "不依赖任何第三方库，用 Canvas + 量化算法，纯前端实现图片色彩提取与中文命名。"
cover: "/se.png"
readTime: "10 min"
---

# 前端图片主色调提取：从像素到"翠绿"、"宝蓝"

> 不依赖任何第三方库，用 Canvas + 量化算法，纯前端实现图片色彩提取与中文命名。

## 一、整体思路

整个流程分三步：

```
图片 → Canvas 采样 → 量化算法提取主色 → HSL 转换 → 中文命名
```

核心文件只有两个：
- `colorExtractor.js` — 负责提取颜色
- `ColorPalette.vue` — 负责展示和交互

---

## 二、颜色提取：怎么从一张图里"看出"主色调？

### 2.1 用 Canvas 读像素

浏览器里要读图片像素，最直接的方式就是画到 Canvas 上，再用 `getImageData` 拿到原始 RGBA 数据。

```js
const img = new Image()
img.crossOrigin = 'anonymous' // 跨域图片必须加

img.onload = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  // 先缩小图片，100px 就够了
  const maxSize = 100
  const ratio = Math.min(maxSize / img.width, maxSize / img.height)
  canvas.width = img.width * ratio
  canvas.height = img.height * ratio

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const pixels = imageData.data // Uint8ClampedArray，每4个元素代表一个像素的 R G B A
}
```

**为什么要缩小？** 一张 4000×3000 的照片有 1200 万像素，缩到 100px 宽大概只剩 7500 个像素，提取速度差了 1600 倍，结果几乎没区别。

### 2.2 量化算法：把几万种颜色归成 10 种

拿到像素数组后，每个像素的 RGB 值可以是 0-255 的任意组合，理论上有一千六百多万种颜色。我们需要把它们"归类"成少数几个主色。

这里用的是一个简化版的 **中位切分（Median Cut）** 思路：

```js
function quantize(pixels, colorCount) {
  const colorMap = {}

  // 第一步：量化 + 计数
  for (let i = 0; i < pixels.length; i += 8) { // 每2个像素采样一次（跳过A通道）
    const r = Math.round(pixels[i] / 16) * 16     // 把 0-255 映射到 0, 16, 32, ... 240
    const g = Math.round(pixels[i + 1] / 16) * 16
    const b = Math.round(pixels[i + 2] / 16) * 16
    const key = `${r},${g},${b}`

    if (!colorMap[key]) {
      colorMap[key] = { r, g, b, count: 0 }
    }
    colorMap[key].count++
  }

  // 第二步：按出现次数排序
  const sorted = Object.values(colorMap).sort((a, b) => b.count - a.count)
  // ...
}
```

**量化是什么意思？** 把每个通道的值除以 16 再四舍五入，相当于把 256 个色阶压缩成 16 个色阶。这样 `rgb(100, 50, 200)` 和 `rgb(105, 55, 195)` 就会被归到同一个桶里。

> **迭代记录：** 初版用的是除以 32（8 个色阶），实测发现色彩丰富的照片会丢失蓝色、绿色等鲜艳色，所有颜色都被压成暗黄色系。改为 16 后色阶翻倍，能保留更多色彩细节。

**为什么要跳过像素？** `i += 8` 意味着每 2 个像素才采样一次（一个像素占 4 个字节）。对于主色调提取来说，精度足够了。

### 2.3 去重：过滤掉太接近的颜色

排序后前 10 个颜色可能都很接近（比如 5 种不同深浅的绿），需要过滤：

```js
const result = []
for (const color of sorted) {
  if (result.length >= colorCount) break

  // 如果和已选颜色在 RGB 空间距离太近，跳过
  const tooClose = result.some(c =>
    Math.abs(c.r - color.r) < 40 &&
    Math.abs(c.g - color.g) < 40 &&
    Math.abs(c.b - color.b) < 40
  )

  if (!tooClose) {
    result.push(color)
  }
}
```

判断标准是：三个通道的差值都小于 40（约 16%），就算"太接近"。这样能保证提取出来的 10 个颜色在视觉上有明显差异。

> **迭代记录：** 初版阈值是 64（约 25%），实测发现过于激进——蓝色和青色的 RGB 差值往往不到 64，会被当作"太接近"而过滤掉，导致提取结果里完全没有蓝色系。降到 40 后，不同色相能被保留下来。

---

## 三、颜色命名：怎么把 `#2a7d4f` 变成"翠绿"？

RGB 不直观，没人看到 `rgb(42, 125, 79)` 能立刻反应过来是什么颜色。所以需要转成 HSL（色相、饱和度、亮度），再映射成中文名。

### 3.1 RGB → HSL

```js
function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255
  const max = Math.max(r, g, b), min = Math.min(r, g, b)
  let h, s, l = (max + min) / 2

  if (max === min) {
    h = s = 0  // 灰色，无色相
  } else {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break
      case g: h = ((b - r) / d + 2) / 6; break
      case b: h = ((r - g) / d + 4) / 6; break
    }
  }

  return { h: h * 360, s: s * 100, l: l * 100 }
}
```

HSL 三个值的含义：
- **H（色相）**：0-360°，色环上的位置。0° 是红，120° 是绿，240° 是蓝
- **S（饱和度）**：0-100%，颜色有多"鲜艳"。0% 是灰色，100% 是纯色
- **L（亮度）**：0-100%，颜色有多亮。0% 是黑，100% 是白

### 3.2 命名逻辑：先判断灰阶，再看色相

```js
function getColorName({ r, g, b }) {
  const { h, s, l } = rgbToHsl(r, g, b)

  // 无饱和度 → 灰阶系列
  if (s < 8) {
    if (l < 10) return '漆黑'
    if (l < 25) return '深灰'
    if (l < 45) return '中灰'
    if (l < 65) return '浅灰'
    if (l < 85) return '银白'
    return '纯白'
  }

  // 低饱和度 → 带灰调
  if (s < 25) {
    if (l < 30) return '暗灰调'
    if (l > 70) return '雾灰调'
    const prefix = l < 50 ? '暗' : '浅'
    return prefix + getHueName(h) + '灰'
  }

  // 正常饱和度 → 按亮度加前缀
  const lightness = l < 30 ? '暗' : l > 70 ? '浅' : ''
  return lightness + getHueName(h)
}
```

决策树大概是这样的：

```
饱和度 < 8%  →  灰阶（漆黑/深灰/中灰/浅灰/银白/纯白）
饱和度 < 25% →  灰调（暗灰调/雾灰调/暗X灰/浅X灰）
其他         →  正常色（暗X / X / 浅X）
```

### 3.3 色相细分：从"蓝"到"天蓝"和"宝蓝"

色相是 0-360 的连续值，需要切成离散的名称：

```js
function getHueName(h) {
  if (h < 10)   return '红'
  if (h < 25)   return '橘红'
  if (h < 40)   return '橙'
  if (h < 50)   return '金橙'
  if (h < 65)   return '黄'
  if (h < 80)   return '柠檬黄'
  if (h < 100)  return '黄绿'
  if (h < 130)  return '草绿'
  if (h < 155)  return '翠绿'
  if (h < 170)  return '青绿'
  if (h < 190)  return '青'
  if (h < 210)  return '天蓝'
  if (h < 235)  return '蓝'
  if (h < 255)  return '宝蓝'
  if (h < 275)  return '蓝紫'
  if (h < 295)  return '紫'
  if (h < 315)  return '品红'
  if (h < 335)  return '玫红'
  return '红'
}
```

注意不是简单地均分成"红橙黄绿蓝紫"，而是根据人眼感知做了不均匀划分：
- 蓝色区域（190°-255°）分了三段：天蓝、蓝、宝蓝
- 绿色区域（100°-170°）分了四段：黄绿、草绿、翠绿、青绿
- 红色在首尾都出现了（0° 和 360° 都是红）

组合起来就能得到很细腻的命名，比如：
- `h=200, s=70, l=25` → "暗天蓝"
- `h=140, s=60, l=60` → "翠绿"
- `h=0, s=5, l=50` → "中灰"

---

## 四、展示与交互：ColorPalette 组件

提取出来的颜色数组格式是：

```js
[
  { hex: '#2a7d4f', name: '翠绿' },
  { hex: '#1a3a5c', name: '暗天蓝' },
  // ...
]
```

ColorPalette 组件负责渲染色块、颜色名、hex 值，点击色块还能复制 hex 到剪贴板：

```js
copyHex(hex, index) {
  navigator.clipboard.writeText(hex).then(() => {
    this.copiedIndex = index
    setTimeout(() => { this.copiedIndex = -1 }, 1000)
  })
}
```

---

## 五、性能优化点

1. **缩图采样**：100px 就够，不需要处理原图
2. **跳像素**：每 2 个像素采样一次，减少 50% 计算量
3. **结果缓存**：提取后存回数据库，下次刷新直接读缓存
4. **量化色阶**：256 → 16，减少颜色桶数量的同时保留足够色彩细节

---

## 六、踩坑与迭代

### 问题：所有照片的主色调都是暗黄色

上线后发现，不管照片内容是什么——蓝色天空、绿色森林、红色建筑——提取出来的主色调永远是 `#404020`、`#806020`、`#c0a080` 这类暗黄棕色，完全没有蓝色和绿色。

### 原因分析

两个参数同时太粗：

| 参数 | 初版值 | 问题 |
|---|---|---|
| 量化精度 | `÷ 32`（8 色阶） | 蓝色 `rgb(30,60,180)` 和深蓝 `rgb(20,40,160)` 被归到同一个桶，但和棕色 `rgb(64,64,32)` 也只差几十 |
| 去重阈值 | `< 64`（25%） | 蓝色和青色的 RGB 通道差值通常不到 64，被判定为"太接近"而过滤掉 |

量化太粗 + 过滤太狠 = 鲜艳色全军覆没，只剩最泛化的暗色系存活。

### 修复方案

```
量化精度：÷ 32 → ÷ 16（色阶从 8 提升到 16）
采样频率：每 4 像素 → 每 2 像素
去重阈值：64 → 40
```

修复后，同一组照片能提取出天蓝、翠绿、宝蓝等鲜艳色，色谱分布也更均匀。

---

## 七、局限性

- **量化精度有限**：16 一档的量化仍然比较粗，对于色彩渐变丰富的图片可能丢失细节
- **去重阈值固定**：40 的阈值对某些图片可能太松或太紧
- **没有加权**：没有考虑图片不同区域的权重（比如中心区域更重要）
- **中文命名主观**：色相边界的划分是人为设定的，不同人可能有不同偏好

如果需要更精确的结果，可以考虑用 [ColorThief](https://github.com/lokesh/color-thief) 或 [Vibrant.js](https://github.com/jariz/vibrant.js) 这类成熟的库，它们用的是更复杂的 MMCQ（改进的中位切分量化）算法。
