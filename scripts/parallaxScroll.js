export function initParallaxScroll() {
    // Parallax scroll effect
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const gridBg = document.querySelector('.grid-bg');
        if (gridBg) {
            gridBg.style.transform = `translateY(${scrolled * 0.5}px)`;
        }
    });
}