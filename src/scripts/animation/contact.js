import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { prefersReducedMotion, splitOnce } from "./runtime.js";

gsap.registerPlugin(ScrollTrigger);

export function initContactAnimations() {
  if (prefersReducedMotion) return;

  document.querySelectorAll(".info-item").forEach((item) => {
    const label = item.querySelector(".info-item__label");
    const value = item.querySelector(".info-item__value");
    if (!label || !value) return;
    splitOnce(label);
    splitOnce(value);
    gsap.from([...label.querySelectorAll(".char"), ...value.querySelectorAll(".char")], {
      opacity: 0, x: -20, filter: "blur(3px)", duration: 1, stagger: { amount: 0.9 }, ease: "power1.out",
      scrollTrigger: { trigger: item, start: "top 80%", toggleActions: "play none none none" },
    });
  });

  const contactInfo = document.querySelector(".contact-info");
  const contactImage = document.querySelector(".contact-img");
  if (contactInfo && contactImage) gsap.from(contactImage, {
    y: 50, opacity: 0, duration: 1, delay: 1.5, ease: "power1.out",
    scrollTrigger: { trigger: contactInfo },
  });

  const creative = document.querySelector(".contact-creative");
  if (!creative) return;
  // The mail link is a sibling of .contact-creative, so query their shared parent.
  const art = creative.closest(".contact-art") ?? creative.parentElement;
  const first = art.querySelector(".contact-art__link");
  const second = art.querySelector(".contact-art__link-2");
  [first, second].forEach(splitOnce);
  const timeline = gsap.timeline({
    scrollTrigger: { trigger: creative, start: "top 80%", toggleActions: "play none none none" },
  });
  if (first) timeline.from(first.querySelectorAll(".char"), {
    opacity: 0, x: 20, filter: "blur(3px)", duration: 1, stagger: { amount: 0.9 }, ease: "power1.out",
  });
  if (second) timeline.from(second.querySelectorAll(".char"), {
    opacity: 0, x: 25, filter: "blur(3px)", duration: 1.5, stagger: { amount: 1.1 }, ease: "power1.out",
  }, 1.5);
}
