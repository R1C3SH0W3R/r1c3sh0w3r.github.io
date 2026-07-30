# 绯野のblog

这是从原 Nginx 单页博客迁移而来的 Hexo 项目，保留了动态背景、蕾姆 Live2D、鼠标拖尾和点击特效。

## 本机预览

在 PowerShell 中进入项目目录：

```powershell
npm install
npm run server
```

然后访问 `http://localhost:4000/`。

## 新建文章

```powershell
npm run new -- "文章标题"
```

新文章会出现在 `source/_posts/文章标题.md`。编辑完成后，重新执行 `npm run server` 预览即可。

文章开头的 `description` 会显示在首页摘要中：

```yaml
---
title: 文章标题
date: 2026-07-30 18:00:00
description: 这是一段首页摘要。
categories:
  - 学习记录
tags:
  - Linux
---
```

## 文章中加入图片

项目已启用 `post_asset_folder`。新建文章后会同时产生同名资源目录，例如：

```text
source/_posts/我的文章.md
source/_posts/我的文章/example.jpg
```

在 Markdown 中引用：

```markdown
{% asset_img example.jpg 图片说明 %}
```

## 文章中加入视频

把体积较小的 MP4 放到 `source/media/`，然后在文章里写：

```html
<video controls preload="metadata" poster="/media/video-cover.jpg">
  <source src="/media/example.mp4" type="video/mp4">
</video>
```

较大的视频建议上传到专业视频平台后嵌入，避免博客加载缓慢。

## 发布到 GitHub Pages

1. 在 GitHub 创建名为 `你的用户名.github.io` 的仓库。
2. 把 `_config.yml` 中的 `USERNAME` 改成你的 GitHub 用户名。
3. 把本项目提交并推送到仓库的 `main` 分支。
4. 打开仓库 `Settings > Pages`，将 `Source` 选择为 `GitHub Actions`。
5. 等待仓库顶部 `Actions` 中的部署任务完成。

发布后访问：`https://你的用户名.github.io/`。

## 常用命令

```powershell
npm run clean
npm run build
npm run server
```

不要提交 `node_modules/` 和 `public/`；它们已经写入 `.gitignore`。
