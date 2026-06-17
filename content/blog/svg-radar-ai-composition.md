---
title: "SVG 雷达图 + AI 流式构图分析：从多边形到提示词工程"
date: "2026-06-17"
tags: ["SVG", "AI", "SSE", "Vue", "Frontend"]
description: "用纯 SVG 画雷达图，用 SSE 流式传输 AI 分析结果，用一条提示词同时拿到结构化评分和文本分析。"
cover: "/image.png"
readTime: "12 min"
---

# SVG 雷达图 + AI 流式构图分析：从多边形到提示词工程

> 用纯 SVG 画雷达图，用 SSE 流式传输 AI 分析结果，用一条提示词同时拿到结构化评分和文本分析。

## 一、整体架构

```
用户点击"分析构图"
    ↓
前端 POST /api/ai/analyze-composition (imageUrl, photoId)
    ↓
后端转发图片给智谱 GLM-4.6V（多模态视觉模型）
    ↓
AI 流式返回：JSON评分 --- 文本分析
    ↓
后端逐 chunk 转发给前端（SSE）
    ↓
前端实时解析：雷达图分数 → 更新 SVG，文本 → 逐字显示
    ↓
流结束后后端存库，下次进页面直接读缓存
```

---

## 二、雷达图：纯 SVG 怎么画？

### 2.1 核心数学：极坐标转直角坐标

雷达图的本质是一个正 N 边形（N = 维度数），每个顶点代表一个维度，数据点在对应轴上的位置就是分数。

```js
const center = size / 2        // 中心点
const radius = (size / 2) - 20 // 留 20px 给标签
const angleStep = (2 * Math.PI) / data.length  // 每个维度的角度间隔

// 极坐标 → 直角坐标
const getPoint = (index, ratio) => {
  const angle = index * angleStep - Math.PI / 2  // -PI/2 让第一个点在顶部
  return {
    x: center + radius * ratio * Math.cos(angle),
    y: center + radius * ratio * Math.sin(angle)
  }
}
```

**为什么要减 `PI/2`？** 极坐标系的 0° 在右边（3点钟方向），但习惯上雷达图的第一个维度在顶部（12点钟方向），所以旋转 -90°。

**`ratio` 是什么？** 0 到 1 的比例值。`ratio = 1` 是最外圈，`ratio = 0.5` 是中间圈，`ratio = value / 100` 就是数据点的位置。

### 2.2 画同心网格线

5 层同心正六边形，从内到外：

```js
const getGridPoints = (level) => {
  const ratio = level / 5  // 1/5, 2/5, 3/5, 4/5, 5/5
  return data.map((_, i) => {
    const p = getPoint(i, ratio)
    return `${p.x},${p.y}`
  }).join(' ')
}
```

SVG 的 `<polygon points="x1,y1 x2,y2 x3,y3 ...">` 接收一组坐标，自动连线成多边形。

```html
<g v-for="(level, i) in 5" :key="'grid-'+i">
  <polygon :points="getGridPoints(level)" fill="none" stroke="#4a5568" stroke-width="0.5" />
</g>
```

### 2.3 画数据多边形

把每个维度的分数映射到对应轴上，连线：

```js
const dataPoints = computed(() => {
  return data.map((item, i) => {
    const p = getPoint(i, item.value / 100)  // value 0-100 → ratio 0-1
    return `${p.x},${p.y}`
  }).join(' ')
})
```

```html
<polygon :points="dataPoints" fill="#3ec1d3" :fill-opacity="0.35" stroke="#3ec1d3" stroke-width="2" />
```

### 2.4 标签定位

标签在轴的延长线上，离中心 1.2 倍半径：

```js
const getLabelPos = (index) => {
  return getPoint(index, 1.2)  // 超出最外圈 20%
}
```

**注意 `overflow: visible`**：SVG 默认裁剪超出 viewBox 的内容，标签会被切掉。加 `style="overflow: visible"` 解决。

### 2.5 完整 SVG 结构

```html
<svg :width="size" :height="size" :viewBox="`0 0 ${size} ${size}`" style="overflow: visible">
  <!-- 5 层同心网格 -->
  <polygon v-for="level in 5" :points="getGridPoints(level)" />

  <!-- N 条轴线 -->
  <line v-for="(item, i) in data" :x1="center" :y1="center" :x2="getPoint(i, 1).x" :y2="getPoint(i, 1).y" />

  <!-- 数据填充区域 -->
  <polygon :points="dataPoints" fill="#3ec1d3" :fill-opacity="0.35" />

  <!-- 数据点圆圈 -->
  <circle v-for="(item, i) in data" :cx="getPoint(i, item.value/100).x" :cy="getPoint(i, item.value/100).y" r="3" />

  <!-- 维度标签 -->
  <text v-for="(item, i) in data" :x="getLabelPos(i).x" :y="getLabelPos(i).y">{{ item.label }}</text>
</svg>
```

