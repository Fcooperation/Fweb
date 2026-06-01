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

  const payload = {
    video: draft.video,
    thumbnail: draft.thumbnail,
    caption: caption.value,
    details: details.value,
    category: category.value,
    language: language.value,
    hashtags: hashtags.value.split(",").map(t => t.trim()),
    createdAt: Date.now()
  };

  // store upload task locally (for monitoring page)
  const uploadId = "fvid_" + Date.now();

  localStorage.setItem(uploadId, JSON.stringify({
    status: "uploading",
    data: payload
  }));

  localStorage.setItem("current_upload", uploadId);

  // send to backend (NON BLOCKING)
  fetch("https://fweb-backend.onrender.com/fvids", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(payload)
  }).then(res => res.json())
    .then(data => {

      localStorage.setItem(uploadId, JSON.stringify({
        status: "done",
        response: data
      }));

    }).catch(err => {

      localStorage.setItem(uploadId, JSON.stringify({
        status: "failed",
        error: err.message
      }));

    });

  // immediately go to feed page
  window.location.href = "fvids.html";
};