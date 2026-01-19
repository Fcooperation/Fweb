const API_URL = "https://fweb-backend.onrender.com/fchat";
const account = JSON.parse(localStorage.getItem("faccount")) || {};
const chatWith = JSON.parse(localStorage.getItem("chatting_with")) || {};

if (!chatWith || !chatWith.id) {
  alert("No chat selected");
  window.location.href = "fchat.html";
}
// Message Storage
const STORAGE_KEY = `chat_${account.email}_${chatWith.id}`;
let messages = JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
let selectionMode = false;
const selectedMessages = new Set();
let longPressTimer = null;

const FCHAT_STORAGE_KEY = `fchat_messages_${account.email}`;
let fchatMessages = JSON.parse(localStorage.getItem(FCHAT_STORAGE_KEY)) || [];

// Header
document.getElementById("chat-username").textContent = chatWith.username || "User";
document.getElementById("chat-id").textContent = "ID: " + (chatWith.id || "");

const profilePic = document.getElementById("profile-pic");
if (chatWith.profile_pic) {
  profilePic.style.backgroundImage = `url('${chatWith.profile_pic}')`;
  profilePic.style.backgroundSize = "cover";
  profilePic.style.backgroundPosition = "center";
} else {
  profilePic.textContent = (chatWith.username || "U").split(" ").map(w => w[0]).join("").toUpperCase();
}

// Chat body
const chatBody = document.getElementById("chat-body");

// Date dividers
function formatDateLabel(dateStr) {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  const isSameDay = (d1, d2) =>
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();

  if (isSameDay(date, today)) return "Today";
  if (isSameDay(date, yesterday)) return "Yesterday";

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}
// Toggle Selection Mode
function toggleSelectMessage(el, msgObj) {
  const id = msgObj.id;

  if (selectedMessages.has(id)) {
    selectedMessages.delete(id);
    el.classList.remove("selected", "highlight-message");
  } else {
    selectedMessages.add(id);
    el.classList.add("selected", "highlight-message");
  }

  // enter selection mode if at least one message selected
  selectionMode = selectedMessages.size > 0;

  // Refresh the selection board visibility
  updateSelectionBoard();
}

// Selection board elements
const selectionBoard = document.getElementById("selection-board");
const boardBackBtn = document.getElementById("board-back-btn");
const deleteForMeBtn = document.querySelector(".delete-me");
const deleteForEveryoneBtn = document.querySelector(".delete-everyone");
const messageMenu = document.getElementById("message-menu");
const menuReply = document.getElementById("menu-reply");
const menuSelect = document.getElementById("menu-select");

let menuTargetMsg = null;
let menuTargetEl = null;

// Hide menu when clicking elsewhere
document.addEventListener("click", () => {
  messageMenu.style.display = "none";
});

// ===== DELETE FOR ME =====
deleteForMeBtn.addEventListener("click", () => {
  if (selectedMessages.size === 0) return;

  // 1️⃣ Delete from chat-specific messages (UI source)
  messages = messages.filter(
    msg => !selectedMessages.has(msg.id)
  );
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));

  // 2️⃣ Delete from global fchat messages
  fchatMessages = fchatMessages.filter(
    msg => !selectedMessages.has(msg.id)
  );
  localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));

  // 3️⃣ Remove from DOM
  selectedMessages.forEach(id => {
    const msgEl = chatBody.querySelector(`[data-id='${id}']`);
    if (msgEl) msgEl.remove();
  });

  // 4️⃣ Cleanup
  selectedMessages.clear();
  selectionMode = false;
  updateSelectionBoard();

  // 5️⃣ Close modal
  deleteModal.style.display = "none";
});

