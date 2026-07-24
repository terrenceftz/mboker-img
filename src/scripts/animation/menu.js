import { gsap } from "gsap";
import { splitOnce } from "./runtime.js";

const MENU_ID = "site-menu";

export function initMenu() {
  const menu = document.querySelector(`.menu#${MENU_ID}`);
  const openButton = document.querySelector(".js-menuOpen");
  const closeButton = menu?.querySelector(".js-menuClose");
  if (!menu || !openButton || !closeButton) return () => {};

  // Re-initialisation is safe when Astro swaps or restores a page.
  menu._menuCleanup?.();

  const links = [...menu.querySelectorAll(".menu-item__link[data-splitting]")];
  const items = [...menu.querySelectorAll(".menu-item")];
  const covers = [...menu.querySelectorAll(".menu-cover__pic")];
  const coverBox = menu.querySelector(".menu-cover__box");
  const menuPanel = menu.querySelector(".menu-main");
  let lastFocusedElement = null;
  let isOpen = menu.dataset.state === "open";
  let activeTimeline = null;

  links.forEach(splitOnce);

  const getChars = () => links.flatMap((link) => [...link.querySelectorAll(".char")]);
  const killAnimations = () => {
    activeTimeline?.kill();
    activeTimeline = null;
    gsap.killTweensOf([menu, closeButton, coverBox, ...getChars()].filter(Boolean));
  };

  const setState = (open) => {
    menu.dataset.state = open ? "open" : "closed";
    menu.classList.toggle("is-menu-open", open);
    menu.setAttribute("aria-hidden", String(!open));
    openButton.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-is-open", open);
  };

  // Opening choreography: the panel slides in (0.75s), the close button rotates
  // in after it, covers sharpen from 0.65s, and each link reveals its own chars
  // in parallel at 0.15s per char.
  const animateOpen = () => {
    killAnimations();
    activeTimeline = gsap
      .timeline()
      .fromTo(menu, { opacity: 1, yPercent: -100 }, { opacity: 1, yPercent: 0, duration: 0.75, ease: "power1.out" })
      .fromTo(closeButton, { opacity: 0, rotation: -45 }, { opacity: 1, rotation: 0, duration: 0.3 });
    if (coverBox) {
      activeTimeline.fromTo(
        coverBox,
        { filter: "blur(5px)", scale: 1.1 },
        { filter: "blur(0px)", scale: 1, duration: 0.75 },
        0.65,
      );
    }
    links.forEach((link) => {
      [...link.querySelectorAll(".char")].forEach((char, index) => {
        gsap.fromTo(
          char,
          { opacity: 0, x: -30, filter: "blur(8px)" },
          { opacity: 1, x: 0, filter: "blur(0px)", duration: 1, delay: index * 0.15, ease: "power1.out" },
        );
      });
    });
  };

  // Closing choreography: chars fly out to the right, the close button rotates
  // away, covers zoom back, and the panel leaves half a second in.
  const animateClose = (onComplete) => {
    killAnimations();
    links.forEach((link) => {
      [...link.querySelectorAll(".char")].forEach((char, index) => {
        gsap.to(char, { opacity: 0, x: 30, filter: "blur(8px)", duration: 0.5, delay: index * 0.05, ease: "power1.out" });
      });
    });
    activeTimeline = gsap.timeline({ onComplete }).to(closeButton, { opacity: 0, rotation: 45, duration: 0.35 });
    if (coverBox) activeTimeline.to(coverBox, { scale: 1.1, duration: 1.25 }, 0);
    activeTimeline.to(menu, { yPercent: -100, ease: "power1.in", duration: 0.5 }, "<.5");
  };

  const open = () => {
    if (isOpen) return;
    isOpen = true;
    lastFocusedElement = document.activeElement;
    setState(true);
    window.siteLenis?.stop();
    try {
      animateOpen();
    } catch {
      // Visibility and interaction are CSS-driven, so a failed animation cannot trap the menu.
    }
    requestAnimationFrame(() => menuPanel?.focus());
  };

  const close = () => {
    if (!isOpen) return;
    isOpen = false;
    openButton.setAttribute("aria-expanded", "false");
    window.siteLenis?.start();
    const finish = () => {
      setState(false);
      // Hand the transform back to the stylesheet once the exit lands.
      gsap.set(menu, { clearProps: "transform,opacity" });
    };
    try {
      animateClose(finish);
    } catch {
      finish();
    }
    lastFocusedElement?.focus?.();
  };

  const onKeydown = (event) => {
    if (event.key === "Escape") close();
  };
  const onCoverEnter = (index) => {
    covers.forEach((cover, coverIndex) => {
      cover.classList.toggle("js-menu-cover--active", coverIndex === index);
    });
  };
  const coverHandlers = items.map((_, index) => () => onCoverEnter(index));

  setState(isOpen);
  menu.dataset.menuInteractive = "true";
  openButton.addEventListener("click", open);
  closeButton.addEventListener("click", close);
  document.addEventListener("keydown", onKeydown);
  items.forEach((item, index) => item.addEventListener("mouseenter", coverHandlers[index]));

  const cleanup = () => {
    openButton.removeEventListener("click", open);
    closeButton.removeEventListener("click", close);
    document.removeEventListener("keydown", onKeydown);
    items.forEach((item, index) => item.removeEventListener("mouseenter", coverHandlers[index]));
    document.body.classList.remove("menu-is-open");
    try {
      killAnimations();
    } catch {}
  };

  menu._menuCleanup = cleanup;
  return cleanup;
}
