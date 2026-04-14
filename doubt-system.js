(function () {
  const FIREBASE_SDK_VERSION = "10.12.5";
  const DOUBTS_COLLECTION = "doubts";
  const META_COLLECTION = "doubtMeta";
  const META_DOC = "config";

  const LOCAL_DOUBT_STORE_KEY = "bc_doubt_store_v1";
  const LOCAL_VOTE_STORE_KEY = "bc_vote_store_v1";

  const DEFAULT_TAGS = ["DSA", "Python", "WebDev", "GATE", "Java", "JavaScript"];
  const DEFAULT_DOUBTS = [
    {
      id: "doubt-seed-1",
      title: "Why does my binary search fail on boundary values?",
      description: "I tested my binary search on random arrays and it works, but it fails on arrays of size 1 and when target is at the end. How should I fix low/high updates safely?",
      tags: ["DSA", "Java"],
      code: "",
      createdAt: Date.now() - 1000 * 60 * 50,
      upvotes: 12,
      answersCount: 1,
      helpfulAnswerId: "answer-seed-1",
      answers: [
        {
          id: "answer-seed-1",
          text: "Use while (low <= high), compute mid as low + Math.floor((high - low) / 2), and update high = mid - 1 or low = mid + 1. Also test single-element arrays explicitly.",
          createdAt: Date.now() - 1000 * 60 * 30,
          upvotes: 7,
          isHelpful: true
        }
      ]
    },
    {
      id: "doubt-seed-2",
      title: "Recursion stack overflow in tree traversal",
      description: "My DFS traversal works for small trees but stack overflows for deep trees in JavaScript. Should I switch to iterative traversal for interviews?",
      tags: ["DSA", "JavaScript"],
      code: "",
      createdAt: Date.now() - 1000 * 60 * 130,
      upvotes: 9,
      answersCount: 1,
      helpfulAnswerId: "",
      answers: [
        {
          id: "answer-seed-2",
          text: "Yes, for very deep trees iterative DFS with an explicit stack is safer in JS. Mention both recursive and iterative approaches in interviews.",
          createdAt: Date.now() - 1000 * 60 * 110,
          upvotes: 5,
          isHelpful: false
        }
      ]
    },
    {
      id: "doubt-seed-3",
      title: "Fetch API returns undefined on first render",
      description: "I call API in page load but card values are undefined for a second and then update. What is the cleanest pattern to show loading state in plain JS?",
      tags: ["WebDev", "JavaScript"],
      code: "",
      createdAt: Date.now() - 1000 * 60 * 200,
      upvotes: 14,
      answersCount: 2,
      helpfulAnswerId: "",
      answers: [
        {
          id: "answer-seed-3a",
          text: "Render skeleton/loading text first, then replace with data after await fetch resolves.",
          createdAt: Date.now() - 1000 * 60 * 180,
          upvotes: 4,
          isHelpful: false
        },
        {
          id: "answer-seed-3b",
          text: "Guard null values and return early when data is missing. This prevents undefined flashes.",
          createdAt: Date.now() - 1000 * 60 * 170,
          upvotes: 3,
          isHelpful: false
        }
      ]
    },
    {
      id: "doubt-seed-4",
      title: "How to start Python for AI without strong math?",
      description: "I am a beginner and want to get into AI but feel weak in advanced math. What should be my first 4-week learning roadmap?",
      tags: ["Python", "AI"],
      code: "",
      createdAt: Date.now() - 1000 * 60 * 300,
      upvotes: 16,
      answersCount: 1,
      helpfulAnswerId: "",
      answers: [
        {
          id: "answer-seed-4",
          text: "Start with Python basics, then data handling, then simple ML concepts with ready datasets. Focus on practical projects first.",
          createdAt: Date.now() - 1000 * 60 * 280,
          upvotes: 8,
          isHelpful: false
        }
      ]
    },
    {
      id: "doubt-seed-5",
      title: "Best way to balance GATE prep with coding interviews",
      description: "I have college classes plus GATE prep and placement prep. How do I create a weekly schedule that does not burn me out?",
      tags: ["GATE", "DSA"],
      code: "",
      createdAt: Date.now() - 1000 * 60 * 420,
      upvotes: 11,
      answersCount: 0,
      helpfulAnswerId: "",
      answers: []
    }
  ];

  const state = {
    firebaseReady: false,
    db: null,
    loadingFirebase: null,
    doubts: [],
    availableTags: [...DEFAULT_TAGS],
    selectedTagChip: "all"
  };

  function byId(id) {
    return document.getElementById(id);
  }

  function esc(value) {
    return String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatTime(value) {
    if (!value) return "just now";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "just now";

    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return mins + "m ago";

    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + "h ago";

    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric"
    });
  }

  function normalizeTag(raw) {
    return String(raw || "")
      .replace(/^#+/, "")
      .trim()
      .replace(/\s+/g, "");
  }

  function parseTags(input) {
    const seen = new Set();

    return String(input || "")
      .split(/[\s,]+/)
      .map(normalizeTag)
      .filter((tag) => tag.length >= 2)
      .map((tag) => tag.slice(0, 20))
      .filter((tag) => {
        const lower = tag.toLowerCase();
        if (seen.has(lower)) return false;
        seen.add(lower);
        return true;
      });
  }

  function getSortValue() {
    return byId("doubt-sort")?.value || "latest";
  }

  function getTagFilterValue() {
    const selectValue = byId("doubt-tag-filter")?.value || "all";
    if (state.selectedTagChip !== "all") return state.selectedTagChip;
    return selectValue;
  }

  function readVoteStore() {
    try {
      return JSON.parse(localStorage.getItem(LOCAL_VOTE_STORE_KEY) || "{}");
    } catch {
      return {};
    }
  }

  function hasVoted(type, id) {
    const voteStore = readVoteStore();
    return Boolean(voteStore[`${type}:${id}`]);
  }

  function markVoted(type, id) {
    const voteStore = readVoteStore();
    voteStore[`${type}:${id}`] = true;
    localStorage.setItem(LOCAL_VOTE_STORE_KEY, JSON.stringify(voteStore));
  }

  function readLocalStore() {
    try {
      const parsed = JSON.parse(localStorage.getItem(LOCAL_DOUBT_STORE_KEY) || "{}");
      const seededDoubts = Array.isArray(parsed.doubts) && parsed.doubts.length ? parsed.doubts : DEFAULT_DOUBTS;
      return {
        doubts: seededDoubts,
        tags: Array.isArray(parsed.tags) && parsed.tags.length ? parsed.tags : [...new Set([...DEFAULT_TAGS, "AI"])]
      };
    } catch {
      return { doubts: DEFAULT_DOUBTS, tags: [...new Set([...DEFAULT_TAGS, "AI"])] };
    }
  }

  function writeLocalStore(next) {
    localStorage.setItem(LOCAL_DOUBT_STORE_KEY, JSON.stringify(next));
  }

  function localCreateDoubt(payload) {
    const store = readLocalStore();
    const item = {
      id: "doubt-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
      title: payload.title,
      description: payload.description,
      tags: payload.tags,
      code: payload.code,
      createdAt: Date.now(),
      upvotes: 0,
      answersCount: 0,
      answers: [],
      helpfulAnswerId: ""
    };

    store.doubts.unshift(item);
    store.tags = Array.from(new Set([...(store.tags || []), ...payload.tags]));
    writeLocalStore(store);
    return item;
  }

  function localAddAnswer(doubtId, answerText) {
    const store = readLocalStore();
    const doubt = store.doubts.find((item) => item.id === doubtId);
    if (!doubt) return;

    const answer = {
      id: "answer-" + Date.now() + "-" + Math.floor(Math.random() * 10000),
      text: answerText,
      createdAt: Date.now(),
      upvotes: 0,
      isHelpful: false
    };

    doubt.answers = Array.isArray(doubt.answers) ? doubt.answers : [];
    doubt.answers.unshift(answer);
    doubt.answersCount = doubt.answers.length;
    writeLocalStore(store);
  }

  function localDeleteDoubt(doubtId) {
    const store = readLocalStore();
    store.doubts = store.doubts.filter((item) => item.id !== doubtId);
    writeLocalStore(store);
  }

  function localDeleteAnswer(doubtId, answerId) {
    const store = readLocalStore();
    const doubt = store.doubts.find((item) => item.id === doubtId);
    if (!doubt || !Array.isArray(doubt.answers)) return;

    doubt.answers = doubt.answers.filter((item) => item.id !== answerId);
    doubt.answersCount = doubt.answers.length;
    if (doubt.helpfulAnswerId === answerId) {
      doubt.helpfulAnswerId = "";
    }
    writeLocalStore(store);
  }

  function localUpvoteQuestion(doubtId) {
    const store = readLocalStore();
    const doubt = store.doubts.find((item) => item.id === doubtId);
    if (!doubt) return;
    doubt.upvotes = Number(doubt.upvotes || 0) + 1;
    writeLocalStore(store);
  }

  function localUpvoteAnswer(doubtId, answerId) {
    const store = readLocalStore();
    const doubt = store.doubts.find((item) => item.id === doubtId);
    if (!doubt || !Array.isArray(doubt.answers)) return;

    const answer = doubt.answers.find((item) => item.id === answerId);
    if (!answer) return;

    answer.upvotes = Number(answer.upvotes || 0) + 1;
    writeLocalStore(store);
  }

  function localMarkHelpful(doubtId, answerId) {
    const store = readLocalStore();
    const doubt = store.doubts.find((item) => item.id === doubtId);
    if (!doubt || !Array.isArray(doubt.answers)) return;

    doubt.answers = doubt.answers.map((answer) => ({
      ...answer,
      isHelpful: answer.id === answerId
    }));

    doubt.helpfulAnswerId = answerId;
    writeLocalStore(store);
  }

  function localSaveTags(tags) {
    const store = readLocalStore();
    store.tags = tags;
    writeLocalStore(store);
  }

  function hasFirebaseConfig() {
    const config = window.BRAHMACODE_FIREBASE_CONFIG;
    return Boolean(config && config.apiKey && config.projectId && config.appId);
  }

  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = src;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load " + src));
      document.head.appendChild(script);
    });
  }

  async function ensureFirebase() {
    if (!hasFirebaseConfig()) return false;
    if (state.firebaseReady) return true;
    if (state.loadingFirebase) return state.loadingFirebase;

    state.loadingFirebase = (async () => {
      if (!window.firebase) {
        await loadScript("https://www.gstatic.com/firebasejs/" + FIREBASE_SDK_VERSION + "/firebase-app-compat.js");
        await loadScript("https://www.gstatic.com/firebasejs/" + FIREBASE_SDK_VERSION + "/firebase-firestore-compat.js");
      }

      if (!window.firebase.apps.length) {
        window.firebase.initializeApp(window.BRAHMACODE_FIREBASE_CONFIG);
      }

      state.db = window.firebase.firestore();
      state.firebaseReady = true;
      return true;
    })();

    return state.loadingFirebase;
  }

  async function loadTags() {
    if (!(await ensureFirebase())) {
      const local = readLocalStore();
      state.availableTags = local.tags;
      return;
    }

    const doc = await state.db.collection(META_COLLECTION).doc(META_DOC).get();
    const remoteTags = doc.exists ? doc.data().tags : null;
    state.availableTags = Array.isArray(remoteTags) && remoteTags.length ? remoteTags : [...DEFAULT_TAGS];
  }

  async function saveTags(nextTags) {
    const normalized = Array.from(
      new Set(
        nextTags
          .map(normalizeTag)
          .filter(Boolean)
      )
    );

    state.availableTags = normalized.length ? normalized : [...DEFAULT_TAGS];

    if (!(await ensureFirebase())) {
      localSaveTags(state.availableTags);
      return;
    }

    await state.db.collection(META_COLLECTION).doc(META_DOC).set({ tags: state.availableTags }, { merge: true });
  }

  function mapDoubtDoc(doc) {
    const data = doc.data() || {};
    const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : Number(data.createdAt || data.createdAtMs || Date.now());

    return {
      id: doc.id,
      title: data.title || "Untitled doubt",
      description: data.description || "",
      tags: Array.isArray(data.tags) ? data.tags : [],
      code: data.code || "",
      upvotes: Number(data.upvotes || 0),
      answersCount: Number(data.answersCount || 0),
      createdAt,
      helpfulAnswerId: data.helpfulAnswerId || ""
    };
  }

  function sortedAndFilteredDoubts() {
    const sortType = getSortValue();
    const tagFilter = getTagFilterValue();

    let list = [...state.doubts];

    if (tagFilter !== "all") {
      list = list.filter((item) => item.tags.some((tag) => tag.toLowerCase() === tagFilter.toLowerCase()));
    }

    if (sortType === "popular") {
      list.sort((a, b) => b.upvotes - a.upvotes || b.createdAt - a.createdAt);
    } else if (sortType === "unanswered") {
      list = list.filter((item) => Number(item.answersCount || 0) === 0);
      list.sort((a, b) => b.createdAt - a.createdAt);
    } else {
      list.sort((a, b) => b.createdAt - a.createdAt);
    }

    return list;
  }

  function renderTagSelect() {
    const tagFilter = byId("doubt-tag-filter");
    if (!tagFilter) return;

    const existing = tagFilter.value || "all";
    const options = ['<option value="all">All Tags</option>']
      .concat(state.availableTags.map((tag) => `<option value="${esc(tag)}">#${esc(tag)}</option>`))
      .join("");

    tagFilter.innerHTML = options;

    const stillExists = ["all", ...state.availableTags].some((tag) => tag.toLowerCase() === existing.toLowerCase());
    tagFilter.value = stillExists ? existing : "all";
  }

  function renderTagChips() {
    const root = byId("tag-chip-filter");
    if (!root) return;

    const tags = ["all", ...state.availableTags];

    root.innerHTML = tags
      .map((tag) => {
        const isActive = state.selectedTagChip.toLowerCase() === tag.toLowerCase();
        const label = tag === "all" ? "All" : `#${tag}`;
        return `<button type="button" class="tag-chip ${isActive ? "is-active" : ""}" data-tag-chip="${esc(tag)}">${esc(label)}</button>`;
      })
      .join("");

    root.querySelectorAll("[data-tag-chip]").forEach((btn) => {
      btn.addEventListener("click", () => {
        state.selectedTagChip = btn.getAttribute("data-tag-chip") || "all";
        renderTagChips();
        renderDoubtFeed();
      });
    });
  }

  function renderPopularList() {
    const root = byId("popular-doubts-list");
    if (!root) return;

    const topItems = [...state.doubts]
      .sort((a, b) => b.upvotes - a.upvotes || b.answersCount - a.answersCount)
      .slice(0, 6);

    if (!topItems.length) {
      root.innerHTML = '<p class="form-note">No popular questions yet. Be the first to post.</p>';
      return;
    }

    root.innerHTML = topItems
      .map(
        (item) => `<article class="compact-item">
          <h4>${esc(item.title)}</h4>
          <p>${esc(item.description.slice(0, 85))}${item.description.length > 85 ? "..." : ""}</p>
          <div class="compact-meta">${item.upvotes} upvotes • ${item.answersCount} answers</div>
        </article>`
      )
      .join("");
  }

  function renderDoubtFeed() {
    const feed = byId("recent-doubts-feed");
    if (!feed) return;

    const items = sortedAndFilteredDoubts();

    if (!items.length) {
      feed.innerHTML = '<p class="form-note">No doubts match this filter yet.</p>';
      return;
    }

    feed.innerHTML = items
      .map(
        (item) => `<article class="doubt-card" data-doubt-id="${esc(item.id)}">
          <div class="doubt-head">
            <h3>${esc(item.title)}</h3>
            <span class="tiny-label">${esc(formatTime(item.createdAt))}</span>
          </div>
          <p class="doubt-desc">${esc(item.description.slice(0, 220))}${item.description.length > 220 ? "..." : ""}</p>
          <div class="tag-row">${item.tags.map((tag) => `<span class="chip">#${esc(tag)}</span>`).join("")}</div>
          <div class="doubt-meta-row">
            <span>${item.answersCount} answers</span>
            <span>${item.upvotes} likes</span>
          </div>
          <div class="card-actions">
            <button class="btn btn-muted open-answer-btn" type="button" data-open-answers="${esc(item.id)}">View Answers</button>
            <button class="btn btn-primary upvote-doubt-btn" type="button" data-upvote-doubt="${esc(item.id)}">Upvote</button>
          </div>
          <section class="doubt-detail" id="doubt-detail-${esc(item.id)}" hidden>
            <div class="answer-list" id="answer-list-${esc(item.id)}"></div>
            <form class="answer-form" data-answer-form="${esc(item.id)}">
              <label for="answer-input-${esc(item.id)}">Write an answer</label>
              <textarea id="answer-input-${esc(item.id)}" rows="3" required placeholder="Share your approach in simple steps."></textarea>
              <button type="submit" class="btn btn-primary">Post Answer</button>
              <p class="form-note" id="answer-note-${esc(item.id)}"></p>
            </form>
          </section>
        </article>`
      )
      .join("");

    attachCardHandlers();
  }

  function renderAnswers(container, answers, helpfulAnswerId) {
    if (!answers.length) {
      container.innerHTML = '<p class="form-note">No answers yet. Be the first to help.</p>';
      return;
    }

    container.innerHTML = answers
      .map(
        (item) => `<article class="answer-item ${item.id === helpfulAnswerId || item.isHelpful ? "is-helpful" : ""}">
          <p>${esc(item.text)}</p>
          <div class="doubt-meta-row">
            <span>${item.upvotes || 0} likes</span>
            <span>${esc(formatTime(item.createdAt))}</span>
          </div>
          <div class="card-actions">
            <button type="button" class="btn btn-muted upvote-answer-btn" data-doubt-id="${esc(item.doubtId)}" data-answer-id="${esc(item.id)}">Like Answer</button>
            <button type="button" class="btn btn-muted helpful-answer-btn" data-doubt-id="${esc(item.doubtId)}" data-answer-id="${esc(item.id)}">Mark Helpful</button>
          </div>
        </article>`
      )
      .join("");
  }

  async function getAnswers(doubtId) {
    if (!(await ensureFirebase())) {
      const local = readLocalStore();
      const doubt = local.doubts.find((item) => item.id === doubtId);
      return Array.isArray(doubt?.answers) ? doubt.answers.map((answer) => ({ ...answer, doubtId })) : [];
    }

    const snapshot = await state.db
      .collection(DOUBTS_COLLECTION)
      .doc(doubtId)
      .collection("answers")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data() || {};
      const createdAt = data.createdAt?.toMillis ? data.createdAt.toMillis() : Number(data.createdAt || Date.now());

      return {
        id: doc.id,
        doubtId,
        text: data.text || "",
        upvotes: Number(data.upvotes || 0),
        createdAt,
        isHelpful: Boolean(data.isHelpful)
      };
    });
  }

  async function createDoubt(payload) {
    if (!(await ensureFirebase())) {
      localCreateDoubt(payload);
      await refreshDoubts();
      return;
    }

    await state.db.collection(DOUBTS_COLLECTION).add({
      title: payload.title,
      description: payload.description,
      tags: payload.tags,
      code: payload.code,
      answersCount: 0,
      upvotes: 0,
      helpfulAnswerId: "",
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
      createdAtMs: Date.now()
    });

    await saveTags([...state.availableTags, ...payload.tags]);
    await refreshDoubts();
  }

  async function createAnswer(doubtId, text) {
    if (!(await ensureFirebase())) {
      localAddAnswer(doubtId, text);
      await refreshDoubts();
      return;
    }

    const doubtRef = state.db.collection(DOUBTS_COLLECTION).doc(doubtId);
    await doubtRef.collection("answers").add({
      text,
      upvotes: 0,
      isHelpful: false,
      createdAt: window.firebase.firestore.FieldValue.serverTimestamp()
    });

    await doubtRef.set(
      {
        answersCount: window.firebase.firestore.FieldValue.increment(1)
      },
      { merge: true }
    );

    await refreshDoubts();
  }

  async function upvoteDoubt(doubtId) {
    if (hasVoted("doubt", doubtId)) return false;

    if (!(await ensureFirebase())) {
      localUpvoteQuestion(doubtId);
    } else {
      await state.db
        .collection(DOUBTS_COLLECTION)
        .doc(doubtId)
        .set({ upvotes: window.firebase.firestore.FieldValue.increment(1) }, { merge: true });
    }

    markVoted("doubt", doubtId);
    await refreshDoubts();
    return true;
  }

  async function upvoteAnswer(doubtId, answerId) {
    if (hasVoted("answer", answerId)) return false;

    if (!(await ensureFirebase())) {
      localUpvoteAnswer(doubtId, answerId);
    } else {
      await state.db
        .collection(DOUBTS_COLLECTION)
        .doc(doubtId)
        .collection("answers")
        .doc(answerId)
        .set({ upvotes: window.firebase.firestore.FieldValue.increment(1) }, { merge: true });
    }

    markVoted("answer", answerId);
    return true;
  }

  async function markHelpfulAnswer(doubtId, answerId) {
    if (!(await ensureFirebase())) {
      localMarkHelpful(doubtId, answerId);
      await refreshDoubts();
      return;
    }

    const answersRef = state.db.collection(DOUBTS_COLLECTION).doc(doubtId).collection("answers");
    const allAnswers = await answersRef.get();

    const batch = state.db.batch();
    allAnswers.docs.forEach((doc) => {
      batch.set(doc.ref, { isHelpful: doc.id === answerId }, { merge: true });
    });

    const doubtRef = state.db.collection(DOUBTS_COLLECTION).doc(doubtId);
    batch.set(doubtRef, { helpfulAnswerId: answerId }, { merge: true });
    await batch.commit();

    await refreshDoubts();
  }

  async function deleteDoubt(doubtId) {
    if (!(await ensureFirebase())) {
      localDeleteDoubt(doubtId);
      await refreshDoubts();
      return;
    }

    const doubtRef = state.db.collection(DOUBTS_COLLECTION).doc(doubtId);
    const answersSnap = await doubtRef.collection("answers").get();

    const batch = state.db.batch();
    answersSnap.docs.forEach((doc) => batch.delete(doc.ref));
    batch.delete(doubtRef);
    await batch.commit();

    await refreshDoubts();
  }

  async function deleteAnswer(doubtId, answerId) {
    if (!(await ensureFirebase())) {
      localDeleteAnswer(doubtId, answerId);
      await refreshDoubts();
      return;
    }

    const doubtRef = state.db.collection(DOUBTS_COLLECTION).doc(doubtId);
    await doubtRef.collection("answers").doc(answerId).delete();

    await doubtRef.set(
      {
        answersCount: window.firebase.firestore.FieldValue.increment(-1)
      },
      { merge: true }
    );

    const doubtDoc = await doubtRef.get();
    if (doubtDoc.exists && doubtDoc.data()?.helpfulAnswerId === answerId) {
      await doubtRef.set({ helpfulAnswerId: "" }, { merge: true });
    }

    await refreshDoubts();
  }

  async function refreshDoubts() {
    if (!(await ensureFirebase())) {
      const local = readLocalStore();
      state.doubts = local.doubts;
      state.availableTags = local.tags;
      renderTagSelect();
      renderTagChips();
      renderDoubtFeed();
      renderPopularList();
      renderModeration();
      return;
    }

    const snapshot = await state.db.collection(DOUBTS_COLLECTION).get();
    state.doubts = snapshot.docs.map(mapDoubtDoc);
    renderTagSelect();
    renderTagChips();
    renderDoubtFeed();
    renderPopularList();
    renderModeration();
  }

  async function loadAnswerSection(doubtId) {
    const detail = byId("doubt-detail-" + doubtId);
    const list = byId("answer-list-" + doubtId);
    if (!detail || !list) return;

    detail.removeAttribute("hidden");

    const doubt = state.doubts.find((item) => item.id === doubtId);
    const answers = await getAnswers(doubtId);
    renderAnswers(list, answers, doubt?.helpfulAnswerId || "");

    list.querySelectorAll(".upvote-answer-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const selectedDoubt = btn.getAttribute("data-doubt-id");
        const selectedAnswer = btn.getAttribute("data-answer-id");
        const worked = await upvoteAnswer(selectedDoubt, selectedAnswer);
        if (!worked) return;
        await loadAnswerSection(doubtId);
      });
    });

    list.querySelectorAll(".helpful-answer-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const selectedDoubt = btn.getAttribute("data-doubt-id");
        const selectedAnswer = btn.getAttribute("data-answer-id");
        await markHelpfulAnswer(selectedDoubt, selectedAnswer);
        await loadAnswerSection(doubtId);
      });
    });
  }

  async function openAnswerSection(doubtId) {
    const detail = byId("doubt-detail-" + doubtId);
    if (!detail) return;

    const isHidden = detail.hasAttribute("hidden");
    if (!isHidden) {
      detail.setAttribute("hidden", "");
      return;
    }

    await loadAnswerSection(doubtId);
  }

  function attachCardHandlers() {
    document.querySelectorAll(".open-answer-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const doubtId = btn.getAttribute("data-open-answers");
        await openAnswerSection(doubtId);
      });
    });

    document.querySelectorAll(".upvote-doubt-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const doubtId = btn.getAttribute("data-upvote-doubt");
        await upvoteDoubt(doubtId);
      });
    });

    document.querySelectorAll("[data-answer-form]").forEach((form) => {
      form.addEventListener("submit", async (event) => {
        event.preventDefault();
        const doubtId = form.getAttribute("data-answer-form");
        const input = byId("answer-input-" + doubtId);
        const note = byId("answer-note-" + doubtId);

        const text = String(input?.value || "").trim();
        if (text.length < 20) {
          note.textContent = "Answer should be at least 20 characters.";
          note.classList.remove("success");
          return;
        }

        await createAnswer(doubtId, text);
        note.textContent = "Answer posted.";
        note.classList.add("success");
        form.reset();
        await loadAnswerSection(doubtId);
      });
    });
  }

  function initForm() {
    const form = byId("community-doubt-form");
    const note = byId("community-form-note");
    if (!form || !note) return;

    form.addEventListener("submit", async (event) => {
      event.preventDefault();

      const title = String(byId("doubt-title")?.value || "").trim();
      const description = String(byId("doubt-description")?.value || "").trim();
      const code = String(byId("doubt-code")?.value || "").trim();
      const tags = parseTags(byId("doubt-tags")?.value || "");

      if (title.length < 8) {
        note.textContent = "Title should be at least 8 characters.";
        note.classList.remove("success");
        return;
      }

      if (description.length < 30) {
        note.textContent = "Description should be at least 30 characters.";
        note.classList.remove("success");
        return;
      }

      if (!tags.length) {
        note.textContent = "Please add at least one tag.";
        note.classList.remove("success");
        return;
      }

      if (tags.length > 5) {
        note.textContent = "Use at most 5 tags per doubt.";
        note.classList.remove("success");
        return;
      }

      await createDoubt({ title, description, code, tags });
      note.textContent = "Doubt posted successfully.";
      note.classList.add("success");
      form.reset();
    });
  }

  function initFilters() {
    byId("doubt-sort")?.addEventListener("change", renderDoubtFeed);
    byId("doubt-tag-filter")?.addEventListener("change", () => {
      state.selectedTagChip = "all";
      renderTagChips();
      renderDoubtFeed();
    });
  }

  async function renderModeration() {
    const doubtsRoot = byId("moderation-doubts-list");
    const tagsRoot = byId("moderation-tags-list");

    if (!doubtsRoot || !tagsRoot) {
      return;
    }

    const doubts = [...state.doubts].sort((a, b) => b.createdAt - a.createdAt);

    if (!doubts.length) {
      doubtsRoot.innerHTML = '<p class="form-note">No doubts to moderate yet.</p>';
    } else {
      doubtsRoot.innerHTML = doubts
        .map(
          (doubt) => `<div class="admin-row stack-on-mobile">
            <span>
              <strong>${esc(doubt.title)}</strong><br />
              <small>${doubt.answersCount} answers • ${doubt.upvotes} likes • ${esc(formatTime(doubt.createdAt))}</small>
            </span>
            <div class="row-actions">
              <button type="button" class="btn btn-muted admin-open-answers" data-admin-open="${esc(doubt.id)}">Answers</button>
              <button type="button" class="btn btn-muted admin-delete-doubt" data-admin-delete-doubt="${esc(doubt.id)}">Delete Doubt</button>
            </div>
            <div class="admin-answer-list" id="admin-answer-list-${esc(doubt.id)}" hidden></div>
          </div>`
        )
        .join("");
    }

    tagsRoot.innerHTML = state.availableTags
      .map(
        (tag) => `<span class="chip tag-manage-chip">#${esc(tag)} <button type="button" data-remove-tag="${esc(tag)}" class="plain-tag-btn">x</button></span>`
      )
      .join("");

    doubtsRoot.querySelectorAll(".admin-delete-doubt").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const doubtId = btn.getAttribute("data-admin-delete-doubt");
        await deleteDoubt(doubtId);
      });
    });

    doubtsRoot.querySelectorAll(".admin-open-answers").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const doubtId = btn.getAttribute("data-admin-open");
        const list = byId("admin-answer-list-" + doubtId);
        if (!list) return;

        const open = list.hasAttribute("hidden");
        if (!open) {
          list.setAttribute("hidden", "");
          return;
        }

        const answers = await getAnswers(doubtId);
        list.innerHTML = answers.length
          ? answers
              .map(
                (answer) => `<div class="admin-row stack-on-mobile">
                  <span>${esc(answer.text.slice(0, 180))}${answer.text.length > 180 ? "..." : ""}</span>
                  <button type="button" class="btn btn-muted admin-delete-answer" data-admin-doubt="${esc(doubtId)}" data-admin-answer="${esc(answer.id)}">Delete</button>
                </div>`
              )
              .join("")
          : '<p class="form-note">No answers yet.</p>';
        list.removeAttribute("hidden");

        list.querySelectorAll(".admin-delete-answer").forEach((deleteBtn) => {
          deleteBtn.addEventListener("click", async () => {
            const selectedDoubt = deleteBtn.getAttribute("data-admin-doubt");
            const selectedAnswer = deleteBtn.getAttribute("data-admin-answer");
            await deleteAnswer(selectedDoubt, selectedAnswer);
          });
        });
      });
    });

    tagsRoot.querySelectorAll("[data-remove-tag]").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const tag = btn.getAttribute("data-remove-tag");
        const next = state.availableTags.filter((item) => item.toLowerCase() !== String(tag).toLowerCase());
        await saveTags(next);
        renderTagSelect();
        renderTagChips();
        renderModeration();
      });
    });
  }

  function initModerationPanel() {
    const tagForm = byId("moderation-tags-form");
    const tagInput = byId("moderation-tag-input");
    const note = byId("moderation-note");

    if (!tagForm || !tagInput || !note) return;

    tagForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const raw = tagInput.value.trim();
      const normalized = normalizeTag(raw);

      if (normalized.length < 2) {
        note.textContent = "Tag should be at least 2 characters.";
        note.classList.remove("success");
        return;
      }

      const alreadyExists = state.availableTags.some((tag) => tag.toLowerCase() === normalized.toLowerCase());
      if (alreadyExists) {
        note.textContent = "Tag already exists.";
        note.classList.remove("success");
        return;
      }

      await saveTags([...state.availableTags, normalized]);
      tagInput.value = "";
      note.textContent = "Tag added.";
      note.classList.add("success");
      renderTagSelect();
      renderTagChips();
      renderModeration();
    });
  }

  async function bootstrapDoubtsFeature() {
    const askPage = byId("community-doubt-form");
    const moderationPage = byId("moderation-doubts-list");

    if (!askPage && !moderationPage) {
      return;
    }

    if (window.BRAHMACODE_FIREBASE_READY) {
      await window.BRAHMACODE_FIREBASE_READY;
    }

    await loadTags();
    renderTagSelect();
    renderTagChips();
    initForm();
    initFilters();
    initModerationPanel();
    await refreshDoubts();

    const feed = byId("recent-doubts-feed");
    if (!feed) return;

    if (await ensureFirebase()) {
      state.db.collection(DOUBTS_COLLECTION).onSnapshot(async (snapshot) => {
        state.doubts = snapshot.docs.map(mapDoubtDoc);
        renderDoubtFeed();
        renderPopularList();
        renderModeration();
      });
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    bootstrapDoubtsFeature();
  });
})();
