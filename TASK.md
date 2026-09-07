# TASK — Implementation and hardening ledger

Source baseline: `edd7906`. Documentation review: 2026-09-07 (UTC).

This is the canonical task-status record. [SPEC.md](SPEC.md) owns requirements; [ROADMAP.md](ROADMAP.md) owns sequencing; [docs/REVIEW.md](docs/REVIEW.md) records evidence. Documentation updates do **not** resolve application defects.

## Status and priority rules

- **Open**: not implemented or an existing implementation needs correction.
- **In progress**: implementation has actually started; acceptance evidence is not complete.
- **Blocked**: work cannot proceed until a named prerequisite is resolved. A release gate is not automatically an implementation blocker.
- **Done**: the stated deliverable exists and its completion evidence is recorded.
- **Deferred**: outside the current hardening scope, not promised for a release.
- **P0**: security/data-integrity or the verification infrastructure needed to protect it; **P1**: correctness/operability; **P2**: maintainability and optimization.

All open application tasks are unassigned. No delivery dates or effort estimates have been approved. The dependency column gives sequencing prerequisites, not claims that work has begun.

## Application backlog

| ID | Priority | Task | Status | Dependencies | Requirements |
|---|---|---|---|---|---|
| T01 | P0 | Safe preview HTML boundary | In progress | T17 | R02, R16 |
| T02 | P0 | Durable document-session lifecycle and save feedback | In progress | T17 | R06, R16 |
| T03 | P0 | Target-safe, atomic version restoration | In progress | T02, T05 | R07 |
| T04 | P0 | Isolated shared-document sessions | In progress | T02 | R03, R06 |
| T05 | P0 | Content-aware snapshots and mandatory recovery snapshots | In progress | T17 | R07 |
| T06 | P1 | Reactive images, ownership and cache lifecycle | In progress | T02, T17 | R08 |
| T07 | P1 | Portable, importable document/history backups | In progress | T06 | R03, R09 |
| T08 | P1 | Recursive, loss-aware DOCX conversion | In progress | T17 | R04 |
| T09 | P1 | Token-aware math and asynchronous preview lifecycle | In progress | T01, T17 | R02, R05 |
| T10 | P1 | Correct page layout, cover, TOC and print readiness | In progress | T08, T09 | R10, R11 |
| T11 | P1 | Desktop/mobile action parity | In progress | T17 | R01, R12 |
| T12 | P1 | Shared, validated preferences and stable document metadata | In progress | T02, T17 | R06, R13 |
| T13 | P1 | Stable batch queue and explicit file-only scope | In progress | T08, T17 | R14 |
| T14 | P1 | Resource limits and sharing/network resilience | In progress | T17 | R03, R08, R14, R16 |
| T15 | P1 | Keyboard, modal and presentation accessibility | In progress | T11, T17 | R12, R15 |
| T16 | P0 | Dependency advisory triage and safe upgrades | Open | Initial triage has no prerequisite; upgrades need T17 | R16, R17 |
| T17 | P0 | Automated test harness and CI quality gates | In progress | None | R17 |
| T18 | P2 | Measured preview, history, batch and PWA performance | Open | T06, T09, T13, T17 | R18 |
| T19 | P2 | Refactor orchestration and consolidate configuration | Open | T02, T08, T11, T12, T17 | R17, R18 |
| T21 | P1 | Confirm project license and add authoritative license file | Open | Repository owner decision | R17 |

## Acceptance details

### T01 — Safe preview HTML boundary

- Baseline evidence: `src/preview/MarkdownPreview.jsx` inserted raw `token.content` into the missing-image span; isolated rendering reproduced an executable HTML attribute. `html: false` does not protect custom renderer output.
- Current evidence: missing-image alt text and Mermaid error text now pass through `src/preview/htmlEscape.js`; `test/htmlEscape.test.js` covers the escaping contract.
- Remaining: define and test the final Markdown/math/diagram output boundary without breaking safe SVG, KaTeX or internal image URLs. Evaluate CSP as defense in depth, not as the sole fix.
- Done when hostile image alt text, links and diagram/math fixtures cannot introduce executable markup, and ordinary rendering remains intact.

### T02 — Durable document-session lifecycle

