(function () {
  function byId(id) {
    return document.getElementById(id);
  }

  function formatDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function applyWebsiteSettings() {
    if (!window.BCStore) return;
    const settings = window.BCStore.getSettings();

    if (settings.siteTitle) {
      document.title = settings.siteTitle;
    }

    if (settings.siteDescription) {
      const meta = document.querySelector('meta[name="description"]');
      if (meta) meta.setAttribute('content', settings.siteDescription);
    }

    document.querySelectorAll('[data-section-key]').forEach((node) => {
      const key = node.getAttribute('data-section-key');
      if (!key) return;
      const visible = settings[key] !== false;
      node.style.display = visible ? '' : 'none';
    });
  }

  function updateCard(item, type) {
    const bookType = type === 'updates' ? 'updates' : type;
    const bookmarked = window.BCStore.isBookmarked(bookType, item.id);

    if (type === 'updates') {
      return `<article class="content-card">
        <p class="tiny-label">${item.category}</p>
        <h3>${item.title}</h3>
        <p class="meta-row"><span>${item.source || 'BrahmaCode Network'}</span> • <span>${formatDate(item.date)}</span></p>
        <p>${item.description}</p>
        <div class="card-actions">
          <a class="btn btn-primary" href="${item.link}" target="_blank" rel="noopener noreferrer">Apply Now</a>
          <button type="button" class="btn btn-muted bookmark-btn" data-bookmark-type="updates" data-id="${item.id}">${bookmarked ? 'Saved' : 'Save'}</button>
        </div>
      </article>`;
    }

    if (type === 'articles') {
      return `<article class="content-card">
        <p class="tiny-label">article</p>
        <h3>${item.title}</h3>
        <p>${item.excerpt}</p>
        <p class="meta-row"><span>${formatDate(item.date)}</span></p>
        <div class="card-actions">
          <button type="button" class="btn btn-muted bookmark-btn" data-bookmark-type="articles" data-id="${item.id}">${bookmarked ? 'Saved' : 'Save'}</button>
        </div>
      </article>`;
    }

    return `<article class="content-card problem-preview-card">
      <p class="tiny-label">${item.difficulty} difficulty</p>
      <h3>${item.title}</h3>
      <p>${item.description.slice(0, 120)}...</p>
      <div class="card-actions">
        <a class="btn btn-primary" href="problem.html?id=${encodeURIComponent(item.id)}">Solve Now</a>
        <button type="button" class="btn btn-muted bookmark-btn" data-bookmark-type="problems" data-id="${item.id}">${bookmarked ? 'Saved' : 'Save'}</button>
      </div>
    </article>`;
  }

  function attachBookmarkHandlers() {
    document.querySelectorAll('.bookmark-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const type = btn.getAttribute('data-bookmark-type');
        const id = btn.getAttribute('data-id');
        if (!type || !id) return;
        const next = window.BCStore.toggleBookmark(type, id);
        btn.textContent = next ? 'Saved' : 'Save';
      });
    });
  }

  function initHomePreview() {
    const updatesRoot = byId('home-updates-list');
    const problemsRoot = byId('home-problems-list');
    const articlesRoot = byId('home-articles-list');
    if (!updatesRoot && !problemsRoot && !articlesRoot) return;

    if (updatesRoot) {
      const updates = window.BCStore.getList('updates').slice(0, 3);
      updatesRoot.innerHTML = updates.map((item) => updateCard(item, 'updates')).join('');
    }

    if (problemsRoot) {
      const problems = window.BCStore.getList('problems').slice(0, 3);
      problemsRoot.innerHTML = problems.map((item) => updateCard(item, 'problems')).join('');
    }

    if (articlesRoot) {
      const articles = window.BCStore.getList('articles').slice(0, 3);
      articlesRoot.innerHTML = articles.map((item) => updateCard(item, 'articles')).join('');
    }

    attachBookmarkHandlers();
  }

  function initJobsPage() {
    const listRoot = byId('updates-list');
    if (!listRoot) return;

    const filter = byId('updates-filter');

    function render() {
      const value = (filter?.value || 'all').toLowerCase();
      const updates = window.BCStore.getList('updates');
      const filtered = value === 'all' ? updates : updates.filter((item) => item.category === value);
      listRoot.innerHTML = filtered.length
        ? filtered.map((item) => updateCard(item, 'updates')).join('')
        : '<p class="form-note">No updates found for this filter.</p>';
      attachBookmarkHandlers();
    }

    filter?.addEventListener('change', render);
    render();
  }

  function initPracticePage() {
    const listRoot = byId('problems-list');
    if (!listRoot) return;

    const filter = byId('difficulty-filter');

    function render() {
      const value = (filter?.value || 'all').toLowerCase();
      const problems = window.BCStore.getList('problems');
      const filtered = value === 'all' ? problems : problems.filter((item) => item.difficulty === value);
      listRoot.innerHTML = filtered.length
        ? filtered.map((item) => updateCard(item, 'problems')).join('')
        : '<p class="form-note">No problems found for this filter.</p>';
      attachBookmarkHandlers();
    }

    filter?.addEventListener('change', render);
    render();
  }

  function initProblemDetail() {
    const root = byId('problem-detail');
    if (!root) return;

    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    const problem = id ? window.BCStore.getById('problems', id) : null;

    if (!problem) {
      root.innerHTML = '<p class="form-note">Problem not found. Go back to Practice page.</p>';
      return;
    }

    root.innerHTML = `
      <h1>${problem.title}</h1>
      <p class="tiny-label">${problem.difficulty}</p>
      <div class="problem-panel">
        <h3>Description</h3>
        <p>${problem.description}</p>
        <h3>Constraints</h3>
        <p>${problem.constraints}</p>
        <h3>Examples</h3>
        <pre>${problem.examples}</pre>
      </div>
      <form id="submission-form" class="doubt-form">
        <label for="code-editor">Write your code</label>
        <textarea id="code-editor" rows="14" spellcheck="false"></textarea>
        <div class="card-actions">
          <button type="submit" class="btn btn-primary">Submit Code</button>
          <button type="button" id="run-code-btn" class="btn btn-muted">Run (Demo)</button>
        </div>
        <p id="submission-note" class="form-note"></p>
      </form>
    `;

    const editor = byId('code-editor');
    const note = byId('submission-note');
    const runBtn = byId('run-code-btn');
    const form = byId('submission-form');

    editor.value = window.BCStore.getSubmission(problem.id) || problem.starterCode || '';

    form?.addEventListener('submit', (event) => {
      event.preventDefault();
      window.BCStore.saveSubmission(problem.id, editor.value);
      note.textContent = 'Code submitted successfully (prototype save).';
      note.classList.add('success');
    });

    runBtn?.addEventListener('click', () => {
      window.BCStore.saveSubmission(problem.id, editor.value);
      note.textContent = 'Run complete (demo mode): code saved and ready for future test-case engine.';
      note.classList.add('success');
    });
  }

  function initArticlesPage() {
    const listRoot = byId('articles-list');
    if (!listRoot) return;

    const articles = window.BCStore.getList('articles');
    listRoot.innerHTML = articles.length
      ? articles.map((item) => updateCard(item, 'articles')).join('')
      : '<p class="form-note">No articles available right now.</p>';

    attachBookmarkHandlers();
  }

  document.addEventListener('DOMContentLoaded', () => {
    if (!window.BCStore) return;
    applyWebsiteSettings();
    initHomePreview();
    initJobsPage();
    initPracticePage();
    initProblemDetail();
    initArticlesPage();
  });
})();
