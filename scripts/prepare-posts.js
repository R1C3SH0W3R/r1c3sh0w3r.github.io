"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const CATEGORY_PREFIX = /^(?:\[|【)(技术|生活|自创文)(?:\]|】)[\s._-]*(.+)$/u;
const LOCAL_IMAGE_PATH = /^(?:file:\/\/\/?|[a-zA-Z]:[\\/])/;

function walkFiles(directory, predicate) {
  if (!fs.existsSync(directory)) {
    return [];
  }

  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return walkFiles(fullPath, predicate);
    }
    return predicate(fullPath) ? [fullPath] : [];
  });
}

function hasFrontMatter(content) {
  return /^---[\t ]*(?:\r?\n|$)/.test(content.replace(/^\uFEFF/, ""));
}

function cleanInlineMarkdown(value) {
  return value
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/[`*_~]/g, "")
    .replace(/\\([#\-[\]()])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function titleAndCategory(filePath, content) {
  const rawBaseName = path.basename(filePath, path.extname(filePath));
  const prefixMatch = rawBaseName.match(CATEGORY_PREFIX);
  const fallbackTitle = prefixMatch ? prefixMatch[2].trim() : rawBaseName;
  const category = prefixMatch ? prefixMatch[1] : "未分类";
  const heading = content.match(/^\s{0,3}#\s+(.+?)\s*#*\s*$/m);
  const title = cleanInlineMarkdown(heading ? heading[1] : fallbackTitle) || fallbackTitle;

  return { title, category };
}

function descriptionFrom(content, title) {
  const withoutCode = content.replace(/```[\s\S]*?```/g, " ");
  const paragraphs = withoutCode
    .replace(/<!--([\s\S]*?)-->/g, " ")
    .split(/\r?\n\s*\r?\n/)
    .map((paragraph) => paragraph
      .replace(/^\s{0,3}#{1,6}\s+.*$/gm, " ")
      .replace(/^\s*(?:[-+*]|\d+[.)])\s+/gm, " ")
      .replace(/!\[[^\]]*\]\([^)]+\)/g, " "))
    .map(cleanInlineMarkdown)
    .filter(Boolean);
  const description = paragraphs.find((paragraph) => paragraph !== title) || `关于《${title}》的文章。`;

  return description.length > 140 ? `${description.slice(0, 137)}...` : description;
}

function yamlString(value) {
  return JSON.stringify(String(value));
}

function formatDateForHexo(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "1970-01-01 00:00:00";
  }

  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23"
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day} ${values.hour}:${values.minute}:${values.second}`;
}

function gitDateFor(filePath, repositoryRoot) {
  const relativePath = path.relative(repositoryRoot, filePath).split(path.sep).join("/");
  const commands = [
    ["log", "--follow", "--diff-filter=A", "--format=%aI", "--", relativePath],
    ["log", "-1", "--format=%aI", "--", relativePath],
    ["show", "-s", "--format=%aI", "HEAD"]
  ];

  for (const args of commands) {
    const result = spawnSync("git", args, {
      cwd: repositoryRoot,
      encoding: "utf8",
      windowsHide: true
    });
    const dates = result.status === 0 ? result.stdout.trim().split(/\r?\n/).filter(Boolean) : [];
    if (dates.length) {
      return dates[dates.length - 1];
    }
  }

  return process.env.SOURCE_DATE_EPOCH
    ? new Date(Number(process.env.SOURCE_DATE_EPOCH) * 1000).toISOString()
    : new Date().toISOString();
}

function buildAssetIndex(imagesDirectory, sourceRoot) {
  const index = new Map();

  for (const filePath of walkFiles(imagesDirectory, () => true)) {
    const key = path.basename(filePath).toLocaleLowerCase("en-US");
    const webPath = `/${path.relative(sourceRoot, filePath).split(path.sep).join("/")}`;
    const entries = index.get(key) || [];
    entries.push(webPath);
    index.set(key, entries);
  }

  return index;
}

function rewriteLocalImages(content, assetIndex) {
  const warnings = [];
  let rewrittenImages = 0;
  const output = content.replace(/!\[([^\]]*)\]\(([^)\r\n]+)\)/g, (match, alt, rawTarget) => {
    const target = rawTarget.trim().replace(/^<|>$/g, "");
    if (!LOCAL_IMAGE_PATH.test(target)) {
      return match;
    }

    const normalizedTarget = target.replace(/^file:\/\/\/?/i, "").replace(/\\/g, "/");
    const fileName = path.posix.basename(normalizedTarget);
    const candidates = assetIndex.get(fileName.toLocaleLowerCase("en-US")) || [];

    if (candidates.length === 1) {
      rewrittenImages += 1;
      return `![${alt}](${candidates[0]})`;
    }

    warnings.push(candidates.length > 1
      ? `图片 ${fileName} 存在多个同名上传文件，无法自动选择。`
      : `找不到本机图片 ${fileName}，请把它上传到 source/uploads/images/。`);
    return match;
  });

  return { content: output, rewrittenImages, warnings };
}

