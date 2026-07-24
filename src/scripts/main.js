import { initBackToTop } from "./animation/back-to-top.js";
import { initCategoryAnimations } from "./animation/category.js";
import { initContactAnimations } from "./animation/contact.js";
import { initMenu } from "./animation/menu.js";
import { initPageAnimations } from "./animation/page-intros.js";
import { initContentReveals, initTextReveals, prepareContentReveals } from "./animation/reveals.js";

prepareContentReveals();
initMenu();
initPageAnimations();
initTextReveals();
initContentReveals();
initCategoryAnimations();
initContactAnimations();
initBackToTop();
