# SPEC — Product requirements and implemented behavior

Baseline: `445cc05` · reviewed 2026-09-07 (UTC). Implementation is the source of truth; a requirement below is **not** a claim of acceptance-test success.

[DESIGN.md](DESIGN.md) describes architecture. [TASK.md](TASK.md) owns task status and acceptance details. [TESTING.md](TESTING.md) defines verification. [docs/REVIEW.md](docs/REVIEW.md) separates reproduced results from static findings.

## 1. Product scope

A client-side React/Vite Markdown editor deployed to GitHub Pages, with HTML preview, editable Word export, browser-print PDF, local history/images, sharing and installable PWA support. Markdown remains the authoring format. Browser preview and Word output are not pixel-identical.

No backend, authentication, authorization, collaboration, cloud synchronization or server conversion is implemented. Local storage is not an encrypted backup. Shared preview is a viewing mode, not a permission boundary.

## 2. Requirements and implementation coverage

**Implemented** means a code path exists. **Partial** means missing behavior or known defects prevent the full contract. **Unverified** means the required measurement/integration acceptance has not been performed. Open work uses stable T IDs from TASK.md.

| ID | Requirement | Current coverage | Follow-up |
|---|---|---|---|
| R01 | Author, upload and navigate Markdown with desktop/mobile controls | Implemented editor, sample, clear/new, file picker and mobile tabs; some actions unreachable on desktop | T02, T11 |
| R02 | Safe, correct live preview of supported syntax | Partial: markdown-it, tables, links, math, diagrams and local-image resolution exist; identified image-placeholder and Mermaid-error text interpolation is escaped, but final browser/security and rendering-lifecycle acceptance remains incomplete | T01, T06, T09 |
| R03 | Share text transparently without damaging local work | Partial: compressed hash/query decoding, copy, QR and opt-in TinyURL exist; shared sessions now fork on Edit, but pending-transition, assets and limits remain incomplete | T04, T07, T14 |
| R04 | Export supported Markdown structure as editable DOCX without silent content loss | Partial: basic conversion exists; nested/inline omissions and formatting gaps reproduced | T08 |
| R05 | Display technical math and diagrams with useful failure handling | Partial: KaTeX HTML and Mermaid SVG preview; Mermaid PNG DOCX attempt; no Word math conversion | T09, T14 |
| R06 | Save/recover documents and metadata reliably, with visible failure states | Partial: bounded/serialized document saves, explicit transition flushes, empty-edit persistence, save feedback and newer-draft recovery now exist; IndexedDB failure, crash and multi-tab policy remain incomplete | T02, T04, T12 |
| R07 | Restore the correct version with a guaranteed pre-restore recovery point | Partial: changed-content snapshots and forced recovery backup logic now exist; browser/persistence failure and target-transaction acceptance remain incomplete | T03, T05 |
| R08 | Persist, display, embed and safely manage images | Partial: Blob storage/insertion/export exist; reactivity, ownership, format normalization and cleanup incomplete | T06, T14 |
| R09 | Export/import portable history including assets and settings | Partial: text ZIP export only; no import | T07 |
| R10 | Apply per-document templates, page layout, cover and TOC correctly | Partial: four templates/layout UI/converters exist; landscape XML is wrong and cover does not suppress header/footer; reader validation pending | T08, T10, T11 |
| R11 | Print complete preview content to PDF | Partial: print CSS and dialog exist; no readiness barrier or Word-layout synchronization | T10 |
| R12 | Make feature actions available across supported viewport sizes | Partial: responsive split/tabs/read modes exist; desktop secondary actions missing | T11, T15 |
| R13 | Apply consistent validated preferences with accurate reset semantics | Partial: local settings exist; independent theme hooks and separate keys do not form one state source | T12 |
| R14 | Convert multiple selected Markdown files with stable progress and failure isolation | Partial: sequential file conversion and ZIP exist; duplicate filename identity/running queue gaps | T13, T14 |
| R15 | Support accessible editing, reading, dialogs and presentation | Partial: labels/roles, CSS tokens, motion settings and laser controls exist; keyboard/modal/reduced-motion acceptance incomplete | T15 |
| R16 | Protect untrusted-input boundaries, local data and update transitions | Partial: raw HTML disabled, Mermaid strict mode and scoped SW exist; the identified custom preview text paths now escape at construction, while browser-level boundary, limits, save/update and dependency risks remain | T01, T02, T14, T16 |
| R17 | Provide reproducible dependencies, tests, release gates and truthful documentation | Partial: lockfile/build/deploy workflow, a Node built-in contract suite and CI test/build gate exist; browser/component/Office coverage, lint/type checks and license remain unresolved | T16, T17, T19, T20, T21 |
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

The More menu contains New, History, Document Layout, PDF, Batch Convert, Insert Image, Upload, Sample, Read, Share, Clear and Settings. Its trigger is currently mobile-only. Layout requires a saved `currentDoc` record; the initial document is created after the history save delay. Upload and Sample replace current text rather than explicitly creating a new document.

## 4. Markdown/output contract at this baseline