function prepareContent({ filePath, content, date, assetIndex }) {
  const withoutBom = content.replace(/^\uFEFF/, "");
  const imageResult = rewriteLocalImages(withoutBom, assetIndex);

  if (hasFrontMatter(imageResult.content)) {
    return {
      ...imageResult,
      content: imageResult.content,
      addedMetadata: false
    };
  }

  const { title, category } = titleAndCategory(filePath, imageResult.content);
  const description = descriptionFrom(imageResult.content, title);
  const frontMatter = [
    "---",
    `title: ${yamlString(title)}`,
    `date: ${formatDateForHexo(date)}`,
    `description: ${yamlString(description)}`,
    "categories:",
    `  - ${yamlString(category)}`,
    "tags: []",
    "---",
    ""
  ].join("\n");

  return {
    ...imageResult,
    content: frontMatter + imageResult.content,
    addedMetadata: true,
    title,
    category
  };
}

function writeSummary(result) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  const lines = [
    "## Markdown 文章预处理",
    "",
    `- 扫描文章：${result.scanned}`,
    `- 自动补齐元数据：${result.prepared}`,
    `- 修正本机图片路径：${result.rewrittenImages}`,
    `- 图片警告：${result.warnings.length}`
  ];

  if (result.warnings.length) {
    lines.push("", "### 需要留意", "", ...result.warnings.map((warning) => `- ${warning}`));
  }

  fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, `${lines.join("\n")}\n`, "utf8");
}

function preparePosts(repositoryRoot = path.resolve(__dirname, "..")) {
  const sourceRoot = path.join(repositoryRoot, "source");
  const postsRoot = path.join(sourceRoot, "_posts");
  const imagesRoot = path.join(sourceRoot, "uploads", "images");
  const assetIndex = buildAssetIndex(imagesRoot, sourceRoot);
  const files = walkFiles(postsRoot, (filePath) => path.extname(filePath).toLowerCase() === ".md");
  const result = { scanned: files.length, prepared: 0, rewrittenImages: 0, warnings: [] };

  for (const filePath of files) {
    const original = fs.readFileSync(filePath, "utf8");
    const prepared = prepareContent({
      filePath,
      content: original,
      date: gitDateFor(filePath, repositoryRoot),
      assetIndex
    });

    if (prepared.content !== original) {
      fs.writeFileSync(filePath, prepared.content, "utf8");
    }
    if (prepared.addedMetadata) {
      result.prepared += 1;
      console.log(`[文章] 已自动补齐：${path.relative(postsRoot, filePath)}（${prepared.category}）`);
    }
    if (prepared.rewrittenImages) {
      console.log(`[图片] 已修正 ${prepared.rewrittenImages} 处：${path.relative(postsRoot, filePath)}`);
    }

    result.rewrittenImages += prepared.rewrittenImages;
    result.warnings.push(...prepared.warnings.map((warning) => `${path.relative(postsRoot, filePath)}：${warning}`));
  }

  result.warnings.forEach((warning) => console.warn(`[警告] ${warning}`));
  console.log(`[完成] 扫描 ${result.scanned} 篇，补齐 ${result.prepared} 篇，修正 ${result.rewrittenImages} 处图片路径。`);
  writeSummary(result);
  return result;
}

if (require.main === module) {
  preparePosts();
}

module.exports = {
  buildAssetIndex,
  descriptionFrom,
  formatDateForHexo,
  hasFrontMatter,
  prepareContent,
  preparePosts,
  rewriteLocalImages,
  titleAndCategory
};
