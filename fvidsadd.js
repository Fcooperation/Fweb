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

  const formData =
  new FormData();

  formData.append(
    "file",
    recordedBlob,
    "video.mp4"
  );

  try {

    postBtn.textContent =
    "Uploading...";

    const res =
    await fetch(
      "https://fweb-backend.onrender.com/fvids",
      {
        method: "POST",
        body: formData
      }
    );

    const data =
    await res.json();

    console.log(data);

    alert("Upload successful");

    location.reload();

  } catch (err) {

    console.error(err);

    alert("Upload failed");

    postBtn.textContent =
    "Post";
  }

};