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

  function saveResults(results) {
    const normalized = sortResults(results.map(normalizeResult).filter((item) => item.issue));
    window.localStorage.setItem(STORAGE_KEYS.results, JSON.stringify(normalized));
    return normalized;
  }

  function saveConfig(config, results) {
    const fallback = getDefaultConfig(results || loadResults());
    const normalized = {
      currentIssue: String(config.currentIssue || fallback.currentIssue),
      drawTime: normalizeTimeText(config.drawTime, fallback.drawTime)
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

  return {
    STORAGE_KEYS,
    DEFAULT_RESULTS,
    detectShape,
    normalizeResult,
    normalizeTimeText,
    getDefaultConfig,
    loadResults,
    loadConfig,
    saveResults,
    saveConfig,
    initializeStore
  };
}

const sharedStore = window.FC3D_SHARED || createFallbackSharedStore();
window.FC3D_SHARED = sharedStore;

const elements = {
  totalCount: document.querySelector("#totalCount"),
  currentIssueStat: document.querySelector("#currentIssueStat"),
  drawTimeStat: document.querySelector("#drawTimeStat"),
  latestResultStat: document.querySelector("#latestResultStat"),
  currentIssueInput: document.querySelector("#currentIssueInput"),
  drawTimeInput: document.querySelector("#drawTimeInput"),
  drawDateInput: document.querySelector("#drawDateInput"),
  drawTestInput: document.querySelector("#drawTestInput"),
  drawDigit1: document.querySelector("#drawDigit1"),
  drawDigit2: document.querySelector("#drawDigit2"),
  drawDigit3: document.querySelector("#drawDigit3"),
  drawCalcPreview: document.querySelector("#drawCalcPreview"),
  saveDrawBtn: document.querySelector("#saveDrawBtn"),
  resetConfigBtn: document.querySelector("#resetConfigBtn"),
  issueInput: document.querySelector("#issueInput"),
  dateInput: document.querySelector("#dateInput"),
  testInput: document.querySelector("#testInput"),
  digit1: document.querySelector("#digit1"),
  digit2: document.querySelector("#digit2"),
  digit3: document.querySelector("#digit3"),
  calcPreview: document.querySelector("#calcPreview"),
  saveResultBtn: document.querySelector("#saveResultBtn"),
  clearFormBtn: document.querySelector("#clearFormBtn"),
  newIssueBtn: document.querySelector("#newIssueBtn"),
  sumValueField: document.querySelector("#sumValueField"),
  spanValueField: document.querySelector("#spanValueField"),
  shapeValueField: document.querySelector("#shapeValueField"),
  resultTableBody: document.querySelector("#resultTableBody"),
  emptyState: document.querySelector("#emptyState"),
  exportBtn: document.querySelector("#exportBtn"),
  importInput: document.querySelector("#importInput"),
  nowTime: document.querySelector("#nowTime"),
  countdownValue: document.querySelector("#countdownValue"),
  stageValue: document.querySelector("#stageValue"),
  logConsole: document.querySelector("#logConsole"),
  clearLogBtn: document.querySelector("#clearLogBtn")
};

const state = {
  results: [],
  config: {},
  editingIssue: "",
  autoIssueMode: false
};

function renderProtocolNotice() {
  const noticeId = "adminProtocolNotice";
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
  notice.textContent = "当前是直接双击打开后台，前台可能读不到同一份数据。请回到项目根目录，双击“一键启动本地站点.bat”后再操作。";
  document.body.prepend(notice);
}

function appendLog(message) {
  const stamp = new Date().toLocaleTimeString("zh-CN", { hour12: false });
  elements.logConsole.textContent = `[${stamp}] ${message}\n${elements.logConsole.textContent}`;
}

function persistResults() {
  state.results = sharedStore.saveResults(state.results);
  saveToCloud();
}

function persistConfig() {
  state.config = sharedStore.saveConfig(state.config, state.results);
  saveToCloud();
}

let cloudSaveTimer = null;
function saveToCloud() {
  if (cloudSaveTimer) {
    clearTimeout(cloudSaveTimer);
  }
  cloudSaveTimer = setTimeout(() => {
    try {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          config: state.config,
          results: state.results
        })
      });
    } catch (error) {
      // 云端不可用，忽略
    }
  }, 300);
}

