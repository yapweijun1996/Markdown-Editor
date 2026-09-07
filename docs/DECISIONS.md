# Architecture decisions — implemented versus proposed

Baseline: `445cc05` · reviewed 2026-09-07 (UTC).

These records document choices visible in the source; they do not invent historical approval dates. **Implemented** means code evidence exists, not that all consequences are correct. **Proposed** choices need implementation/acceptance and, where stated, owner approval. Requirements and statuses remain in [SPEC](../SPEC.md) and [TASK](../TASK.md).

## D01 — Browser-only deployment and local persistence

**Status: Implemented.** React/Vite static assets deploy through GitHub Pages; IndexedDB holds documents/snapshots/Blobs, localStorage holds small settings/recovery state.

**Evidence:** `vite.config.js`, `.github/workflows/deploy.yml`, `src/history/db.js`, preference/history hooks.

**Consequences:** no backend operations or accounts are required; data is profile/origin-local and can be evicted. Sync, encryption, access control and full backup are not implied. Optional TinyURL and remote preview resources are explicit exceptions to purely local processing.

**Follow-up:** T02/T07/T14. Do not add a backend as an incidental fix for local save/share identity.

## D02 — Separate preview and DOCX renderers

**Status: Implemented.** markdown-it builds browser HTML; unified/remark/GFM builds AST for DOCX. PDF prints the HTML branch.

**Evidence:** `src/preview/MarkdownPreview.jsx`, `src/parser/parseMarkdown.js`, `src/converter/markdownToDocx.js`, `src/download/downloadPdf.js`.

**Consequences:** Word output is editable/structural rather than copied preview HTML, but feature semantics can drift. Nested conversion and math currently demonstrate that drift. Pixel-perfect matching is not a requirement.

**Proposed refinement:** shared syntax fixtures and a supported-node contract first (T08/T09/T17); decide later whether one parsing/token layer should feed both renderers. Parser replacement is not approved or already delivered.

## D03 — Built-in Word templates, per-document layout

**Status: Implemented with gaps.** Four objects in `src/styles/templates/` control most converters; document records store templateId/layout. Unknown template IDs fall back to default; older records receive layout defaults on read.

**Consequences:** no custom `.docx` extraction or font embedding; preview/PDF do not inherit these settings. Legacy `wordStyleConfig.js` and converter constants mean SSOT is incomplete. Single-section cover and landscape dimensions have defects.

**Proposed refinement:** consolidate config and derive writable image dimensions from layout (T10/T19). Custom template schema/extraction needs a separate decision and threat review.

## D04 — Persistent image references are `mdimg://`, not Blob URLs

**Status: Implemented with lifecycle gaps.** IndexedDB stores Blob records; Markdown stores IDs; in-memory cache creates temporary object URLs for display. DOCX embeds local/data images and deliberately does not download remote URLs.

**Consequences:** text can remain small, but sharing/copying the text alone is not portable. Unowned images and shared references are not managed safely; cache reactivity is incomplete.

**Proposed refinement:** reference-aware ownership/retention across documents and snapshots (T06), followed by a versioned asset-bearing backup/import format (T07). Decide manifest, identity/remapping, integrity validation, limits and conflict policy before implementing import. Neither a shared-library nor strict single-owner model has been selected as the final design.

## D05 — Browser print for PDF

**Status: Implemented.** Native `window.print()` plus `print.css` instead of a JavaScript PDF library.

**Consequences:** no extra PDF dependency and user-controlled Save as PDF; browser pagination varies. Static A4 CSS is independent of Word page size, cover, headers and templates. The current 30 ms delay is not a render-readiness guarantee.

**Proposed refinement:** completion barrier and browser print fixtures (T10). Programmatic PDF and Word-layout parity remain deferred until their value justifies a separate renderer and dependencies.

## D06 — Compressed fragment sharing, optional third-party shortening

**Status: Implemented with session/privacy limitations.** lz-string compresses text into URLSearchParams in the fragment; decoder also accepts legacy query parameters. QR uses this URL; TinyURL is opt-in and refuses links longer than 6,000 characters.

