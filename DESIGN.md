# DESIGN — Current architecture and design boundaries

Baseline: `d946eab` plus the currently verified working-tree changes · reviewed 2026-09-07 (UTC).

This replaces the original MVP proposal with the architecture actually present in `src/`. Proposed corrections are labelled explicitly. [SPEC.md](SPEC.md) owns requirements/defaults, [TASK.md](TASK.md) owns work status, and [docs/DECISIONS.md](docs/DECISIONS.md) records implemented choices versus proposals.

Current source note: `d946eab` plus the verified working-tree changes described in TASK and REVIEW; no browser/Office acceptance is implied.

## 1. Product model

A browser-resident document editor/compiler: Markdown is source text; HTML preview and DOCX are separate rendering targets. PDF is a print of HTML preview, not a DOCX conversion. IndexedDB/localStorage provide local persistence, not synchronization or backup guarantees.

React 18 and plain JavaScript/JSX run under Vite. There is no router library, backend, authentication, application API, TypeScript configuration, global preferences provider or worker-based converter. A small Node built-in test suite now covers pure contracts; browser/component/IndexedDB integration coverage is still pending.

## 2. Runtime architecture

```text
src/main.jsx (React.StrictMode; theme -> app -> print CSS)
  |
  +-- App.jsx: Markdown state, current mode, toolbar, modal visibility,
  |            startup/hash routing, draft timer, export orchestration
  |
  +-- editor/ --------------------------> setMarkdown
  +-- history/useHistory ---------------> current ID, docs, restore -> setMarkdown
  +-- images/useImages -----------------> IndexedDB blobs + in-memory URL cache
  +-- preferences/usePreferences -------> prefs.v1
  +-- theme/useTheme --------------------> shared theme.mode + document data-theme
  +-- limits/resourceLimits --------------> shared input/image/share/batch boundaries
  +-- accessibility/useModalA11y ---------> modal focus, Tab and Escape lifecycle
  +-- preview/usePreviewControls -------> zoom, width, scroll-driven toolbar
  |
  +-- MarkdownPreview: markdown-it -> HTML -> async KaTeX -> DOM -> Mermaid SVG
  +-- downloadDocx: remark/GFM AST -> converter modules -> docx Blob -> file-saver
  +-- downloadPdf: render-ready barrier -> print.css -> browser Save as PDF
  +-- ShareModal: LZ compression -> URL fragment -> clipboard / QR / TinyURL opt-in
  +-- BatchConvertSheet: selected .md files -> sequential DOCX -> JSZip
  +-- HistoryPanel/VersionsView: repositories -> list/search/restore/text ZIP
  +-- UpdatePrompt: generated Workbox SW registration -> update countdown
```

These modules are separated by responsibility but **not independent failure domains**. Export reads document layout/history and image storage, and Mermaid export imports the preview renderer. Mode changes pause saving. PWA reload can discard pending edits. Changes across these boundaries require integration tests.

## 3. Module ownership

| Directory/file | Actual responsibility and important coupling |
|---|---|
| `src/App.jsx` | Root orchestration plus sample Markdown and inline SVG icons; no explicit session object |
| `src/editor/` | Controlled textarea, cursor insertion, image paste/drop and `.md` picker hook; `FileUploader.jsx` is not used by App |
| `src/parser/parseMarkdown.js` | Reused unified + remark-parse + remark-gfm processor returning MDAST |
| `src/preview/` | markdown-it renderer, lazy math/diagrams, read controls, laser DOM/canvas |
| `src/converter/` | AST-to-DOCX mapping, template application, image/diagram embedding, page/cover/TOC assembly |
| `src/download/` | Lazy DOCX orchestration/download and print trigger |
| `src/styles/templates/` | Four built-in template objects and lookup with default fallback |
| `src/styles/wordStyleConfig.js` | Legacy duplicate baseline; still imported by image fallback conversion, not the universal style source |
| `src/styles/theme.css` | Light/dark design tokens, safe areas and reduced-duration CSS motion |
| `src/styles/app.css` | Layout/components/responsiveness/preview/presentation; contains values beyond theme tokens |
| `src/styles/print.css` | Separate static print layout; not driven by document layout |
| `src/history/` | DB opening, document/snapshot repositories, hook, history UI, versioned backup export/import |
| `src/images/` | Blob repository, downscale, URI helpers, process-wide object URL cache and insertion helpers |
| `src/preferences/` | Version-1 defaults, allowlisted storage normalization, hook, Settings sheet, draft storage/prompt |
| `src/theme/` | Shared in-page theme state, mode normalization and document theme/localStorage synchronization |
| `src/components/` | Responsive More action sheet and per-document Layout sheet |
| `src/share/` | Hash compression/decoding, bounded copy/share/QR paths, optional cancellable TinyURL request |
| `src/batch/` | File collection with stable entry IDs, immutable processing batches and sequential DOCX ZIP generation |
| `src/limits/` | Central resource and supported-image MIME limits used by share, image, diagram and batch paths |
| `src/accessibility/` | Shared modal focus/Tab/Escape/focus-return behavior |
| `src/pwa/UpdatePrompt.jsx` | SW registration via virtual module, hourly checks and 30-second countdown |

