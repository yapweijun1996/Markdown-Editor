# TASK — Implementation and hardening ledger

Source baseline: `445cc05bcbc69647c3d08eb17edcd2d2da5ee56a`. Documentation review: 2026-09-07 (UTC).

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
| T02 | P0 | Durable document-session lifecycle and save feedback | Open | T17 | R06, R16 |
| T03 | P0 | Target-safe, atomic version restoration | Open | T02, T05 | R07 |
| T04 | P0 | Isolated shared-document sessions | Open | T02 | R03, R06 |
| T05 | P0 | Content-aware snapshots and mandatory recovery snapshots | Open | T17 | R07 |
| T06 | P1 | Reactive images, ownership and cache lifecycle | Open | T02, T17 | R08 |
| T07 | P1 | Portable, importable document/history backups | Open | T06 | R03, R09 |
| T08 | P1 | Recursive, loss-aware DOCX conversion | Open | T17 | R04 |
| T09 | P1 | Token-aware math and asynchronous preview lifecycle | Open | T01, T17 | R02, R05 |
| T10 | P1 | Correct page layout, cover, TOC and print readiness | Open | T08, T09 | R10, R11 |
| T11 | P1 | Desktop/mobile action parity | Open | T17 | R01, R12 |
| T12 | P1 | Shared, validated preferences and stable document metadata | Open | T02, T17 | R06, R13 |
| T13 | P1 | Stable batch queue and explicit file-only scope | Open | T08, T17 | R14 |
| T14 | P1 | Resource limits and sharing/network resilience | Open | T17 | R03, R08, R14, R16 |
| T15 | P1 | Keyboard, modal and presentation accessibility | Open | T11, T17 | R12, R15 |
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

- Evidence: `src/history/useHistory.js` uses trailing-only 8-second saves, skips empty text, and does not flush before open/new; `src/App.jsx` prefers the stored document over a potentially newer draft. Draft storage is global and errors are swallowed. PWA reload is not coordinated with saving.
- Establish explicit session identity, dirty/saving/saved/error state, bounded save delay, recoverable errors and serialized writes. Flush before in-app transitions and service-worker activation. Use best-effort lifecycle saving plus recovery; do not promise that asynchronous writes survive every browser crash.
- Handle new/open/upload/sample/clear, read mode, missing current IDs, startup recovery, failed storage and concurrent tabs. Define clearing separately from deleting a document.
- Done when continuous typing is persisted within the selected bound, empty edits persist intentionally, transitions cannot write to the wrong document, newer recovery content is offered, and failed saves prevent destructive transitions without informed consent.

### T03 — Target-safe restoration

- Evidence: `src/history/HistoryPanel.jsx` chains `onOpen(id).then(() => onRestoreSnapshot(content))`; the callback closes over the previous document ID and content in `useHistory.js`.
- Restore by explicit document/snapshot identity; atomically preserve the target's current content before replacing it. Update editor state only after successful persistence, or provide an explicit recoverable optimistic state.
- Done when restoring B while A is selected never changes A, the correct pre-restore version is retained, and transaction failures leave recoverable content.

### T04 — Shared-document isolation

- Evidence: opening a share leaves `history.currentDocId` selected; clicking Edit clears the shared flag and resumes saving into that ID. The `hashchange` handler does not establish the initial-load shared flag. A share opened directly in edit mode can remain permanently paused for saving.
- Use explicit local/shared session state; editing a received document creates a new local identity. Make initial hash/query decoding and later hash changes follow the same transition policy.
- Done when receiving/editing shares, switching hashes, returning to local history and reloading never overwrite a pre-existing document or silently disable saving. Preview mode must be described as a UI mode, not access control.

### T05 — Snapshot integrity

- Evidence: `src/history/snapshotRepo.js` compares JavaScript string-length difference against 32, not actual changed content or bytes. `restoreSnapshot` uses the same filter and ignores backup errors.
- Compare content meaningfully; separate optional automatic snapshots from mandatory recovery snapshots. Keep insertion/retention consistent under concurrent writes.
- Done when equal-length rewrites and small important edits receive the defined protection, forced backups cannot be skipped, and FIFO retention is tested. Snapshot pinning is not currently implemented and must not be implied.

### T06 — Image lifecycle

- Evidence: preview `useMemo` depends only on Markdown, so cache notifications do not invalidate cached HTML. `useImages.attach` is exposed but never called. Images inserted before first save remain unowned; the cache has no eviction/removal API.
- Subscribe the preview to asset revision/loading/error state, attach new-document assets, define reference ownership across documents/snapshots, and revoke unused object URLs safely.
- Done when saved images display after reload without editing text, missing images settle to a useful error, deleting a document does not break another document's referenced image, and cache/storage cleanup is bounded.

### T07 — Portable backups

- Evidence: history ZIP contains Markdown only; share compression includes only text. `mdimg://` IDs cannot resolve on another browser. Snapshot directories use sanitized titles and second-resolution timestamps, allowing collisions; `INDEX.md` does not use deduplicated document filenames.
- Specify a versioned manifest, document IDs, metadata, snapshots and assets; implement validated import and collision-safe names. Decide how text-only URLs warn about unavailable assets; do not silently upload images to a service.
- Done when export/import into an empty profile restores content, images and layout, duplicate titles/timestamps cannot overwrite entries, and missing/corrupt/oversized inputs produce clear errors.

### T08 — DOCX fidelity

- Evidence: isolated DOCX XML checks show missing nested list code, quoted headings, inline images and deletion formatting. Inline reference links, task-list state and list start/restart semantics also lack explicit handling.
- Use recursive block/inline conversion with an explicit supported-node contract and warnings or readable fallbacks for unsupported nodes. Preserve list-item continuation paragraphs and template behavior; validate table-header styling rather than assuming config mutation reaches XML.
- Done when the supported syntax fixtures preserve content and semantics in DOCX XML, unsupported input never disappears silently, and representative files open correctly in Word and LibreOffice.

