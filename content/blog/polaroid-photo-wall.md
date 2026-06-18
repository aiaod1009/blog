---
title: "拍立得照片墙 — 用 CSS 3D 变换还原桌面散落照片"
date: "2026-06-13"
tags: ["CSS", "3D", "Vue", "Frontend", "Animation"]
description: "模拟拍立得照片散落在桌面上的展示组件，涵盖图片尺寸预加载、CSS 3D 翻转卡片、随机散落布局算法等技术细节。"
cover: "/pailide.png"
readTime: "10 min"
---

# Vue 实战：拍立得照片墙 — 用 CSS 3D 变换还原桌面散落照片

> 本文记录一个模拟拍立得照片散落在桌面上的展示组件的完整实现过程，涵盖图片尺寸预加载与动态比例适配、CSS 3D 翻转卡片、随机散落布局算法、胶带装饰等视觉细节，以及开发过程中关于图片裁剪策略的迭代思考。

## 效果概述

在足迹地图页面点击某个地区后，进入该地区的照片展示页。照片以拍立得风格随机散落在桌面上，每张带有彩色胶带装饰，鼠标悬停时卡片翻转显示照片背面的文字信息（标题、日期、描述）。横图保持原始比例展示，竖图裁剪为 4:5 以保持拍立得的方正感。

## 组件架构

```
Footprints (足迹地图)
└── 点击地区 → $router.push('/photo-desk/:mapCode')
    └── PhotoDesk (拍立得照片墙)
        ├── 顶部导航 (返回足迹地图 + 地区标题)
        ├── 照片桌面 (.photo-desk, 相对定位容器)
        │   └── 散落照片 (.scattered-photo, 绝对定位) × N
        │       └── 翻转卡片 (.photo-card, 3D 变换)
        │           ├── 正面 (.photo-front) — 图片 + 胶带
        │           └── 背面 (.photo-back) — 标题/日期/描述
        └── 加载提示
```

## 一、图片尺寸预加载

照片来源的宽高比不可控，有横有竖。为了让每张卡片按原图比例展示（而非统一裁剪成同一尺寸），需要在渲染前预加载所有图片获取真实尺寸。

### 1.1 预加载函数

```js
const loadImageSize = (src) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
  img.onerror = () => resolve({ w: 3, h: 4 })  // 加载失败默认 3:4
  img.src = src
})
```

利用 `Image` 对象的 `naturalWidth` / `naturalHeight` 获取原始像素尺寸。失败时回退到 3:4 避免布局异常。

### 1.2 批量预加载

```js
const sizes = await Promise.all(valid.map(p => loadImageSize(p.src)))
```

`Promise.all` 并发加载所有图片尺寸，网络开销等于单张最慢的那个，不会串行等待。

### 1.3 比例裁剪策略

```js
const CARD_H = 260

const ratio = w / h < 1 ? 4 / 5 : w / h
const cardW = CARD_H * ratio
const cardH = CARD_H
```

| 图片类型 | 判断条件 | 处理方式 | 效果 |
|---|---|---|---|
| 横图 | `w/h >= 1` | 保持原始比例 | 宽度自适应，高度固定 260px |
| 竖图 | `w/h < 1` | 强制裁剪为 4:5 | 宽度收窄，`object-fit: cover` 裁掉上下多余部分 |

竖图如果按原始比例展示会拉得太长，不像拍立得。裁剪为 4:5 后保持了拍立得的方正感，同时比 1:1 更保留一些竖向构图。

## 二、散落布局算法

### 2.1 网格基础定位

照片并非真正的随机摆放，而是基于 4 列网格计算基础位置：

```js
const cols = 4
const cellW = 100 / cols  // 每列 25%

const col = i % cols
const row = Math.floor(i / cols)
const baseX = col * cellW + cellW / 2  // 列中心 X (百分比)
const baseY = row * 400 + 60           // 行 Y (像素)
```

- `i % cols` 让照片在 4 列间循环排列
- `baseX` 取列中心点，使用百分比单位适配不同屏幕宽度
- `baseY` 按 400px 行高递增，留出足够的垂直间距

### 2.2 随机偏移

在网格基础上叠加随机偏移，打破规律感：

```js
const offsetX = (Math.random() - 0.5) * 40   // ±20px 水平偏移
const offsetY = (Math.random() - 0.5) * 30   // ±15px 垂直偏移
const rotate = (Math.random() - 0.5) * 16    // ±8° 旋转角度
```

