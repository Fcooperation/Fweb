document.addEventListener("DOMContentLoaded", () => {

let count = 1;
let time = 60;

let questions = [];
let index = 0;
let answers = {};
let timerInterval;
let currentTime = time;

// ---------------- ELEMENTS ----------------
const countEl = document.getElementById("count");
const timeEl = document.getElementById("time");

const setupBox = document.getElementById("setup-box");
const loading = document.getElementById("loading");
const quizUI = document.getElementById("quiz-ui");

const studying = localStorage.getItem("studying");

// ---------------- SAFETY ----------------
if (!countEl || !timeEl) return;

// ---------------- QUESTION CONTROLS ----------------
document.getElementById("plus").onclick = () => {
  count++;
  countEl.textContent = count;
};

document.getElementById("minus").onclick = () => {
  if (count > 1) count--;
  countEl.textContent = count;
};

document.getElementById("max").onclick = () => {
  count = "all";
  countEl.textContent = "ALL";
};

// ---------------- TIME CONTROLS ----------------
document.getElementById("plus-time").onclick = () => {
  if (time < 3600) time += 60;
  updateTime();
};

document.getElementById("minus-time").onclick = () => {
  if (time > 60) time -= 60;
  updateTime();
};

function updateTime() {
  if (time >= 60) {
    timeEl.textContent = `${Math.floor(time / 60)} min`;
  } else {
    timeEl.textContent = `${time} sec`;
  }
}
updateTime();

// ---------------- START QUIZ ----------------
document.getElementById("start-btn").onclick = async () => {

  setupBox.style.opacity = "0.3";
  loading.classList.remove("hidden");

  const payload = {
    action: "get_quiz",
    course: studying,
    count
  };

  try {

    const res = await fetch("https://fweb-backend.onrender.com/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.error || "Failed");
      return;
    }

    questions = data.questions;
    if (!questions || questions.length === 0) {

  setupBox.style.display = "block";
  loading.classList.add("hidden");
  quizUI.classList.add("hidden");

  setupBox.innerHTML = `
    <h3 style="text-align:center; color:red;">
      No questions found
    </h3>
  `;

  return;
}

    questions = [...questions].sort(() => Math.random() - 0.5);
    setupBox.style.display = "none";
    loading.classList.add("hidden");

    quizUI.classList.remove("hidden");

    index = 0;
    answers = {};

    startTimer();
    loadQuestion();

  } catch (err) {
  console.error(err);

  alert("Failed to load quiz");

  // redirect immediately
  window.location.href = "study.html";

    setupBox.style.opacity = "1";
    loading.classList.add("hidden");
  }
};

// ---------------- LOAD QUESTION ----------------
function loadQuestion() {

  const q = questions[index];

  document.getElementById("q-number").innerHTML =
  `<span style="
    font-weight: 900;
    font-size: 18px;
    color: #1d9bf0;
  ">Question ${index + 1}</span>`;

  document.getElementById("q-text").innerHTML = `
  <div class="question-text">${q.question}</div>
`;

  const optionsBox = document.getElementById("options");
  optionsBox.innerHTML = "";

  const shuffled = [...q.options].sort(() => Math.random() - 0.5);

  shuffled.forEach(opt => {

    const div = document.createElement("div");
    div.className = "option";

    div.innerHTML = `
  <span class="option-text">${opt}</span>
  <div class="circle"></div>
`;

    if (answers[q.id] === opt) {
      div.classList.add("selected");
    }

    div.onclick = () => {

      answers[q.id] = opt;

      document.querySelectorAll(".option")
        .forEach(o => o.classList.remove("selected"));

      div.classList.add("selected");
    };

    optionsBox.appendChild(div);
  });
  const nextBtn = document.getElementById("next");

if (index >= questions.length - 1) {
  nextBtn.style.display = "none";
} else {
  nextBtn.style.display = "block";
}
const prevBtn = document.getElementById("prev");

if (index <= 0) {
  prevBtn.style.opacity = "0.4";
} else {
  prevBtn.style.opacity = "1";
}
}

// ---------------- NAV ----------------
document.getElementById("next").onclick = () => {
  if (index < questions.length - 1) {
    index++;
    loadQuestion();
  }
};

document.getElementById("prev").onclick = () => {
  if (index > 0) {
    index--;
    loadQuestion();
  }
};

// ---------------- TIMER ----------------
function startTimer() {

  currentTime = time;
  const timerEl = document.getElementById("timer");

  timerInterval = setInterval(() => {

    currentTime--;

    if (currentTime <= 10) {
      timerEl.classList.add("red");
    }

    timerEl.textContent = currentTime;

    if (currentTime <= 0) {
      clearInterval(timerInterval);
      submitQuiz();
    }

  }, 1000);
}

// ---------------- SUBMIT ----------------
document.getElementById("submit-btn").onclick = submitQuiz;

function submitQuiz() {

  clearInterval(timerInterval);

  let score = 0;
  let xpEarned = 0;

  questions.forEach(q => {

    const userAnswer = answers[q.id];

    if (userAnswer === q.answer) {
      score++;

      // ✅ use backend XP per question
      xpEarned += q.xp_reward || 10;
    }
  });

  const percent = Math.round((score / questions.length) * 100);

// ---------------- REVIEW DATA ----------------
const review = [];

questions.forEach(q => {

  const userAnswer = answers[q.id] || null;

  review.push({
    question: q.question,
    options: q.options,
    correct: q.answer,
    selected: userAnswer,
    explanation: q.explanation
  });

});

// ---------------- SAVE RESULT ----------------

const result = {

  id: "R" + Date.now(),

  school: "EBSU",

  course: studying
    ? studying.replace("(quiz)", "")
              .replace("(tutorials)", "")
              .trim()
    : "",

  score,
  total: questions.length,
  xp: xpEarned,
  percent,

  date: new Date().toLocaleString(),

  received: false,
viewed: false,

  review

};

// current result
localStorage.setItem(
  "quizResult",
  JSON.stringify(result)
);

// save to history
const history =
  JSON.parse(
    localStorage.getItem("quizHistory")
  ) || [];

history.unshift(result);

localStorage.setItem(
  "quizHistory",
  JSON.stringify(history)
);

window.location.href = "result.html";
}

});