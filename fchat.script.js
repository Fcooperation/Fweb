const API_URL = "https://fweb-backend.onrender.com/fchat";

// Load account from localStorage
let account = JSON.parse(localStorage.getItem("faccount")) || { email:"", password:"" };
const EMAIL = account.email;
const PASSWORD = account.password;

// Load previous fchatters from localStorage immediately
const savedChats = JSON.parse(localStorage.getItem("fchat_users")) || [];

if (savedChats.length > 0) displayChats(savedChats);
if(savedChats.length > 0) displayChats(savedChats);

/* ----------------- LOADING SEQUENCE ----------------- */
async function runLoadingSequence(){
  const logs = ["Starting...", "Preparing modules...", "Checking storage...", "Loading chats...", "Finalizing..."];
  const logBox = document.getElementById("loading-logs");
  for(let i=0;i<logs.length;i++){
    logBox.textContent = logs[i];
    await new Promise(r=>setTimeout(r,600));
  }
  showMainUI();

  // Fetch online only
  if(navigator.onLine){
    try{
      await callBackend("get_all_users");
      await fetchAndRenderFchatters();
    }catch(e){ console.warn("Offline or server error, using cached data."); }
  }
}

/* ----------------- SHOW MAIN UI ----------------- */
function showMainUI(){
  document.getElementById("loading-screen").style.display="none";
  document.getElementById("main-ui").style.display="flex";
}

/* ----------------- CALL BACKEND ----------------- */
async function callBackend(action, body={}){
  const payload = { action, email: EMAIL, password: PASSWORD, ...body };
  try{
    const res = await fetch(API_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if(action==="get_all_users" && data.data) localStorage.setItem("all_users", JSON.stringify(data.data));
    return data;
  }catch(e){
    console.warn("Backend call failed:", e);
    return {data:[]};
  }
}

/* ----------------- FETCH AND RENDER FCHATTERS ----------------- */
async function fetchAndRenderFchatters(){
  document.getElementById("update-log").textContent =
  navigator.onLine ? "Updating..." : "Offline mode";
  if(!navigator.onLine) return; // skip if offline
  try{
    const data = await callBackend("get_all_fchatters");

if (data.data) {
  const accountData = JSON.parse(localStorage.getItem("faccount")) || {};

  const chatUsers = data.data.chatUsers || data.data;
localStorage.setItem("fchat_users", JSON.stringify(chatUsers));

displayChats(chatUsers);

  displayChats(accountData.chatUsers);
}
  }catch(e){ console.warn("Fetch fchatters failed:", e); }
  document.getElementById("update-log").textContent="Updated";
}

/* ----------------- DISPLAY FCARDS ----------------- */
function displayChats(chats){
  const box = document.getElementById("users-list");
  box.innerHTML="";
  chats.forEach(user=>{
    const card = document.createElement("div");
    card.className="fcard";

    const pfp = document.createElement("div");
    pfp.className="pfp";

    if(user.profile_pic){
      const img = document.createElement("img");
      img.src = user.profile_pic;
      img.style.width="100%";
      img.style.height="100%";
      img.style.borderRadius="50%";
      pfp.appendChild(img);
      img.onclick = e => { 
        e.stopPropagation(); // stop card click
        document.getElementById("profile-modal").style.display="flex";
        document.getElementById("modal-img").src=user.profile_pic;
      };
    }else{
      pfp.textContent=user.username?.[0]?.toUpperCase()||"U";
    }

const messages = JSON.parse(localStorage.getItem("fchat_messages")) || [];

let lastMsg = "";
let showPreview = false;

// get messages for THIS user
const userMessages = messages.filter(m => 
  String(m.sender_id) === String(user.id) ||
  String(m.receiver_id) === String(user.id)
);

if (userMessages.length > 0) {
  const msg = userMessages[userMessages.length - 1];

  const isFromThem = String(msg.sender_id) === String(user.id);

if (isFromThem && msg.status !== "seen") {
    lastMsg = msg.message || "[Media]";
    showPreview = true;
  }
}
const info = document.createElement("div");
info.innerHTML = `
  <div class="username">${user.username}</div>
  ${
    showPreview
      ? `<div class="last-msg unread">🔵 ${lastMsg}</div>`
      : ""
  }
`;
    card.appendChild(pfp);
    card.appendChild(info);

    // ---------- UPDATED ONCLICK ----------
    card.onclick = ()=>{ 
      removeRedDot();

  // mark messages as seen locally for this user
  let messages = JSON.parse(localStorage.getItem("fchat_messages")) || [];

  messages = messages.map(msg => {
  const isFromThisUser =
    String(msg.sender_id) === String(user.id) &&
    String(msg.receiver_id) === String(account.id);

  if (isFromThisUser) {
    return { ...msg, status: "seen" };
  }

  return msg;
});

  localStorage.setItem("fchat_messages", JSON.stringify(messages));

  const chatTarget = {
    id: user.id,
    username: user.username || "",
    profile_pic: user.profile_pic || "",
    status: user.status || ""
  };
  
  const chats = JSON.parse(localStorage.getItem("fchat_users")) || [];
displayChats(chats);

  localStorage.setItem("chatting_with", JSON.stringify(chatTarget));
  window.location.href="chat.html";
};

    box.appendChild(card);
  });
}

/* ----------------- SEARCH ----------------- */
document.getElementById("search-bar").addEventListener("input", function(){
  const term = this.value.toLowerCase();
  const chats = JSON.parse(localStorage.getItem("fchat_users")) || [];
  const filtered = chats.filter(u=>u.username.toLowerCase().includes(term));
  displayChats(filtered);
});

/* ----------------- MODAL ----------------- */
document.getElementById("profile-modal").onclick = ()=>{
  document.getElementById("profile-modal").style.display="none";
};

// load fchatters first 
function loadCachedChatsFirst() {
  const cached = JSON.parse(localStorage.getItem("fchat_messages")) || [];

  if (cached.length > 0) {
    displayChats(cached); // 👈 INSTANT UI LOAD
  }
}
/* ----------------- START ----------------- */
// 1. LOAD CACHE FIRST (NO NETWORK)
loadCachedChatsFirst();

// 2. THEN TRY BACKGROUND UPDATE
if (navigator.onLine) {
  fetchAndRenderFchatters();
}

// 3. KEEP REFRESH LOOP (BUT NON-BLOCKING)
setInterval(() => {
  if (navigator.onLine) {
    fetchAndRenderFchatters();
  }
}, 5000);

// ----------------- THREE DOTS MENU -----------------
const menuBtn = document.getElementById("menu-btn");
const menuDropdown = document.getElementById("menu-dropdown");

menuBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  menuDropdown.style.display = menuDropdown.style.display === "flex" ? "none" : "flex";
});

