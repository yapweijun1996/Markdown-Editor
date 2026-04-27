# Markdown to Word Converter

[![Deploy](https://github.com/yapweijun1996/Markdown-Editor/actions/workflows/deploy.yml/badge.svg)](https://github.com/yapweijun1996/Markdown-Editor/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://yapweijun1996.github.io/Markdown-Editor/)
[![PWA](https://img.shields.io/badge/PWA-installable-9b59b6)](https://yapweijun1996.github.io/Markdown-Editor/)

An installable, offline-capable Markdown editor and Microsoft Word `.docx` converter. Apple-style design, mobile-friendly, with auto-saving document history.

🔗 **Live Demo:** [https://yapweijun1996.github.io/Markdown-Editor/](https://yapweijun1996.github.io/Markdown-Editor/)

---

## Highlights

- ✏️  **Live Markdown editor + preview** — write & see results instantly
- 📄  **Export `.docx`** — clean, editable Microsoft Word output (preserves headings, lists, tables, code, blockquotes)
- 📱  **Installable PWA** — works offline, installs to home screen on iOS / Android / desktop
- 🔄  **Forced update prompt** — users always run the latest version (30s countdown auto-reload)
- 🍎  **Apple-style design** — light / dark / auto theme, system fonts, blur effects, motion curves
- 📲  **Mobile responsive** — clean toolbar with iOS-style Action Sheet for secondary actions
- 🔗  **Share link** — encode entire Markdown into URL hash (no backend, no length limits)
- 👁️  **Preview-only mode** — readers see clean centered view without editor (1200px max width)
- 💾  **Auto-save draft** — never lose work after browser crash (configurable interval)
- 📚  **Document history** — IndexedDB stores every doc you ever edit
- 🕐  **Snapshot timeline** — auto-versioned, restore any past state with one click
- 📦  **Export ZIP** — bundle entire history into a downloadable archive
- ⚙️  **Settings panel** — font size, font family, line height, word wrap, auto-save interval
- ⚡  **Optimized bundle** — first paint ~140 KB gzip, lazy-loaded heavy libs

---

## App Modes

| Mode | UI | Use Case |
|---|---|---|
| **Edit Mode** (default) | Editor + Preview side-by-side | Writing & editing Markdown |
| **Preview Mode** | Centered preview only (1200px max) | Reading / presentation view |
| **Preview-Only (shared)** | Preview only, marked `PREVIEW ONLY` | Recipient of a shared link |
| **Standalone (PWA)** | No browser UI | Installed home-screen app |

Switch modes via toolbar buttons. Mobile uses tab switcher between Editor / Preview.

---

## Document History

Every document you edit auto-saves to IndexedDB after a few seconds of inactivity. Snapshots are taken on meaningful changes (50-version cap per doc, FIFO eviction, pinned snapshots exempt).

```
src/history/
├── db.js                ← IndexedDB schema + indexes
├── documentRepo.js      ← CRUD on documents
├── snapshotRepo.js      ← Auto-snapshot + FIFO cap
├── useHistory.js        ← React hook
├── HistoryPanel.jsx     ← List view UI
├── VersionsView.jsx     ← Timeline UI per document
└── exportHistory.js     ← Bundle all docs + snapshots into ZIP
```

| Feature | Details |
|---|---|
| Auto-save | Every 8s (debounced) when content changes |
| Snapshot | Every 30s, only if content meaningfully differs |
| Cap | 50 snapshots per doc, FIFO eviction |
| Pinned docs | Sort first, never auto-evicted |
| Search | Real-time filter on title + content |
| Export | ZIP with `documents/<title>.md` + `snapshots/<title>/<timestamp>.md` |

---

## Sharing How It Works

Click **Share** → modal opens → URL is generated and can be copied:

```
https://yapweijun1996.github.io/Markdown-Editor/#content=<compressed>&mode=preview
                                                  ↑
                                      URL fragment (never sent to server)
                                      → No "URI Too Long" error
                                      → Supports very large Markdown
```

- Markdown is compressed via `lz-string` then URL-encoded
- Uses URL **hash** (`#`) instead of query (`?`) to bypass server URI length limits
- "Preview only mode" checkbox preference is saved to `localStorage`
- Recipient can still **Export .docx** or click **Edit Mode** to switch to editing

---

## Supported Markdown Elements

| Markdown | Word Output |
|---|---|
| `# H1` to `###### H6` | Heading 1–6 |
| Normal text | Paragraph |
| `**bold**` | Bold |
| `*italic*` | Italic |
| `` `inline code` `` | Monospace run |
| ` ``` code block ``` ` | Shaded monospace block |
| `- item` / `1. item` | Bullet / Numbered list |
| `> quote` | Indented blockquote |
| `\| table \|` | Word table |
| `---` | Horizontal rule |
| `[text](url)` | Hyperlink |

---

## Tech Stack

| Layer | Library |
|---|---|
| Frontend | React 18 + Vite 6 |
| Markdown Preview | `markdown-it` |
| Markdown Parsing | `unified` + `remark-parse` + `remark-gfm` |
| DOCX Generation | `docx` (lazy-loaded) |
| ZIP Export | `jszip` (lazy-loaded) |
| File Download | `file-saver` |
| URL Compression | `lz-string` |
| Local Storage | `localStorage` (preferences, draft) |
| Local Database | IndexedDB via `idb` |
| UUID Generation | `nanoid` |
| PWA | `vite-plugin-pwa` + `workbox` |
| CI/CD | GitHub Actions + GitHub Pages |

---

## Project Structure

```
src/
├── App.jsx                          # Main app, state, routing, mobile toolbar
├── main.jsx                         # React entry, theme + app CSS load order
│
├── editor/
│   ├── MarkdownEditor.jsx           # Textarea editor (uses CSS data-attr prefs)
│   └── useFileUpload.jsx            # Reusable file picker hook
│
├── preview/
│   └── MarkdownPreview.jsx          # Live HTML preview via markdown-it
│
├── parser/
│   └── parseMarkdown.js             # Markdown → AST (remark/unified)
│
├── converter/                       # Markdown AST → DOCX Object Model
│   ├── markdownToDocx.js            # Main converter entry (lazy-loaded)
│   ├── convertHeading.js            # H1–H6
│   ├── convertParagraph.js          # Paragraphs
│   ├── convertInline.js             # Bold, italic, code, links
│   ├── convertList.js               # Bullet & numbered lists
│   ├── convertTable.js              # Tables
│   ├── convertCodeBlock.js          # Fenced code blocks
│   └── convertBlockquote.js         # Blockquotes
│
├── share/                           # URL-based sharing
│   ├── shareLink.js                 # Encode/decode URL hash, clipboard
│   └── ShareModal.jsx               # Share dialog
│
├── pwa/                             # PWA + forced update
│   └── UpdatePrompt.jsx             # New-version toast with countdown
│
├── theme/                           # Light / dark / auto theme
│   ├── useTheme.js                  # Theme state + system pref sync
│   └── ThemeToggle.jsx              # Sun / moon / system icon button
│
├── components/                      # Generic UI components
│   └── MoreMenu.jsx                 # iOS-style Action Sheet
│
├── preferences/                     # User preferences + draft
│   ├── defaults.js                  # Schema + version constant
│   ├── storage.js                   # Versioned migration + deep-merge
│   ├── usePreferences.js            # React hook
│   ├── SettingsSheet.jsx            # iOS-style settings modal
│   ├── DraftRestorePrompt.jsx       # "Restore unsaved draft" banner
│   └── draftStorage.js              # localStorage draft + relative time
│
├── history/                         # IndexedDB document history
│   ├── db.js                        # IndexedDB schema + open
│   ├── documentRepo.js              # Document CRUD
│   ├── snapshotRepo.js              # Snapshot CRUD + FIFO cap
│   ├── useHistory.js                # Hook: auto-save + restore
│   ├── HistoryPanel.jsx             # List view + search + export
│   ├── VersionsView.jsx             # Snapshot timeline
│   └── exportHistory.js             # ZIP bundle
│
├── download/
│   └── downloadDocx.js              # Lazy-load docx + trigger download
│
└── styles/
    ├── theme.css                    # Apple HIG design tokens (light/dark)
    ├── wordStyleConfig.js           # All Word styles (SSOT)
    └── app.css                      # UI layout + mobile responsive
```

---

## Architecture

Six independent layers — each can ship or roll back without breaking the others.

```
┌─────────────────────────────────────────────────────────┐
│  Service Worker layer  (vite-plugin-pwa, workbox)        │ ← V2.0
├─────────────────────────────────────────────────────────┤
│  Layout layer         (mobile / tablet / desktop)        │ ← V2.1
├─────────────────────────────────────────────────────────┤
│  Design layer         (Apple HIG tokens, theming)        │ ← V2.1
├─────────────────────────────────────────────────────────┤
│  Preferences layer    (localStorage, settings UI)        │ ← V2.2
├─────────────────────────────────────────────────────────┤
│  Persistence layer    (IndexedDB, snapshots, ZIP)        │ ← V2.3 / V2.4
├─────────────────────────────────────────────────────────┤
│  Compiler layer       (Markdown → AST → DOCX)            │ ← V1.0
└─────────────────────────────────────────────────────────┘
```

The compiler is the **load-bearing centre** — none of the V2 layers touch
`src/converter/`, so the export pipeline never regresses.

### Pipelines

```
Preview Pipeline          Export Pipeline           Share Pipeline
────────────────          ──────────────────────    ──────────────────
Markdown Text             Markdown Text             Markdown Text
     ↓                         ↓                         ↓
 markdown-it               remark-parse              lz-string compress
     ↓                         ↓                         ↓
   HTML                    Markdown AST              window.location.hash
     ↓                         ↓                    (never sent to server)
Preview Panel           DOCX Element Mapping              ↓
                               ↓                    Copy to clipboard
                         DOCX Package
                               ↓
                         Download .docx
```

---

## Performance

After bundle splitting + lazy loading (V2.5):

| Asset | Size (gzip) | Loaded When |
|---|---|---|
| `index.js` (your app code) | ~12 KB | Always |
| `vendor-react` | 46 KB | Always |
| `vendor-utils` (idb, lz-string, nanoid) | 4 KB | Always |
| `vendor-workbox` | 2 KB | Always |
| `vendor-markdown-it` | 46 KB | Always (preview) |
| **First paint subtotal** | **~140 KB** | |
| `vendor-remark` | 32 KB | First export click |
| `vendor-docx` | 102 KB | First export click |
| `vendor-jszip` | 30 KB | First "Export ZIP" click |

**Cache strategy:** vendor chunks rarely change → cached for months. Only `index.js` (~12 KB gzip) re-downloads on a new release.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server (PWA disabled in dev)
npm run dev

# Build for production (with PWA + manualChunks)
npm run build
```

Auto-deployed to GitHub Pages on every push to `main` — no manual deploy needed.

---

## Deployment

Continuous deployment via `.github/workflows/deploy.yml`:

```
git push origin main
   ↓
GitHub Actions runs npm ci + npm build
   ↓
actions/upload-pages-artifact uploads dist/
   ↓
actions/deploy-pages publishes to GitHub Pages
   ↓
Live Demo updates automatically (~1–2 min)
   ↓
PWA users see update prompt within 30s
```

GitHub Pages source: **Settings → Pages → Source = GitHub Actions** (no `gh-pages` branch).

---

## Design Tokens

All visual values come from `src/styles/theme.css`. Light + dark modes share the same token names; values swap per `[data-theme]` attribute.

```
Colors          → Apple HIG (System Blue #007AFF + dark variants)
Typography      → Apple Dynamic Type (caption2 11px → large 34px)
Spacing         → 4px base scale (sp-1 to sp-12)
Radius          → xs (4) sm (6) md (8) lg (12) xl (16) full
Motion          → cubic-bezier curves: standard / spring / decelerate
Touch targets   → minimum 44px (Apple HIG)
Safe area       → env(safe-area-inset-*) for iOS notch
```

Change accent, fonts, or scale once in `theme.css` — the entire app updates.

---

## Customizing Word Styles

`src/styles/wordStyleConfig.js` is the single source of truth for `.docx` output:

```js
export const wordStyleConfig = {
  document: { font: 'Arial', fontSize: 22 },
  heading1: { fontSize: 36, bold: true, spacingAfter: 240 },
  paragraph: { fontSize: 22, spacingAfter: 160, lineSpacing: 276 },
  codeBlock: { font: 'Consolas', fontSize: 20, shading: 'F5F5F5' },
  table:    { headerBold: true, cellMargin: 100, borderColor: 'AAAAAA' },
  // ...
}
```

All converter modules read from this config — no hardcoded values.

---

## Design Principle

This project is built as a **small document compiler**, not a format converter.

```
Markdown  →  AST  →  DOCX Object Model  →  .docx
```

The most important layer is `Markdown AST → DOCX mapping`.
The V2 epic adds an experience layer (PWA, design, prefs, history) on top —
but the compiler at the centre is untouched.

---

## Roadmap

### V1 — Core Compiler ✅
- [x] Markdown editor + live preview
- [x] `.docx` export (headings, paragraphs, lists, tables, code)
- [x] Sample document loader
- [x] Clean Apple-style UI

### V2 — Experience Layer ✅
- [x] **V2.0** — PWA installable + forced update + iOS safe area
- [x] **V2.1** — Apple design tokens + light/dark/auto theme + mobile responsive
- [x] **V2.2** — Settings sheet + auto-save draft + iOS Action Sheet on mobile
- [x] **V2.3** — IndexedDB document history + auto-snapshot
- [x] **V2.4** — Snapshot timeline UI + ZIP export + storage indicator
- [x] **V2.5** — Bundle splitting + lazy-load docx/jszip (52 % smaller first paint)

### V3 — Future
- [ ] Image support (paste, upload, base64)
- [ ] Nested list support
- [ ] Table of contents in `.docx`
- [ ] Header / footer / page numbers
- [ ] Custom Word template upload
- [ ] Print / Save as PDF
- [ ] QR code share
- [ ] URL shortener integration
- [ ] Template selector (Default / Business / Technical / Minimal)
- [ ] Cloud sync (cross-device history)
- [ ] Collaboration (real-time multi-user)
- [ ] Batch convert multiple `.md` files

---

## License

MIT
