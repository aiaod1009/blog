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

## 三、SSE 流式传输

### 3.1 为什么用 SSE？

AI 分析需要 5-15 秒，如果等全部完成再返回，用户会看到长时间的 loading。SSE（Server-Sent Events）可以让前端实时显示 AI 的输出，体验更好。

### 3.2 后端实现

```js
// Express + SSE
app.post('/api/ai/analyze-composition', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')

  const stream = await aiClient.chat.completions.create({
    model: 'glm-4v',
    stream: true,
    messages: [{ role: 'user', content: [...] }]
  })

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content || ''
    res.write(`data: ${JSON.stringify({ content })}\n\n`)
  }

  res.end()
})
```

### 3.3 前端接收

```js
const eventSource = new EventSource('/api/ai/analyze-composition')

eventSource.onmessage = (event) => {
  const { content } = JSON.parse(event.data)
  // 解析 JSON 评分部分
  if (content.startsWith('{')) {
    const scores = JSON.parse(content)
    radarData.value = scores
  }
  // 追加文本分析
  analysisText.value += content
}
```

## 四、提示词工程

### 4.1 一条提示词，两种输出

关键技巧：让 AI 同时返回 JSON 评分和文本分析，用特殊分隔符区分。

```text
请分析这张照片的构图质量，返回以下格式：

{"composition": 85, "lighting": 72, "color": 90, "focus": 88, "emotion": 76}

---analysis---

（在此处写详细的构图分析文本）

要求：
1. JSON 部分必须是合法的 JSON
2. 分隔符必须是 ---analysis---
3. 分析文本使用 Markdown 格式
```

### 4.2 前端解析策略

```js
const parseStream = (content) => {
  const parts = content.split('---analysis---')
  if (parts.length === 2) {
    const scores = JSON.parse(parts[0].trim())
    const analysis = parts[1].trim()
    return { scores, analysis }
  }
  // 还没收到分隔符，暂时按 JSON 解析
  try {
    return { scores: JSON.parse(content), analysis: '' }
  } catch {
    return { scores: null, analysis: content }
  }
}
```

## 五、性能优化

### 5.1 缓存策略

AI 分析结果存入数据库，下次访问直接读缓存：

```js
// 检查缓存
const cached = await db.query(
  'SELECT * FROM composition_analysis WHERE photo_id = ?',
  [photoId]
)

if (cached) {
  return res.json(cached)
}

// 没有缓存，调用 AI
// ... SSE 流式传输 ...

// 流结束后存库
await db.query(
  'INSERT INTO composition_analysis (photo_id, scores, analysis) VALUES (?, ?, ?)',
  [photoId, scores, analysis]
)
```

### 5.2 防重复提交

用户快速点击多次分析按钮，会发起多个请求。用 AbortController 取消前一个：

```js
let controller = null

const analyze = async () => {
  if (controller) controller.abort()
  controller = new AbortController()
  
  const response = await fetch('/api/ai/analyze-composition', {
    signal: controller.signal
  })
}
```

## 六、总结

这个功能涉及多个技术点：
- **SVG 绑图**：极坐标转直角坐标，多边形绘制
- **SSE 流式传输**：实时显示 AI 输出
- **提示词工程**：结构化 + 非结构化输出的组合
- **缓存优化**：避免重复调用 AI

关键收获：AI 功能的用户体验很大程度上取决于流式传输的实现，而不是 AI 本身的速度。
