import { AppShell } from "@/components/app-shell";
import { TitleRow } from "@/components/title-card";
import { getComingSoon } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function ComingSoonPage() {
  const user = await requireUser();
  const titles = await getComingSoon(user.id);
  return (
    <AppShell>
      <div className="space-y-8">
        <header><h1 className="font-serif text-5xl">Coming soon</h1><p className="mt-2 text-muted">Up to 36 upcoming movies and series from the global catalog, ranked around what you watch and favourite.</p></header>
        <TitleRow heading="Release calendar" titles={titles} showReleaseDate empty="No upcoming releases are in the catalog yet." />
      </div>
    </AppShell>
  );
}