async function loadFromCloud() {
  try {
    const res = await fetch('/api/data?_=' + Date.now());
    if (!res.ok) return;
    const data = await res.json();
    if (data.results && Array.isArray(data.results) && data.results.length) {
      state.results = sharedStore.saveResults(data.results);
    }
    if (data.config) {
      state.config = sharedStore.saveConfig(data.config, state.results);
    }
    renderConfigForm();
    renderStats();
    renderResultTable();
    appendLog("已从云端同步最新数据");
  } catch (error) {
    // 云端不可用，保持本地数据
  }
}

function renderStats() {
  const latest = state.results[0];
  elements.totalCount.textContent = String(state.results.length);
  elements.currentIssueStat.textContent = state.config.currentIssue || "--";
  elements.drawTimeStat.textContent = state.config.drawTime || "--";
  elements.latestResultStat.textContent = latest ? latest.numbers.join(" ") : "--";
}

function renderConfigForm() {
  elements.currentIssueInput.value = state.config.currentIssue || "";
  elements.drawTimeInput.value = state.config.drawTime || "";
}

function getFormNumbers() {
  return [elements.digit1, elements.digit2, elements.digit3].map((input) => {
    const value = Number(input.value);
    return Number.isNaN(value) ? 0 : Math.min(9, Math.max(0, value));
  });
}

function renderCalcPreview() {
  const numbers = getFormNumbers();
  const sum = numbers.reduce((total, value) => total + value, 0);
  const span = Math.max(...numbers) - Math.min(...numbers);
  const shape = sharedStore.detectShape(numbers);
  elements.sumValueField.value = String(sum);
  elements.spanValueField.value = String(span);
  elements.shapeValueField.value = shape;
  elements.calcPreview.textContent = `和值 ${sum} | 跨度 ${span} | 形态 ${shape}`;
}

function getDrawFormNumbers() {
  return [elements.drawDigit1, elements.drawDigit2, elements.drawDigit3].map((input) => {
    const value = Number(input.value);
    return Number.isNaN(value) ? 0 : Math.min(9, Math.max(0, value));
  });
}

function renderDrawCalcPreview() {
  const numbers = getDrawFormNumbers();
  const sum = numbers.reduce((total, value) => total + value, 0);
  const span = Math.max(...numbers) - Math.min(...numbers);
  const shape = sharedStore.detectShape(numbers);
  elements.drawCalcPreview.textContent = `和值 ${sum} | 跨度 ${span} | 形态 ${shape}`;
}

function renderResultTable() {
  elements.emptyState.hidden = state.results.length > 0;
  elements.resultTableBody.innerHTML = state.results.map((item) => `
    <tr>
      <td>${item.issue}</td>
      <td>${item.date}</td>
      <td>${item.numbers.join(" ")}</td>
      <td>${item.test || "--"}</td>
      <td>${item.sum}</td>
      <td>${item.span}</td>
      <td>${item.shape}</td>
      <td>
        <div class="inline-actions">
          <button class="mini-btn" type="button" data-action="edit" data-issue="${item.issue}">编辑</button>
          <button class="mini-btn danger" type="button" data-action="delete" data-issue="${item.issue}">删除</button>
        </div>
      </td>
    </tr>
  `).join("");
}

function clearForm() {
  state.editingIssue = "";
  state.autoIssueMode = false;
  elements.issueInput.value = "";
  elements.dateInput.value = new Date().toISOString().slice(0, 10);
  elements.testInput.value = "";
  elements.digit1.value = 0;
  elements.digit2.value = 0;
  elements.digit3.value = 0;
  renderCalcPreview();
}

function getIssueYearFromDate(dateText) {
  const matched = /^(\d{4})-\d{2}-\d{2}$/.exec(String(dateText || ""));
  return matched ? matched[1] : String(new Date().getFullYear());
}

function buildNextIssue(dateText) {
  const targetYear = getIssueYearFromDate(dateText || elements.dateInput.value);
  const yearIssues = state.results
    .map((item) => String(item.issue || ""))
    .filter((issue) => issue.startsWith(targetYear) && /^\d+$/.test(issue))
    .map((issue) => ({
      raw: issue,
      seq: Number(issue.slice(4)),
      seqLength: Math.max(3, issue.length - 4)
    }))
    .filter((item) => Number.isFinite(item.seq));

  if (!yearIssues.length) {
    return `${targetYear}001`;
  }

  const maxIssue = yearIssues.reduce((best, current) => (current.seq > best.seq ? current : best), yearIssues[0]);
  return `${targetYear}${String(maxIssue.seq + 1).padStart(maxIssue.seqLength, "0")}`;
}

