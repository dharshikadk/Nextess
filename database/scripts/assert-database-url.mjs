const value = String(process.env.DATABASE_URL || '').trim();

if (!value) {
  console.error('DATABASE_URL is empty or unavailable.');
  process.exit(1);
}

if (/\r|\n/.test(value)) {
  console.error('DATABASE_URL must be a single-line PostgreSQL connection URL.');
  process.exit(1);
}

let normalized = value;

if (
  normalized.length >= 2 &&
  ((normalized.startsWith('"') && normalized.endsWith('"')) ||
    (normalized.startsWith("'") && normalized.endsWith("'")))
) {
  normalized = normalized.slice(1, -1).trim();
}

if (normalized.startsWith('DATABASE_URL=')) {
  normalized = normalized.slice('DATABASE_URL='.length).trim();
}

if (!/^(postgresql|postgres):\/\//.test(normalized)) {
  console.error('DATABASE_URL must begin with postgresql:// or postgres://.');
  process.exit(1);
}

try {
  const url = new URL(normalized);
  if (!url.hostname || !url.pathname || url.pathname === '/') {
    throw new Error('missing database host or database name');
  }
} catch {
  console.error('DATABASE_URL is not a valid PostgreSQL connection URL.');
  process.exit(1);
}

if (process.env.GITHUB_ENV) {
  const fs = await import('node:fs/promises');
  await fs.appendFile(
    process.env.GITHUB_ENV,
    `DATABASE_URL=${normalized}\\n`,
    { encoding: 'utf8' }
  );
}

console.log('DATABASE_URL format verified and normalized for subsequent workflow steps; value intentionally not displayed.');
