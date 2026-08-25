function createFallbackSharedStore() {
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
    const matched = /^(\d{1,2})[:.：](\d{1,2})$/.exec(raw);
    if (!matched) return fallbackValue;
    const hour = Number(matched[1]);
    const minute = Number(matched[2]);
    if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallbackValue;
    return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
  }

  function normalizeResult(item) {
    const numbers = Array.isArray(item.numbers) ? item.numbers.slice(0, 3).map((num) => Number(num) || 0) : [0, 0, 0];
    return {
      issue: String(item.issue || ""),
      date: item.date || "",
      numbers,
      test: String(item.test || ""),
      sum: typeof item.sum === "number" ? item.sum : numbers.reduce((total, value) => total + value, 0),
      span: typeof item.span === "number" ? item.span : Math.max(...numbers) - Math.min(...numbers),
      shape: item.shape || detectShape(numbers)
    };
  }

  function sortResults(results) {
    return [...results].sort((left, right) => right.issue.localeCompare(left.issue));
  }

  function getDefaultConfig(results) {
    return {
      currentIssue: results[0]?.issue || DEFAULT_RESULTS[0].issue,
      drawTime: "22:15"
    };
  }

  function loadResults() {
    const raw = window.localStorage.getItem(STORAGE_KEYS.results);
    if (!raw) return sortResults(DEFAULT_RESULTS);
    try {
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed) || !parsed.length) return sortResults(DEFAULT_RESULTS);
      return sortResults(parsed.map(normalizeResult));
    } catch (error) {
      return sortResults(DEFAULT_RESULTS);
    }
  }

  function loadConfig(results) {
    const fallback = getDefaultConfig(results);
    const raw = window.localStorage.getItem(STORAGE_KEYS.config);
    if (!raw) return fallback;
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

  function initializeStore() {
    const results = loadResults();
    const config = loadConfig(results);
    return { results, config };
  }

  return {
    detectShape,
    normalizeTimeText,
    initializeStore
  };
}

const sharedStore = window.FC3D_SHARED || createFallbackSharedStore();
const navItems = document.querySelectorAll(".nav-item");
const actionButtons = document.querySelectorAll(".action-btn");
const countdownNode = document.querySelector("#countdown");

const homeNodes = {
  topDrawTime: document.querySelector("#topDrawTime"),
  currentIssueHeader: document.querySelector("#currentIssueHeader"),
  infoUpdateTime: document.querySelector("#infoUpdateTime"),
  drawNotice: document.querySelector("#drawNotice"),
  latestPanelIssue: document.querySelector("#latestPanelIssue"),
  latestDate: document.querySelector("#latestDate"),
  latestDrawTime: document.querySelector("#latestDrawTime"),
  latestNumberBoard: document.querySelector("#latestNumberBoard"),
  latestTest: document.querySelector("#latestTest"),
  latestSum: document.querySelector("#latestSum"),
  latestSpan: document.querySelector("#latestSpan"),
  latestShape: document.querySelector("#latestShape"),
  homeHistoryBody: document.querySelector("#homeHistoryBody"),
  latestArticleText: document.querySelector("#latestArticleText"),
  latestArticleDate: document.querySelector("#latestArticleDate")
};

const historyNodes = {
  topDrawTime: document.querySelector("#topDrawTime"),
  infoUpdateTime: document.querySelector("#infoUpdateTime"),
  issueInput: document.querySelector("#historyIssueInput"),
  countText: document.querySelector("#historyCountText"),
  latestIssue: document.querySelector("#historyLatestIssue"),
  range: document.querySelector("#historyRange"),
  latestDate: document.querySelector("#historyLatestDate"),
  pageText: document.querySelector("#historyPageText"),
  tableBody: document.querySelector("#historyTableBody"),
  queryForm: document.querySelector(".query-form")
};

const pageState = {
  results: [],
  config: {},
  historyKeyword: ""
};

function renderProtocolNotice() {
  const noticeId = "protocolNotice";
  const existing = document.getElementById(noticeId);
  if (window.location.protocol !== "file:") {
    existing?.remove();
    return;
  }

  if (existing) {
    return;
  }

  const notice = document.createElement("div");
  notice.id = noticeId;
  notice.style.cssText = "position:sticky;top:0;z-index:9999;padding:10px 16px;background:#8b1e1e;color:#fff;font-size:14px;text-align:center;border-bottom:2px solid #f3c46b;";
  notice.textContent = "当前是直接双击打开页面，后台和前台可能不同步。请返回项目根目录，双击“一键启动本地站点.bat”后再打开后台和前台。";
  document.body.prepend(notice);
}

