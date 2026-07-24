# Tink Photo Gallery

**中文** | [English](README.en.md)

**Tink 的世界！**  
使用 Astro 构建的 Tink 个人网站。

收录 Tink 平时的拍摄作品，记录城市、自然与旅途中的影像故事，以及生活记录与个人介绍。

## 网站内容

- **摄影画廊**：自然、城市、阿勒泰、九寨沟、日落等主题作品
- **影像故事**：旅行随笔与瞬间记录
- **关于 Tink**：个人介绍
- **博客**：不定期更新的生活思考


在线访问：[tinks.netlify.app](https://tinks.netlify.app/)

![Tink Photo Gallery 日间与夜间模式](public/screenshot.jpg)


## ✨ 特性

- ⚡ 基于 Astro 的静态站点，零 JS 默认输出，加载快
- 🖼️ 图集按主题分类（日落 / 自然 / 城市 / 瞬间 / 阿勒泰特辑），数据驱动配置
- 📝 内置博客，支持 Markdown 内容集合
- 🎬 GSAP + Lenis 平滑滚动与动效，Swiper 图片轮播
- 🎨 Sass 样式，Sharp 图片优化
- 🔧 站点信息集中在一个配置文件，改一处全站生效

## 🚀 快速开始

### 环境要求

- Node.js `>= 22.12.0`
- 推荐使用 [pnpm](https://pnpm.io)（仓库已包含 `pnpm-lock.yaml`）

```bash
# 如果还没有安装 pnpm
npm install -g pnpm
```

### 安装与运行

```bash
# 克隆仓库
git clone <repository-url>
cd tinks

# 安装依赖
pnpm install

# 启动开发服务器（默认 http://localhost:4321）
pnpm dev
```

### 常用命令

| 命令           | 作用                                   |
| :------------- | :------------------------------------- |
| `pnpm install` | 安装依赖                               |
| `pnpm dev`     | 启动本地开发服务器 `localhost:4321`    |
| `pnpm build`   | 构建生产版本到 `./dist/`               |
| `pnpm preview` | 本地预览构建产物                       |
| `pnpm check`   | 运行 Astro 类型与内容检查              |

> 也可以使用 `npm run <command>` 或 `yarn <command>`，但推荐统一使用 pnpm，避免多份 lockfile。

## 📂 项目结构

```
/
├── public/                  # 静态资源（favicon、hero 图、菜单封面等）
├── src/
│   ├── assets/              # 需要构建处理的图片资源
│   ├── components/          # Astro 组件
│   │   ├── elements/        # 基础元素组件
│   │   ├── gallery/         # 图集相关组件
│   │   ├── Header.astro     # 页头
│   │   ├── Footer.astro     # 页脚
│   │   └── ...
│   ├── config/
│   │   └── site.ts          # ⭐ 站点配置（站名、SEO、作者信息、导航、分类）
│   ├── content/
│   │   └── blog/            # 博客文章（Markdown）
│   ├── content.config.ts    # 内容集合定义
│   ├── data/
│   │   └── gallery/         # 图集数据（按分类拆分：sunset/city/nature/...）
│   ├── functions/           # 工具函数
│   ├── layouts/             # 页面布局
│   ├── pages/               # 路由页面
│   │   ├── index.astro      # 首页
│   │   ├── about.astro      # 关于我
│   │   ├── blog/            # 博客路由
│   │   ├── posts/           # 特辑文章
│   │   ├── collection/      # 分类图集页
│   │   └── 404.astro
│   ├── scripts/             # 客户端脚本（滚动、动效等）
│   └── styles/              # Sass 全局样式
├── astro.config.mjs         # Astro 配置（含 @ 路径别名）
├── package.json
└── pnpm-lock.yaml
```

## 🛠️ 自定义指南

### 1. 修改站点信息

所有站点级配置集中在 [src/config/site.ts](src/config/site.ts)：

- **基本信息**：站名、标语、域名、SEO 描述
- **作者资料**：头像、简介、社交链接（Pexels、小红书、Instagram 等）
- **导航菜单**：`navigationItems`
- **图集分类**：`categoryItems`（分类名、封面图、照片数量）

### 2. 添加照片

图集数据在 [src/data/gallery/](src/data/gallery/) 目录下，按分类拆分文件（如 `sunset.ts`、`city.ts`）。在对应文件中按现有格式添加条目即可，类型定义见 [types.ts](src/data/gallery/types.ts)。

### 3. 写博客

在 [src/content/blog/](src/content/blog/) 下新建 Markdown 文件，可参考目录中的模板文件（`article-template.md` / `chinese-article-template.md`）。

### 4. 调整样式

全局样式位于 [src/styles/](src/styles/)，使用 Sass 编写。路径别名 `@/` 指向 `src/`，`@/elements` 指向 `src/components/elements`。

## 📦 技术栈

| 技术 | 用途 |
| :--- | :--- |
| [Astro](https://astro.build) | 静态站点框架 |
| [GSAP](https://gsap.com) | 动画 |
| [Lenis](https://lenis.darkroom.engineering) | 平滑滚动 |
| [Swiper](https://swiperjs.com) | 轮播 |
| [Sass](https://sass-lang.com) | 样式 |
| [Sharp](https://sharp.pixelplumbing.com) | 图片处理 |
| TypeScript | 类型检查 |




## 📧 联系方式

- **作者**: Ricoui
- **博客**: [ricoui.com](https://ricoui.com)
- **邮箱**: hello@ricoui.com
- **Twitter**: [@ricouii](https://x.com/ricouii)
- **GitHub**: [@ricocc](https://github.com/ricocc)


## 其他模板

-  **Starter Template** - 开源 :  [https://github.com/ricocc/ricoui-astro-starter](https://github.com/ricocc/ricoui-astro-starter)


-  **SaaS Template** - 开源 :  [https://github.com/ricocc/ricoui-saas-template/](https://github.com/ricocc/ricoui-saas-template/)

-  **Portfolio Template** - 开源 :  [https://github.com/ricocc/ricoui-portfolio](https://github.com/ricocc/ricoui-portfolio)

-  **Blog Template** - 开源 :  [https://github.com/ricocc/public-portfolio-site](https://github.com/ricocc/public-portfolio-site)


---

## 关于作者

我是Rico，网页/UI设计师，热衷于做些有趣和创意的作品。拥有 UI/UX 设计工作经验，目前专注于网页设计和视觉落地，以及开发项目探索。

可以添加我的微信，交个朋友

<img src="https://ricoui.com/assets/wechat.png" alt="ricocc-wechat" width="280" height="auto" style="display:inline-block;margin:12px;">


我平时在博客 <a href="https://ricoui.com/" target="_blank">Rico's Blog</a> 更新内容。也可以关注我的推特 [@ricouii](https://x.com/ricouii) 和 小红书 [@Rico的设计漫想](https://www.xiaohongshu.com/user/profile/5f2b6903000000000101f51f).



## 💜 支持作者


如果觉得有所帮助的话，一点点支持就可以大大激励创作者的热情，感谢！

<img src="https://ricoui.com/assets/zanshangma.jpg" alt="ricocc-wechat" width="280" height="auto" style="display:inline-block;margin:12px;">


---

⭐ 如果这个项目对你有帮助，请给一个 Star！



## 📃 许可证

本项目基于 MIT 协议开源，详见 [LICENSE](LICENSE) 文件。
