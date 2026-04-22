function sendMessage() {
  const input = document.getElementById("messageInput");
  const text = input.value.trim();
  if (!text) return;
  
  const sendBtn = document.getElementById("sendBtn");
  sendBtn.textContent = "Sending…";
  sendBtn.disabled = true;

  const msgObj = {
    id: Date.now(),
    type: "sent",
    text,
    reactions: [],
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
    linked: replyingMessage ? true : false,
    linked_message_id: replyingMessage ? replyingMessage.id : null,
    sender_id: account.id,
    receiver_id: chatWith.id
  };

  // save locally
  messages.push(msgObj);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));

  // render instantly
  addMessage(msgObj);
  applyChatSettings();
  
  fchatMessages.push(msgObj);
  localStorage.setItem(FCHAT_STORAGE_KEY, JSON.stringify(fchatMessages));
  
  sendBtn.textContent = "Send";
  sendBtn.disabled = false;

  input.value = "";
  input.style.height = "auto";
  replyingMessage = null;

  // ✅ SEND TO YOUR BACKEND
  if (navigator.onLine) {
    fetch("https://fweb-backend.onrender.com/fchat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        action: "send_message", // adjust if your backend uses another action
        message: msgObj
      })
    })
    .then(res => res.json())
    .then(data => {
      console.log("Sent:", data);
    })
    .catch(err => {
      console.error("Send failed:", err);
    });
  }

  // hide reply preview
  document.getElementById("reply-preview").style.display = "none";
}

window.sendMessage = sendMessage;