function setActiveNav(target) {
  navItems.forEach((item) => {
    item.classList.toggle("active", item === target);
    item.setAttribute("aria-current", item === target ? "page" : "false");
  });
}

function bindNavEvents() {
  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      setActiveNav(item);
    });
  });
}

function bindActionFeedback() {
  actionButtons.forEach((button) => {
    const originalText = button.textContent;
    button.addEventListener("click", () => {
      button.textContent = "欄目內容建置中";
      button.disabled = true;
      window.setTimeout(() => {
        button.textContent = originalText;
        button.disabled = false;
      }, 1200);
    });
  });
}

function reloadData() {
  const sharedState = sharedStore.initializeStore();
  pageState.results = sharedState.results || [];
  pageState.config = sharedState.config || {};
}

function getCurrentIssueContext() {
  const currentIssue = String(pageState.config.currentIssue || "").trim();
  const matchedItem = currentIssue ? pageState.results.find((item) => item.issue === currentIssue) : null;
  const fallbackItem = pageState.results[0] || null;
  return {
    currentIssue: currentIssue || fallbackItem?.issue || "",
    item: matchedItem || fallbackItem,
    matched: Boolean(matchedItem)
  };
}

function createPendingVisibleResult() {
  return {
    drawState: {
      visibleCount: 0,
      isPending: true,
      isRevealing: false,
      isComplete: false,
      openedCount: 0
    },
    numbers: ["-", "-", "-"],
    sum: "--",
    span: "--",
    shape: "--"
  };
}

function getTrackedDrawState(item, now = new Date()) {
  if (!item || !item.issue || !item.date) {
    return {
      visibleCount: 3,
      isPending: false,
      isRevealing: false,
      isComplete: true,
      openedCount: 3
    };
  }

  if (item.issue !== pageState.config.currentIssue) {
    return {
      visibleCount: 3,
      isPending: false,
      isRevealing: false,
      isComplete: true,
      openedCount: 3
    };
  }

  const drawTime = sharedStore.normalizeTimeText(pageState.config.drawTime, "22:15");
  const drawStart = new Date(`${item.date}T${drawTime}:00`);
  if (Number.isNaN(drawStart.getTime())) {
    return {
      visibleCount: 3,
      isPending: false,
      isRevealing: false,
      isComplete: true,
      openedCount: 3
    };
  }

  const diff = now.getTime() - drawStart.getTime();
  if (diff < 0) {
    // 开奖时间还没到：号码隐藏，等开奖时间到了才逐个显示
    return {
      visibleCount: 0,
      isPending: true,
      isRevealing: false,
      isComplete: false,
      openedCount: 0
    };
  }

  const openedCount = Math.min(3, Math.floor(diff / 10000) + 1);
  return {
    visibleCount: openedCount,
    isPending: false,
    isRevealing: openedCount < 3,
    isComplete: openedCount >= 3,
    openedCount
  };
}

function getVisibleResult(item, now = new Date()) {
  const drawState = getTrackedDrawState(item, now);
  return {
    drawState,
    numbers: item.numbers.map((number, index) => (index < drawState.visibleCount ? String(number) : "-")),
    sum: drawState.isComplete ? String(item.sum) : "--",
    span: drawState.isComplete ? String(item.span) : "--",
    shape: drawState.isComplete ? item.shape : "--"
  };
}

function getStoredResult(item) {
  return {
    numbers: item.numbers.map((number) => String(number)),
    sum: String(item.sum),
    span: String(item.span),
    shape: item.shape
  };
}

function renderBallMarkup(numbers, className) {
  return numbers.map((number) => `<span class="${className}">${number}</span>`).join("");
}

function formatMonthRange(results) {
  const first = results[0];
  if (!first?.date) return "--";
  return first.date.slice(0, 7).replace("-", "/");
}

function formatShortDate(dateText) {
  return dateText ? dateText.slice(5) : "--";
}