---

## 三、提示词工程：怎么让 AI 同时输出分数和分析？

### 3.1 核心思路：用分隔符拆两种输出

大模型擅长生成文本，但我们需要的是**结构化数据 + 文本**的混合输出。解决方案是：用一个特殊分隔符 `---` 把两部分隔开，前端按分隔符拆分。

```
{"radar":{"光影":85,"构图与线条":72,...}}
---
这张照片在光影处理上表现出色，主体突出，色彩搭配和谐...
```

### 3.2 完整提示词

```text
分析这张照片，严格按照以下格式输出，不要有任何多余内容：

第一步：先输出一个 JSON 对象，包含 6 个维度的评分（0-100）：
{"radar":{"光影":分数,"构图与线条":分数,"色彩":分数,"情感表达":分数,"主题与叙事性":分数,"技术呈现":分数}}

第二步：输出三个减号作为分隔符：
---

第三步：输出 200 字以内的纯文本分析，不要用#号，重点分析光影、构图、色彩、情感表达的优缺点。

注意：JSON 和分析文本之间必须用 --- 分隔，不要加任何其他内容。
```

几个关键设计：

| 要点 | 为什么 |
|------|--------|
| "严格按照以下格式" | 减少模型自由发挥，降低格式错误率 |
| 明确写出 JSON 结构 | 模型会照着抄 key 名，前端解析不用猜 |
| "不要有任何多余内容" | 避免模型输出 "好的，我来分析..." 之类的废话 |
| "不要用#号" | 防止 Markdown 标题破坏纯文本展示 |
| 用 `---` 分隔 | 选一个 AI 不太可能在正文中自然使用的符号 |
| 200 字限制 | 控制输出长度，节省 token |

### 3.3 为什么不用 function calling？

智谱的 API 支持 function calling，但这里选择用文本格式的原因：
- **流式友好**：function calling 要等整个响应结束才返回，文本格式可以逐字流式
- **简单直接**：一个请求一个响应，不用定义函数 schema
- **容错性好**：即使 JSON 格式有点小错，前端可以用 try-catch 兜底

---

## 四、SSE 流式传输：前后端怎么配合？

### 4.1 后端：转发 + 累积

后端做了两件事：把 AI 的响应逐 chunk 转发给前端，同时累积完整内容用于存库。

```js
// 设置 SSE 头部
res.setHeader('Content-Type', 'text/event-stream');
res.setHeader('Cache-Control', 'no-cache');
res.setHeader('Connection', 'keep-alive');

const reader = response.body.getReader();
let fullContent = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  buffer += decoder.decode(value, { stream: true });
  // 解析每行 data: xxx
  for (const line of lines) {
    const content = parsed.choices?.[0]?.delta?.content;
    if (content) {
      fullContent += content;  // 累积
      res.write(`data: ${JSON.stringify({ content })}\n\n`);  // 转发
    }
  }
}

// 流结束后存库
const parts = fullContent.split('---');
const radar = JSON.parse(parts[0]).radar;
const text = parts.slice(1).join('---');
await Photo.findByIdAndUpdate(photoId, { 'analysis.radar': radar, 'analysis.result': text });
```

### 4.2 前端：流式解析 + 实时更新

前端的难点在于：**JSON 是逐步到达的，可能收到一半就尝试解析**。

```js
const reader = response.body.getReader()
let fullContent = ''
let scoresParsed = false

while (true) {
  const { done, value } = await reader.read()
  if (done) break

  const chunk = decoder.decode(value, { stream: true })
  // 解析 SSE data 行...
  fullContent += parsed.content

  // 检查是否收到分隔符
  if (!scoresParsed && fullContent.includes('---')) {
    const parts = fullContent.split('---')
    const jsonPart = parts[0].trim()

    try {
      const scoreData = JSON.parse(jsonPart)
      if (scoreData.radar) {
        // 成功解析 → 更新雷达图
        this.radarData = Object.entries(scoreData.radar)
          .map(([label, value]) => ({ label, value }))
        scoresParsed = true
      }
    } catch (e) {
      // JSON 还没收完整，下一轮再试
    }

    // 分隔符后面的部分就是文本分析
    this.analysisResult = parts.slice(1).join('---').trim()
  }
}
```

**为什么用 try-catch？** 因为流式传输中 JSON 是逐字到达的。可能第一次收到 `{"radar":{"构图`，第二次收到 `平衡":85,...}}`。只有第二次才能 parse 成功，第一次 catch 住就行。

---

## 五、缓存策略：分析一次，永久使用

AI 分析是有成本的（每次调用消耗 token），所以结果要存库：