### T09 — Math/diagram preview lifecycle

- Evidence: `src/preview/mathRenderer.js` rewrites the entire HTML string with regular expressions; a code-fence fixture was rewritten as math. Formula text can already be HTML-escaped. KaTeX output is HTML only; import rejection is not handled by the preview's promise chain.
- Parse math at the token/AST layer or another structure-aware boundary; preserve escaped dollars, code and attributes. Add cancellation/error/retry and stable hydration for asynchronous math/diagrams.
- Done when math affects only intended tokens, malformed input and failed lazy imports do not leave stale output, rapid edits settle to the latest render, and accessible math output has an explicit policy.

### T10 — Layout and PDF correctness

- Evidence: `pageLayout.js` swaps landscape dimensions before `docx` swaps them again; generated A4 XML has portrait dimensions plus a landscape flag. Cover content shares the body section; there is no different-first-page header/footer setting. Cover title/date placeholders are not persisted values. TOC interoperability is unverified.
- Use one authoritative page-size mapping; define cover/header/footer/page-number behavior, validate TOC structure and field refresh in actual readers. Derive image sizing from writable page dimensions rather than fixed 600 px assumptions.
- Define PDF as preview printing, not Word-layout parity. Await images, math, diagrams and fonts before printing; verify presentation overlays and zoom do not contaminate output.
- Done when portrait/landscape XML dimensions are correct, promised cover/TOC behavior passes reader checks, and print output is complete across supported browsers. PDF layout synchronization beyond this requires an explicit decision.

### T11 — Action parity

- Evidence: Document Layout, Batch Convert and Insert Image picker exist only in `moreItems`, while the More trigger is hidden on desktop.
- Render responsive actions from one registry, keeping content/session-dependent enabled states correct.
- Done when these features are reachable by keyboard and pointer on desktop/tablet/mobile, and layout does not require waiting for an unexplained autosave to become available.

### T12 — Preferences and metadata

- Evidence: separate `useTheme` instances own independent state; reset only resets `prefs.v1`, not theme/share/zoom keys. Preference merge is not schema validation. `updateDocument` re-derives the title and overwrites manual renames; read/modify/write metadata updates use separate transactions.
- Share theme state; validate persisted values, define reset scope and migrations, and distinguish custom titles from derived titles. Preserve layout/pin/title during overlapping saves and metadata changes.
- Done when all theme controls agree, old/malformed storage recovers safely, reset matches its label, renamed titles survive edits and concurrent operations do not revert metadata.

### T13 — Batch queue

- Evidence: UI progress/errors/keys/removal use filenames, while input deduplication uses name plus size. Files can be added while a captured queue is processing; no folder traversal or cancellation exists.
- Give every input a stable identity and define immutable processing batches; handle retries, failures and cancellation. Retain file-only wording unless directory traversal is separately implemented.
- Done when duplicate filenames, partial/all failures and changing selections cannot corrupt progress/results; successful ZIP entries remain unique.

### T14 — Resource and network boundaries

- Evidence: single-file upload enforces 2 MiB, but pasted/shared/batch content and images have no equivalent limits. Share decompression is synchronous; TinyURL lacks timeout/cancellation and stale-result protection. Broad image acceptance is not full DOCX format support (WebP defaults to PNG type without transcoding; SVG fallback needs validation).
- Define configurable limits for encoded/decoded text, images/pixels, diagrams and batch work; bound processing and explain refusals. Normalize supported image formats. Handle clipboard failure, QR capacity, shortener timeout and changed input.
- Done when boundary/oversized inputs fail safely without freezing, late shortener results cannot replace a newer link, and data-egress consent is clear.

### T15 — Accessibility

- Evidence: modal components do not provide a shared focus trap/return/Escape contract; the history rename input is nested in a button. Reduced-motion CSS does not stop the laser's canvas animation.
- Introduce accessible modal/menu primitives, labelled fields, keyboard tabs/radio groups, live save/error feedback and motion-aware presentation behavior.
- Done when keyboard-only workflows, focus restoration, screen-reader labels and reduced-motion presentation pass documented browser checks; record measured contrast/touch-target results rather than assuming HIG compliance.

### T16 — Dependency safety

- Evidence and exact versions: [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md). Review-time audit reported 19 affected-package vulnerability entries, including build-time/transitive packages; this is not proof that every advisory is exploitable in this app.
- Triage exposure and fix options; upgrade compatible sets and retest parser, diagram, DOCX and PWA behavior. Do not apply `npm audit fix --force` indiscriminately.
- Done when actionable runtime/build risks are fixed or have documented time-bounded acceptance, lockfile/build are reproducible, and a supported CI/local Node policy is recorded.

### T17 — Harness and CI

- Evidence: `package.json` now has a `test` script using Node's built-in `node:test`; `test/` covers pure DB helpers, Markdown AST parsing and share URL round trips. GitHub Actions now runs `npm test` and `npm run build` on pull requests and main pushes before deployment.
- Remaining: add component/persistence fixtures, DOCX XML assertions, failure-first regression fixtures for T01–T16, lint/type checks and browser E2E. Vitest/React Testing Library/fake-indexeddb/Playwright remain candidates, not current dependencies.
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

1. Complete T01's browser/security fixture and implementation acceptance, then implement T02/T05 against disposable data.
2. Implement T03/T04 after T02/T05, with safety tests before changing real stored data.
3. Complete fidelity, portability and UI work, then measure/refactor. Keep this ledger and linked acceptance evidence updated in the same change.