// Hide menu if clicking outside
document.addEventListener("click", () => {
  menuDropdown.style.display = "none";
});
let lastMessageCount = 0;

// create red dot
function showRedDot() {
  let nav = document.querySelector(".nav-item.active");
  if (!nav) return;

  // avoid duplicates
  if (document.getElementById("fchat-dot")) return;

  const dot = document.createElement("span");
  dot.id = "fchat-dot";
  dot.style.width = "8px";
  dot.style.height = "8px";
  dot.style.background = "red";
  dot.style.borderRadius = "50%";
  dot.style.display = "inline-block";
  dot.style.marginLeft = "6px";

  nav.appendChild(dot);
}

// remove red dot
function removeRedDot() {
  const dot = document.getElementById("fchat-dot");
  if (dot) dot.remove();
}

// Sync Fchat logs 
async function syncFchatLogs() {
  if (!navigator.onLine) return;

  const account = JSON.parse(localStorage.getItem("faccount")) || {};
  if (!account.id) return;

  try {
    const res = await fetch("https://fweb-backend.onrender.com/fchat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_all_fchatlogs",
        id: account.id,
        last_seen: new Date().toISOString()
      })
    });

    const data = await res.json();
    if (!data || data.error) return;

    const newMessages = data.messages || [];
let localMessages = JSON.parse(localStorage.getItem("fchat_messages")) || [];

// merge messages
const merged = newMessages.map(newMsg => {
  const local = localMessages.find(m => String(m.id) === String(newMsg.id));

  return {
    ...newMsg,
    status: local?.status || newMsg.status // keep seen if already marked
  };
});

// save merged
localStorage.setItem("fchat_messages", JSON.stringify(merged));
    
    const chats = JSON.parse(localStorage.getItem("fchat_users")) || [];
displayChats(chats);

// CHECK NEW MESSAGES  
const currentMessages = merged;

if (currentMessages.length > lastMessageCount) {  
  document.getElementById("update-log").textContent = "New messages found";  
  showRedDot();  
} else {  
  document.getElementById("update-log").textContent = "Updated";  
}  

lastMessageCount = currentMessages.length;

  } catch (err) {
    console.log("Sync failed:", err);
  }
}

// initial load count
const cached = JSON.parse(localStorage.getItem("fchat_messages")) || [];
lastMessageCount = cached.length;

// run immediately
syncFchatLogs();

// repeat every 2 seconds
setInterval(syncFchatLogs, 2000);