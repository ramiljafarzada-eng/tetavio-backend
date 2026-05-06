// Runs during `npm install` (postinstall). Resolves any known-failed migrations
// on the target database before `prisma migrate deploy` runs in the build chain.
const { execSync } = require('child_process');

if (!process.env.DATABASE_URL) {
  process.exit(0);
}

const MIGRATIONS_TO_RESOLVE = [
  '20260506074746_add_employee_id_card_education',
];

for (const name of MIGRATIONS_TO_RESOLVE) {
  try {
    execSync(`npx prisma migrate resolve --applied ${name}`, {
      stdio: 'pipe',
      cwd: process.cwd(),
    });
    console.log(`[resolve] Marked ${name} as applied`);
  } catch (e) {
    // Already applied, rolled back, or not in DB – all fine
    console.log(`[resolve] Skipped ${name}: ${e.stderr?.toString().trim() || e.message}`);
  }
}
