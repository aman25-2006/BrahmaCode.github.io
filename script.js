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

function getCourses() {
  return window.BCStore ? window.BCStore.getList('courses') : [];
}

function getCourseProgress(course) {
  if (!window.BCStore || !course) return Number(course?.defaultProgress || 0);
  return window.BCStore.getCourseProgress(course.id);
}

function escapeText(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

const CHATBOT_STORAGE_KEY = 'bc_chatbot_history_v1';

function getChatbotHistory() {
  try {
    const raw = localStorage.getItem(CHATBOT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(-24) : [];
  } catch {
    return [];
  }
}

function saveChatbotHistory(history) {
  try {
    localStorage.setItem(CHATBOT_STORAGE_KEY, JSON.stringify(history.slice(-24)));
  } catch {
    // Ignore storage failures in demo mode.
  }
}

function getDemoBotReply(message) {
  const text = String(message || '').toLowerCase();

  if (/course|learn|start|beginner|path/.test(text)) {
    return 'Great choice. Start with a beginner course path, then practice 2-3 problems daily. You can open the Courses page and pick a path by level.';
  }

  if (/job|intern|placement|resume|career/.test(text)) {
    return 'For career prep, focus on DSA + 2 projects + weekly resume updates. You can track opportunities in the Jobs section on this site.';
  }

  if (/doubt|stuck|error|bug|why/.test(text)) {
    return 'When you are stuck: share your goal, code snippet, input, output, and expected output. That gives faster and more accurate help.';
  }

  if (/python|java|cpp|javascript|react|node/.test(text)) {
    return 'Nice tech stack choice. A strong plan is concept -> small project -> revision notes -> interview questions. Stay consistent for 4-6 weeks.';
  }

  if (/hello|hi|hey/.test(text)) {
    return 'Hello. I am the BrahmaCode AI demo assistant. Ask me about coding paths, practice plans, or interview prep.';
  }

  return 'This is a demo AI chatbot response. Connect this widget to your backend LLM API to get real-time intelligent answers.';
}

function getLiveAiConfig() {
  const config = window.BRAHMACODE_AI_CONFIG || {};
  const apiKey = String(config.apiKey || '').trim();
  const model = String(config.model || 'gemini-1.5-flash').trim() || 'gemini-1.5-flash';
  const endpoint = String(config.endpoint || '').trim();
  return { apiKey, model, endpoint };
}

async function getLiveBotReply(message, history = []) {
  const { apiKey, model, endpoint } = getLiveAiConfig();
  if (!apiKey) return null;

  const finalEndpoint = endpoint || `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const recent = history.slice(-8).map((entry) => ({
    role: entry.role === 'user' ? 'user' : 'model',
    parts: [{ text: String(entry.text || '') }]
  }));

  const payload = {
    systemInstruction: {
      parts: [{ text: 'You are BrahmaCode assistant. Be concise, practical, and student-friendly. Prefer study plans, debugging steps, and placement guidance.' }]
    },
    contents: [
      ...recent,
      { role: 'user', parts: [{ text: String(message || '') }] }
    ],
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 220
    }
  };

  try {
    const response = await fetch(finalEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.map((part) => part.text || '').join(' ').trim();
    return text || null;
  } catch {
    return null;
  }
}

function initChatbotDemo() {
  if (document.getElementById('bc-chatbot-root')) return;
  if (!document.body) return;

  const root = document.createElement('section');
  root.id = 'bc-chatbot-root';
  root.className = 'bc-chatbot';
  root.innerHTML = `
    <button class="bc-chatbot-toggle" id="bc-chatbot-toggle" aria-expanded="false" aria-controls="bc-chatbot-panel" aria-label="Open AI chatbot demo">
      <span class="bc-chatbot-toggle-dot" aria-hidden="true"></span>
      AI Chat Demo
    </button>
    <div class="bc-chatbot-panel" id="bc-chatbot-panel" hidden>
      <div class="bc-chatbot-head">
        <div>
          <p class="bc-chatbot-kicker">BrahmaCode Assistant</p>
          <h3>AI Chatbot Demo</h3>
        </div>
        <button class="bc-chatbot-clear" id="bc-chatbot-clear" type="button">Clear</button>
      </div>
      <div class="bc-chatbot-messages" id="bc-chatbot-messages" aria-live="polite"></div>
      <form class="bc-chatbot-form" id="bc-chatbot-form">
        <input id="bc-chatbot-input" type="text" maxlength="240" placeholder="Ask about courses, jobs, or doubts..." autocomplete="off" required />
        <button type="submit">Send</button>
      </form>
      <p class="bc-chatbot-note" id="bc-chatbot-note">Checking AI connection...</p>
    </div>
  `;

  document.body.appendChild(root);

  const toggle = document.getElementById('bc-chatbot-toggle');
  const panel = document.getElementById('bc-chatbot-panel');
  const clearButton = document.getElementById('bc-chatbot-clear');
  const messages = document.getElementById('bc-chatbot-messages');
  const form = document.getElementById('bc-chatbot-form');
  const input = document.getElementById('bc-chatbot-input');
  const note = document.getElementById('bc-chatbot-note');

  if (!toggle || !panel || !clearButton || !messages || !form || !input || !note) return;

  let history = getChatbotHistory();

  const scrollToBottom = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  const renderMessage = (role, text, persist = true) => {
    const item = document.createElement('article');
    item.className = `bc-msg ${role === 'user' ? 'is-user' : 'is-bot'}`;
    item.innerHTML = `<p>${escapeText(text)}</p>`;
    messages.appendChild(item);

    if (persist) {
      history.push({ role, text });
      history = history.slice(-24);
      saveChatbotHistory(history);
    }

    scrollToBottom();
  };

  const renderTyping = (show) => {
    const existing = document.getElementById('bc-chatbot-typing');
    if (show && !existing) {
      const typing = document.createElement('article');
      typing.id = 'bc-chatbot-typing';
      typing.className = 'bc-msg is-bot is-typing';
      typing.innerHTML = '<p>Assistant is thinking...</p>';
      messages.appendChild(typing);
      scrollToBottom();
    }
    if (!show && existing) {
      existing.remove();
    }
  };

  const updateModeNote = () => {
    const hasLiveKey = Boolean(getLiveAiConfig().apiKey);
    note.textContent = hasLiveKey
      ? 'Live mode: connected to AI API.'
      : 'Demo mode: responses are simulated in browser.';
  };

  updateModeNote();
  if (window.BRAHMACODE_FIREBASE_READY && typeof window.BRAHMACODE_FIREBASE_READY.then === 'function') {
    window.BRAHMACODE_FIREBASE_READY.finally(updateModeNote);
  }

  if (history.length) {
    history.forEach((entry) => renderMessage(entry.role, entry.text, false));
  } else {
    renderMessage('bot', 'Welcome to BrahmaCode AI demo. Ask me about learning paths, coding practice, or placements.', true);
  }

  toggle.addEventListener('click', () => {
    const isOpen = !panel.hidden;
    panel.hidden = isOpen;
    toggle.setAttribute('aria-expanded', String(!isOpen));
    if (!isOpen) {
      input.focus();
      scrollToBottom();
    }
  });

  clearButton.addEventListener('click', () => {
    history = [];
    saveChatbotHistory(history);
    messages.innerHTML = '';
    renderMessage('bot', 'Chat cleared. Ask a new question to continue the demo.', true);
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const userText = input.value.trim();
    if (!userText) return;

    renderMessage('user', userText, true);
    input.value = '';
    input.focus();
    input.disabled = true;
    renderTyping(true);

    if (window.BRAHMACODE_FIREBASE_READY && typeof window.BRAHMACODE_FIREBASE_READY.then === 'function') {
      try {
        await window.BRAHMACODE_FIREBASE_READY;
      } catch {
        // Continue with fallback mode.
      }
    }

    window.setTimeout(async () => {
      renderTyping(false);
      const reply = (await getLiveBotReply(userText, history)) || getDemoBotReply(userText);
      renderMessage('bot', reply, true);
      input.disabled = false;
      input.focus();
      updateModeNote();
    }, 800 + Math.floor(Math.random() * 450));
  });
}

function renderCourseCard(course, options = {}) {
  const progress = getCourseProgress(course);
  const iconByCategory = {
    'Web Development': 'WD',
    'Data Structures & Algorithms': 'DSA',
    'Python / AI': 'AI'
  };
  const courseIcon = course.icon || iconByCategory[course.category] || 'BC';
  const featuredTag = course.featured ? '<span class="course-chip">Featured</span>' : '';
  const popularTag = course.popular ? '<span class="course-chip course-chip-soft">Popular</span>' : '';
  const compactClass = options.compact ? ' course-card-compact' : '';
  const buttonLabel = options.resume ? 'Continue Learning' : 'Start Learning';
  const actionClass = options.resume ? 'btn btn-muted' : 'btn btn-primary';
  const tagRow = [featuredTag, popularTag].filter(Boolean).join('');

  return `<article class="course-card${compactClass}" data-course-card data-title="${escapeText(course.title)}" data-level="${escapeText(course.level)}" data-category="${escapeText(course.category)}">
    <div class="course-card-head">
      <div>
        <span class="course-icon" aria-hidden="true">${escapeText(courseIcon)}</span>
        <p class="course-category">${escapeText(course.category)}</p>
        <h3>${escapeText(course.title)}</h3>
      </div>
      <div class="course-meta-stack">
        <span class="course-level">${escapeText(course.level)}</span>
        <span class="course-duration">${escapeText(course.duration)}</span>
      </div>
    </div>
    <p class="course-description">${escapeText(course.description)}</p>
    <div class="course-tags">${tagRow}</div>
    <div class="course-progress-block">
      <div class="course-progress-label">
        <span>Progress</span>
        <strong>${progress}%</strong>
      </div>
      <div class="progress-track course-progress-track"><span class="progress-fill" style="width:${progress}%"></span></div>
    </div>
    <div class="card-actions">
      <a class="${actionClass}" href="course.html?id=${encodeURIComponent(course.id)}" data-open-course="${escapeText(course.id)}">${buttonLabel}</a>
      <a class="btn btn-muted" href="course.html?id=${encodeURIComponent(course.id)}#overview" data-open-course="${escapeText(course.id)}">View Details</a>
    </div>
  </article>`;
}

function renderCourseHub() {
  const courseGrid = document.getElementById('course-grid');
  if (!courseGrid) return;

  const featuredRoot = document.getElementById('featured-courses');
  const popularRoot = document.getElementById('popular-courses');
  const continueRoot = document.getElementById('continue-learning-root');
  const countRoot = document.getElementById('course-count');
  const search = document.getElementById('course-search');
  const levelFilter = document.getElementById('level-filter');
  const pathFilter = document.getElementById('path-filter');

  const courses = getCourses();
  const searchValue = (search?.value || '').toLowerCase().trim();
  const levelValue = (levelFilter?.value || 'all').toLowerCase();
  const pathValue = (pathFilter?.value || 'all').toLowerCase();

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = !searchValue || `${course.title} ${course.description} ${course.category}`.toLowerCase().includes(searchValue);
    const matchesLevel = levelValue === 'all' || course.level.toLowerCase() === levelValue;
    const matchesPath = pathValue === 'all' || course.category.toLowerCase() === pathValue;
    return matchesSearch && matchesLevel && matchesPath;
  });

  const featuredCourses = courses.filter((course) => course.featured).slice(0, 3);
  const popularCourses = courses.filter((course) => course.popular).slice(0, 3);
  const currentId = window.BCStore?.getCurrentCourseId?.() || filteredCourses[0]?.id || courses[0]?.id || '';
  const currentCourse = courses.find((course) => course.id === currentId) || courses[0];

  countRoot.textContent = `${filteredCourses.length} courses matched`;
  courseGrid.innerHTML = filteredCourses.length
    ? filteredCourses.map((course) => renderCourseCard(course)).join('')
    : '<p class="form-note">No courses found for the current filters.</p>';

  if (featuredRoot) {
    featuredRoot.innerHTML = featuredCourses.map((course) => renderCourseCard(course, { compact: true })).join('');
  }

  if (popularRoot) {
    popularRoot.innerHTML = popularCourses.map((course) => renderCourseCard(course, { compact: true })).join('');
  }

  if (continueRoot && currentCourse) {
    continueRoot.innerHTML = `<article class="continue-card">
      <div class="continue-card-top">
        <div>
          <p class="tiny-label">continue learning</p>
          <h3>${escapeText(currentCourse.title)}</h3>
          <p>${escapeText(currentCourse.description)}</p>
        </div>
        <div class="continue-progress">
          <span>${getCourseProgress(currentCourse)}%</span>
          <small>complete</small>
        </div>
      </div>
      <div class="progress-track"><span class="progress-fill" style="width:${getCourseProgress(currentCourse)}%"></span></div>
      <div class="card-actions">
        <a class="btn btn-primary" href="course.html?id=${encodeURIComponent(currentCourse.id)}" data-open-course="${escapeText(currentCourse.id)}">Continue Learning</a>
        <a class="btn btn-muted" href="course.html?id=${encodeURIComponent(currentCourse.id)}#modules" data-open-course="${escapeText(currentCourse.id)}">Open Modules</a>
      </div>
    </article>`;
  }
}

function renderCourseDetail() {
  const root = document.getElementById('course-detail-root');
  if (!root || !window.BCStore) return;

  const params = new URLSearchParams(window.location.search);
  const courseId = params.get('id');
  const course = courseId ? window.BCStore.getById('courses', courseId) : window.BCStore.getList('courses')[0];

  if (!course) {
    root.innerHTML = '<p class="form-note">Course not found. Go back to the Courses page.</p>';
    return;
  }

  window.BCStore.setCurrentCourseId(course.id);
  const progress = getCourseProgress(course);
  const modules = Array.isArray(course.modules) ? course.modules : [];
  const lessons = Array.isArray(course.lessons) ? course.lessons : [];
  const modulesMarkup = modules.length
    ? modules.map((module) => `<li>${escapeText(module)}</li>`).join('')
    : '<li>No modules added yet.</li>';
  const lessonsMarkup = lessons.length
    ? lessons.map((lesson) => `<article class="lesson-card"><p class="lesson-label">Example lesson</p><h4>${escapeText(lesson)}</h4><p>Short walkthrough, practice, and review.</p></article>`).join('')
    : '<p class="form-note">No lessons added yet.</p>';
  const videoMarkup = course.videoUrl
    ? `<a class="btn btn-muted" href="${escapeText(course.videoUrl)}" target="_blank" rel="noopener noreferrer">Open Video Placeholder</a>`
    : '<div class="video-placeholder"><span>Video lesson placeholder</span><p>Drop in a future lecture link or embed here.</p></div>';
  const certificateMarkup = course.certificateEnabled !== false
    ? '<div class="certificate-card"><p class="tiny-label">certificate</p><h4>Completion certificate enabled</h4><p>Unlock a certificate preview after finishing the final module.</p></div>'
    : '<div class="certificate-card"><p class="tiny-label">certificate</p><h4>Certificate not enabled</h4><p>This course currently ships without a certificate placeholder.</p></div>';

  root.innerHTML = `
    <article class="detail-hero" id="overview">
      <a class="back-link" href="courses.html">Back to Courses</a>
      <div class="detail-hero-grid">
        <div>
          <p class="tiny-label">${escapeText(course.category)}</p>
          <h1>${escapeText(course.title)}</h1>
          <p class="detail-meta">${escapeText(course.level)} • ${escapeText(course.duration)}</p>
          <p class="detail-summary">${escapeText(course.overview || course.description)}</p>
          <div class="card-actions">
            <a class="btn btn-primary" href="courses.html#all-courses" data-open-course="${escapeText(course.id)}">Back to Courses</a>
            <button id="progress-step-btn" class="btn btn-muted" type="button">Mark Next Lesson Complete</button>
          </div>
        </div>
        <aside class="detail-progress-card">
          <p class="tiny-label">progress</p>
          <div class="detail-progress-value"><strong id="detail-progress-value">${progress}%</strong><span>complete</span></div>
          <div class="progress-track"><span id="detail-progress-fill" class="progress-fill" style="width:${progress}%"></span></div>
          <p class="detail-progress-note">Resume from where you left off. Progress is saved locally in this demo.</p>
        </aside>
      </div>
    </article>

    <section class="detail-grid">
      <article class="detail-panel" id="modules">
        <h2>Course Modules</h2>
        <ul class="module-list">${modulesMarkup}</ul>
      </article>
      <article class="detail-panel">
        <h2>Example Lessons</h2>
        <div class="lesson-grid">${lessonsMarkup}</div>
      </article>
      <article class="detail-panel">
        <h2>Video Lesson Placeholder</h2>
        ${videoMarkup}
      </article>
      <article class="detail-panel">
        <h2>Certificate System</h2>
        ${certificateMarkup}
      </article>
    </section>
  `;

  const progressFill = document.getElementById('detail-progress-fill');
  const progressValue = document.getElementById('detail-progress-value');
  const progressStepBtn = document.getElementById('progress-step-btn');

  progressStepBtn?.addEventListener('click', () => {
    const nextProgress = Math.min(100, getCourseProgress(course) + 12);
    window.BCStore.saveCourseProgress(course.id, nextProgress);
    progressFill.style.width = `${nextProgress}%`;
    progressValue.textContent = `${nextProgress}%`;
    renderCourseHub();
  });
}

document.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-open-course]');
  if (!trigger || !window.BCStore) return;
  const courseId = trigger.getAttribute('data-open-course');
  if (courseId) {
    window.BCStore.setCurrentCourseId(courseId);
  }
});

window.addEventListener('DOMContentLoaded', () => {
  initChatbotDemo();

  if (!window.BCStore) return;
  renderCourseHub();
  renderCourseDetail();

  const search = document.getElementById('course-search');
  const levelFilter = document.getElementById('level-filter');
  const pathFilter = document.getElementById('path-filter');
  const pathButtons = document.querySelectorAll('[data-path-filter]');

  [search, levelFilter, pathFilter].forEach((field) => {
    field?.addEventListener('input', renderCourseHub);
    field?.addEventListener('change', renderCourseHub);
  });

  pathButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const path = button.getAttribute('data-path-filter') || 'all';
      if (pathFilter) {
        pathFilter.value = path;
      }
      renderCourseHub();
      document.getElementById('all-courses')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
});
