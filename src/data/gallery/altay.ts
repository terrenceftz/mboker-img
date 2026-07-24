import type { GalleryConfig } from './types';

// 导入所有阿勒泰图片
import img001 from '../../assets/images/altay/001.jpg';
import img002 from '../../assets/images/altay/002.jpg';
import img003 from '../../assets/images/altay/003.jpg';
import img004 from '../../assets/images/altay/004.jpg';
import img005 from '../../assets/images/altay/005.jpg';
import img006 from '../../assets/images/altay/006.jpg';
import img007 from '../../assets/images/altay/007.jpg';
import img008 from '../../assets/images/altay/008.jpg';
import img009 from '../../assets/images/altay/009.jpg';
import img010 from '../../assets/images/altay/010.jpg';
import img011 from '../../assets/images/altay/011.jpg';
import img012 from '../../assets/images/altay/012.jpg';
import img013 from '../../assets/images/altay/013.jpg';
import img014 from '../../assets/images/altay/014.jpg';
import img015 from '../../assets/images/altay/015.jpg';
import img016 from '../../assets/images/altay/016.jpg';
import img017 from '../../assets/images/altay/017.jpg';

/**
 * 阿勒泰作品集配置
 */
export const altayGallery: GalleryConfig = {
  id: 'altay',
  slug: 'altay',
  title: '阿勒泰',
  titleEn: 'Altay',
  description: '阿勒泰旅行摄影作品集，记录新疆阿勒泰的自然风光与人文风情',
  date: '2023-11',
  location: '新疆阿勒泰',
  tags: ['阿勒泰', '新疆', '旅行', '风光'],
  featured: true,
  images: [
    {
      src: img016,
      alt: 'Altay landscape',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img015,
      alt: 'Altay mountains',
      layout: {
        cols: { default: '12', sm: '10', md: '8' },
        hasBackground: true,
        align: 'center',
      },
    },
    {
      src: img017,
      alt: 'Altay scenery',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img001,
      alt: 'Altay nature',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img002,
      alt: 'Altay wilderness',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img003,
      alt: 'Altay view',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img004,
      alt: 'Altay valley',
      layout: {
        cols: { default: '12', sm: '10', md: '8' },
        hasBackground: true,
        align: 'center',
      },
    },
    {
      src: img005,
      alt: 'Altay forest',
      layout: {
        cols: { default: '12', sm: '10', md: '8' },
        hasBackground: true,
        align: 'center',
      },
    },
    {
      src: img006,
      alt: 'Altay river',
      layout: {
        cols: { default: '12', sm: '10', md: '8' },
        hasBackground: true,
        align: 'center',
      },
    },
    {
      src: img007,
      alt: 'Altay sky',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img008,
      alt: 'Altay clouds',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img009,
      alt: 'Altay sunset',
      layout: {
        cols: { default: '12', sm: '10', md: '8' },
        hasBackground: true,
        align: 'center',
      },
    },
    {
      src: img010,
      alt: 'Altay dawn',
      layout: {
        cols: { default: '12', sm: '10', md: '8' },
        hasBackground: true,
        align: 'center',
      },
    },
    {
      src: img011,
      alt: 'Altay night',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img012,
      alt: 'Altay stars',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img013,
      alt: 'Altay winter',
      layout: { cols: { default: '12' }, align: 'center' },
    },
    {
      src: img014,
      alt: 'Altay journey',
      layout: { cols: { default: '12' }, align: 'center' },
    },
  ],
  seo: {
    title: '阿勒泰摄影作品集 | Tink Photo',
    description: '阿勒泰旅行摄影作品，记录新疆阿勒泰的自然风光与人文风情',
    keywords: ['阿勒泰', '新疆', '旅行', '摄影', '风光'],
  },
};
