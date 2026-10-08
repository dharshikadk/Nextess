import { spawnSync } from "node:child_process";

const rawValue = process.env.DATABASE_URL;

if (typeof rawValue !== "string" || rawValue.length === 0) {
  console.error("DATABASE_URL is required for this Prisma command.");
  console.error("Set DATABASE_URL in the shell, .env, or GitHub Actions environment.");
  process.exit(1);
}

// GitHub secrets can accidentally contain surrounding whitespace or quotes when copied.
// Normalize only those harmless formatting errors; never print the secret itself.
let normalizedValue = rawValue.trim();

if (
  normalizedValue.length >= 2 &&
  ((normalizedValue.startsWith('"') && normalizedValue.endsWith('"')) ||
    (normalizedValue.startsWith("'") && normalizedValue.endsWith("'")))
) {
  normalizedValue = normalizedValue.slice(1, -1).trim();
}

if (!/^(postgresql|postgres):\/\//.test(normalizedValue)) {
  if (/^DATABASE_URL\s*=/.test(normalizedValue)) {
    console.error(
      "DATABASE_URL is present but contains a 'DATABASE_URL=' prefix. " +
        "Store only the PostgreSQL connection URL as the secret value."
    );
  } else {
    console.error(
      "DATABASE_URL is present but is not a valid PostgreSQL URL. " +
        "It must start with postgresql:// or postgres://."
    );
  }
  process.exit(1);
}

const prismaArgs = process.argv.slice(2);

if (prismaArgs.length === 0) {
  console.error("No Prisma command was provided.");
  process.exit(1);
}

const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";
const result = spawnSync(npxCommand, ["prisma", ...prismaArgs], {
  stdio: "inherit",
  env: {
    ...process.env,
    DATABASE_URL: normalizedValue,
  },
});

if (result.error) {
  console.error(`Failed to start Prisma: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