function refreshAutoIssueValue() {
  if (!state.autoIssueMode || state.editingIssue) {
    return;
  }
  elements.issueInput.value = buildNextIssue(elements.dateInput.value);
}

function startNewIssue() {
  state.editingIssue = "";
  elements.dateInput.value = new Date().toISOString().slice(0, 10);
  state.autoIssueMode = true;
  elements.issueInput.value = buildNextIssue(elements.dateInput.value);
  elements.testInput.value = "";
  elements.digit1.value = 0;
  elements.digit2.value = 0;
  elements.digit3.value = 0;
  renderCalcPreview();
  appendLog(`已创建新一期录入草稿：${elements.issueInput.value || "--"}`);
}

function saveDraw() {
  const issue = elements.currentIssueInput.value.trim();
  if (!issue) {
    window.alert("请先填写开奖期号");
    return;
  }

  const drawDate = elements.drawDateInput.value.trim();
  if (!drawDate) {
    window.alert("请先填写开奖日期");
    return;
  }

  const drawTime = sharedStore.normalizeTimeText(elements.drawTimeInput.value.trim(), "");
  if (!drawTime) {
    window.alert("开奖时间支持 22:15、6:03、6.03 这几种写法");
    return;
  }

  const test = elements.drawTestInput.value.trim();
  if (test && !/^\d+$/.test(test)) {
    window.alert("试机号只能填数字");
    return;
  }

  const numbers = getDrawFormNumbers();
  const sum = numbers.reduce((total, value) => total + value, 0);
  const span = Math.max(...numbers) - Math.min(...numbers);
  const result = {
    issue,
    date: drawDate,
    numbers,
    test,
    sum,
    span,
    shape: sharedStore.detectShape(numbers)
  };

  const targetIndex = state.results.findIndex((item) => item.issue === issue);
  if (targetIndex >= 0) {
    state.results[targetIndex] = result;
  } else {
    state.results.push(result);
  }
  state.results.sort((left, right) => right.issue.localeCompare(left.issue));
  persistResults();

  state.config = { currentIssue: issue, drawTime };
  persistConfig();

  renderConfigForm();
  renderStats();
  renderResultTable();
  appendLog(`第 ${issue} 期已设为当前期，开奖时间 ${drawTime}，号码将在开奖时间到达后逐个显示`);
}

function saveResult() {
  const issue = elements.issueInput.value.trim();
  if (!issue) {
    window.alert("请先填写开奖期号");
    return;
  }

  const drawDate = elements.dateInput.value.trim();
  if (!drawDate) {
    window.alert("请先填写开奖日期");
    return;
  }

  const test = elements.testInput.value.trim();
  if (test && !/^\d+$/.test(test)) {
    window.alert("试机号只能填数字");
    return;
  }

  const numbers = getFormNumbers();
  const sum = numbers.reduce((total, value) => total + value, 0);
  const span = Math.max(...numbers) - Math.min(...numbers);
  const result = {
    issue,
    date: drawDate,
    numbers,
    test,
    sum,
    span,
    shape: sharedStore.detectShape(numbers)
  };

  const targetIndex = state.results.findIndex((item) => item.issue === issue);
  if (targetIndex >= 0) {
    state.results[targetIndex] = result;
  } else {
    state.results.push(result);
  }

  state.results.sort((left, right) => right.issue.localeCompare(left.issue));
  persistResults();
  renderConfigForm();
  renderStats();
  renderResultTable();
  appendLog(`第 ${issue} 期历史号码已保存，号码 ${numbers.join("")}，形态 ${result.shape}`);
  clearForm();
}

