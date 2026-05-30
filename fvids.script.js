// TAB SWITCH (For You only for now)
function switchTab(tab) {

  const feed = document.getElementById("video-feed");

  if (tab === "foryou") {

    feed.innerHTML = `
      <div style="text-align:center; margin-top:20px;">
        🎬 For You Videos Loading...
      </div>
    `;

  }

}