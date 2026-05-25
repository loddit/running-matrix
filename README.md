# Running Matrix

用一张海报记录你的跑步训练矩阵 · A poster-style editor for your running workout matrix.

**Presented by [Parco](https://parco.run)**

---

## 功能

- 5 种训练类型：轻松跑、节奏跑、长距离、爬坡、间歇跑
- 为每项填写首选跑步地点，实时预览海报（420×620）
- 拖拽序号区调整顺序；不需要的类型可删除，少于 5 项时出现「+」添回
- 深色 / 浅色主题，偏好保存在 `localStorage`
- 一键导出 PNG（`@zumer/snapdom`），导出时自动隐藏编辑控件并去除圆角

## Features

- Five workout types: Easy, Tempo, LSD, Hill, Intervals
- Set a preferred location per type; live poster preview (420×620)
- Drag the index handle to reorder; remove types you do not need, use **+** to add them back (max 5)
- Dark / light theme with `localStorage` persistence
- One-click PNG export via `@zumer/snapdom` (hides controls and square corners in the export)

---

## 快速开始 · Quick Start

```bash
npm install
npm run dev
```

浏览器打开本地开发地址即可编辑。导出前需填完当前列表中的每一项。

```bash
npm run build    # 生产构建
npm run preview  # 预览构建结果
```

Open the dev server URL in your browser. All active rows must have a location filled in before download.

---

## 使用说明 · Usage

| 操作 | 说明 · Description |
|------|-------------------|
| 点击行 | 编辑地点 · Edit location |
| 拖拽序号 | 调整顺序 · Reorder |
| × | 删除该项（需确认）· Remove row (confirm) |
| + | 添加已删除的类型 · Add removed type |
| 下载 | 导出 PNG · Export PNG |
| 主题按钮 | 切换深 / 浅色 · Toggle theme |

数据保存在浏览器 `localStorage`（键名 `matrix-poster`），包含顺序、地点与主题无关的海报字段。

Data is stored in `localStorage` under `matrix-poster` (order, locations, etc.).

---

## 技术栈 · Tech Stack

- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/) v4
- [@zumer/snapdom](https://github.com/zumerlab/snapdom) — DOM 截图导出

---

## 项目结构 · Project Structure

```
├── index.html          # 页面与弹窗
├── src/
│   ├── main.js         # 入口
│   ├── poster.js       # 海报渲染、拖拽、存储
│   ├── export.js       # 截图下载与校验
│   ├── theme.js        # 主题切换
│   └── style.css       # 样式与主题变量
└── package.json
```

---

## License

MIT License https://opensource.org/license/mit
