(function () {
  const STORE_KEY = 'bc_portal_data_v1';

  const defaults = {
    settings: {
      siteTitle: 'BrahmaCode | Learn. Practice. Grow.',
      siteDescription:
        'BrahmaCode is a student-first coding platform for practice, jobs, and exam updates.',
      showBatches: true,
      showResults: true,
      showPricing: true,
      showFaq: true,
      showJobsSection: true,
      showPracticeSection: true,
      showArticlesSection: true
    },
    updates: [
      {
        id: 'upd-1',
        title: 'Infosys Hiring: Associate Software Engineer',
        category: 'jobs',
        description: 'Off-campus hiring drive open for 2026 graduates across India.',
        date: '2026-04-10',
        link: 'https://www.linkedin.com/jobs/'
      },
      {
        id: 'upd-2',
        title: 'NIMCET 2026 Notification Released',
        category: 'exams',
        description: 'Registration dates, exam pattern, and eligibility details updated.',
        date: '2026-04-08',
        link: 'https://nimcet.in/'
      },
      {
        id: 'upd-3',
        title: 'Frontend Internship: Remote Role',
        category: 'internships',
        description: 'Startup internship role with stipend and mentorship for learners.',
        date: '2026-04-06',
        link: 'https://www.linkedin.com/jobs/'
      }
    ],
    articles: [
      {
        id: 'art-1',
        title: 'How to Stay Consistent in Coding Practice',
        excerpt: 'A practical 30-minute routine for students balancing classes and prep.',
        body:
          'Consistency beats intensity. Focus on one topic, one revision block, and one doubt every day. Track your streak and weekly outcomes.',
        date: '2026-04-05'
      }
    ],
    problems: [
      {
        id: 'prob-1',
        title: 'Two Sum',
        difficulty: 'easy',
        description:
          'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
        constraints: '2 <= nums.length <= 10^4; -10^9 <= nums[i], target <= 10^9',
        examples: 'Input: nums = [2,7,11,15], target = 9\\nOutput: [0,1]',
        starterCode:
          'function twoSum(nums, target) {\\n  // Write your solution here\\n  return [];\\n}'
      },
      {
        id: 'prob-2',
        title: 'Valid Parentheses',
        difficulty: 'medium',
        description: 'Given a string s containing just characters ()[]{} determine if the input string is valid.',
        constraints: '1 <= s.length <= 10^4',
        examples: 'Input: s = "()[]{}"\\nOutput: true',
        starterCode:
          'function isValid(s) {\\n  // Write your solution here\\n  return false;\\n}'
      }
    ],
    bookmarks: {
      updates: [],
      problems: [],
      articles: []
    },
    submissions: {}
  };

  function generateId(prefix) {
    return `${prefix}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  }

  function mergeDefaults(stored) {
    const merged = {
      settings: { ...defaults.settings, ...(stored.settings || {}) },
      updates: Array.isArray(stored.updates) ? stored.updates : defaults.updates,
      articles: Array.isArray(stored.articles) ? stored.articles : defaults.articles,
      problems: Array.isArray(stored.problems) ? stored.problems : defaults.problems,
      bookmarks: {
        updates: Array.isArray(stored.bookmarks?.updates) ? stored.bookmarks.updates : [],
        problems: Array.isArray(stored.bookmarks?.problems) ? stored.bookmarks.problems : [],
        articles: Array.isArray(stored.bookmarks?.articles) ? stored.bookmarks.articles : []
      },
      submissions:
        stored.submissions && typeof stored.submissions === 'object' ? stored.submissions : {}
    };

    return merged;
  }

  function read() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return mergeDefaults({});
      const parsed = JSON.parse(raw);
      return mergeDefaults(parsed || {});
    } catch {
      return mergeDefaults({});
    }
  }

  function write(nextData) {
    localStorage.setItem(STORE_KEY, JSON.stringify(nextData));
  }

  function getAll() {
    return read();
  }

  function setAll(nextData) {
    write(mergeDefaults(nextData || {}));
  }

  function getList(section) {
    return getAll()[section] || [];
  }

  function saveList(section, list) {
    const data = getAll();
    data[section] = list;
    write(data);
  }

  function upsert(section, entry) {
    const list = getList(section);
    const id = entry.id || generateId(section.slice(0, 3));
    const nextEntry = { ...entry, id };
    const idx = list.findIndex((item) => item.id === id);
    if (idx >= 0) list[idx] = nextEntry;
    else list.unshift(nextEntry);
    saveList(section, list);
    return nextEntry;
  }

  function remove(section, id) {
    const list = getList(section).filter((item) => item.id !== id);
    saveList(section, list);
  }

  function getById(section, id) {
    return getList(section).find((item) => item.id === id) || null;
  }

  function getSettings() {
    return getAll().settings;
  }

  function saveSettings(settings) {
    const data = getAll();
    data.settings = { ...data.settings, ...settings };
    write(data);
  }

  function toggleBookmark(type, id) {
    const data = getAll();
    const existing = data.bookmarks[type] || [];
    const has = existing.includes(id);
    data.bookmarks[type] = has ? existing.filter((item) => item !== id) : [...existing, id];
    write(data);
    return !has;
  }

  function isBookmarked(type, id) {
    const data = getAll();
    return (data.bookmarks[type] || []).includes(id);
  }

  function saveSubmission(problemId, code) {
    const data = getAll();
    data.submissions[problemId] = code;
    write(data);
  }

  function getSubmission(problemId) {
    return getAll().submissions[problemId] || '';
  }

  window.BCStore = {
    getAll,
    setAll,
    getList,
    saveList,
    upsert,
    remove,
    getById,
    getSettings,
    saveSettings,
    toggleBookmark,
    isBookmarked,
    saveSubmission,
    getSubmission,
    generateId
  };
})();