```js
// 存
await Photo.findByIdAndUpdate(photoId, {
  'analysis.radar': radar,
  'analysis.result': text,
  'analysis.analyzedAt': new Date()
});
```

前端加载时优先读缓存：

```js
watch: {
  cachedAnalysis: {
    immediate: true,
    handler(val) {
      if (val?.result) this.analysisResult = val.result
      if (val?.radar?.length) this.radarData = val.radar
    }
  }
}
```

`immediate: true` 让组件一挂载就检查缓存，有就直接渲染，用户看到的是秒开的效果。点"重新分析"才会重新调 AI 并覆盖缓存。

---

## 六、组件交互流程

```
页面加载
  ↓
fetchPhoto → photoData.analysis 有值？
  ├── 有 → watcher 立即渲染雷达图 + 文本（秒开）
  └── 无 → 雷达图全 0，文本为空，等用户点击
            ↓
        用户点"分析构图"
            ↓
        analyze() → 清空旧数据 → POST 请求
            ↓
        流式到达 → 雷达图分数逐步更新 → 文本逐字出现
            ↓
        流结束 → 存库 → 下次进页面直接读缓存
```

---

## 七、踩过的坑

### 7.1 SVG 标签被裁剪

**现象**：雷达图边缘的文字显示不全。

**原因**：SVG 默认 `overflow: hidden`，标签在 viewBox 边界外的部分被裁掉。

**解决**：加 `style="overflow: visible"`。

### 7.2 流式 JSON 解析失败

**现象**：控制台一堆 JSON parse error。

**原因**：流式传输中 JSON 是逐字到达的，`{"radar":{"构图` 当然 parse 不了。

**解决**：用 try-catch 包住 parse，失败就跳过，等下一块数据到了再试。只有 `fullContent.includes('---')` 时才尝试解析，说明 JSON 部分已经完整了。

### 7.3 分隔符出现在分析文本里

**现象**：分析文本被截断。

**原因**：AI 在分析文本里也用了 `---`（比如列表分隔）。

**解决**：用 `parts.slice(1).join('---')` 而不是 `parts[1]`，把后面所有 `---` 都拼回去。

---

## 八、雷达图动画：从中心展开

分数从 0 渐变到目标值，不是瞬间跳变，而是用 `requestAnimationFrame` 逐帧插值。

### 8.1 核心思路

SVG 的 `<polygon>` 没法直接做 CSS transition，所以用一个本地的 `animatedValues` 数组存当前动画值，每帧更新，computed 属性自动重新计算多边形坐标。

```js
const animatedValues = ref(props.data.map(() => 0))  // 初始全 0

// 缓动函数：先快后慢
const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3)

const DURATION = 800  // 动画时长 800ms

watch(() => props.data, (newData) => {
  const startValues = [...animatedValues.value]        // 起始值
  const targetValues = newData.map(d => d.value)       // 目标值
  const startTime = performance.now()

  const animate = (now) => {
    const elapsed = now - startTime
    const progress = Math.min(elapsed / DURATION, 1)   // 0 → 1
    const eased = easeOutCubic(progress)               // 缓动后的进度

    // 线性插值：start + (target - start) * progress
    animatedValues.value = startValues.map((start, i) =>
      start + (targetValues[i] - start) * eased
    )

    if (progress < 1) requestAnimationFrame(animate)
  }

  requestAnimationFrame(animate)
}, { deep: true })
```

### 8.2 为什么用 requestAnimationFrame 而不是 CSS transition？

- SVG polygon 的 `points` 属性不支持 CSS transition
- `requestAnimationFrame` 可以精确控制每一帧的值，实现多边形"展开"的效果
- 800ms + easeOutCubic 的组合感觉最自然：快速展开，然后缓缓停住

### 8.3 数据流向

```
props.data 变化
    ↓
watch 触发 → 记录 startValues，启动 rAF 循环
    ↓
每帧更新 animatedValues（ref）
    ↓
computed dataPoints 自动重算（读 animatedValues 而非 props.data）
    ↓
SVG polygon 和 circle 自动重绘
```

模板里多边形和圆圈都绑定 `animatedValues`，标签还是读原始 `props.data`（标签文字不需要动画）：

```html
<!-- 数据区域：用动画值 -->
<polygon :points="dataPoints" />

<!-- 数据点：用动画值 -->
<circle v-for="(item, i) in animatedData" :cx="..." :cy="..." />

<!-- 标签：用原始值 -->
<text v-for="(item, i) in data">{{ item.label }}</text>
```

---

## 九、可优化的方向

- **维度可配置**：现在 6 个维度是写死的，可以让 AI 自定义维度
- **多模型对比**：同一张照片用不同模型分析，对比评分差异
- **历史趋势**：同一张照片多次分析，看分数变化
- **批量分析**：一次请求分析多张照片，减少 API 调用次数
