import type { GalleryConfig } from './types';

// 导入所有日落图片
import img000 from '../../assets/images/sunset/000.jpg';
import img001 from '../../assets/images/sunset/001.jpg';
import img002 from '../../assets/images/sunset/002.jpg';
import img003 from '../../assets/images/sunset/003.jpg';
import img004 from '../../assets/images/sunset/004.jpg';
import img005 from '../../assets/images/sunset/005.jpg';
import img006 from '../../assets/images/sunset/006.jpg';
import img007 from '../../assets/images/sunset/007.jpg';
import img008 from '../../assets/images/sunset/008.jpg';
import img009 from '../../assets/images/sunset/009.jpg';
import img010 from '../../assets/images/sunset/010.jpg';
import img011 from '../../assets/images/sunset/011.jpg';
import img012 from '../../assets/images/sunset/012.jpg';
import img013 from '../../assets/images/sunset/013.jpg';
import img014 from '../../assets/images/sunset/014.jpg';
import img015 from '../../assets/images/sunset/015.jpg';
import img016 from '../../assets/images/sunset/016.jpg';
import img017 from '../../assets/images/sunset/017.jpg';

/**
 * 日落作品集配置
 */
export const sunsetGallery: GalleryConfig = {
  id: 'sunset',
  slug: 'sunset',
  title: '日落',
  titleEn: 'Sunset',
  description: '海边日落摄影作品集，记录黄昏时分的美丽瞬间',
  date: '2023-09',
  location: '海边',
  tags: ['日落', '风景', '海边', '黄昏'],
  featured: true,
  images: [
    {
      src: img000,
      alt: 'Sunset at the beach',
      layout: {
        cols: { default: '12', sm: '10' },
        align: 'center',
      },
    },
    {
      src: img001,
      alt: 'Golden hour',
      layout: {
        cols: { default: '10', sm: '8', md: '6', lg: '4' },
        align: 'start',
      },
    },
    {
      src: img002,
      alt: 'Sunset clouds',
      layout: {
        cols: { default: '10', sm: '8', md: '6', lg: '4' },
        offset: { md: '1' },
        align: 'center',
      },
    },
    {
      src: img003,
      alt: 'Evening glow',
      layout: {
        cols: { default: '12', sm: '10', md: '8', lg: '6' },
        align: 'end',
      },
    },
    {
      src: img004,
      alt: 'Sunset silhouette',
      layout: {
        cols: { default: '12', sm: '10', md: '8', lg: '6' },
        offset: { sm: '0', md: '1', lg: '3' },
        align: 'start',
      },
    },
    {
      src: img005,
      alt: 'Twilight colors',
      layout: {
        cols: { default: '10', sm: '8', md: '6', lg: '4' },
        align: 'start',
      },
    },
    {
      src: img006,
      alt: 'Sunset reflection',
      layout: {
        cols: { default: '12', sm: '10', md: '8', lg: '6' },
        align: 'end',
      },
    },
    {
      src: img007,
      alt: 'Golden horizon',
      layout: {
        cols: { default: '10', sm: '8', md: '6', lg: '4' },
        offset: { sm: '1' },
        align: 'start',
      },
    },
    {
      src: img008,
      alt: 'Dusk sky',
      layout: {
        cols: { default: '12', sm: '10', md: '6', lg: '6' },
        offset: { sm: '1', md: '5' },
        align: 'start',
      },
    },
    {
      src: img009,
      alt: 'Sunset waves',
      layout: {
        cols: { default: '10', sm: '8', md: '6', lg: '4' },
        align: 'start',
      },
    },
    {
      src: img010,
      alt: 'Evening calm',
      layout: {
        cols: { default: '12', sm: '8', md: '6', lg: '6' },
        offset: { sm: '2', md: '5' },
        align: 'start',
      },
    },
    {
      src: img011,
      alt: 'Sunset peace',
      layout: {
        cols: { default: '8', sm: '8', md: '6', lg: '4' },
        align: 'start',
      },
    },
    {
      src: img012,
      alt: 'Golden sunset',
      layout: {
        cols: { default: '8', md: '6', lg: '6' },
        offset: { default: '5' },
        align: 'start',
      },
    },
    {
      src: img013,
      alt: 'Sunset serenity',
      layout: {
        cols: { default: '10', md: '9', lg: '7' },
        align: 'start',
      },
    },
    {
      src: img014,
      alt: 'Twilight hour',
      layout: {
        cols: { default: '12', sm: '10', md: '6', lg: '6' },
        align: 'end',
      },
    },
    {
      src: img015,
      alt: 'Dusk colors',
      layout: {
        cols: { default: '12', sm: '10', md: '6', lg: '4' },
        align: 'start',
      },
    },
    {
      src: img016,
      alt: 'Final light',
      layout: {
        cols: { default: '12', sm: '10', md: '10', lg: '8' },
        align: 'center',
      },
    },
    {
      src: img017,
      alt: 'Nightfall',
      layout: {
        cols: { default: '12', sm: '10', md: '10', lg: '8' },
        align: 'center',
      },
    },
  ],
  seo: {
    title: '日落摄影作品集 | Tink Photo',
    description: '海边日落摄影作品，记录黄昏时分的美丽瞬间',
    keywords: ['日落', '摄影', '海边', '黄昏', '风景摄影'],
  },
};
