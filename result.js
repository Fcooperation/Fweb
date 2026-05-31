const resultData =
JSON.parse(
  localStorage.getItem(
    "quizResult"
  )
);
document.addEventListener("DOMContentLoaded", () => {

  const data = JSON.parse(localStorage.getItem("quizResult"));
  
  // XP already collected?
if (!data.received) {

  let account =
    JSON.parse(
      localStorage.getItem("faccount")
    ) || {};

  account.xp =
    (account.xp || 0) +
    data.xp;

  localStorage.setItem(
    "faccount",
    JSON.stringify(account)
  );

  data.received = true;

  localStorage.setItem(
    "quizResult",
    JSON.stringify(data)
  );

} else {

  showHistory();

  return;

}

let history =
JSON.parse(
  localStorage.getItem(
    "quizHistory"
  )
) || [];

const exists =
history.some(
  item => item.id === data.id
);

if (!exists) {

  history.unshift(data);

  localStorage.setItem(
    "quizHistory",
    JSON.stringify(history)
  );

}

  const circle = document.querySelector(".progress");
  const percentText = document.getElementById("percent-text");
  const gradeText = document.getElementById("grade-text");
  const scoreText = document.getElementById("score-text");
  const xpText = document.getElementById("xp-text");

  const toast = document.getElementById("xp-toast");
  const toastText = document.getElementById("xp-toast-text");
  const profileLink = document.getElementById("check-profile");
  
  const schoolName =
document.getElementById(
  "school-name"
);

const courseName =
document.getElementById(
  "course-name"
);

  // ---------------- NO RESULT ----------------
  if (!data) {
    gradeText.textContent = "No result found";
    return;
  }
  // show school and course 
  if (schoolName) {
  schoolName.textContent =
    data.school || "";
}

if (courseName) {
  courseName.textContent =
    data.course || "";
}

  const percent = Math.round((data.score / data.total) * 100);

  // ---------------- CIRCLE ----------------
  const radius = 60;
  const circumference = 2 * Math.PI * radius;

  if (circle) {
    circle.style.strokeDasharray = circumference;
    circle.style.strokeDashoffset = circumference;

    circle.getBoundingClientRect(); // force reflow

    setTimeout(() => {
      const offset = circumference - (percent / 100) * circumference;
      circle.style.strokeDashoffset = offset;
    }, 200);
  }

  // ---------------- TEXT ----------------
  if (percentText) {
    percentText.textContent = percent + "%";
  }

  let grade = "";
  if (percent === 100) grade = "Excellent";
  else if (percent >= 75) grade = "Good";
  else if (percent >= 50) grade = "Average";
  else if (percent >= 30) grade = "Poor";
  else grade = "Bad";

  if (gradeText) gradeText.textContent = grade;

  if (scoreText) {
    scoreText.textContent = `Score: ${data.score} / ${data.total}`;
  }

  if (xpText) {
    xpText.textContent = `XP Earned: ${data.xp}`;
  }

  // ---------------- XP TOAST ----------------
  if (toast && toastText) {
    toastText.textContent = `🎉 You earned ${data.xp} XP`;

    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 3000);
  }

  // ---------------- PROFILE LINK ----------------
  if (profileLink) {
    profileLink.textContent = "Check profile";
    profileLink.href = "fchatme.html";
  }

});

document
.getElementById("retake-btn")
.onclick = () => {

  window.location.href =
    "quiz.html";

};

document
.getElementById("view-explanations")
.onclick = () => {

  if (
    !resultData ||
    !resultData.review
  ) {
    alert("No explanations found");
    return;
  }

  window.location.href =
    "explanations.html";

};

function showHistory() {

  const history =
    JSON.parse(
      localStorage.getItem(
        "quizHistory"
      )
    ) || [];

  document.body.innerHTML = `
    <div id="history-page">

      <h2>
        Previous Results
      </h2>

      <div id="history-list"></div>

    </div>
  `;

  const list =
    document.getElementById(
      "history-list"
    );

  history.forEach(item => {

    const card =
      document.createElement("div");

    card.className =
      "history-card";

    card.innerHTML = `
      <h3>${item.course}</h3>

      <p>${item.percent}%</p>

      <small>${item.date}</small>
    `;

    card.onclick = () => {

      localStorage.setItem(
        "quizResult",
        JSON.stringify(item)
      );

      location.reload();

    };

    list.appendChild(card);

  });

}