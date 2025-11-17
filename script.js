// Navbar scroll effect
window.addEventListener('scroll', () => {
    const navbar = document.getElementById('navbar');
    if (window.scrollY > 100) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
});

// Intersection Observer for fade-in animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -100px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
        }
    });
}, observerOptions);

// Observe all sections
document.querySelectorAll('section').forEach(section => {
    observer.observe(section);
});

// Contact Modal Functions
function showContactModal() {
    const modal = document.getElementById('contactModal');
    modal.style.display = 'flex';
    modal.style.animation = 'fadeInUp 0.4s ease-out';
}

function closeContactModal() {
    const modal = document.getElementById('contactModal');
    modal.style.animation = 'fadeOut 0.3s ease-out';
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300);
}

// Handle form submission
function handleSubmit(event) {
    event.preventDefault();

    // Create success message modal
    const successModal = document.createElement('div');
    successModal.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0, 0, 0, 0.9); z-index: 10001; display: flex; align-items: center; justify-content: center;';
    successModal.innerHTML = `
        <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); padding: 3rem; border-radius: 20px; max-width: 400px; width: 90%; border: 2px solid #00d4ff; text-align: center;">
            <div style="font-size: 4rem; margin-bottom: 1rem;">✨</div>
            <h3 style="font-family: 'Orbitron', sans-serif; font-size: 1.8rem; margin-bottom: 1rem; color: #00d4ff;">
                Cảm ơn bạn!
            </h3>
            <p style="color: #94a3b8; margin-bottom: 2rem;">
                Mình đã nhận được tín hiệu của bạn rồi! Sẽ liên hệ sớm nhất nhé 💝
            </p>
            <button onclick="this.closest('div').parentElement.remove()" style="padding: 0.8rem 2rem; background: linear-gradient(135deg, #00d4ff 0%, #ff6b35 100%); border: none; border-radius: 10px; color: #0a0e27; font-weight: 600; cursor: pointer; font-family: 'Exo 2', sans-serif; font-size: 1rem;">
                Đóng
            </button>
        </div>
    `;

    document.body.appendChild(successModal);
    closeContactModal();

    // Reset form
    event.target.reset();
}

// Close modal when clicking outside
document.getElementById('contactModal').addEventListener('click', (e) => {
    if (e.target.id === 'contactModal') {
        closeContactModal();
    }
});

// Smooth scroll for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});