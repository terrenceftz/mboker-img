/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare module "splitting";
declare module "swiper/css/bundle";

interface Window {
  siteLenis?: {
    start(): void;
    stop(): void;
    resize(): void;
    scrollTo(target: number | string | Element, options?: Record<string, unknown>): void;
  };
}
