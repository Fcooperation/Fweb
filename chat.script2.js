// ================================  
// FCHAT RECEIVER & SYNC ENGINE  
// ================================  

if (!window.API_URL || !window.account || !window.chatWith) {
  console.warn("Chat core not loaded yet");
}

/**
 * Vibrate sequence for a single message:
 * - vibrate 200ms
 * - wait 200ms
 * - vibrate 200ms
 */
function vibrateMessageSequence(delayBefore = 0) {
  if (!navigator.vibrate) return;

  setTimeout(() => {
    navigator.vibrate([200, 200, 200]);
  }, delayBefore);
}

/**
 * Merge incoming backend messages into fchatMessages safely
 * Double vibration per message, staggered if multiple messages
 */
function mergeIncomingMessages(incoming) {
  if (!Array.isArray(incoming)) return;

  let changed = false;
  let newMessagesCount = 0;

  incoming.forEach((msg, index) => {
    const exists = fchatMessages.some(m => m.id === msg.id);
    if (!exists) {
      fchatMessages.push(msg);
      changed = true;
      newMessagesCount++;

      // Calculate delay for this message:
      // Each previous message adds 300ms delay
      const delay = index * 300;

      // Trigger double vibration for this message with delay
      vibrateMessageSequence(delay);
    }
  });

  if (changed) {
    const FCHAT_STORAGE_KEY = `fchat_${account.email}`;
    localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));
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