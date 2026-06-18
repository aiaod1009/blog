---
title: "邮筒吐明信片 — 一个交互动画的完整实现"
date: "2026-06-16"
tags: ["CSS", "Vue", "Animation", "前端"]
description: "一个纯 CSS 构建的邮筒交互动画组件的完整实现过程，涵盖层叠上下文设计、Grid 布局策略、CSS 动画状态机、html2canvas 截图导出等技术点。"
cover: "/mingxinpian.png"
readTime: "12 min"
---

# Vue 实战：邮筒吐明信片 — 一个交互动画的完整实现

> 本文记录一个纯 CSS 构建的邮筒交互动画组件的完整实现过程，涵盖层叠上下文设计、Grid 布局策略、CSS 动画状态机、html2canvas 截图导出等前端核心技术点，并总结开发过程中遇到的关键问题与解决方案。

## 效果概述

一个复古红色邮筒，右侧附带金属拉杆。用户点击拉杆后，邮筒从黑色槽口中"吐出"一张明信片，明信片包含邮票、邮戳、地址格等纯 CSS 装饰元素，图片和文案通过 API 动态获取并随机选取。支持将当前明信片截图为 PNG 下载到本地。

## 组件架构

采用父子组件拆分策略：

```
MailboxPostcards (容器组件)
├── 邮筒外壳 (纯 CSS)
├── 拉杆交互
├── 数据获取与状态管理
└── PostcardItem (展示组件) × N
    ├── 明信片布局 (Grid)
    ├── 装饰元素 (绝对定位)
    └── 吐出动画 (@keyframes)
```

拆分依据：邮筒组件管理"何时吐"与"吐哪张"（状态与交互），明信片组件管理"长什么样"与"怎么动"（样式与动画）。两者通过 `props` 单向通信，明信片组件不持有任何业务状态。

## 一、邮筒的纯 CSS 构建

邮筒完全由 CSS 绘制，零图片资源。视觉层次通过 `box-shadow` 多层叠加与伪元素覆盖实现。

### 1.1 基础壳体

```css
.letterbox {
  background:
    linear-gradient(180deg, rgba(255,255,255,0.08), transparent 40%),
    #7d1808;
  box-shadow:
    inset 0 0 0 14px rgba(72,11,3,0.68),   /* 内凹边框 */
    inset 0 -24px 42px rgba(40,5,0,0.54),   /* 底部暗影 */
    0 32px 56px rgba(0,0,0,0.55);           /* 外部浮起投影 */
}
```

三层 `box-shadow` 分别模拟内边框、底部暗影和外部投影，配合 `linear-gradient` 高光，用纯 CSS 还原了金属/木质信箱的质感。

### 1.2 伪元素分层

| 伪元素 | 职责 | z-index |
|---|---|---|
| `::before` | 内层装饰边框（`inset: 30px`） | 1（默认） |
| `::after` | 上半部分遮罩，遮挡下滑过程中的明信片顶部 | 6 |

`.letterbox-slot`（黑色槽口）以 `z-index: 8` 处于邮筒内部最高层级，明信片在下滑过程中始终被其遮挡，形成"从槽口吐出"的视觉错觉。

### 1.3 层叠上下文设计

邮筒通过 `z-index: 10` 创建独立的层叠上下文（Stacking Context）。这意味着内部所有子元素的 `z-index` 只在邮筒内部竞争，无法突破到外部。

这是实现动画效果的关键前提：明信片位于邮筒外部的 `.postcard-stack` 中，其 `z-index` 无论设多高都不会盖过邮筒的遮罩层。动画的"吐出"效果本质上是利用了明信片从邮筒下方（`overflow: visible`）滑出时，逐步越过遮罩层边界的视觉渐变。

## 二、明信片布局

### 2.1 Grid 双栏布局

```css
.postcard {
  display: grid;
  grid-template-columns: 3fr 4fr;
  gap: 22px;
}
```

图片占 3/7，文字占 4/7。使用 `fr` 单位而非百分比，因为 `fr` 自动扣除 `gap` 后再按比例分配，布局更精确。

### 2.2 图片区域

