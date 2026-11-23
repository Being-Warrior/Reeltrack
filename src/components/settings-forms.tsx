"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { logoutAction } from "@/actions/auth";
import { deleteAccount, deleteSearchHistory, deleteWatchHistory, exportUserData, updateSettings } from "@/actions/user";
import { CountrySelect } from "@/components/country-select";

export function SettingsForms({
  name,
  username,
  language,
  country,
  recommendationsEnabled,
  privateProfile,
  releaseReminders,
  familyMode,
}: {
  name: string;
  username: string;
  language: string;
  country: string;
  recommendationsEnabled: boolean;
  privateProfile: boolean;
  releaseReminders: boolean;
  familyMode: boolean;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");

  return (
    <div className="space-y-10">
      <form
        className="max-w-xl space-y-4 rounded-3xl border border-line bg-paper p-6"
        action={(formData) =>
          start(async () => {
            setSaveStatus("idle");
            try {
              await updateSettings({
                name: String(formData.get("name")),
                username: String(formData.get("username")),
                language: String(formData.get("language")),
                country: String(formData.get("country")),
                recommendationsEnabled: formData.get("recommendationsEnabled") === "on",
                privateProfile: formData.get("privateProfile") === "on",
                releaseReminders: formData.get("releaseReminders") === "on",
                familyMode: formData.get("familyMode") === "on",
              });
              setSaveStatus("saved");
              toast.success("Settings saved", { description: "Your profile and preferences are up to date." });
              router.refresh();
            } catch {
              setSaveStatus("error");
              toast.error("Settings could not be saved", { description: "Check your name and username, then try again." });
            }
          })
        }
      >
        <h2 className="font-serif text-2xl">Profile</h2>
        <label className="block text-sm">
          Name
          <input name="name" defaultValue={name} className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3" />
        </label>
        <label className="block text-sm">
          Username
          <input name="username" defaultValue={username} className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            Language
            <input name="language" defaultValue={language} className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3" />
          </label>
          <label className="block text-sm">
            Country
            <CountrySelect defaultValue={country} className="mt-1 w-full rounded-2xl border border-line bg-bg px-4 py-3" />
            <span className="mt-1 block text-xs text-muted">Used for local streaming availability and release dates.</span>
          </label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="recommendationsEnabled" defaultChecked={recommendationsEnabled} />
          Personalized recommendations
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="privateProfile" defaultChecked={privateProfile} />
          Private profile
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="releaseReminders" defaultChecked={releaseReminders} />
          In-app reminders for upcoming releases
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="familyMode" defaultChecked={familyMode} />
          Family mode (keeps adult TMDB search results excluded)
        </label>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={pending}
            aria-busy={pending}
            className="rounded-full bg-gold px-5 py-2 text-sm font-medium text-bg transition duration-150 hover:brightness-110 active:scale-[0.97] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-wait disabled:opacity-60"
          >
            {pending ? "Saving…" : "Save changes"}
          </button>
          <p aria-live="polite" className={saveStatus === "error" ? "text-sm text-terracotta" : "text-sm text-gold"}>
            {saveStatus === "saved" ? "Saved" : saveStatus === "error" ? "Could not save" : ""}
          </p>
        </div>
      </form>

      <section className="max-w-xl space-y-3 rounded-3xl border border-line bg-paper p-6">
        <h2 className="font-serif text-2xl">Privacy</h2>
        <button
          className="block text-sm text-muted hover:text-ink"
          onClick={() =>
            start(async () => {
              await deleteSearchHistory();
              toast.success("Search history cleared");
            })
          }
        >
          Clear search history
        </button>
        <button
          className="block text-sm text-muted hover:text-ink"
          onClick={() =>
            start(async () => {
              await deleteWatchHistory();
              toast.success("Watch history cleared");
              router.refresh();
            })
          }
        >
          Clear watch history
        </button>
        <button
          className="block text-sm text-muted hover:text-ink"
          onClick={() =>
            start(async () => {
              const payload = await exportUserData();
              const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "reeltrack-export.json";
              link.click();
              URL.revokeObjectURL(url);
            })
          }
        >
          Export my data
        </button>
        <button
          className="block text-sm text-terracotta"
          onClick={() =>
            start(async () => {
              if (!confirm("Delete your account and all library data?")) return;
              await deleteAccount();
              await logoutAction();
            })
          }
        >
          Delete account
        </button>
      </section>
    </div>
  );
}
