# SPEC — Product requirements and implemented behavior

Baseline: `edd7906` · reviewed 2026-09-07 (UTC). Implementation is the source of truth; a requirement below is **not** a claim of acceptance-test success.

[DESIGN.md](DESIGN.md) describes architecture. [TASK.md](TASK.md) owns task status and acceptance details. [TESTING.md](TESTING.md) defines verification. [docs/REVIEW.md](docs/REVIEW.md) separates reproduced results from static findings.

## 1. Product scope

A client-side React/Vite Markdown editor deployed to GitHub Pages, with HTML preview, editable Word export, browser-print PDF, local history/images, sharing and installable PWA support. Markdown remains the authoring format. Browser preview and Word output are not pixel-identical.

No backend, authentication, authorization, collaboration, cloud synchronization or server conversion is implemented. Local storage is not an encrypted backup. Shared preview is a viewing mode, not a permission boundary.

## 2. Requirements and implementation coverage

**Implemented** means a code path exists. **Partial** means missing behavior or known defects prevent the full contract. **Unverified** means the required measurement/integration acceptance has not been performed. Open work uses stable T IDs from TASK.md.

| ID | Requirement | Current coverage | Follow-up |
|---|---|---|---|
| R01 | Author, upload and navigate Markdown with desktop/mobile controls | Implemented editor, sample, clear/new, file picker and mobile tabs; secondary actions now have a shared overflow-menu trigger on desktop/tablet/mobile, but reachability acceptance remains pending | T02, T11 |
| R02 | Safe, correct live preview of supported syntax | Partial: markdown-it, tables, links, math, diagrams and local-image resolution exist; image/Mermaid text paths are escaped and math/diagram async work is revision-safe in code, but final browser/security and rendering-lifecycle acceptance remains incomplete | T01, T06, T09 |
| R03 | Share text transparently without damaging local work | Partial: compressed hash/query decoding, copy, QR and opt-in TinyURL exist; shared sessions now fork on Edit and text-only links warn when local images are not portable, but pending-transition, assets and limits remain incomplete | T04, T07, T14 |
| R04 | Export supported Markdown structure as editable DOCX without silent content loss | Partial: recursive block/inline conversion now preserves tested nested blocks, task state, deletion, images, list starts and explicit unsupported fallbacks in XML; broader syntax and Word/LibreOffice acceptance remain incomplete | T08 |
| R05 | Display technical math and diagrams with useful failure handling | Partial: KaTeX HTML and Mermaid SVG preview; Mermaid PNG DOCX attempt; no Word math conversion | T09, T14 |
| R06 | Save/recover documents and metadata reliably, with visible failure states | Partial: bounded/serialized document saves, explicit transition flushes, empty-edit persistence, save feedback and newer-draft recovery now exist; IndexedDB failure, crash and multi-tab policy remain incomplete | T02, T04, T12 |
| R07 | Restore the correct version with a guaranteed pre-restore recovery point | Partial: changed-content snapshots and forced recovery backup logic now exist; browser/persistence failure and target-transaction acceptance remain incomplete | T03, T05 |
| R08 | Persist, display, embed and safely manage images | Partial: Blob storage/insertion, reactive preview, orphan-only ownership attachment and backup asset export/import code exist; byte/pixel limits, supported MIME normalization and active-SVG rejection now exist, while cache retention, reference cleanup and browser acceptance remain incomplete | T06, T07, T14 |
| R09 | Export/import portable history including assets and settings | Partial: versioned `markdown-editor-backup` v1 export/import code carries document metadata/layout, snapshots and image assets with ID remapping and bounded validation; disposable-profile IndexedDB/browser round-trip acceptance remains incomplete | T07 |
| R10 | Apply per-document templates, page layout, cover and TOC correctly | Partial: four templates/layout UI/converters exist; landscape/cover/TOC XML contracts and page-aware image sizing are corrected, but Word/LibreOffice reader behavior and all layout fixtures remain unverified | T08, T10, T11 |
| R11 | Print complete preview content to PDF | Partial: browser print now waits for preview render state, fonts, images and layout frames with a bounded timeout; pagination and cross-browser output remain unverified, and PDF intentionally does not inherit Word layout | T10 |
| R12 | Make feature actions available across supported viewport sizes | Partial: responsive split/tabs/read modes and a cross-viewport overflow trigger exist; shared modal focus behavior and keyboard/focus/layout acceptance remain pending | T11, T15 |
| R13 | Apply consistent validated preferences with accurate reset semantics | Partial: persisted preferences are allowlisted, theme state is shared across hook instances and theme storage events, and Settings reset covers prefs plus theme; browser/IndexedDB acceptance remains pending | T12 |
| R14 | Convert multiple selected Markdown files with stable progress and failure isolation | Partial: sequential file conversion uses stable entry IDs, immutable batches, unique ZIP names, bounded inputs, failed-entry retry and cancellation; browser failure checks remain | T13, T14 |
| R15 | Support accessible editing, reading, dialogs and presentation | Partial: shared modal focus/Tab/Escape/return behavior, labels/roles and reduced-motion laser suppression exist; keyboard/screen-reader/contrast/touch-target acceptance remains incomplete | T15 |
| R16 | Protect untrusted-input boundaries, local data and update transitions | Partial: raw HTML disabled, Mermaid strict mode and scoped SW exist; custom preview text paths escape at construction, resource/network limits and stale shortener protection now exist, while browser boundary, save/update and dependency risks remain | T01, T02, T14, T16 |
| R17 | Provide reproducible dependencies, tests, release gates and truthful documentation | Partial: lockfile/build/deploy workflow, a 35-test Node contract suite and CI test/build gate exist; browser/component/Office coverage, lint/type checks and license remain unresolved | T16, T17, T19, T20, T21 |
| R18 | Keep large-document and offline use responsive within measured budgets | Unverified: chunking/PWA cache exist; no representative browser measurements or enforced budget | T18 |

