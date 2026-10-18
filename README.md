# theorange6666-pixel 的博客

博客地址：<https://theorange6666-pixel.github.io>

## 在本机预览

在 `D:\HexoBlog` 打开终端，运行：

```powershell
pnpm install --frozen-lockfile
pnpm run server
```

然后打开 <http://localhost:4000>。

## 写文章并发布

在 `source/_posts/` 中创建 Markdown 文件，或运行：

```powershell
hexo new "文章标题"
```

完成编辑后，提交并推送到 `main` 分支。GitHub Actions 会自动构建并发布网站。
