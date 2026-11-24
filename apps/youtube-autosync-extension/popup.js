const $ = (selector) => document.querySelector(selector);
const message = (text, error = false) => { $("#message").textContent = text || ""; $("#message").style.color = error ? "#e88972" : "#b9b1a7"; };

async function call(messageBody) { return chrome.runtime.sendMessage(messageBody); }
async function render() {
  const status = await call({ type: "STATUS" });
  $("#apiBaseUrl").value = status.apiBaseUrl || "http://localhost:3000";
  $("#pairing").hidden = status.paired;
  $("#connected").hidden = !status.paired;
  $("#status").textContent = status.paired ? `Connected as ${status.device?.name || "this browser"}` : "Pair this browser from your ReelTrack AutoSync page.";
  $("#enabled").checked = Boolean(status.enabled);
  $("#details").textContent = status.lastError ? `Queued: ${status.lastError}` : `${status.pending || 0} event(s) waiting${status.lastPairingAt ? ` · paired ${new Date(status.lastPairingAt).toLocaleTimeString()}` : ""}${status.lastEventAt ? ` · playback seen ${new Date(status.lastEventAt).toLocaleTimeString()}` : ""}${status.lastSyncAt ? ` · synced ${new Date(status.lastSyncAt).toLocaleTimeString()}` : ""}`;
}
$("#pair").addEventListener("click", async () => {
  message("");
  try {
    const result = await call({ type: "PAIR", apiBaseUrl: $("#apiBaseUrl").value, code: $("#code").value, deviceName: $("#deviceName").value });
    if (result.error) throw new Error(result.error);
    await render(); message("Browser paired. Open a YouTube video to start tracking.");
  } catch (error) { message(error.message || "Pairing failed.", true); }
});
$("#enabled").addEventListener("change", async (event) => { await call({ type: "SET_ENABLED", enabled: event.target.checked }); await render(); });
$("#unpair").addEventListener("click", async () => { await call({ type: "UNPAIR" }); await render(); message("Browser disconnected locally."); });
void render();
