// Admin system with Firebase-ready storage and a safe localStorage fallback.
const ADMIN_STORE_KEY = 'bc_admin_accounts';
const ADMIN_SESSION_KEY = 'bc_admin_session';
const CONTENT_STORE_KEY = 'bc_content_overrides';
const FIREBASE_SDK_VERSION = '10.12.5';

const DEFAULT_ADMIN = { id: 'amankumar0123', password: 'aman1234' };
const CONTENT_DEFAULTS = {
  'home.heroTitle': 'Learn. Practice. Grow.',
  'home.heroSubtext':
    "India's AI-powered Coding Practice Platform for Students. BrahmaCode is a student-first platform where coding is not just theory, it becomes daily progress. Ask doubts, solve DSA problems, and move your learning journey with a clear direction.",
  'home.heroNote': 'Built for students who feel coding is tough, but still show up.',
  'courses.heroTitle': 'Courses that feel doable, not overwhelming.',
  'courses.heroSubtext':
    'Every course here is designed around student pace. Clear explanations, weekly tasks, and realistic milestones.',
  'doubt.heroTitle': 'Stuck? Send your doubt and we will solve it together.'
};

const FIREBASE_COLLECTION = 'brahmacode_site';
const FIREBASE_DOCS = {
  admins: 'admins',
  content: 'content'
};

const firebaseState = {
  ready: false,
  loading: null,
  db: null
};

function byId(id) {
  return document.getElementById(id);
}

function hasFirebaseConfig() {
  const config = window.BRAHMACODE_FIREBASE_CONFIG;
  return Boolean(
    config &&
      config.apiKey &&
      config.authDomain &&
      config.projectId &&
      config.appId
  );
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = src;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load ${src}`));
    document.head.appendChild(script);
  });
}

async function ensureFirebase() {
  if (!hasFirebaseConfig()) return false;
  if (firebaseState.ready) return true;
  if (firebaseState.loading) return firebaseState.loading;

  firebaseState.loading = (async () => {
    if (!window.firebase) {
      await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-app-compat.js`);
      await loadScript(`https://www.gstatic.com/firebasejs/${FIREBASE_SDK_VERSION}/firebase-firestore-compat.js`);
    }

    if (!firebase.apps.length) {
      firebase.initializeApp(window.BRAHMACODE_FIREBASE_CONFIG);
    }

    firebaseState.db = firebase.firestore();
    firebaseState.ready = true;
    return true;
  })();

  return firebaseState.loading;
}

function localAdmins() {
  const raw = localStorage.getItem(ADMIN_STORE_KEY);
  if (!raw) return [DEFAULT_ADMIN];

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length ? parsed : [DEFAULT_ADMIN];
  } catch {
    return [DEFAULT_ADMIN];
  }
}

function saveLocalAdmins(admins) {
  localStorage.setItem(ADMIN_STORE_KEY, JSON.stringify(admins));
}

