const DEFAULTS = {
  apiBaseUrl: "http://localhost:3000",
  trackingEnabled: true,
  pendingEvents: [],
};

async function settings() {
  // `get(DEFAULTS)` only returns the keys present in DEFAULTS. That silently
  // excluded the saved device token, so a successful pairing looked unpaired
  // after the popup re-rendered and event delivery never started.
  return { ...DEFAULTS, ...(await chrome.storage.local.get(null)) };
}

async function saveEvents(events) {
  // Keep a bounded local queue so an offline session cannot grow storage forever.
  await chrome.storage.local.set({ pendingEvents: events.slice(-200) });
}

async function flushEvents() {
  const config = await settings();
  if (!config.trackingEnabled || !config.deviceToken || !config.pendingEvents.length) return { sent: 0 };
  try {
    const response = await fetch(`${config.apiBaseUrl.replace(/\/$/, "")}/api/v1/events/batch`, {
      method: "POST",
      headers: { Authorization: `Bearer ${config.deviceToken}`, "Content-Type": "application/json" },
      body: JSON.stringify({ events: config.pendingEvents.slice(0, 50) }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(body.error || `Sync failed (${response.status}).`);
    await saveEvents(config.pendingEvents.slice(Math.min(50, config.pendingEvents.length)));
    await chrome.storage.local.set({ lastSyncAt: new Date().toISOString(), lastError: "" });
    return { sent: body.accepted ?? 0 };
  } catch (error) {
    await chrome.storage.local.set({ lastError: error instanceof Error ? error.message : "Unable to reach ReelTrack." });
    return { sent: 0, error: "queued" };
  }
}

async function pair({ apiBaseUrl, code, deviceName }) {
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/v1/devices/pair/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.trim().toUpperCase(), deviceName: deviceName.trim() || "Chrome on this device", type: "BROWSER_EXTENSION" }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || "Pairing failed.");
  await chrome.storage.local.set({ apiBaseUrl: apiBaseUrl.replace(/\/$/, ""), deviceToken: body.token, device: body.device, lastError: "", lastPairingAt: new Date().toISOString() });
  const persisted = await chrome.storage.local.get(["deviceToken"]);
  if (persisted.deviceToken !== body.token) throw new Error("Chrome could not save this device pairing. Check that extension storage is enabled.");
  return body.device;
}

chrome.runtime.onInstalled.addListener(() => chrome.alarms.create("reeltrack-flush", { periodInMinutes: 5 }));
chrome.alarms.onAlarm.addListener((alarm) => { if (alarm.name === "reeltrack-flush") void flushEvents(); });

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  (async () => {
    if (message.type === "PLAYBACK_EVENT") {
      const config = await settings();
      if (!config.trackingEnabled) return { ignored: true };
      await saveEvents([...config.pendingEvents, message.event]);
      await chrome.storage.local.set({ lastEventAt: new Date().toISOString() });
      return flushEvents();
    }
    if (message.type === "PAIR") return { device: await pair(message) };
    if (message.type === "STATUS") {
      const config = await settings();
      return { paired: Boolean(config.deviceToken), enabled: config.trackingEnabled, device: config.device, pending: config.pendingEvents.length, lastPairingAt: config.lastPairingAt, lastEventAt: config.lastEventAt, lastSyncAt: config.lastSyncAt, lastError: config.lastError, apiBaseUrl: config.apiBaseUrl };
    }
    if (message.type === "SET_ENABLED") { await chrome.storage.local.set({ trackingEnabled: Boolean(message.enabled) }); return { ok: true }; }
    if (message.type === "UNPAIR") { await chrome.storage.local.remove(["deviceToken", "device"]); return { ok: true }; }
    return { ok: false };
  })().then(sendResponse).catch((error) => sendResponse({ error: error instanceof Error ? error.message : "Unexpected extension error." }));
  return true;
});
