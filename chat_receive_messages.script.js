// ------------------------------------
// Receiving logic
// Normalize messages + polls
// Detect NEW items
// Handle linked messages correctly
// ------------------------------------
async function fetchAllFChatLogs() {
  if (!navigator.onLine) return;

  try {
    const res = await fetch(API_URL, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    action: "get_all_fchatlogs",
    id: account.id,
    chatwithid: chatWith.id,
    typing: isTyping ? "yes" : "no",
    last_seen: new Date().toISOString() // <-- ADD THIS LINE
  })
});

    const data = await res.json();
    if (!data) return;
    
    // ------------------------
// UPDATE PARTNER STATUS
// ------------------------
function updatePartnerStatus(partnerStatus) {
  const statusEl = document.getElementById("user-status");
  if (!statusEl || !partnerStatus) return;

  const { logs, last_seen } = partnerStatus;
  if (!logs || !last_seen) {
    statusEl.textContent = "Offline";
    statusEl.className = "status last-seen";
    return;
  }

  const now = new Date();
  const lastSeenTime = new Date(new Date(last_seen).getTime() + 3600000);
  const diffSec = (now - lastSeenTime) / 1000;

  // Improved logic block inside updatePartnerStatus
if (diffSec <= 15) {
    if (logs.status === "active" && logs.chat == account.id) {
        statusEl.textContent = "Active";
        statusEl.className = "status active";
    } else {
        statusEl.textContent = "Online";
        statusEl.className = "status online";
    }
    return;
}


// Otherwise show Last seen
let displayText = "";

const nowDate = new Date();
const today = nowDate.toDateString();
const yesterday = new Date(nowDate - 86400000).toDateString();
const seenDate = lastSeenTime.toDateString();

// Format time with AM/PM
let hours = lastSeenTime.getHours();
const minutes = String(lastSeenTime.getMinutes()).padStart(2,"0");
const ampm = hours >= 12 ? "PM" : "AM";

hours = hours % 12;
hours = hours ? hours : 12;

const formattedTime = `${hours}:${minutes} ${ampm}`;

if (diffSec < 60) {
  displayText = `Last seen ${Math.floor(diffSec)} seconds ago`;
}

else if (diffSec < 3600) {
  const mins = Math.floor(diffSec / 60);
  displayText = `Last seen ${mins} minute${mins > 1 ? "s" : ""} ago`;
}

else {

  if (seenDate === today) {
    displayText = `Last seen today at ${formattedTime}`;
  }

  else if (seenDate === yesterday) {
    displayText = `Last seen yesterday at ${formattedTime}`;
  }

  else {
    displayText = `Last seen ${lastSeenTime.toLocaleDateString()} at ${formattedTime}`;
  }

}

  statusEl.textContent = displayText;
  statusEl.className = "status last-seen";
}

// ------------------------
// Example usage inside fetchAllFChatLogs
// ------------------------
if (data.partner_status) {
  
  // =========================
// HANDLE SEEN MESSAGES
// =========================
if (data.partner_status?.seen_messages?.length) {

  const seenList = data.partner_status.seen_messages;

  seenList.forEach(seen => {
    const seenId = Number(seen.message_id);

    // 🔥 Mark ALL messages up to this ID as seen
    fchatMessages = fchatMessages.map(msg => {
      const isMine = String(msg.sender_id) === String(account.id);

      if (isMine && Number(msg.id) <= seenId) {
        return {
          ...msg,
          status: "seen"
        };
      }

      return msg;
    });

  });

  // Save updates
  localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));

  // Update UI instantly
  updateSeenUI();
}

  updatePartnerStatus(data.partner_status);
  const logs = data.partner_status.logs;

  let typingTimeout = null;

