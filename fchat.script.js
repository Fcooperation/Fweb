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
  
// =========================
// SORT USERS BY LATEST MESSAGE
// =========================

users.sort((a, b) => {

  const allMessages =
    JSON.parse(localStorage.getItem("fchat_messages")) || [];

  // messages for user A
  const aMessages = allMessages.filter(msg =>
    (
      String(msg.sender_id) === String(account.id) &&
      String(msg.receiver_id) === String(a.id)
    )
    ||
    (
      String(msg.sender_id) === String(a.id) &&
      String(msg.receiver_id) === String(account.id)
    )
  );

  // messages for user B
  const bMessages = allMessages.filter(msg =>
    (
      String(msg.sender_id) === String(account.id) &&
      String(msg.receiver_id) === String(b.id)
    )
    ||
    (
      String(msg.sender_id) === String(b.id) &&
      String(msg.receiver_id) === String(account.id)
    )
  );

  // latest timestamps
  const aLatest =
    aMessages.length
      ? new Date(
          aMessages[aMessages.length - 1].created_at
        ).getTime()
      : 0;

  const bLatest =
    bMessages.length
      ? new Date(
          bMessages[bMessages.length - 1].created_at
        ).getTime()
      : 0;

  // newest goes TOP
  return bLatest - aLatest;

});

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

// =========================
// GET MOST RECENT MESSAGE
// =========================

const allMessages =
  JSON.parse(localStorage.getItem("fchat_messages")) || [];

// messages involving THIS user
const userMessages = allMessages.filter(msg =>

  // YOU sent to this user
  (
    String(msg.sender_id) === String(account.id) &&
    String(msg.receiver_id) === String(user.id)
  )

  ||

  // THIS user sent to YOU
  (
    String(msg.sender_id) === String(user.id) &&
    String(msg.receiver_id) === String(account.id)
  )

);

// sort newest last
userMessages.sort(
  (a, b) =>
    new Date(a.created_at) -
    new Date(b.created_at)
);

// newest message
const latestMessage =
  userMessages[userMessages.length - 1];

let messageHTML = "";
let messageTime = "";

if (latestMessage) {

  const isYou =
    String(latestMessage.sender_id) === String(account.id);

  let text =
    latestMessage.message || "[Media]";

  if (text.length > 15) {
    text = text.slice(0, 15) + "...";
  }

  // format time
  const date = new Date(latestMessage.created_at);

  messageTime = date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });


  // =========================
  // YOUR MESSAGE
  // =========================

  if (isYou) {

    messageHTML = `
      <span style="
        color:#38bdf8;
        font-weight:bold;
      ">
        YOU:
      </span>

      <span style="
        color:black;
        font-weight:normal;
      ">
        ${text}
      </span>
    `;

  }

  // =========================
  // THEIR MESSAGE
  // =========================

  else {

    messageHTML = `
      <span style="
        color:#38bdf8;
        font-weight:bold;
      ">
        🔵 ${text}
      </span>
    `;
  }
}

// =========================
// USER INFO
// =========================

const info = document.createElement("div");

info.style.flex = "1";

info.innerHTML = `
  <div class="username">
    ${user.username || "Unknown"}
  </div>

  ${
    latestMessage
      ? `
      <div style="
        display:flex;
        justify-content:space-between;
        align-items:center;
        gap:10px;
        margin-top:2px;
        width:100%;
      ">

        <div style="
          overflow:hidden;
          text-overflow:ellipsis;
          white-space:nowrap;
          flex:1;
          font-size:14px;
        ">
          ${messageHTML}
        </div>

        <div style="
          color:black;
          font-style:italic;
          font-size:11px;
          white-space:nowrap;
        ">
          ${messageTime}
        </div>

      </div>
    `
      : ""
  }
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
// =========================
// SAVE BACKEND MESSAGES
// =========================

const newBackendMessages =
  data.messages || [];

// save to BOTH storages
localStorage.setItem(
  "fchat_messages",
  JSON.stringify(newBackendMessages)
);

localStorage.setItem(
  "messages",
  JSON.stringify(newBackendMessages)
);

    console.log("Backend response:", data);

    // backend sends:
    // { data: [...] }

    const freshUsers = data.data || [];
    // save backend messages offline
const backendMessages = data.messages || [];

localStorage.setItem(
  "fchat_messages",
  JSON.stringify(backendMessages)
);

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

/* ----------------- AUTO UPDATE LOOP ----------------- */

// every 2 seconds
setInterval(() => {

  updateChatsFromBackend();

}, 2000);