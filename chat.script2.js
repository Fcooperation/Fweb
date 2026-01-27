// ================================
// FCHAT RECEIVER & SYNC ENGINE
// ================================

if (!window.API_URL || !window.account || !window.chatWith) {
  console.warn("Chat core not loaded yet");
}

const FCHAT_STORAGE_KEY = `fchat_${account.email}`;
const indicator = document.getElementById("newMessagesIndicator");

/**
 * Set indicator to idle state
 */
function setNoNewMessages() {
  if (!indicator) return;
  indicator.textContent = "No new messages";
  indicator.classList.add("idle");
  indicator.classList.remove("show");
}

/**
 * Show new messages count
 */
function showNewMessageIndicator(count) {
  if (!indicator) return;

  indicator.textContent = `📩 ${count} new message${count > 1 ? "s" : ""}`;
  indicator.classList.remove("idle");
  indicator.classList.add("show");

  // after 3 seconds, go back to idle
  setTimeout(() => {
    setNoNewMessages();
  }, 3000);
}

/**
 * Merge incoming backend messages into fchatMessages safely
 */
function mergeIncomingMessages(incoming) {
  if (!Array.isArray(incoming)) return;

  let newCount = 0;

  incoming.forEach(msg => {
    const exists = fchatMessages.some(m => m.id === msg.id);
    if (!exists) {
      // 🔥 Rewrite receiver_id to be the current account
      if (msg.receiver_id !== account.id) {
        msg.receiver_id = account.id;
      }

      fchatMessages.push(msg);
      newCount++;
    }
  });

  if (newCount > 0) {
    // sort messages chronologically
    fchatMessages.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

    // save to localStorage
    localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));

    // show visual confirmation
    showNewMessageIndicator(newCount);

    // render messages
    updateTimeline();
  }
}

/**
 * Ask backend for chat logs
 */
function fetchChatLogs() {
  if (!navigator.onLine) return;

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action: "get_all_fchatlogs",
      id: account.id,
      chatwithid: chatWith.id
    })
  })
    .then(res => res.json())
    .then(data => {
      if (!data || !Array.isArray(data.messages)) return;
      mergeIncomingMessages(data.messages);
    })
    .catch(err => {
      console.warn("Fetch chat logs failed:", err);
    });
}

/**
 * Mark messages as delivered
 */
function markIncomingDelivered() {
  let changed = false;

  fchatMessages.forEach(m => {
    if (
      m.receiver_id === account.id &&
      m.sender_id === chatWith.id &&
      m.status !== "seen" &&
      m.status !== "delivered"
    ) {
      m.status = "delivered";
      changed = true;
    }
  });

  if (changed) {
    localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));
    updateTimeline();
  }
}

/**
 * Poll backend every 4 seconds
 */
setInterval(() => {
  fetchChatLogs();
  markIncomingDelivered();
}, 4000);

/**
 * Instant fetch when user comes online
 */
window.addEventListener("online", () => {
  fetchChatLogs();
});

/**
 * Initial fetch on page load
 */
fetchChatLogs();