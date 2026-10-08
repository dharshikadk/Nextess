import { PrismaClient } from '@prisma/client';

const POSTGRES_URL = /^(postgresql|postgres):\/\//;

export class DatabaseConfigurationError extends Error {
  readonly code = 'DATABASE_CONFIGURATION_ERROR';

  constructor(message: string) {
    super(message);
    this.name = 'DatabaseConfigurationError';
  }
}

export function normalizeDatabaseUrl(raw = process.env.DATABASE_URL): string {
  if (typeof raw !== 'string' || raw.length === 0) {
    throw new DatabaseConfigurationError('DATABASE_URL is not configured.');
  }

  let value = raw.trim();

  if (/\r|\n/.test(value)) {
    throw new DatabaseConfigurationError('DATABASE_URL must be a single-line PostgreSQL URL.');
  }

  if (
    value.length >= 2 &&
    ((value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'")))
  ) {
    value = value.slice(1, -1).trim();
  }

  if (value.startsWith('DATABASE_URL=')) {
    value = value.slice('DATABASE_URL='.length).trim();
  }

  if (!POSTGRES_URL.test(value)) {
    throw new DatabaseConfigurationError('DATABASE_URL must start with postgresql:// or postgres://.');
  }

  try {
    const url = new URL(value);
    if (!url.hostname || !url.pathname || url.pathname === '/') {
      throw new Error('missing database host or database name');
    }
  } catch {
    throw new DatabaseConfigurationError('DATABASE_URL is not a valid PostgreSQL connection URL.');
  }

  return value;
}

export function createLazyPrismaClient(): PrismaClient {
  let client: PrismaClient | undefined;

  const getClient = (): PrismaClient => {
    normalizeDatabaseUrl();
    client ??= new PrismaClient();
    return client;
  };

  return new Proxy({} as PrismaClient, {
    get(_target, property) {
      const instance = getClient();
      const value = (instance as any)[property];
      return typeof value === 'function' ? value.bind(instance) : value;
    },
  });
}
