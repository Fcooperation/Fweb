window.shareVideo = async function(video) {

  const publicId = video.public_id;

  const shareLink =
    `${window.location.origin}/watch.html?id=${publicId}`;

  try {

    if (navigator.share) {

      await navigator.share({
        title: "Watch on FVIDS",
        text: "Check out this video",
        url: shareLink
      });

      // ✅ count share (native share = real intent)
      await sendShare(publicId, "system_share");

    } else {

      await navigator.clipboard.writeText(shareLink);

      showShareToast("Link copied");

      // ✅ count copy link as share
      await sendShare(publicId, "copy_link");
    }

  } catch (err) {
    console.error("Share failed:", err);
  }
};

// Send to backend
async function sendShare(publicId, type) {
  try {
    await fetch("https://fweb-backend.onrender.com/fvids/share", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        publicId,
        type
      })
    });
  } catch (err) {
    console.error("Share tracking failed:", err);
  }
}