- Baseline evidence: `src/history/useHistory.js` used trailing-only 8-second saves, skipped empty text, and did not flush before open/new; `src/App.jsx` preferred the stored document over a potentially newer draft. Draft storage is global and errors are swallowed. PWA reload was not coordinated with saving.
- Current evidence: `useHistory` now serializes document writes, saves after an 8-second inactivity delay with a 30-second maximum wait, persists intentional empty edits for existing documents, exposes pending/saving/error state, and provides an explicit `flush`. App transitions for open/new/upload/sample/clear/Read and PWA reload use the barrier; failed writes remain visible and block the transition. Startup clears missing current IDs and offers a newer draft over the loaded document.
- Remaining: add real IndexedDB quota/transaction and multi-tab fixtures, define stronger conflict policy, and verify lifecycle behavior in browsers. Best-effort lifecycle saving still cannot guarantee survival of every browser crash.
- Done when continuous typing is persisted within the selected bound, empty edits persist intentionally, transitions cannot write to the wrong document, newer recovery content is offered, and failed saves prevent destructive transitions without informed consent.

### T03 — Target-safe restoration

- Baseline evidence: `src/history/HistoryPanel.jsx` chained `onOpen(id).then(() => onRestoreSnapshot(content))`; the callback closed over the previous document ID and content in `useHistory.js`.
- Current evidence: the restore callback passes the selected document ID explicitly; `useHistory` reads that target, creates a forced recovery snapshot before update, persists the target, and only then changes editor selection/content. Restore failures remain visible through the versions dialog and do not apply the replacement.
- Remaining: add persistence/failure fixtures that prove the backup and target update boundary under real IndexedDB behavior; T02 still owns pending-edit flush/transition coordination.
- Done when restoring B while A is selected never changes A, the correct pre-restore version is retained, and transaction failures leave recoverable content.

### T04 — Shared-document isolation

- Baseline evidence: opening a share left `history.currentDocId` selected; clicking Edit cleared the shared flag and resumed autosave into that ID. The `hashchange` handler did not establish the initial-load shared flag. A share opened directly in edit mode could remain permanently paused for saving.
- Current evidence: App state now tracks `sharedSession`; initial hash/query and later hash changes pause local persistence, and Edit/hash removal forks the content through `history.forkDocument` before enabling local autosave. Shared-mode exports do not reuse the previously selected local document's layout/title, and image ownership is not attached while shared.
- Remaining: verify first-load/hash/edit/reload transitions in a browser and coordinate pending-save flushes with T02 before treating the session boundary as complete.
- Done when receiving/editing shares, switching hashes, returning to local history and reloading never overwrite a pre-existing document or silently disable saving. Preview mode must be described as a UI mode, not access control.

### T05 — Snapshot integrity

- Baseline evidence: `src/history/snapshotRepo.js` compared JavaScript string-length difference against 32, not actual changed content or bytes. `restoreSnapshot` used the same filter and ignored backup errors.
- Current evidence: changed content is now eligible for automatic snapshots regardless of length; forced recovery snapshots bypass the normal empty-content guard, preserve exact duplicates from being added, and perform insertion/FIFO eviction in one read/write transaction. Pure policy tests cover equal-length rewrites, small edits and forced empty recovery content.
- Remaining: add fake-IndexedDB persistence tests for the 50-item FIFO boundary and concurrent/failing writes.
- Done when equal-length rewrites and small important edits receive the defined protection, forced backups cannot be skipped, and FIFO retention is tested. Snapshot pinning is not currently implemented and must not be implied.

### T06 — Image lifecycle

- Baseline evidence: preview `useMemo` depended only on Markdown, so cache notifications did not invalidate cached HTML. `useImages.attach` was exposed but never called. Images inserted before first save remained unowned; the cache had no eviction/removal API.
- Current evidence: `MarkdownPreview` subscribes to cache revisions, preloads references outside render, and renders a stable inert error placeholder for missing assets. `useImages` attaches referenced orphan records after a local document ID exists; owned records cannot be reparented, and shared sessions skip attachment. Pure ownership tests cover orphan/same-owner/other-owner cases.
- Remaining: add cache eviction/revocation and reference analysis across documents/snapshots, plus browser/IndexedDB tests for reload, deletion and format failures.
- Done when saved images display after reload without editing text, missing images settle to a useful error, deleting a document does not break another document's referenced image, and cache/storage cleanup is bounded.

