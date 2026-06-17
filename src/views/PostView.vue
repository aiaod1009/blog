<script setup lang="ts">
import { useRoute } from 'vue-router'
import { ref, onMounted, onUnmounted, nextTick } from 'vue'
import posts from 'virtual:blog-posts'

const route = useRoute()
const slug = route.params.slug as string

const post = ref<any>(null)
const loading = ref(true)
const activeId = ref('')

let observer: IntersectionObserver | null = null

onMounted(async () => {
  post.value = posts.find((p: any) => p.slug === slug) || null
  loading.value = false

  await nextTick()
  if (!post.value) return

  // Scroll spy：用 IntersectionObserver 监听标题进入视口
  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeId.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -70% 0px', threshold: 0 }
  )

  const headings = document.querySelectorAll('.blog-content h2, .blog-content h3')
  headings.forEach((h) => observer!.observe(h))
})

onUnmounted(() => {
  observer?.disconnect()
})

function scrollTo(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}

function formatDate(date: string) {
  return date.replace(/-/g, '.')
}
</script>

<template>
  <main class="max-w-container-max mx-auto px-margin-mobile md:px-margin-desktop py-12">
    <!-- 加载中 -->
    <div v-if="loading" class="text-center py-20">
      <span class="font-mono text-on-surface-variant">Loading...</span>
    </div>

    <!-- 文章不存在 -->
    <div v-else-if="!post" class="text-center py-20">
      <h2 class="font-headline-lg text-headline-lg mb-4">404</h2>
      <p class="text-on-surface-variant">文章不存在</p>
      <router-link to="/" class="text-secondary font-mono text-sm mt-4 inline-block hover:underline">
        ← 返回首页
      </router-link>
    </div>

    <!-- 文章内容 -->
    <div v-else class="flex gap-12">
      <!-- 左侧目录 -->
      <aside
        v-if="post.toc && post.toc.length > 0"
        class="hidden lg:block w-64 shrink-0 sticky top-24 self-start"
      >
        <nav>
          <h4 class="font-mono text-sm font-semibold text-on-surface uppercase tracking-widest mb-6">目录</h4>
          <ul class="space-y-3 border-l-2 border-outline-variant">
            <li v-for="item in post.toc" :key="item.id">
              <button
                @click="scrollTo(item.id)"
                class="block w-full text-left text-sm leading-relaxed transition-all duration-200 border-l-2 -ml-[2px] hover:text-secondary hover:border-secondary/50"
                :class="[
                  activeId === item.id
                    ? 'text-secondary border-secondary font-semibold'
                    : 'text-on-surface-variant border-transparent font-normal',
                  item.level === 3 ? 'pl-6' : 'pl-4'
                ]"
              >
                {{ item.text }}
              </button>
            </li>
          </ul>
        </nav>
      </aside>

      <!-- 右侧文章 -->
      <article class="flex-1 min-w-0">
        <!-- 返回链接 -->
        <router-link to="/" class="inline-flex items-center gap-1 text-on-surface-variant hover:text-secondary font-mono text-xs mb-8 transition-colors">
          <span class="material-symbols-outlined text-base">arrow_back</span>
          返回文章列表
        </router-link>

        <!-- 文章头 -->
        <header class="mb-12">
          <div class="flex flex-wrap items-center gap-2 mb-4">
            <span
              v-for="tag in post.tags"
              :key="tag"
              class="font-mono text-[10px] text-on-surface-variant bg-surface-container px-1.5 py-0.5 rounded"
            >
              #{{ tag }}
            </span>
          </div>
          <h1 class="font-headline-xl text-headline-xl mb-4">{{ post.title }}</h1>
          <div class="flex items-center gap-4 text-on-surface-variant">
            <span class="font-mono text-xs">{{ formatDate(post.date) }}</span>
            <span class="w-1 h-1 bg-outline-variant rounded-full"></span>
            <span v-if="post.readTime" class="font-mono text-xs">READ: {{ post.readTime }}</span>
          </div>
        </header>

        <!-- 文章正文 -->
        <div class="blog-content" v-html="post.html"></div>
      </article>
    </div>
  </main>
</template>
