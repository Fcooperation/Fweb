// ===== Unified Poll Retry Handler =====
function retryAllPolls() {
  const POLL_STORAGE_KEY = `polls_${account.email}_${chatWith.id}`;
  let polls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];
  let changed = false;

  // ===== OFFLINE HANDLING =====
  if (!navigator.onLine) {
    // Any poll stuck at "sending" → downgrade to "pending"
    polls = polls.map(p => {
      if (p.status === "sending") {
        changed = true;
        return { ...p, status: "pending" };
      }
      return p;
    });

    if (changed) {
      localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(polls));
      updateTimeline(); // refresh UI so buttons reflect "Pending"
    }
    return; // exit, no sending while offline
  }

  // ===== ONLINE HANDLING =====
  polls.forEach(p => {
    if (!["pending", "sending"].includes(p.status)) return;

    // mark as sending
    p.status = "sending";
    changed = true;

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_votes",
        poll_id: p.id,
        sender_id: p.sender_id || account.id,
        receiver_id: p.receiver_id || chatWith.id,
        options: p.voted_options
      })
    })
    .then(res => {
      if (res.ok) {
        p.status = "sent"; // successfully sent
      } else {
        p.status = "pending"; // backend rejected
      }
    })
    .catch(() => {
      p.status = "pending"; // network failed, mark pending
    })
    .finally(() => {
      localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(polls));
      updateTimeline(); // refresh UI states for buttons
    });
  });

  // Save and refresh UI if anything changed
  if (changed) {
    localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(polls));
    updateTimeline();
  }
}
// Read more, Read less logic
function applyReadMore(container, fullText) {
  const lines = fullText.split("\n");
  const MAX_LINES = 15;
  const STEP = 30;

  if (lines.length <= MAX_LINES) {
    container.innerHTML = fullText.replace(/\n/g, "<br>");
    return;
  }

  let visibleLines = MAX_LINES;

  function render() {
    const shown = lines.slice(0, visibleLines).join("<br>");
    container.innerHTML = shown;

    const toggle = document.createElement("span");
    toggle.className = "read-toggle";

    if (visibleLines < lines.length) {
      toggle.textContent = " Read more";
      toggle.onclick = () => {
        visibleLines = Math.min(visibleLines + STEP, lines.length);
        render();
      };
    } else {
      toggle.textContent = " Read less";
      toggle.onclick = () => {
        visibleLines = MAX_LINES;
        render();
      };
    }

    container.appendChild(toggle);
  }

  render();
}
// Sync messages
function syncToFChat(msgObj=null) {
  if(msgObj && !fchatMessages.some(fm => fm.id === msgObj.id)) fchatMessages.push(msgObj);
  else messages.forEach(m => { if(!fchatMessages.some(fm=>fm.id===m.id)) fchatMessages.push(m); });

  fchatMessages.sort((a,b) => new Date(a.sent_at)-new Date(b.sent_at));
  localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));
  updateTimeline();
}

// Sync polls
function syncPolls() {
  const POLL_STORAGE_KEY = `polls_${account.email}_${chatWith.id}`;
  const polls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];

  polls.forEach(p => {
    if(!fchatMessages.some(fm => fm.id===p.id)) {
      fchatMessages.push({
  id: p.id,
  type: "sent",
  isPoll: true,
  pollData: p.pollData,
  status: p.status,
  sender_id: p.sender_id,
  receiver_id: p.receiver_id || chatWith.id,
  sent_at: p.sent_at || new Date().toISOString() // ensure valid date
});
    }
  });

  fchatMessages.sort((a,b)=>new Date(a.sent_at)-new Date(b.sent_at));
  localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));
}

// Send message
async function sendToBackend(msgObj) {
  try {
    const payload = {
      action: "send_messages",
      email: account.email,
      id: msgObj.id,
      sender_id: account.id,
      receiver_id: chatWith.id,
      linked: msgObj.linked,
      linked_message_id: msgObj.linked_message_id,
      sent_at: msgObj.sent_at,
      text: msgObj.text
    };

    const res = await fetch(API_URL, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify(payload)
    });

    const data = await res.json();
    msgObj.status = data.success ? "sent" : "pending";
  } catch(e) {
    msgObj.status = "pending";
    console.warn("Failed to send", e);
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  syncToFChat(msgObj);
}

let replyingMessage = null;

