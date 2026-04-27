# TESTING.md — End-to-End Manual Test Checklist

> **How to use:** Open the live demo, click **Sample** to load the V3 showcase document, then walk through this checklist top to bottom. Tick boxes as you go.

🔗 Live Demo: https://yapweijun1996.github.io/Markdown-Editor/

---

## 1. Smoke Tests (≤ 2 min)

- [ ] Page loads under 1 s on broadband.
- [ ] No red console errors on first load.
- [ ] Theme toggle (☀ / 🌙 / 💻) cycles three modes; matches OS when set to Auto.
- [ ] Editor textarea accepts typing with no lag.
- [ ] Preview updates within ~50 ms of typing.

---

## 2. Sample Content & Core Markdown

- [ ] Click **Sample** — the V3 showcase document loads.
- [ ] Headings H1–H6 render with progressively smaller sizes.
- [ ] Bold, italic, bold-italic, inline code, strikethrough all render.
- [ ] Links open in new tab (target=_blank) and have `noopener` rel.
- [ ] Bullet list nests up to 4 levels (visible indents).
- [ ] Mixed bullet + ordered nesting works.
- [ ] Code blocks have light-gray background, monospace font.
- [ ] Tables fit screen on desktop; scroll horizontally on mobile.
- [ ] Blockquotes have left border and italic text.
- [ ] Horizontal rule renders as thin line.

---

## 3. Math (KaTeX)

- [ ] Inline math `$a^2 + b^2 = c^2$` renders with proper symbols.
- [ ] Block math `$$\\sum_{i=1}^{n}$$` is centered, larger.
- [ ] Euler's identity `$$e^{i\\pi} + 1 = 0$$` shows correctly.
- [ ] Math chunk loads only when needed (check Network tab — `vendor-katex` should not appear in initial requests).
- [ ] Math errors render inline as red text rather than crashing.

---

## 4. Diagrams (Mermaid)

- [ ] Flowchart renders as SVG with arrows + boxes.
- [ ] Sequence diagram renders with vertical lifelines.
- [ ] Mermaid library loads only when a `mermaid` code block is present (~750 KB gzip — visible in Network tab).
- [ ] Invalid Mermaid syntax shows red error inline, doesn't crash.

---

## 5. Images (V3.0)

### Paste Test
- [ ] Take a screenshot (Cmd+Shift+4 / Win+Shift+S).
- [ ] Click in the editor.
- [ ] Cmd/Ctrl+V — image inserts as `![](mdimg://...)`.
- [ ] Image renders in preview panel.

### Drag-Drop Test
- [ ] Drag a PNG/JPEG from desktop onto the editor.
- [ ] Blue overlay appears: "Drop image to insert".
- [ ] Release — image inserts at end of content.

### Insert Image Button
- [ ] Click **⋯ More** → **Insert Image**.
- [ ] System file picker opens; multi-select works.
- [ ] Multiple selections insert sequentially.

### Image Persistence
- [ ] Refresh the page.
- [ ] Image still renders in preview (loaded from IndexedDB).
- [ ] Open browser DevTools → Application → IndexedDB → `markdown-editor-db` → `images` — see stored Blobs.

### Image Export
- [ ] Click **Export** (.docx).
- [ ] Open the downloaded file in Word / LibreOffice / Google Docs.
- [ ] Image is embedded and visible in the document.

---

## 6. Word Templates (V3.1)

- [ ] Click **⋯ More** → **Document Layout**.
- [ ] Template grid shows 4 cards with different "Aa" font swatches.
- [ ] Click each template:
  - [ ] Default — Arial baseline
  - [ ] Business Report — Calibri navy headings
  - [ ] Technical Document — Inter compact
  - [ ] Minimal — Helvetica thin headings
- [ ] Active template has blue border in the grid.
- [ ] Export `.docx` after each switch — Word file reflects the chosen template.

---

## 7. Long Document Features (V3.2)

### Table of Contents
- [ ] Document has `[TOC]` on its own line.
- [ ] After exporting `.docx`, open in Word.
- [ ] Word shows "Table of Contents" heading + auto-populated entries.
- [ ] Right-click → Update Field — entries link to headings.

### Page Layout
- [ ] In **Document Layout** sheet, switch:
  - [ ] Page size: A4 → Letter → A3
  - [ ] Orientation: Portrait → Landscape
