document.addEventListener("DOMContentLoaded", () => {

  let currentVideoId = null;
  let currentVideoUrl = null;
  let sheet;
let startY = 0;
  let commentPage = 1;
let commentHasMore = true;
let loadingComments = false;
  
const COMMENT_PREVIEW_LENGTH = 120;
const USERNAME_LIMIT = 16;
  
  sheet = document.getElementById("comments-sheet");

  // Reload Button 
  const reloadBtn =
  document.getElementById("reload-page-btn");

if (reloadBtn) {

  reloadBtn.addEventListener(
    "click",
    () => {

      reloadBtn.disabled = true;

      reloadBtn.textContent =
        "Reloading...";

      location.reload();
    }
  );
}

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
    const spinner =
  document.getElementById("comments-loading");

spinner.classList.remove("hidden");

  try {

    const res = await fetch(
      `https://fweb-backend.onrender.com/fvids/comments?videoId=${videoId}&page=${page}&limit=20`
    );

    const data = await res.json();

    spinner.classList.add("hidden");

    const comments = data.comments || [];

    if (!append) list.innerHTML = "";

    if (comments.length === 0 && page === 1) {

  noComments.style.display = "block";

  commentHasMore = false;

  spinner.classList.add("hidden");

  loadingComments = false;

  return;
}

    noComments.style.display = "none";

    comments.forEach(c => {

  const div = document.createElement("div");

  div.className = "comment-item";

  let username = c.username || "Unknown";

  if (username.length > USERNAME_LIMIT) {
    username =
      username.slice(0, USERNAME_LIMIT) + "...";
  }

  const account =
    JSON.parse(
      localStorage.getItem("faccount")
    ) || {};

  const myId =
    account.userId || account.id;

  if (String(myId) === String(c.userId)) {
    username = "You";
  }

  let creatorBadge = "";

  if (
    String(c.userId) ===
    String(c.creatorId)
  ) {
    creatorBadge =
      `<span class="creator-badge">
        (creator)
      </span>`;
  }

  const fullText = c.text || "";

  let previewText = fullText;

  let readMoreHTML = "";

  if (
    fullText.length >
    COMMENT_PREVIEW_LENGTH
  ) {

    previewText =
      fullText.slice(
        0,
        COMMENT_PREVIEW_LENGTH
      ) + "...";

    readMoreHTML = `
  <span
    class="read-more-btn"
    data-full="${encodeURIComponent(fullText)}">
    Read more
  </span>
`;
  }

  div.innerHTML = `
    <div class="comment-username">
      ${username}
      ${creatorBadge}
    </div>

    <div class="comment-text">
      ${previewText}
    </div>

    ${readMoreHTML}
  `;

  list.appendChild(div);
});

    commentHasMore = data.hasMore;

  } catch (err) {
    console.error("comments load error:", err);
  } finally {
    spinner.classList.add("hidden");
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

  // Readmore logic 
  document.addEventListener("click", (e) => {

  if (!e.target.classList.contains("read-more-btn")) {
    return;
  }

  e.stopPropagation();

  const btn = e.target;

  const fullText = decodeURIComponent(
    btn.dataset.full
  );

  const commentText =
    btn.parentElement.querySelector(".comment-text");

  if (!commentText) return;

  commentText.textContent = fullText;

  btn.remove();
});

  // ---------------- POST COMMENT ----------------
  const postBtn =
  document.getElementById("post-comment");

let postingComment = false;

  postBtn.addEventListener("click", async () => {

    if (postingComment) return;



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

    postingComment = true;

postBtn.disabled = true;
postBtn.textContent = "Posting...";

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

      div.className = "comment-item";

      div.innerHTML = `
        <div style="font-size:14px;color:white;">
          ${text}
        </div>
        <div class="comment-username">
  You
</div>
      `;

      list.prepend(div);

      // Update comment count UI
const commentCount =
  document.querySelector(".comment-count");

if (commentCount) {

  let current =
    parseInt(commentCount.textContent || "0");

  const updated = current + 1;

  commentCount.textContent = updated;
}

// Update in-memory video object
const currentVideo =
  videos.find(v =>
    String(v.id || v._id) ===
    String(currentVideoId)
  );

if (currentVideo) {

  currentVideo.comment_count =
    (currentVideo.comment_count || 0) + 1;
}

      document.getElementById(
        "no-comments"
      ).style.display = "none";

      input.value = "";

    } catch (err) {

      console.error(err);

      showToast(
        err.message || "Failed to post comment"
      );
    } finally {

  postingComment = false;

  postBtn.disabled = false;

  postBtn.textContent = "Post";
    }

  });

  // Close comments section 
  document.addEventListener("click", (e) => {

  // Ignore Read more clicks
  if (e.target.closest(".read-more-btn")) {
    return;
  }

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