let stream;
let currentFacingMode = "user";

const video = document.getElementById("camera");

const uploadBtn = document.getElementById("upload-btn");
const recordBtn = document.getElementById("record-btn");
const switchBtn = document.getElementById("switch-btn");
const controls = document.getElementById("controls");

const previewScreen =
document.getElementById("preview-screen");

const previewVideo =
document.getElementById("preview-video");

// Post button 
const postBtn =
document.getElementById("post-btn");

// Cancel button 
const cancelBtn =
document.getElementById(
  "cancel-preview"
);

let mediaRecorder;
let chunks = [];
let recordedBlob = null;

/* ---------------- CAMERA ---------------- */

async function startCamera() {
  try {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: currentFacingMode }
      },
      audio: true
    });

    video.srcObject = stream;
    
    if (currentFacingMode === "user") {
  video.style.transform = "scaleX(-1)";
} else {
  video.style.transform = "scaleX(1)";
}

  } catch (err) {
    console.error(err);
    alert("Camera error");
  }
}

startCamera();

/* ---------------- SWITCH CAMERA ---------------- */

switchBtn.onclick = async () => {
  currentFacingMode =
    currentFacingMode === "user" ? "environment" : "user";

  await startCamera();
};

/* ---------------- UPLOAD ---------------- */

uploadBtn.onclick = () => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "video/*,image/*";

  input.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    recordedBlob = file;
    const url =
URL.createObjectURL(file);

showPreview(url);
  };

  input.click();
};

/* ---------------- RECORD (BASIC) ---------------- */

recordBtn.onclick = () => {
  if (!mediaRecorder || mediaRecorder.state === "inactive") {

    chunks = [];
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => chunks.push(e.data);

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(chunks);
      const url =
URL.createObjectURL(recordedBlob);

showPreview(url);
    };

    mediaRecorder.start();
    recordBtn.textContent = "■ Stop";

  } else {

    mediaRecorder.stop();
    recordBtn.textContent = "● Record";
  }
};

// Show preview 
function showPreview(url) {
  if (stream) {
  stream.getAudioTracks().forEach(track => {
    track.enabled = false;
  });
}

  previewVideo.src = url;

  // DON'T mirror preview
  previewVideo.style.transform = "scaleX(1)";

  previewScreen.style.display = "block";

  uploadBtn.style.display = "none";
  recordBtn.style.display = "none";
  switchBtn.style.display = "none";

  postBtn.style.display = "block";
}

// Post video function
postBtn.onclick = () => {

  if (!recordedBlob) return;

  // hide preview buttons
  postBtn.style.display = "none";
  cancelBtn.style.display = "none";
  controls.style.display = "none";

  // show upload UI
  document.getElementById("upload-overlay")
    .classList.remove("hidden");

  document.getElementById("details-sheet")
    .classList.remove("hidden");
};

// Cancel button function 
cancelBtn.onclick = () => {
  if (stream) {
  stream.getAudioTracks().forEach(track => {
    track.enabled = true;
  });
}

  previewVideo.pause();

  previewVideo.src = "";

  recordedBlob = null;

  previewScreen.style.display =
  "none";

  uploadBtn.style.display =
  "block";

  recordBtn.style.display =
  "block";

  switchBtn.style.display =
  "block";

  postBtn.style.display =
  "none";
};

// Confirm upload logic 
document.getElementById("confirm-upload").onclick = async () => {

  const category = document.getElementById("category").value;
  const language = document.getElementById("language").value;
  const hashtags = document.getElementById("hashtags").value;
  const details = document.getElementById("details").value;

  if (!recordedBlob) return;

  // ❗ HIDE SHEET FIRST
  document.getElementById("details-sheet").classList.add("hidden");

  // ❗ SHOW LOADER ONLY HERE (FIXED)
  document.getElementById("upload-loader").classList.remove("hidden");

  document.getElementById("upload-overlay").classList.remove("hidden");

  let percent = 0;
  const percentEl = document.getElementById("upload-percent");

  const interval = setInterval(() => {
    if (percent < 90) {
      percent += 5;
      percentEl.innerText = percent + "%";
    }
  }, 300);

  const formData = new FormData();
  formData.append("file", recordedBlob, "video.mp4");

  try {

    const res = await fetch("https://fweb-backend.onrender.com/fvids", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    clearInterval(interval);
    percentEl.innerText = "100%";

    if (!data.success) throw new Error("Upload failed");

    const uploadData = {
      video_url: data.video_url,
      category,
      language,
      hashtags: hashtags.split(",").map(t => t.trim()),
      details,
      createdAt: Date.now(),
      user_id: localStorage.getItem("account_id") || null
    };

    localStorage.setItem("last_upload", JSON.stringify(uploadData));

    setTimeout(() => {
      window.location.href = "fvids.html";
    }, 800);

  } catch (err) {

    clearInterval(interval);
    alert(err.message);

    document.getElementById("upload-loader").classList.add("hidden");
    document.getElementById("upload-overlay").classList.add("hidden");
  }
};