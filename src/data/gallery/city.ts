import type { GalleryConfig } from './types';

// 导入所有城市图片
import img001 from '../../assets/images/city/001.jpg';
import img002 from '../../assets/images/city/002.jpg';
import img003 from '../../assets/images/city/003.jpg';
import img004 from '../../assets/images/city/004.jpg';
import img005 from '../../assets/images/city/005.jpg';
import img006 from '../../assets/images/city/006.jpg';
import img007 from '../../assets/images/city/007.jpg';
import img008 from '../../assets/images/city/008.jpg';
import img009 from '../../assets/images/city/009.jpg';
import img010 from '../../assets/images/city/010.jpg';
import img011 from '../../assets/images/city/011.jpg';
import img011a from '../../assets/images/city/011-1.jpg';
import img011b from '../../assets/images/city/011-2.jpg';
import img012 from '../../assets/images/city/012.jpg';
import img013 from '../../assets/images/city/013.jpg';
import img014 from '../../assets/images/city/014.jpg';
import img015 from '../../assets/images/city/015.jpg';
import img016 from '../../assets/images/city/016.jpg';
import img017 from '../../assets/images/city/017.jpg';
import img018 from '../../assets/images/city/018.jpg';
import img019 from '../../assets/images/city/019.jpg';
import img020 from '../../assets/images/city/020.jpg';
import img021 from '../../assets/images/city/021.jpg';
import img022 from '../../assets/images/city/022.jpg';

/**
 * 城市作品集配置
 */
export const cityGallery: GalleryConfig = {
  id: 'city',
  slug: 'city',
  title: '城市',
  titleEn: 'City',
  description: '城市风光摄影作品集，记录都市的建筑与人文',
  date: '2023-09',
  location: '城市',
  tags: ['城市', '建筑', '人文', '街拍'],
  featured: true,
  images: [
    {
      src: img001,
      alt: 'City architecture',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'center' },
    },
    {
      src: img002,
      alt: 'Urban landscape',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img003,
      alt: 'City streets',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img004,
      alt: 'Downtown',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'end' },
    },
    {
      src: img005,
      alt: 'City lights',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'start' },
    },
    {
      src: img006,
      alt: 'Urban night',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img007,
      alt: 'City skyline',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'end' },
    },
    {
      src: img008,
      alt: 'Street view',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img009,
      alt: 'Urban life',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img010,
      alt: 'City motion',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'center' },
    },
    {
      src: img011,
      alt: 'Architecture details',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img011a,
      alt: 'City perspective 1',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img011b,
      alt: 'City perspective 2',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'end' },
    },
    {
      src: img012,
      alt: 'Urban geometry',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'start' },
    },
    {
      src: img013,
      alt: 'City patterns',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img014,
      alt: 'Metropolitan',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img015,
      alt: 'City rhythm',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'end' },
    },
    {
      src: img016,
      alt: 'Urban scenes',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img017,
      alt: 'City stories',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'center' },
    },
    {
      src: img018,
      alt: 'Street moments',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'start' },
    },
    {
      src: img019,
      alt: 'City vibes',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'start' },
    },
    {
      src: img020,
      alt: 'Urban exploration',
      layout: { cols: { default: '10', sm: '8', md: '6', lg: '4' }, align: 'end' },
    },
    {
      src: img021,
      alt: 'City dreams',
      layout: { cols: { default: '12', sm: '10', md: '8', lg: '6' }, align: 'center' },
    },
    {
      src: img022,
      alt: 'Metropolitan life',
      layout: { cols: { default: '12', sm: '10', md: '10', lg: '8' }, align: 'center' },
    },
  ],
  seo: {
    title: '城市摄影作品集 | Tink Photo',
    description: '城市风光摄影作品，记录都市的建筑与人文',
    keywords: ['城市', '摄影', '建筑', '街拍', '人文'],
  },
};
