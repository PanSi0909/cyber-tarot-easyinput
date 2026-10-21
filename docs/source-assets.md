# 高清原始视觉素材

网页运行只需要 `dist/assets/` 中经过压缩的版本。为避免让每次克隆都额外下载数百 MB，高清 PNG 原图不写入 Git 历史，而是保存在独立的 GitHub Release 中。

## 下载

- [Source assets 2026-10-21](https://github.com/PanSi0909/cyber-tarot-easyinput/releases/tag/source-assets-2026-10-21)
- 发布附件包含 90 张唯一 PNG、文件级 `SHA256SUMS.txt`、归档说明，以及归档文件自身的 `.sha256` 校验文件。

这些文件来自课程实践期间生成并保留的高清视觉素材，包括牌面候选稿、设计板和场景方案。文件名保留生成时的内部标识；网站实际使用关系以 `design/card-art-v2-manifest.json` 和 `dist/assets/course-6/cards-v2-web/` 为准。

## 校验

下载归档和同名 `.sha256` 文件后，在 macOS 或 Linux 中运行：

```bash
shasum -a 256 -c cyber-tarot-source-assets-2026-10-21.tar.gz.sha256
```

解压后如需逐张校验：

```bash
cd cyber-tarot-source-assets-2026-10-21
shasum -a 256 -c SHA256SUMS.txt
```

## 许可与使用边界

这些原创视觉素材适用仓库 `LICENSE-CONTENT.md` 中的 CC BY-NC-SA 4.0。Release 是素材备份与学习资料，不是网站运行依赖；删除本地原图不会影响 `dist/`、GitHub Pages 或正式站点。
