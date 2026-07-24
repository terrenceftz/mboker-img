import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onPageReveal, prefersReducedMotion, splitOnce } from "./runtime.js";

gsap.registerPlugin(ScrollTrigger);

const splitDetailItems = (selector) => [...document.querySelectorAll(selector)].map((item) => {
  const label = item.querySelector(".project-detail__label");
  const value = item.querySelector(".project-detail__value");
  if (!label || !value) return { item, chars: [] };
  splitOnce(label);
  splitOnce(value);
  return { item, chars: [...label.querySelectorAll(".char"), ...value.querySelectorAll(".char")] };
});

const animateDetails = (timeline, groups, position) => {
  groups.forEach(({ chars }, index) => {
    if (!chars.length) return;
    timeline.to(chars, {
      opacity: 1, x: 0, filter: "blur(0px)", duration: 0.65,
      stagger: { amount: Math.min(0.7, chars.length * 0.035) }, ease: "power1.out",
    }, position + index * 0.08);
  });
};

function initHomeIntro() {
  const heading = document.querySelector(".hero-heading");
  const text = document.querySelector(".hero-text");
  if (!heading || !text) return false;
  splitOnce(heading);
  splitOnce(text);
  const timeline = gsap.timeline();
  timeline
    .to(".site-header", { opacity: 1, y: 0, duration: 0.75, ease: "power1.out" })
    .to(heading.querySelectorAll(".char"), {
      opacity: 1, x: 0, filter: "blur(0px)", duration: 1.25, stagger: { amount: 1.1 }, ease: "power1.out",
      onComplete: () => document.querySelector(".hero-line")?.classList.add("motion-svg__heroline"),
    }, 0.75)
    .to(text.querySelectorAll(".char"), {
      opacity: 1, x: 0, filter: "blur(0px)", duration: 1, stagger: { amount: 1.2 }, ease: "power1.out",
    }, 1.25)
    .to(".side-picture", {
      y: 0, filter: "blur(0px)", opacity: 1, duration: 1.25, ease: "power1.out",
    }, 1.25)
    .to(".hero-01 .picture", {
      y: 0, filter: "blur(0px)", opacity: 1, duration: 1.25, ease: "power1.out",
    }, 1.5);
  return true;
}

function initProjectIntro() {
  const gallery = document.querySelector(".project-gallery");
  if (!gallery) return false;
  const title = document.querySelector(".post-title__01[data-splitting]");
  if (title) splitOnce(title);
  const details = splitDetailItems(".project-detail__item");
  const timeline = gsap.timeline()
    .to(".site-header", { opacity: 1, y: 0, duration: 0.75, ease: "power1.out" });
  if (title) timeline.to(title.querySelectorAll(".char"), {
    opacity: 1, x: 0, filter: "blur(0px)", duration: 1, stagger: { amount: 0.9 }, ease: "power1.out",
  }, 0.01);
  const header = document.querySelector(".post-header__01");
  if (header) timeline.to(header, { opacity: 1, y: 0, duration: 0.75, ease: "power1.out" }, ">");
  timeline
    .to(gallery, {
      y: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power1.out",
    }, "<0.001");
  animateDetails(timeline, details, 1);
  return true;
}

function initCollectionIntro() {
  const gallery = document.querySelector(".collection-gallery");
  if (!gallery) return false;
  const title = document.querySelector(".collection-title__01[data-splitting]");
  if (title) splitOnce(title);
  const timeline = gsap.timeline()
    .to(".site-header", { opacity: 1, y: 0, duration: 0.75, ease: "power1.out" });
  if (title) timeline.to(title.querySelectorAll(".char"), {
    opacity: 1, x: 0, filter: "blur(0px)", duration: 1, stagger: { amount: 0.9 }, ease: "power1.out",
  }, 0.01);
  timeline
    .to(".collection-header__01", { opacity: 1, y: 0, duration: 0.75, ease: "power1.out" }, ">")
    .to(gallery, {
      y: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power1.out",
    }, "<0.001");
  return true;
}

function initAboutIntro() {
  if (!document.querySelector(".about")) return false;
  const details = splitDetailItems(".project-detail__item");
  const timeline = gsap.timeline()
    .to(".site-header", { opacity: 1, y: 0, duration: 0.75, ease: "power1.out" })
    .to(".project-gallery", {
      y: 0, opacity: 1, filter: "blur(0px)", duration: 1, ease: "power1.out",
    }, "<0.001");
  animateDetails(timeline, details, 1);
  return true;
}

function initGalleryReveals() {
  if (!document.documentElement.classList.contains("about")) document.querySelectorAll(".project-gallery__item").forEach((item) => {
    const figure = item.querySelector(".project-gallery__figure");
    if (figure) gsap.from(figure, {
      opacity: 0, y: 60, duration: 1,
      scrollTrigger: { trigger: item, start: "top 80%", toggleActions: "play reverse play reverse" },
    });
  });
  document.querySelectorAll(".collection-item").forEach((item) => {
    const figure = item.querySelector(".collection__figure");
    if (figure) gsap.from(figure, {
      opacity: 0, y: 60, filter: "blur(5px)", duration: 1,
      scrollTrigger: { trigger: item, start: "top 80%", toggleActions: "play none play none" },
    });
  });
}

export function initPageAnimations() {
  preparePageIntro();
  onPageReveal(() => {
    if (prefersReducedMotion) return;
    initHomeIntro() || initAboutIntro() || initProjectIntro() || initCollectionIntro();
    initGalleryReveals();
  });
}

function preparePageIntro() {
  if (prefersReducedMotion) return;
  const heading = document.querySelector(".hero-heading");
  const heroText = document.querySelector(".hero-text");
  [heading, heroText].forEach(splitOnce);
  if (heading) gsap.set(heading.querySelectorAll(".char"), { opacity: 0, x: -30, filter: "blur(5px)" });
  if (heroText) gsap.set(heroText.querySelectorAll(".char"), { opacity: 0, x: -20, filter: "blur(3px)" });
  if (heading) {
    gsap.set(".site-header", { opacity: 0, y: -20 });
    gsap.set([".side-picture", ".hero-01 .picture"], { y: -50, filter: "blur(5px)", opacity: 0 });
  }

  const projectGallery = document.querySelector(".project-gallery");
  const collectionGallery = document.querySelector(".collection-gallery");
  if (projectGallery || collectionGallery) gsap.set(".site-header", { opacity: 0, y: -20 });
  if (projectGallery) gsap.set(projectGallery, { y: -20, opacity: 0, filter: "blur(10px)" });
  if (collectionGallery) gsap.set(collectionGallery, { y: -20, opacity: 0, filter: "blur(10px)" });

  const postTitle = document.querySelector(".post-title__01[data-splitting]");
  const collectionTitle = document.querySelector(".collection-title__01[data-splitting]");
  [postTitle, collectionTitle].forEach(splitOnce);
  [postTitle, collectionTitle].forEach((title) => {
    if (title) gsap.set(title.querySelectorAll(".char"), { opacity: 0, x: -30, filter: "blur(8px)" });
  });
  const postHeader = document.querySelector(".post-header__01");
  const collectionHeader = document.querySelector(".collection-header__01");
  if (postHeader) gsap.set(postHeader, { opacity: 0, y: -20 });
  if (collectionHeader) gsap.set(collectionHeader, { opacity: 0, y: -20 });
  splitDetailItems(".project-detail__item").forEach(({ chars }) => {
    gsap.set(chars, { opacity: 0, x: -20, filter: "blur(3px)" });
  });
}
