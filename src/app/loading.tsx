export default function Loading() {
  return (
    <main className="mx-auto max-w-7xl animate-pulse px-4 py-8">
      <div className="h-10 w-56 rounded-xl bg-raised" />
      <div className="mt-4 h-5 w-96 max-w-full rounded-lg bg-raised" />
      <div className="mt-12 flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 w-40 shrink-0 rounded-2xl bg-raised" />)}
      </div>
      <div className="mt-12 flex gap-4 overflow-hidden">
        {Array.from({ length: 6 }, (_, index) => <div key={index} className="h-64 w-40 shrink-0 rounded-2xl bg-raised" />)}
      </div>
    </main>
  );
}
