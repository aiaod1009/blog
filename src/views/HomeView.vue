<script setup lang="ts">
import HeroSection from '../components/HeroSection.vue'
import ArticleCard from '../components/ArticleCard.vue'
import Sidebar from '../components/Sidebar.vue'
import posts from 'virtual:blog-posts'

// 分类筛选
import { ref, computed } from 'vue'

const activeFilter = ref('All')
const filters = ['All', 'Frontend', 'Backend']

const filteredPosts = computed(() => {
  if (activeFilter.value === 'All') return posts
  return posts.filter((p: any) =>
    p.tags.some((t: string) =>
      t.toLowerCase().includes(activeFilter.value.toLowerCase())
    )
  )
})
</script>

<template>
  <main class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
    <!-- Hero 区域 -->
    <HeroSection />

    <!-- 主体双栏 -->
    <div class="flex flex-col lg:flex-row gap-12">
      <!-- 文章列表 -->
      <div class="lg:w-2/3">
        <div class="mb-8 border-b border-outline-variant pb-4 flex justify-between items-end">
          <h2 class="font-headline-lg text-headline-lg">最新文章</h2>
          <div class="flex gap-4 mb-1">
            <button
              v-for="filter in filters"
              :key="filter"
              class="font-mono text-xs transition-colors"
              :class="activeFilter === filter
                ? 'text-secondary border-b border-secondary'
                : 'text-on-surface-variant hover:text-secondary'"
              @click="activeFilter = filter"
            >
              {{ filter }}
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8">
          <ArticleCard
            v-for="post in filteredPosts"
            :key="post.slug"
            v-bind="post"
          />
        </div>

        <div class="mt-16 text-center">
          <button class="px-8 py-3 border border-outline text-primary font-mono text-xs uppercase tracking-widest hover:bg-primary hover:text-white transition-all duration-300">
            View Archive / 归档
          </button>
        </div>
      </div>

      <!-- 侧边栏 -->
      <Sidebar />
    </div>
  </main>
</template>
