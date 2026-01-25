// ================================  
// FCHAT RECEIVER & SYNC ENGINE  
// ================================  

if (!window.API_URL || !window.account || !window.chatWith) {
  console.warn("Chat core not loaded yet");
}

/**
 * Merge incoming backend messages into fchatMessages safely
 * Vibrates for 5 seconds when new message arrives
 */
function mergeIncomingMessages(incoming) {
  if (!Array.isArray(incoming)) return;

  let changed = false;

  incoming.forEach(msg => {
    const exists = fchatMessages.some(m => m.id === msg.id);
    if (!exists) {
      fchatMessages.push(msg);
      changed = true;
    }
  });

  if (changed) {
    const FCHAT_STORAGE_KEY = `fchat_${account.email}`;
    localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));

    // 🔔 Vibrate for 5 seconds (5000ms)
    if (navigator.vibrate) {
      navigator.vibrate(5000);
    }

    updateTimeline();
  }
}

/**
 * Ask backend for chat logs
 * Optimistic: If request reaches backend → we treat it as success
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
 * Mark messages as delivered when they appear on screen
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
    const FCHAT_STORAGE_KEY = `fchat_${account.email}`;
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