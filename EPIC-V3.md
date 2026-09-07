# EPIC-V3 — Rich output scope reconciliation

Baseline: `445cc05` · reviewed 2026-09-07 (UTC).

**Position: partially implemented against the original proposal; not blanket “planned” or “complete.”** V3 is a historical feature-group name, not a current package version or proof of release acceptance. The former proposal listed several nonexistent modules and dependencies; this document records what actually landed and what remains.

Parent inventory: [EPIC.md](EPIC.md). Exact behavior/defaults: [SPEC.md](SPEC.md). Status/acceptance: [TASK.md](TASK.md). Sequence: [ROADMAP.md](ROADMAP.md).

## V3.0 — Images

**Present:** `src/images/imageRepo.js`, `imageCache.js`, `insertImage.js`, `useImages.js`, editor paste/drop, App file picker, `src/converter/convertImage.js`.

- IndexedDB v2 `images` records store Blobs and metadata. Markdown references use `mdimg://id`, **not** persistent `blob:` URLs.
- Insertion uses textarea cursor/selection and optional raster downscale at a 2,400 px longest dimension; SVG/GIF bypass resizing.
- DOCX conversion handles standalone local/data images with a fixed width ceiling; remote/relative URLs become fallback text rather than downloaded bytes.

**Gaps:** loading-placeholder alt text is escaped in the current implementation but still lacks browser-level hostile-input acceptance; cached image completion does not invalidate preview HTML; orphan attachment is never invoked; no reference-safe cache/ownership cleanup; inline image export omitted; WebP/SVG support not complete end-to-end. Desktop file-picker action is inaccessible through the current toolbar.

**Not implemented:** ImageGallery/ImageDropZone components, image library/replace/delete UI, orphan cleanup tool, size-warning threshold, remote image fetching/embedding or Safari Blob fallback.

**Tasks:** T01/T06/T07/T08/T11/T14.

## V3.1 — Built-in templates

**Present:** `src/styles/templates/{default,businessReport,technicalDocument,minimal,index}.js` and the template card grid in `DocumentLayoutSheet.jsx`.

| ID | Base identity |
|---|---|
| `default` | Arial 11 pt, baseline spacing/code shading |
| `businessReport` | Calibri 11 pt, navy headings, justified paragraphs |
| `technicalDocument` | Inter 10 pt with JetBrains Mono code settings |
| `minimal` | Helvetica 11 pt, unbolded headings, more whitespace |

Template choice is stored per document, not globally. Fonts are named in DOCX, not embedded, so reader-side font substitution is possible. Preview does not apply the Word template. Table/header and all-template fidelity require validation; technical line numbers and business page borders are not implemented.

**Not implemented:** custom `.docx` template extraction, templates IndexedDB store, template upload/repository/hooks, global default-template preference or preview template parity.

**Tasks:** T08/T10/T11/T19. Custom templates remain deferred.

## V3.2 — Long documents

**Present:** recursive list handling up to six configured levels, `convertToc.js`, `pageLayout.js`, `coverPage.js` and document layout fields.

- List recursion handles paragraph/list children only, not arbitrary nested blocks.
- `[TOC]` on its own line (case-insensitive) and HTML TOC comments invoke export TOC generation. Preview does not generate a clickable TOC, and there is no TOC-insert button: the Layout sheet gives instructions.
- Header/footer expansion supports title/date/page/total tokens. Page numbers default on.
- A4/Letter/A3 and portrait/landscape controls exist; custom dimensions do not.
- Cover title/subtitle/author/date are optional input values. Placeholders are not automatically filled/stored. Cover paragraphs and the body share a section.

**Confirmed defects:** landscape dimensions are double-swapped between app and docx; generated XML has portrait width/height with landscape orientation. No different-first-page header/footer suppression exists. TOC packaging/field-refresh interoperability needs Word/LibreOffice verification; do not promise automatically populated page numbers on opening.

**Tasks:** T08/T10/T11/T12.

## V3.3 — PDF

**Present and chosen approach:** browser print, `src/download/downloadPdf.js` and `src/styles/print.css`.

- A 30 ms timeout calls `window.print()`; the user selects Save as PDF.
- CSS hides app chrome and uses static A4 page/margin rules for HTML preview.
- This is not DOCX -> PDF, a silent PDF download or a template/layout-synchronized PDF engine.

**Gaps:** no asynchronous asset/font/math/diagram readiness barrier; cross-browser pagination and presentation-overlay/zoom handling unverified.

**Not installed:** pdf-lib, jsPDF, html2canvas. A programmatic renderer requires a separate decision.

**Task:** T10.

## V3.4 — Math and Mermaid

**Present:** lazy `katex` and `mermaid`, `src/preview/mathRenderer.js`, `mermaidRenderer.js` and `src/converter/convertMermaid.js`.

- Math is regex post-processing of generated HTML; KaTeX uses `output: html`, not MathML. Code-block math corruption was reproduced.
- Mermaid preview uses strict/neutral SVG rendering; DOCX attempts browser SVG -> canvas -> PNG and falls back to text on failure.
- Mermaid hydration is not viewport-gated and no Web Worker is used.

**Not implemented/installed:** remark-math, markdown-it-katex, convertMath.js, Word equation objects or rendered equation-image export.

**Tasks:** T01/T09/T10/T14/T18. Word math remains deferred.

## V3.5 — Batch, QR and shortener

**Present:** `BatchConvertSheet.jsx`, `batchProcess.js`, `QRCodeView.jsx`, `shortenerService.js` and ShareModal integration.

- Batch accepts multiple `.md` files from FileList/drop, converts sequentially with default options, isolates per-file conversion exceptions and ZIPs successes with deduplicated output filenames. It does not inherit the active document's template/layout.
- There is no directory traversal, queue worker or cancellation. Status maps/UI keys use filenames and can collide; selection remains mutable during processing.
- QR uses the `qrcode` library on a canvas and can download PNG. QR capacity is finite; not every share URL can encode.
- TinyURL is user-triggered and sends the full content-bearing URL to `https://tinyurl.com/api-create.php`. Requests longer than 6,000 characters are **rejected**, not enabled for shortening.

**Tasks:** T04/T11/T13/T14. Sharing local image bytes is not implemented; T07 owns portable bundles.

## V3.6 and original stretch scope

No separate custom-template implementation exists. Custom templates, image library UI, Word math and full folder conversion remain deferred. Cover generation exists already but needs T10 correctness work; it is not wholly future work.

Actual dependencies are listed in [docs/DEPENDENCIES.md](docs/DEPENDENCIES.md). Do not list proposed libraries such as mammoth, markdown-it-katex or PDF libraries as installed.

## Acceptance still required

- Security fixtures for image/math/diagram boundaries and malformed/oversized input.
- Asset insertion -> persistence -> reload -> DOCX and full-backup round trips.
- Supported recursive syntax preserved in XML and actual Word/LibreOffice rendering.
- All four templates, landscape sizes, cover/header/footer, TOC field behavior and PDF readiness.
- Desktop/mobile feature access, file queue edge cases, QR capacity and explicit shortener data egress.
- Offline/update/device checks and measured performance, not assumed success from chunk splitting.

These are acceptance requirements, not completed test results. Follow [TESTING.md](TESTING.md); the earlier claims of bit-for-bit unchanged DOCX output and an existing regression suite were not supported by the codebase.
