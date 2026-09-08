# ADR 0001 — Start With a Modular Monolith

## Status

Accepted

## Decision

Nextess starts as a modular monolith with strong internal module boundaries.

## Why

The product has many domains but they are tightly connected:

- investigation
- evaluation
- rewards
- progress
- badges
- streaks

Microservices at the start would create unnecessary network failure modes, deployment complexity and data consistency problems.

## Future split triggers

A module may become a service if there is evidence of:

- independent scaling requirement
- independent deployment cadence
- strong runtime isolation requirement
- specialized infrastructure
- clear ownership boundary

The API contract should remain stable across such a split.
