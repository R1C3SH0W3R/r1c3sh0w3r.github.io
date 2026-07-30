---
title: Ubuntu 服务器常用命令记录
date: 2026-07-30 10:30:00
description: 整理一些曾经维护 Ubuntu 与 Nginx 时用到的常见检查命令，留作日后查阅。
categories:
  - Linux
tags:
  - Ubuntu
  - Nginx
---

服务器维护中，先观察状态，再做修改，通常会更加稳妥。

<!-- more -->

## 查看服务状态

```bash
systemctl status nginx --no-pager
systemctl status ssh --no-pager
```

## 检查 Nginx 配置

```bash
nginx -t
```

## 查看磁盘与内存

```bash
df -h
free -h
```

这些命令不会替代备份，但能帮助我们先弄清楚问题所在。
