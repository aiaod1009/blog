---
title: "多版本照片系统：如何优雅地选择「主图」展示"
date: "2026-06-13"
tags: ["MongoDB", "Vue", "数据库设计", "全栈"]
description: "一个摄影师上传了一张原图，又调了三个版本——日系、黑白、赛博朋克。瀑布流里该展示哪张？"
readTime: "8 min"
---

# 多版本照片系统：如何优雅地选择「主图」展示

> 一个摄影师上传了一张原图，又调了三个版本——日系、黑白、赛博朋克。瀑布流里该展示哪张？

## 起因

在做一个摄影作品集网站时，我遇到了一个实际问题：每张照片可能有多个后期版本，但瀑布流、作品集这些展示页面只能显示一张图。用户需要自己决定「哪个版本对外展示」。

听起来简单，但要做好并不 trivial。

## 数据结构：自引用的设计

照片和版本存在同一个 MongoDB Collection 里，用 `parentId` 自引用：

```js
// Photo Schema
{
  imageUrl: String,           // 图片地址
  parentId: ObjectId,         // null = 原图，有值 = 指向原图的衍生版本
  versionName: String,        // "原图" / "日系清新" / "黑白版"
  status: 'raw' | 'master',   // 原图 or 衍生版
  isDraft: Boolean,           // 草稿不展示
}
```

查询某张照片的所有版本：

```js
// 找原图
const originalId = photo.parentId || photo._id
// 查所有衍生版本
const versions = await Photo.find({ parentId: originalId })
```

没有额外的 Version 表，没有复杂的关联查询，一个 `parentId` 搞定。

## 核心问题：展示版怎么存？

### 方案一：$lookup 关联查询（❌ 慢）

查询瀑布流时，用 MongoDB 的 `$lookup` 把原图和展示版关联起来：

```js
// 看起来很优雅，但每次查询都多一次关联
Photo.aggregate([
  { $match: { parentId: null } },
  { $lookup: {
      from: 'photos',
      localField: 'displayVersionId',
      foreignField: '_id',
      as: 'displayVersion'
  }},
  { $addFields: {
      imageUrl: { $ifNull: [{ $arrayElemAt: ['$displayVersion.imageUrl', 0] }, '$imageUrl'] }
  }}
])
```

**问题**：瀑布流一次查 20 张图，每张都 `$lookup` 一次，照片多了查询会明显变慢。

### 方案二：反规范化，冗余存储（✅ 最终方案）

在原图上直接存一份展示版的 `imageUrl`：

```js
// Photo Schema 新增两个字段
{
  displayVersionId: ObjectId,   // 指向展示版本
  displayImageUrl: String,      // 冗余存一份展示版的图片地址
}
```

用户设展示版时，后端同时写入两个字段：

```js
router.patch('/:id/display-version', async (req, res) => {
  const { versionId } = req.body
  const photo = await Photo.findById(req.params.id)

  if (!versionId) {
    // 取消展示版，恢复原图
    photo.displayVersionId = null
    photo.displayImageUrl = ''
  } else {
    const version = await Photo.findById(versionId)
    photo.displayVersionId = versionId
    photo.displayImageUrl = version.imageUrl  // 冗余存储
  }

  await photo.save()
})
```

查询时零成本：

```js
// 瀑布流查询 —— 只是读一个已有的字段
photos.map(p => ({
  src: p.displayImageUrl || p.imageUrl,  // 有展示版用展示版，没有用原图
}))
```

**读速度完全不变**，因为没有额外查询、没有 `$lookup`、没有关联。代价是写的时候多存一个字符串字段，这点开销可以忽略。

## 为什么不用「覆盖原图 imageUrl」？

有人会想：直接把原图的 `imageUrl` 改成展示版的不就行了？

不行。因为：

1. **原图不能丢** — 用户随时可能取消展示版，恢复原图
2. **版本详情页需要所有版本的原图** — 对比查看器要同时展示多个版本
3. **版本图片可能更新** — 如果用户重新上传某个版本，需要同步更新 `displayImageUrl`

冗余存储是最简单的平衡点。

## 前端交互：星标 + 确认弹窗

VersionCards 组件里，每张版本卡片右上角有一个星标按钮：

```html
<button class="display-btn" :class="{ 'is-display': isDisplay(v) }"
  @click.stop="onStarClick(v)">
  <!-- 实心星 = 当前展示版，空心星 = 普通版本 -->
  <svg v-if="isDisplay(v)">...</svg>
  <svg v-else>...</svg>
</button>

<!-- 点击后弹出确认 -->
<div v-if="confirmId === v._id" class="confirm-popover">
  <div class="confirm-text">设为主图？</div>
  <div class="confirm-hint">瀑布流和作品集将展示此版本</div>
  <button @click="confirmDisplay(v)">确定</button>
</div>
```

交互逻辑：

- **点击未选中的星** → 弹出确认框，确认后调 API
- **点击已选中的星（金色）** → 直接取消，无需确认
- **点击外部** → 自动关闭弹窗

```js
onStarClick(v) {
  if (this.isDisplay(v)) {
    // 已经是展示版，直接取消
    this.$emit('setDisplay', v.isOriginal ? null : v._id)
  } else {
    // 弹出确认
    this.confirmId = v._id
  }
}
```

## 影响范围

改完之后，所有展示端自动生效，前端组件不用改：

| 展示端 | 改动方式 |
|---|---|
| 瀑布流 Waterfall | `src: p.displayImageUrl \|\| p.imageUrl` |
| 足迹地图 Footprints | 聚合管道 `$ifNull` |
| 作品集详情 GalleryDetail | 查询后覆盖 `imageUrl` |
| 手风琴 Archive | 封面图读取时替换 |

## 总结

多版本选主图的核心思路就是 **反规范化**：

- 用 `displayVersionId` 记录用户的选择
- 用 `displayImageUrl` 冗余存储展示图的地址
- 查询时 `displayImageUrl || imageUrl` 一行搞定
- 零额外查询，零性能损耗

有时候最朴素的「多存一个字段」比精巧的聚合管道更实用。
