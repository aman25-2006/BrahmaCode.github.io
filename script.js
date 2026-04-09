// Tiny interactions only: keep it lightweight and student-project friendly.
const reveals = document.querySelectorAll('.reveal');
const menuToggle = document.getElementById('menu-toggle');
const mainNav = document.getElementById('main-nav');

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

reveals.forEach((item) => revealObserver.observe(item));

if (menuToggle && mainNav) {
  menuToggle.addEventListener('click', () => {
    const isOpen = mainNav.classList.toggle('is-open');
    menuToggle.setAttribute('aria-expanded', String(isOpen));
    menuToggle.textContent = isOpen ? 'Close' : 'Menu';
  });
}

const doubtForm = document.getElementById('doubt-form');
const formNote = document.getElementById('form-note');

if (doubtForm && formNote) {
  doubtForm.addEventListener('submit', (event) => {
    event.preventDefault();
    formNote.textContent = 'Doubt received. Team BrahmaCode will connect soon. Keep practicing.';
    formNote.classList.add('success');
    doubtForm.reset();
  });
}

// Smooth progress fill for dashboard preview
window.addEventListener('load', () => {
  const progressFill = document.getElementById('progress-fill');
  const progressValue = document.getElementById('progress-value');
  const target = 68;

  if (!progressFill || !progressValue) {
    return;
  }

  requestAnimationFrame(() => {
    progressFill.style.width = target + '%';
  });

  // Small counter animation so it feels alive
  let current = 0;
  const timer = setInterval(() => {
    current += 2;
    if (current >= target) {
      current = target;
      clearInterval(timer);
    }
    progressValue.textContent = current + '%';
  }, 28);
});
