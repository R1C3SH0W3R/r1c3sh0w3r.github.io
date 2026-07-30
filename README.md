# 绯野のblog

这是从原 Nginx 单页博客迁移而来的 Hexo 项目，保留了动态背景、蕾姆 Live2D、鼠标拖尾和点击特效。

## 在网页后台发文章

项目根目录的 `.pages.yml` 已配置 Pages CMS。完成首次授权后，以后不需要打开服务器或手写 Git 命令：

1. 打开 `https://app.pagescms.org/`，使用 GitHub 登录。
2. 安装 Pages CMS GitHub App，并只授权 `r1c3sh0w3r.github.io` 仓库。
3. 进入 `博客文章`，点击新建。
4. 填写标题、时间和摘要，并在分类栏中选择 `技术`、`生活` 或 `自创文`。
5. 正文编辑器可以直接上传图片；封面图、视频和视频封面也有独立上传栏。
6. 保存后 Pages CMS 会提交到 `main` 分支，GitHub Actions 随即自动发布。

图片会保存到 `source/uploads/images/`，视频会保存到 `source/uploads/videos/`。

## 留言系统

文章模板已经接入 giscus，但需要先在 GitHub 完成一次配置：

1. 在仓库 `Settings > General > Features` 中启用 `Discussions`。
2. 在 Discussions 中创建名为 `留言` 的分类。
3. 安装 giscus GitHub App，并授权当前仓库。
4. 在 `https://giscus.app/zh-CN` 生成配置，取得 `repo-id` 和 `category-id`。
5. 把两个编号填入 `themes/rem-dream/_config.yml`，再把 `enabled` 改为 `true`。

访客需要使用 GitHub 账号登录后留言；留言内容由 GitHub Discussions 保存和管理。

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
categories: 技术
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

在 Pages CMS 的“文章视频”栏上传较短的 MP4 或 WebM；手动维护时也可以把文件放到 `source/uploads/videos/`，然后在文章里写：

```html
<video controls preload="metadata" poster="/uploads/images/video-cover.jpg">
  <source src="/uploads/videos/example.mp4" type="video/mp4">
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