function renderHomePage() {
  if (!homeNodes.latestPanelIssue) {
    return;
  }

  const now = new Date();
  const currentContext = getCurrentIssueContext();
  const currentItem = currentContext.item;
  if (!currentItem) {
    return;
  }

  const visible = currentContext.matched ? getVisibleResult(currentItem, now) : createPendingVisibleResult();
  const drawTime = sharedStore.normalizeTimeText(pageState.config.drawTime, "22:15");

  if (homeNodes.topDrawTime) homeNodes.topDrawTime.textContent = drawTime;
  if (homeNodes.currentIssueHeader) homeNodes.currentIssueHeader.textContent = currentContext.currentIssue || "--";
  if (homeNodes.infoUpdateTime) homeNodes.infoUpdateTime.textContent = drawTime;
  if (homeNodes.latestPanelIssue) homeNodes.latestPanelIssue.textContent = `第${currentContext.currentIssue}期`;
  if (homeNodes.latestDate) homeNodes.latestDate.textContent = currentItem.date || "--";
  if (homeNodes.latestDrawTime) homeNodes.latestDrawTime.textContent = drawTime;
  if (homeNodes.latestNumberBoard) homeNodes.latestNumberBoard.innerHTML = renderBallMarkup(visible.numbers, "ball");
  if (homeNodes.latestTest) homeNodes.latestTest.textContent = currentContext.matched ? (currentItem.test || "--") : "--";
  if (homeNodes.latestSum) homeNodes.latestSum.textContent = visible.sum;
  if (homeNodes.latestSpan) homeNodes.latestSpan.textContent = visible.span;
  if (homeNodes.latestShape) homeNodes.latestShape.textContent = visible.shape;

  if (homeNodes.drawNotice) {
    if (!currentContext.matched) {
      homeNodes.drawNotice.textContent = `台灣3D福彩第${currentContext.currentIssue}期已設為當前期，請先到後台保存這一期的開獎日期與號碼。`;
    } else if (visible.drawState.isPending) {
      homeNodes.drawNotice.textContent = `台灣3D福彩第${currentContext.currentIssue}期將於 ${currentItem.date} ${drawTime} 開獎，開獎後系統將同步更新號碼、試機號與歷史記錄。`;
    } else if (visible.drawState.isRevealing) {
      homeNodes.drawNotice.textContent = `台灣3D福彩第${currentContext.currentIssue}期正在開獎，已開出第 ${visible.drawState.openedCount} 個號碼。`;
    } else {
      homeNodes.drawNotice.textContent = `台灣3D福彩第${currentContext.currentIssue}期已完成開獎，試機號、和值、跨度與型態已同步更新。`;
    }
  }

  if (homeNodes.latestArticleText) {
    homeNodes.latestArticleText.textContent = `台灣3D福彩第${currentContext.currentIssue}期${visible.drawState.isComplete ? "已完成開獎並同步更新試機號、和值與型態說明。" : "即將開獎，開獎後將同步更新試機號、和值與型態說明。"}`;
  }
  if (homeNodes.latestArticleDate) {
    homeNodes.latestArticleDate.textContent = formatShortDate(currentItem.date);
  }

  if (homeNodes.homeHistoryBody) {
    const displayData = currentContext.matched
      ? [currentItem, ...pageState.results.filter((item) => item.issue !== currentItem.issue)]
      : pageState.results;
    homeNodes.homeHistoryBody.innerHTML = displayData.slice(0, 6).map((item) => {
      const rowVisible = item.issue === currentContext.currentIssue ? getVisibleResult(item, now) : getStoredResult(item);
      return `
        <tr>
          <td>${item.issue}</td>
          <td>${rowVisible.numbers.join(" ")}</td>
          <td>${item.test || "--"}</td>
          <td>${rowVisible.sum}</td>
          <td>${rowVisible.span}</td>
          <td>${rowVisible.shape}</td>
        </tr>
      `;
    }).join("");
  }
}

function getFilteredHistoryResults() {
  const keyword = String(pageState.historyKeyword || "").trim();
  if (!keyword) {
    return pageState.results;
  }
  return pageState.results.filter((item) => item.issue.includes(keyword) || item.date.includes(keyword));
}

