<script setup lang="ts">
interface Props {
  avatar?: string
  name?: string
  bio?: string
  skills?: string[]
  github?: string
}

withDefaults(defineProps<Props>(), {
  avatar: '',
  name: 'Cai Xining',
  bio: '全栈工程师、开源贡献者与架构探索者。我致力于构建高性能的分布式系统与极致的前端渲染体验，在人机交互的工程化实践中寻找技术与艺术的平衡点。目前专注于云原生架构演进及新一代 Web 技术的探索。',
  skills: () => ['python', 'C/C++', 'MySQL', 'HTML5', 'CSS3', 'JavaScript', 'ArkTs', 'TypeScript', 'VUE3', 'Node.js', 'Express', 'MongoDB'],
  github: 'github.com/aiaod1009',
})
</script>

<template>
  <section class="mb-16">
    <div
      class="tonal-card p-8 rounded-lg border border-slate-100 flex flex-col md:flex-row items-center md:items-start gap-10">
      <!-- 头像 -->
      <div
        class="w-60 h-60 md:w-60 md:h-60 rounded-xl overflow-hidden shrink-0 border-2 border-surface-container shadow-sm">
        <img v-if="avatar" :alt="name" class="w-full h-full object-cover" :src="avatar" />
        <div v-else class="w-full h-full bg-surface-container flex items-center justify-center">
          <span class="material-symbols-outlined text-4xl text-on-surface-variant">person</span>
        </div>
      </div>

      <!-- 介绍 -->
      <div class="flex-1 text-center md:text-left mt-6">
        <div class="flex flex-col md:flex-row md:items-center gap-2 mb-3">
          <h4 class="font-mono text-secondary text-lg">&gt; Hello World, I'm {{ name }}</h4>
        </div>
        <p class="font-body-lg text-body-lg text-on-surface-variant mb-6 max-w-2xl">{{ bio }}</p>
        <div class="flex flex-wrap gap-2 justify-center md:justify-start">
          <span v-for="skill in skills" :key="skill"
            class="font-mono text-[11px] px-2 py-1 bg-surface-container rounded border border-outline-variant text-on-surface-variant uppercase">
            {{ skill }}
          </span>
        </div>
      </div>

      <!-- GitHub 链接 -->
      <div v-if="github" class="hidden lg:flex flex-col items-end gap-2 shrink-0">
        <a class="flex items-center gap-2 text-on-surface-variant hover:text-secondary transition-colors"
          :href="`https://${github}`" target="_blank">
          <span class="font-mono text-sm">{{ github }}</span>
          <span class="material-symbols-outlined text-base">terminal</span>
        </a>
      </div>
    </div>
  </section>
</template>
