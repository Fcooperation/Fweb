document.addEventListener("DOMContentLoaded", () => {

  const data = JSON.parse(localStorage.getItem("quizResult"));

  const circle = document.querySelector(".progress");
  const percentText = document.getElementById("percent-text");
  const gradeText = document.getElementById("grade-text");
  const scoreText = document.getElementById("score-text");
  const xpText = document.getElementById("xp-text");

  const toast = document.getElementById("xp-toast");
  const toastText = document.getElementById("xp-toast-text");
  const profileLink = document.getElementById("check-profile");

  // ---------------- NO RESULT ----------------
  if (!data) {
    gradeText.textContent = "No result found";
    return;
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