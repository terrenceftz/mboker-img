import fixtureImage from './fixture-image.jpg';
import type { GalleryConfig } from '../../src/data/gallery/types';

export const fixtureGallery: GalleryConfig = {
  id: 'fixture',
  slug: 'fixture',
  title: 'Fixture Gallery',
  titleEn: 'Fixture',
  description: 'A parser fixture',
  date: '2026-07',
  location: 'Studio',
  tags: ['fixture', 'test'],
  featured: true,
  coverIndex: 0,
  seo: {
    title: 'Fixture SEO',
    description: 'Fixture description',
    keywords: ['fixture'],
  },
  images: [
    {
      src: fixtureImage,
      alt: 'Fixture image alt',
      order: 7,
      layout: {
        cols: { default: '12', md: '8' },
        offset: { md: '2' },
        align: 'end',
        class: 'fixture-class',
        hasBackground: true,
        padding: '2rem',
      },
    },
  ],
};
