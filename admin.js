// Admin system with Firebase-ready storage and a safe localStorage fallback.
const ADMIN_STORE_KEY = 'bc_admin_accounts';
const ADMIN_SESSION_KEY = 'bc_admin_session';
const CONTENT_STORE_KEY = 'bc_content_overrides';
const FIREBASE_SDK_VERSION = '10.12.5';

const DEFAULT_ADMIN = { id: 'amankumar0123', password: 'aman1234' };
const CONTENT_DEFAULTS = {
  'home.heroTitle': 'Learn. Practice. Grow.',
  'home.heroSubtext':
    'BrahmaCode is a student-first platform where coding is not just theory, it becomes daily progress. Ask doubts, solve DSA problems, and move your learning journey with a clear direction.',
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
  const form = document.getElementById('admin-login-form');
  const note = document.getElementById('admin-login-note');
  if (!form || !note) return;

  await readAdmins();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const adminId = document.getElementById('admin-id').value.trim();
    const adminPassword = document.getElementById('admin-password').value;
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
  const form = document.getElementById('google-dummy-form');
  const note = document.getElementById('google-note');
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

async function renderAdminList() {
  const container = document.getElementById('admin-list');
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
  const panelRoot = document.getElementById('session-user');
  if (!panelRoot) return;

  const user = currentSessionUser();
  if (!user) {
    window.location.href = 'admin-login.html';
    return;
  }

  panelRoot.textContent = `Logged in as: ${user}`;

  const logoutBtn = document.getElementById('logout-btn');
  logoutBtn?.addEventListener('click', () => {
    clearSessionUser();
    window.location.href = 'admin-login.html';
  });

  const addAdminForm = document.getElementById('add-admin-form');
  const adminNote = document.getElementById('admin-manage-note');

  addAdminForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const idField = document.getElementById('new-admin-id');
    const passField = document.getElementById('new-admin-password');
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

  const contentForm = document.getElementById('content-form');
  const contentNote = document.getElementById('content-note');
  const resetBtn = document.getElementById('reset-content-btn');

  contentForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const overrides = {};

    document.querySelectorAll('[data-content-key]').forEach((field) => {
      const key = field.getAttribute('data-content-key');
      const value = field.value.trim();
      if (value) overrides[key] = value;
    });

    await saveContentOverrides(overrides);
    contentNote.textContent = 'Content saved. Refresh the website pages to view changes.';
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
  await applyContentOverrides();
  await initAdminLogin();
  initGoogleDummy();
  await initAdminPanel();
});