- [ ] Each export reflects the chosen size/orientation in Word.

### Headers / Footers / Page Numbers
- [ ] Set **Header** to `{title}`.
- [ ] Set **Footer** to `{date}`.
- [ ] Toggle **Page Numbers** ON.
- [ ] Export → Word shows header on every page (except cover), footer with date + "Page N of M".

### Cover Page
- [ ] Toggle **Generate Cover Page** ON.
- [ ] Fill in Title, Subtitle, Author, Date.
- [ ] Export → Word document has cover page first, then body on page 2.
- [ ] Cover page does NOT show header/footer.

### Nested Lists in DOCX
- [ ] Sample document has 4-level nested bullets.
- [ ] Export → Word file shows correct indentation per level.
- [ ] Bullet characters change per level (• ◦ ▪ · ∘ ▫).

---

## 8. PDF Export (V3.3)

- [ ] Click **PDF** button (or **⋯ More** → Export PDF on mobile).
- [ ] Browser print dialog opens.
- [ ] Toolbar / editor / sidebars are hidden in print preview.
- [ ] Preview content uses full page width.
- [ ] Choose "Save as PDF" → file saved.
- [ ] Open the PDF — content is paginated, headings don't split mid-page.
- [ ] External links print with URL inline: `OpenAI (https://openai.com)`.

---

## 9. Share & QR (V3.5)

- [ ] Click **Share**.
- [ ] URL appears in the modal — long but copyable.
- [ ] Click **Show QR Code**.
- [ ] QR canvas renders within ~1 s.
- [ ] Click **Download as PNG** — QR image saves.
- [ ] Scan QR with phone camera — opens shared document.
- [ ] If URL > 6 KB: **Shorten URL (TinyURL)** button is enabled.
  - [ ] Click it — shortened URL replaces long one.
  - [ ] Green confirmation: "Original X → Y chars".
- [ ] Toggle **Preview only mode** off and on — QR + URL both update.

### Recipient Side
- [ ] Open the share URL in a new incognito window.
- [ ] Document appears with `PREVIEW ONLY` badge in toolbar.
- [ ] Editor panel hidden; preview centered with max-width 1200 px.
- [ ] **Export** still works for recipient.
- [ ] Click **Edit** — switches to editing mode (URL hash cleared).

---

## 10. History (V2.3 + V2.4 + V3)

- [ ] Type for >10 s — IndexedDB auto-saves a document.
- [ ] Click **History** in toolbar.
- [ ] Document appears with title, snippet, word count, "current" tag.
- [ ] Click **+ New** — fresh editor, document list grows.
- [ ] Pin a document — it stays at the top.
- [ ] Rename a document inline — Enter to commit, Esc to cancel.
- [ ] Search by content — results update in real time.

### Snapshot Timeline
- [ ] Click clock icon (🕐) on a document row.
- [ ] Versions modal shows timeline of snapshots.
- [ ] Click **Restore** on an old snapshot.
- [ ] Confirm — content reverts.
- [ ] Open Versions again — old current state is now in the timeline (safety snapshot).

### Export ZIP
- [ ] Click **Export All as ZIP** in History footer.
- [ ] Browser downloads `markdown-history-<timestamp>.zip`.
- [ ] Unzip — see `documents/<title>.md` + `snapshots/<title>/<timestamp>.md` + `INDEX.md`.

---

## 11. Batch Convert (V3.5)

- [ ] Click **⋯ More** → **Batch Convert**.
- [ ] Drop 3+ `.md` files (or click **Select Files**).
- [ ] Files appear in list with `○` queued status.
- [ ] Click **Convert N → ZIP**.
- [ ] Status icons cycle: `○` → `⏳` → `✓` per file.
- [ ] Progress bar fills.
- [ ] ZIP downloads automatically.
- [ ] Unzip — each input has a corresponding `.docx`.
- [ ] Inject one bad `.md` (e.g. binary garbage) — that file shows `✗` with error, others succeed.

---

## 12. Settings (V2.2)

- [ ] Click **Settings** ⚙.
- [ ] Change Font Size: S / M / L / XL — editor + preview reflect.
- [ ] Change Font Family: Mono / System / Serif — editor reflects.
- [ ] Change Line Height: Compact / Normal / Relaxed — both reflect.
- [ ] Toggle Word Wrap off — long lines scroll horizontally in editor.
- [ ] Change Theme: Light / Dark / Auto — entire app updates.
- [ ] Toggle Auto-save — debounce interval visible only when on.
- [ ] Click **Reset All Settings** — confirms back to defaults.
- [ ] Refresh page — all settings persist.

