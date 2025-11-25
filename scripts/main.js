import { initDarkMode } from './darkMode.js';
import { initParallaxScroll } from './parallaxScroll.js';
import { initIntersectionObserver } from './intersectionObserver.js';

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initParallaxScroll();
    initIntersectionObserver();
});