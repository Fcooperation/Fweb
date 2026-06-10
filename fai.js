document.addEventListener("DOMContentLoaded", () => {

const STORAGE_KEY = "fai_chat";

const chatBox =
document.getElementById("chat-box");

const promptInput =
document.getElementById("prompt");

const sendBtn =
document.getElementById("send-btn");

const clearBtn =
document.getElementById("clear-btn");

const newChatBtn =
document.getElementById("new-chat-btn");

const account = JSON.parse(localStorage.getItem("faccount"));

  function autoResize() {
  promptInput.style.height = "auto";
  promptInput.style.height = promptInput.scrollHeight + "px";
  }
  
  promptInput.addEventListener("input", autoResize);

let messages =
JSON.parse(
localStorage.getItem(STORAGE_KEY)
) || [];

/* ---------- RENDER ---------- */

function renderMessages() {

  if (!chatBox) return;

  chatBox.innerHTML = "";

  messages.forEach(msg => {

    const div =
    document.createElement("div");

    div.className =
    `message ${msg.role}`;

    div.innerHTML = marked.parse(msg.text);

    chatBox.appendChild(div);

  });

  chatBox.scrollTop =
  chatBox.scrollHeight;
}

/* ---------- SAVE ---------- */

function saveMessages() {

  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(messages)
  );

}

// three dot typing 
function showTyping() {

  const typing =
  document.createElement("div");

  typing.className =
  "message ai";

  typing.id =
  "typing-indicator";

  typing.innerHTML = `
    <div class="typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;

  chatBox.appendChild(typing);

  chatBox.scrollTop =
  chatBox.scrollHeight;
}

function removeTyping() {

  const typing =
  document.getElementById(
    "typing-indicator"
  );

  if (typing) {
    typing.remove();
  }

}

/* ---------- SEND ---------- */

async function sendPrompt() {

  const prompt =
  promptInput.value.trim();

  if (!prompt) return;

  messages.push({
    role: "user",
    text: prompt
  });

  renderMessages();
  saveMessages();
  
  // once user sends message, disable new chat mode
localStorage.setItem("fai_new_chat", "false");

  promptInput.value = "";
  promptInput.style.height = "auto";
  showTyping();

  try {

    const account = JSON.parse(localStorage.getItem("faccount")) || {};

const userId = account?.userId || account?.id || "guest";

// get last 15 messages INCLUDING current user message
const contextMessages = messages.slice(-15);

// detect if new chat mode is active
const newChatMode = localStorage.getItem("fai_new_chat") === "true";

const res = await fetch(
  "https://fweb-backend.onrender.com/fai",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      userId,
      messages: newChatMode ? [] : contextMessages,
      prompt
    })
  }
);

const data =
await res.json();
removeTyping();

messages.push({
  role: "ai",
  text:
    data.answer ||
    data.reply ||
    "No response"
});

  } catch (err) {
    removeTyping();

    messages.push({
      role: "ai",
      text:
      "Failed to connect to FAI."
    });

  }

  renderMessages();
  saveMessages();

}

/* ---------- BUTTONS ---------- */

if (sendBtn) {

  sendBtn.onclick =
  sendPrompt;

}

if (promptInput) {
  promptInput.addEventListener("keydown", e => {

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendPrompt();
    }

  });
}

if (clearBtn) {

  clearBtn.onclick = () => {

    if (
      confirm(
        "Delete chat history?"
      )
    ) {

      localStorage.removeItem(
        STORAGE_KEY
      );

      messages = [];

      renderMessages();

    }

  };

}

if (newChatBtn) {

  newChatBtn.onclick = () => {

  localStorage.setItem("fai_new_chat", "true");

  messages = [{
    role: "ai",
    text: "📚 New Study FAI chat started."
  }];

  renderMessages();
  saveMessages();
};

}

// Fai features notice
const notice = document.getElementById("fai-notice");



if (!account) {
  if (notice) {
    notice.classList.remove("hidden");

    setTimeout(() => {
      notice.classList.add("hidden");
    }, 8000);
  }
}

/* ---------- START ---------- */

renderMessages();

/* ---------- AUTO REVIEW CHECK ---------- */

const reviewData = localStorage.getItem("fai_review");

if (reviewData) {

  try {

    const parsed =
      JSON.parse(reviewData);

    if (
      parsed &&
      parsed.review &&
      parsed.review.length
    ) {

   

messages.push({
  role: "user",
  text: "Please explain my quiz answers in a much better and simpler way."
});

renderMessages();
saveMessages();

showTyping();

      fetch(
        "https://fweb-backend.onrender.com/fai",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json"
          },
          body: JSON.stringify({
            userId:
              account?.userId ||
              account?.id ||
              "guest",
            messages: [],
            prompt: `
You are FAI helping a student.

Give short but very clear explanations.

For each question:
- Correct answer
- Why it's correct
- Simple explanation

Quiz Review:
${JSON.stringify(parsed, null, 2)}
            `.trim()
          })
        }
      )
      .then(res => {

  

  return res.json();

})
      .then(data => {

  removeTyping();

  localStorage.removeItem("fai_review");

  messages.push({
    role: "ai",
    text:
      data.answer ||
      data.reply ||
      "No response"
  });

  renderMessages();
  saveMessages();

})
      .catch(err => {

  removeTyping();

  localStorage.removeItem("fai_review");

  messages.push({
    role: "ai",
    text:
      "Failed to generate review explanation."
  });

  renderMessages();
  saveMessages();

  console.error(err);

});

    }

  } catch (err) {

    console.error(
      "Review parse error:",
      err
    );

  }

}


});