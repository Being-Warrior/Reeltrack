import { ingestCatalog } from "../src/lib/tmdb/sync";

async function main() {
  const result = await ingestCatalog();
  console.log(`Catalog sync complete: ${result.movies} movies, ${result.shows} series.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
