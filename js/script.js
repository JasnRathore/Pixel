console.log("✅ script.js connected");

// ====================== CONFIG ======================
const QUESTION_TIME = 20;

let quizState = null;
let selectedContent = null;
let timerId = null;
let timerValue = QUESTION_TIME;
let currentLevel = 0;
let currentIndex = 0;
let currentStep = 0; // 0 = classic, 1 = legend, 2 = rapid
let levels = [];

const ui = {};

// ====================== UI =========================
function $(id) {
  return document.getElementById(id);
}

function initUI() {
  ui.home = $("homeScreen");
  ui.game = $("gameScreen");
  ui.result = $("resultScreen");

  ui.startBtn = $("startBtn");
  ui.titleInput = $("titleInput");
  ui.searchResults = $("searchResults");

  ui.poster = $("poster");
  ui.title = $("title");
  ui.genre = $("genre");
  ui.year = $("year");
  ui.overview = $("overview");

  ui.questionText = $("questionText");
  ui.options = $("options");
  ui.timer = $("timer");
  ui.score = $("scoreDisplay");
  ui.progress = $("progressBar");

  ui.resultSummary = $("resultSummary");
  ui.badgeDisplay = $("badgeDisplay");
  ui.retryBtn = $("retryBtn");
}

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js loaded");
  initUI();
  ui.startBtn.onclick = handleStart;
  ui.retryBtn.onclick = resetToHome;
});

// ===================== SEARCH =======================
let isSearching = false;

async function handleStart() {
  if (isSearching) return;

  const query = ui.titleInput.value.trim();
  if (!query) {
    alert("Enter a title.");
    return;
  }

  isSearching = true;
  ui.startBtn.disabled = true;

  try {
    const res = await fetch(`/api/search?query=${encodeURIComponent(query)}`);
    const results = await res.json();
    renderSearchResults(results);
  } catch (err) {
    console.error("❌ Search error:", err.message);
    alert("Search failed");
  }

  isSearching = false;
  ui.startBtn.disabled = false;
}

function renderSearchResults(results = []) {
  ui.searchResults.innerHTML = "";

  if (!results.length) {
    ui.searchResults.innerHTML = "<p>No results found.</p>";
    return;
  }

  results.forEach(item => {
    const card = document.createElement("div");
    card.className = "result-card";

    card.innerHTML = `
      <img src="${item.poster || ""}">
      <div>
        <h4>${item.title}</h4>
        <small>${item.mediaType} | ${item.source}</small>
      </div>
    `;

    card.onclick = () => selectItem(item);
    ui.searchResults.appendChild(card);
  });
}

// ================== SELECT ========================
async function selectItem(item) {
  try {
    const res = await fetch(`/api/details?id=${item.id}&source=${item.source}&type=${item.mediaType}`);
    selectedContent = await res.json();

    updateMeta(selectedContent);

    await prepareQuiz();
    startGame();

  } catch (err) {
    console.error("❌ Item load error:", err.message);
    alert("Failed to load content.");
  }
}

// ================== META ==========================
function updateMeta(data = {}) {
  ui.poster.src = data.poster || "";
  ui.title.innerText = data.title || "";
  ui.genre.innerText = data.genre || "";
  ui.year.innerText = data.year || "";
  ui.overview.innerText = data.overview || "";
}

// ================= QUIZ FETCH ======================
async function prepareQuiz() {
  const res = await fetch(`/api/quiz`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(selectedContent)
  });

  quizState = await res.json();

  if (!quizState || !quizState.questionMap) {
    console.error("❌ Bad quiz data:", quizState);
    alert("Quiz generation failed");
    return;
  }

  // ✅ FIX: Use questionMap, not levels
  levels = [
    quizState.questionMap.beginner,
    quizState.questionMap.intermediate,
    quizState.questionMap.master
  ];

  quizState.score = 0;
  currentLevel = 0;
  currentIndex = 0;
  currentStep = 0;

  console.log("✅ LEVELS READY:", levels);
}