### T07 — Portable backups

- Baseline evidence: history ZIP contained Markdown only; share compression included only text. `mdimg://` IDs could not resolve on another browser. Snapshot directories used sanitized titles and second-resolution timestamps, allowing collisions; `INDEX.md` did not use deduplicated document filenames.
- Current evidence: `src/history/exportHistory.js` now writes and validates `markdown-editor-backup` v1 manifests containing document metadata/layout, snapshots and image assets. Import remaps document/image/snapshot IDs, rejects unsafe paths, missing references, corrupt UTF-8, size/count overages and asset size mismatches, then commits all records in one IndexedDB transaction. History exposes Import Backup even for an empty profile. Text-only share URLs now warn when local `mdimg://` references are present without uploading them. Pure manifest/reference tests pass.
- Remaining: run real browser/IndexedDB round trips in a disposable profile, verify duplicate-title/timestamp and failure behavior, and confirm the user-visible archive contains every manifest path. Cache/reference retention remains T06 work.
- Done when export/import into an empty profile restores content, images and layout, duplicate titles/timestamps cannot overwrite entries, and missing/corrupt/oversized inputs produce clear errors.

### T08 — DOCX fidelity

- Baseline evidence: isolated DOCX XML checks showed missing nested list code, quoted headings, inline images and deletion formatting. Inline reference links, task-list state and list start/restart semantics also lacked explicit handling.
- Current evidence: the converter now awaits recursive block/inline conversion, preserves list-item continuation blocks, GFM task markers, deletion runs, inline/data/internal images, quoted child blocks and ordered-list starts. Table header styling is inherited into nested runs, and unsupported block nodes become explicit readable fallback paragraphs. `test/docx.test.js` unzips generated DOCX files and covers these XML/media contracts.
- Remaining: broaden supported-node/reader fixtures, verify internal image loading and unsupported fallbacks in a browser, and run representative files through Word and LibreOffice. Complex quote styling and some list semantics still need reader-level acceptance.
- Done when the supported syntax fixtures preserve content and semantics in DOCX XML, unsupported input never disappears silently, and representative files open correctly in Word and LibreOffice.

### T09 — Math/diagram preview lifecycle

- Baseline evidence: `src/preview/mathRenderer.js` rewrote the entire HTML string with regular expressions; a code-fence fixture was rewritten as math. Formula text could already be HTML-escaped. KaTeX output is HTML only; import rejection was not handled by the preview's promise chain.
- Current evidence: math detection ignores fenced/inline code, escaped dollars and currency; HTML post-processing maps text nodes only and skips `pre/code` plus attributes. KaTeX loading failures fall back to base preview HTML, and preview effects reset to the latest base revision before async work completes. Mermaid loader/render failures become visible error content, and hydration checks cancellation plus current-container ownership before mutation. `test/mathRenderer.test.js` covers code/currency detection and HTML boundary behavior.
- Remaining: browser DOM tests for rapid math/Mermaid edits, malformed/slow diagrams, accessibility output and CSS/readiness behavior. Word math remains ordinary text by design.
- Done when math affects only intended tokens, malformed input and failed lazy imports do not leave stale output, rapid edits settle to the latest render, and accessible math output has an explicit policy.

### T10 — Layout and PDF correctness

- Current evidence: `pageLayout.js` now passes base page dimensions to `docx`, which serializes the landscape swap once. Explicit 1-inch page margins are shared with page-aware image sizing; A4 XML tests produce `11906×16838` portrait and `16838×11906` landscape. Cover export falls back to the document title/export date when fields are empty, sets `w:titlePg`, and supplies empty first-page header/footer parts so body headers/page numbers do not appear on the cover. DOCX requests `w:updateFields` for the generated TOC field. `test/layoutPrint.test.js` covers these XML/settings contracts and the print readiness helper.
- Current PDF behavior remains preview printing, not Word-layout parity. The preview exposes a render-ready state; `downloadPdf` waits for math/diagram hydration, fonts, images and two layout frames, with a bounded five-second best-effort timeout. Print CSS resets Read zoom and hides presentation overlays.
- Remaining: verify cover/header/footer/page-number behavior, TOC links/field refresh, all page sizes, image aspect ratios and PDF pagination in actual Word/LibreOffice and supported browsers. A reader may still differ from XML contracts, and PDF layout synchronization beyond HTML print requires an explicit decision.
- Done when portrait/landscape XML dimensions are correct, promised cover/TOC behavior passes reader checks, and print output is complete across supported browsers. PDF layout synchronization beyond this requires an explicit decision.

