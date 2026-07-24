import type { ImageMetadata } from 'astro';

/**
 * 响应式尺寸配置
 * 用于定义不同断点下的栅格宽度或偏移
 */
export interface ResponsiveSize {
  /** 默认尺寸 (移动端, <576px) */
  default?: string;
  /** ≥576px */
  sm?: string;
  /** ≥768px */
  md?: string;
  /** ≥992px */
  lg?: string;
  /** ≥1200px */
  xl?: string;
  /** ≥1400px */
  xxl?: string;
}

/**
 * 图片布局配置
 * 定义单张图片在画廊中的布局方式
 */
export interface ImageLayout {
  /** 栅格宽度配置 */
  cols?: ResponsiveSize;
  /** 栅格偏移配置 */
  offset?: ResponsiveSize;
  /** 对齐方式 */
  align?: 'start' | 'center' | 'end';
  /** 特殊样式类名 */
  class?: string;
  /** 是否有背景色块 */
  hasBackground?: boolean;
  /** 背景内边距 (当 hasBackground 为 true 时生效) */
  padding?: string;
}

/**
 * 单张图片配置
 */
export interface GalleryImage {
  /** 图片资源 (通过 import 导入) */
  src: ImageMetadata;
  /** 图片替代文本 */
  alt: string;
  /** 布局配置 */
  layout: ImageLayout;
  /** 自定义排序 (可选) */
  order?: number;
}

/**
 * 作品集 SEO 配置
 */
export interface GallerySEO {
  /** 页面标题 */
  title?: string;
  /** 页面描述 */
  description?: string;
  /** 关键词 */
  keywords?: string[];
}

/**
 * 作品集配置
 */
export interface GalleryConfig {
  /** 唯一标识 */
  id: string;
  /** URL 路径 */
  slug: string;
  /** 中文标题 */
  title: string;
  /** 英文标题 */
  titleEn: string;
  /** 描述 */
  description: string;
  /** 图片列表 */
  images: GalleryImage[];
  /** 拍摄日期 */
  date: string;
  /** 拍摄地点 */
  location?: string;
  /** 标签 */
  tags?: string[];
  /** SEO 配置 */
  seo?: GallerySEO;
  /** 是否在首页展示 */
  featured?: boolean;
  /** 封面图片索引 (默认 0) */
  coverIndex?: number;
}

/**
 * 首页精选作品配置
 */
export interface FeaturedWork {
  /** 作品集 slug */
  gallerySlug: string;
  /** 图片索引 */
  imageIndex: number;
  /** 自定义标题 (可选，默认使用作品集标题) */
  title?: string;
  /** 自定义副标题 */
  subtitle?: string;
  /** 日期显示 */
  date?: string;
  /** 分类标签 */
  category?: string;
}

/**
 * 首页精选配置
 */
export interface FeaturedConfig {
  /** 精选作品列表 */
  works: FeaturedWork[];
}
