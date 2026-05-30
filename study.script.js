// SEARCH FUNCTION
const searchBar = document.getElementById("search-bar");
const cards = document.querySelectorAll(".uni-card");

// fake loading animation
const progressCircle = document.querySelector(".progress");
const loadingText = document.getElementById("loading-text");

let percent = 0;

// circle math (full circumference)
const radius = 40;
const circumference = 2 * Math.PI * radius;

progressCircle.style.strokeDasharray = `${circumference}`;
progressCircle.style.strokeDashoffset = `${circumference}`;

function setProgress(p) {
  const offset = circumference - (p / 100) * circumference;
  progressCircle.style.strokeDashoffset = offset;
  loadingText.textContent = `${p}%`;

  if (p === 100) {
    loadingText.textContent = "READY ✔";
  }
}

// animate loading
const loader = setInterval(() => {
  percent += 2;

  if (percent > 100) percent = 100;

  setProgress(percent);

  if (percent === 100) {
    clearInterval(loader);
  }

}, 50);

// SEARCH UNIVERSITIES
searchBar.addEventListener("input", function () {
  const query = this.value.toLowerCase().trim();

  cards.forEach(card => {
    const text = card.textContent.toLowerCase();

    if (text.includes(query)) {
      card.style.display = "block";
    } else {
      card.style.display = "none";
    }
  });
});