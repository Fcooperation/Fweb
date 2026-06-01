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

  promptInput.value = "";
  showTyping();

  try {

    const res =
await fetch(
  `https://fweb-backend.onrender.com/fai?q=${encodeURIComponent(prompt)}`
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

  promptInput.addEventListener(
    "keydown",
    e => {

      if (
        e.key === "Enter"
      ) {

        e.preventDefault();

        sendPrompt();

      }

    }
  );

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

    messages.push({

      role: "ai",

      text:
      "📚 New Study FAI chat started."

    });

    renderMessages();

    saveMessages();

  };

}

/* ---------- QUIZ REVIEW AUTO EXPLAIN ---------- */

const reviewData =
localStorage.getItem("fai_review");

if (reviewData) {

  try {

    const review =
    JSON.parse(reviewData);

    // 1. user message first
    messages.push({
      role: "user",
      text: "Explain my quiz answers in a simple way."
    });

    renderMessages();
    saveMessages();

    // 2. SHOW TYPING IMMEDIATELY (IMPORTANT)
    showTyping();

    // 3. timeout warning system
    let timeoutWarning;

    const timeout = setTimeout(() => {

      const typing = document.getElementById("typing-indicator");

      if (typing) {

        const warning =
        document.createElement("div");

        warning.className = "message system";

        warning.innerHTML = `
          ⏳ This is taking longer than usual...<br>
          <span id="reload-fai" style="color:#1d9bf0; text-decoration:underline; cursor:pointer;">
            Reload to reset
          </span>
        `;

        chatBox.appendChild(warning);
        chatBox.scrollTop = chatBox.scrollHeight;

        document.getElementById("reload-fai").onclick = () => {
          location.reload();
        };
      }

    }, 30000);

    // 4. request
    fetch(
      `https://fweb-backend.onrender.com/fai?q=${encodeURIComponent(
        `
You are FAI helping a student.

Give short but very clear explanations.

For each question:
- Correct answer
- Why it's correct
- Simple explanation

Quiz Review:
${JSON.stringify(review)}
        `
      )}`
    )
    .then(res => res.json())
    .then(data => {

      clearTimeout(timeout);

      removeTyping();

      messages.push({
        role: "ai",
        text: data.answer || "No explanation received."
      });

      renderMessages();
      saveMessages();

      localStorage.removeItem("fai_review");

    })
    .catch(() => {

      clearTimeout(timeout);
      removeTyping();

      messages.push({
        role: "ai",
        text: "Failed to generate explanations."
      });

      renderMessages();
      saveMessages();

      localStorage.removeItem("fai_review");

    });

  } catch(err) {

    console.error(err);
    localStorage.removeItem("fai_review");

  }

}

/* ---------- START ---------- */

renderMessages();

});