function localContentOverrides() {
  try {
    return JSON.parse(localStorage.getItem(CONTENT_STORE_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalContentOverrides(overrides) {
  localStorage.setItem(CONTENT_STORE_KEY, JSON.stringify(overrides));
}

async function readAdmins() {
  if (!(await ensureFirebase())) {
    return localAdmins();
  }

  const snapshot = await firebaseState.db.collection(FIREBASE_COLLECTION).doc(FIREBASE_DOCS.admins).get();
  const admins = snapshot.exists ? snapshot.data().items : null;
  return Array.isArray(admins) && admins.length ? admins : localAdmins();
}

async function saveAdmins(admins) {
  if (!(await ensureFirebase())) {
    saveLocalAdmins(admins);
    return;
  }

  await firebaseState.db.collection(FIREBASE_COLLECTION).doc(FIREBASE_DOCS.admins).set({ items: admins }, { merge: true });
}

async function readContentOverrides() {
  if (!(await ensureFirebase())) {
    return localContentOverrides();
  }

  const snapshot = await firebaseState.db.collection(FIREBASE_COLLECTION).doc(FIREBASE_DOCS.content).get();
  return snapshot.exists ? snapshot.data().items || {} : localContentOverrides();
}

async function saveContentOverrides(overrides) {
  if (!(await ensureFirebase())) {
    saveLocalContentOverrides(overrides);
    return;
  }

  await firebaseState.db.collection(FIREBASE_COLLECTION).doc(FIREBASE_DOCS.content).set({ items: overrides }, { merge: true });
}

async function resetContentOverrides() {
  if (!(await ensureFirebase())) {
    localStorage.removeItem(CONTENT_STORE_KEY);
    return;
  }

  await firebaseState.db.collection(FIREBASE_COLLECTION).doc(FIREBASE_DOCS.content).delete();
}

async function applyContentOverrides() {
  const overrides = await readContentOverrides();
  document.querySelectorAll('[data-edit-key]').forEach((node) => {
    const key = node.getAttribute('data-edit-key');
    if (key && typeof overrides[key] === 'string' && overrides[key].trim()) {
      node.textContent = overrides[key].trim();
    }
  });
}

function currentSessionUser() {
  return localStorage.getItem(ADMIN_SESSION_KEY);
}

function setSessionUser(id) {
  localStorage.setItem(ADMIN_SESSION_KEY, id);
}

function clearSessionUser() {
  localStorage.removeItem(ADMIN_SESSION_KEY);
}

async function initAdminLogin() {
  const form = byId('admin-login-form');
  const note = byId('admin-login-note');
  if (!form || !note) return;

  await readAdmins();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const adminId = byId('admin-id').value.trim();
    const adminPassword = byId('admin-password').value;
    const admins = await readAdmins();
    const match = admins.find((admin) => admin.id === adminId && admin.password === adminPassword);

    if (!match) {
      note.textContent = 'Invalid credentials. Please try again.';
      note.classList.remove('success');
      return;
    }

    setSessionUser(match.id);
    note.textContent = 'Login successful. Redirecting to panel...';
    note.classList.add('success');
    window.location.href = 'admin-panel.html';
  });
}

function initGoogleDummy() {
  const form = byId('google-dummy-form');
  const note = byId('google-note');
  if (!form || !note) return;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    note.textContent = 'Dummy sign-in complete. Redirecting to admin login...';
    note.classList.add('success');
    setTimeout(() => {
      window.location.href = 'admin-login.html';
    }, 700);
  });
}

function formatDate(input) {
  if (!input) return '-';
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return input;
  return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function initTabs() {
  const buttons = Array.from(document.querySelectorAll('.sidebar-link'));
  const tabs = Array.from(document.querySelectorAll('.admin-tab'));
  console.log(`initTabs: found ${buttons.length} buttons, ${tabs.length} tabs`);
  if (!buttons.length || !tabs.length) {
    console.warn('Tab buttons or sections not found in DOM');
    return;
  }

  function activate(name) {
    console.log(`Activating tab: ${name}`);
    tabs.forEach((tab) => {
      tab.hidden = tab.id !== `tab-${name}`;
    });
    buttons.forEach((button) => {
      button.classList.toggle('is-active', button.getAttribute('data-tab') === name);
    });
  }

  buttons.forEach((button) => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      console.log(`Button clicked for tab: ${tabName}`);
      activate(tabName);
    });
  });

  activate('overview');
}

function ensureBCStore() {
  if (!window.BCStore) {
    console.warn('BCStore not available, ensuring initialization...');
    return false;
  }
  return true;
}

