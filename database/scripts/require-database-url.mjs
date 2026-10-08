const value = process.env.DATABASE_URL?.trim();

if (!value) {
  console.error("DATABASE_URL is required for this Prisma command.");
  console.error("Set DATABASE_URL in the shell, .env, or GitHub Actions environment.");
  process.exit(1);
}
