# EPIC — Implemented capabilities and active stabilization scope

Baseline: `445cc05` · reviewed 2026-09-07 (UTC).

This replaces the old blanket “V2 shipped/all checks passed” record. Code presence is not proof of deployment, browser compatibility, performance or acceptance. Package version is still `0.1.0`. V1/V2/V3 labels describe historical feature groups only.

Canonical references: [SPEC.md](SPEC.md) (requirements), [TASK.md](TASK.md) (task status), [ROADMAP.md](ROADMAP.md) (ordering), [docs/REVIEW.md](docs/REVIEW.md) (verification).

## Epic inventory

| Epic | Implementation present | Acceptance position |
|---|---|---|
| E01 — Core authoring/compiler (V1 group) | Textarea, `.md` upload, sample, HTML preview, basic AST-to-DOCX modules and download | Basic code paths exist; nested/inline fidelity gaps reproduced; no Office acceptance evidence |
| E02 — Local/PWA experience (V2 group) | Generated SW/manifest/icons, responsive UI, themes, preferences, draft/history/snapshot and versioned asset-bearing backup import/export, lazy heavy dependencies | Save/restore/share safety, theme consistency, accessibility and browser/PWA validation incomplete |
| E03 — Rich output (V3 group) | Images, four built-in templates, page/cover/TOC modules, print PDF, KaTeX/Mermaid, file batch ZIP, QR/TinyURL | Partial against original ambitions; see EPIC-V3 for omissions and defects |
| E04 — Read and presentation | Read width/zoom/toolbar controls, laser color/size/trail/fullscreen and Exit/ESC behavior | Code present in recent commits; device/fullscreen/a11y acceptance not performed |
| E05 — Safety and fidelity hardening | Review and source-aligned docs completed (T20); minimal Node test/CI gate started (T17); T01–T07 remediation in progress | T01–T07 remain incomplete; T08–T16/T18–T19/T21 are Open and T17 is In progress |

## E01 — Core authoring and compiler

**Delivered code:** React-controlled Markdown input; file size/extension checks; basic headings, paragraphs, inline formatting, direct links, tables, lists, code and paragraph blockquotes; `.docx` Blob generation.

**Not complete:** generic recursive conversion, inline images, strike formatting, reference-link/task/list semantics and warnings for unsupported content. PDF is not this compiler's second packed format; it prints HTML separately.

**Remaining work:** T08/T10 and completion of T17. Acceptance requires content/XML fixtures plus real Word/LibreOffice checks, not just a downloadable Blob.

## E02 — Experience layer, reconciled V2 scope

| Historical label | Present implementation | Corrections to previous claims |
|---|---|---|
| V2.0 PWA | VitePWA-generated manifest/SW, icons/safe areas, prompt registration, update countdown | No custom source SW/register module, BUILD_VERSION comparison, URL unregister kill-switch or guaranteed update detection within 30 seconds |
| V2.1 Responsive/design | theme.css tokens, light/dark/system, translucent toolbar, mobile tabs/sheets, table overflow | No verified Lighthouse/HIG/contrast certification; no swipe tabs, Web Share or haptics; not every value is tokenized |
| V2.2 Preferences/draft | prefs.v1 editor/draft/presentation defaults, settings and global draft prompt | No PreferencesProvider, accent selector, preferences import/export or complete reset; editor preferences do not globally restyle preview/Word |
| V2.3 History | IndexedDB v2 documents/snapshots/images, serialized save hook, save feedback, title/content search, pin/rename/delete/open | 8-second inactivity save with 30-second maximum wait and transition flushes; browser crash/multi-tab policy and full-text index/eviction/Clear History remain |
| V2.4 Versions/ZIP | Timeline, delete/restore, recovery backup, storage estimate and versioned manifest archive import/export with metadata, snapshots and image assets | 30-second trailing snapshot; changed-content filter and forced recovery path are corrected, but FIFO persistence/failure, target-transaction and backup round-trip acceptance remain; no pinned snapshots or backup merge/conflict policy |
| V2.5 Chunking | Manual vendor chunks, lazy DOCX/ZIP/math/diagram/QR imports | Modals are statically imported; SW precaches lazy assets too; historical bundle/performance claims are not current browser measurements |

**Remaining work:** T01–T07/T11/T12/T14–T19. Offline/install/update and backup round trips must be verified on target browsers, and storage failures must not be hidden.

## E03 — Rich output

The main V3 code paths are implemented, but the original proposal included work that never landed: custom Word template upload/store, Word math conversion, image gallery/cleanup, directory traversal, preview TOC generation and PDF/Word layout parity.

Landscape dimensions and cover/header behavior also differ from the promised output. See [EPIC-V3.md](EPIC-V3.md) for the source-level scope matrix. Do not restore a blanket “V3 complete” label until narrowed requirements and their acceptance tests pass.

## E04 — Read/presentation (latest source work)

Recent source history includes:

- `93c0a09`: Read mode with zoom and scroll-driven auto-hide toolbar.
- `8d57688`: visible zoom glyphs and width lock.
- `f7ad49b`: configurable presentation laser/trail/fullscreen behavior.
- `445cc05`: saturated laser dot on light/dark themes.

Read uses a centered 820 px base maximum column, 70–300% scale, persisted width lock, and scroll-driven toolbar visibility. It does not itself call the browser Fullscreen API. Presentation is a desktop Read action; it hides the toolbar, optionally requests fullscreen, follows the mouse and exits through Escape/Exit/fullscreen lifecycle.

**Remaining work:** T02 (Read pauses saving), T12 (preference state), T15 (focus/motion/device access), T18 (measurement). Commit existence is not evidence of live deployment/device testing.

## E05 — Active planning focus: trustworthy editing/export

| Workstream | Tasks | Completion gate |
|---|---|---|
| Prevent script execution/data overwrite | T01–T05 | Safe render boundary, explicit local/shared identity, durable transitions and correct mandatory recovery snapshots |
| Preserve content/assets | T06–T10 | Reactive owned assets, portable import/export, recursive loss-aware DOCX, correct math/layout/print |
| Reliable interactions | T11–T15 | Action parity, shared/validated preferences, stable batch identity, bounded input and accessibility |
| Engineering assurance | T16–T19/T21 | Advisory triage, automated tests/CI, measured performance, tested SSOT refactoring and explicit license |
| Documentation baseline | T20 | Completed source/status reconciliation; application tasks remain open |

No application subtask has been marked completed merely because its review or documentation exists. Owners and release dates remain unassigned. Milestones and release blockers are in ROADMAP.md; exact task evidence and acceptance are in TASK.md.

## Definition of epic acceptance

1. Agreed scope is implemented, with deferred features stated explicitly.
2. Linked task acceptance tests and security/data-integrity regressions pass.
3. Actual browser/PWA/Word checks are recorded where relevant; measurements are not inferred from bundle size.
4. Dependency changes and storage migrations have rollback/recovery plans.
5. Documentation describes the new source behavior and known limits without claiming universal zero-loss or zero-regression guarantees.
