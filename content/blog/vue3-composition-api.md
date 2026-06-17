---
title: Vue 3 Composition API 实战指南
date: 2026-06-15
tags: [Vue3, TypeScript, 前端]
description: 深入理解 Vue 3 Composition API 的核心概念，包括 ref、reactive、computed、watch 以及自定义 Hook 的最佳实践。
readTime: 8M
cover: ""
---

## 从 Options API 到 Composition API

Vue 3 引入的 Composition API 解决了 Options API 在大型组件中代码组织混乱的问题。逻辑关注点不再被强制分散到 data、methods、computed 等选项中。

## 核心响应式 API

### ref vs reactive

```typescript
import { ref, reactive } from 'vue'

// ref：适用于基本类型
const count = ref(0)
console.log(count.value) // 0

// reactive：适用于对象
const state = reactive({
  name: 'Julian',
  skills: ['Vue', 'TypeScript'],
})
```

### computed 计算属性

```typescript
import { computed } from 'vue'

const doubleCount = computed(() => count.value * 2)
```

### watch 侦听器

```typescript
import { watch } from 'vue'

watch(count, (newVal, oldVal) => {
  console.log(`count: ${oldVal} -> ${newVal}`)
})
```

## 自定义组合式函数

```typescript
// useFetch.ts
import { ref, onMounted } from 'vue'

export function useFetch<T>(url: string) {
  const data = ref<T | null>(null)
  const error = ref<Error | null>(null)
  const loading = ref(true)

  onMounted(async () => {
    try {
      const res = await fetch(url)
      data.value = await res.json()
    } catch (e) {
      error.value = e as Error
    } finally {
      loading.value = false
    }
  })

  return { data, error, loading }
}
```

## 总结

Composition API 让 Vue 的代码组织更加灵活，配合 TypeScript 能获得完整的类型推导。建议新项目统一使用 `<script setup>` + Composition API 风格。
