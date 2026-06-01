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

/* ---------- START ---------- */

renderMessages();

});