/// <reference types="vite/client" />

interface TocItem {
  id: string
  text: string
  level: number
}

interface BlogPostMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  description: string
  cover?: string
  readTime?: string
}

interface BlogPost extends BlogPostMeta {
  html: string
  content: string
  toc: TocItem[]
}

declare module 'virtual:blog-posts' {
  const posts: BlogPost[]
  export default posts
}
