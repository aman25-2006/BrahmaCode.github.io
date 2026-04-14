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
    courses: [
      {
        id: 'course-web-launchpad',
        title: 'Web Development Launchpad',
        level: 'Beginner',
        duration: '6 weeks',
        category: 'Web Development',
        description: 'Build clean landing pages, dashboards, and portfolio-ready UI with modern HTML, CSS, and JavaScript.',
        overview:
          'A beginner-friendly path that turns static pages into polished web products. You will learn layout systems, component thinking, responsive design, API-driven features, and deployment basics.',
        modules: [
          'Module 1 - HTML, semantic structure, and page architecture',
          'Module 2 - Modern CSS, grids, motion, and responsive systems',
          'Module 3 - JavaScript essentials and interactive UI patterns',
          'Module 4 - APIs, forms, and project wiring',
          'Module 5 - Portfolio launch, review, and publishing'
        ],
        lessons: [
          'Landing page anatomy: hero, social proof, and CTA flow',
          'Responsive card grids with modern spacing and typography',
          'Live project: launch a student dashboard with filters'
        ],
        featured: true,
        popular: true,
        videoUrl: '',
        certificateEnabled: true,
        defaultProgress: 38
      },
      {
        id: 'course-dsa-sprint',
        title: 'DSA Sprint',
        level: 'Intermediate',
        duration: '8 weeks',
        category: 'Data Structures & Algorithms',
        description: 'Strengthen problem solving with arrays, hashing, recursion, trees, graphs, and interview patterns.',
        overview:
          'This track builds problem-solving fluency through pattern recognition, live practice, timed drills, and mentor review. Each chapter is designed to fit a student schedule.',
        modules: [
          'Module 1 - Arrays, strings, and complexity thinking',
          'Module 2 - Hash maps, stacks, queues, and linked lists',
          'Module 3 - Recursion, backtracking, and binary search',
          'Module 4 - Trees, heaps, and graph fundamentals',
          'Module 5 - Timed contests, review, and interview patterns'
        ],
        lessons: [
          'Pattern drill: sliding window and two pointers',
          'Stack-based parsing for interview-style questions',
          'Timed practice set with mentor feedback'
        ],
        featured: true,
        popular: true,
        videoUrl: '',
        certificateEnabled: true,
        defaultProgress: 64
      },
      {
        id: 'course-python-ai',
        title: 'Python / AI Starter Lab',
        level: 'Beginner',
        duration: '7 weeks',
        category: 'Python / AI',
        description: 'Learn Python foundations, automation workflows, and practical AI concepts without heavy math overload.',
        overview:
          'A hands-on path for students who want to move from syntax to simple AI-powered projects. You will work through Python basics, notebooks, data handling, and lightweight AI demos.',
        modules: [
          'Module 1 - Python syntax, data types, and control flow',
          'Module 2 - Functions, files, and reusable helpers',
          'Module 3 - Data handling with lists, dictionaries, and pandas basics',
          'Module 4 - AI workflow introduction and prompt-driven tasks',
          'Module 5 - Mini project: smart study helper'
        ],
        lessons: [
          'Write your first Python automation script',
          'Turn a notebook into a reusable practice helper',
          'Build a simple AI note summarizer demo'
        ],
        featured: true,
        popular: false,
        videoUrl: '',
        certificateEnabled: true,
        defaultProgress: 22
      },
      {
        id: 'course-front-end-fusion',
        title: 'Frontend Fusion',
        level: 'Intermediate',
        duration: '5 weeks',
        category: 'Web Development',
        description: 'Move beyond basics with component systems, state patterns, and production-ready UI polish.',
        overview:
          'A compact upgrade track for learners who already know the basics and want to design better interfaces, work with state, and build faster.',
        modules: [
          'Module 1 - UI composition and design tokens',
          'Module 2 - State, events, and data flow',
          'Module 3 - Reusable components and live search',
          'Module 4 - Product polish, accessibility, and testing',
          'Module 5 - Deploy a premium student portal'
        ],
        lessons: [
          'Compose a dashboard with reusable cards',
          'Add live filters and loading states',
          'Ship a polished mini app with review notes'
        ],
        featured: false,
        popular: true,
        videoUrl: '',
        certificateEnabled: true,
        defaultProgress: 48
      },
      {
        id: 'course-placement-edge',
        title: 'Placement Edge',
        level: 'Advanced',
        duration: '4 weeks',
        category: 'Data Structures & Algorithms',
        description: 'Sharpen interview performance with mock rounds, strategy sessions, and advanced review loops.',
        overview:
          'Designed for students entering placement season, this path focuses on answering clearly, thinking under time pressure, and translating solutions into strong interview communication.',
        modules: [
          'Module 1 - Problem framing and interview communication',
          'Module 2 - High-frequency DSA patterns',
          'Module 3 - Mock interviews and scoring',
          'Module 4 - Revision system and final sprint'
        ],
        lessons: [
          'Behavioral answer structures for HR rounds',
          'Whiteboard walkthroughs for tricky DSA topics',
          'Mock interview debrief with improvement plan'
        ],
        featured: false,
        popular: true,
        videoUrl: '',
        certificateEnabled: true,
        defaultProgress: 72
      }
    ],
    updates: [
      {
        id: 'upd-1',
        title: 'Associate Software Engineer Hiring',
        category: 'jobs',
        source: 'Infosys',
        description: 'Off-campus hiring drive open for 2026 graduates across India with online assessment round.',
        date: '2026-04-10',
        link: 'https://www.linkedin.com/jobs/'
      },
      {
        id: 'upd-2',
        title: 'NIMCET 2026 Application Window Open',
        category: 'exams',
        source: 'NIMCET',
        description: 'Registration dates, exam pattern, and eligibility details officially updated for MCA aspirants.',
        date: '2026-04-08',
        link: 'https://nimcet.in/'
      },
      {
        id: 'upd-3',
        title: 'Frontend Internship Program (Remote)',
        category: 'internships',
        source: 'CoderStack Labs',
        description: 'Startup internship role with stipend, mentorship, and a real product sprint for learners.',
        date: '2026-04-06',
        link: 'https://www.linkedin.com/jobs/'
      },
      {
        id: 'upd-4',
        title: 'GATE CS 2027 Exam Calendar Announced',
        category: 'exams',
        source: 'IIT Organizing Institute',
        description: 'Official exam dates, syllabus notice, and registration timeline published for GATE CS.',
        date: '2026-04-04',
        link: 'https://gate2027.iitk.ac.in/'
      },
      {
        id: 'upd-5',
        title: 'IIT JAM CS 2027 Notification Update',
        category: 'exams',
        source: 'IIT JAM',
        description: 'Latest IIT JAM CS notice includes schedule timeline and updated subject-wise syllabus links.',
        date: '2026-04-03',
        link: 'https://jam2027.iitd.ac.in/'
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
      },
      {
        id: 'prob-3',
        title: 'Longest Substring Without Repeating Characters',
        difficulty: 'medium',
        description:
          'Given a string s, find the length of the longest substring without repeating characters.',
        constraints: '0 <= s.length <= 5 * 10^4; s consists of English letters, digits, symbols and spaces.',
        examples: 'Input: s = "abcabcbb"\\nOutput: 3',
        starterCode:
          'function lengthOfLongestSubstring(s) {\\n  // Write your solution here\\n  return 0;\\n}'
      },
      {
        id: 'prob-4',
        title: 'Merge Intervals',
        difficulty: 'hard',
        description:
          'Given an array of intervals where intervals[i] = [start, end], merge all overlapping intervals.',
        constraints: '1 <= intervals.length <= 10^4; intervals[i].length == 2',
        examples: 'Input: intervals = [[1,3],[2,6],[8,10],[15,18]]\\nOutput: [[1,6],[8,10],[15,18]]',
        starterCode:
          'function merge(intervals) {\\n  // Write your solution here\\n  return [];\\n}'
      },
      {
        id: 'prob-5',
        title: 'Binary Tree Level Order Traversal',
        difficulty: 'easy',
        description:
          'Given the root of a binary tree, return the level order traversal of its nodes values.',
        constraints: 'The number of nodes in the tree is in the range [0, 2000].',
        examples: 'Input: root = [3,9,20,null,null,15,7]\\nOutput: [[3],[9,20],[15,7]]',
        starterCode:
          'function levelOrder(root) {\\n  // Write your solution here\\n  return [];\\n}'
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

  function mergeWithDefaults(storedList, defaultList) {
    const base = Array.isArray(storedList) ? storedList : [];
    const byId = new Map(base.map((item) => [item.id, item]));

    defaultList.forEach((item) => {
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    });

    return Array.from(byId.values());
  }

  function mergeDefaults(stored) {
    const merged = {
      settings: { ...defaults.settings, ...(stored.settings || {}) },
      updates: mergeWithDefaults(stored.updates, defaults.updates),
      articles: mergeWithDefaults(stored.articles, defaults.articles),
      problems: mergeWithDefaults(stored.problems, defaults.problems),
      courses: mergeWithDefaults(stored.courses, defaults.courses),
      bookmarks: {
        updates: Array.isArray(stored.bookmarks?.updates) ? stored.bookmarks.updates : [],
        problems: Array.isArray(stored.bookmarks?.problems) ? stored.bookmarks.problems : [],
        articles: Array.isArray(stored.bookmarks?.articles) ? stored.bookmarks.articles : []
      },
      courseProgress:
        stored.courseProgress && typeof stored.courseProgress === 'object' ? stored.courseProgress : {},
      currentCourseId: typeof stored.currentCourseId === 'string' ? stored.currentCourseId : '',
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

  function clampProgress(value) {
    const number = Number(value);
    if (Number.isNaN(number)) return 0;
    return Math.max(0, Math.min(100, Math.round(number)));
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

  function getCourseProgress(courseId) {
    const data = getAll();
    const course = getById('courses', courseId);
    if (!courseId) return 0;
    const storedProgress = data.courseProgress?.[courseId];
    if (typeof storedProgress === 'number') return clampProgress(storedProgress);
    return clampProgress(course?.defaultProgress || 0);
  }

  function saveCourseProgress(courseId, progress) {
    if (!courseId) return;
    const data = getAll();
    data.courseProgress = data.courseProgress || {};
    data.courseProgress[courseId] = clampProgress(progress);
    data.currentCourseId = courseId;
    write(data);
  }

  function getCurrentCourseId() {
    return getAll().currentCourseId || '';
  }

  function setCurrentCourseId(courseId) {
    const data = getAll();
    data.currentCourseId = courseId || '';
    write(data);
  }

  function saveCourse(course) {
    return upsert('courses', course);
  }

  function removeCourse(courseId) {
    remove('courses', courseId);
    const data = getAll();
    if (data.currentCourseId === courseId) {
      data.currentCourseId = '';
    }
    if (data.courseProgress && typeof data.courseProgress === 'object') {
      delete data.courseProgress[courseId];
    }
    write(data);
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
    getCourseProgress,
    saveCourseProgress,
    getCurrentCourseId,
    setCurrentCourseId,
    saveCourse,
    removeCourse,
    generateId
  };
})();
