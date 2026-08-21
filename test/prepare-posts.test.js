"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const path = require("node:path");

const {
  prepareContent,
  rewriteLocalImages,
  titleAndCategory
} = require("../scripts/prepare-posts");

test("plain Markdown receives stable Hexo metadata", () => {
  const filePath = path.join("source", "_posts", "[技术]逆向笔记.md");
  const content = "# 第一篇逆向笔记\n\n这里是文章摘要。\n\n## 正文\n\n内容。\n";
  const result = prepareContent({
    filePath,
    content,
    date: "2026-08-21T20:46:55+08:00",
    assetIndex: new Map()
  });

  assert.equal(result.addedMetadata, true);
  assert.equal(result.title, "第一篇逆向笔记");
  assert.equal(result.category, "技术");
  assert.match(result.content, /^---\ntitle: "第一篇逆向笔记"/);
  assert.match(result.content, /date: 2026-08-21 20:46:55/);
  assert.match(result.content, /description: "这里是文章摘要。"/);
  assert.match(result.content, /  - "技术"/);
});

test("existing front matter is not duplicated", () => {
  const content = "---\ntitle: 已有文章\ndate: 2026-08-21 10:00:00\n---\n\n正文\n";
  const result = prepareContent({
    filePath: "已有文章.md",
    content,
    date: "2026-08-21T20:46:55+08:00",
    assetIndex: new Map()
  });

  assert.equal(result.addedMetadata, false);
  assert.equal(result.content, content);
  assert.equal((result.content.match(/^---$/gm) || []).length, 2);
});

test("local Typora image is changed to an uploaded web path", () => {
  const assetIndex = new Map([
    ["example.png", ["/uploads/images/example.png"]]
  ]);
  const result = rewriteLocalImages(
    "![示例](C:\\Users\\me\\AppData\\Roaming\\Typora\\example.png)",
    assetIndex
  );

  assert.equal(result.content, "![示例](/uploads/images/example.png)");
  assert.equal(result.rewrittenImages, 1);
  assert.deepEqual(result.warnings, []);
});

test("missing local image is preserved and reported", () => {
  const content = "![缺失](C:\\Users\\me\\missing.png)";
  const result = rewriteLocalImages(content, new Map());

  assert.equal(result.content, content);
  assert.equal(result.rewrittenImages, 0);
  assert.equal(result.warnings.length, 1);
});

test("category prefix is optional", () => {
  assert.deepEqual(titleAndCategory("普通文章.md", "正文"), {
    title: "普通文章",
    category: "未分类"
  });
  assert.deepEqual(titleAndCategory("【自创文】雨夜.md", "正文"), {
    title: "雨夜",
    category: "自创文"
  });
});
