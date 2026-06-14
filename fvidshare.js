window.shareVideo = async function(video) {

  const videoId =
    video._id || video.id;

  const shareLink =
    `${window.location.origin}/watch.html?id=${videoId}`;

  try {

    if (navigator.share) {

      await navigator.share({
        title: "Watch on FVIDS",
        text: "Check out this video",
        url: shareLink
      });

    } else {

      await navigator.clipboard.writeText(
        shareLink
      );

      showShareToast(
        "Link copied"
      );
    }

  } catch (err) {

    console.error(
      "Share failed:",
      err
    );
  }
};

function showShareToast(message) {

  let toast =
    document.getElementById(
      "share-toast"
    );

  if (!toast) {

    toast =
      document.createElement("div");

    toast.id =
      "share-toast";

    document.body.appendChild(
      toast
    );

    toast.style.position =
      "fixed";

    toast.style.bottom =
      "80px";

    toast.style.left =
      "50%";

    toast.style.transform =
      "translateX(-50%)";

    toast.style.background =
      "#222";

    toast.style.color =
      "#fff";

    toast.style.padding =
      "10px 14px";

    toast.style.borderRadius =
      "8px";

    toast.style.zIndex =
      "99999";
  }

  toast.textContent =
    message;

  toast.style.display =
    "block";

  setTimeout(() => {

    toast.style.display =
      "none";

  }, 2000);
}