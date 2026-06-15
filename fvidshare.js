window.shareVideo = async function(video) {

  const publicId = video.public_id;

  const shareLink =
    `${window.location.origin}/watch?id=${publicId}`;

  try {

    let result = null;

    if (navigator.share) {

      await navigator.share({
        title: "Watch on FVIDS",
        text: "Check out this video",
        url: shareLink
      });

      result = await sendShare(publicId, "system_share");

    } else {

      await navigator.clipboard.writeText(shareLink);

      showShareToast("Link copied");

      result = await sendShare(publicId, "copy_link");
    }

    // ✅ update local data immediately
    if (result?.success) {
      video.share_count = result.share_count;

      // refresh UI
      const countEl = document.querySelector(
        `[data-public-id="${publicId}"] .share-count`
      );

      if (countEl) {
        countEl.textContent = result.share_count;
      }
    }

  } catch (err) {
    console.error("Share failed:", err);
  }
};

// Send to backend
async function sendShare(publicId, type) {
  try {
    const response = await fetch(
      "https://fweb-backend.onrender.com/fvids/share",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          publicId,
          type
        })
      }
    );

    return await response.json();

  } catch (err) {
    console.error("Share tracking failed:", err);
    return null;
  }
}