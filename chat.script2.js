// ================================  
// FCHAT RECEIVER & SYNC ENGINE — ONE-TIME FETCH  
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
 * Merge incoming backend messages into fchatMessages WITHOUT duplicate check  
 */
function mergeIncomingMessages(incoming) {
  if (!Array.isArray(incoming)) return;

  // Push all messages directly
  fchatMessages.push(...incoming);

  // Sort messages chronologically
  fchatMessages.sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

  // Save to localStorage
  localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));

  // Show visual confirmation
  showNewMessageIndicator(incoming.length);

  // 🔔 Small vibration
  if (navigator.vibrate) {
    navigator.vibrate(50); // vibrate for 50ms
  }

  // Render messages
  updateTimeline();
}

/**  
 * One-time fetch of all existing chat logs from backend  
 */
async function fetchAllChatLogsOnce() {
  if (!navigator.onLine) return;

  try {
    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "get_all_fchatlogs",
        id: account.id,
        chatwithid: chatWith.id
      })
    });

    const data = await res.json();
    if (!data || !Array.isArray(data.messages)) return;

    // Push everything into fchatMessages and render
    mergeIncomingMessages(data.messages);
  } catch (err) {
    console.warn("Fetch chat logs failed:", err);
  }
}

/**  
 * Instant fetch when user comes online  
 */
window.addEventListener("online", () => {
  fetchAllChatLogsOnce();
});

/**  
 * Initial one-time fetch on page load  
 */
fetchAllChatLogsOnce();