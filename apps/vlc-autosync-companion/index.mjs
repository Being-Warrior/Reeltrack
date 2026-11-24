#!/usr/bin/env node

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import { dirname, basename, join } from "node:path";

const CONFIG_PATH = join(homedir(), ".reeltrack-autosync", "vlc.json");
const VLC_CONFIG_PATH = join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "vlc", "vlcrc");
const POLL_MS = 10_000;
const PROGRESS_SECONDS = 30;

function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : fallback;
}

function cleanUrl(value) {
  return value.replace(/\/$/, "");
}

async function saveConfig(config) {
  await mkdir(dirname(CONFIG_PATH), { recursive: true });
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), { encoding: "utf8", mode: 0o600 });
}

async function loadConfig() {
  try { return JSON.parse(await readFile(CONFIG_PATH, "utf8")); } catch { throw new Error("VLC is not paired yet. Run the pair command first."); }
}

function updateVlcSetting(contents, key, value) {
  const expression = new RegExp(`^#?${key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=.*$`, "m");
  const line = `${key}=${value}`;
  return expression.test(contents) ? contents.replace(expression, line) : `${contents.trimEnd()}\n${line}\n`;
}

async function configureLocalVlc() {
  let contents;
  try { contents = await readFile(VLC_CONFIG_PATH, "utf8"); }
  catch { throw new Error("VLC preferences were not found. Open VLC once, save Preferences, close VLC, then run setup again."); }
  const backupPath = `${VLC_CONFIG_PATH}.reeltrack-backup-${Date.now()}`;
  await copyFile(VLC_CONFIG_PATH, backupPath);
  const password = randomBytes(24).toString("base64url");
  let updated = updateVlcSetting(contents, "http-password", password);
  updated = updateVlcSetting(updated, "http-host", "127.0.0.1");
  updated = updateVlcSetting(updated, "extraintf", "lua:http");
  await writeFile(VLC_CONFIG_PATH, updated, "utf8");
  return { password, backupPath };
}

function mediaName(value = "") {
  // Only strip genuine media extensions. `path.extname("Project.UFO")` treats
  // `.UFO` as an extension even though it is part of the title.
  return basename(value)
    .replace(/\.(?:3gp|avi|m2ts|m4v|mkv|mov|mp4|mpeg|mpg|ts|webm|wmv)$/i, "")
    .replace(/[._]/g, " ")
    .replace(/\[(?:[\s\S]*?)\]|\((?:1080p|720p|2160p|web[- ]?dl|bluray|x26[45]|hevc|h\.264)[^)]*\)/gi, " ")
    .replace(/\b(19|20)\d{2}\b.*$/g, " ")
    .replace(/\b(?:1080p|720p|2160p|4k|web[- ]?dl|bluray|webrip|x26[45]|hevc|aac|dts)\b.*$/gi, " ")
    .replace(/\s+/g, " ").trim();
}

function classifyMedia(fileName) {
  const raw = basename(fileName || "Untitled");
  const withoutExtension = raw.replace(/\.(?:3gp|avi|m2ts|m4v|mkv|mov|mp4|mpeg|mpg|ts|webm|wmv)$/i, "");
  const episode = withoutExtension.match(/^(.*?)[ ._-]+S(\d{1,2})E(\d{1,3})\b/i) ?? withoutExtension.match(/^(.*?)[ ._-]+(\d{1,2})x(\d{1,3})\b/i);
  if (episode) {
    return { mediaType: "TV_EPISODE", seriesTitle: mediaName(episode[1]), seasonNumber: Number(episode[2]), episodeNumber: Number(episode[3]), title: undefined };
  }
  return { mediaType: "MOVIE", title: mediaName(raw), seriesTitle: undefined, seasonNumber: undefined, episodeNumber: undefined };
}

