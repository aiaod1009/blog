<script setup lang="ts">
import { ref } from 'vue'

interface Post {
  id: number
  title: string
  date: string
  tags: string[]
  description: string
}

const featuredPost = ref<Post>({
  id: 1,
  title: "探索前端美学：用 Vue 3 与 Tailwind 打造极致视觉",
  date: "2026-06-17",
  tags: ["Vue3", "TypeScript", "Tailwind"],
  description: "这是我的第一篇技术博客。不写繁琐的传统 CSS，直接在 HTML 中用原子化类名堆砌出设计师级别的精致卡片..."
})
</script>

<template>
  <div class="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
    <div
      class="max-w-md w-full bg-slate-900/50 backdrop-blur-md p-6 rounded-2xl border border-slate-800 shadow-2xl transition-all duration-300 hover:-translate-y-1 hover:border-blue-500/50 group">
      <div class="flex gap-2 mb-4">
        <span v-for="tag in featuredPost.tags" :key="tag"
          class="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
          {{ tag }}
        </span>
      </div>
      <h2 class="text-xl font-bold mb-2 group-hover:text-blue-400 transition-colors">
        {{ featuredPost.title }}
      </h2>
      <p class="text-xs text-slate-500 mb-4">{{ featuredPost.date }}</p>
      <p class="text-sm text-slate-400 leading-relaxed">
        {{ featuredPost.description }}
      </p>
      <div
        class="mt-6 flex items-center justify-end text-sm text-blue-400 font-medium group-hover:translate-x-1 transition-transform">
        阅读全文 →
      </div>
    </div>
  </div>
</template>