# ADR 0004 — Immutable Reward Ledger

## Status

Accepted

## Decision

XP and coin changes are represented as immutable ledger events. Balances may be derived or maintained as a projection.

## Why

This makes rewards auditable, retry-safe and easier to repair after bugs without silently changing history.
