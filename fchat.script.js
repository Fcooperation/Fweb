document.addEventListener("DOMContentLoaded", () => {

  /* ----------------- ACCOUNT + GUEST CHECK ----------------- */
  const account = JSON.parse(localStorage.getItem("faccount")) || {};
  const isGuest = !account.username;

  window.IS_GUEST = isGuest;

  /* ----------------- UI ELEMENTS ----------------- */
  const mainUI = document.getElementById("main-ui");
  const loadingScreen = document.getElementById("loading-screen");

  if (loadingScreen) loadingScreen.style.display = "none";
  if (mainUI) mainUI.style.display = "flex";

  /* ----------------- CHAT USERS ----------------- */
  const chatUsers = account.chatUsers || [];

  const usersList = document.getElementById("users-list");
  const searchBar = document.getElementById("search-bar");

  /* ----------------- TOAST ----------------- */
  function showToast(message) {
    let toast = document.getElementById("toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
      toast.classList.remove("show");
    }, 2500);
  }

  /* ----------------- MENU ----------------- */
  const menuBtn = document.getElementById("menu-btn");
  const menuDropdown = document.getElementById("menu-dropdown");

  if (menuBtn && menuDropdown) {
    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      menuDropdown.classList.toggle("show");
    });

    document.addEventListener("click", () => {
      menuDropdown.classList.remove("show");
    });
  }

  /* ----------------- DISPLAY USERS ----------------- */
  function displayChats(users) {
    if (!usersList) return;

    usersList.innerHTML = "";

    if (!users.length) {
      usersList.innerHTML =
        "<p style='text-align:center;color:#777'>No users found</p>";
      return;
    }

    users.forEach(user => {
      const card = document.createElement("div");
      card.className = "fcard";

      const pfp = document.createElement("div");
      pfp.className = "pfp";

      if (user.profile_pic) {
        const img = document.createElement("img");
        img.src = user.profile_pic;
        img.style.width = "100%";
        img.style.height = "100%";
        img.style.borderRadius = "50%";
        pfp.appendChild(img);
      } else {
        pfp.textContent = user.username?.[0]?.toUpperCase() || "U";
      }

      const info = document.createElement("div");
      info.style.flex = "1";
      info.innerHTML = `<div class="username">${user.username || "Unknown"}</div>`;

      card.onclick = () => {
        localStorage.setItem("chatting_with", JSON.stringify(user));
        window.location.href = "chat.html";
      };

      card.appendChild(pfp);
      card.appendChild(info);

      usersList.appendChild(card);
    });
  }

  /* ----------------- SEARCH ----------------- */
  if (searchBar) {
    searchBar.addEventListener("input", function () {
      const query = this.value.toLowerCase().trim();

      if (!query) {
        displayChats(chatUsers);
        return;
      }

      const filtered = chatUsers.filter(user =>
        (user.username || "").toLowerCase().includes(query) ||
        (user.id || "").toLowerCase().includes(query)
      );

      displayChats(filtered);
    });
  }

  /* ----------------- ADD BUTTON (GUEST BLOCK) ----------------- */
  const addBtn = document.getElementById("add-btn");

  if (addBtn) {
    addBtn.addEventListener("click", (e) => {

      if (window.IS_GUEST) {
        e.preventDefault();
        showToast("Sign up first to access full chat experience");
        return;
      }

      window.location.href = "add.html";
    });
  }

  /* ----------------- INIT ----------------- */
  displayChats(chatUsers);

});