| Input | HTML preview | Word export |
|---|---|---|
| H1–H6, paragraphs, strong, emphasis, inline code, explicit breaks | Rendered | Mapped to heading/paragraph/text runs |
| Fenced code | Code block (math post-processing can incorrectly modify it) | Top-level code becomes shaded per-line paragraphs |
| Bullet/ordered lists | Rendered by markdown-it | Nested paragraphs/lists supported; other blocks inside items ignored; depth clamped to six levels; start/restart/task state incomplete |
| GFM table | HTML table with horizontal-scroll wrapper | Table rows/cells/borders and template styling; alignment/header formatting needs fixture validation |
| Blockquote | Rendered | Direct paragraph children only; nested headings/lists/quotes are omitted |
| Strikethrough | Rendered | Text remains but strike formatting is missing |
| Inline links | Rendered; HTTP(S) opens a new tab with `noopener noreferrer` | `ExternalHyperlink` for direct link nodes; reference-link resolution is not implemented in converter |
| Horizontal rule | Rendered | Paragraph bottom border with fixed converter styling |
| Local `mdimg://id` image | Blob URL resolution; known cache invalidation/XSS fallback issues | Standalone image-only paragraph supported; inline images are omitted |
| Data URI image | Subject to markdown-it image URL validation | Data URI decoded for standalone image conversion |
| Remote/relative image | Browser may request its URL | Not downloaded; standalone image becomes text fallback |
| `[TOC]` on its own line | Literal text, not a generated heading list | TOC converter invoked; case-insensitive; HTML `<!-- TOC -->` placeholder also recognized by exporter |
| `$...$` / `$$...$$` | Regex post-processing through KaTeX, HTML-only output | Ordinary Markdown parsing/text, not native equations or rendered math images |
| Mermaid fence | Lazy SVG hydration | SVG rasterized through browser canvas into PNG; failure produces explanatory text |
| Raw HTML | Disabled as raw source, normally escaped | Generally ignored as top-level HTML except TOC recognition |
| Other AST features | Parser-dependent | No complete warning contract; some unsupported nodes disappear |

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
| Word image/diagram width | Fixed maximum 600 px; not derived from page margins | Image/Mermaid converters |
| Word defaults | `default` template, A4 portrait, page numbers on, empty header/footer, cover off | `src/history/documentRepo.js`, converter defaults |
| Page sizes | A4 11906×16838, Letter 12240×15840, A3 16838×23811 twips before orientation | `src/converter/pageLayout.js` |
| Print CSS | A4, margins 1.8 cm vertical / 2 cm horizontal | `src/styles/print.css` |
| Share URL warning | Above 50,000 characters; no hard encoded/decoded share limit | `src/share/ShareModal.jsx`, `shareLink.js` |
| TinyURL guard | Refuses >6,000 characters; enabled only by explicit user action | Share modal/service |
| QR | 240 px canvas, error correction M; actual QR capacity is finite | `src/share/QRCodeView.jsx` |
| PWA update | 30-second countdown after detection; explicit polling every hour | `src/pwa/UpdatePrompt.jsx` |

The configured save delays are **inactivity delays**, not periodic maximum-loss guarantees. Draft auto-save can be disabled without disabling IndexedDB history saving. There are no equivalent enforced size limits for typed/pasted text, decoded shares, batch totals or image byte/pixel counts.

## 6. Preferences and persistence contract

- `prefs.v1` schema version 1 contains editor, draft and presentation settings. Matching-version records deep-merge defaults; unknown versions reset to defaults. This is not a sequence of tested migrations or strict schema validation.
- Theme, share preview preference, read zoom/width, current document ID and draft use separate localStorage keys; see [DESIGN.md](DESIGN.md).
- Editor font/line/wrap preferences drive the textarea, not Word styles or general preview typography. Read zoom controls preview text independently.
- Reset All Settings currently resets only the `prefs.v1` object. It does not reset theme/share/read/history keys or delete history/images.
- IndexedDB version 2 holds documents, snapshots and images. Document layout defaults are merged on read for older records.
- Only documents have a pin field (numeric 0/1). No snapshot pinning, automatic document eviction, complete backup import, cloud copy or Clear History settings action exists.
- Startup priority is shared URL, then saved current document; a newer different draft is offered after load. A missing remembered ID is cleared and draft fallback is attempted.

## 7. Security/privacy requirements

Treat Markdown, shared URLs, file content, alt text, formulas and diagrams as untrusted. The baseline custom-image fallback violated this boundary; its loading-placeholder and Mermaid-error text interpolation now escapes at construction, but browser-level hostile-input fixtures and the remaining math/SVG boundary still require acceptance (T01/T09). Disablement of raw Markdown HTML alone is insufficient.

Plain fragment sharing does not send the fragment as part of the page HTTP request, but it is readable by anyone with the link and by page JavaScript. Compression is not encryption. TinyURL receives the **entire encoded share URL** through its query API, including recoverable content. Remote preview images and clicked links also leave the local-only boundary. Browser site-data clearing/eviction can remove all stored work.

There is no CSP meta tag in `index.html`. No deployment response-header audit was performed. There is no server-enforced read-only access. Dependency and resource-exhaustion protections remain open requirements.

## 8. Acceptance and out-of-scope work

The current code can build successfully while failing R02/R04/R06/R07/R10 safety/correctness checks. Release acceptance must follow [TESTING.md](TESTING.md) and [ROADMAP.md](ROADMAP.md), not historical checkmarks.

Deferred rather than implemented: custom `.docx` template extraction, native Word math, PDF parity with Word templates/layout, full directory traversal, asset-aware share packaging, custom page dimensions, image management UI, native Web Share integration, swipe/haptic interactions, accent customization, preference import/export, cloud/auth/collaboration, encryption and localization. T07 owns portable backup work; other extensions need separate scope decisions before implementation.
