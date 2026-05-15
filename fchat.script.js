/* ----------------- LOAD OFFLINE CHAT USERS ----------------- */

// get saved account
const account = JSON.parse(localStorage.getItem("faccount")) || {};

// chat users can be inside faccount OR fallback storage
const chatUsers =
  account.chatUsers ||
  JSON.parse(localStorage.getItem("fchat_users")) ||
  [];

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
    info.innerHTML = `
      <div class="username">${user.username || "Unknown"}</div>
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

/* ----------------- INIT (OFFLINE LOAD) ----------------- */

function loadOfflineChats() {
  displayChats(chatUsers);
}

// run immediately on page load
loadOfflineChats();