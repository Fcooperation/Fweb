// ---------------- VIDEO FEED STATE ----------------
const feed = document.getElementById("video-feed");
const uploadQueue = document.getElementById("upload-queue");
const videoCache = {};

function isLoggedIn() {
  return !!localStorage.getItem("faccount");
}

let videos = [];
let currentIndex = 0;

// ---------------- TAB SWITCH ----------------
function switchTab(tab) {

  if (tab === "foryou") {
    feed.innerHTML = `
      <div style="text-align:center; margin-top:20px; color:white;">
        🎬 Loading For You...
      </div>
    `;

    loadVideos();
  }
}

// ---------------- LOAD VIDEOS FROM BACKEND ----------------
async function loadVideos() {

  try {

    feed.innerHTML = `
      <div style="text-align:center; margin-top:20px; color:white;">
        🎬 Fetching videos...
      </div>
    `;

    const res = await fetch("https://fweb-backend.onrender.com/fvids");
    videos = await res.json();

    if (!videos || videos.length === 0) {
      feed.innerHTML = `
        <div style="text-align:center; margin-top:20px; color:white;">
          No videos found
        </div>
      `;
      return;
    }

    currentIndex = 0;
    renderVideo(currentIndex);

  } catch (err) {
    console.error(err);
    feed.innerHTML = `
      <div style="text-align:center; margin-top:20px; color:white;">
        Error loading videos
      </div>
    `;
  }
}

// ---------------- RENDER SINGLE VIDEO ----------------
function renderVideo(index, direction = "next") {

  const vid = videos[index];
  if (!vid) return;

  const wrapper = document.createElement("div");
  wrapper.className = "video-wrapper";

  let video;

if (videoCache[vid.video_url]) {

  video = videoCache[vid.video_url];

} else {

  video = document.createElement("video");
  video.src = vid.video_url;
}

video.className = "video";
video.loop = true;
video.muted = false;
video.playsInline = true;
video.autoplay = true;

  wrapper.appendChild(video);

  // animation
  wrapper.style.transform = direction === "next"
    ? "translateY(100%)"
    : "translateY(-100%)";

  wrapper.style.transition = "transform 0.25s ease";

  feed.innerHTML = "";
  feed.appendChild(wrapper);

  requestAnimationFrame(() => {
    wrapper.style.transform = "translateY(0)";
  });

  video.play().catch(() => {});

// preload next videos
preloadVideos(index);
}
// ---------------- SWIPE LOGIC ----------------
let startY = 0;
let isSwiping = false;

document.addEventListener("touchstart", (e) => {
  startY = e.touches[0].clientY;
  isSwiping = true;
}, { passive: true });

document.addEventListener("touchmove", (e) => {
  if (!isSwiping) return;

  // 🔥 STOP browser scroll
  e.preventDefault();
}, { passive: false });

document.addEventListener("touchend", (e) => {

  if (!isSwiping) return;
  isSwiping = false;

  let endY = e.changedTouches[0].clientY;
  let diff = startY - endY;

  // swipe up → next
  if (diff > 60) {
    nextVideo();
  }

  // swipe down → previous
  if (diff < -60) {
    prevVideo();
  }
});

// ---------------- NAVIGATION ----------------
function nextVideo() {
  if (currentIndex < videos.length - 1) {
    currentIndex++;
    renderVideo(currentIndex, "next");
  }
}

function prevVideo() {
  if (currentIndex > 0) {
    currentIndex--;
    renderVideo(currentIndex, "prev");
  }
}

// Preload vid function 
function preloadVideos(startIndex) {

  for (let i = 1; i <= 3; i++) {

    const nextIndex = startIndex + i;

    if (!videos[nextIndex]) continue;

    const url = videos[nextIndex].video_url;

    if (videoCache[url]) continue;

    const preloadVideo = document.createElement("video");

    preloadVideo.src = url;
    preloadVideo.preload = "auto";
    preloadVideo.muted = true;

    preloadVideo.load();

    videoCache[url] = preloadVideo;

    console.log("Preloading:", url);
  }
}

// ---------------- UPLOAD QUEUE (DRAFT UI) ----------------
function createUploadItem() {

  const draft = JSON.parse(localStorage.getItem("fvid_draft"));
  if (!draft) return;

  const item = document.createElement("div");
  item.className = "upload-item";

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

// Plus button logic 
function handlePlusClick(e) {

  if (!isLoggedIn()) {
    showToast("Must sign-in to access this feature");
    return;
  }

  window.location.href = "fvidsadd.html";
}

// toast message 
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

// ---------------- INIT ----------------
window.onload = () => {
  createUploadItem();
  loadVideos(); // auto load For You feed
};