## 4. Document/session state and lifecycle

Current state is distributed:

- App: `markdown`, `previewOnly`, `sharedSession`, presentation/modal/mobile-tab state and pending draft.
- History hook: `currentDocId`, full `docs` list, `supported` flag and a content-only `lastSavedRef`.
- Browser persistence: remembered ID, a single draft, documents/snapshots/images and separately stored preferences.

Startup checks a shared hash (or legacy query), establishes a shared session and pauses local persistence; otherwise it opens the remembered document and offers a global draft when its timestamp is newer. Shared Edit creates a new local document identity before autosave resumes. A missing remembered document is cleared and falls through to draft recovery.

Document saves use an 8-second inactivity debounce with a 30-second maximum wait; snapshots use a 30-second trailing debounce. Read mode and the shared-link flag pause automatic writes after transition barriers. The draft timer has its own delay/enablement. Open/new/upload/sample/clear, Read and PWA reload call an explicit flush; save state is surfaced as pending/saving/error. Multi-tab conflict policy and browser crash guarantees remain open. Empty edits update an existing document intentionally.

Shared content detaches the remembered local document identity and pauses local persistence, preventing shared edits from entering it. Editing a share now forks a local document; first-load, later hash changes and hash removal use the same session policy. Version restore passes an explicit target identity and persists a forced recovery snapshot before replacement, while transition/save coordination remains open.

**Current direction (T02–T05):** `useHistory` is the current document-session boundary with explicit local/shared identity at App level, dirty/saving/saved/error state, serialized writes, transition flushes and target-ID restoration. IndexedDB failure injection, conflict policy and full transactional recovery remain to be verified.

## 5. Persistence schema

Source: `src/history/db.js` and repositories. DB: `markdown-editor-db`, version **2**. All stores use key path `id` with nanoid-generated strings (not UUID semantics).

| Store | Indexes | Record fields |
|---|---|---|
| `documents` | `updatedAt`, `pinned` | `id`, `title`, `titleSource` (`derived`/`manual`), `content`, `createdAt`, `updatedAt`, `wordCount`, `sizeBytes`, `pinned` (0/1), `templateId`, `layout` |
| `snapshots` | `documentId`, `createdAt` | `id`, `documentId`, `content`, `createdAt` |
| `images` | `documentId`, `createdAt` | `id`, nullable `documentId`, `filename`, `mimeType`, `blob`, `width`, `height`, `sizeBytes`, `createdAt` |

- `layout` contains pageSize/orientation/header/footer/pageNumbers and coverPage enabled/title/subtitle/author/date. Defaults are merged on reads; no separate template store exists.
- `listDocuments()` loads all records, then sorts pins first and updated time descending. Search scans title/content in React memory; no full-text index or pagination exists.
- Titles derive from the first Markdown heading of any level or first nonblank line, strip selected formatting characters and cap at 80 characters. Word count splits on whitespace, not language-aware segmentation.
- Legacy records without `titleSource` are treated as derived. Manual renames persist their source and survive content saves. Content/layout/pin/rename/delete repository mutations are queued per document to reduce stale read/modify/write overwrites; IndexedDB failure/concurrency acceptance remains pending.
- Deleting a document uses a multi-store transaction to cascade snapshots and images indexed to that ID. Unowned images are not included. Shared-reference safety is not modeled.
- Snapshots contain content only: no layout, title, pin or image copy. Automatic retention caps them at 50, with no pinned-snapshot exception. Changed content is eligible regardless of length; forced recovery snapshots use the same FIFO store and may preserve empty content.
- DB open failure resets the cached open promise. Blocked upgrade only logs a warning; no user-assisted multi-tab upgrade recovery is implemented.