---

## 13. Mobile (< 768 px)

Open the app on a phone, or use Chrome DevTools → Toggle Device Toolbar.

- [ ] Toolbar shows only essentials: title + Export + ☀ + ⋯
- [ ] Tap **⋯ More** — bottom sheet slides up with all secondary actions.
- [ ] Editor / Preview tab switcher visible above content.
- [ ] Tap Editor / Preview to toggle.
- [ ] Tap any button — feedback (scale + opacity) is visible.
- [ ] Modals slide up from bottom as full-screen sheet with drag handle.
- [ ] Long content does not horizontally clip — tables scroll inside their wrapper.
- [ ] Safe area respected — content not hidden under iOS notch / home indicator.

---

## 14. PWA (V2.0)

### Installation
- [ ] Open in Chrome / Edge — address bar shows install icon (⊕).
- [ ] Click install → app launches in standalone window with no browser UI.
- [ ] Custom blue MD→DOC icon appears.

### iOS Install
- [ ] Open in Safari → Share → Add to Home Screen.
- [ ] Icon appears on home screen.
- [ ] Tap → opens fullscreen, no Safari chrome.

### Offline Mode
- [ ] After visiting once, open DevTools → Network → set to **Offline**.
- [ ] Reload — app still loads from cache.
- [ ] Editor + preview + DOCX export all work offline.
- [ ] (Mermaid + KaTeX only work offline if previously fetched.)

### Forced Update
- [ ] Push a code change → wait for GitHub Actions deploy.
- [ ] Open the live PWA → within ~60 s, blue update toast appears.
- [ ] 30-second countdown shown; **Reload Now** button works.
- [ ] After reload, app runs the new version.

---

## 15. Performance (Lighthouse)

Open Chrome DevTools → Lighthouse → Generate Report (Mobile preset, all categories).

| Category | Target | Pass? |
|---|---|---|
| Performance | ≥ 90 | [ ] |
| Accessibility | ≥ 95 | [ ] |
| Best Practices | ≥ 95 | [ ] |
| SEO | ≥ 90 | [ ] |
| PWA | 100 | [ ] |

Specific metrics to verify:

- [ ] First Contentful Paint < 1.5 s
- [ ] Time to Interactive < 2.0 s
- [ ] Total Blocking Time < 200 ms
- [ ] Initial JS bundle < 150 KB gzip

---

## 16. Cross-Browser Sanity

Open the live demo in each, smoke-test sample doc:

- [ ] Chrome (desktop)
- [ ] Edge (desktop)
- [ ] Firefox (desktop)
- [ ] Safari (desktop)
- [ ] Safari (iOS — if on iPhone)
- [ ] Chrome (Android — if available)

---

## 17. Regression Sanity (V1 still works)

The most important thing to check after every release:

- [ ] Type plain markdown — no images, no math, no diagrams.
- [ ] Click **Export**.
- [ ] Resulting `.docx` opens cleanly in Word.
- [ ] Headings, bold, italic, lists, tables, code, blockquotes all preserved.
- [ ] Default template still produces visually unchanged output vs V2.

---

## Reporting Issues

If any check fails:

1. Note which step.
2. Open browser DevTools → Console — copy any errors.
3. Filter Network for failing requests.
4. File an issue at https://github.com/yapweijun1996/Markdown-Editor/issues with:
   - Browser + version
   - OS
   - Step number from this checklist
   - Screenshot if visual
   - Console errors if functional

---

## Smoke Test (90 seconds, after every release)

If you only have 90 seconds, do these:

1. [ ] Load Sample → preview shows full V3 doc with math + mermaid + table.
2. [ ] Click **Read** → centered preview-only view.
3. [ ] Click **Edit** → back to split view.
4. [ ] Click **Export** → `.docx` downloads.
5. [ ] Open `.docx` in Word — content + images + diagrams all there.
6. [ ] Click **Share** → URL appears, copy works.
7. [ ] Click **History** → at least one document listed.
8. [ ] Click **Settings** ⚙ → controls visible.

If all 8 pass — release is healthy.
