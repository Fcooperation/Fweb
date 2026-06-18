let stream;
let currentFacingMode = "user";

const video = document.getElementById("camera");

const uploadBtn = document.getElementById("upload-btn");
const recordBtn = document.getElementById("record-btn");
const switchBtn = document.getElementById("switch-btn");
const controls = document.getElementById("controls");

function getCurrentUser() {
  return JSON.parse(localStorage.getItem("faccount"));
}

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

  const btn = document.getElementById("confirm-upload");

  const category = document.getElementById("category").value;
  const language = document.getElementById("language").value;
  const hashtags = document.getElementById("hashtags").value;
  const details = document.getElementById("details").value;

  if (!recordedBlob) return;

  btn.disabled = true;
  btn.textContent = "Uploading... 0%";

  const formData = new FormData();

formData.append("file", recordedBlob, "video.mp4");

// 🔥 ADD ALL METADATA
formData.append("category", category);
formData.append("language", language);
formData.append("details", details);
const user = getCurrentUser();

if (!user) {
  alert("You must be logged in to upload");
  window.location.href = "login.html";
  return;
}

formData.append("user_id", user.id || user.user_id || "");

// hashtags must be string (IMPORTANT for FormData)
formData.append(
  "hashtags",
  JSON.stringify(
    hashtags.split(",").map(t => t.trim())
  )
);

  const xhr = new XMLHttpRequest();

  // REAL upload progress
  xhr.upload.onprogress = (e) => {

    if (e.lengthComputable) {

      const percent = Math.round(
        (e.loaded / e.total) * 100
      );

      btn.textContent =
        `Uploading... ${percent}%`;
    }
  };

  xhr.onload = () => {

    try {

      const data =
        JSON.parse(xhr.responseText);

      if (
        xhr.status !== 200 ||
        !data.success
      ) {
        throw new Error(
          data.error || "Upload failed"
        );
      }

      btn.textContent = "Uploaded ✓";

      const uploadData = {
        video_url: data.video_url,
        public_id: data.public_id,
        category,
        language,
        hashtags: hashtags
          .split(",")
          .map(t => t.trim()),
        details,
        createdAt: Date.now(),
        user_id:
          localStorage.getItem(
            "account_id"
          ) || null
      };

      localStorage.setItem(
        "last_upload",
        JSON.stringify(uploadData)
      );

      setTimeout(() => {
        window.location.href =
          "fvids.html";
      }, 1000);

    } catch (err) {

      btn.disabled = false;
      btn.textContent =
        "Post Video";

      alert(err.message);
    }
  };

  xhr.onerror = () => {

    btn.disabled = false;
    btn.textContent =
      "Post Video";

    alert(
      "Network error. Upload failed."
    );
  };

  xhr.open(
    "POST",
    "https://fweb-backend.onrender.com/fvids"
  );

  xhr.send(formData);
};

// Category Input 
const categoryInput =
  document.getElementById("category");

document
  .querySelectorAll(".category-card")
  .forEach(card => {

    card.addEventListener("click", () => {

      document
        .querySelectorAll(".category-card")
        .forEach(c => c.classList.remove("active"));

      card.classList.add("active");

      categoryInput.value = card.dataset.value;
    });

  });

const trigger = document.getElementById("category-trigger");
const grid = document.getElementById("category-grid");
const hiddenInput = document.getElementById("category");
const selectedText = document.getElementById("selected-category-text");

// OPEN / CLOSE GRID
trigger.onclick = () => {
  grid.classList.toggle("show");
};

// CATEGORY SELECTION
document.querySelectorAll(".category-card").forEach(card => {
  card.addEventListener("click", () => {

    const value = card.dataset.value;
    const label =
      card.querySelector(".category-name")?.textContent ||
      card.textContent.trim();

    hiddenInput.value = value;

    trigger.textContent = label;

    selectedText.textContent = `Selected: ${label}`;
    selectedText.style.display = "block";

    grid.classList.remove("show");
  });
});