三个维度的随机性让每张照片看起来像是随手扔在桌上的，而非整齐排列。每次刷新页面偏移值不同，同一组照片也会呈现不同的散落姿态。

### 2.3 样式注入

```js
const style = {
  left: `${baseX}%`,
  top: `${baseY + offsetY}px`,
  transform: `translateX(-50%) rotate(${rotate}deg)`,
  width: `${cardW}px`,
  height: `${cardH}px`
}
```

- `translateX(-50%)` 让卡片以中心点定位，而非左上角
- `rotate` 应用随机旋转角度
- 宽度和高度根据图片比例动态计算

## 三、CSS 3D 翻转卡片

### 3.1 透视设置

```css
.photo-card {
  perspective: 1000px;
  transform-style: preserve-3d;
}
```

- `perspective` 定义观察者到 z=0 平面的距离，值越小透视效果越强
- `transform-style: preserve-3d` 让子元素在 3D 空间中渲染，而非被压平

### 3.2 正反面结构

```html
<div class="photo-card">
  <div class="photo-front">
    <img :src="photo.src" />
    <div class="tape"></div>
  </div>
  <div class="photo-back">
    <h3>{{ photo.title }}</h3>
    <p>{{ photo.date }}</p>
    <p>{{ photo.description }}</p>
  </div>
</div>
```

### 3.3 翻转动画

```css
.photo-card {
  transition: transform 0.6s ease;
}

.photo-card:hover {
  transform: rotateY(180deg);
}

.photo-front,
.photo-back {
  backface-visibility: hidden;
  position: absolute;
  width: 100%;
  height: 100%;
}

.photo-back {
  transform: rotateY(180deg);
}
```

- `backface-visibility: hidden` 隐藏元素背面，避免翻转时看到镜像内容
- 背面预先旋转 180°，翻转时才能正确显示
- `transition` 控制动画时长和缓动函数

## 四、胶带装饰

### 4.1 CSS 实现

```css
.tape {
  position: absolute;
  top: -15px;
  left: 50%;
  transform: translateX(-50%) rotate(-3deg);
  width: 80px;
  height: 30px;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(2px);
  border: 1px solid rgba(255, 255, 255, 0.3);
}
```

- 半透明白色背景 + 毛玻璃效果模拟胶带质感
- `rotate(-3deg)` 让胶带略微倾斜，增加随意感
- 定位在卡片顶部上方 15px

### 4.2 多彩胶带

不同照片使用不同颜色的胶带：

```js
const tapeColors = [
  'rgba(255, 200, 100, 0.6)',  // 暖黄
  'rgba(100, 200, 255, 0.6)',  // 天蓝
  'rgba(255, 150, 150, 0.6)',  // 粉红
  'rgba(150, 255, 150, 0.6)',  // 浅绿
]

const tapeColor = tapeColors[i % tapeColors.length]
```

## 五、响应式适配

### 5.1 移动端调整

```css
@media (max-width: 768px) {
  .photo-desk {
    padding: 20px 10px;
  }
  
  .scattered-photo {
    transform: translateX(-50%) rotate(var(--rotate)) scale(0.8);
  }
}
```

移动端缩小卡片尺寸，减少列数，调整间距。

### 5.2 触摸设备

```js
// 触摸设备禁用 hover 翻转，改为点击翻转
const isTouchDevice = 'ontouchstart' in window

const handleClick = () => {
  if (isTouchDevice) {
    isFlipped.value = !isFlipped.value
  }
}
```

## 六、性能优化

### 6.1 图片懒加载

```js
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target
      img.src = img.dataset.src
      observer.unobserve(img)
    }
  })
})
```

### 6.2 动画性能

```css
.scattered-photo {
  will-change: transform;
  transform: translateZ(0);  // 引擎优化
}
```

- `will-change` 提示浏览器该属性将要变化，提前准备
- `translateZ(0)` 触发 GPU 加速

## 七、总结

这个组件涉及多个技术点：

- **图片预加载**：获取真实尺寸，动态计算卡片比例
- **散落布局**：网格 + 随机偏移，平衡规律与自然感
- **CSS 3D**：透视、翻转动画、背面隐藏
- **视觉细节**：胶带装饰、多彩配色、桌面纹理

关键收获：好的视觉效果往往需要多个小细节的叠加，而不是单一的大技术。每个细节单独看都不难，但组合起来就能创造出沉浸式的体验。