// Show/hide the selection board based on selection
function updateSelectionBoard() {
  if (selectionMode) {
    selectionBoard.style.display = "flex";
    const boardTitle = document.getElementById("board-title");
    boardTitle.textContent = ""; // static, no count
  } else {
    selectionBoard.style.display = "none";
  }
}
// ===== DELETE FOR EVERYONE =====
deleteForEveryoneBtn.addEventListener("click", () => {
  if (selectedMessages.size === 0) return;

  const jsonToSend = {
    action: "delete_for_everyone",
    chat_id: chatWith.id,
    message_ids: Array.from(selectedMessages),
    requested_by: account.id,
    timestamp: Date.now()
  };

  // Send to backend
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(jsonToSend)
  })
  .then(res => res.json())
  .then(res => console.log("Delete for everyone response:", res))
  .catch(err => console.error(err));

  // Update frontend AND localStorage arrays
  selectedMessages.forEach(id => {
    messages = messages.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          deleted: true,
          deleted_for: "everyone",
          requested_by: account.id,
          status: "deleted", // ✅ mark status as deleted
          text: "" // optional, clear original text
        };
      }
      return msg;
    });

    fchatMessages = fchatMessages.map(msg => {
      if (msg.id === id) {
        return {
          ...msg,
          deleted: true,
          deleted_for: "everyone",
          requested_by: account.id,
          status: "deleted",
          text: ""
        };
      }
      return msg;
    });

    // Update DOM
    const msgEl = chatBody.querySelector(`[data-id='${id}']`);
    if (msgEl) {
      const isSent = msgEl.classList.contains("sent");

msgEl.className = `message ${isSent ? "sent" : "received"} deleted-for-everyone`;
msgEl.innerHTML = `
  <i class="deleted-text">
    This message was deleted by you
  </i>
`;
    }
  });

  // Save updated arrays
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));

  // Cleanup
  selectedMessages.clear();
  selectionMode = false;
  updateSelectionBoard();
  deleteModal.style.display = "none";
});

// Back button cancels selection mode
boardBackBtn.onclick = () => {
  clearSelection();
};

// ===== DELETE MODAL LOGIC =====
const deleteModal = document.getElementById("delete-modal");
const deleteBtn = document.getElementById("board-delete-btn");
const cancelDeleteBtn = document.querySelector(".delete-cancel");

// Open delete form
deleteBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent selection clear
  deleteModal.style.display = "flex";
});

// Cancel closes modal
cancelDeleteBtn.addEventListener("click", () => {
  deleteModal.style.display = "none";
});
// Delete For Everyone Limit
function updateDeleteModalButtons() {
  const selectedMsgObjs = Array.from(selectedMessages).map(id =>
    messages.find(m => m.id === id)
  );

  const allCanDeleteForEveryone = selectedMsgObjs.length > 0 && selectedMsgObjs.every(m =>
    m.sender_id === account.id &&
    m.status === "sent" &&
    !m.deleted // ✅ ignore already deleted messages
  );

  if (allCanDeleteForEveryone) {
    deleteForEveryoneBtn.style.display = "inline-block";
  } else {
    deleteForEveryoneBtn.style.display = "none";
  }

  deleteForMeBtn.style.display = "inline-block";
}

// When opening the delete modal
deleteBtn.addEventListener("click", (e) => {
  e.stopPropagation(); // prevent selection clear
  updateDeleteModalButtons(); // ✅ check which buttons should show
  deleteModal.style.display = "flex";
});

// Clicking outside the box closes modal
deleteModal.addEventListener("click", (e) => {
  if (e.target === deleteModal) {
    deleteModal.style.display = "none";
  }
});

// Tapping anywhere on chat background also cancels selection mode
chatBody.addEventListener("click", () => {
  if (selectionMode) clearSelection();
});

// Helper to clear all selections
function clearSelection() {
  selectedMessages.forEach(id => {
    const msgEl = chatBody.querySelector(`[data-id='${id}']`);
    if (msgEl) msgEl.classList.remove("selected", "highlight-message");
  });

  selectedMessages.clear();
  selectionMode = false;
  updateSelectionBoard();
}
// Menu For PC
menuReply.onclick = () => {
  if (!menuTargetMsg) return;

  showReplyPreview(menuTargetMsg);
  messageMenu.style.display = "none";
};

