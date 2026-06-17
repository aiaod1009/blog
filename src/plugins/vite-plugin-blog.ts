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
    let highlighted: string
    if (lang && hljs.getLanguage(lang)) {
      try {
        highlighted = hljs.highlight(str, { language: lang }).value
      } catch (_) {
        highlighted = md.utils.escapeHtml(str)
      }
    } else {
      highlighted = md.utils.escapeHtml(str)
    }

    // 添加行号
    const lines = highlighted.split('\n')
    const lineNumbers = lines.map((_, i) => `<span class="line-number">${i + 1}</span>`).join('')
    const codeLines = lines.map((line) => `<span class="code-line">${line}</span>`).join('\n')

    return `<pre class="hljs"><div class="code-header"><span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span></div><div class="code-body"><div class="line-numbers">${lineNumbers}</div><code>${codeLines}</code></div></pre>`
  },
})

// 给标题标签注入 id 属性
md.renderer.rules.heading_open = (tokens, idx) => {
  const token = tokens[idx]
  const level = token.tag
  // 下一个 token 是 inline 内容
  const inlineToken = tokens[idx + 1]
  const text = inlineToken?.children?.reduce((acc: string, t: any) => acc + t.content, '') || ''
  const id = text
    .toLowerCase()
    .replace(/[^\w一-鿿]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
  return `<${level} id="${id}">`
}

export interface TocItem {
  id: string
  text: string
  level: number
}

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
  toc: TocItem[]
}

function extractToc(html: string): TocItem[] {
  const regex = /<h([23])\s+id="([^"]*)">(.*?)<\/h[23]>/g
  const toc: TocItem[] = []
  let match
  while ((match = regex.exec(html)) !== null) {
    const text = match[3].replace(/<[^>]+>/g, '')
    toc.push({ level: parseInt(match[1]), id: match[2], text })
  }
  return toc
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
    const toc = extractToc(html)
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
      toc,
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

  const toc = extractToc(html)

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
    toc,
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