function initOverview() {
  const root = byId('overview-cards');
  if (!root) {
    console.warn('Overview cards root not found');
    return;
  }
  if (!ensureBCStore()) {
    root.innerHTML = '<p class="form-note">Data store initializing. Refresh page if this persists.</p>';
    return;
  }

  const updates = window.BCStore.getList('updates').length;
  const problems = window.BCStore.getList('problems').length;
  const articles = window.BCStore.getList('articles').length;

  root.innerHTML = `
    <article class="content-card"><p class="tiny-label">updates</p><h3>${updates}</h3><p>Total job/internship/exam updates</p></article>
    <article class="content-card"><p class="tiny-label">problems</p><h3>${problems}</h3><p>Total coding practice problems</p></article>
    <article class="content-card"><p class="tiny-label">articles</p><h3>${articles}</h3><p>Total published articles</p></article>
  `;
  console.log(`Overview initialized: ${updates} updates, ${problems} problems, ${articles} articles`);
}

function initSettingsManager() {
  const form = byId('settings-form');
  const note = byId('settings-note');
  if (!form || !note) {
    console.warn('Settings form or note not found');
    return;
  }
  if (!ensureBCStore()) return;

  const settings = window.BCStore.getSettings();
  byId('site-title').value = settings.siteTitle || '';
  byId('site-description').value = settings.siteDescription || '';
  byId('show-batches').checked = settings.showBatches !== false;
  byId('show-results').checked = settings.showResults !== false;
  byId('show-pricing').checked = settings.showPricing !== false;
  byId('show-faq').checked = settings.showFaq !== false;
  byId('show-jobs').checked = settings.showJobsSection !== false;
  byId('show-practice').checked = settings.showPracticeSection !== false;
  byId('show-articles').checked = settings.showArticlesSection !== false;

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.BCStore.saveSettings({
      siteTitle: byId('site-title').value.trim(),
      siteDescription: byId('site-description').value.trim(),
      showBatches: byId('show-batches').checked,
      showResults: byId('show-results').checked,
      showPricing: byId('show-pricing').checked,
      showFaq: byId('show-faq').checked,
      showJobsSection: byId('show-jobs').checked,
      showPracticeSection: byId('show-practice').checked,
      showArticlesSection: byId('show-articles').checked
    });
    note.textContent = 'Settings saved successfully.';
    note.classList.add('success');
  });
}

function bindUpdatesManager() {
  const form = byId('update-form');
  const list = byId('admin-updates-list');
  const note = byId('update-note');
  if (!form || !list || !note) {
    console.warn('Updates manager: form, list, or note not found');
    return;
  }
  if (!ensureBCStore()) return;

  function render() {
    const updates = window.BCStore.getList('updates');
    list.innerHTML = updates.length
      ? updates
          .map(
            (item) => `<div class="admin-row stack-on-mobile">
          <span><strong>${item.title}</strong><br /><small>${item.category} • ${formatDate(item.date)}</small></span>
          <div class="row-actions">
            <button type="button" class="btn btn-muted edit-update" data-id="${item.id}">Edit</button>
            <button type="button" class="btn btn-muted remove-update" data-id="${item.id}">Delete</button>
          </div>
        </div>`
          )
          .join('')
      : '<p class="form-note">No updates created yet.</p>';

    list.querySelectorAll('.edit-update').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = window.BCStore.getById('updates', btn.getAttribute('data-id'));
        if (!item) return;
        byId('update-id').value = item.id;
        byId('update-title').value = item.title;
        byId('update-category').value = item.category;
        byId('update-description').value = item.description;
        byId('update-date').value = item.date;
        byId('update-link').value = item.link;
      });
    });

    list.querySelectorAll('.remove-update').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.BCStore.remove('updates', btn.getAttribute('data-id'));
        render();
        initOverview();
      });
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.BCStore.upsert('updates', {
      id: byId('update-id').value || undefined,
      title: byId('update-title').value.trim(),
      category: byId('update-category').value,
      description: byId('update-description').value.trim(),
      date: byId('update-date').value,
      link: byId('update-link').value.trim()
    });

    form.reset();
    byId('update-id').value = '';
    note.textContent = 'Update saved.';
    note.classList.add('success');
    render();
    initOverview();
  });

  render();
}