### T11 — Action parity

- Current evidence: Document Layout, Batch Convert and Insert Image picker remain in the shared `moreItems` action registry, and the overflow-menu trigger is now rendered on desktop, tablet and mobile. Content/session-dependent disabled states remain owned by the registry.
- Remaining: verify pointer/keyboard reachability, focus behavior, action-sheet sizing and saved-document/session-dependent enabled states at representative viewport widths. A browser/component check is still required.
- Done when these features are reachable by keyboard and pointer on desktop/tablet/mobile, and layout does not require waiting for an unexplained autosave to become available.

### T12 — Preferences and metadata

- Current evidence: `normalizePrefs` now allowlists persisted editor/draft/presentation values and drops unknown fields; `useTheme` shares state across hook instances, normalizes invalid modes and consumes cross-tab `theme.mode` storage events. Settings reset explicitly resets `prefs.v1` plus the Settings theme to `system`; it does not delete history, share or Read-control keys. Documents now persist `titleSource`, preserve manual titles during content updates, preserve legacy derived-title behavior, and serialize document content/layout/pin/rename/delete mutations per document. Backup manifests preserve optional title-source metadata.
- Remaining: verify preference/theme behavior in a browser and prove serialized IndexedDB metadata operations under failure/concurrency. Full preference migrations and reset behavior for keys outside the Settings sheet remain out of scope until defined.
- Done when all theme controls agree, old/malformed storage recovers safely, reset matches its label, renamed titles survive edits and concurrent operations do not revert metadata.

### T13 — Batch queue

- Current evidence: `createBatchEntry` gives each accepted file a stable queue ID; the UI keys progress/errors/removal by that ID and passes a copied batch to the processor. Processing disables selection/removal, duplicate output names receive unique ZIP entries, failed entries can be retried, and an `AbortController` stops the queue at a safe conversion boundary. Batch limits are 100 files, 2 MiB per Markdown file and 50 MiB total input. The UI remains explicitly file-only; no directory traversal is implied.
- Remaining: run browser checks for duplicate names, partial/all failures, retry, cancellation and changing selections. Keep file-only wording unless directory traversal is separately implemented.
- Done when duplicate filenames, partial/all failures, failed-entry retry, cancellation and changing selections cannot corrupt progress/results; successful ZIP entries remain unique.

### T14 — Resource and network boundaries

- Current evidence: `src/limits/resourceLimits.js` defines Markdown/share/QR/image/pixel/diagram/batch limits. Share encoding and decoding reject oversized content before the expensive path; QR controls refuse links above the configured capacity; TinyURL requests have a timeout, caller cancellation and stale-result protection; clipboard failures return a user-visible fallback message. Image insertion accepts only converter-supported MIME types, rejects active SVG content and bounds bytes/pixels; Mermaid and batch input sizes are bounded with explicit errors.
- Remaining: verify large-input behavior in browsers, test image decode failures and malformed SVGs, and decide whether decompression/diagram work needs worker offload. Network egress remains opt-in through the existing TinyURL action.
- Done when boundary/oversized inputs fail safely without freezing, late shortener results cannot replace a newer link, and data-egress consent is clear.

### T15 — Accessibility

- Current evidence: `useModalA11y` provides initial focus, Tab containment, Escape close and focus restoration for Settings, Layout, Share, Batch, More, History and Versions surfaces. Dialog/menu labels and existing control roles remain in place; history rename no longer nests an input inside a button. Laser canvas trail animation is disabled when `prefers-reduced-motion: reduce` is active.
- Remaining: run keyboard/screen-reader/focus checks in supported browsers and record measured contrast/touch-target results. The current hook is a small shared primitive, not a substitute for full browser accessibility certification.
- Done when keyboard-only workflows, focus restoration, screen-reader labels and reduced-motion presentation pass documented browser checks; record measured contrast/touch-target results rather than assuming HIG compliance.