async function pair() {
  const appUrl = cleanUrl(option("--app", "http://localhost:3000"));
  const code = option("--code");
  const deviceName = option("--name", "VLC on this computer");
  if (!code) throw new Error("Use: pair --code YOUR_CODE [--app http://localhost:3000] [--name \"My VLC\"]");
  const localVlc = await configureLocalVlc();
  const response = await fetch(`${appUrl}/api/v1/devices/pair/claim`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: code.toUpperCase(), deviceName, type: "DESKTOP_COMPANION" }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok || !body.token) throw new Error(body.error || "VLC pairing failed.");
  await saveConfig({ appUrl, deviceToken: body.token, device: body.device, vlcPassword: localVlc.password, vlcUrl: "http://127.0.0.1:8080" });
  console.log(`Paired ${body.device.name}. VLC is configured for this companion only on localhost.`);
  console.log(`A backup of your previous VLC preferences was created at ${localVlc.backupPath}. Restart VLC before tracking.`);
}

async function readVlc(vlcUrl, password) {
  const authorization = `Basic ${Buffer.from(`:${password}`).toString("base64")}`;
  const response = await fetch(`${cleanUrl(vlcUrl)}/requests/status.json`, { headers: { Authorization: authorization } });
  if (!response.ok) throw new Error(`VLC HTTP returned ${response.status}. Check that VLC Web is enabled and VLC_PASSWORD is correct.`);
  return response.json();
}

async function sendEvent(config, event) {
  const response = await fetch(`${config.appUrl}/api/v1/events/batch`, {
    method: "POST",
    headers: { Authorization: `Bearer ${config.deviceToken}`, "Content-Type": "application/json" },
    body: JSON.stringify({ events: [event] }),
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.error || `ReelTrack returned ${response.status}.`);
}

async function watch() {
  const config = await loadConfig();
  const vlcUrl = option("--vlc", config.vlcUrl || "http://127.0.0.1:8080");
  const password = config.vlcPassword || process.env.VLC_PASSWORD;
  if (!password) throw new Error("Run the Pair option once so the companion can configure local VLC access.");
  let activeId = "";
  let previousState = "";
  let lastProgress = 0;
  console.log(`Watching local VLC at ${vlcUrl}. Press Ctrl+C to stop.`);

  async function poll() {
    const status = await readVlc(vlcUrl, password);
    const meta = status.information?.category?.meta ?? {};
    const fileName = meta.filename || meta.title || status.title || "";
    if (!fileName || status.length <= 0) return;
    const id = createHash("sha256").update(String(status.information?.category?.meta?.url || fileName)).digest("hex").slice(0, 24);
    const media = classifyMedia(fileName);
    const now = Date.now();
    const time = Math.max(0, Math.floor(status.time || 0));
    const length = Math.max(1, Math.floor(status.length || 0));
    const base = {
      mediaType: media.mediaType,
      providerContentId: `vlc:${id}`,
      title: media.title,
      seriesTitle: media.seriesTitle,
      seasonNumber: media.seasonNumber,
      episodeNumber: media.episodeNumber,
      positionSeconds: time,
      durationSeconds: length,
      occurredAt: new Date().toISOString(),
      payload: { source: "vlc", fileName: basename(fileName) },
    };
    let eventType;
    if (id !== activeId) { activeId = id; lastProgress = time; eventType = "STARTED"; }
    else if (status.state === "paused" && previousState !== "paused") eventType = "PAUSED";
    else if (status.state === "stopped" && previousState !== "stopped") eventType = time / length >= 0.9 ? "COMPLETED" : "STOPPED";
    else if (status.state === "playing" && time - lastProgress >= PROGRESS_SECONDS) { lastProgress = time; eventType = "PROGRESS"; }
    previousState = status.state;
    if (!eventType) return;
    await sendEvent(config, { ...base, eventType, eventKey: `vlc-${id}-${eventType}-${now}-${randomUUID().slice(0, 8)}` });
    console.log(`${eventType.toLowerCase()}: ${media.seriesTitle || media.title || "local media"} (${time}s/${length}s)`);
  }

  // VLC may be closed at Windows sign-in. Keep the background companion alive
  // and retry on the normal interval instead of quitting on that expected state.
  await poll().catch((error) => console.log(`Waiting for VLC: ${error.message}`));
  setInterval(() => poll().catch((error) => console.error(error.message)), POLL_MS);
}

const command = process.argv[2];
if (command === "pair") pair().catch((error) => { console.error(error.message); process.exitCode = 1; });
else if (command === "watch") watch().catch((error) => { console.error(error.message); process.exitCode = 1; });
else console.log("Usage: node index.mjs pair --code YOUR_CODE | node index.mjs watch [--vlc http://127.0.0.1:8080]");