function bindProblemsManager() {
  const form = byId('problem-form');
  const list = byId('admin-problems-list');
  const note = byId('problem-note');
  if (!form || !list || !note) {
    console.warn('Problems manager: form, list, or note not found');
    return;
  }
  if (!ensureBCStore()) return;

  function render() {
    const problems = window.BCStore.getList('problems');
    list.innerHTML = problems.length
      ? problems
          .map(
            (item) => `<div class="admin-row stack-on-mobile">
          <span><strong>${item.title}</strong><br /><small>${item.difficulty}</small></span>
          <div class="row-actions">
            <button type="button" class="btn btn-muted edit-problem" data-id="${item.id}">Edit</button>
            <button type="button" class="btn btn-muted remove-problem" data-id="${item.id}">Delete</button>
          </div>
        </div>`
          )
          .join('')
      : '<p class="form-note">No problems created yet.</p>';

    list.querySelectorAll('.edit-problem').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = window.BCStore.getById('problems', btn.getAttribute('data-id'));
        if (!item) return;
        byId('problem-id').value = item.id;
        byId('problem-title').value = item.title;
        byId('problem-difficulty').value = item.difficulty;
        byId('problem-description').value = item.description;
        byId('problem-constraints').value = item.constraints;
        byId('problem-examples').value = item.examples;
        byId('problem-starter').value = item.starterCode || '';
      });
    });

    list.querySelectorAll('.remove-problem').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.BCStore.remove('problems', btn.getAttribute('data-id'));
        render();
        initOverview();
      });
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.BCStore.upsert('problems', {
      id: byId('problem-id').value || undefined,
      title: byId('problem-title').value.trim(),
      difficulty: byId('problem-difficulty').value,
      description: byId('problem-description').value.trim(),
      constraints: byId('problem-constraints').value.trim(),
      examples: byId('problem-examples').value.trim(),
      starterCode: byId('problem-starter').value
    });

    form.reset();
    byId('problem-id').value = '';
    note.textContent = 'Problem saved.';
    note.classList.add('success');
    render();
    initOverview();
  });

  render();
}

function bindArticlesManager() {
  const form = byId('article-form');
  const list = byId('admin-articles-list');
  const note = byId('article-note');
  if (!form || !list || !note) {
    console.warn('Articles manager: form, list, or note not found');
    return;
  }
  if (!ensureBCStore()) return;

  function render() {
    const articles = window.BCStore.getList('articles');
    list.innerHTML = articles.length
      ? articles
          .map(
            (item) => `<div class="admin-row stack-on-mobile">
          <span><strong>${item.title}</strong><br /><small>${formatDate(item.date)}</small></span>
          <div class="row-actions">
            <button type="button" class="btn btn-muted edit-article" data-id="${item.id}">Edit</button>
            <button type="button" class="btn btn-muted remove-article" data-id="${item.id}">Delete</button>
          </div>
        </div>`
          )
          .join('')
      : '<p class="form-note">No articles created yet.</p>';

    list.querySelectorAll('.edit-article').forEach((btn) => {
      btn.addEventListener('click', () => {
        const item = window.BCStore.getById('articles', btn.getAttribute('data-id'));
        if (!item) return;
        byId('article-id').value = item.id;
        byId('article-title').value = item.title;
        byId('article-excerpt').value = item.excerpt;
        byId('article-body').value = item.body;
        byId('article-date').value = item.date;
      });
    });

    list.querySelectorAll('.remove-article').forEach((btn) => {
      btn.addEventListener('click', () => {
        window.BCStore.remove('articles', btn.getAttribute('data-id'));
        render();
        initOverview();
      });
    });
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    window.BCStore.upsert('articles', {
      id: byId('article-id').value || undefined,
      title: byId('article-title').value.trim(),
      excerpt: byId('article-excerpt').value.trim(),
      body: byId('article-body').value.trim(),
      date: byId('article-date').value
    });

    form.reset();
    byId('article-id').value = '';
    note.textContent = 'Article saved.';
    note.classList.add('success');
    render();
    initOverview();
  });

  render();
}

