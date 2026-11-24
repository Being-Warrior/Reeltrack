"use client";

import { useState, useTransition } from "react";
import { Copy, KeyRound, LoaderCircle, MonitorOff, ShieldCheck } from "lucide-react";
import { createAutoSyncPairingCode, revokeAutoSyncDeviceAction } from "@/actions/autosync";

type Device = { id: string; name: string; type: string; lastSeenAt: Date | null; tokenExpiresAt: Date | null };

function when(value: Date | null) {
  return value ? new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(value) : "Not seen yet";
}

export function AutoSyncDashboard({ devices }: { devices: Device[] }) {
  const [pairing, setPairing] = useState<{ code: string; expiresAt: string; type: "BROWSER_EXTENSION" | "DESKTOP_COMPANION" } | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  function generateCode(type: "BROWSER_EXTENSION" | "DESKTOP_COMPANION") {
    setMessage("");
    startTransition(async () => {
      try {
        const result = await createAutoSyncPairingCode(type);
        setPairing({ ...result, type });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not create a pairing code.");
      }
    });
  }

  function copyCode() {
    if (!pairing) return;
    navigator.clipboard.writeText(pairing.code).then(() => setMessage("Pairing code copied."));
  }

  function revoke(id: string) {
    setMessage("");
    startTransition(async () => {
      try {
        await revokeAutoSyncDeviceAction(id);
        setMessage("Device disconnected.");
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Could not disconnect this device.");
      }
    });
  }

  return (
    <section className="rounded-3xl border border-line bg-paper p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="font-serif text-2xl">Connect a device</h2>
          <p className="mt-1 max-w-xl text-sm text-muted">Your actual device token is created only after the browser extension or VLC companion claims this one-time code.</p>
        </div>
        <div className="flex flex-wrap gap-2"><button type="button" onClick={() => generateCode("DESKTOP_COMPANION")} disabled={pending} className="inline-flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition hover:scale-[1.02] disabled:cursor-not-allowed disabled:opacity-60">{pending ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}Pair VLC</button><button type="button" onClick={() => generateCode("BROWSER_EXTENSION")} disabled={pending} className="inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 text-sm font-medium transition hover:border-gold disabled:cursor-not-allowed disabled:opacity-60">Pair browser</button></div>
      </div>
      {pairing ? (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/40 bg-gold/10 p-4">
          <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-muted">{pairing.type === "DESKTOP_COMPANION" ? "VLC companion" : "Browser"} pairing code</p><p className="mt-1 font-mono text-2xl tracking-[0.22em]">{pairing.code}</p><p className="mt-1 text-xs text-muted">Expires {when(new Date(pairing.expiresAt))}. Do not share it.</p></div>
          <button type="button" onClick={copyCode} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-2 text-sm transition hover:border-gold"><Copy className="h-4 w-4" />Copy</button>
        </div>
      ) : null}
      {message ? <p className="mt-3 text-sm text-muted" role="status">{message}</p> : null}
      <div className="mt-6 border-t border-line pt-5">
        <h3 className="font-medium">Your connected devices</h3>
        {devices.length ? <ul className="mt-3 space-y-3">{devices.map((device) => <li key={device.id} className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-raised/60 px-4 py-3"><div><p className="font-medium">{device.name}</p><p className="mt-0.5 text-xs text-muted">{device.type.replaceAll("_", " ").toLowerCase()} · Last activity: {when(device.lastSeenAt)}</p></div><button type="button" onClick={() => revoke(device.id)} disabled={pending} className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs transition hover:border-terracotta hover:text-terracotta disabled:opacity-60"><MonitorOff className="h-3.5 w-3.5" />Disconnect</button></li>)}</ul> : <div className="mt-3 rounded-2xl bg-raised/60 p-4 text-sm text-muted"><ShieldCheck className="mr-2 inline h-4 w-4 text-gold" />No devices are connected. ReelTrack never stores provider passwords or your unrelated browsing data.</div>}
      </div>
      <div className="mt-6 rounded-2xl border border-line bg-raised/40 p-4"><h3 className="font-medium">VLC quick start</h3><p className="mt-1 text-sm text-muted">Click Pair VLC above, then double-click <span className="font-mono text-xs text-ink">ReelTrack VLC Companion.cmd</span> inside <span className="font-mono text-xs text-ink">apps/vlc-autosync-companion</span>. After pairing, <span className="font-mono text-xs text-ink">Install Background Tracking.cmd</span> can keep it running invisibly after Windows sign-in.</p></div>
    </section>
  );
}