function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;

  const msgObj = {
    id: Date.now(),
    type: "sent",
    text,
    sent_at: new Date().toISOString(),
    status: navigator.onLine ? "sending" : "pending",
    sending_since: navigator.onLine ? Date.now() : null,
    replyTo: replyingMessage
      ? {
          id: replyingMessage.id,
          text:
            replyingMessage.text?.slice(0, 120) +
            (replyingMessage.text?.length > 120 ? "…" : ""),
          sender: replyingMessage.sender_id
        }
      : null,
    linked: replyingMessage ? true : false, // yes/no field
    linked_message_id: replyingMessage ? replyingMessage.id : null,
    sender_id: account.id,
    receiver_id: chatWith.id
  };

  messages.push(msgObj);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  syncToFChat(msgObj);

  input.value = "";
  input.style.height = "auto";
  replyingMessage = null;

  if (navigator.onLine) sendToBackend(msgObj);

  // hide reply preview
  document.getElementById("reply-preview").style.display = "none";
}

document.getElementById("sendBtn").onclick = sendMessage;

function goBack(){ window.location.href="fchat.html"; }

let startX = 0;
let currentMessage = null;
function enableSwipe(messageEl, msgObj) {
  let startX = 0;

  messageEl.addEventListener("touchstart", e => {
    if (selectionMode) return; // 🚫 ignore swipe if selecting
    startX = e.touches[0].clientX;
  });

  messageEl.addEventListener("touchmove", e => {
    if (selectionMode) return; // 🚫 ignore swipe
    const diff = e.touches[0].clientX - startX;
    if (diff > 40) messageEl.style.transform = "translateX(25px)";
  });

  messageEl.addEventListener("touchend", e => {
    if (selectionMode) return; // 🚫 ignore swipe
    const diff = e.changedTouches[0].clientX - startX;
    if (diff > 60) showReplyPreview(msgObj); // pass full object
    messageEl.style.transform = "translateX(0)";
  });
}


function showReplyPreview(msgObj) {
  const preview = document.getElementById("reply-preview");
  const previewText = document.getElementById("reply-text");

  previewText.textContent = msgObj.text?.slice(0, 120) || "";
  preview.style.display = "flex";

  // THIS IS CRUCIAL:
  replyingMessage = msgObj; // ✅ now sendMessage knows this is linked
}
// Close preview
document.getElementById("close-reply").onclick = () => {
  document.getElementById("reply-preview").style.display = "none";
};

const textarea = document.getElementById("messageInput");

textarea.addEventListener("input", () => {
  textarea.style.height = "auto";
  textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
});
// ===== POLL CLICK WITH MULTI-SELECT SUPPORT =====
chatBody.addEventListener("click", (e) => {
  const optionEl = e.target.closest(".poll-option");
  if (!optionEl) return;

  const pollWrapper = optionEl.closest(".poll-wrapper");
  if (!pollWrapper) return;

  // Get poll object from DOM
  const pollId = Number(pollWrapper.querySelector(".poll-question")?.dataset.pollId);
  if (pollId === undefined) return;

  // For now, assume the poll data is stored on the element (we can attach it when rendering)
  const pollData = pollWrapper.pollData; // set this when generating the poll in addMessage()
  if (!pollData) return;

  const optionIndex = Number(optionEl.dataset.index);

  if (pollData.allowMultiple) {
    // Toggle selection for this option only
    const circle = optionEl.querySelector(".poll-circle");
    const bar = optionEl.querySelector(".poll-bar");
    const isSelected = circle.classList.contains("selected");

    if (isSelected) {
      circle.classList.remove("selected");
      bar.style.width = "0%";
    } else {
      circle.classList.add("selected");
      bar.style.width = "100%";
    }
  } else {
    // Single selection mode: deselect all others
    pollWrapper.querySelectorAll(".poll-option").forEach(opt => {
      const c = opt.querySelector(".poll-circle");
      const b = opt.querySelector(".poll-bar");
      c.classList.remove("selected");
      b.style.width = "0%";
    });

    // Select the clicked option
    optionEl.querySelector(".poll-circle").classList.add("selected");
    optionEl.querySelector(".poll-bar").style.width = "100%";
  }
});
// ===== Event Listeners =====
window.addEventListener("online", retryAllPolls);  // retry pending polls once online
window.addEventListener("offline", retryAllPolls); // mark sending → pending when offline

// Initial load
syncPolls();
syncToFChat();
retryAllPolls();