# EPIC-V3.md — Rich Document Output

> **Status: 📋 Planned**  Builds on V2 (PWA + design + history). Opens the converter side: richer Markdown features in, richer Word/PDF output out.

---

## Overview

V2 made the app **installable, persistent, and beautiful**. V3 makes the **documents themselves more powerful** — images, templates, table of contents, page numbers, math, diagrams, PDF — turning the tool from "Markdown to clean Word" into "Markdown to professional, branded, long-form documents."

The compiler at the centre (`src/converter/`) finally grows in V3. It does so carefully — every new node type is a new module, the existing pipeline never breaks.

---

## Epic Goals

### Primary Goals

- Embed images in `.md` editor → render in preview → embed in `.docx`.
- Provide 4 built-in Word templates (Default, Business, Technical, Minimal) selectable per document.
- Support custom `.docx` template upload — extract styles, apply to user content.
- Auto-generate Table of Contents from headings.
- Render header / footer / page numbers in `.docx` output.
- Add a cover page generator (title, author, date, subtitle).
- Support nested lists across all depths.
- Add **Export PDF** alongside Export DOCX.
- Render math (`$x^2$`, `$$\sum$$`) via KaTeX in preview and as images in `.docx`.
- Render Mermaid diagrams in code fences as SVG in preview and PNG in `.docx`.
- Support batch convert — drop a folder of `.md` files, get a ZIP of `.docx`.
- Add QR code share + URL shortener for share links.

### Secondary Goals

- Maintain V2.5 bundle performance — every new heavy library lazy-loads.
- Per-document settings (template choice, page size) stored in IndexedDB.
- Image library view — manage images attached to a document.
- Preserve all V2 behavior — no regressions on PWA, history, themes.

---

## Non-Goals

- Cloud sync (still requires a backend).
- Real-time collaborative editing (still requires a backend + CRDT).
- Custom font uploads (browser font licensing complexity).
- Native mobile app submissions.
- Server-side rendering / SEO crawling for shared docs.
- Full WYSIWYG editor (Markdown stays the source of truth).
- Track changes / comments inside Word.
- Full Pandoc parity.

---

## Sub-Epics (Scope Breakdown)

