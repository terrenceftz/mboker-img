import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { onPageReveal, prefersReducedMotion, splitOnce } from "./runtime.js";

gsap.registerPlugin(ScrollTrigger);

export function initCategoryAnimations() {
  onPageReveal(() => {
    const category = document.querySelector(".category");
    const wrapper = category?.querySelector(".category-grid__inner");
    if (!category || !wrapper || prefersReducedMotion) return;

    const title = category.querySelector(".category-title");
    if (title) {
      splitOnce(title);
      gsap.from(title.querySelectorAll(".char"), {
        opacity: 0, x: 30, filter: "blur(5px)", duration: 1, stagger: 0.2, ease: "power1.out",
        scrollTrigger: { trigger: title, start: "top 80%", toggleActions: "play none none none" },
      });
    }

    const cards = [...category.querySelectorAll(".category-card")];
    cards.forEach((card) => card.querySelectorAll("[data-splitting]").forEach(splitOnce));
    const timeline = gsap.timeline({
      scrollTrigger: { trigger: wrapper, start: "top 80%", toggleActions: "play none play none" },
    });
    timeline.from(cards, {
      opacity: 0, x: 50, filter: "blur(5px)", duration: 1.25, stagger: 0.5, ease: "power1.out",
    });
    cards.forEach((card, index) => {
      timeline.from(card.querySelectorAll(".char"), {
        opacity: 0, x: 20, filter: "blur(3px)", duration: 1, stagger: 0.15, ease: "power1.out",
      }, index * 0.5);
    });
  });
}