**Consequences:** no share database required, but anyone holding the URL can recover text. Hashes avoid server request-path limits, not browser/messaging/QR capacity constraints. TinyURL receives the full encoded URL. Preview-only is not an authorization model. Stored assets/layout are excluded.

**Proposed refinement:** distinguish shared versus local sessions, create a new local identity on Edit, handle stale shortening/copy failures and define resource limits (T04/T14). Asset packaging is T07; no automatic public upload is authorized.

## D07 — PWA prompt registration and broad precache

**Status: Implemented with unsafe update coordination.** VitePWA generates SW/manifest; Workbox precaches matching assets including lazy chunks; UpdatePrompt uses a 30-second countdown after detection and hourly explicit checks.

**Consequences:** offline-ready depends on successful installation/cache/storage; lazy execution does not imply zero initial background download. Forced activation/reload is not synchronized with pending edits. No guaranteed update-adoption rate or deploy-to-detection delay exists.

**Proposed refinement:** dirty-state-aware activation/flush, useful deferral/recovery, and real multi-tab/offline upgrade tests (T02/T17). Select any change to countdown policy explicitly; docs alone do not change runtime behavior.

## D08 — Read controls and mouse-based presentation

**Status: Implemented.** Read width/zoom/scroll controls are separate from editor typography. Presentation adds a saturated colored DOM dot and optional canvas trail, with optional Fullscreen API entry.

**Evidence:** `src/preview/usePreviewControls.js`, `LaserPointer.jsx`, App presentation effects, latest baseline commit.

**Consequences:** mouse-based presentation is desktop-oriented; Read itself is not browser fullscreen. Reduced-motion CSS does not stop canvas work. Saved settings live in multiple keys/hook instances.

**Proposed refinement:** accessibility/motion lifecycle and shared settings state (T12/T15); measure mouse/canvas cost before optimization (T18).

## D09 — Explicit document sessions and transactional restoration

**Status: Proposed; not implemented.** Replace implicit coupling of Markdown, a remembered ID, ref flags and independent timers with a session contract.

**Motivation:** T02–T05 identify lost edits, wrong-target restoration, share overwrite and skipped safety snapshots.

**Required properties:** explicit document/source identity and revision; bounded autosave with save/error feedback; serialized content/metadata writes; deliberate transitions; target-ID restoration with mandatory pre-restore backup; startup draft reconciliation; conflict and storage-failure policy. A state-machine hook/service is a candidate implementation, not a requirement to install a particular library.

**Trade-offs to resolve:** draft storage/write strategy for sudden process loss, multi-tab last-writer/conflict policy, empty-content behavior and backpressure. Avoid claiming asynchronous browser writes can guarantee zero loss on every crash.

## D10 — Verification-first engineering harness

**Status: In progress.** A small Node built-in contract suite and CI test/build gate are implemented; a failing fixture should precede application fixes, and CI should enforce security/data-integrity and output contracts before deploy.

**Candidates, not installed:** Vitest, React Testing Library, fake-indexeddb, Playwright and ESLint. Node's built-in `node:test` is installed through the runtime and currently covers pure helpers/parser/share/preview-escaping/snapshot-policy contracts. Select additional versions and runner/browser scope under T17, with dependency risk review under T16.

**Required artifacts:** unit/component fixtures, explicit IndexedDB transaction/recovery tests, DOCX XML assertions, real browser/PWA tests, manual Office evidence, dependency reports and source-aligned docs. The committed Node suite is a first contract layer, not complete application coverage.

**Trade-offs to resolve:** supported Node/browser matrix and performance budgets; avoid broad orchestration/parser rewrites before protective tests (T19).

## Decisions awaiting owner/product input

- Intended repository license (T21); no authoritative LICENSE file exists.
- Asset bundle/import schema and reference ownership (T06/T07).
- Supported runtime/browser/Office versions and measured performance targets (T16–T18).
- Word math editability versus image output, custom-template subset, directory assets and programmatic PDF value (deferred scope).
- Cloud/auth/collaboration/encryption/platform plans require independent privacy, cost and operational decisions.