menuSelect.onclick = () => {
  if (!menuTargetMsg || !menuTargetEl) return;

  selectionMode = true;
  toggleSelectMessage(menuTargetEl, menuTargetMsg);

  messageMenu.style.display = "none";
};
// Add message function
function addMessage(msgObj) {
  const msg = document.createElement("div");
  msg.dataset.id = msgObj.id;

  const isSent = String(msgObj.sender_id) === String(account.id);
  const alignmentClass = isSent ? "sent" : "received";

  // Format time
  const time = new Date(msgObj.sent_at).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit"
  });

  if (msgObj.isPoll && msgObj.pollData) {
  msg.className = `poll-wrapper ${alignmentClass}`;
  msg.pollData = msgObj.pollData; // attach poll JSON

  // Decide instruction text
  const instructionText = msgObj.pollData.allowMultiple
    ? "Select one or more"
    : "Select one";

  msg.innerHTML = `
    <div class="poll-question">${msgObj.pollData.question}</div>
    <div class="poll-instruction">${instructionText}</div>

    ${msgObj.pollData.options.map((opt, i) => `
      <div class="poll-option" data-index="${i}">
        <div class="poll-row">
          <div class="poll-circle"></div>
          <div class="poll-text">${opt}</div>
        </div>
        <div class="poll-bar-container">
          <div class="poll-bar"></div>
        </div>
      </div>
    `).join("")}

    <div class="message-meta">
      ${time} ${isSent ? "• " + (msgObj.poll_status || msgObj.status || "sent") : ""}
    </div>
  `;
} else {
  msg.className = `message ${alignmentClass}`;

let replyHTML = "";
if (msgObj.replyTo && !(msgObj.deleted && msgObj.deleted_for === "everyone")) {
  replyHTML = `
    <div class="reply-bubble">
      ${msgObj.replyTo.text}
    </div>
  `;
}

// ✅ Handle deleted-for-everyone
if (msgObj.deleted && msgObj.deleted_for === "everyone") {
  msg.className = `message ${alignmentClass} deleted-for-everyone`;
  msg.innerHTML = `
    ${replyHTML}
    <i class="deleted-text">
      This message was deleted by ${msgObj.requested_by === account.id ? "you" : "someone"}
    </i>
    <div class="message-meta">
      ${time}
    </div>
  `;
} else {
  msg.innerHTML = `
    ${replyHTML}
    <div class="message-text"></div>
    <div class="message-meta">
      ${time} ${isSent ? "• " + (msgObj.status || "sent") : ""}
    </div>
  `;
  if (msgObj.poll_status === "sending") {
  msg.classList.add("poll-dimmed");
}
  const textBox = msg.querySelector(".message-text");
  applyReadMore(textBox, msgObj.text);
}

  enableSwipe(msg, msgObj); // full object
// Glow ONLY when clicking the reply preview bubble
if (msgObj.linked) {
  const replyBubble = msg.querySelector(".reply-bubble");
  if (!replyBubble) return;

  replyBubble.style.cursor = "pointer";

  replyBubble.addEventListener("click", (e) => {
  if (selectionMode) return; // 🚫 ignore reply click when selecting
  e.stopPropagation();

  const linkedMsgId = msgObj.linked_message_id;
  const originalMsg = chatBody.querySelector(
    `[data-id='${linkedMsgId}']`
  );
  if (!originalMsg) return;

    let cancelScroll = false;

    const stopScroll = () => { cancelScroll = true; };
    document.addEventListener("click", stopScroll, {
      once: true,
      capture: true
    });

    const startScrollTop = chatBody.scrollTop;
    const targetTop =
      originalMsg.offsetTop -
      chatBody.offsetHeight / 2 +
      originalMsg.offsetHeight / 2;

    const duration = 400;
    const startTime = performance.now();

    function easeInOutQuad(t) {
      return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    function smoothScroll(currentTime) {
      if (cancelScroll) return;

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      chatBody.scrollTop =
        startScrollTop +
        (targetTop - startScrollTop) * easeInOutQuad(progress);

      if (progress < 1) {
        requestAnimationFrame(smoothScroll);
      } else {
        triggerGlow();
      }
    }

    function triggerGlow() {
      originalMsg.classList.remove("highlight-message");
      void originalMsg.offsetWidth;
      originalMsg.classList.add("highlight-message");
    }

    requestAnimationFrame(smoothScroll);
  });
}
}
  chatBody.appendChild(msg);
// ===== ADD POLL SUBMIT BUTTON (OUTSIDE POLL BOX) =====
if (msgObj.isPoll && msgObj.pollData) {
  const submitBtn = document.createElement("button");
submitBtn.className = `poll-submit-btn ${alignmentClass}`;
submitBtn.textContent = "Submit vote"; // ✅ DEFAULT TEXT (VERY IMPORTANT)

  const POLL_STORAGE_KEY = `polls_${account.email}_${chatWith.id}`;
  const polls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];
  const storedPoll = polls.find(p => p.id === msgObj.id);

  // Function to mark selected options in the UI
  const markSelectedOptions = (pollWrapper, votedOptions) => {
    pollWrapper.querySelectorAll(".poll-option").forEach((opt, i) => {
      const circle = opt.querySelector(".poll-circle");
      const bar = opt.querySelector(".poll-bar");
      if (votedOptions.includes(i + 1)) {
        circle.classList.add("selected");
        bar.style.width = "100%";
      } else {
        circle.classList.remove("selected");
        bar.style.width = "0%";
      }
    });
  };

  // Set initial button text & selected options based on stored poll
  const pollWrapper = msg.querySelector(".poll-wrapper") || msg;
  if (storedPoll) {
  const voted = Array.isArray(storedPoll.voted_options) && storedPoll.voted_options.length > 0;

  markSelectedOptions(pollWrapper, voted ? storedPoll.voted_options : []);

  if (storedPoll.status === "pending") {
    if (voted) {
      submitBtn.textContent = "Pending";
      submitBtn.disabled = true;
      pollWrapper.classList.add("poll-dimmed");
    } else {
      submitBtn.textContent = "Submit vote";
      submitBtn.disabled = false;
      pollWrapper.classList.remove("poll-dimmed");
    }
  }
  else if (storedPoll.status === "sending") {
    if (voted) {
      submitBtn.textContent = "Submitting...";
      submitBtn.disabled = true;
      pollWrapper.classList.add("poll-dimmed");
    } else {
      // 👈 important: no vote yet, show normal button
      submitBtn.textContent = "Submit vote";
      submitBtn.disabled = false;
      pollWrapper.classList.remove("poll-dimmed");
    }
  }
  else if (storedPoll.status === "sent") {
    if (voted) {
      submitBtn.textContent = "Revote";
    } else {
      submitBtn.textContent = "Submit vote";
    }
    submitBtn.disabled = false;
    pollWrapper.classList.remove("poll-dimmed");
  }
}else {
    submitBtn.textContent = "Submit vote";
  }

  // Send vote function
  const sendVote = (selectedOptions, pollWrapper, meta) => {
    pollWrapper.classList.add("poll-dimmed");
    submitBtn.textContent = "Submitting...";
    submitBtn.disabled = true;
    if (meta) meta.innerHTML = meta.innerHTML.replace(/sent|pending/, "sending");

    let polls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];
    polls = polls.map(p =>
      p.id === msgObj.id ? { ...p, status: "sending", voted_options: selectedOptions } : p
    );
    localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(polls));

    fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send_votes",
        poll_id: msgObj.id,
        sender_id: account.id,
        receiver_id: chatWith.id,
        options: selectedOptions
      })
    }).then(() => {
  submitBtn.textContent = "Revote";
  submitBtn.disabled = false;
  pollWrapper.classList.remove("poll-dimmed");

  let finalPolls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];
  finalPolls = finalPolls.map(p =>
    p.id === msgObj.id ? { ...p, status: "sent" } : p
  );
  localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(finalPolls));
})
.catch(() => {
  // 👇 CRITICAL FALLBACK
  let polls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];
  polls = polls.map(p =>
    p.id === msgObj.id ? { ...p, status: "pending" } : p
  );
  localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(polls));

  submitBtn.textContent = "Pending";
  submitBtn.disabled = true;
})
  };
