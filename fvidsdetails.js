const draft = JSON.parse(localStorage.getItem("fvid_draft"));

const thumbnail = document.getElementById("thumbnail");
const postBtn = document.getElementById("post-btn");

const caption = document.getElementById("caption");
const details = document.getElementById("details");
const category = document.getElementById("category");
const language = document.getElementById("language");
const hashtags = document.getElementById("hashtags");

// load preview
thumbnail.src = draft?.thumbnail || "";

postBtn.onclick = () => {

  // get draft from previous page
  const draft = JSON.parse(localStorage.getItem("fvid_draft"));
  if (!draft) return;

  // -----------------------------
  // 1. BUILD FINAL PAYLOAD
  // -----------------------------
  const payload = {
    uploadId: draft.uploadId,

    video: draft.videoURL,
    thumbnail: draft.thumbnail,

    caption: caption.value,
    details: details.value,
    category: category.value,
    language: language.value,

    hashtags: hashtags.value
      ? hashtags.value.split(",").map(t => t.trim())
      : [],

    createdAt: Date.now(),
    status: "ready_to_upload"
  };

  // -----------------------------
  // 2. SAVE TO LOCAL STORAGE (UPLOAD QUEUE)
  // -----------------------------
  localStorage.setItem(
    payload.uploadId,
    JSON.stringify({
      status: "ready_to_upload",
      data: payload
    })
  );

  // track current item (for feed monitoring)
  localStorage.setItem("current_upload", payload.uploadId);

  // -----------------------------
  // 3. GO TO FEED (NO UPLOAD)
  // -----------------------------
  window.location.href = "fvids.html";
};