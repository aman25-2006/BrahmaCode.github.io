(function () {
  const STORAGE_KEY = "bc_gamified_state_v1";
  const GAME_EVENT = "bc-gamified-updated";

  const ACTION_POINTS = {
    problem_solved: 10,
    doubt_posted: 5,
    doubt_answered: 15,
    daily_challenge: 20,
    quiz_win: 12,
    output_win: 8,
    speed_win: 15,
    puzzle_win: 10
  };

  const BADGE_RULES = [
    {
      id: "first-solve",
      name: "First Solve",
      description: "Solve your first coding problem.",
      check: (state) => state.solvedProblems >= 1
    },
    {
      id: "mentor-mode",
      name: "Mentor Mode",
      description: "Post 3 helpful answers.",
      check: (state) => state.answersPosted >= 3
    },
    {
      id: "question-master",
      name: "Question Master",
      description: "Post your first doubt.",
      check: (state) => state.doubtsPosted >= 1
    },
    {
      id: "streak-warrior",
      name: "Streak Warrior",
      description: "Maintain a 3-day streak.",
      check: (state) => state.streak >= 3
    },
    {
      id: "xp-century",
      name: "XP Century",
      description: "Reach 100 points.",
      check: (state) => state.points >= 100
    },
    {
      id: "daily-commander",
      name: "Daily Commander",
      description: "Complete 3 daily challenges.",
      check: (state) => state.dailyCompletedCount >= 3
    },
    {
      id: "speedster",
      name: "Speedster",
      description: "Complete speed challenge in 20s or less.",
      check: (state) => Number(state.speedBest || 0) > 0 && Number(state.speedBest || 0) <= 20
    }
  ];

  const DAILY_CHALLENGES = [
    {
      title: "Solve one medium DSA problem",
      description: "Pick one medium-level problem and submit a working approach."
    },
    {
      title: "Help one peer with an answer",
      description: "Open doubts feed and post one clear, practical answer."
    },
    {
      title: "Revise one core concept",
      description: "Spend 20 focused minutes revising arrays, trees, or complexity."
    },
    {
      title: "Write one dry run",
      description: "Take one algorithm and manually dry run it on sample input."
    }
  ];

  function byId(id) {
    return document.getElementById(id);
  }

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function yesterdayKey() {
    const date = new Date();
    date.setDate(date.getDate() - 1);
    return date.toISOString().slice(0, 10);
  }

  function readState() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
      return normalizeState(parsed);
    } catch {
      return defaultState();
    }
  }

  function writeState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function defaultState() {
    return {
      points: 0,
      streak: 0,
      lastActiveDate: "",
      badges: [],
      claimedEvents: {},
      activity: [],
      solvedProblems: 0,
      doubtsPosted: 0,
      answersPosted: 0,
      dailyCompletedOn: "",
      dailyCompletedCount: 0,
      speedBest: 0
    };
  }

  function normalizeState(input) {
    const base = defaultState();
    return {
      ...base,
      ...input,
      points: Number(input.points || 0),
      streak: Number(input.streak || 0),
      solvedProblems: Number(input.solvedProblems || 0),
      doubtsPosted: Number(input.doubtsPosted || 0),
      answersPosted: Number(input.answersPosted || 0),
      dailyCompletedCount: Number(input.dailyCompletedCount || 0),
      speedBest: Number(input.speedBest || 0),
      badges: Array.isArray(input.badges) ? input.badges : [],
      claimedEvents: input.claimedEvents && typeof input.claimedEvents === "object" ? input.claimedEvents : {},
      activity: Array.isArray(input.activity) ? input.activity.slice(0, 30) : []
    };
  }

  function touchActiveDay(state) {
    const today = todayKey();
    if (state.lastActiveDate === today) {
      return;
    }

    if (!state.lastActiveDate) {
      state.streak = 1;
    } else if (state.lastActiveDate === yesterdayKey()) {
      state.streak += 1;
    } else {
      state.streak = 1;
    }

    state.lastActiveDate = today;
  }

  function computeRank(points) {
    if (points >= 600) return "Diamond";
    if (points >= 350) return "Platinum";
    if (points >= 200) return "Gold";
    if (points >= 80) return "Silver";
    return "Bronze";
  }

  function pushActivity(state, text) {
    state.activity.unshift({ text, at: Date.now() });
    if (state.activity.length > 20) {
      state.activity = state.activity.slice(0, 20);
    }
  }

  function unlockBadges(state) {
    BADGE_RULES.forEach((rule) => {
      if (!state.badges.includes(rule.id) && rule.check(state)) {
        state.badges.push(rule.id);
        pushActivity(state, "Unlocked badge: " + rule.name);
      }
    });
  }

  function incrementActionCounter(state, actionType) {
    if (actionType === "problem_solved") state.solvedProblems += 1;
    if (actionType === "doubt_posted") state.doubtsPosted += 1;
    if (actionType === "doubt_answered") state.answersPosted += 1;
    if (actionType === "daily_challenge") state.dailyCompletedCount += 1;
  }

  function awardPoints(actionType, options) {
    const opts = options || {};
    const state = readState();
    const key = String(opts.key || "").trim();

    if (key && state.claimedEvents[key]) {
      return { awarded: false, state };
    }

    const points = Number(opts.points ?? ACTION_POINTS[actionType] ?? 0);
    if (points <= 0) {
      return { awarded: false, state };
    }

    touchActiveDay(state);
    incrementActionCounter(state, actionType);
    state.points += points;

    if (key) {
      state.claimedEvents[key] = Date.now();
    }

    const reason = opts.reason || actionType.replace(/_/g, " ");
    pushActivity(state, `+${points} points • ${reason}`);
    unlockBadges(state);

    writeState(state);
    window.dispatchEvent(new CustomEvent(GAME_EVENT, { detail: state }));
    return { awarded: true, state };
  }

  function setSpeedBest(seconds) {
    const secs = Number(seconds || 0);
    if (!secs || Number.isNaN(secs)) return;

    const state = readState();
    if (!state.speedBest || secs < state.speedBest) {
      state.speedBest = Number(secs.toFixed(1));
      pushActivity(state, `New speed record: ${state.speedBest}s`);
      unlockBadges(state);
      writeState(state);
      window.dispatchEvent(new CustomEvent(GAME_EVENT, { detail: state }));
    }
  }

  function completeDailyChallenge() {
    const state = readState();
    const key = todayKey();

    if (state.dailyCompletedOn === key) {
      return { awarded: false, state };
    }

    state.dailyCompletedOn = key;
    writeState(state);
    return awardPoints("daily_challenge", {
      key: "daily-" + key,
      reason: "Completed daily challenge"
    });
  }

  function getDailyChallengeForToday() {
    const index = new Date().getDate() % DAILY_CHALLENGES.length;
    return DAILY_CHALLENGES[index];
  }

  function leaderboardData(state) {
    const entries = [
      { name: "Aarav", points: 620 },
      { name: "Siya", points: 510 },
      { name: "Rohan", points: 420 },
      { name: "You", points: state.points }
    ];

    return entries.sort((a, b) => b.points - a.points);
  }

  function renderHomeMiniStats() {
    const root = byId("home-gamified-stats");
    if (!root) return;

    const state = readState();
    root.innerHTML = `
      <article class="mini-gamified-card">
        <p>Total Points</p>
        <h3>${state.points}</h3>
      </article>
      <article class="mini-gamified-card">
        <p>Current Streak</p>
        <h3>${state.streak} days</h3>
      </article>
      <article class="mini-gamified-card">
        <p>Current Rank</p>
        <h3>${computeRank(state.points)}</h3>
      </article>
      <article class="mini-gamified-card mini-gamified-card-action">
        <p>Open Arena</p>
        <a class="btn btn-primary" href="gamified.html">Play Challenges</a>
      </article>
    `;
  }

  function renderGamifiedDashboard() {
    const root = byId("gamified-root");
    if (!root) return;

    const state = readState();
    const rank = computeRank(state.points);

    if (byId("gm-points")) byId("gm-points").textContent = String(state.points);
    if (byId("gm-streak")) byId("gm-streak").textContent = `${state.streak} days`;
    if (byId("gm-rank")) byId("gm-rank").textContent = rank;
    if (byId("gm-badge-count")) byId("gm-badge-count").textContent = `${state.badges.length} unlocked`;

    const badgeGrid = byId("badge-grid");
    if (badgeGrid) {
      badgeGrid.innerHTML = BADGE_RULES.map((badge) => {
        const unlocked = state.badges.includes(badge.id);
        return `
          <article class="badge-card ${unlocked ? "is-unlocked" : ""}">
            <h4>${badge.name}</h4>
            <p>${badge.description}</p>
            <span>${unlocked ? "Unlocked" : "Locked"}</span>
          </article>
        `;
      }).join("");
    }

    const leaderboard = byId("leaderboard-list");
    if (leaderboard) {
      leaderboard.innerHTML = leaderboardData(state)
        .map((item, index) => `<p><strong>#${index + 1}</strong> ${item.name} <span>${item.points} pts</span></p>`)
        .join("");
    }

    const activityFeed = byId("activity-feed");
    if (activityFeed) {
      if (!state.activity.length) {
        activityFeed.innerHTML = "<li>Start with one challenge to see activity here.</li>";
      } else {
        activityFeed.innerHTML = state.activity
          .slice(0, 8)
          .map((item) => `<li>${item.text}</li>`)
          .join("");
      }
    }

    const daily = getDailyChallengeForToday();
    const dailyTitle = byId("daily-title");
    const dailyDesc = byId("daily-description");
    const dailyBtn = byId("daily-complete-btn");

    if (dailyTitle) dailyTitle.textContent = daily.title;
    if (dailyDesc) dailyDesc.textContent = daily.description;

    if (dailyBtn) {
      const alreadyDone = state.dailyCompletedOn === todayKey();
      dailyBtn.disabled = alreadyDone;
      dailyBtn.textContent = alreadyDone ? "Completed for Today" : "Complete Daily Challenge (+20)";
    }
  }

  function initQuizGame() {
    const note = byId("quiz-note");
    document.querySelectorAll("[data-quiz-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const answer = button.getAttribute("data-quiz-answer");
        if (answer === "O(n log n)") {
          const result = awardPoints("quiz_win", {
            key: `quiz-correct-${todayKey()}`,
            reason: "Won quick quiz"
          });
          note.textContent = result.awarded ? "Correct! +12 points earned." : "Correct, already claimed today.";
          note.classList.add("success");
        } else {
          note.textContent = "Not correct yet. Try once more.";
          note.classList.remove("success");
        }
        renderGamifiedDashboard();
      });
    });
  }

  function initOutputGame() {
    const note = byId("output-note");
    document.querySelectorAll("[data-output-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const answer = button.getAttribute("data-output-answer");
        if (answer === "1-2-3") {
          const result = awardPoints("output_win", {
            key: `output-correct-${todayKey()}`,
            reason: "Solved guess output challenge"
          });
          note.textContent = result.awarded ? "Correct! +8 points earned." : "Already solved. Great memory.";
          note.classList.add("success");
        } else {
          note.textContent = "Wrong output. Read the map logic once more.";
          note.classList.remove("success");
        }
        renderGamifiedDashboard();
      });
    });
  }

  function initDailyChallenge() {
    const button = byId("daily-complete-btn");
    const note = byId("daily-note");
    if (!button || !note) return;

    button.addEventListener("click", () => {
      const result = completeDailyChallenge();
      note.textContent = result.awarded ? "Challenge completed! +20 points earned." : "Daily challenge already completed today.";
      note.classList.toggle("success", result.awarded);
      renderGamifiedDashboard();
    });
  }

  function initSpeedChallenge() {
    const startBtn = byId("speed-start-btn");
    const submitBtn = byId("speed-submit-btn");
    const answerInput = byId("speed-answer");
    const note = byId("speed-note");
    if (!startBtn || !submitBtn || !answerInput || !note) return;

    let startedAt = 0;

    startBtn.addEventListener("click", () => {
      startedAt = Date.now();
      note.textContent = "Timer started. Enter output and submit.";
      note.classList.remove("success");
      answerInput.focus();
    });

    submitBtn.addEventListener("click", () => {
      if (!startedAt) {
        note.textContent = "Start timer first.";
        note.classList.remove("success");
        return;
      }

      const answer = String(answerInput.value || "").trim();
      if (answer !== "2-4-6") {
        note.textContent = "Incorrect output. Start again and retry.";
        note.classList.remove("success");
        return;
      }

      const seconds = (Date.now() - startedAt) / 1000;
      setSpeedBest(seconds);
      const result = awardPoints("speed_win", {
        key: `speed-success-${todayKey()}`,
        reason: "Completed speed challenge"
      });

      const rounded = seconds.toFixed(1);
      note.textContent = result.awarded
        ? `Correct in ${rounded}s. +15 points earned.`
        : `Correct in ${rounded}s. Points already claimed.`;
      note.classList.add("success");
      startedAt = 0;
      answerInput.value = "";
      renderGamifiedDashboard();
    });
  }

  function initPuzzle() {
    const note = byId("puzzle-note");
    document.querySelectorAll("[data-puzzle-answer]").forEach((button) => {
      button.addEventListener("click", () => {
        const answer = button.getAttribute("data-puzzle-answer");
        if (answer === "hash-dll") {
          const result = awardPoints("puzzle_win", {
            key: `puzzle-correct-${todayKey()}`,
            reason: "Solved code puzzle"
          });
          note.textContent = result.awarded ? "Perfect architecture choice. +10 points." : "Already solved this puzzle.";
          note.classList.add("success");
        } else {
          note.textContent = "Not optimal for O(1) get/put with eviction.";
          note.classList.remove("success");
        }
        renderGamifiedDashboard();
      });
    });
  }

  function initGamifiedPage() {
    if (!byId("gamified-root")) return;
    renderGamifiedDashboard();
    initQuizGame();
    initOutputGame();
    initDailyChallenge();
    initSpeedChallenge();
    initPuzzle();
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHomeMiniStats();
    initGamifiedPage();
  });

  window.addEventListener(GAME_EVENT, () => {
    renderHomeMiniStats();
    renderGamifiedDashboard();
  });

  window.BCGamify = {
    awardPoints,
    completeDailyChallenge,
    getState: readState,
    getRank: function () {
      const state = readState();
      return computeRank(state.points);
    }
  };
})();
