# ROADMAP — Stabilize before expanding

Baseline: `445cc05` · reviewed 2026-09-07 (UTC).

This is an ordered plan, not a release calendar. Package version remains `0.1.0`; V1/V2/V3 are historical feature-group labels, not verified semantic release tags. [TASK.md](TASK.md) is the task-status source of truth; application fixes below are in progress or open until their acceptance evidence is recorded.

## Current position

Core editor/DOCX, PWA/history/preferences, rich-output components and Read/presentation code exist. Follow-up source commits now cover preview interpolation escaping, bounded/serialized saves, shared-session isolation, target-safe restore, content-aware snapshots, reactive image ownership and a versioned asset-bearing backup path. Build and a Node contract suite succeed, but security, data lifecycle, backup round-trip and output correctness acceptance remains incomplete. No full browser/Office acceptance results exist.

See [EPIC.md](EPIC.md) for implemented groups, [EPIC-V3.md](EPIC-V3.md) for rich-output scope corrections, and [docs/REVIEW.md](docs/REVIEW.md) for evidence.

## Milestone 0 — Make changes verifiable

- Extend the initial Node contract harness into the minimum application harness and PR checks (T17).
- Triage dependency advisories and select a supported Node/toolchain policy (T16).
- Capture failure-first tests for XSS, shared-session overwrite, cross-document restore, lost/empty edits and snapshot filtering (T01–T05).
- Documentation reconciliation is completed as T20, not as an application release.

**Exit gate:** a clean checkout can run the documented tests/build; known failures are reproducible and failing critical tests block promotion. Initial security fixes need not wait for every future E2E case, but must carry focused regression tests.

## Milestone 1 — Protect content and local data

- Complete the custom-renderer HTML-injection fix and browser/security acceptance (T01).
- Complete durable, explicit document sessions and save-aware PWA transitions (T02).
- Complete content comparison/mandatory-backup persistence acceptance (T05), then restore targeting (T03).
- Complete shared-document isolation and validate initial/query/hash transitions consistently (T04).
- Resolve or explicitly disposition actionable high-impact dependency risks (T16).

**Exit gate:** hostile Markdown cannot execute script through preview; editing/reading/sharing/restoring/new/open/update flows cannot silently overwrite the wrong document or discard pending edits in tested transitions. Storage failures must be visible and recoverable. Crash-loss bounds and browser limitations must be stated honestly.

**Release blockers identified by this review:** incomplete acceptance for T01–T05 and the remaining verification gaps. This is a recommended release policy; the Pages workflow now runs the minimal Node test/build gate but does not yet enforce browser, storage or Office acceptance.

## Milestone 2 — Preserve document meaning and assets

- Complete image reactivity, ownership, references and lifecycle acceptance (T06).
- Verify the versioned backup/import implementation with collision-safe assets/metadata and failure cases (T07).
- Complete recursive DOCX conversion, unsupported-feature reporting and formatting/list semantics, then run reader checks (T08).
- Make math/diagram processing structure-aware and lifecycle-safe (T09).
- Fix landscape XML, validate cover/TOC behavior, image sizing and print readiness (T10).

**Exit gate:** supported syntax survives export; unsupported syntax is visible rather than silently dropped; complete backups round-trip into an empty browser profile; portrait/landscape and representative TOC/cover files pass Word and LibreOffice checks; PDF does not race unfinished renderers.

**Dependencies:** T07 follows T06; T10 requires protected conversion/preview behavior from T08/T09. The T07 asset-import format is selected and implemented; reference retention and browser/IndexedDB acceptance remain coupled to T06/T07.

## Milestone 3 — Reliable interaction across devices

- Expose all existing actions on desktop/mobile from one registry (T11).
- Share/validate preferences and preserve user-renamed metadata (T12).
- Correct batch identities/progress/retry and processing-queue rules (T13).
- Bound shared/file/image/diagram workloads and harden QR/copy/shortener behavior (T14).
- Complete keyboard/modal/focus/reduced-motion accessibility (T15).
- Confirm repository licensing with the owner (T21).

**Exit gate:** desktop/tablet/mobile controls are reachable; settings and save feedback agree; duplicate names/partial batch failures are safe; oversized input is handled without uncontrolled processing; keyboard and representative assistive-technology checks are recorded. Browser/Office access is an acceptance prerequisite, not evidence already collected.

## Milestone 4 — Measure, then simplify

- Measure startup bytes separately from Workbox background precache and lazy execution (T18).
- Profile large preview/history/image/batch workloads on defined devices and documents.
- Select workers, incremental parsing, virtualization, lazy dialogs or chunk changes only when justified by measurements.
- Refactor App, controls and configuration behind established tests (T19).

**Exit gate:** agreed budgets have reproducible reports; configuration ownership is clear; optimization does not regress safety, storage recovery, offline use or DOCX output. Historical first-paint/Lighthouse/throughput claims are not current acceptance evidence.

## Deferred extensions — no committed dates

| Candidate | Prerequisite/decision |
|---|---|
| Custom `.docx` templates | Define safe ZIP/XML subset, storage schema, licensing/fonts and migration; requires stable template/fidelity tests |
| Native Word math or rendered equation images | Choose editability versus raster output and establish math parsing/accessibility semantics |
| PDF/Word layout parity or programmatic PDF | Decide whether browser print is insufficient; assess a separate renderer before adding dependencies |
| Directory/folder conversion | Define relative asset/path handling, duplicates and browser APIs; current batch input is files only |
| Image library/cleanup UI | Reference ownership across documents/snapshots/backups must be safe first |
| Preference import/export, localization, accent customization | Requires validated schema, reset policy and shared UI state |
| Native Web Share, swipe gestures, haptics | Product/accessibility justification and browser support checks |
| Cloud sync and accounts | Backend, authentication, privacy, conflict resolution and operating costs |
| Real-time collaboration | Stable session model plus CRDT/network protocol and security model |
| Encryption | Key management, recovery and threat-model decision |
| Plugin/API/AI writing/native wrapper | Stable compiler contracts and separate scope, dependency/privacy/platform review |

## Open decisions and blockers

- Runtime architecture options and asset/schema choices: [docs/DECISIONS.md](docs/DECISIONS.md).
- No application-task owners, milestones dates, supported-browser version floor or measured performance budgets have been approved.
- Full browser/device/Office testing was not available as evidence in this review. These checks must be performed before claiming cross-platform acceptance.
- License choice requires the repository owner; maintainers should not infer it from an old badge.
- MCP knowledge-base publication has not been performed; no MCP KB tool is available in this session. Repository documentation is the maintained record.

## Recommended next action

Complete T07's disposable-profile backup round trip alongside T01 browser/security, T04 transition and T05 persistence acceptance; continue T16 dependency triage, then add T02's IndexedDB failure/multi-tab fixtures. Use the cycle **observe code -> orient with a failing fixture -> decide the smallest coherent design -> act -> evaluate tests and user-visible behavior**. Every implementation change must update the linked requirements, task evidence and affected docs; do not mark an epic accepted because it compiles.
