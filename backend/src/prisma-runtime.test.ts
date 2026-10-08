import assert from 'node:assert/strict';
import test from 'node:test';
import { DatabaseConfigurationError, normalizeDatabaseUrl } from './prisma-runtime.js';

test('normalizes harmless DATABASE_URL wrappers without exposing credentials', () => {
  const url = normalizeDatabaseUrl('  "DATABASE_URL=postgresql://user:pass@example.com:5432/nextess?sslmode=require"  ');
  assert.equal(url, 'postgresql://user:pass@example.com:5432/nextess?sslmode=require');
});

test('rejects multiline database URLs', () => {
  assert.throws(
    () => normalizeDatabaseUrl('postgresql://user:pass@example.com:5432/nextess\npostgresql://other'),
    (error: unknown) => error instanceof DatabaseConfigurationError
  );
});

test('rejects non-PostgreSQL URLs', () => {
  assert.throws(
    () => normalizeDatabaseUrl('mysql://user:pass@example.com:3306/nextess'),
    (error: unknown) => error instanceof DatabaseConfigurationError
  );
});

test('rejects incomplete PostgreSQL URLs', () => {
  assert.throws(
    () => normalizeDatabaseUrl('postgresql://'),
    (error: unknown) => error instanceof DatabaseConfigurationError
  );
});
