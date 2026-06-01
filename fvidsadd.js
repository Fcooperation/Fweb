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
postBtn.onclick = async () => {

  if (!recordedBlob) return;

  postBtn.textContent = "Processing...";

  // 1. CREATE VIDEO URL
  const videoURL = URL.createObjectURL(recordedBlob);

  // 2. CREATE THUMBNAIL
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  const tempVideo = document.createElement("video");
  tempVideo.src = videoURL;
  tempVideo.currentTime = 1; // capture at 1 sec

  await new Promise(resolve => {
    tempVideo.onloadeddata = () => resolve();
  });

  canvas.width = tempVideo.videoWidth;
  canvas.height = tempVideo.videoHeight;

  ctx.drawImage(tempVideo, 0, 0, canvas.width, canvas.height);

  const thumbnail = canvas.toDataURL("image/jpeg", 0.7);

  // 3. SAVE TEMP DATA
  const fvidDraft = {
    video: videoURL,
    thumbnail: thumbnail,
    createdAt: Date.now()
  };

  localStorage.setItem("fvid_draft", JSON.stringify(fvidDraft));

  // 4. GO TO DETAILS PAGE
  window.location.href = "fvidsdetails.html";
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