/* ----------------- LOAD OFFLINE CHAT USERS (CLEAN) ----------------- */

// get saved account ONLY
const account = JSON.parse(localStorage.getItem("faccount")) || {};

// ONLY source of offline users
const chatUsers = account.chatUsers || [];

// menu dropdown
const menuBtn = document.getElementById("menu-btn");
const menuDropdown = document.getElementById("menu-dropdown");

// toggle menu on click
menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.classList.toggle("show");
});

// close when clicking outside
document.addEventListener("click", () => {
  menuDropdown.classList.remove("show");
});

/* ----------------- DISPLAY CHAT USERS ----------------- */

function displayChats(users) {
  const box = document.getElementById("users-list");
  if (!box) return;

  box.innerHTML = "";

  if (!users.length) {
    box.innerHTML = "<p>No chat users found offline</p>";
    return;
  }

  users.forEach(user => {
    const card = document.createElement("div");
    card.className = "fcard";

    // PROFILE PIC
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

    // USER INFO
    const info = document.createElement("div");
    info.style.flex = "1";

    info.innerHTML = `
      <div class="username">
        ${user.username || "Unknown"}
      </div>
    `;

    // CLICK ACTION
    card.onclick = () => {
      localStorage.setItem("chatting_with", JSON.stringify(user));
      window.location.href = "chat.html";
    };

    card.appendChild(pfp);
    card.appendChild(info);

    box.appendChild(card);
  });
}

/* ----------------- LOAD OFFLINE ----------------- */

function loadOfflineChats() {
  displayChats(chatUsers);
  console.log("Offline chats loaded from faccount only");
}

/* ----------------- START ----------------- */

loadOfflineChats();