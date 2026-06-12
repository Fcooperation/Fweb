document.addEventListener("DOMContentLoaded", () => {

  let currentVideoId = null;

  // ---------------- OPEN COMMENTS ----------------
  window.openComments = function(videoId) {
    currentVideoId = videoId;

    const sheet = document.getElementById("comments-sheet");
    sheet.classList.remove("hidden");

    setTimeout(() => {
      sheet.classList.add("show");
    }, 10);

    loadComments(videoId);
  };

  // ---------------- LOAD COMMENTS (VIEW ONLY) ----------------
  function loadComments(videoId) {
    const list = document.getElementById("comments-list");
    const noComments = document.getElementById("no-comments");

    list.innerHTML = "";
    noComments.style.display = "block";
  }

  // ---------------- CHECK LOGIN ----------------
  function isLoggedIn() {
    const account = JSON.parse(localStorage.getItem("faccount")) || {};
    return !!(account.userId || account.id);
  }

  // ---------------- POST COMMENT ----------------
  const postBtn = document.getElementById("post-comment");

  postBtn.addEventListener("click", () => {

    const account = JSON.parse(localStorage.getItem("faccount")) || {};
    const userId = account.userId || account.id;

    const input = document.getElementById("comment-input");
    const text = input.value.trim();

    // ❌ empty comment
    if (!text) return;

    // ❌ NOT LOGGED IN → block posting
    if (!userId) {
      showToast("Login required to comment");
      return;
    }

    const list = document.getElementById("comments-list");

    const div = document.createElement("div");
    div.style.padding = "8px";
    div.style.borderBottom = "1px solid #222";

    div.innerHTML = `
      <div style="font-size:14px; color:white;">${text}</div>
      <div style="font-size:10px; opacity:0.6;">You</div>
    `;

    list.prepend(div);

    input.value = "";

    document.getElementById("no-comments").style.display = "none";

    // OPTIONAL: later send to Supabase here
    // saveCommentToDB(currentVideoId, text, userId);
  });

  // ---------------- TOAST (fallback if not global) ----------------
  function showToast(message) {

    let toast = document.getElementById("toast");

    if (!toast) {
      toast = document.createElement("div");
      toast.id = "toast";
      document.body.appendChild(toast);
    }

    toast.textContent = message;
    toast.className = "toast show";

    setTimeout(() => {
      toast.className = "toast";
    }, 2500);
  }

});