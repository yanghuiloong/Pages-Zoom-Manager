# Pages Zoom Manager 🔍

![Version](https://img.shields.io/badge/version-1.0.0-blue) ![Chrome](https://img.shields.io/badge/Chrome-Extension-green)

一个简单而强大的 Chrome 扩展，用于为不同网站（甚至同一网站的不同路径）设置**固定的、独立的**原生缩放比例。

完美解决 Chrome 原生缩放“一刀切”的问题，支持为 Bilibili 首页和视频播放页设置完全不同的缩放率，且**毫无闪烁**。

## ✨ 核心痛点与解决方案

你是否遇到过这种情况：
* **Bilibili 首页** 字太小，想放大到 **110%**。
* 但点进 **视频播放页**，界面又太大，想缩小到 **80%**。
* Chrome 默认只能记住 `bilibili.com` 一个设置，导致你在两个页面间反复横跳，或者忍受页面加载时的剧烈闪烁。

**Pages Zoom Manager 完美解决了这个问题：**

1.  **📍 路径级精细控制：** 支持“长路径优先”匹配原则。你可以同时设置 `domain.com` (110%) 和 `domain.com/video` (80%)，互不干扰。
2.  **🚫 拒绝闪烁 (No-Flicker)：** 采用智能检测与静默更新机制，只有缩放比例不符时才介入，彻底告别页面加载时的“忽大忽小”。
3.  **🛡️ 单标签页隔离 (Per-Tab Isolation)：** 强制使用 `per-tab` 模式，当前页面的缩放**不会**污染 Chrome 的全局默认设置。
4.  **⚡ 原生体验：** 使用 `chrome.tabs.setZoom` 原生 API，而非 CSS 缩放，网页排版渲染更自然、清晰。

## 🚀 安装指南 (开发者模式)

由于本项目尚未发布到 Chrome 应用商店，请按以下步骤安装：

1.  下载本项目源码或 Clone 仓库：
    ```bash
    git clone [https://github.com/yanghuiloong/Pages-Zoom-Manager.git](https://github.com/yanghuiloong/Pages-Zoom-Manager.git)
    ```
2.  打开 Chrome 浏览器，在地址栏输入：`chrome://extensions/`
3.  打开右上角的 **“开发者模式” (Developer mode)** 开关。
4.  点击左上角的 **“加载已解压的扩展程序” (Load unpacked)**。
5.  选择本项目的文件夹即可。

## 📖 使用方法

1.  安装后，点击浏览器右上角的扩展图标（蓝色放大镜 Z 图标）。
2.  在弹出面板中输入规则：
    * **网址片段：** 输入 URL 的一部分。
        * 例 1：`bilibili.com` (匹配全站)
        * 例 2：`bilibili.com/video` (仅匹配视频页)
    * **缩放比例：** 输入小数。
        * `1.1` 代表 110%
        * `0.8` 代表 80%
3.  点击 **“添加”**。
4.  刷新对应的网页，缩放将自动应用。

### 推荐配置 (Bilibili 示例)

| 网址片段 (URL Fragment) | 缩放比例 (Zoom) | 说明 |
| :--- | :--- | :--- |
| `bilibili.com` | `1.1` | 首页及通用页面放大观看 |
| `bilibili.com/video` | `0.8` | 视频页缩小以获得更多视野 |

## 🛠️ 技术栈

* **Manifest V3**
* **Chrome Extension API:** `tabs`, `storage`, `action`
* **Key Logic:** `chrome.tabs.setZoomSettings` with `mode: 'automatic'` & `scope: 'per-tab'`

## 📝 待办事项 / 计划

- [ ] 支持正则表达式匹配
- [ ] 增加规则导入/导出功能
- [ ] 发布至 Chrome Web Store

## 📄 License

MIT License