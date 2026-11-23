export default function NotFound() {
  return (
    <div className="grid min-h-screen place-items-center px-4">
      <div className="text-center">
        <p className="text-xs uppercase tracking-[0.3em] text-gold">404</p>
        <h1 className="mt-2 font-serif text-5xl">That page isn’t in the catalog.</h1>
        <a href="/home" className="mt-6 inline-block text-sm text-gold">
          Back home
        </a>
      </div>
    </div>
  );
}
