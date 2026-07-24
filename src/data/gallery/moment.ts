import type { GalleryConfig } from './types';

// 导入所有瞬间图片
import img001 from '../../assets/images/moment/001.jpg';
import img002 from '../../assets/images/moment/002.jpg';
import img003 from '../../assets/images/moment/003.jpg';
import img004 from '../../assets/images/moment/004.jpg';
import img005 from '../../assets/images/moment/005.jpg';
import img006 from '../../assets/images/moment/006.jpg';
import img007 from '../../assets/images/moment/007.jpg';
import img008 from '../../assets/images/moment/008.jpg';
import img009 from '../../assets/images/moment/009.jpg';
import img010 from '../../assets/images/moment/010.jpg';
import img011 from '../../assets/images/moment/011.jpg';
import img012 from '../../assets/images/moment/012.jpg';

/**
 * 瞬间作品集配置
 */
export const momentGallery: GalleryConfig = {
  id: 'moment',
  slug: 'moment',
  title: '瞬间',
  titleEn: 'Moment',
  description: '生活瞬间摄影作品集，捕捉生活中的美好时刻',
  date: '2023-06',
  location: '生活',
  tags: ['瞬间', '生活', '人文', '纪实'],
  featured: true,
  images: [
    {
      src: img001,
      alt: 'Life moment',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'center' },
    },
    {
      src: img002,
      alt: 'Captured instant',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img003,
      alt: 'Daily life',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img004,
      alt: 'Street moment',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'end' },
    },
    {
      src: img005,
      alt: 'Quiet moment',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'start' },
    },
    {
      src: img006,
      alt: 'Candid shot',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img007,
      alt: 'Fleeting moment',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'end' },
    },
    {
      src: img008,
      alt: 'Life snapshot',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img009,
      alt: 'Spontaneous',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img010,
      alt: 'Everyday beauty',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'center' },
    },
    {
      src: img011,
      alt: 'Simple moments',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img012,
      alt: 'Life stories',
      layout: { cols: { default: '12', sm: '10', md: '10', lg: '8' }, align: 'center' },
    },
  ],
  seo: {
    title: '瞬间摄影作品集 | Tink Photo',
    description: '生活瞬间摄影作品，捕捉生活中的美好时刻',
    keywords: ['瞬间', '摄影', '生活', '人文', '纪实'],
  },
};