## 3. User modes and controls

| Mode | Implemented behavior |
|---|---|
| Edit | Textarea plus preview; below 768 px the Editor/Preview buttons switch the visible panel |
| Read | `previewOnly` hides the editor, presents a centered column and zoom/width controls; also pauses history and draft saving |
| Shared preview | Uses the same Read UI and `PREVIEW` badge; recipients can click Edit or export |
| Presentation | Available through a desktop Read toolbar button; hides toolbar/cursor, renders mouse-following laser and optional canvas trail, optionally requests browser fullscreen |
| Installed PWA | Manifest requests standalone display; install and offline behavior depend on browser/cache readiness |

Read is a full-workspace layout, **not** a Fullscreen API request. Only presentation optionally requests browser fullscreen. Escape, the Exit chip, leaving fullscreen when requested, or leaving Read exits presentation.

The More menu contains New, History, Document Layout, PDF, Batch Convert, Insert Image, Upload, Sample, Read, Share, Clear and Settings. Its shared overflow trigger is available across Edit-mode viewport sizes. Layout requires a saved `currentDoc` record; the initial document is created after the history save delay. Upload and Sample replace current text rather than explicitly creating a new document.

## 4. Markdown/output contract at this baseline

| Input | HTML preview | Word export |
|---|---|---|
| H1–H6, paragraphs, strong, emphasis, inline code, explicit breaks | Rendered | Mapped to heading/paragraph/text runs |
| Fenced code | Code block; math post-processing skips protected code | Top-level code becomes shaded per-line paragraphs; nested blocks and unsupported fallbacks are handled by the recursive converter |
| Bullet/ordered lists | Rendered by markdown-it | Nested paragraphs/lists, continuation blocks, task state and ordered starts are supported in focused contracts; depth is clamped to six levels and reader semantics remain to be checked |
| GFM table | HTML table with horizontal-scroll wrapper | Table rows/cells/borders, inherited header emphasis and template styling; alignment and reader formatting need fixture validation |
| Blockquote | Rendered | Paragraphs and supported nested blocks are converted recursively with quote styling; reader fidelity remains unverified |
| Strikethrough | Rendered | Converted to Word strike runs |
| Inline links | Rendered; HTTP(S) opens a new tab with `noopener noreferrer` | `ExternalHyperlink` for direct link nodes; reference-link resolution is not implemented in converter |
| Horizontal rule | Rendered | Paragraph bottom border with fixed converter styling |
| Local `mdimg://id` image | Reactive Blob URL resolution with inert loading/error placeholders; ownership attaches only orphan records | Standalone and inline local/data images can be embedded; eviction and complete ownership/reference policy remain incomplete |
| Data URI image | Subject to markdown-it image URL validation | Data URI decoded for standalone and inline image conversion |
| Remote/relative image | Browser may request its URL | Not downloaded; standalone image becomes text fallback |
| `[TOC]` on its own line | Literal text, not a generated heading list | TOC converter invoked; case-insensitive; HTML `<!-- TOC -->` placeholder also recognized by exporter |
| `$...$` / `$$...$$` | Token-aware text-node post-processing through KaTeX, HTML-only output; code, attributes, escaped dollars and currency are excluded | Ordinary Markdown parsing/text, not native equations or rendered math images |
| Mermaid fence | Lazy SVG hydration | SVG rasterized through browser canvas into PNG; failure produces explanatory text |
| Raw HTML | Disabled as raw source, normally escaped | Generally ignored as top-level HTML except TOC recognition |
| Other AST features | Parser-dependent | Unsupported block nodes become explicit fallback paragraphs; complete warning coverage is not guaranteed |