```css
.photo-window {
  position: relative;
  overflow: hidden;
  aspect-ratio: 3/4;
}

.photo-window img {
  object-fit: cover;
}
```

`aspect-ratio: 3/4` 固定竖版比例，`object-fit: cover` 保证图片填充区域且不拉伸变形。图片以 `position: relative` 作为子元素（如角标装饰）的定位基准。

### 2.3 装饰元素

明信片上的装饰元素全部用纯 CSS 实现：

| 元素 | 实现方式 | 定位 |
|---|---|---|
| 左上角标（corner-grid） | 6 个 `<i>` 标签 + border | `absolute`，相对于 `.photo-window` |
| 邮票框（stamp-box） | border + `rotate(2deg)` | `absolute`，相对于 `.message-panel` |
| 邮戳（postmark） | 圆形 border-radius + `::after` 条纹 | `absolute` |
| 右下地址格（address-grid） | 6 个 `<i>` 标签 + border | `absolute` |
| 手写体（scribble） | cursive 字体 + `rotate(-5deg)` | 正常流 |

## 三、拉杆交互状态机

拉杆交互涉及两个独立状态变量，构成一个简单的状态机：

```
pullLever()
  │
  ├─ isPulled = true        → 旋钮 CSS 下滑
  ├─ isDelivering = false   → 重置明信片动画
  ├─ showNext()             → activeIndex++
  ├─ $nextTick → isDelivering = true  → 触发 @keyframes
  └─ setTimeout(800ms) → isPulled = false → 旋钮弹回
```

`$nextTick` 确保 Vue 已将新的 `activeIndex` 应用到 DOM 后再触发动画，否则明信片切换和动画会在同一帧内发生，导致动画丢失。防重复点击通过 `if (this.isPulled) return` 实现。

## 四、明信片动画

### 4.1 关键帧设计

```css
@keyframes deliverPostcard {
  0%   { opacity: 0; transform: translate(-50%, -440px) scale(1); }
  8%   { opacity: 1; transform: translate(-50%, -440px) scale(1); }
  70%  { opacity: 1; transform: translate(-50%, 200px) scale(1); }
  100% { opacity: 1; transform: translate(-50%, 200px) scale(1.04); }
}
```

动画分为三个阶段：

| 阶段 | 时间 | 行为 | 视觉效果 |
|---|---|---|---|
| 等待 | 0%→8% | 位置不变，opacity 0→1 | 明信片在槽口内部"现身"，被 slot 遮罩覆盖 |
| 下滑 | 8%→70% | Y 轴从 -440px 移动到 200px | 从槽口下方滑出，约 3 秒 |
| 定位 | 70%→100% | 位置不变，scale 1→1.04 | 到位后轻微放大，模拟"落定"感 |

0%→8% 的"静止现身"是关键：明信片在被遮罩覆盖的位置变为可见，用户看不到这一过程，随后的下滑才产生"从槽口吐出"的错觉。

### 4.2 三态管理

明信片通过 class 组合实现三种视觉状态：

| 状态 | Class | 视觉 |
|---|---|---|
| 隐藏 | 无 | opacity: 0，在槽口上方 |
| 预备 | `is-next` | opacity: 0，缩放 0.8，位于槽口下方 |
| 可见 | `is-active` | opacity: 1，最终位置 |

状态切换通过 Vue 的响应式 class 绑定自动触发 CSS `transition`，无需手动控制过渡。

## 五、数据接入

```js
async loadPostcards() {
  const res = await fetchPhotosByRegion('CN', 1, 50);
  const photos = res?.photos || [];
  const hasTitle = photos.filter((p) => p.src && p.title);
  const shuffled = hasTitle.sort(() => Math.random() - 0.5).slice(0, 11);

  this.postcards = shuffled.map((photo) => ({
    id: photo.id,
    title: photo.title,
    caption: photo.caption || '这张影像还在等待一段合适的叙述。',
    image: photo.src
  }));
}
```

数据流：API 返回 → 筛选有效数据 → Fisher-Yates 近似随机打乱 → 截取前 11 张 → 映射为组件所需格式。

`Math.random() - 0.5` 作为 `sort` 的比较函数并非真正的 Fisher-Yates 洗牌算法（存在轻微偏差），但对于 50 量级的数据集，随机性足够且实现简洁。

