import { describe, expect, it } from 'vitest';

import { selectPreloaderImages } from '../../src/server/repositories/preloader';

describe('preloader gallery selection', () => {
  it('shuffles unique candidates without repeating when enough images exist', () => {
    const result = selectPreloaderImages(
      ['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg'],
      5,
      () => 0,
    );

    expect(result).toEqual(['/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg', '/a.jpg']);
    expect(new Set(result)).toHaveLength(5);
  });

  it('removes duplicate URLs and repeats a short shuffled list to five frames', () => {
    expect(selectPreloaderImages(['/a.jpg', '/b.jpg', '/a.jpg'], 5, () => 0)).toEqual([
      '/b.jpg',
      '/a.jpg',
      '/b.jpg',
      '/a.jpg',
      '/b.jpg',
    ]);
  });

  it('uses the optimized local fallback when no gallery photo exists', () => {
    expect(selectPreloaderImages([], 5, () => 0)).toEqual(Array(5).fill('/hero-preloader.jpg'));
  });

  it('returns no frames when the requested count is zero', () => {
    expect(selectPreloaderImages(['/a.jpg'], 0, () => 0)).toEqual([]);
  });
});