### T16 — Dependency safety

- Evidence and exact versions: [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md). Review-time audit reported 19 affected-package vulnerability entries, including build-time/transitive packages; this is not proof that every advisory is exploitable in this app.
- Triage exposure and fix options; upgrade compatible sets and retest parser, diagram, DOCX and PWA behavior. Do not apply `npm audit fix --force` indiscriminately.
- Done when actionable runtime/build risks are fixed or have documented time-bounded acceptance, lockfile/build are reproducible, and a supported CI/local Node policy is recorded.

### T17 — Harness and CI

- Evidence: `package.json` now has a `test` script using Node's built-in `node:test`; `test/` covers DB helpers, Markdown AST parsing, share URL/local-image warnings and limits, preview escaping, snapshot policy, save timing, image ownership/format boundaries, backup manifest/reference validation, document metadata, batch identities/cancellation, shortener cancellation, DOCX XML/media contracts, math HTML boundaries and page/layout/print contracts. The latest local run passed **35 tests**. GitHub Actions now runs `npm test` and `npm run build` on pull requests and main pushes before deployment.
- Remaining: add component/persistence fixtures, failure-first regression fixtures for T01–T16, lint/type checks and browser E2E. Vitest/React Testing Library/fake-indexeddb/Playwright remain candidates, not current dependencies.
- Keep real-browser/Word validation distinct from unit results.
- Done when documented commands run in a clean checkout, failing critical regressions block deployment, and test artifacts/limitations are recorded. Large refactors must follow, not precede, this foundation.

### T18 — Performance

- Evidence: each text change synchronously renders the entire preview; history refresh loads all content; Mermaid is a large manual chunk; Workbox precaches lazy assets too. No measured Lighthouse/browser performance results were produced in this review.
- Establish representative size/device fixtures and separate startup critical-path bytes from background precache traffic. Measure before choosing workers, incremental rendering, virtualization, lazy modal imports or narrower diagram chunks.
- Done when agreed performance budgets have repeatable measurements and regressions are gated. No arbitrary throughput or timing target is a current guarantee.

### T19 — Architecture consolidation

- Evidence: `src/App.jsx` combines sample content, SVG icons, toolbar/modal orchestration and session lifecycle. Word defaults coexist in `wordStyleConfig.js`, templates and converter constants; settings controls are duplicated.
- Extract session orchestration, shared action/modal primitives and sample fixtures; consolidate styles and configuration. Choose shared parsing infrastructure only after semantic fixtures protect both outputs.
- Done when ownership is explicit, duplicate sources are removed without feature regressions, and [DESIGN.md](DESIGN.md) describes the actual new boundaries.

### T21 — License

- Evidence: the earlier README advertised MIT, but the tracked repository has no LICENSE file.
- Owner must confirm the intended license before adding its authoritative text and restoring a badge. Dependency licenses are separate.
- Done when repository licensing is explicit and README/package metadata agree. Documentation maintenance must not choose a license on the owner's behalf.

## Completed maintenance

| ID | Deliverable | Status | Evidence |
|---|---|---|---|
| T20 | Codebase review and source-aligned documentation reconciliation | Done | Updated README, DESIGN, SPEC, EPIC, EPIC-V3, ROADMAP, TASK, TESTING and supporting docs; build/isolated checks recorded in docs/REVIEW.md. Application fixes remain Open. |

## Deferred scope

Custom Word template upload, native Word math, image library UI, true directory traversal, cloud sync/authentication, collaboration, encrypted workspaces, plugin/API mode, AI writing, native wrappers, preference import/export and localization are **Deferred**, not delivered requirements. See [ROADMAP.md](ROADMAP.md) for decisions needed before promotion.

## Immediate next steps

1. Run disposable browser/Office reader checks for T10 layout/TOC/cover/print and T11/T15 keyboard/focus behavior.
2. Complete T01's browser/security, T02/T04 transition and T05/T07 persistence/round-trip acceptance; add failure/multi-tab fixtures.
3. Run T13 retry/cancel UX and T14 large-input/image decode browser checks before claiming the interaction hardening tasks complete.