| # | Sub-Epic | Priority | Effort | Notes |
|---|---|---|---|---|
| 1 | Images (paste / drag / upload / embed) | P0 | L | Foundation — everything else depends on image embedding capability |
| 2 | Word Templates (4 built-in + custom upload) | P0 | M | High business value — branded output |
| 3 | Long Document Features (nested lists, TOC, header/footer, page #, cover) | P1 | L | Required for real reports |
| 4 | PDF Export | P1 | M | Adds a second output format |
| 5 | Math (KaTeX) + Diagrams (Mermaid) | P2 | M | High value for technical writers |
| 6 | Batch Convert + QR + URL Shortener | P2 | S | Quality-of-life polish |

> **P0** = Must ship in V3.
> **P1** = Should ship.
> **P2** = Stretch.
> Effort: S (≤1 day), M (2–3 days), L (4–7 days).

---

## 1. Sub-Epic — Images

### 1.1 Goal

Let users put images into their Markdown documents — via paste, drag-drop, or file picker — and have them render in preview and export embedded inside the `.docx`.

### 1.2 User Interactions

```text
Method 1  ── Cmd/Ctrl+V image from clipboard while focused in editor
Method 2  ── Drag image file from desktop onto editor
Method 3  ── "Insert Image" toolbar button → file picker
Method 4  ── Paste an image URL (raw https://) → auto-detect, fetch, embed
```

All three methods produce the same Markdown output:

```md
![alt text](blob:image-id-here)
```

The `blob:` URI references an image stored in IndexedDB.

### 1.3 Storage Architecture

New IndexedDB store:

```js
ObjectStore: images {
  keyPath: 'id',                     // nanoid
  indexes: {
    documentId:  { unique: false },  // FK to documents
    createdAt:   { unique: false },
  },
  record: {
    id: string,
    documentId: string,              // owner doc — null = orphan/library
    filename: string,
    mimeType: string,                // image/png, image/jpeg, image/svg+xml
    blob: Blob,                      // original binary
    width: number,                   // detected at upload
    height: number,
    sizeBytes: number,
    createdAt: number,
  },
}
```

Why `Blob` not base64:

- Base64 inflates size by ~33 %.
- IndexedDB handles `Blob` natively — no JSON serialization overhead.
- `URL.createObjectURL(blob)` gives an instant preview URL.

### 1.4 Render Pipeline

```text
Markdown editor: ![alt](blob:abc123)
   ↓
Preview pipeline:
   markdown-it sees blob: URI → resolve via images store → URL.createObjectURL → render <img>
   ↓
DOCX pipeline:
   remark AST: image node with url=blob:abc123
   ↓
   convertImage.js: fetch from images store → ImageRun(blob, width, height)
   ↓
   Embedded in .docx package
```

### 1.5 Image Management

- "Images" tab in History panel listing all images in current doc.
- Per-image actions: copy markdown reference, delete, replace.
- Orphan detection: images not referenced in any document → cleanup tool.
- Quota awareness: warn when total images exceed 50 MB.

### 1.6 New Files

```
src/images/
├── imageRepo.js              # CRUD on images store
├── useImages.js              # React hook
├── ImageDropZone.jsx         # Drag-drop overlay component
├── pasteHandler.js           # clipboard paste interceptor
└── ImageGallery.jsx          # List view per document

src/converter/
└── convertImage.js           # Markdown image node → DOCX ImageRun
```

### 1.7 Acceptance Criteria

- [ ] Pasting an image from clipboard inserts it at cursor and stores the blob.
- [ ] Dragging an image onto editor inserts it at cursor.
- [ ] Insert Image toolbar opens system file picker (multi-select supported).
- [ ] Preview shows inline images at natural size, capped at container width.
- [ ] Exported `.docx` contains the embedded images viewable in Word offline.
- [ ] Images persist across browser sessions (stored in IndexedDB).
- [ ] Deleting a document cascade-deletes its images.
- [ ] Orphan-image cleanup tool visible in Settings.
- [ ] PNG, JPEG, GIF, WebP, SVG all supported.
- [ ] Total image size warning at 50 MB.

### 1.8 Risks

- IndexedDB blob support varies — Safari historically had bugs; mitigation: feature-detect and fall back to base64 if blob storage fails.
- Large images can lag the editor; mitigation: downscale on upload via `OffscreenCanvas` if width > 2400 px.
- Pasted images on iOS Safari — iOS sometimes pastes as low-quality JPEG; document the limitation.

---

## 2. Sub-Epic — Word Templates

### 2.1 Goal

Let users pick a Word style template per document — same content, different visual identity. Default is what V1/V2 produces. Three additional curated templates ship out of the box. Power users can upload their own `.docx` as a template.

### 2.2 Built-in Templates

| Template | Identity | Use Case |
|---|---|---|
| **Default** | Clean Arial 11 pt, blue links, light code shading | Generic notes, internal docs (current V1 behaviour) |
| **Business Report** | Calibri 11 pt, navy headings, justified body, page borders | Quarterly reports, executive memos |
| **Technical Document** | Inter 10 pt, mono headings, larger code blocks, line numbers | Engineering specs, API docs |
| **Minimal** | Helvetica 10 pt, thin headings, no shading, lots of whitespace | Resumes, essays, long-form prose |

Each template is a separate `wordStyleConfig` variant in `src/styles/templates/`.

### 2.3 Selection UI

- Toolbar: "Template" dropdown with live thumbnail of each.
- Per-document selection — stored in `documents` record as `templateId`.
- Default template selectable globally in Settings.
- Preview reflects template typography (font, size, line spacing) when possible.

### 2.4 Custom Template Upload

- Upload a `.docx` file → app extracts `styles.xml`, `theme/theme1.xml`.
- Parse styles into a `wordStyleConfig` object.
- Save into `templates` IndexedDB store.
- User content is then exported using those styles.

> Caveat: full `.docx` style extraction is non-trivial. MVP supports a curated subset — fonts, sizes, colors, headings 1–6, body, code. Advanced features (numbering definitions, custom paragraph styles) deferred.

### 2.5 New Files

```
src/styles/templates/
├── default.js
├── businessReport.js
├── technicalDocument.js
└── minimal.js

src/templates/
├── templateRepo.js            # IndexedDB CRUD (built-in + custom)
├── useTemplates.js            # Hook
├── TemplateSelector.jsx       # Toolbar dropdown
├── TemplatePreview.jsx        # Live preview swatch
└── docxStyleExtractor.js      # Parse uploaded .docx → wordStyleConfig
```

### 2.6 Acceptance Criteria

- [ ] All 4 built-in templates render distinctly in `.docx`.
- [ ] Switching template updates exported file, leaves Markdown source unchanged.
- [ ] Per-document template choice persists across sessions.
- [ ] Default template choice persists in preferences.
- [ ] Custom uploaded `.docx` template applies on next export.
- [ ] Invalid `.docx` upload shows clear error, app stays functional.
- [ ] Preview reflects basic font + size of selected template.

---

## 3. Sub-Epic — Long Document Features

### 3.1 Goal

Make the converter usable for documents over 10 pages — the kind people actually print or send to executives.

### 3.2 Nested Lists

Current state: only 1-level lists in DOCX. Markdown source already supports nesting; converter ignores depth.

Fix:

- `convertList.js` recursively walks AST list children.
- Per-level indent applied via `numbering.config[level]`.
- Up to 6 nesting levels (matches Word's default capability).
- Mixed bullet + ordered list nesting supported.

### 3.3 Table of Contents

- New "Insert TOC" toolbar button — inserts `<!-- TOC -->` placeholder in Markdown.
- During DOCX export:
  - Walk AST collecting all `heading` nodes.
  - Build TOC paragraph block: `<text>` with leader dots and page-number field.
  - Word renders the field at open time → live page numbers.
- Preview renders a simple bullet list of headings.

### 3.4 Header / Footer / Page Numbers

- Settings panel section "Document Layout":
  - Header text (template variables: `{title}`, `{date}`)
  - Footer text (template variables: `{title}`, `{page}`, `{total}`, `{date}`)
  - Show page numbers (true/false)
- Stored per-document.
- Applied via `docx` Library's `Header` and `Footer` sections.

### 3.5 Cover Page

- Toggle in Settings: "Generate cover page".
- Inputs: title (auto-derived from H1), author, subtitle, date.
- Inserted as first section with custom layout — large title centered, subtitle below, author + date at bottom.

### 3.6 Page Size & Orientation

- Settings: A4 / US Letter / A3 / Custom (mm).
- Portrait / Landscape.
- Stored per-document.

### 3.7 New Files

```
src/converter/
├── convertNestedList.js       # Replaces convertList for deep nesting
├── convertToc.js              # TOC placeholder → DOCX TOC field
└── pageLayout.js              # Section properties (size, orientation, header, footer)

src/components/
├── DocumentLayoutPanel.jsx    # Inside SettingsSheet
└── CoverPageDialog.jsx        # Title/author/subtitle inputs
```

### 3.8 Acceptance Criteria

- [ ] Nested bullets render correctly to 6 levels.
- [ ] Mixed nested ordered+bullet lists work.
- [ ] Inserting TOC placeholder generates working Word TOC field.
- [ ] Header text appears on every page (except cover).
- [ ] Footer with `{page} / {total}` shows correct page numbers.
- [ ] Cover page generates with title, author, date.
- [ ] A4 vs Letter switch produces different page sizes in Word.
- [ ] Landscape orientation rotates the page.

---

## 4. Sub-Epic — PDF Export

### 4.1 Goal

Add `Export PDF` alongside `Export DOCX`. Both use the same Markdown source but route to different output engines.

### 4.2 Approach Choice

Two viable approaches — V3 ships Approach A first, evaluates Approach B:

#### Approach A — Browser Print → PDF (lightweight, native)

```text
User clicks Export PDF
   ↓
App applies @media print stylesheet
   ↓
window.print()
   ↓
User chooses "Save as PDF" in browser print dialog
```

Pros: zero new dependencies, perfect text fidelity, native browser feature.
Cons: requires user to confirm save dialog, less programmatic control.

#### Approach B — JS PDF library (programmatic)

Use `pdf-lib` or `jspdf` + `html2canvas` to generate PDF directly from preview.

Pros: full programmatic control, downloads silently.
Cons: ~150 KB extra bundle, font rendering subtleties, slower.

### 4.3 Print Stylesheet

Even Approach A needs a polished print CSS:

```css
@media print {
  .toolbar, .mobile-tabs, .editor-panel { display: none; }
  .preview-content {
    max-width: none;
    padding: 0;
    box-shadow: none;
    border: none;
  }
  @page {
    margin: 2cm;
  }
  h1, h2, h3 { page-break-after: avoid; }
  pre, table { page-break-inside: avoid; }
}
```

### 4.4 New Files

```
src/styles/print.css            # @media print rules

src/download/
└── downloadPdf.js              # Triggers window.print() with print mode
```

### 4.5 Acceptance Criteria

- [ ] "Export PDF" button visible alongside Export DOCX.
- [ ] Clicking opens print dialog with preview showing only document content.
- [ ] Print preview hides toolbar, tabs, modals.
- [ ] Page breaks happen at sensible places (not splitting headings from content).
- [ ] Tables don't break across pages when small enough.
- [ ] Code blocks with horizontal overflow handled (wrap or truncate).
- [ ] Header / footer / page numbers from DOCX layout settings apply if possible.

---

## 5. Sub-Epic — Math + Diagrams

### 5.1 Goal

Render LaTeX math and Mermaid diagrams in preview, embed both as images in `.docx`.

### 5.2 Math (KaTeX)

```text
Inline:  $x^2 + y^2 = z^2$
Block:   $$\sum_{i=1}^{n} i = \frac{n(n+1)}{2}$$
```

Preview pipeline:

```text
markdown-it-katex plugin → KaTeX renders math to MathML + HTML
```

DOCX pipeline:

```text
remark-math AST math node → render to SVG via KaTeX → convert to PNG → embed as image
```

### 5.3 Diagrams (Mermaid)

```text
``` mermaid
graph TD
  A --> B
  B --> C
``` 
```

Preview: client-side mermaid renderer outputs SVG.
DOCX: same SVG → PNG → ImageRun.

### 5.4 New Libraries

| Library | Size | Lazy-loaded? |
|---|---|---|
| `katex` | ~70 KB | Yes — load on first math token |
| `mermaid` | ~400 KB | Yes — load on first mermaid block |
| `markdown-it-katex` | ~5 KB | Yes |
| Canvas / SVG → PNG conversion | uses native DOM APIs | n/a |

### 5.5 New Files

```
src/preview/
├── markdownItKatex.js          # Plugin wiring
└── mermaidRenderer.js          # Lazy-load + render to SVG

src/converter/
├── convertMath.js              # Render KaTeX → SVG → PNG → ImageRun
└── convertMermaid.js           # Render Mermaid → SVG → PNG → ImageRun
```

### 5.6 Acceptance Criteria

- [ ] Inline math renders correctly in preview.
- [ ] Block math renders correctly in preview.
- [ ] Mermaid diagrams render correctly in preview.
- [ ] Math and Mermaid embed as images in `.docx`.
- [ ] No bundle size regression on first paint (lazy-loaded only).
- [ ] Invalid LaTeX shows error inline, doesn't crash app.
- [ ] Invalid Mermaid syntax shows error inline.

---

## 6. Sub-Epic — Batch + QR + URL Shortener

### 6.1 Batch Convert

- Drop a folder of `.md` files onto the app.
- Each file processed in sequence:
  - Parse → DOCX → bundle entry.
- Output: single `.zip` containing `.docx` for each input.
- Progress bar during conversion.

### 6.2 QR Code Share

Inside ShareModal, add a QR tab:

- Generate QR code for the share URL using `qrcode-svg` or canvas.
- "Save QR as PNG" button.
- Mobile recipients scan with camera — opens shared doc instantly.

### 6.3 URL Shortener

For very long share URLs (large markdown), optionally shorten:

- Default: keep long URL (works offline-first).
- Optional: TinyURL API integration (requires user opt-in, sends data).
- Self-hosted shortener path (future) — only if user provides own endpoint.

### 6.4 New Files

```
src/batch/
├── BatchConverter.jsx          # Drop zone + progress UI
├── batchProcess.js             # Sequential markdown → docx → zip
└── useBatchQueue.js            # Queue state hook

src/share/
├── QRCodeView.jsx              # QR code display + download
└── shortenerService.js         # TinyURL integration (opt-in)
```

### 6.5 Acceptance Criteria

- [ ] Drag a folder of `.md` files → app accepts and processes.
- [ ] Progress bar accurately reflects current/total.
- [ ] Output ZIP contains `.docx` for each input file.
- [ ] Failed conversions logged, do not block other files.
- [ ] QR code in Share modal scans correctly to open URL.
- [ ] QR code downloadable as PNG.
- [ ] Shortener opt-in clearly labels data egress.

---

## Cross-Cutting Concerns

### Performance

- All new heavy libraries (KaTeX, Mermaid, pdf-lib, mammoth.js for template extraction) **must lazy-load**.
- First paint must remain ≤ 150 KB gzip.
- Image processing on upload — downscale > 2400 px to keep DB small.
- Mermaid renders deferred until visible (`IntersectionObserver`).

### Accessibility

- Image insertion: prompt for alt text, never silent.
- TOC links must be keyboard-navigable.
- KaTeX output uses MathML (screen-reader-friendly).
- Mermaid output adds `aria-label` from chart title.

### Security

- Pasted image URLs only fetched if `https://` and same-origin or whitelisted CORS-friendly host.
- Custom template upload: parse `.docx` ZIP entries safely (avoid Zip-slip).
- Markdown links to `data:` URIs allowed only for images (already V2 behavior).
- KaTeX renders in a sandboxed mode (no `\href`).

### Backwards Compatibility

- All V2 documents in IndexedDB continue to work.
- New fields (`templateId`, `images`, `pageLayout`) added with sensible defaults.
- Schema migration from v1 → v2 (auto-detect missing fields).

### Testing

- Unit tests: `convertImage`, `convertNestedList`, `convertMath`, `convertMermaid`, `convertToc`.
- Integration: full export round-trip — Markdown → DOCX → reopen in Word → visual diff.
- E2E: paste image, confirm preview, export, open `.docx`, see image.

---

## Dependencies (New)

| Library | Sub-Epic | Lazy | Approx Size |
|---|---|---|---|
| `katex` | 5 | yes | 70 KB |
| `markdown-it-katex` | 5 | yes | 5 KB |
| `mermaid` | 5 | yes | 400 KB |
| `mammoth` (or custom XML parser) | 2 | yes | 50 KB |
| `qrcode` | 6 | yes | 20 KB |

No backend required for any sub-epic.

---

## Roadmap (Suggested Sequence)

```text
Release V3.0  ── Images (paste / drag / upload / embed)
Release V3.1  ── Word Templates (4 built-in + selector)
Release V3.2  ── Long Document Features (nested lists, TOC, header/footer, page #)
Release V3.3  ── PDF Export (print stylesheet first, evaluate JS PDF later)
Release V3.4  ── Math + Diagrams
Release V3.5  ── Batch + QR + URL Shortener
Release V3.6  ── Custom Template Upload + Cover Page polish
```

Same principle as V2 — each release independently shippable.

---

## Risks & Open Questions

### Risks

- **IndexedDB blob storage on Safari** — historical bugs, must fall back to base64.
- **Large images** in IndexedDB push users toward storage quota; auto-downscale and warn at 50 MB.
- **Custom template parsing** complexity — `.docx` style extraction has many edge cases. MVP supports curated subset.
- **Mermaid bundle size** (400 KB) — must lazy-load aggressively.
- **PDF print quality** varies by browser — Chrome best, Safari acceptable, Firefox quirky.

### Open Questions

- Should images be stored per-document or in a shared library?
- Should custom template upload extract numbering definitions, or just typography?
- Is approach A (browser print) sufficient for PDF, or do we need Approach B (JS PDF) day one?
- Should batch convert run in a Web Worker to avoid blocking the UI?
- Should QR codes default to short URL (data ego cost) or long URL (privacy preserved)?

---

## Success Metrics

| Target | Goal |
|---|---|
| Image embed reliability | 100 % across PNG/JPEG/GIF/WebP/SVG |
| First paint after V3.0 | ≤ 150 KB gzip (no regression from V2.5) |
| Template switch latency | < 100 ms preview update |
| TOC accuracy | 100 % of headings captured, correct order |
| PDF export success rate | ≥ 95 % across Chrome / Safari / Firefox |
| Math render speed | < 100 ms for typical inline expression |
| Batch convert throughput | ≥ 10 files/second |

---

## Attention Point

V3 introduces the first structural changes to the converter since V1. Treat the converter as **fragile load-bearing infrastructure**:

```text
Every new convert*.js file is additive.
Existing convert files must not regress.
Each release ships with full integration test of v1 features.
```

This means after V3.0 (Images) the existing test suite must still pass — basic markdown to clean Word. After V3.1 (Templates) the default template still produces V2 output bit-for-bit.

If a release would break V2 output, defer the breaking change to V4 with a major-version migration story.

---

## Deep Reasoning with Reflection (DRR)

V2 was about **delivery vehicles** — packaging, design, persistence, performance. V3 is about **document quality** — what users can put in, what comes out.

The lifecycle of a document in V3:

```text
Markdown source (richer: images, math, diagrams)
   ↓
AST (with new node types)
   ↓
Two render targets:
   ├──→ HTML preview  (markdown-it + KaTeX + Mermaid + table-wrap)
   └──→ DOCX object   (convert* modules with new convertImage/convertMath/convertMermaid/convertToc)
        ↓
        Template overlay (wordStyleConfig variant)
        ↓
        Page layout (header, footer, cover, size, orientation)
        ↓
        Pack to .docx OR print to PDF
```

Each new feature attaches at a clean architectural seam. No node type bypasses the AST. No converter touches another converter's responsibilities. The compiler stays a compiler; templates stay templates; layout stays layout. Every layer can be tested, replaced, or extended in isolation.

If V2 made the app a credible PWA, V3 makes the documents credible. Together they aim at one outcome:

```text
A user opens this app on their phone offline,
writes a long branded report with images and tables of contents,
and exports a Word file that matches their company's letterhead.
```

That is the goal of the entire project.

---

## Future (V4 and Beyond)

Out of scope for V3 but worth tracking:

- Cloud sync (cross-device history) — needs backend + auth.
- Real-time collaboration — needs CRDT + WebSocket.
- Mobile native app — Capacitor wrapper or React Native rewrite.
- E2E encryption of stored documents — passphrase-protected workspaces.
- API mode — programmatic Markdown → DOCX endpoint for automation.
- Plugin system — let users add custom converters.
- AI-assisted writing — outline expansion, grammar fix, summarization.

These will become **EPIC-V4.md** when their time comes.