if (logs && logs.typing === true && logs.chat == account.id) {

  // Show typing in header
  const statusEl = document.getElementById("user-status");
  if (statusEl) {
    statusEl.textContent = "Typing...";
    statusEl.className = "status typing"; // 👈 for blue styling
  }

  showTypingBubble();

  // ⏱️ Auto reset after 3 seconds
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    hideTypingBubble();

    // fallback to last seen
    updatePartnerStatus(data.partner_status);
  }, 3000);

} else {
  hideTypingBubble();
}
}

    const newItems = [];

    // ------------------------
    // NORMALIZE MESSAGES
    // ------------------------
    if (Array.isArray(data.messages)) {
      data.messages.forEach(msg => {

  if (!isCurrentChatItem(msg.sender_id, msg.receiver_id)) {
    return;
  }

  if (fchatMessages.some(m => m.id === msg.id)) return;

        // 🔗 Resolve linked message
        let replyTo = null;

if (msg.linked && msg.linked_message_id) {
  const original =
    fchatMessages.find(m => m.id === msg.linked_message_id) ||
    data.messages.find(m => m.id === msg.linked_message_id) ||
    messages.find(m => m.id === msg.linked_message_id); // 🔥 added

  replyTo = original
  ? {
      id: original.id,
      text: (original.message || original.text || "").slice(0, 100),
      sender: original.sender_id
    }
  : null;
}

        newItems.push({
  id: msg.id,
  sender_id: msg.sender_id,
  receiver_id: msg.receiver_id,
  text: msg.message || "",
sent_at: msg.created_at,
  isPoll: false,
  pollData: null,
  reactions: msg.reactions || [],
  linked: msg.linked || false,
  linked_message_id: msg.linked_message_id || null,
  replyTo
});
      });
    }
    // ------------------------
// NORMALIZE REACTIONS (SIMPLE MODE)
// ------------------------
if (Array.isArray(data.reactions)) {
  let newReactionCount = 0;

  data.reactions.forEach(reaction => {

    const msg = fchatMessages.find(
      m => String(m.id) === String(reaction.message_id)
    );

    if (!msg) return;

    if (!Array.isArray(msg.reactions)) {
      msg.reactions = [];
    }

    // Find existing reaction from this sender
    const existingIndex = msg.reactions.findIndex(
      r => String(r.sender_id) === String(reaction.sender_id)
    );

    let changed = false;

    // ------------------------
    // 🗑 REMOVE reaction (empty string)
    // ------------------------
    if (!reaction.reaction) {

      if (existingIndex !== -1) {
        msg.reactions.splice(existingIndex, 1);
        changed = true;
      }

    } else {

      // ------------------------
      // ✏️ UPDATE existing reaction
      // ------------------------
      if (existingIndex !== -1) {

        if (msg.reactions[existingIndex].emoji !== reaction.reaction) {
          msg.reactions[existingIndex].emoji = reaction.reaction;
          changed = true;
        }

      } else {

        // ------------------------
        // ➕ ADD new reaction
        // ------------------------
        msg.reactions.push({
          sender_id: reaction.sender_id,
          emoji: reaction.reaction
        });

        changed = true;
      }
    }

    // 🚨 Only continue if something ACTUALLY changed
    if (!changed) return;

    newReactionCount++;

    // ------------------------
    // 🎨 UPDATE UI
    // ------------------------
    const msgEl = document.querySelector(`[data-id="${msg.id}"]`);

    if (msgEl) {
      let box = msgEl.querySelector(".reactions");

      if (!box) {
        box = document.createElement("div");
        box.className = "reactions";
        msgEl.appendChild(box);
      }

// Count emojis
const counts = {};
msg.reactions.forEach(r => {
  counts[r.emoji] = (counts[r.emoji] || 0) + 1;
});

// 🔥 Sort by most used
const sorted = Object.entries(counts)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 3); // ✅ TOP 3 ONLY

// Render
box.innerHTML = "";

sorted.forEach(([emoji, count]) => {
  const pill = document.createElement("span");
  pill.className = "reaction-pill";

  // ✅ Show count ONLY if > 1
  pill.textContent = count > 1 ? `${emoji}${count}` : emoji;

  // 👇 Add click event (for popup)
  pill.onclick = (e) => {
    e.stopPropagation();
    showReactionPopup(pill, msg);
  };

  box.appendChild(pill);
});
    }

  });

  // ------------------------
  // 💾 SAVE + NOTIFY (only if real changes)
  // ------------------------
  if (newReactionCount > 0) {
    localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));
    newMessagesFound(newReactionCount);
  }
}

