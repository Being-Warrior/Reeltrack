import { AppShell } from "@/components/app-shell";
import { SettingsForms } from "@/components/settings-forms";
import { requireUser } from "@/lib/session";

export default async function SettingsPage() {
  const user = await requireUser();

  return (
    <AppShell>
      <h1 className="font-serif text-5xl">Settings</h1>
      <p className="mt-2 mb-8 text-muted">Account, taste, and privacy.</p>
      <SettingsForms
        name={user.name ?? ""}
        username={user.username ?? ""}
        language={user.preferences?.language ?? "en"}
        country={user.preferences?.country ?? "US"}
        recommendationsEnabled={user.preferences?.recommendationsEnabled ?? true}
        privateProfile={user.preferences?.privateProfile ?? true}
        releaseReminders={user.preferences?.releaseReminders ?? true}
        familyMode={user.preferences?.familyMode ?? false}
      />
    </AppShell>
  );
}