async function renderAdminList() {
  const container = byId('admin-list');
  if (!container) return;

  const currentUser = currentSessionUser();
  const admins = await readAdmins();

  if (admins.length === 0) {
    container.innerHTML = '<p class="form-note">No admin accounts available.</p>';
    return;
  }

  container.innerHTML = admins
    .map((admin) => {
      const canRemove = admin.id !== DEFAULT_ADMIN.id && admin.id !== currentUser;
      return `<div class="admin-row">
        <span><strong>${admin.id}</strong>${admin.id === currentUser ? ' (you)' : ''}</span>
        ${canRemove ? `<button class="btn btn-muted remove-admin-btn" data-admin-id="${admin.id}" type="button">Remove</button>` : '<span class="chip">Protected</span>'}
      </div>`;
    })
    .join('');

  container.querySelectorAll('.remove-admin-btn').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const id = btn.getAttribute('data-admin-id');
      const next = (await readAdmins()).filter((admin) => admin.id !== id);
      await saveAdmins(next);
      renderAdminList();
    });
  });
}

async function populateContentForm() {
  const overrides = await readContentOverrides();
  document.querySelectorAll('[data-content-key]').forEach((field) => {
    const key = field.getAttribute('data-content-key');
    field.value = overrides[key] || CONTENT_DEFAULTS[key] || '';
  });
}

async function initAdminPanel() {
  const panelRoot = byId('session-user');
  if (!panelRoot) return;

  const user = currentSessionUser();
  if (!user) {
    window.location.href = 'admin-login.html';
    return;
  }

  panelRoot.textContent = `Logged in as: ${user}`;

  if (!ensureBCStore()) {
    console.error('BCStore failed to initialize after login');
  }

  const logoutBtn = byId('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    clearSessionUser();
    window.location.href = 'admin-login.html';
  });

  console.log('Starting tab initialization...');
  initTabs();
  initOverview();
  initSettingsManager();
  bindUpdatesManager();
  bindProblemsManager();
  bindArticlesManager();

  const addAdminForm = byId('add-admin-form');
  const adminNote = byId('admin-manage-note');

  addAdminForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const idField = byId('new-admin-id');
    const passField = byId('new-admin-password');
    const id = idField.value.trim();
    const password = passField.value;

    if (!id || !password) {
      adminNote.textContent = 'Admin ID and password are required.';
      return;
    }

    const admins = await readAdmins();
    if (admins.some((admin) => admin.id === id)) {
      adminNote.textContent = 'This admin ID already exists.';
      return;
    }

    admins.push({ id, password });
    await saveAdmins(admins);
    adminNote.textContent = 'New admin added.';
    adminNote.classList.add('success');
    addAdminForm.reset();
    renderAdminList();
  });

  const contentForm = byId('content-form');
  const contentNote = byId('content-note');
  const resetBtn = byId('reset-content-btn');

  contentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const overrides = {};

    document.querySelectorAll('[data-content-key]').forEach((field) => {
      const key = field.getAttribute('data-content-key');
      const value = field.value.trim();
      if (value) overrides[key] = value;
    });

    await saveContentOverrides(overrides);
    contentNote.textContent = 'Content saved. Refresh website pages to view changes.';
    contentNote.classList.add('success');
  });

  resetBtn?.addEventListener('click', async () => {
    await resetContentOverrides();
    populateContentForm();
    contentNote.textContent = 'Content overrides cleared. Defaults are restored.';
    contentNote.classList.add('success');
  });

  renderAdminList();
  populateContentForm();
}

document.addEventListener('DOMContentLoaded', async () => {
  if (window.BRAHMACODE_FIREBASE_READY) {
    await window.BRAHMACODE_FIREBASE_READY;
  }
  await applyContentOverrides();
  await initAdminLogin();
  initGoogleDummy();
  await initAdminPanel();
});
