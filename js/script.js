console.log("✅ script.js connected");

// ====================== CONFIG ======================
const QUESTION_TIME = 20;

let quizState = null;
let selectedContent = null;
let timerId = null;
let timerValue = QUESTION_TIME;
let currentLevel = 0;
let currentIndex = 0;
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
  ui.questionCounter = $("questionCounter");
  ui.nextBtn = $("nextBtn");
  ui.quitBtn = $("quitBtn");

  ui.resultSummary = $("resultSummary");
  ui.retryBtn = $("retryBtn");
}

// ======================= INIT =======================
document.addEventListener("DOMContentLoaded", () => {
  console.log("✅ script.js loaded");
  initUI();
  ui.startBtn.onclick = handleStart;
  ui.retryBtn.onclick = resetToHome;
  ui.nextBtn.onclick = nextQuestion;
  ui.quitBtn.onclick = resetToHome;
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
  ui.startBtn.textContent = "Searching...";

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
  ui.startBtn.textContent = "Start";
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

  levels = [
    quizState.questionMap.beginner,
    quizState.questionMap.intermediate,
    quizState.questionMap.master
  ];

  quizState.score = 0;
  currentLevel = 0;
  currentIndex = 0;

  console.log("✅ LEVELS READY:", levels);
}

// ================= GAME FLOW ======================
function startGame() {
  ui.home.classList.add("hidden");
  ui.game.classList.remove("hidden");
  ui.result.classList.add("hidden");
  
  updateProgress();
  loadQuestion();
}

function loadQuestion() {
  if (!levels.length || currentLevel >= levels.length) {
    showResults();
    return;
  }

  if (currentIndex >= levels[currentLevel].length) {
    currentLevel++;
    currentIndex = 0;
    
    if (currentLevel >= levels.length) {
      showResults();
      return;
    }
  }

  const question = levels[currentLevel][currentIndex];
  
  // Validate question exists
  if (!question || !question.question) {
    console.error("❌ Invalid question at level", currentLevel, "index", currentIndex);
    currentIndex++;
    loadQuestion();
    return;
  }
  
  ui.questionText.innerText = question.question;
  ui.options.innerHTML = "";
  ui.nextBtn.disabled = true;

  // Validate options exist
  if (!question.options || !Array.isArray(question.options) || question.options.length === 0) {
    console.error("❌ No valid options for question");
    ui.options.innerHTML = '<p style="color: var(--danger);">Error loading question options</p>';
    ui.nextBtn.disabled = false;
    return;
  }

  // Create option buttons
  question.options.forEach(opt => {
    const btn = document.createElement("button");
    btn.className = "option-btn";
    btn.textContent = opt;

    btn.onclick = () => handleAnswer(btn, opt, question.answer);
    ui.options.appendChild(btn);
  });

  runTimer();
  updateProgress();
}

function handleAnswer(btn, selectedOption, correctAnswer) {
  clearInterval(timerId);
  
  // Disable all buttons
  const allBtns = ui.options.querySelectorAll(".option-btn");
  allBtns.forEach(b => b.disabled = true);

  // Check if answer is correct
  const isCorrect = selectedOption === correctAnswer;
  
  if (isCorrect) {
    btn.classList.add("correct");
    quizState.score += 10;
    ui.questionText.innerText = "✅ Correct!";
  } else {
    btn.classList.add("wrong");
    ui.questionText.innerText = `❌ Wrong! The correct answer was: ${correctAnswer}`;
    // Highlight correct answer
    allBtns.forEach(b => {
      if (b.textContent === correctAnswer) {
        b.classList.add("correct");
      }
    });
  }

  ui.score.innerText = `Score: ${quizState.score}`;
  
  // Auto-advance to next question after 2 seconds
  window.autoAdvanceTimeout = setTimeout(() => {
    nextQuestion();
  }, 2000);
}

function nextQuestion() {
  clearInterval(timerId);
  clearTimeout(window.autoAdvanceTimeout); // Clear any pending auto-advance
  currentIndex++;
  loadQuestion();
}

// ============= TIMER =====================
function runTimer() {
  clearInterval(timerId);
  timerValue = QUESTION_TIME;
  ui.timer.innerText = `${timerValue}s`;

  timerId = setInterval(() => {
    timerValue--;
    ui.timer.innerText = `${timerValue}s`;

    if (timerValue <= 0) {
      clearInterval(timerId);
      handleTimeout();
    }
  }, 1000);
}

function handleTimeout() {
  // Get current question to find correct answer
  const question = levels[currentLevel][currentIndex];
  
  // Disable all buttons
  const allBtns = ui.options.querySelectorAll(".option-btn");
  allBtns.forEach(b => {
    b.disabled = true;
    // Highlight the correct answer
    if (b.textContent === question.answer) {
      b.classList.add("correct");
    }
  });

  // Show timeout message
  ui.questionText.innerText = `⏰ Time's up! The correct answer was: ${question.answer}`;
  
  // Auto-advance to next question after 2 seconds
  window.autoAdvanceTimeout = setTimeout(() => {
    nextQuestion();
  }, 2000);
}

// ============= PROGRESSION ===============
function updateProgress() {
  const totalQuestions = levels.reduce((sum, level) => sum + level.length, 0);
  let completedQuestions = 0;
  
  for (let i = 0; i < currentLevel; i++) {
    completedQuestions += levels[i].length;
  }
  completedQuestions += currentIndex;

  const percentage = (completedQuestions / totalQuestions) * 100;
  ui.progress.style.width = `${percentage}%`;
  
  ui.questionCounter.innerText = `${completedQuestions} / ${totalQuestions}`;
  ui.score.innerText = `Score: ${quizState.score}`;
}

// ============= RESULTS ==================
function showResults() {
  clearInterval(timerId);
  
  ui.game.classList.add("hidden");
  ui.result.classList.remove("hidden");

  const totalQuestions = levels.reduce((sum, level) => sum + level.length, 0);
  const percentage = Math.round((quizState.score / (totalQuestions * 10)) * 100);

  ui.resultSummary.innerText = `
    Final Score: ${quizState.score} / ${totalQuestions * 10}
    Accuracy: ${percentage}%
  `;
}

// ============ RESET =============
function resetToHome() {
  clearInterval(timerId);

  quizState = null;
  selectedContent = null;
  levels = [];
  currentLevel = 0;
  currentIndex = 0;

  ui.result.classList.add("hidden");
  ui.game.classList.add("hidden");
  ui.home.classList.remove("hidden");

  ui.searchResults.innerHTML = "";
  ui.titleInput.value = "";
  ui.progress.style.width = "0%";
  ui.score.innerText = "Score: 0";
  ui.questionCounter.innerText = "0 / 0";
}
