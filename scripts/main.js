import { initDarkMode } from './darkMode.js';
import { initParallaxScroll } from './parallaxScroll.js';
import { initIntersectionObserver } from './intersectionObserver.js';
import { initChat } from './chat.js';

document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    initParallaxScroll();
    initIntersectionObserver();
    initChat();

    // Easter Egg Logic
    const wrenchIcon = document.getElementById('wrenchIcon');
    const easterEggMessage = document.getElementById('easterEggMessage');
    let clickCount = 0;

    if (wrenchIcon && easterEggMessage) {
        wrenchIcon.style.cursor = 'pointer'; // Indicate it's clickable
        wrenchIcon.addEventListener('click', () => {
            clickCount++;
            if (clickCount >= 5) {
                easterEggMessage.style.display = 'block';
                clickCount = 0; // Reset count after showing

                // Hide the message after 4 seconds
                setTimeout(() => {
                    easterEggMessage.style.display = 'none';
                }, 4000);
            }
        });
    }
});