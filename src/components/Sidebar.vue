<script setup lang="ts">
// 热门技术标签
const techTags = [
  'JavaScript', 'Node.js', 'Docker', 'GraphQL',
  'Next.js', 'Architecture', 'DevOps', 'Python',
  'Vue', 'TypeScript', 'Rust', 'Go',
]

// 开源项目
const projects = [
  {
    name: 'jvance/minimalist-engine',
    description: 'A lightweight static site generator optimized for typography.',
    lang: 'TypeScript',
    langColor: '#3178c6',
    stars: '1.2k',
  },
  {
    name: 'jvance/rust-grpc-kit',
    description: 'Experimental gRPC framework built with safety in mind.',
    lang: 'Rust',
    langColor: '#dea584',
    stars: '450',
  },
]

// 近期在读
const books = [
  { title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann' },
  { title: 'The Pragmatic Programmer', author: 'Andrew Hunt' },
]
</script>

<template>
  <aside class="lg:w-1/3 space-y-12">
    <!-- 热门技术 -->
    <div>
      <h4 class="font-headline-md text-headline-md mb-6 flex items-center gap-2">
        <span class="material-symbols-outlined text-secondary">label</span>
        热门技术
      </h4>
      <div class="flex flex-wrap gap-2">
        <a
          v-for="tag in techTags"
          :key="tag"
          class="font-mono text-xs px-3 py-1.5 bg-white border border-outline-variant rounded hover:border-secondary transition-colors"
          href="#"
        >
          #{{ tag }}
        </a>
      </div>
    </div>

    <!-- 开源项目 -->
    <div class="tonal-card p-6 border border-slate-100 rounded">
      <h4 class="font-headline-md text-[20px] mb-4 flex items-center gap-2">
        <span class="material-symbols-outlined text-secondary">terminal</span>
        我的开源项目
      </h4>
      <div class="space-y-4">
        <div v-for="(project, idx) in projects" :key="project.name" :class="idx > 0 ? 'pt-4 border-t border-outline-variant/30' : ''" class="group">
          <a class="block" href="#">
            <span class="font-mono text-sm font-bold block group-hover:text-secondary transition-colors">
              {{ project.name }}
            </span>
            <p class="text-xs text-on-surface-variant mt-1">{{ project.description }}</p>
            <div class="flex gap-3 mt-2 font-mono text-[10px] text-on-surface-variant">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: project.langColor }"></span>
                {{ project.lang }}
              </span>
              <span class="flex items-center gap-1">⭐ {{ project.stars }}</span>
            </div>
          </a>
        </div>
      </div>
      <a class="mt-6 block text-center font-mono text-[10px] text-secondary uppercase tracking-widest hover:underline" href="#">
        View Github Profile
      </a>
    </div>

    <!-- 近期在读 -->
    <div>
      <h4 class="font-headline-md text-[20px] mb-6 flex items-center gap-2">
        <span class="material-symbols-outlined text-secondary">menu_book</span>
        近期在读
      </h4>
      <div class="space-y-6">
        <div v-for="book in books" :key="book.title" class="flex items-start gap-3">
          <span class="material-symbols-outlined text-on-surface-variant text-lg mt-1">auto_stories</span>
          <div>
            <p class="font-bold text-sm text-on-surface">{{ book.title }}</p>
            <p class="text-xs text-on-surface-variant mt-0.5">{{ book.author }}</p>
          </div>
        </div>
      </div>
    </div>
  </aside>
</template>
