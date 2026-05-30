document.addEventListener("DOMContentLoaded", () => {

  // ---------------- SEARCH TOGGLE ----------------
  const searchBtn = document.getElementById("search-btn");
  const searchContainer = document.getElementById("search-container");

  if (searchBtn && searchContainer) {
    searchBtn.addEventListener("click", () => {
      searchContainer.classList.toggle("hidden");
    });
  }


  // ---------------- PROFILE IMAGE LOAD ----------------
  const account = JSON.parse(localStorage.getItem("faccount")) || {};

  const statusImg = document.getElementById("status-img");

  if (statusImg) {
    statusImg.src = account.profile_pic || "default.jpg";
  }

});