## 六、明信片导出

使用 `html2canvas` 实现将当前明信片截图为 PNG 并下载。

### 6.1 原理

`html2canvas` 在浏览器端遍历 DOM 树，递归计算每个节点的 computed style，将视觉属性（背景、边框、文字、阴影等）逐像素绘制到 Canvas 上，最终通过 `toDataURL()` 导出为图片。整个过程纯客户端运算，不经过服务端。

### 6.2 实现

```js
import html2canvas from 'html2canvas';

async savePostcard() {
  const el = this.$el.querySelector('.postcard.is-active');
  if (!el) return;
  const canvas = await html2canvas(el, { scale: 2, useCORS: true });
  const link = document.createElement('a');
  link.download = `postcard-${this.activeIndex + 1}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}
```

- `scale: 2` — 输出 2 倍分辨率，适配 Retina/高 DPI 屏幕
- `useCORS: true` — 允许绘制跨域图片资源（图片存储在腾讯云 COS）

### 6.3 性能与成本

| 维度 | 开销 |
|---|---|
| 服务端 | 零，纯客户端运算 |
| 网络 | 零额外请求，复用浏览器已缓存的图片资源 |
| CPU | 较高，DOM 遍历 + 逐像素绘制，截图瞬间约 200-500ms 阻塞 |
| 内存 | scale: 2 约产生 4 倍像素量的 Canvas 缓冲区 |
| COS 流量 | 零，图片已通过页面加载时的 CORS 请求缓存 |

### 6.4 跨域约束

`html2canvas` 绘制跨域图片到 Canvas 时，Canvas 会被标记为 tainted（污染状态），调用 `toDataURL()` 将抛出安全异常。解决方案：

1. 腾讯云 COS 存储桶配置 `Access-Control-Allow-Origin` 白名单
2. `useCORS: true` 使 html2canvas 以 CORS 模式请求图片
3. 页面加载时图片已通过 CORS 请求获取并缓存，截图时直接复用，不产生额外流量

## 七、关键问题与解决方案

### 7.1 层叠上下文陷阱

**问题：** 子元素的 `z-index` 无法突破父元素的层叠上下文。将明信片放在 `.postcard-stack`（位于邮筒外部）中，无论 `z-index` 设多高都无法盖过邮筒的遮罩层。

**解决：** 不试图"盖过"，而是利用邮筒 `overflow: visible` 让明信片从下方滑出。视觉上明信片从槽口"吐出"，实际上是明信片从邮筒底部逐渐露出，被邮筒上半部分的 `::after` 遮罩遮住了顶部，产生了"从中间出来"的错觉。

### 7.2 布局与动画的耦合

**问题：** 边改布局边改动画，导致两者互相破坏 — 调整尺寸改变了动画的起始/终止位置，调整动画偏移量又影响了布局视觉。

**解决：** 先锁定静态模板（尺寸、比例、布局、装饰），确认视觉无误后再叠加动画层。动画的 `transform` 值基于确定的静态布局计算，而非反复试错调整。

### 7.3 Scoped 样式泄露

**问题：** Vue 3 的 `<style scoped>` 会将父组件的 scoped 属性（`data-v-xxxx`）同时应用到子组件的根元素。父组件中的 `.postcard { aspect-ratio: 1.82 }` 匹配了子组件的 `<article class="postcard">` 根元素，覆盖了子组件自身的 `height` 声明。

**解决：** 拆分组件后彻底清理父组件中的残留样式。可通过浏览器 DevTools 检查元素的 computed style，确认是否有多个 scoped data-v 属性叠加在同一元素上。

## 技术栈

| 技术 | 用途 |
|---|---|
| Vue 3 (Options API) | 组件化、响应式状态管理 |
| CSS Grid | 明信片图文双栏布局 |
| CSS `@keyframes` + `transition` | 吐出动画与状态过渡 |
| `aspect-ratio` + `object-fit` | 图片比例控制 |
| `box-shadow` + 伪元素 | 纯 CSS 视觉构建 |
| `html2canvas` | 客户端 DOM 截图导出 |
