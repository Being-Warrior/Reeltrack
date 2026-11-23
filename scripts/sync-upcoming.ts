import { runUpcomingSync } from "../src/lib/upcoming-sync";

async function main() {
  const result = await runUpcomingSync();
  console.log(`Upcoming sync complete: ${result.additions} release alert(s) found; ${result.reminders} reminder(s) prepared.`);
}

main().catch((error) => { console.error(error); process.exit(1); });
