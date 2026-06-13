document.addEventListener("DOMContentLoaded", () => {

  let currentVideoId = null;
  let currentVideoUrl = null;
  let sheet;
let startY = 0;

  sheet = document.getElementById("comments-sheet");

  // ---------------- OPEN COMMENTS ----------------
  window.openComments = function(videoId, videoUrl) {

    currentVideoId = videoId;
    currentVideoUrl = videoUrl;

    const sheet = document.getElementById("comments-sheet");

    sheet.classList.remove("hidden");

    setTimeout(() => {
      sheet.classList.add("show");
      history.pushState({ commentsOpen: true }, "");
      
    }, 10);

    loadComments(videoId);
  };

  // ---------------- LOAD COMMENTS ----------------
  function loadComments(videoId) {

  const list = document.getElementById("comments-list");
  const noComments = document.getElementById("no-comments");

  list.innerHTML = "";

  const localKey = `fvid_comments_${videoId}`;
  const comments =
    JSON.parse(localStorage.getItem(localKey)) || [];

  if (comments.length === 0) {
    noComments.style.display = "block";
    return;
  }

  noComments.style.display = "none";

  comments.forEach(c => {

    const div = document.createElement("div");

    div.style.padding = "8px";
    div.style.borderBottom = "1px solid #222";

    div.innerHTML = `
      <div style="font-size:14px;color:white;">
        ${c.text}
      </div>
      <div style="font-size:10px;opacity:0.6;">
        You
      </div>
    `;

    list.appendChild(div);
  });
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

      // ---------- SAVE TO LOCAL STORAGE ----------
const localKey = `fvid_comments_${currentVideoId}`;

const existing =
  JSON.parse(localStorage.getItem(localKey)) || [];

existing.unshift({
  text,
  userId,
  createdAt: Date.now()
});

localStorage.setItem(
  localKey,
  JSON.stringify(existing)
);

      
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

  // Close comments section 
  document.addEventListener("click", (e) => {

  const isOpen =
    sheet && sheet.classList.contains("show");

  if (!isOpen) return;

  const isInside =
    sheet.contains(e.target);

  if (!isInside) {
    closeComments();
  }
});

//Swipe down to close comments 
  sheet.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
});
  sheet.addEventListener("touchend", (e) => {

  const endY = e.changedTouches[0].clientY;

  if (endY - startY > 80) {
    closeComments();
  }
});

  // Back button closes comments
window.addEventListener("popstate", () => {

  if (sheet.classList.contains("show")) {
    closeComments();
  }
});


  // Close function 

  function closeComments() {

  sheet.classList.remove("show");

  setTimeout(() => {
    sheet.classList.add("hidden");
  }, 200);
  }

  
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