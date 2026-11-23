import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { TitleCard } from "@/components/title-card";
import { getPersonPage } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { profileUrl } from "@/lib/tmdb/images";

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const data = await getPersonPage(id, user.id);
  if (!data) notFound();

  return (
    <AppShell>
      <div className="flex flex-col gap-8 md:flex-row">
        <div className="h-64 w-48 overflow-hidden rounded-3xl bg-raised">
          {profileUrl(data.person.profilePath, "h632") ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={profileUrl(data.person.profilePath, "h632") ?? ""} alt="" className="h-full w-full object-cover" />
          ) : null}
        </div>
        <div>
          <h1 className="font-serif text-5xl">{data.person.name}</h1>
          <p className="mt-2 text-sm text-muted">{data.person.knownForDepartment}</p>
          <p className="mt-4 max-w-2xl text-muted">{data.person.biography || "No biography stored yet."}</p>
        </div>
      </div>
      <section className="mt-10">
        <h2 className="font-serif text-2xl">Known for</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          {data.titles.map((title) => (
            <TitleCard key={title.id} title={title} />
          ))}
        </div>
      </section>
    </AppShell>
  );
}
