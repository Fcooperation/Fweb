let stream;

const video = document.getElementById("camera");

/* ---------------- START CAMERA ---------------- */

async function startCamera() {
  try {

    stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: "user" // front camera by default
      },
      audio: false // no noise, clean video
    });

    video.srcObject = stream;

  } catch (err) {
    console.error("Camera error:", err);
    alert("Camera not available or permission denied");
  }
}

startCamera();