// ------------------------
// NORMALIZE VOTES
// ------------------------
if (Array.isArray(data.votes)) {

  const POLL_STORAGE_KEY = `polls_${account.email}_${chatWith.id}`;
  let storedPolls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];

  let votesChanged = false;
  let newVoteCount = 0;

  data.votes.forEach(vote => {

    if (!isCurrentChatItem(vote.sender_id, vote.receiver_id)) return;

    const pollIndex = storedPolls.findIndex(
      p => Number(p.id) === Number(vote.poll_id)
    );

    if (pollIndex === -1) return;

    const poll = storedPolls[pollIndex];

    poll.votes = poll.votes || {};

    const existingVote = JSON.stringify(poll.votes[vote.sender_id] || []);
    const incomingVote = JSON.stringify(vote.options || []);

    if (existingVote !== incomingVote) {

      poll.votes[vote.sender_id] = vote.options || [];

      // ⭐ IMPORTANT: update voted_options if it's my vote
      if (Number(vote.sender_id) === Number(account.id)) {
        poll.voted_options = vote.options || [];
      }

      votesChanged = true;
      newVoteCount++;
    }

  });

  if (votesChanged) {

    localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(storedPolls));

    // show vote notification
    newMessagesFound(newVoteCount);

    // refresh poll UI
    updateTimeline();
  }
}

    // ------------------------
    // NORMALIZE POLLS
    // ------------------------
    if (Array.isArray(data.polls)) {
      data.polls.forEach(poll => {

  if (!isCurrentChatItem(poll.sender_id, poll.receiver_id)) {
    return;
  }
        if (fchatMessages.some(m => m.id === poll.id)) return;

        newItems.push({
          id: poll.id,
          sender_id: poll.sender_id,
          receiver_id: poll.receiver_id,
          text: poll.pollData?.question || "",
          sent_at: poll.sent_at,
          isPoll: true,
          pollData: poll.pollData,
          linked: false,
          linked_message_id: null,
          replyTo: null
        });

        // ------------------------
        // SAVE RECEIVED POLL TO POLL STORAGE
        // ------------------------
        const POLL_STORAGE_KEY = `polls_${account.email}_${chatWith.id}`;
        let storedPolls = JSON.parse(localStorage.getItem(POLL_STORAGE_KEY)) || [];
        if (!storedPolls.some(p => p.id === poll.id)) {
          storedPolls.push({
  id: poll.id,
  sender_id: poll.sender_id,
  receiver_id: poll.receiver_id,
  pollData: poll.pollData,
  status: "sent",
  votes: {},
  sent_at: poll.sent_at
});
          localStorage.setItem(POLL_STORAGE_KEY, JSON.stringify(storedPolls));
        }
      });
    }

    // ------------------------
    // NO NEW DATA → STOP
    // ------------------------
    if (newItems.length === 0) return;

// ✅ Check if any NEW RECEIVED messages exist
const hasIncoming = newItems.some(item =>
  String(item.sender_id) === String(chatWith.id) &&
  String(item.receiver_id) === String(account.id)
);

if (hasIncoming) {
  sendLastSeen();

  // 🔥 ALSO mark locally as seen
  fchatMessages = fchatMessages.map(msg => {
    const isFromThem =
      String(msg.sender_id) === String(chatWith.id) &&
      String(msg.receiver_id) === String(account.id);

    if (isFromThem) {
      return { ...msg, status: "seen" };
    }

    return msg;
  });

  localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));
}

    // ------------------------
    // STORE + SORT
    // ------------------------
    fchatMessages.push(...newItems);
    // 🔥 REBUILD ALL REPLIES SAFELY
const messageMap = {};
fchatMessages.forEach(m => {
  messageMap[String(m.id)] = m;
});

fchatMessages.forEach(msg => {
  if (msg.linked && msg.linked_message_id) {
    const original = messageMap[String(msg.linked_message_id)];

    if (original) {
      msg.replyTo = {
        id: original.id,
        text: (original.text || "").slice(0, 100),
        sender: original.sender_id
      };
    }
  }
});
    fchatMessages.sort(
      (a, b) => new Date(a.sent_at) - new Date(b.sent_at)
    );

    localStorage.setItem(
      FCHAT_STORAGE_KEY,
      JSON.stringify(fchatMessages)
    );
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));

    // ------------------------
    // UI SIGNAL
    // ------------------------
    newMessagesFound(newItems.length);
    updateTimeline();

  } catch (err) {
    console.warn("Failed to fetch FChat logs:", err);
  }
}

// ------------------------------------
// New messages UI indicator
// ------------------------------------
function newMessagesFound(count) {
  const box = document.getElementById("new-msg-box");
  box.textContent = `New messages found (${count})`;
  box.classList.add("show");

  setTimeout(() => {
    box.classList.remove("show");
  }, 3000);
}