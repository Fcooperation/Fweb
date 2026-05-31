document.addEventListener("DOMContentLoaded", () => {

  const courses = document.querySelectorAll(".course");
  const search = document.getElementById("search");

  let openCourse = null;

  // ---------------- DROPDOWN TOGGLE ----------------
  courses.forEach(course => {

    course.addEventListener("click", (e) => {

      // ignore clicks on menu items
      if (e.target.classList.contains("item")) return;

      // close other open dropdown
      if (openCourse && openCourse !== course) {
        openCourse.classList.remove("active");
      }

      // toggle current
      course.classList.toggle("active");

      openCourse = course.classList.contains("active") ? course : null;
    });

  });

  // ---------------- SAVE SELECTED COURSE ----------------
  function setStudying(code, mode) {
    localStorage.setItem("studying", code);
    localStorage.setItem("study_mode", mode);
  }

  // ---------------- QUIZ ACTION ----------------
  function openQuiz(code) {
    setStudying(code, "quiz");
    window.location.href = "quiz.html";
  }

  // ---------------- TUTORIAL ACTION ----------------
  function openTutorial(code) {
    setStudying(code, "tutorials");
    window.location.href = "tutorials.html";
  }

  // expose globally (so HTML can call it safely if needed)
  window.openQuiz = openQuiz;
  window.openTutorial = openTutorial;

  // ---------------- CLICK HANDLERS FOR ITEMS ----------------
  document.querySelectorAll(".quiz").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openQuiz(btn.dataset.code);
    });
  });

  document.querySelectorAll(".tutorial").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      openTutorial(btn.dataset.code);
    });
  });

  // ---------------- SEARCH FILTER ----------------
  search.addEventListener("input", () => {

    const value = search.value.toLowerCase();

    courses.forEach(course => {

      const code = course.dataset.code.toLowerCase();

      if (code.includes(value)) {
        course.style.display = "block";
      } else {
        course.style.display = "none";
        course.classList.remove("active");
      }

    });

  });

});