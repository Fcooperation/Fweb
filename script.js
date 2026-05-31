const menuBtn = document.getElementById("menuBtn");
const dropdown = document.getElementById("dropdown");

menuBtn.addEventListener("click", () => {
  if (dropdown.style.display === "flex") {
    dropdown.style.display = "none";
  } else {
    dropdown.style.display = "flex";
  }
});

// close menu when clicking outside
document.addEventListener("click", (e) => {
  if (!menuBtn.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.style.display = "none";
  }
});