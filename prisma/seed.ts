import { ingestCatalog } from "../src/lib/tmdb/sync";
import { isTmdbConfigured } from "../src/lib/tmdb/client";

async function main() {
  if (!isTmdbConfigured()) {
    console.log("Skipping catalog seed: set TMDB_API_KEY or TMDB_ACCESS_TOKEN.");
    return;
  }
  const result = await ingestCatalog();
  console.log(`Seeded catalog: ${result.movies} movies, ${result.shows} series.`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
