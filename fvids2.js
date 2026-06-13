document.addEventListener("DOMContentLoaded", () => {

  let currentVideoId = null;
  let currentVideoUrl = null;
  let sheet;
let startY = 0;
  let commentPage = 1;
let commentHasMore = true;
let loadingComments = false;

  sheet = document.getElementById("comments-sheet");

  // ---------------- OPEN COMMENTS ----------------
  window.openComments = function(videoId, videoUrl) {

  currentVideoId = videoId;
  currentVideoUrl = videoUrl;

  commentPage = 1;
  commentHasMore = true;

  document.getElementById("comments-list").innerHTML = "";

  document.getElementById("comments-sheet")
    .classList.remove("hidden");

  setTimeout(() => {
    document.getElementById("comments-sheet")
      .classList.add("show");

    history.pushState({ commentsOpen: true }, "");
  }, 10);

  loadComments(videoId, 1);
};

  // ---------------- LOAD COMMENTS ----------------
  async function loadComments(videoId, page = 1, append = false) {

  if (loadingComments || !commentHasMore) return;

  loadingComments = true;

  const list = document.getElementById("comments-list");
  const noComments = document.getElementById("no-comments");

  try {

    const res = await fetch(
      `https://fweb-backend.onrender.com/fvids/comments?videoId=${videoId}&page=${page}&limit=20`
    );

    const data = await res.json();

    const comments = data.comments || [];

    if (!append) list.innerHTML = "";

    if (comments.length === 0 && page === 1) {
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
        <div style="font-size:11px;opacity:0.6;">
          ${c.username}
        </div>
      `;

      list.appendChild(div);
    });

    commentHasMore = data.hasMore;

  } catch (err) {
    console.error("comments load error:", err);
  } finally {
    loadingComments = false;
  }
}

  // Scroll to load more comments 
  document.getElementById("comments-list").addEventListener("scroll", () => {

  const list = document.getElementById("comments-list");

  if (
    list.scrollTop + list.clientHeight >= list.scrollHeight - 20
  ) {
    if (commentHasMore && !loadingComments) {
      commentPage++;
      loadComments(currentVideoId, commentPage, true);
    }
  }
});

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