submitBtn.onclick = () => {

  // 🚫 BLOCK voting if POLL MESSAGE is not yet sent/delivered/seen
  const allowedStatuses = ["sent", "delivered", "seen"];
  if (!allowedStatuses.includes(msgObj.status)) {
    alert("You cannot submit a vote until this poll has been sent.");
    return;
  }

  const selectedOptions = [...pollWrapper.querySelectorAll(".poll-circle.selected")]
    .map(c => Number(c.closest(".poll-option").dataset.index) + 1);

  if (selectedOptions.length === 0) {
    alert("Select an option please");
    return;
  }

  const meta = pollWrapper.querySelector(".message-meta");

  let polls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];
  let currentPoll = polls.find(p => p.id === msgObj.id);

  // 🔌 OFFLINE → mark vote as pending
  if (!navigator.onLine) {
    submitBtn.textContent = "Pending";
    submitBtn.disabled = true;
    pollWrapper.classList.add("poll-dimmed");

    polls = polls.map(p =>
      p.id === msgObj.id
        ? {
            ...p,
            status: "pending",
            voted_options: selectedOptions
          }
        : p
    );
    localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(polls));

    // 🔁 Retry once online
    const onlineListener = () => {
      window.removeEventListener("online", onlineListener);

      let retryPolls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];
      retryPolls = retryPolls.map(p =>
        p.id === msgObj.id
          ? { ...p, status: "sending", voted_options: selectedOptions }
          : p
      );
      localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(retryPolls));

      sendVote(selectedOptions, pollWrapper, meta);
    };

    window.addEventListener("online", onlineListener);
    return;
  }

  // 🌐 ONLINE → normal send
  sendVote(selectedOptions, pollWrapper, meta);
};
  
  chatBody.appendChild(submitBtn);
}
// Desktop right-click menu
msg.addEventListener("contextmenu", e => {
  e.preventDefault(); // ⛔ disable browser menu

  if (selectionMode) return;
  if (e.pointerType === "touch") return;

  e.stopPropagation();

  menuTargetMsg = msgObj;
  menuTargetEl = msg;

  const rect = msg.getBoundingClientRect();
  const isSent = msg.classList.contains("sent");

  messageMenu.style.top =
    window.scrollY + rect.top + rect.height / 2 + "px";

  if (isSent) {
    messageMenu.style.left = rect.left - 120 + "px";
  } else {
    messageMenu.style.left = rect.right + 10 + "px";
  }

  messageMenu.style.display = "block";
});
  // ===== LONG PRESS MULTI SELECT =====
