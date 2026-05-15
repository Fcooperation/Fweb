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

/* ----------------- LOAD OFFLINE FIRST ----------------- */

function loadOfflineChats() {

  // instant offline render
  displayChats(chatUsers);

  console.log("Offline chats loaded");
}

/* ----------------- FETCH ONLINE UPDATE ----------------- */

async function updateChatsFromBackend() {

  // skip if offline
  if (!navigator.onLine) {
    console.log("Offline mode");
    return;
  }

  try {

    const res = await fetch("https://fweb-backend.onrender.com/fchat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
  action: "get_all_fchatters",
  email: account.email,
  password: account.password,
  id: account.id
})
    });

    const data = await res.json();

    console.log("Backend response:", data);

    // backend sends:
    // { data: [...] }

    const freshUsers = data.data || [];

    // SAVE SEPARATE CACHE
    localStorage.setItem(
      "fchat_users",
      JSON.stringify(freshUsers)
    );

    // UPDATE faccount.chatUsers
    const updatedAccount =
      JSON.parse(localStorage.getItem("faccount")) || {};

    updatedAccount.chatUsers = freshUsers;

    localStorage.setItem(
      "faccount",
      JSON.stringify(updatedAccount)
    );

    // UPDATE UI
    displayChats(freshUsers);

    console.log("Chats updated from backend");

  } catch (err) {

    console.error("Update failed:", err);

  }
}

/* ----------------- START ----------------- */

// 1. LOAD OFFLINE INSTANTLY
loadOfflineChats();

// 2. THEN UPDATE FROM BACKEND
updateChatsFromBackend();