(() => {
  if (window.FC3D_SHARED) {
    return;
  }

  const STORAGE_KEYS = {
    results: "fc3d_admin_results",
    config: "fc3d_admin_config"
  };

  const DEFAULT_RESULTS = [
    { issue: "2026229", date: "2026-08-25", numbers: [4, 3, 6], test: "471", sum: 13, span: 3, shape: "组六" },
    { issue: "2026228", date: "2026-08-24", numbers: [5, 8, 2], test: "471", sum: 15, span: 6, shape: "组六" },
    { issue: "2026227", date: "2026-08-23", numbers: [4, 1, 7], test: "235", sum: 12, span: 6, shape: "组六" },
    { issue: "2026226", date: "2026-08-22", numbers: [9, 3, 3], test: "118", sum: 15, span: 6, shape: "组三" },
    { issue: "2026225", date: "2026-08-21", numbers: [2, 8, 5], test: "640", sum: 15, span: 6, shape: "组六" },
    { issue: "2026224", date: "2026-08-20", numbers: [6, 4, 0], test: "226", sum: 10, span: 6, shape: "组六" },
    { issue: "2026223", date: "2026-08-19", numbers: [1, 5, 8], test: "753", sum: 14, span: 7, shape: "组六" },
    { issue: "2026222", date: "2026-08-18", numbers: [0, 7, 4], test: "391", sum: 11, span: 7, shape: "组六" },
    { issue: "2026221", date: "2026-08-17", numbers: [8, 2, 6], test: "512", sum: 16, span: 6, shape: "组六" },
    { issue: "2026220", date: "2026-08-16", numbers: [5, 5, 3], test: "268", sum: 13, span: 2, shape: "组三" },
    { issue: "2026219", date: "2026-08-15", numbers: [3, 1, 9], test: "745", sum: 13, span: 8, shape: "组六" },
    { issue: "2026218", date: "2026-08-14", numbers: [6, 6, 0], test: "483", sum: 12, span: 6, shape: "组三" }
  ];

  function detectShape(numbers) {
    const uniqueSize = new Set(numbers).size;
    if (uniqueSize === 1) return "豹子";
    if (uniqueSize === 2) return "组三";
    return "组六";
  }

  function normalizeTimeText(value, fallbackValue = "22:15") {
    const raw = String(value || "").trim();
    if (!raw) {
      return fallbackValue;
    }

    const matched = /^(\d{1,2})[:.：](\d{1,2})$/.exec(raw);
    if (!matched) {
      return fallbackValue;
    }

    const hour = Number(matched[1]);
    const minute = Number(matched[2]);
    if (!Number.isInteger(hour) || !Number.isInteger(minute) || hour < 0 || hour > 23 || minute < 0 || minute > 59) {
      return fallbackValue;
    }

    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function normalizeResult(item) {
    const numbers = Array.isArray(item?.numbers)
      ? item.numbers.slice(0, 3).map((num) => Math.min(9, Math.max(0, Number(num) || 0)))
      : [0, 0, 0];

    return {
      issue: String(item?.issue || ""),
      date: String(item?.date || ""),
      numbers,
      test: String(item?.test || ""),
      sum: typeof item?.sum === "number" ? item.sum : numbers.reduce((total, value) => total + value, 0),
      span: typeof item?.span === "number" ? item.span : Math.max(...numbers) - Math.min(...numbers),
      shape: item?.shape || detectShape(numbers)
    };
  }

  function sortResults(results) {
    return [...results].sort((left, right) => String(right.issue).localeCompare(String(left.issue)));
  }

  function getDefaultConfig(results) {
    return {
      currentIssue: results[0]?.issue || DEFAULT_RESULTS[0].issue,
      drawTime: "22:15"
    };
  }

  function loadResults() {
    const raw = window.localStorage.getItem(STORAGE_KEYS.results);
    if (!raw) {
      return sortResults(DEFAULT_RESULTS);
    }

    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) {
        return sortResults(DEFAULT_RESULTS);
      }
      return sortResults(parsed.map(normalizeResult).filter((item) => item.issue));
    } catch (error) {
      return sortResults(DEFAULT_RESULTS);
    }
  }

  function loadConfig(results) {
    const fallback = getDefaultConfig(results);
    const raw = window.localStorage.getItem(STORAGE_KEYS.config);
    if (!raw) {
      return fallback;
    }

    try {
      const parsed = JSON.parse(raw) || {};
      return {
        currentIssue: String(parsed.currentIssue || fallback.currentIssue),
        drawTime: normalizeTimeText(parsed.drawTime, fallback.drawTime)
      };
    } catch (error) {
      return fallback;
    }
  }

  function saveResults(results) {
    const normalized = sortResults((results || []).map(normalizeResult).filter((item) => item.issue));
    window.localStorage.setItem(STORAGE_KEYS.results, JSON.stringify(normalized));
    return normalized;
  }

  function saveConfig(config, results) {
    const fallback = getDefaultConfig(results || loadResults());
    const normalized = {
      currentIssue: String(config?.currentIssue || fallback.currentIssue),
      drawTime: normalizeTimeText(config?.drawTime, fallback.drawTime)
    };
    window.localStorage.setItem(STORAGE_KEYS.config, JSON.stringify(normalized));
    return normalized;
  }

  function initializeStore() {
    const results = loadResults();
    const config = loadConfig(results);
    saveResults(results);
    saveConfig(config, results);
    return { results, config };
  }

  window.FC3D_SHARED = {
    STORAGE_KEYS,
    DEFAULT_RESULTS,
    detectShape,
    normalizeResult,
    normalizeTimeText,
    sortResults,
    getDefaultConfig,
    loadResults,
    loadConfig,
    saveResults,
    saveConfig,
    initializeStore
  };
})();