// ================= GAME FLOW ======================
function startGame() {
  ui.home.classList.add("hidden");
  ui.game.classList.remove("hidden");
  loadNext();
}

function loadNext() {
  if (!levels.length || currentLevel >= levels.length) {
    showResults();
    return;
  }

  if (currentStep === 0) loadClassic();
  else if (currentStep === 1) loadLegend();
  else if (currentStep === 2) loadRapid();
}

// =============== CLASSIC ===================
function loadClassic() {
  const question = levels[currentLevel][currentIndex];

  ui.questionText.innerText = question.question;
  ui.options.innerHTML = "";

  question.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.innerText = opt;

    btn.onclick = () => {
      if (opt === question.answer) quizState.score += 10;
      nextStep();
    };

    ui.options.appendChild(btn);
  });

  runTimer();
}

// =============== LEGEND ====================
function loadLegend() {
  const hint =
    selectedContent.genre ||
    selectedContent.overview?.slice(0, 100) ||
    "Famous pop culture title";

  ui.questionText.innerText = `LEGEND MODE: Guess from this clue — ${hint}`;

  ui.options.innerHTML = `
    <input id="legendInput" placeholder="Enter guess">
    <button id="legendBtn">Submit</button>
  `;

  $("legendBtn").onclick = () => {
    const guess = $("legendInput").value.trim().toLowerCase();
    const answer = selectedContent.title.toLowerCase().trim();

    if (guess === answer || guess.includes(answer) || answer.includes(guess)) {
      quizState.score += 20;
    }

    nextStep();
  };

  runTimer();
}

// ============ RAPID ==================
function loadRapid() {
  const question = levels[currentLevel][currentIndex];

  ui.questionText.innerText = "RAPID MODE:\n" + question.question;
  ui.options.innerHTML = "";

  question.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.textContent = opt;

    btn.onclick = () => {
      if (opt === question.answer) quizState.score += 5;
      nextStep();
    };

    ui.options.appendChild(btn);
  });

  runTimer();
}

// ============= TIMER =====================
function runTimer() {
  clearInterval(timerId);
  timerValue = QUESTION_TIME;
  ui.timer.innerText = timerValue;

  timerId = setInterval(() => {
    timerValue--;
    ui.timer.innerText = timerValue;

    if (timerValue <= 0) {
      clearInterval(timerId);
      nextStep();
    }
  }, 1000);
}

// ============= PROGRESSION ===============
function nextStep() {
  clearInterval(timerId);

  currentStep++;

  if (currentStep > 2) {
    currentStep = 0;
    currentIndex++;
  }

  if (currentIndex >= levels[currentLevel].length) {
    currentIndex = 0;
    currentLevel++;
  }

  updateProgress();
  loadNext();
}

function updateProgress() {
  const total = 9; // 3 levels × 3 questions
  const done = currentLevel * 3 + currentIndex;

  ui.progress.style.width = `${(done / total) * 100}%`;
  ui.score.innerText = `Score: ${quizState.score}`;
}

// ============= RESULTS ==================
function showResults() {
  ui.game.classList.add("hidden");
  ui.result.classList.remove("hidden");

  ui.resultSummary.innerText = `Final Score: ${quizState.score}`;
  ui.badgeDisplay.innerHTML = `<h2>🔥 Completed!</h2>`;
}

// ============ RESET =============
function resetToHome() {
  clearInterval(timerId);

  quizState = null;
  selectedContent = null;
  levels = [];
  currentLevel = 0;
  currentIndex = 0;
  currentStep = 0;

  ui.result.classList.add("hidden");
  ui.game.classList.add("hidden");
  ui.home.classList.remove("hidden");

  ui.searchResults.innerHTML = "";
  ui.titleInput.value = "";
  ui.progress.style.width = "0%";
}

