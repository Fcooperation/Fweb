let stream;
let mediaRecorder;
let chunks = [];
let recordedBlob = null;

const video = document.getElementById("camera");
const recordBtn = document.getElementById("record-btn");
const fileInput = document.getElementById("file-input");
const uploadPicker = document.getElementById("upload-picker");
const previewContainer = document.getElementById("preview-container");
const previewVideo = document.getElementById("preview-video");
const postBtn = document.getElementById("post-btn");

/* ---------------- CAMERA START ---------------- */

async function startCamera() {
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    video.srcObject = stream;
  } catch (err) {
    alert("Camera access denied or not supported");
  }
}

startCamera();

/* ---------------- RECORD ---------------- */

recordBtn.onclick = () => {

  if (!mediaRecorder || mediaRecorder.state === "inactive") {

    chunks = [];

    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = e => {
      chunks.push(e.data);
    };

    mediaRecorder.onstop = () => {
      recordedBlob = new Blob(chunks, { type: "video/mp4" });

      const url = URL.createObjectURL(recordedBlob);
      previewVideo.src = url;

      previewContainer.style.display = "block";
    };

    mediaRecorder.start();

    recordBtn.classList.add("recording");
    recordBtn.textContent = "■";

  } else {

    mediaRecorder.stop();

    recordBtn.classList.remove("recording");
    recordBtn.textContent = "●";
  }
};

/* ---------------- FILE PICK ---------------- */

uploadPicker.onclick = () => {
  fileInput.click();
};

fileInput.onchange = (e) => {
  const file = e.target.files[0];
  if (!file) return;

  recordedBlob = file;

  const url = URL.createObjectURL(file);
  previewVideo.src = url;

  previewContainer.style.display = "block";
};

/* ---------------- POST ---------------- */

postBtn.onclick = async () => {

  if (!recordedBlob) {
    alert("No video selected");
    return;
  }

  const formData = new FormData();
  formData.append("file", recordedBlob);

  try {

    const res = await fetch("https://fweb-backend.onrender.com/fvid/upload", {
      method: "POST",
      body: formData
    });

    const data = await res.json();

    alert("Upload successful!");

    console.log(data);

  } catch (err) {
    alert("Upload failed");
    console.error(err);
  }
};