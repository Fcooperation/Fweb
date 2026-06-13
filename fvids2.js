document.addEventListener("DOMContentLoaded", () => {

  let currentVideoId = null;
  let currentVideoUrl = null;

  // ---------------- OPEN COMMENTS ----------------
  window.openComments = function(videoId, videoUrl) {

    currentVideoId = videoId;
    currentVideoUrl = videoUrl;

    const sheet = document.getElementById("comments-sheet");

    sheet.classList.remove("hidden");

    setTimeout(() => {
      sheet.classList.add("show");
    }, 10);

    loadComments(videoId);
  };

  // ---------------- LOAD COMMENTS ----------------
  function loadComments(videoId) {

    const list = document.getElementById("comments-list");
    const noComments = document.getElementById("no-comments");

    list.innerHTML = "";
    noComments.style.display = "block";
  }

  // ---------------- POST COMMENT ----------------
  const postBtn = document.getElementById("post-comment");

  postBtn.addEventListener("click", async () => {

    const account =
      JSON.parse(localStorage.getItem("faccount")) || {};

    const userId =
      account.userId || account.id;

    const input =
      document.getElementById("comment-input");

    const text =
      input.value.trim();

    if (!text) return;

    if (!userId) {
      showToast("Login required to comment");
      return;
    }

    try {

      const payload = {
        videoId: currentVideoId,
        videoUrl: currentVideoUrl,
        userId,
        commentText: text
      };

      const res = await fetch(
        "https://fweb-backend.onrender.com/fvids/comment",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(payload)
        }
      );

      const data = await res.json();

      if (!res.ok) {
        throw new Error(
          data.error || "Failed to post comment"
        );
      }

      // ---------- UI SUCCESS ----------
      const list =
        document.getElementById("comments-list");

      const div =
        document.createElement("div");

      div.style.padding = "8px";
      div.style.borderBottom = "1px solid #222";

      div.innerHTML = `
        <div style="font-size:14px;color:white;">
          ${text}
        </div>
        <div style="font-size:10px;opacity:0.6;">
          You
        </div>
      `;

      list.prepend(div);

      document.getElementById(
        "no-comments"
      ).style.display = "none";

      input.value = "";

    } catch (err) {

      console.error(err);

      showToast(
        err.message || "Failed to post comment"
      );
    }

  });

  // ---------------- TOAST ----------------
  function showToast(message) {

    let toast =
      document.getElementById("toast");

    if (!toast) {

      toast =
        document.createElement("div");

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