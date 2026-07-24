import type { GalleryConfig } from './types';

// 导入所有自然图片
import img001 from '../../assets/images/nature/001.jpg';
import img002 from '../../assets/images/nature/002.jpg';
import img003 from '../../assets/images/nature/003.jpg';
import img004 from '../../assets/images/nature/004.jpg';
import img005 from '../../assets/images/nature/005.jpg';
import img006 from '../../assets/images/nature/006.jpg';
import img007 from '../../assets/images/nature/007.jpg';
import img008 from '../../assets/images/nature/008.jpg';
import img009 from '../../assets/images/nature/009.jpg';
import img010 from '../../assets/images/nature/010.jpg';
import img012 from '../../assets/images/nature/012.jpg';
import img013 from '../../assets/images/nature/013.jpg';
import img014 from '../../assets/images/nature/014.jpg';
import img015 from '../../assets/images/nature/015.jpg';
import img016 from '../../assets/images/nature/016.jpg';
import img017 from '../../assets/images/nature/017.jpg';
import img018 from '../../assets/images/nature/018.jpg';
import img019 from '../../assets/images/nature/019.jpg';
import img020 from '../../assets/images/nature/020.jpg';

/**
 * 自然作品集配置
 */
export const natureGallery: GalleryConfig = {
  id: 'nature',
  slug: 'nature',
  title: '自然',
  titleEn: 'Nature',
  description: '自然风光摄影作品集，记录山川湖海的壮美景色',
  date: '2023-11',
  location: '自然',
  tags: ['自然', '风景', '山水', '户外'],
  featured: true,
  images: [
    {
      src: img001,
      alt: 'Nature landscape',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'center' },
    },
    {
      src: img002,
      alt: 'Mountain view',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img003,
      alt: 'Lake reflection',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img004,
      alt: 'Forest path',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'end' },
    },
    {
      src: img005,
      alt: 'Valley vista',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'start' },
    },
    {
      src: img006,
      alt: 'Waterfall',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img007,
      alt: 'Mountain peak',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'end' },
    },
    {
      src: img008,
      alt: 'River flow',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img009,
      alt: 'Wilderness',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img010,
      alt: 'Nature details',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'center' },
    },
    {
      src: img012,
      alt: 'Scenic view',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img013,
      alt: 'Natural beauty',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img014,
      alt: 'Outdoor adventure',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'start' },
    },
    {
      src: img015,
      alt: 'Landscape art',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img016,
      alt: 'Nature serenity',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'end' },
    },
    {
      src: img017,
      alt: 'Wild scenery',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'center' },
    },
    {
      src: img018,
      alt: 'Earth wonders',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img019,
      alt: 'Nature escape',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img020,
      alt: 'Pure nature',
      layout: { cols: { default: '12', sm: '10', md: '10', lg: '8' }, align: 'center' },
    },
  ],
  seo: {
    title: '自然摄影作品集 | Tink Photo',
    description: '自然风光摄影作品，记录山川湖海的壮美景色',
    keywords: ['自然', '摄影', '风景', '山水', '户外'],
  },
};
