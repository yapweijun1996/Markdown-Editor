# Architecture decisions — implemented versus proposed

Baseline: `b691ca6` · reviewed 2026-09-07 (UTC).

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

**Consequences:** no custom `.docx` extraction or font embedding; preview/PDF do not inherit these settings. Legacy `wordStyleConfig.js` still owns image fallback paragraph values, while page size/margins and writable image width now have one layout source. The single-section cover uses explicit first-page header/footer behavior; reader compatibility remains open.

**Proposed refinement:** consolidate the remaining style/config duplicates (T19). Custom template schema/extraction needs a separate decision and threat review.

## D04 — Persistent image references are `mdimg://`, not Blob URLs

**Status: Implemented with lifecycle gaps.** IndexedDB stores Blob records; Markdown stores IDs; in-memory cache creates temporary object URLs for display, publishes load/error revisions and preserves ownership when attaching orphans. Image insertion enforces supported DOCX-representable MIME types, byte/pixel bounds and active-SVG rejection. DOCX embeds local/data images and deliberately does not download remote URLs.

**Consequences:** text can remain small, but sharing/copying the text alone is not portable. Cache eviction, deletion invalidation and reference analysis across documents/snapshots remain incomplete. The local backup path now packages assets separately; text-only share URLs warn rather than uploading them.

**Proposed refinement:** reference-aware ownership/retention across documents and snapshots (T06). The T07 backup schema and ID-remapping policy are selected below; browser/IndexedDB round-trip and failure evidence remain open.

## D05 — Browser print for PDF

**Status: Implemented.** Native `window.print()` plus `print.css` instead of a JavaScript PDF library.

**Consequences:** no extra PDF dependency and user-controlled Save as PDF; browser pagination varies. Static A4 CSS is independent of Word page size, cover, headers and templates. A bounded readiness barrier now waits for preview renderers, fonts, images and layout frames before printing, then prints even if the timeout expires.

**Evidence:** `src/preview/MarkdownPreview.jsx` exposes `data-render-state`; `src/download/downloadPdf.js` waits up to five seconds and `src/styles/print.css` hides presentation overlays/resets Read zoom. `test/layoutPrint.test.js` covers the helper with delayed render state.

**Remaining:** browser print pagination and dialog output still require named-browser evidence. Programmatic PDF and Word-layout parity remain deferred until their value justifies a separate renderer and dependencies.

## D06 — Compressed fragment sharing, optional third-party shortening

**Status: Implemented with session/privacy limitations.** lz-string compresses text into URLSearchParams in the fragment; decoder also accepts legacy query parameters and rejects oversized encoded/decoded content. QR uses this URL and is disabled above its configured capacity; TinyURL is opt-in, refuses links longer than 6,000 characters and uses bounded cancellable requests. App shared-session state now pauses local persistence and forks a new local document on Edit.

**Consequences:** no share database required, but anyone holding the URL can recover text. Hashes avoid server request-path limits, not browser/messaging/QR capacity constraints. TinyURL receives the full encoded URL. Preview-only is not an authorization model. Stored assets/layout are excluded.

**Remaining refinement:** coordinate pending-save transitions and perform browser capacity/timeout/copy acceptance (T02/T14). Asset packaging is T07; no automatic public upload is authorized.

## D07 — PWA prompt registration and broad precache

**Status: Implemented with unsafe update coordination.** VitePWA generates SW/manifest; Workbox precaches matching assets including lazy chunks; UpdatePrompt uses a 30-second countdown after detection and hourly explicit checks.

**Consequences:** offline-ready depends on successful installation/cache/storage; lazy execution does not imply zero initial background download. Update activation now attempts the history flush and keeps the prompt open when saving fails, but no guaranteed update-adoption rate or deploy-to-detection delay exists.

**Remaining refinement:** real multi-tab/offline upgrade tests and stronger dirty-state recovery (T02/T17). Select any change to countdown policy explicitly; docs alone do not change runtime behavior.

## D08 — Read controls and mouse-based presentation

**Status: Implemented.** Read width/zoom/scroll controls are separate from editor typography. Presentation adds a saturated colored DOM dot and optional canvas trail, with optional Fullscreen API entry.

**Evidence:** `src/preview/usePreviewControls.js`, `LaserPointer.jsx`, App presentation effects, latest baseline commit.

**Consequences:** mouse-based presentation is desktop-oriented; Read itself is not browser fullscreen. Reduced-motion CSS is supplemented by a runtime guard that stops the canvas trail loop. Theme hook instances share in-page state, while non-theme settings remain in their explicit localStorage keys.

**Proposed refinement:** browser accessibility/motion acceptance and non-theme cross-tab settings policy (T12/T15); measure mouse/canvas cost before optimization (T18).

## D09 — Explicit document sessions and transactional restoration

**Status: Partially implemented.** Shared-session state, fork-on-Edit and explicit target-ID restoration now exist; the durable save/transition contract and failure policy remain incomplete.

**Motivation:** T02–T05 identify lost edits, wrong-target restoration, share overwrite and skipped safety snapshots.

**Required properties:** explicit document/source identity and revision; bounded autosave with save/error feedback; serialized content/metadata writes; deliberate transitions; target-ID restoration with mandatory pre-restore backup; startup draft reconciliation; conflict and storage-failure policy. The current hook/repository implements bounded writes, transition barriers, target-safe restoration and per-document mutation queues in part; multi-tab conflict and failure-injection evidence remain open. A state-machine hook/service is a candidate implementation, not a requirement to install a particular library.

