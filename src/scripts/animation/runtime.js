import Splitting from "splitting";

export const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)",
).matches;

export function splitOnce(target) {
  if (!target || target.dataset.splitReady === "true") return target;
  Splitting({ target, by: "chars" });
  target.dataset.splitReady = "true";
  return target;
}

export function onPageReveal(callback) {
  if (!document.querySelector(".preloader") || document.documentElement.dataset.preloaderComplete === "true") {
    callback();
    return () => {};
  }

  document.addEventListener("preloader:complete", callback, { once: true });
  return () => document.removeEventListener("preloader:complete", callback);
}

export function createCleanup() {
  const callbacks = [];
  return {
    add(callback) {
      callbacks.push(callback);
    },
    run() {
      callbacks.splice(0).reverse().forEach((callback) => callback());
    },
  };
}