function renderHistoryPage() {
  if (!historyNodes.tableBody) {
    return;
  }

  const now = new Date();
  const filtered = getFilteredHistoryResults();
  const latest = filtered[0] || pageState.results[0];
  const drawTime = sharedStore.normalizeTimeText(pageState.config.drawTime, "22:15");

  if (historyNodes.topDrawTime) historyNodes.topDrawTime.textContent = drawTime;
  if (historyNodes.infoUpdateTime) historyNodes.infoUpdateTime.textContent = drawTime;
  if (historyNodes.issueInput && document.activeElement !== historyNodes.issueInput) {
    historyNodes.issueInput.value = pageState.historyKeyword || pageState.config.currentIssue || "";
  }
  if (historyNodes.countText) historyNodes.countText.textContent = `共 ${filtered.length} 筆資料`;
  if (historyNodes.latestIssue) historyNodes.latestIssue.textContent = latest?.issue || "--";
  if (historyNodes.range) historyNodes.range.textContent = formatMonthRange(filtered.length ? filtered : pageState.results);
  if (historyNodes.latestDate) historyNodes.latestDate.textContent = formatShortDate(latest?.date || "");
  if (historyNodes.pageText) historyNodes.pageText.textContent = "第 1 頁 / 共 1 頁";

  historyNodes.tableBody.innerHTML = (filtered.length ? filtered : []).slice(0, 20).map((item) => {
    const visible = getStoredResult(item);
    return `
      <tr>
        <td>${item.issue}</td>
        <td>${item.date}</td>
        <td><div class="table-balls">${renderBallMarkup(visible.numbers, "mini-ball")}</div></td>
        <td>${item.test || "--"}</td>
        <td>${visible.sum}</td>
        <td>${visible.span}</td>
        <td>${visible.shape}</td>
      </tr>
    `;
  }).join("") || '<tr><td colspan="7">暫無資料</td></tr>';
}

function updateCountdown() {
  if (!countdownNode) {
    return;
  }

  const now = new Date();
  const currentContext = getCurrentIssueContext();
  const currentItem = currentContext.item;

  // 开奖中（10秒一位期间）：显示进度
  if (currentContext.matched && currentItem?.date) {
    const drawState = getTrackedDrawState(currentItem, now);
    if (drawState.isRevealing) {
      countdownNode.textContent = `開獎中 ${drawState.openedCount}/3`;
      return;
    }
  }

  // 其余状态（待开奖 / 已开奖 / 未匹配）：显示到下一次开奖时间的倒计时
  const drawTime = sharedStore.normalizeTimeText(pageState.config.drawTime, "22:15");
  const [hour, minute] = drawTime.split(":").map(Number);
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (now >= target) {
    target.setDate(target.getDate() + 1);
  }
  const diff = Math.max(0, target.getTime() - now.getTime());
  const hours = String(Math.floor(diff / 1000 / 60 / 60)).padStart(2, "0");
  const minutes = String(Math.floor((diff / 1000 / 60) % 60)).padStart(2, "0");
  const seconds = String(Math.floor((diff / 1000) % 60)).padStart(2, "0");
  countdownNode.textContent = `${hours}小時${minutes}分鐘${seconds}秒`;
}

function renderAll() {
  reloadData();
  renderHomePage();
  renderHistoryPage();
  updateCountdown();
}

function bindHistoryForm() {
  if (!historyNodes.queryForm || !historyNodes.issueInput) {
    return;
  }

  historyNodes.queryForm.addEventListener("submit", () => {
    pageState.historyKeyword = historyNodes.issueInput.value.trim();
    renderHistoryPage();
  });

  historyNodes.queryForm.addEventListener("reset", () => {
    window.setTimeout(() => {
      pageState.historyKeyword = "";
      historyNodes.issueInput.value = pageState.config.currentIssue || "";
      renderHistoryPage();
    }, 0);
  });
}

function bindStorageSync() {
  window.addEventListener("storage", (event) => {
    if (event.key === "fc3d_admin_results" || event.key === "fc3d_admin_config") {
      renderAll();
    }
  });
}

async function loadFromCloud() {
  try {
    const res = await fetch('/api/data?_=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    if (data.results) {
      sharedStore.saveResults(data.results);
    }
    if (data.config) {
      sharedStore.saveConfig(data.config, data.results || pageState.results);
    }
    renderAll();
  } catch (error) {
    // 云端不可用，保持本地数据
  }
}

bindNavEvents();
bindActionFeedback();
bindHistoryForm();
bindStorageSync();
renderProtocolNotice();
renderAll();
loadFromCloud();
window.setInterval(() => {
  renderAll();
}, 1000);
window.setInterval(() => {
  loadFromCloud();
}, 30000);
