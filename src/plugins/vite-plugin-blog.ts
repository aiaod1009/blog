import fs from 'node:fs'
import path from 'node:path'
import matter from 'gray-matter'
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const VIRTUAL_MODULE_ID = 'virtual:blog-posts'
const RESOLVED_VIRTUAL_MODULE_ID = '\0' + VIRTUAL_MODULE_ID

// markdown-it 实例，配置 highlight.js
const md: MarkdownIt = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight(str: string, lang: string): string {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return `<pre class="hljs"><code>${hljs.highlight(str, { language: lang }).value}</code></pre>`
      } catch (_) {}
    }
    return `<pre class="hljs"><code>${md.utils.escapeHtml(str)}</code></pre>`
  },
})

export interface BlogPostMeta {
  slug: string
  title: string
  date: string
  tags: string[]
  description: string
  cover?: string
  readTime?: string
}

export interface BlogPost extends BlogPostMeta {
  html: string
  content: string
}

function getBlogDir() {
  return path.resolve(process.cwd(), 'content/blog')
}

function parseAllPosts(): BlogPost[] {
  const blogDir = getBlogDir()
  if (!fs.existsSync(blogDir)) return []

  const files = fs.readdirSync(blogDir).filter((f: string) => f.endsWith('.md'))

  const posts: BlogPost[] = files.map((file: string) => {
    const slug = file.replace(/\.md$/, '')
    const raw = fs.readFileSync(path.join(blogDir, file), 'utf-8')
    const { data, content } = matter(raw)
    const html = md.render(content)
    return {
      slug,
      title: data.title || slug,
      date: data.date || '',
      tags: data.tags || [],
      description: data.description || '',
      cover: data.cover || '',
      readTime: data.readTime || '',
      html,
      content,
    }
  })

  // 按日期倒序
  posts.sort((a, b) => (b.date > a.date ? 1 : -1))
  return posts
}

function parsePost(slug: string): BlogPost | null {
  const filePath = path.join(getBlogDir(), `${slug}.md`)
  if (!fs.existsSync(filePath)) return null

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(raw)
  const html = md.render(content)

  return {
    slug,
    title: data.title || slug,
    date: data.date || '',
    tags: data.tags || [],
    description: data.description || '',
    cover: data.cover || '',
    readTime: data.readTime || '',
    html,
    content,
  }
}

export default function blogPlugin() {
  return {
    name: 'vite-plugin-blog',

    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_MODULE_ID
      if (id.startsWith('virtual:blog-post/')) return '\0' + id
    },

    load(id: string) {
      // 虚拟模块：返回所有文章列表
      if (id === RESOLVED_VIRTUAL_MODULE_ID) {
        const posts = parseAllPosts()
        return `export default ${JSON.stringify(posts)}`
      }

      // 虚拟模块：返回单篇文章（含 html）
      if (id.startsWith('\0virtual:blog-post/')) {
        const slug = id.replace('\0virtual:blog-post/', '')
        const post = parsePost(slug)
        if (!post) return `export default null`
        return `export default ${JSON.stringify(post)}`
      }
    },

    // HMR：监听 content/blog 目录变化
    handleHotUpdate({ file, server }: { file: string; server: any }) {
      const blogDir = getBlogDir().replace(/\\/g, '/')
      const normalizedFile = file.replace(/\\/g, '/')
      if (normalizedFile.startsWith(blogDir)) {
        server.ws.send({ type: 'full-reload' })
        return []
      }
    },
  }
}
