# ReelTrack AutoSync for YouTube

This is an unpacked Manifest V3 Chrome extension for the local AutoSync MVP.
It observes playback only on `youtube.com/watch` pages and sends video ID,
title, channel name, progress, duration, timestamp, and page URL to a paired
ReelTrack account. It never reads passwords, messages, payments, page text, or
unrelated browsing history.

## Load it locally

1. Start ReelTrack locally on `http://localhost:3000` and apply the AutoSync
   migration first.
2. In ReelTrack, open **AutoSync** and generate a pairing code.
3. In Chrome, open `chrome://extensions`, enable **Developer mode**, choose
   **Load unpacked**, and select this directory.
4. Open the extension, keep the local address (or enter the deployed app URL),
   enter the one-time pairing code, and pair the browser.
5. Play a YouTube video on desktop. Events are queued offline and retried every
   five minutes; an active event also attempts an immediate sync.

The extension currently records YouTube activity as a video. It deliberately
does not claim that every YouTube video is a ReelTrack movie or episode; any
unmatched item stays in AutoSync review until a future matcher can verify it.