msg.addEventListener("touchstart", e => {
  if (e.target.closest(".reply-bubble")) return; // don't hijack reply clicks

  longPressTimer = setTimeout(() => {
    selectionMode = true;
    toggleSelectMessage(msg, msgObj);
  }, 400);
});

msg.addEventListener("touchend", () => {
  clearTimeout(longPressTimer);
});

msg.addEventListener("touchmove", () => {
  clearTimeout(longPressTimer);
});

// Tap behavior when selection mode is active
msg.addEventListener("click", e => {
  if (!selectionMode) return;

  e.stopPropagation();
  toggleSelectMessage(msg, msgObj);
});
  chatBody.scrollTop = chatBody.scrollHeight;
}
// Update timeline
function updateTimeline() {
  chatBody.innerHTML = "";

  const chatItems = fchatMessages
    .filter(m =>
      (m.sender_id === chatWith.id && m.receiver_id === account.id) || // messages sent to me
      (m.sender_id === account.id && m.receiver_id === chatWith.id)   // messages I sent to them
    )
    .sort((a, b) => new Date(a.sent_at) - new Date(b.sent_at));

  let lastDate = null;

  chatItems.forEach(msg => {
    let msgDate;
try {
  msgDate = new Date(msg.sent_at).toDateString();
} catch {
  msgDate = "Unknown Date";
}

    if (msgDate !== lastDate) {
      const dateDivider = document.createElement("div");
      dateDivider.className = "date-divider";
      dateDivider.textContent = formatDateLabel(msg.sent_at);
      chatBody.appendChild(dateDivider);

      lastDate = msgDate;
    }

    addMessage(msg);
  });
}
