# aiaod' Blog

基于 Vue 3 + Vite + TypeScript + Tailwind CSS 的个人技术博客。

Markdown 文章通过 Vite 插件在构建时编译为 HTML，支持语法高亮、自动目录、标签分类、阅读时间等特性。

## 技术栈

| 类别 | 技术 |
|------|------|
| 框架 | Vue 3 + Vue Router |
| 构建 | Vite 8 |
| 语言 | TypeScript |
| 样式 | Tailwind CSS 4 |
| 内容 | Markdown (gray-matter + markdown-it + highlight.js) |
| 字体 | Inter / Source Serif 4 / JetBrains Mono |

## 项目结构

```
src/
├── components/          # 通用组件
│   ├── ArticleCard.vue  # 文章卡片
│   ├── HeroSection.vue  # 个人简介区
│   ├── Sidebar.vue      # 侧边栏
│   └── SiteFooter.vue   # 页脚
├── views/
│   ├── HomeView.vue     # 首页（文章列表 + 筛选）
│   └── PostView.vue     # 文章详情（含目录导航）
├── plugins/
│   └── vite-plugin-blog.ts  # 自定义 Vite 插件：编译 Markdown → HTML
├── router/
│   └── index.ts
├── style.css            # 全局样式 + 博客正文排版
├── App.vue
└── main.ts

content/
└── blog/                # Markdown 文章源文件
    ├── cos-direct-upload.md
    ├── svg-footprints-map.md
    └── ... (共 13 篇)
```

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览构建结果
npm run preview
```

## 文章管理

在 `content/blog/` 目录下创建 `.md` 文件，支持 YAML frontmatter：

```markdown
---
title: "文章标题"
date: "2026-05-22"
tags: ["Vue 3", "TypeScript"]
description: "文章摘要"
readTime: "5 min"
cover: "/image.png"    # 可选，首页文章卡片封面图
---

# 正文...
```

支持特性：

- **语法高亮** — highlight.js，VS Code Dark 配色
- **自动目录** — 正文右侧边栏，支持滚动追踪
- **标签筛选** — 首页按标签分类过滤
- **文章排序** — 按日期倒序排列
- **行号显示** — 代码块自动带行号
- **阅读时间** — 自定义显示

## 自定义主题

博客使用 Tailwind CSS 4 的设计令牌（Design Tokens），颜色、间距、字体等在 `src/style.css` 的 `@theme` 块中集中定义，可直接修改。
