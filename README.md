# 茉莉雨 · 掌心花园

一首歌，一片属于你的茉莉花园。月光花园首页、摄像头手势开花与音乐重音联动，均在浏览器中运行。

![首页预览](docs/preview.png)

## 上传到 GitHub

1. 解压项目包，新建一个 GitHub 仓库。
2. 将解压目录**里面的全部文件和文件夹**上传到仓库根目录。根目录应直接看到 `README.md`、`package.json`、`dist/` 和 `.github/`；不要只上传 ZIP，也不要再套一层文件夹。
3. 如果使用 GitHub 网页上传，请确认 `.github/workflows/pages.yml` 也上传成功；部分文件管理器会隐藏以点开头的目录。

也可在解压后的目录运行以下命令，将 `YOUR_NAME/YOUR_REPOSITORY` 换成自己的仓库：

```bash
git init
git add .
git commit -m "Initial Jasmine Rain garden"
git branch -M main
git remote add origin https://github.com/YOUR_NAME/YOUR_REPOSITORY.git
git push -u origin main
```

## 发布为可直接打开的网站

项目已包含 GitHub Pages 工作流，无需安装依赖或执行构建。

1. 在仓库打开 **Settings → Pages**。
2. 将 **Build and deployment → Source** 设为 **GitHub Actions**。
3. 打开 **Actions → Deploy Jasmine Rain to GitHub Pages → Run workflow**，选择 `main` 分支并运行。如果仓库禁止 Actions，请先启用它。
4. 等工作流成功后，在 **Settings → Pages** 中打开实际生成的网站地址。

之后推送到 `main` 或 `master` 会触发部署。网页资源均使用相对路径，可用于 `https://用户名.github.io/仓库名/` 这样的仓库子路径。只部署 `dist/`，说明文档和本地启动工具不会成为站点内容。

工作流依据 [GitHub Pages 官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages) 编写。该文件包尚未连接或部署到你的 GitHub 账户。

## 本地打开

安装 Node.js 20 或更新版本，在项目根目录运行：

```bash
npm start
```

不需要运行 `npm install`。根据终端显示的地址打开浏览器，默认是 `http://localhost:4188/`。Windows 也可双击 `start.cmd`，它会自动打开系统浏览器。

不要直接双击 `dist/index.html`；浏览器模块、模型和摄像头应通过 localhost 或 HTTPS 加载。

## 使用方式

- 点击首页的“进入你的掌心花园”。
- 点击“播放”播放前 80 秒配乐，末尾半秒淡出。
- 点击“开启摄像头”并允许访问。张掌产生花簇、挥手留下花迹，指尖向下轻点开花。
- 没有摄像头时，可点击、拖动画面开花。
- 每朵花在生成后的 3–5 秒内淡出消失，音乐重音会带动花瓣舒展与飘散。
- “返回首页”会暂停音乐并释放摄像头。

## 摄像头与音乐

摄像头画面和手势推理在设备浏览器中处理。MediaPipe 库、模型和 WASM 已放在项目内，不需要从外网 CDN 运行时下载。

摄像头必须获得网站权限。如果画面显示划线相机图标，请检查电脑的摄像头隐私按键/滑盖，或使用“检查画面”选择设备。模型已加载不等于真实摄像头画面可用。

音乐联动根据低频能量变化识别重音，尚未人工逐拍标定。此版本不是精确 BPM 编排。

## 文件结构

```text
.github/workflows/pages.yml    GitHub Pages 部署
dist/
  index.html                  页面与控件
  styles.css                  演奏页样式
  landing.css                 月光花园首页样式
  app.js                      手势、花朵、音频分析
  assets/
    jasmine-garden.png         花园背景
    jasmine-rain-80s.m4a       80 秒配乐
    mediapipe/                手势模型与 WASM
launch.cjs                    无依赖本地服务器
start.cmd / start.ps1          Windows 启动入口
docs/                         预览图和背景生成提示词
licenses/                     第三方许可证
THIRD_PARTY_NOTICES.md         第三方来源说明
```

文件包不含旧站点身份、账户凭据、机器专属路径、测试缓存、原始视频或已弃用的手掌/花圈图片。

## 验证范围

已在本机 Edge 验证首页、进入/返回、电脑与手机布局、80 秒配乐播放、花朵自动消失，以及模拟摄像头下的本地手势模型启动。真实摄像头效果仍受设备、光照、系统隐私设置和浏览器权限影响。

这是适合上传仓库的源文件包；GitHub Actions 的实际部署需要上传后在你的仓库中运行。
