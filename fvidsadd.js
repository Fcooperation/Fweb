let stream;
let currentFacingMode = "user";

const video = document.getElementById("camera");

const uploadBtn = document.getElementById("upload-btn");
const recordBtn = document.getElementById("record-btn");
const switchBtn = document.getElementById("switch-btn");

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
      audio: false
    });

    video.srcObject = stream;

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
    alert("File selected (ready to upload)");
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
      recordedBlob = new Blob(chunks, { type: "video/mp4" });
      alert("Recording done (ready to upload)");
    };

    mediaRecorder.start();
    recordBtn.textContent = "■ Stop";

  } else {

    mediaRecorder.stop();
    recordBtn.textContent = "● Record";
  }
};