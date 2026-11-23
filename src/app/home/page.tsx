import { AppShell } from "@/components/app-shell";
import { TitleRow } from "@/components/title-card";
import { greetingForNow } from "@/lib/utils";
import { getHomeData } from "@/lib/queries";
import { requireUser } from "@/lib/session";

export default async function HomePage() {
  const user = await requireUser();
  const data = await getHomeData(user.id);
  const firstName = user.name?.split(" ")[0] ?? "there";

  return (
    <AppShell>
      <div className="space-y-12">
        <header>
          <p className="text-xs uppercase tracking-[0.3em] text-gold">{greetingForNow()}</p>
          <h1 className="mt-2 font-serif text-5xl">Good to see you, {firstName}.</h1>
          <p className="mt-3 max-w-2xl text-muted">
            {data.lastLoved
              ? `Because you liked ${data.lastLoved}, we’ve lined up more in that neighbourhood.`
              : "Rate a few titles and this home screen starts to feel like yours."}
          </p>
        </header>
        <TitleRow
          heading="Continue watching"
          titles={data.continueWatching}
          empty="Nothing in progress. Start something from Discover."
        />
        <TitleRow heading="Because you liked" titles={data.becauseYouLiked} compactOnMobile />
        <TitleRow heading="For you" titles={data.recommended} compactOnMobile />
        <TitleRow heading="Hidden gems" titles={data.hiddenGems} />
        <TitleRow heading="New in the catalog" titles={data.newThisWeek} />
      </div>
    </AppShell>
  );
}
