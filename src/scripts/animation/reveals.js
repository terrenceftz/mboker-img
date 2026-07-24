import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, splitOnce } from "./runtime.js";

gsap.registerPlugin(ScrollTrigger);

const reveal = (target, from, trigger, start, options = {}) => {
  if (prefersReducedMotion) {
    gsap.set(target, { clearProps: "all" });
    return;
  }
  const { toggleActions = "play none none none", once = false, ...tweenOptions } = options;
  gsap.from(target, {
    ...from,
    ...tweenOptions,
    scrollTrigger: { trigger, start, toggleActions, once },
  });
};

export function initTextReveals() {
  document.querySelectorAll(".splitting-text").forEach((element) => {
    splitOnce(element);
    reveal(element.querySelectorAll(".char"), { opacity: 0, x: 20 }, element, "top 80%", {
      duration: 0.5, stagger: { amount: 0.9 }, ease: "power1.out",
    });
  });

  document.querySelectorAll(".splitting-heading").forEach((element) => {
    splitOnce(element);
    reveal(element.querySelectorAll(".char"), { opacity: 0, x: 50, filter: "blur(5px)" }, element, "top 80%", {
      duration: 1.25, stagger: { amount: 1.1 }, ease: "power1.out",
    });
  });
}

export function initContentReveals() {
  document.querySelectorAll(".gsap-picture").forEach((picture) => {
    if (picture.closest(".index-card") || picture.closest(".hero")) return;
    reveal(picture, { opacity: 0, filter: "blur(5px)" }, picture.parentElement, "top 90%", {
      duration: 1.25, ease: "power1.out", once: true,
    });
  });

  document.querySelectorAll(".index-card").forEach((card) => {
    const inner = card.querySelector(".index-card__inner");
    const picture = card.querySelector(".gsap-picture");
    const content = card.querySelector(".index-card__content");
    if (!inner || !picture || !content) return;
    const chars = content.querySelectorAll(".char");
    if (prefersReducedMotion) {
      gsap.set([inner, picture, content, chars], { clearProps: "all" });
      return;
    }
    gsap.timeline({
      scrollTrigger: {
        trigger: card,
        start: "top 78%",
        toggleActions: "play none none none",
        invalidateOnRefresh: true,
      },
    })
      .to(inner, { opacity: 1, y: 0, duration: 1, ease: "power1.out" })
      .to(picture, { opacity: 1, filter: "blur(0px)", duration: 1.25, ease: "power1.out" }, 0)
      .to(content, { opacity: 1, y: 0, filter: "blur(0px)", duration: 1.2, ease: "power1.out" }, 0.1)
      .to(chars, { opacity: 1, x: 0, filter: "blur(0px)", duration: 0.75, stagger: { amount: 0.9 }, ease: "power1.out" }, 0.25);
  });

  const footer = document.querySelector(".footer");
  if (footer) reveal(footer, { opacity: 0, y: 40 }, "#footer", "top 100%", {
    duration: 1, delay: 0.5, ease: "power1.out",
  });
}

export function prepareContentReveals() {
  if (prefersReducedMotion) return;
  document.querySelectorAll(".index-card__content").forEach((content) => {
    content.querySelectorAll("[data-splitting]").forEach(splitOnce);
    const card = content.closest(".index-card");
    const inner = card?.querySelector(".index-card__inner");
    const picture = card?.querySelector(".gsap-picture");
    if (inner) gsap.set(inner, { opacity: 0, y: 60 });
    if (picture) gsap.set(picture, { opacity: 0, filter: "blur(5px)" });
    gsap.set(content, { opacity: 0, y: 20, filter: "blur(5px)" });
    gsap.set(content.querySelectorAll(".char"), { opacity: 0, x: 12, filter: "blur(2px)" });
  });
}
