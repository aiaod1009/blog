---
title: Hello World：用 Vue 3 搭建个人博客
date: 2026-06-17
tags: [Vue3, TypeScript, Tailwind]
description: 这是我的第一篇技术博客，记录如何用 Vue 3 + TypeScript + Tailwind CSS 搭建一个极简风格的个人博客网站。
readTime: 5M
cover: ""
---

## 为什么写博客？

技术博客是记录学习过程、沉淀思考的最佳方式之一。相比于碎片化的笔记，一篇完整的博客能帮助你把一个知识点从头到尾梳理清楚。

## 技术栈选择

这个博客使用了以下技术栈：

- **Vue 3** — 响应式框架，Composition API 写起来很舒服
- **TypeScript** — 类型安全，减少运行时错误
- **Tailwind CSS v4** — 原子化 CSS，快速构建 UI
- **Vite 8** — 极速的开发体验

## 代码示例

一个简单的 Vue 3 组件：

```vue
<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)

function increment() {
  count.value++
}
</script>

<template>
  <button @click="increment">
    点击了 {{ count }} 次
  </button>
</template>
```

TypeScript 的类型定义：

```typescript
interface BlogPost {
  slug: string
  title: string
  date: string
  tags: string[]
  description: string
}

function getPosts(): BlogPost[] {
  return posts.sort((a, b) =>
    b.date > a.date ? 1 : -1
  )
}
```

## 下一步计划

1. 完善文章详情页的排版样式
2. 添加代码块的语法高亮
3. 支持标签筛选功能
4. 部署到 GitHub Pages

> 写作是最好的学习方式。如果你也在学习前端，不妨试试搭建自己的博客。
