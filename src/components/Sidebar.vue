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
    name: 'chiaroscuro',
    description: '全栈摄影作品集平台，支持AI智能构图分析、足迹地图、暗房管理',
    lang: 'Vue 3 + Node.js',
    langColor: '#41b883',
    link: 'https://github.com/aiaod1009/chiaroscuro',
  },
  {
    name: 'algo-mind',
    description: '一站式算法学习平台，提供可视化算法演示、在线编程环境与个性化学习路径',
    lang: 'Vue 3 + java',
    langColor: '#f7df1e',
    link: 'https://github.com/aiaod1009/algo-mind',
  },
  {
    name: 'python-lanqiao',
    description: '蓝桥杯国赛二等奖题库，涵盖算法、数据结构、数学建模等，配有详细解析与代码实现',
    lang: 'Python',
    langColor: '#3776ab',
    link: 'https://github.com/aiaod1009/python-lanqiao',
  },
  {
    name: 'blgo',
    description: '个人博客系统，支持Markdown写作、主题定制与性能优化，专注于极简设计与优雅交互',
    lang: 'Vue 3 + TypeScript',
    langColor: '#41b883',
    link: 'https://github.com/aiaod1009/blgo',
  },
]
</script>

<template>
  <aside class="lg:w-1/3 space-y-12 lg:mt-16">
    <!-- 热门技术 -->
    <div>
      <h4 class="font-headline-md text-headline-md mb-6 flex items-center gap-2">
        <span class="material-symbols-outlined text-secondary">label</span>
        热门技术
      </h4>
      <div class="flex flex-wrap gap-2">
        <a v-for="tag in techTags" :key="tag"
          class="font-mono text-xs px-3 py-1.5 bg-white border border-outline-variant rounded hover:border-secondary transition-colors"
          href="#">
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
        <div v-for="(project, idx) in projects" :key="project.name"
          :class="idx > 0 ? 'pt-4 border-t border-outline-variant/30' : ''" class="group">
          <a class="block" :href="project.link" target="_blank">
            <span class="font-mono text-sm font-bold block group-hover:text-secondary transition-colors">
              {{ project.name }}
            </span>
            <p class="text-xs text-on-surface-variant mt-1">{{ project.description }}</p>
            <div class="flex gap-3 mt-2 font-mono text-[10px] text-on-surface-variant">
              <span class="flex items-center gap-1">
                <span class="w-2 h-2 rounded-full" :style="{ backgroundColor: project.langColor }"></span>
                {{ project.lang }}
              </span>
            </div>
          </a>
        </div>
      </div>
      <a class="mt-6 block text-center font-mono text-[10px] text-secondary uppercase tracking-widest hover:underline"
        href="#">
        View Github Profile
      </a>
    </div>
  </aside>
</template>