Basic implementation coverage does not establish Word/LibreOffice/Google Docs compatibility. No Office application was exercised in this review. T08/T10 own those acceptance checks.

## 5. Current defaults and limits

These are existing constants, not recommended permanent limits. Their code locations are authoritative.

| Setting/boundary | Current value | Source |
|---|---|---|
| Single `.md` upload | Case-insensitive extension, maximum 2 × 1024 × 1024 bytes | `src/editor/useFileUpload.jsx` |
| Editor font | `md` = 15 px, monospace, normal line height 1.7, wrap on | `src/preferences/defaults.js`, `src/styles/app.css` |
| Font/line choices | 13/15/17/19 px; line height 1.4/1.7/2.0; mono/system/serif | Same |
| Draft | Enabled; 3,000 ms trailing debounce; UI offers 3/5/10/30 seconds | defaults and `src/App.jsx` |
| History save/snapshot | Document: 8,000 ms inactivity with 30,000 ms maximum wait; snapshot: 30,000 ms trailing; existing empty documents can be saved empty | `src/history/useHistory.js`, `src/history/savePolicy.js` |
| Snapshot cap/filter | 50 per document, FIFO; unchanged text skipped; changed content is eligible regardless of length; forced recovery may preserve empty content | `src/history/snapshotRepo.js` |
| Read zoom | 0.7–3.0 in 0.1 steps; reset 1.0 | `src/preview/usePreviewControls.js` |
| Read width | 820 px base maximum; locked by default; unlock multiplies width by zoom | `src/App.jsx`, preview controls |
| Read toolbar | Scroll down beyond 80 px hides it; up reveals it; delta threshold 6 px | Preview controls |
| Laser | Red/green/blue/yellow; 12/16/22 px; defaults red, 16 px, trail on, fullscreen on | Preferences defaults |
| Image downscale | Longest dimension 2,400 px for applicable raster images; SVG/GIF exempt | `src/images/imageRepo.js` |
| Word image/diagram width | Derived from the selected page's writable width at 96 dpi with 1-inch side margins; A4 is about 602 px portrait / 931 px landscape | `src/converter/pageLayout.js`, image/Mermaid converters |
| Word defaults | `default` template, A4 portrait, page numbers on, empty header/footer, cover off | `src/history/documentRepo.js`, converter defaults |
| Page sizes | A4 11906×16838, Letter 12240×15840, A3 16838×23811 base twips; `docx` applies the landscape serialization swap once | `src/converter/pageLayout.js` |
| Print CSS | A4, margins 1.8 cm vertical / 2 cm horizontal | `src/styles/print.css` |
| DOCX cover/TOC | Empty cover title/date fall back to document title/export date; enabled covers use `w:titlePg` and empty first-page header/footer parts; TOC field update is requested on open | `src/converter/coverPage.js`, `src/converter/markdownToDocx.js` |
| PDF readiness | Preview render state, fonts, images and two layout frames; five-second best-effort timeout before `window.print()` | `src/preview/MarkdownPreview.jsx`, `src/download/downloadPdf.js` |
| Markdown/share boundary | Markdown above 1,000,000 characters or encoded URL above 200,000 bytes is rejected before compression/decompression; links above 50,000 characters warn | `src/limits/resourceLimits.js`, `src/share/shareLink.js`, `src/share/ShareModal.jsx` |
| TinyURL guard | Refuses >6,000 characters; 10-second timeout, caller cancellation and stale-result protection; enabled only by explicit user action | `src/share/shortenerService.js`, Share modal |
| QR | 240 px canvas, error correction M; Share disables QR above 2,953 URL characters | `src/limits/resourceLimits.js`, `src/share/QRCodeView.jsx` |
| Image boundary | 25 MiB per image, 40,000,000 decoded pixels; PNG/JPEG/GIF/BMP/SVG only; active SVG content rejected | `src/limits/resourceLimits.js`, `src/images/imageRepo.js` |
| Diagram/batch boundary | Mermaid code up to 100,000 characters; 100 batch files, 2 MiB per Markdown file and 50 MiB total input | `src/limits/resourceLimits.js`, `src/preview/mermaidRenderer.js`, `src/batch/batchProcess.js` |
| PWA update | Displays the package version, offers an explicit `Update now` action, polls hourly and auto-updates after a 30-second countdown; save failure pauses the countdown | `src/pwa/UpdatePrompt.jsx`, `package.json` |

