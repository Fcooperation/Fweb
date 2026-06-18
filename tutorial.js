window.loadTutorialVideos = async function (
  page = 1,
  append = false
) {
  try {

    const account =
      JSON.parse(localStorage.getItem("faccount")) || {};

    const userId =
      account.userId || account.id;

    const res = await fetch(
      `https://fweb-backend.onrender.com/fvids/tutorials?userId=${userId || ""}&page=${page}`
    );

    const newVideos = await res.json();

    if (!newVideos || newVideos.length === 0) {

      hasMoreVideos = false;

      if (!append) {
        feed.innerHTML = `
          <div style="text-align:center; margin-top:20px; color:white;">
            No tutorials found
          </div>
        `;
      }

      return;
    }

    if (!append) {
      videos = newVideos;
      currentIndex = 0;
      renderVideo(0);
    } else {
      videos.push(...newVideos);
    }

  } catch (err) {

    console.error(err);

    feed.innerHTML = `
      <div style="text-align:center; margin-top:20px; color:white;">
        Failed to load tutorials
      </div>
    `;
  }
};