function editResult(issue) {
  const item = state.results.find((row) => row.issue === issue);
  if (!item) {
    return;
  }

  state.editingIssue = issue;
  state.autoIssueMode = false;
  elements.issueInput.value = item.issue;
  elements.dateInput.value = item.date;
  elements.testInput.value = item.test;
  elements.digit1.value = item.numbers[0];
  elements.digit2.value = item.numbers[1];
  elements.digit3.value = item.numbers[2];
  renderCalcPreview();
  appendLog(`已加载第 ${issue} 期到编辑区`);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function deleteResult(issue) {
  if (!window.confirm(`确定删除第 ${issue} 期吗？`)) {
    return;
  }

  state.results = state.results.filter((item) => item.issue !== issue);
  persistResults();
  if (state.config.currentIssue === issue) {
    state.config.currentIssue = state.results[0]?.issue || "";
    persistConfig();
    renderConfigForm();
  }
  renderStats();
  renderResultTable();
  appendLog(`第 ${issue} 期已删除`);
}

function exportResults() {
  const blob = new Blob([JSON.stringify(state.results, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "fc3d-results.json";
  link.click();
  URL.revokeObjectURL(url);
  appendLog("已导出开奖记录 JSON");
}

function importResults(file) {
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(String(reader.result || "[]"));
      if (!Array.isArray(data)) {
        throw new Error("格式错误");
      }
      state.results = data.map(sharedStore.normalizeResult).filter((item) => item.issue);
      persistResults();
      state.config.currentIssue = state.results[0]?.issue || state.config.currentIssue;
      persistConfig();
      renderConfigForm();
      renderStats();
      renderResultTable();
      appendLog("JSON 数据导入成功");
    } catch (error) {
      window.alert("导入失败，JSON 格式不对");
    }
  };
  reader.readAsText(file, "utf-8");
}

function updateClock() {
  const now = new Date();
  const safeDrawTime = sharedStore.normalizeTimeText(state.config.drawTime, sharedStore.getDefaultConfig(state.results).drawTime);
  state.config.drawTime = safeDrawTime;
  const [hour, minute] = safeDrawTime.split(":").map(Number);
  const target = new Date();
  target.setHours(hour, minute, 0, 0);
  if (now > target) {
    target.setDate(target.getDate() + 1);
  }
  const diff = target.getTime() - now.getTime();
  const totalSeconds = Math.max(0, Math.floor(diff / 1000));
  const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const seconds = String(totalSeconds % 60).padStart(2, "0");
  const stage = totalSeconds <= 60 ? "即将开奖" : totalSeconds <= 900 ? "开奖准备中" : "待开奖";

  elements.nowTime.textContent = now.toLocaleString("zh-CN", { hour12: false });
  elements.countdownValue.textContent = `${hours}:${minutes}:${seconds}`;
  elements.stageValue.textContent = stage;
  elements.stageValue.style.background = stage === "即将开奖" ? "#ff7a7a" : stage === "开奖准备中" ? "#ffcf67" : "#38d39f";
}

function bindEvents() {
  elements.saveDrawBtn.addEventListener("click", saveDraw);
  elements.resetConfigBtn.addEventListener("click", () => {
    state.config = sharedStore.getDefaultConfig(state.results);
    persistConfig();
    renderConfigForm();
    renderStats();
    appendLog("后台配置已恢复默认值");
  });
  elements.saveResultBtn.addEventListener("click", saveResult);
  elements.newIssueBtn.addEventListener("click", startNewIssue);
  elements.issueInput.addEventListener("input", () => {
    state.autoIssueMode = false;
  });
  elements.dateInput.addEventListener("change", refreshAutoIssueValue);
  elements.clearFormBtn.addEventListener("click", () => {
    clearForm();
    appendLog("录入表单已清空");
  });
  elements.exportBtn.addEventListener("click", exportResults);
  elements.clearLogBtn.addEventListener("click", () => {
    elements.logConsole.textContent = "";
  });

  [elements.digit1, elements.digit2, elements.digit3].forEach((input) => {
    input.addEventListener("input", renderCalcPreview);
  });

  [elements.drawDigit1, elements.drawDigit2, elements.drawDigit3].forEach((input) => {
    input.addEventListener("input", renderDrawCalcPreview);
  });

  elements.resultTableBody.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    const action = target.dataset.action;
    const issue = target.dataset.issue;
    if (!action || !issue) return;
    if (action === "edit") editResult(issue);
    if (action === "delete") deleteResult(issue);
  });

  elements.importInput.addEventListener("change", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement) || !target.files?.length) return;
    importResults(target.files[0]);
    target.value = "";
  });
}

function init() {
  const sharedState = sharedStore.initializeStore();
  state.results = sharedState.results;
  state.config = sharedState.config;
  elements.dateInput.value = new Date().toISOString().slice(0, 10);
  renderProtocolNotice();
  renderConfigForm();
  renderStats();
  renderResultTable();
  renderCalcPreview();
  renderDrawCalcPreview();
  bindEvents();
  updateClock();
  window.setInterval(updateClock, 1000);
  appendLog("网页版后台已启动");
  loadFromCloud();
}

init();
