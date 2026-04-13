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
    const ticket = 'BC-' + Math.floor(100000 + Math.random() * 900000);
    formNote.textContent = `Doubt received. Ticket ${ticket} is created. Team BrahmaCode will connect soon.`;
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

const rankPredictor = document.getElementById('rank-predictor');
const predictorNote = document.getElementById('predictor-note');

if (rankPredictor && predictorNote) {
  rankPredictor.addEventListener('submit', (event) => {
    event.preventDefault();
    const scoreInput = document.getElementById('exam-score');
    const score = Number(scoreInput?.value || 0);

    if (Number.isNaN(score) || score < 0 || score > 1000) {
      predictorNote.textContent = 'Please enter a valid NIMCET score between 0 and 1000.';
      predictorNote.classList.remove('success');
      return;
    }

    let rankRange = '12,000+';
    if (score >= 850) rankRange = '1 - 300';
    else if (score >= 780) rankRange = '300 - 1,000';
    else if (score >= 700) rankRange = '1,000 - 3,000';
    else if (score >= 620) rankRange = '3,000 - 6,000';
    else if (score >= 520) rankRange = '6,000 - 12,000';

    predictorNote.textContent = `Estimated NIMCET rank range: ${rankRange} (demo estimator).`;
    predictorNote.classList.add('success');
  });
}

const faqQuestions = document.querySelectorAll('.faq-question');
faqQuestions.forEach((button) => {
  button.addEventListener('click', () => {
    const parent = button.closest('.faq-item');
    if (!parent) return;
    parent.classList.toggle('is-open');
  });
});

const courseSearch = document.getElementById('course-search');
const levelFilter = document.getElementById('level-filter');
const courseCards = document.querySelectorAll('[data-course-card]');

function runCourseFilter() {
  if (!courseCards.length) return;

  const text = (courseSearch?.value || '').toLowerCase().trim();
  const level = (levelFilter?.value || '').toLowerCase();

  courseCards.forEach((card) => {
    const title = (card.getAttribute('data-title') || '').toLowerCase();
    const cardLevel = (card.getAttribute('data-level') || '').toLowerCase();
    const textMatch = !text || title.includes(text);
    const levelMatch = !level || level === 'all' || cardLevel === level;
    card.style.display = textMatch && levelMatch ? '' : 'none';
  });
}

courseSearch?.addEventListener('input', runCourseFilter);
levelFilter?.addEventListener('change', runCourseFilter);
