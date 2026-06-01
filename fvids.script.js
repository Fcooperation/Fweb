// TAB SWITCH (For You only for now)
function switchTab(tab) {

  const feed = document.getElementById("video-feed");
  const uploadQueue = document.getElementById("upload-queue");

  if (tab === "foryou") {

    feed.innerHTML = `
      <div style="text-align:center; margin-top:20px;">
        🎬 For You Videos Loading...
      </div>
    `;

  }

}

function createUploadItem() {

  const draft = JSON.parse(localStorage.getItem("fvid_draft"));
  if (!draft) return;

  const item = document.createElement("div");
  item.className = "upload-item";

  // -----------------------------
  // THUMBNAIL ONLY (NO FILE OBJECT)
  // -----------------------------
  const media = document.createElement("img");
  media.src = draft.thumbnail;
  media.className = "upload-thumb";

  const info = document.createElement("div");
  info.className = "upload-info";

  info.innerHTML = `
    <div>Ready to upload</div>
    <div class="upload-status">draft</div>
  `;

  item.appendChild(media);
  item.appendChild(info);

  uploadQueue.appendChild(item);

  return { item, info };
}