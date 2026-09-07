# DESIGN — Current architecture and design boundaries

Baseline: `445cc05` · reviewed 2026-09-07 (UTC).

This replaces the original MVP proposal with the architecture actually present in `src/`. Proposed corrections are labelled explicitly. [SPEC.md](SPEC.md) owns requirements/defaults, [TASK.md](TASK.md) owns work status, and [docs/DECISIONS.md](docs/DECISIONS.md) records implemented choices versus proposals.

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
  +-- theme/useTheme --------------------> theme.mode + document data-theme
  +-- preview/usePreviewControls -------> zoom, width, scroll-driven toolbar
  |
  +-- MarkdownPreview: markdown-it -> HTML -> async KaTeX -> DOM -> Mermaid SVG
  +-- downloadDocx: remark/GFM AST -> converter modules -> docx Blob -> file-saver
  +-- downloadPdf: delayed window.print() -> print.css -> browser Save as PDF
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
| `src/history/` | DB opening, document/snapshot repositories, hook, history UI, text ZIP |
| `src/images/` | Blob repository, downscale, URI helpers, process-wide object URL cache and insertion helpers |
| `src/preferences/` | Version-1 defaults, storage merge, hook, Settings sheet, draft storage/prompt |
| `src/theme/` | Each hook instance owns mode state and writes document theme/localStorage |
| `src/components/` | Mobile More sheet and per-document Layout sheet |
| `src/share/` | Hash compression/decoding, copy fallback, QR canvas, optional TinyURL request |
| `src/batch/` | File collection/progress UI and sequential DOCX ZIP generation |
| `src/pwa/UpdatePrompt.jsx` | SW registration via virtual module, hourly checks and 30-second countdown |

## 4. Document/session state and lifecycle

Current state is distributed:

- App: `markdown`, `previewOnly`, presentation/modal/mobile-tab state, pending draft and `sharedLinkOpenedRef`.
- History hook: `currentDocId`, full `docs` list, `supported` flag and a content-only `lastSavedRef`.
- Browser persistence: remembered ID, a single draft, documents/snapshots/images and separately stored preferences.

Startup checks a shared hash (or legacy query), otherwise opens the remembered document, otherwise offers the global draft. It does not reconcile document/draft freshness. A missing remembered document does not trigger draft fallback.

Document and snapshot timers are trailing debounces, restarted by editing. Read mode and the shared-link flag pause them. The draft timer has its own delay/enablement. Open/new do not flush pending writes; no max-wait, dirty-state UI or multi-tab coordination exists. The hook skips empty text saves. See SPEC for exact timing.

Shared content does not clear the remembered local document identity. Editing a share can therefore resume saving into an unrelated document; hash-change and first-load handling differ. Cross-document version restore can reuse a callback closing over the old identity.

**Proposed (T02–T05):** a document-session service/hook with explicit local/shared identity, revisions, dirty/saving/saved/error state, serialized writes and recovery policy. Transitions must await saving (or explicit discard), and restore operations must take target IDs directly. This service is not implemented in the baseline.

## 5. Persistence schema

Source: `src/history/db.js` and repositories. DB: `markdown-editor-db`, version **2**. All stores use key path `id` with nanoid-generated strings (not UUID semantics).

| Store | Indexes | Record fields |
|---|---|---|
| `documents` | `updatedAt`, `pinned` | `id`, `title`, `content`, `createdAt`, `updatedAt`, `wordCount`, `sizeBytes`, `pinned` (0/1), `templateId`, `layout` |
| `snapshots` | `documentId`, `createdAt` | `id`, `documentId`, `content`, `createdAt` |
| `images` | `documentId`, `createdAt` | `id`, nullable `documentId`, `filename`, `mimeType`, `blob`, `width`, `height`, `sizeBytes`, `createdAt` |

- `layout` contains pageSize/orientation/header/footer/pageNumbers and coverPage enabled/title/subtitle/author/date. Defaults are merged on reads; no separate template store exists.
- `listDocuments()` loads all records, then sorts pins first and updated time descending. Search scans title/content in React memory; no full-text index or pagination exists.
- Titles derive from the first Markdown heading of any level or first nonblank line, strip selected formatting characters and cap at 80 characters. Word count splits on whitespace, not language-aware segmentation.
- Metadata/content updates use separate get/put transactions and can race. Each content save re-derives title, overriding manual rename.
- Deleting a document uses a multi-store transaction to cascade snapshots and images indexed to that ID. Unowned images are not included. Shared-reference safety is not modeled.
- Snapshots contain content only: no layout, title, pin or image copy. Automatic retention caps them at 50, with no pinned-snapshot exception. Its length-difference filter is not a content diff.
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

- Missing-image alt text is interpolated without escaping; disabling raw HTML does not protect this path (T01).
- Cache notifications rerender App but do not invalidate Markdown-only HTML memoization (T06).
- Math regexes operate on tags, attributes and code as well as intended text; HTML escaping precedes formula parsing (T09).
- Async import/render work lacks a complete cancellation/readiness/error contract; diagram work is not viewport-deferred (T09/T18).

Remote images may be fetched by the browser. No final common sanitizer or CSP meta is configured. Proposed safety changes must preserve legitimate KaTeX/SVG/image rendering and be verified with hostile-input fixtures.

## 7. DOCX and PDF pipelines

