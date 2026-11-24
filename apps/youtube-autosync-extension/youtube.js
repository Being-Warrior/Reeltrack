let currentVideo;
let currentVideoId = "";
let lastProgressAt = 0;
let lastProgressPosition = 0;

function videoId() {
  const url = new URL(location.href);
  if (url.pathname === "/watch") return url.searchParams.get("v") || "";
  const match = url.pathname.match(/^\/(?:shorts|embed|live)\/([^/?]+)/);
  return match?.[1] || "";
}
function linkedReelTrackTitleId() {
  const value = new URL(location.href).searchParams.get("reeltrackTitle");
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value || "") ? value : undefined;
}
function isReelTrackTrailer() { return new URL(location.href).searchParams.get("reeltrackTrailer") === "1"; }
function title() { return document.querySelector("h1 yt-formatted-string")?.textContent?.trim() || document.querySelector(".ytp-title-link")?.textContent?.trim() || document.title.replace(/\s*-\s*YouTube$/, "").trim(); }
function channel() { return document.querySelector("ytd-channel-name a")?.textContent?.trim(); }

function send(eventType) {
  if (!currentVideo || !currentVideoId) return;
  const now = Date.now();
  const positionSeconds = Math.floor(currentVideo.currentTime || 0);
  if (eventType === "PROGRESS" && (now - lastProgressAt < 30_000 || positionSeconds - lastProgressPosition < 20)) return;
  lastProgressAt = now;
  lastProgressPosition = positionSeconds;
  chrome.runtime.sendMessage({
    type: "PLAYBACK_EVENT",
    event: {
      eventKey: `youtube-${currentVideoId}-${eventType}-${now}-${Math.random().toString(36).slice(2, 8)}`,
      eventType,
      mediaType: "VIDEO",
      providerContentId: `youtube:${currentVideoId}`,
      title: title(),
      positionSeconds,
      durationSeconds: Number.isFinite(currentVideo.duration) ? Math.floor(currentVideo.duration) : undefined,
      sourceUrl: location.href,
      occurredAt: new Date(now).toISOString(),
      payload: { channelName: channel(), reeltrackTitleId: linkedReelTrackTitleId(), reeltrackTrailer: isReelTrackTrailer() },
    },
  });
}

function attach() {
  const id = videoId();
  const video = document.querySelector("video");
  if (!video || (video === currentVideo && id === currentVideoId)) return;
  if (currentVideo) {
    currentVideo.removeEventListener("play", onPlay);
    currentVideo.removeEventListener("pause", onPause);
    currentVideo.removeEventListener("timeupdate", onProgress);
    currentVideo.removeEventListener("ended", onEnded);
  }
  currentVideo = video;
  currentVideoId = id;
  lastProgressAt = 0;
  lastProgressPosition = 0;
  video.addEventListener("play", onPlay);
  video.addEventListener("pause", onPause);
  video.addEventListener("timeupdate", onProgress);
  video.addEventListener("ended", onEnded);
  // The extension may be installed or paired after playback has already begun.
  // Record that active player on the next tick rather than waiting for another play click.
  setTimeout(() => { if (video === currentVideo && !video.paused) send("PROGRESS"); }, 1_000);
}
function onPlay() { send(lastProgressPosition ? "PROGRESS" : "STARTED"); }
function onPause() { if (!currentVideo?.ended) send("PAUSED"); }
function onProgress() { send("PROGRESS"); }
function onEnded() { send("COMPLETED"); }

attach();
document.addEventListener("yt-navigate-finish", attach);
setInterval(attach, 2_000);