### localStorage keys

| Key | Owner / data |
|---|---|
| `prefs.v1` | version 1: editor, draft, presentation preferences |
| `theme.mode` | light/dark/system |
| `share.previewOnly` | default checked state for share modal |
| `md.previewZoom` | persisted read scale |
| `md.previewLockWidth` | persisted width-lock boolean |
| `history.currentDocId` | last selected document ID |
| `draft.current` | `{ content, savedAt }`, single global recovery draft |

No local data is encrypted. Storage can fail or be cleared/evicted. Most localStorage helpers swallow errors. There is no app-level full backup import or persistent-storage request guaranteeing retention.

## 6. Preview pipeline and trust boundary

`markdown-it` uses `html: false`, `linkify: true`, `typographer: true`, `breaks: false`. Custom rules wrap tables, set HTTP(S) link attributes, resolve `mdimg://` images and mark Mermaid fences.

`useMemo` renders HTML synchronously on text change. An effect optionally replaces math in that HTML string and commits it through `dangerouslySetInnerHTML`. Another effect replaces Mermaid code blocks with asynchronously rendered SVG (`securityLevel: strict`, neutral theme).

Known boundary violations:

- Missing-image alt text and Mermaid error text are escaped at construction through `src/preview/htmlEscape.js`; browser-level hostile-input and final DOM acceptance remain pending (T01).
- Cache notifications rerender App but do not invalidate Markdown-only HTML memoization (T06).
- Math post-processing scans text nodes rather than arbitrary HTML and skips code/attributes; KaTeX failures fall back to base HTML. Mermaid hydration is cancellation/current-container aware, and `MarkdownPreview` exposes a render-ready state for print. Browser error/accessibility and viewport lifecycle acceptance remain incomplete (T09/T10/T18).

Remote images may be fetched by the browser. No final common sanitizer or CSP meta is configured. Proposed safety changes must preserve legitimate KaTeX/SVG/image rendering and be verified with hostile-input fixtures.

## 7. DOCX and PDF pipelines

`downloadDocx` imports the converter and file-saver on demand. The converter parses Markdown, registers list numbering, recursively converts block/inline nodes (including async image runs) concurrently at the top level with `Promise.all`, flattens output, prepends cover paragraphs, applies page properties/header/footer, and packs one section to Blob. Unsupported block nodes become readable fallback paragraphs instead of disappearing silently.

- Most converter modules receive the selected template `cfg`; the default is `defaultTemplate`.
- List conversion preserves focused nested list/paragraph/continuation blocks and delegates other nested blocks to the fallback-aware converter; blockquotes preserve supported nested blocks. Inline handling includes local/data images and deletion runs; reference-link semantics remain incomplete.
- Numbering defines six bullet/ordered levels. Both list depth limits and numbering/layout/style values remain partially hardcoded.
- Images resolve cached/stored `mdimg://` Blobs or data URIs. Remote fetching is deliberately absent from DOCX conversion. Image format normalization and SVG fallback are incomplete.
- Mermaid export uses DOM/Image/canvas to rasterize SVG, so the full converter is not a headless Node-only API even though simple text export can run in Node.
- Cover content remains in the same section as the body and ends in a page break, but enabled covers set `w:titlePg` and provide empty first-page header/footer parts. Empty cover title/date fields fall back to the document title/export date.
- `pageLayout.js` is the page-size source of truth: it passes base dimensions to `docx`, sets explicit margins and derives writable image width from the oriented physical page. XML contracts now cover portrait/landscape output; reader behavior remains to be validated.
- TOC is a generated Word field, not computed page numbers. `w:updateFields` is requested in settings, but Office compatibility, links and actual page numbers still need real-reader validation.

PDF prints the preview with static A4 CSS; Word templates/layout/cover/TOC do not drive it. `downloadPdf` waits for the preview render-ready state, fonts, images and two layout frames, then calls `window.print()` with a five-second best-effort bound. Presentation overlays are hidden and Read zoom is reset by print CSS. Browser pagination and print-dialog output remain unverified.

## 8. Asset and archive boundaries

Insertion stores a Blob, validates supported MIME types/size, rejects active SVG content, optionally downscales it, caches a temporary object URL and inserts `![alt](mdimg://id)` at the textarea selection. `mdimg://` is the persistent reference; `blob:` URLs are temporary browser resources, not stored Markdown identity. Decoded pixel and image byte limits are enforced.

