// Navbar Scroll Effect
const navbar = document.querySelector('.navbar');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    navbar.classList.add('scrolled');
  } else {
    navbar.classList.remove('scrolled');
  }
});

// Mobile Menu
const hamburger = document.querySelector('.hamburger');
const navLinks = document.querySelector('.nav-links');

hamburger.addEventListener('click', () => {
  navLinks.classList.toggle('active');
});

// Smooth Scroll for Anchor Links (Polyfill-like behavior if CSS smooth-scroll fails or for more control)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    navLinks.classList.remove('active'); // Close mobile menu on click

    const targetId = this.getAttribute('href');
    if (targetId === '#') return;

    const targetElement = document.querySelector(targetId);
    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: 'smooth'
      });
    }
  });
});

// Fade In Animation on Scroll
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('fade-in-visible');
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.section').forEach(section => {
  section.classList.add('fade-in');
  observer.observe(section);
});

// Add CSS for fade-in dynamically
const style = document.createElement('style');
style.innerHTML = `
  .fade-in {
    opacity: 0;
    transform: translateY(20px);
    transition: opacity 0.6s ease-out, transform 0.6s ease-out;
  }
  .fade-in-visible {
    opacity: 1;
    transform: translateY(0);
  }
`;
document.head.appendChild(style);

// Modal Logic
const modalTriggers = document.querySelectorAll('[data-modal]');
const closeButtons = document.querySelectorAll('.close-btn');
const modals = document.querySelectorAll('.modal');

function openModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) {
    modal.style.display = 'flex';
    // Trigger reflow to enable transition
    modal.offsetHeight;
    modal.classList.add('show');
    document.body.style.overflow = 'hidden'; // Prevent background scrolling
  }
}

function closeModal(modal) {
  modal.classList.remove('show');
  setTimeout(() => {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }, 300); // Match transition duration
}

modalTriggers.forEach(trigger => {
  trigger.addEventListener('click', () => {
    const modalId = trigger.getAttribute('data-modal');
    openModal(modalId);
  });
});

closeButtons.forEach(btn => {
  btn.addEventListener('click', (e) => {
    const modal = e.target.closest('.modal');
    closeModal(modal);
  });
});

window.addEventListener('click', (e) => {
  if (e.target.classList.contains('modal')) {
    closeModal(e.target);
  }
});

// Close on Escape key
window.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    const openModalEl = document.querySelector('.modal.show');
    if (openModalEl) {
      closeModal(openModalEl);
    }
  }
});
