import authorAvatar from "../assets/images/tink.jpg";

const authorEmail = "hello@ricoui.com";
const pexelsUrl = "https://www.pexels.com/@tink-s-838159870/";
const githubUrl = "https://github.com/ricocc/tink-photography";
const designUrl = "https://ricoui.com/?ref=Tink";

export interface LinkItem {
  id: string;
  label: string;
  href: string;
  external?: boolean;
}

export interface SocialLink extends Omit<LinkItem, "href"> {
  handle: string;
  href?: string;
}

export interface CategoryItem extends LinkItem {
  count: number;
  cover: string;
  note?: string;
}

export interface ProfileItem {
  id: string;
  label: string;
  value: string;
  href?: string;
  external?: boolean;
}

export interface SiteConfig {
  name: string;
  shortName: string;
  tagline: string;
  url: string;
  locale: string;
  seo: { title: string; description: string; keywords: string };
  author: {
    name: string;
    role: string;
    bio: string;
    email: string;
    avatar: typeof authorAvatar;
    profile: readonly ProfileItem[];
  };
  socials: readonly SocialLink[];
  analytics: { google?: string; baidu?: string };
}

export const siteConfig = {
  name: "Tink Photo Gallery",
  shortName: "Tink.",
  tagline: "影像故事",
  url: "https://tinks.netlify.app",
  locale: "zh-CN",
  seo: {
    title: "Tink Photo Gallery",
    description: "欢迎来到 Tink 的摄影学习日记，记录城市、自然与旅途中的影像故事。",
    keywords: "Tink,Photo,摄影,摄影学习日记,摄影师个人网站",
  },
  author: {
    name: "Tink",
    role: "摄影",
    bio: "自由职业，偶尔与工作室或个人合作摄影。热衷于将优秀的审美和设计理念融入生活与工作。",
    email: authorEmail,
    avatar: authorAvatar,
    profile: [
      { id: "name", label: "我是", value: "Tink" },
      { id: "intro", label: "介绍", value: "开始学习用镜头，记录生活和旅途的每一刻。" },
      { id: "github", label: "Github", value: "tink-photography", href: githubUrl, external: true },
      { id: "pexels", label: "Pexels", value: "@Tink S", href: pexelsUrl, external: true },
      { id: "xiaohongshu", label: "小红书", value: "@苦瓜柠檬茶" },
      { id: "email", label: "邮件", value: authorEmail, href: `mailto:${authorEmail}` },
      { id: "bio", label: "信息", value: "自由职业，偶尔与工作室或个人合作摄影。从事过多年的外贸行业，英语交流通顺。热衷于将优秀的审美和设计理念融入到生活和工作之中，充满美的乐趣。" },
    ],
  },
  socials: [
    { id: "pexels", label: "Pexels", handle: "@Tink S", href: pexelsUrl, external: true },
    { id: "github", label: "Github", handle: "tink-photography", href: githubUrl, external: true },
    { id: "instagram", label: "Instagram", handle: "/" },
    { id: "design", label: "设计&开发", handle: "RicoUI", href: designUrl, external: true },
  ],
  analytics: {},
} as const satisfies SiteConfig;

export const navigationItems = [
  { id: "home", label: "首页", href: "/" },
  { id: "categories", label: "主题目录", href: "#categories" },
  { id: "about", label: "关于我", href: "/about" },
] as const satisfies readonly LinkItem[];

export const categoryItems = [
  { id: "sunset", label: "日落", href: "/collection/sunset", count: 18, cover: "/menu/sunset.jpg", note: "收集者" },
  { id: "nature", label: "自然", href: "/collection/nature", count: 19, cover: "/menu/nature.jpg" },
  { id: "city", label: "城市", href: "/collection/city", count: 24, cover: "/menu/city.jpg" },
  { id: "moment", label: "瞬间", href: "/collection/moment", count: 12, cover: "/menu/other.jpg" },
  { id: "altay", label: "阿勒泰", href: "/posts/altay", count: 17, cover: "/menu/altay.jpg", note: "特辑" },
] as const satisfies readonly CategoryItem[];

export const categoryById = Object.fromEntries(
  categoryItems.map((item) => [item.id, item]),
) as Record<(typeof categoryItems)[number]["id"], (typeof categoryItems)[number]>;