`imageCache.js` has cache/pending/failed maps and subscribers. Preview subscribes to revisions, and loading failures settle to an inert error placeholder. It revokes a URL when replacing the same entry, but has no bounded eviction or deletion invalidation. Orphan attachment runs when a local document ID becomes available and refuses to transfer an image already owned by another document.

History export writes a versioned `markdown-editor-backup` v1 archive with `manifest.json`, `INDEX.md`, collision-safe document/snapshot paths and image asset bytes. The manifest preserves document IDs, title/title-source/timestamps, pin/template/layout metadata, snapshot identity/timestamps and asset ownership metadata. Import validates relative paths, duplicate identities, missing files, UTF-8/content references, archive entry/count limits and image sizes, remaps IDs to avoid collisions and commits documents/snapshots/images in one IndexedDB transaction. Browser/IndexedDB round-trip and failure evidence remains pending.

Share URLs similarly carry text only and warn when local `mdimg://` references are present; they do not upload assets. Encoded/decoded text, share-link and QR bounds are enforced; TinyURL is opt-in and cancellable. The backup manifest is intentionally separate from share serialization and the storage schema.

## 9. UX, preferences and presentation

The main responsive breakpoint is 767/768 px. Mobile tabs are click-driven, not swipe gestures. Settings/History/Share/Layout/Batch are statically imported and rendered conditionally, not React.lazy modals.

Theme tokens support light/dark/system and safe-area padding. `useTheme` hook instances share mode state and notify each other; invalid stored modes fall back to `system`. Settings reset covers `prefs.v1` and the Settings theme, while share/read/history keys remain separate by design. CSS reduced-motion shortens token durations and the laser component also suppresses its Canvas trail loop when the media preference is active.

Read mode uses an 820 px base maximum width, persisted zoom/width-lock and scroll-driven toolbar hiding. Presentation uses mouse events, a saturated DOM laser dot and optional fading canvas trail; color/size/trail/fullscreen are configurable. It is not a touch presentation implementation. Modal surfaces use the shared focus/Tab/Escape/focus-return hook; browser screen-reader, contrast and touch-target checks remain pending (T15).

## 10. Delivery and cache architecture

`vite.config.js` uses base/scope/start URL `/Markdown-Editor/`. Manifest and service worker are generated into `dist/`; there are no source `public/sw.js`, custom registration file, BUILD_VERSION comparison or unregister URL kill-switch.

- `registerType: prompt`; React virtual registration exposes offlineReady/needRefresh.
- Workbox precaches matching JS/CSS/HTML/icons/images/SVG/WOFF assets with a 5 MiB per-file ceiling, including lazy chunks. Deferred JS execution is not the same as deferred background download.
- Runtime document requests: NetworkFirst, 3-second timeout; script/style/worker: StaleWhileRevalidate; image/font: CacheFirst with 60-entry / 30-day expiration. These runtime bounds do not cap the whole precache.
- Cleanup of outdated precaches is enabled. New hashes may affect multiple chunks; vendor cache reuse is not guaranteed on every application change.
- UpdatePrompt polls `registration.update()` hourly and counts down 30 seconds **after** a waiting update is detected. No 30-second deployment-detection guarantee exists. Reload is not save-aware.
- `.github/workflows/deploy.yml`: pull requests and main pushes -> Node 20 -> npm ci -> test -> build; main pushes then upload the Pages artifact and deploy. Browser/storage/Office acceptance, lint and type checks are not enforced.

See [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md) for exact packages and [docs/REVIEW.md](docs/REVIEW.md) for build evidence. Browser install/offline/update behavior remains unverified in this review.

## 11. Target architecture — proposed, not delivered

1. Explicit document sessions and transactions for save/restore/share transitions (T02–T05).
2. Safe, structure-aware rendering boundaries and shared syntax fixtures; choose parser convergence based on compatibility evidence rather than a wholesale rewrite (T01/T08/T09).
3. Reactive asset repository/cache with reference-safe retention and versioned portable bundles (T06/T07).
4. Shared action/dialog/preferences primitives and authoritative style/page configuration (T11/T12/T15/T19).
5. Test harness, dependency triage and CI gates before performance-driven refactoring (T16–T19).

The architecture goal remains a small document compiler, but reliability requires testing its session, asset, rendering and delivery dependencies together. Module separation alone is not evidence of zero regression.