`downloadDocx` imports the converter and file-saver on demand. The converter parses Markdown, converts top-level nodes concurrently with `Promise.all`, flattens output, prepends cover paragraphs, applies page properties/header/footer, and packs one section to Blob.

- Most converter modules receive the selected template `cfg`; the default is `defaultTemplate`.
- List conversion is recursive only for nested list/paragraph children, not generic blocks; blockquote conversion accepts only paragraphs. Inline handling lacks image/delete/reference-link semantics.
- Numbering defines six bullet/ordered levels. Both list depth limits and numbering/layout/style values remain partially hardcoded.
- Images resolve cached/stored `mdimg://` Blobs or data URIs. Remote fetching is deliberately absent from DOCX conversion. Image format normalization and SVG fallback are incomplete.
- Mermaid export uses DOM/Image/canvas to rasterize SVG, so the full converter is not a headless Node-only API even though simple text export can run in Node.
- Cover content is part of the same section as the body, ending in a page break. Different-first-page headers/footers are not configured.
- Landscape dimensions are swapped twice between app and docx library; generated XML proves incorrect width/height (T10).
- TOC is a generated Word field, not computed page numbers. Office compatibility/field update behavior needs real-reader validation.

PDF calls `window.print()` after 30 ms. It prints the preview with static A4 CSS; Word templates/layout/cover/TOC do not drive it. No image/math/diagram/font completion barrier exists.

## 8. Asset and archive boundaries

Insertion stores a Blob, optionally downscales it, caches a temporary object URL and inserts `![alt](mdimg://id)` at the textarea selection. `mdimg://` is the persistent reference; `blob:` URLs are temporary browser resources, not stored Markdown identity.

`imageCache.js` has cache/pending maps and subscribers. It revokes a URL when replacing the same entry, but has no bounded eviction or deletion invalidation. The orphan attachment callback is unused.

History export writes `INDEX.md`, deduplicated `documents/*.md`, and optional `snapshots/<sanitized-title>/<second-resolution-time>.md`. It does not include image bytes, document metadata/layout or an import manifest. Duplicate titles/timestamps can collide in snapshot paths and the index can disagree with deduplicated filenames.

Share URLs similarly carry text only. A portable versioned bundle is proposed under T07; storage schema and share serialization should not be confused with such a bundle.

## 9. UX, preferences and presentation

The main responsive breakpoint is 767/768 px. Mobile tabs are click-driven, not swipe gestures. Settings/History/Share/Layout/Batch are statically imported and rendered conditionally, not React.lazy modals.

Theme tokens support light/dark/system and safe-area padding. CSS reduced-motion shortens token durations; it does not suppress the laser canvas loop. `useTheme` instances do not subscribe to shared state changes. Duplicated settings controls and independent keys weaken reset/synchronization semantics.

Read mode uses an 820 px base maximum width, persisted zoom/width-lock and scroll-driven toolbar hiding. Presentation uses mouse events, a saturated DOM laser dot and optional fading canvas trail; color/size/trail/fullscreen are configurable. It is not a touch presentation implementation. Modal focus trapping, consistent Escape/focus return and keyboard navigation are pending (T15).

## 10. Delivery and cache architecture

`vite.config.js` uses base/scope/start URL `/Markdown-Editor/`. Manifest and service worker are generated into `dist/`; there are no source `public/sw.js`, custom registration file, BUILD_VERSION comparison or unregister URL kill-switch.

- `registerType: prompt`; React virtual registration exposes offlineReady/needRefresh.
- Workbox precaches matching JS/CSS/HTML/icons/images/SVG/WOFF assets with a 5 MiB per-file ceiling, including lazy chunks. Deferred JS execution is not the same as deferred background download.
- Runtime document requests: NetworkFirst, 3-second timeout; script/style/worker: StaleWhileRevalidate; image/font: CacheFirst with 60-entry / 30-day expiration. These runtime bounds do not cap the whole precache.
- Cleanup of outdated precaches is enabled. New hashes may affect multiple chunks; vendor cache reuse is not guaranteed on every application change.
- UpdatePrompt polls `registration.update()` hourly and counts down 30 seconds **after** a waiting update is detected. No 30-second deployment-detection guarantee exists. Reload is not save-aware.
- `.github/workflows/deploy.yml`: main push -> Node 20 -> npm ci -> build -> Pages artifact -> deploy. No PR test/lint job or acceptance gate exists.

See [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md) for exact packages and [docs/REVIEW.md](docs/REVIEW.md) for build evidence. Browser install/offline/update behavior remains unverified in this review.

## 11. Target architecture — proposed, not delivered

1. Explicit document sessions and transactions for save/restore/share transitions (T02–T05).
2. Safe, structure-aware rendering boundaries and shared syntax fixtures; choose parser convergence based on compatibility evidence rather than a wholesale rewrite (T01/T08/T09).
3. Reactive asset repository/cache with reference-safe retention and versioned portable bundles (T06/T07).
4. Shared action/dialog/preferences primitives and authoritative style/page configuration (T11/T12/T15/T19).
5. Test harness, dependency triage and CI gates before performance-driven refactoring (T16–T19).

The architecture goal remains a small document compiler, but reliability requires testing its session, asset, rendering and delivery dependencies together. Module separation alone is not evidence of zero regression.
