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
retryAllPolls();