The configured save delays are **inactivity delays**, not periodic maximum-loss guarantees. Draft auto-save can be disabled without disabling IndexedDB history saving. Typed editor content has no separate hard limit, while shared-link, batch, image, diagram and decoded-share boundaries are enforced as listed above.

## 6. Preferences and persistence contract

- `prefs.v1` schema version 1 contains editor, draft and presentation settings. Matching-version records are merged and then allowlisted against supported values; malformed sections and unknown fields recover to defaults. Unknown versions reset to defaults. This is still not a sequence of versioned migrations.
- Theme, share preview preference, read zoom/width, current document ID and draft use separate localStorage keys; see [DESIGN.md](DESIGN.md).
- Editor font/line/wrap preferences drive the textarea, not Word styles or general preview typography. Read zoom controls preview text independently.
- Settings reset removes and recreates `prefs.v1` and sets the shared theme to `system`. It intentionally does not reset share/read/history keys or delete history/images; the button label names this scope.
- Documents carry `titleSource` (`derived` or `manual`); manual renames survive content saves, while legacy records without the marker are treated as derived. Per-document repository mutations are queued to reduce metadata overwrite races; real IndexedDB failure/concurrency acceptance remains pending.
- IndexedDB version 2 holds documents, snapshots and images. Document layout defaults are merged on read for older records.
- Only documents have a pin field (numeric 0/1). No snapshot pinning, automatic document eviction, backup merge/conflict policy, cloud copy or Clear History settings action exists. Versioned backup import is implemented, but its browser/IndexedDB acceptance is pending.
- Startup priority is shared URL, then saved current document; a newer different draft is offered after load. A missing remembered ID is cleared and draft fallback is attempted.

## 7. Security/privacy requirements

Treat Markdown, shared URLs, file content, alt text, formulas and diagrams as untrusted. The baseline custom-image fallback violated this boundary; its loading-placeholder and Mermaid-error text interpolation now escapes at construction, but browser-level hostile-input fixtures and the remaining math/SVG boundary still require acceptance (T01/T09). Disablement of raw Markdown HTML alone is insufficient.

Plain fragment sharing does not send the fragment as part of the page HTTP request, but it is readable by anyone with the link and by page JavaScript. Compression is not encryption. TinyURL receives the **entire encoded share URL** through its query API, including recoverable content. Remote preview images and clicked links also leave the local-only boundary. Browser site-data clearing/eviction can remove all stored work.

There is no CSP meta tag in `index.html`. No deployment response-header audit was performed. There is no server-enforced read-only access. Dependency and resource-exhaustion protections remain open requirements.

## 8. Acceptance and out-of-scope work

The current code can build successfully while failing R02/R04/R06/R07/R10 safety/correctness checks or reader-level layout/print checks. Release acceptance must follow [TESTING.md](TESTING.md) and [ROADMAP.md](ROADMAP.md), not historical checkmarks.

Deferred rather than implemented: custom `.docx` template extraction, native Word math, PDF parity with Word templates/layout, full directory traversal, asset-aware share packaging, custom page dimensions, image management UI, native Web Share integration, swipe/haptic interactions, accent customization, preference import/export, cloud/auth/collaboration, encryption and localization. T07 now owns the local portable backup implementation; browser acceptance and future share-asset packaging need separate evidence/scope.