**Trade-offs to resolve:** draft storage/write strategy for sudden process loss, multi-tab last-writer/conflict policy, empty-content behavior and backpressure. Avoid claiming asynchronous browser writes can guarantee zero loss on every crash.

## D10 — Verification-first engineering harness

**Status: In progress.** A small Node built-in contract suite (34 passing tests at the current working tree) and CI test/build gate are implemented; a failing fixture should precede application fixes, and CI should enforce security/data-integrity and output contracts before deploy.

**Candidates, not installed:** Vitest, React Testing Library, fake-indexeddb, Playwright and ESLint. Node's built-in `node:test` is installed through the runtime and currently covers helpers/parser/share/local-image warnings and limits/preview escaping/save timing/snapshot policy/image ownership/format boundaries/backup-manifest/reference/document metadata/batch identities/shortener cancellation, DOCX XML/media, math HTML-boundary and page/layout/print-readiness contracts. Select additional versions and runner/browser scope under T17, with dependency risk review under T16.

**Required artifacts:** unit/component fixtures, explicit IndexedDB transaction/recovery tests, DOCX XML assertions, real browser/PWA tests, manual Office evidence, dependency reports and source-aligned docs. The committed Node suite is a first contract layer, not complete application coverage.

**Trade-offs to resolve:** supported Node/browser matrix and performance budgets; avoid broad orchestration/parser rewrites before protective tests (T19).

## D11 — Versioned local backup with remapped identities

**Status: Implemented in code; acceptance in progress.** T07 uses a `markdown-editor-backup` v1 ZIP containing `manifest.json`, `INDEX.md`, document Markdown, snapshot Markdown and image asset bytes. The manifest preserves document title/title-source metadata/layout, snapshot timestamps/identities and image ownership metadata.

**Decision:** imports always generate new document, snapshot and image IDs, then remap `mdimg://` references before a single IndexedDB transaction. Duplicate titles/timestamps therefore cannot overwrite existing records. Relative archive paths, duplicate identities, missing files/references, invalid UTF-8, image size mismatches, 100 MB ZIP input, 200 MB expanded content, 25 MB per-image content and 10,000-entry limits are rejected with explicit errors. Text-only share links remain text-only and warn about local image references; no automatic upload is introduced.

**Trade-off:** backup files are portable and collision-safe but do not merge records by identity, and browser/IndexedDB round-trip plus storage-failure behavior still need disposable-profile evidence.

## D12 — Validated preferences and explicit reset scope

**Status: Implemented with acceptance gaps.** Persisted `prefs.v1` values are normalized against the supported defaults/option maps; invalid modes/sections recover safely. Theme mode is shared between hook instances through a small in-page listener registry and responds to cross-tab `theme.mode` storage events. The Settings reset covers preferences and theme, but deliberately does not delete history, images, share defaults or Read-control keys.

**Trade-off:** keeping storage keys separated limits coupling and preserves existing behavior. Theme storage events synchronize the appearance preference across tabs, while a full-profile reset still requires a product decision. The reset button label names the implemented scope.

## D13 — Stable file-only batch identity

**Status: Implemented with acceptance gaps.** Batch entries receive generated IDs, progress/error state is keyed by ID, and processing receives an immutable copy of the selected entries. Output names are collision-safe. Failed entries can be retried, and an `AbortController` stops the queue at the next safe conversion boundary while preserving already-completed outputs. Directory traversal remains out of scope.

**Trade-off:** sequential processing is simple and isolates conversion failures; cancellation is cooperative because the current DOCX converter does not expose an abortable worker. A future worker can reduce cancellation latency without changing the file-entry contract.

## D14 — Central resource and network limits

**Status: Implemented with browser acceptance gaps.** Shared limits cover Markdown/share encoding, QR capacity, image bytes/pixels, Mermaid code and batch size. Supported image MIME types are normalized; active SVG content is rejected. TinyURL is opt-in with a 10-second abortable request and stale-result guard; clipboard failure is reported without throwing through the UI.

**Trade-off:** conservative bounds prevent unbounded work and clarify refusal behavior, but decompression/diagram work is still synchronous and may need worker offload after measurements.

## D15 — Shared modal and motion accessibility primitive

**Status: Implemented with browser acceptance gaps.** `useModalA11y` owns initial focus, Tab containment, Escape close and focus restoration for the modal/menu surfaces. Rename editing uses a non-interactive container rather than nesting an input inside a button. Reduced-motion suppresses the laser trail animation, not the pointer-following dot.

**Trade-off:** a small hook keeps behavior consistent without introducing a UI framework, but screen-reader, contrast and touch-target verification still require named browser/device checks.

## Decisions awaiting owner/product input

- Intended repository license (T21); no authoritative LICENSE file exists.
- Reference retention across documents/snapshots and cache eviction (T06); T07's backup schema is selected, with browser round-trip acceptance still pending.
- Supported runtime/browser/Office versions and measured performance targets (T16–T18).
- Word math editability versus image output, custom-template subset, directory assets and programmatic PDF value (deferred scope).
- Cloud/auth/collaboration/encryption/platform plans require independent privacy, cost and operational decisions.
