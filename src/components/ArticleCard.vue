<script setup lang="ts">
interface Props {
  slug: string
  title: string
  date: string
  tags: string[]
  description: string
  category?: string
  readTime?: string
  cover?: string
}

const props = withDefaults(defineProps<Props>(), {
  category: '',
  readTime: '',
  cover: '',
})

// 格式化日期：2026-06-17 -> 2026.06.17
const formattedDate = props.date.replace(/-/g, '.')
</script>

<template>
  <router-link
    :to="`/blog/${slug}`"
    class="group article-card flex flex-col md:flex-row gap-5 transition-all duration-700 pb-6 mb-6 border-b border-outline-variant"
  >
    <!-- 缩略图 -->
    <div v-if="cover" class="shrink-0 md:w-44">
      <div class="overflow-hidden aspect-square mb-3 md:mb-0">
        <img
          :alt="title"
          class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          :src="cover"
        />
      </div>
    </div>

    <!-- 内容 -->
    <div class="flex-1">
      <div class="flex flex-wrap items-center gap-2 mb-2">
        <span
          v-if="category"
          class="font-mono text-[10px] text-secondary border border-secondary px-1.5 py-0.5 rounded uppercase"
        >
          {{ category }}
        </span>
        <span
          v-for="tag in tags"
          :key="tag"
          class="font-mono text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded"
        >
          #{{ tag }}
        </span>
      </div>
      <h3 class="font-headline-md text-[20px] mb-2 group-hover:text-secondary transition-colors">
        {{ title }}
      </h3>
      <p class="font-body-md text-sm text-on-surface-variant mb-3 line-clamp-2">
        {{ description }}
      </p>
      <div class="flex items-center gap-4 text-on-surface-variant">
        <span class="font-mono text-xs">{{ formattedDate }}</span>
        <span class="w-1 h-1 bg-outline-variant rounded-full"></span>
        <span v-if="readTime" class="font-mono text-xs">READ: {{ readTime }}</span>
      </div>
    </div>
  </router-link>
</template>
