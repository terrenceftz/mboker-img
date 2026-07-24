export function initBackToTop() {
  const button = document.querySelector(".backtotop");
  if (!button) return () => {};

  const update = () => {
    const visible = window.scrollY > 100;
    button.style.display = visible ? "block" : "none";
    button.style.opacity = visible ? "1" : "0";
  };
  const scrollToTop = (event) => {
    event.preventDefault();
    window.siteLenis?.scrollTo(0, { duration: 0.5 });
  };

  update();
  window.addEventListener("scroll", update, { passive: true });
  button.addEventListener("click", scrollToTop);
  return () => {
    window.removeEventListener("scroll", update);
    button.removeEventListener("click", scrollToTop);
  };
}
