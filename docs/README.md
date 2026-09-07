# Documentation index and maintenance contract

Source baseline: `b691ca6` · reviewed 2026-09-07 (UTC).

## Ownership: one authoritative home per concern

| Document | Owns |
|---|---|
| [README](../README.md) | User-facing introduction, setup, capabilities and important limits |
| [SPEC](../SPEC.md) | Requirement IDs, implemented semantics, defaults and boundaries |
| [DESIGN](../DESIGN.md) | Current modules, state ownership, data schema and runtime architecture |
| [EPIC](../EPIC.md) | Feature-group inventory and stabilization scope |
| [EPIC-V3](../EPIC-V3.md) | Reconciliation of the original rich-output proposal with delivered code |
| [ROADMAP](../ROADMAP.md) | Milestone ordering, gates, deferred scope and open decisions |
| [TASK](../TASK.md) | Canonical T IDs, priority, status, dependency and completion criteria |
| [TESTING](../TESTING.md) | Verification commands, regression scenarios and manual acceptance checklist |
| [DECISIONS](DECISIONS.md) | Implemented architectural choices versus proposed changes |
| [DEPENDENCIES](DEPENDENCIES.md) | Declared/resolved packages, tooling and advisory posture |
| [REVIEW](REVIEW.md) | Dated source/build/reproduction evidence and validation limitations |

`CLAUDE.md` contains contributor/agent instructions, not product implementation claims. It is intentionally not rewritten by this documentation reconciliation.

## Interpretation

- Code/package-lock/configuration define actual behavior; docs must not invent missing modules, dependencies or guarantees.
- **Implemented** is not **verified**. Build success, isolated XML checks, static reasoning, browser E2E, Office checks and production deployment are different evidence levels.
- Task state changes belong in TASK first; other documents link to T IDs instead of inventing competing statuses.
- V1/V2/V3 labels are historical feature groups. Package version is `0.1.0`; no release date or production acceptance is inferred from those labels.
- Observed defects stay open until acceptance evidence establishes the fix. A documentation-only change cannot complete an application task.

## Update process

1. Observe the affected source, callers, storage/serialization and configuration; identify impacted requirement and task IDs.
2. Capture a failing or baseline test before changing behavior. Separate actual implementation decisions from proposals needing approval.
3. Implement the coherent change and verify dependents, migrations, security and user-visible behavior.
4. Update SPEC/DESIGN and TASK acceptance evidence together; update README/EPIC/ROADMAP/TESTING only where the contract changes.
5. Refresh dependency/build evidence when packages change; do not copy old bundle or audit numbers as current measurements.
6. Check Markdown links, file references and task IDs; avoid claiming manual checks were executed when they were only listed.

This is the intended OODAE/harness workflow: observe -> orient -> decide -> act -> evaluate, with source and test artifacts as the feedback loop. The Node test/CI harness currently passes 35 contract tests; richer component, persistence and browser coverage remains T17.

## External knowledge base

Repository docs are maintained here. No MCP knowledge-base tool is available in the current session, so no external KB entry was created or updated. Mirror this baseline only when that integration is available; do not claim external synchronization without evidence.
