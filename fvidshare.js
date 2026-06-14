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

    } else {

      await navigator.clipboard.writeText(shareLink);

      showShareToast("Link copied");
    }

  } catch (err) {
    console.error("Share failed:", err);
  }
};