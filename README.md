# Markdown to Word Converter

[![Deploy](https://github.com/yapweijun1996/Markdown-Editor/actions/workflows/deploy.yml/badge.svg)](https://github.com/yapweijun1996/Markdown-Editor/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Pages](https://img.shields.io/badge/demo-live-brightgreen)](https://yapweijun1996.github.io/Markdown-Editor/)

A web-based tool to write, preview, share, and export Markdown as a Microsoft Word `.docx` file.

🔗 **Live Demo:** [https://yapweijun1996.github.io/Markdown-Editor/](https://yapweijun1996.github.io/Markdown-Editor/)

---

## Features

- **Live Preview** — See rendered Markdown as you type
- **Upload `.md` file** — Load any local Markdown file
- **Export `.docx`** — Download a clean, editable Word document
- **Preview Mode** — Switch to a clean, centered reading view (max 1200px width)
- **Share Link** — Generate a shareable URL with your Markdown embedded
- **Preview-Only Sharing** — Recipients see read-only preview (cannot edit)
- **Persistent Preferences** — Share settings remembered via `localStorage`
- **Load Sample** — Try the app instantly with sample content
- **Template-ready styles** — All Word styles are configurable via `wordStyleConfig.js`

---

## App Modes

| Mode | UI | Use Case |
|---|---|---|
| **Edit Mode** (default) | Editor + Preview side-by-side | Writing & editing Markdown |
| **Preview Mode** | Centered preview only (1200px max) | Reading / presentation view |
| **Preview-Only (shared)** | Preview only, marked `PREVIEW ONLY` | Recipient of a shared link |

Switch via toolbar buttons: **Preview** / **Edit Mode**.

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
| Frontend | React + Vite |
| Markdown Preview | `markdown-it` |
| Markdown Parsing | `unified` + `remark-parse` + `remark-gfm` |
| DOCX Generation | `docx` |
| File Download | `file-saver` |
| URL Compression | `lz-string` |
| CI/CD | GitHub Actions + GitHub Pages |

---

## Project Structure

```
src/
├── App.jsx                       # Main app, state management, mode routing
├── editor/
│   ├── MarkdownEditor.jsx        # Textarea editor
│   └── FileUploader.jsx          # .md file upload
├── preview/
│   └── MarkdownPreview.jsx       # Live HTML preview
├── parser/
│   └── parseMarkdown.js          # Markdown → AST (remark)
├── converter/
│   ├── markdownToDocx.js         # Main converter entry
│   ├── convertHeading.js         # H1–H6
│   ├── convertParagraph.js       # Paragraphs
│   ├── convertInline.js          # Bold, italic, code, links
│   ├── convertList.js            # Bullet & numbered lists
│   ├── convertTable.js           # Tables
│   ├── convertCodeBlock.js       # Fenced code blocks
│   └── convertBlockquote.js     # Blockquotes
├── share/
│   ├── shareLink.js              # Encode/decode URL hash, clipboard
│   └── ShareModal.jsx            # Share dialog UI
├── styles/
│   ├── wordStyleConfig.js        # All Word styles (SSOT)
│   └── app.css                   # UI styles
└── download/
    └── downloadDocx.js           # Blob → file-saver
```

---

## Architecture

The app uses two independent pipelines:

```
Preview Pipeline          Export Pipeline
────────────────          ──────────────────────
Markdown Text             Markdown Text
     ↓                         ↓
 markdown-it               remark-parse
     ↓                         ↓
   HTML                    Markdown AST
     ↓                         ↓
Preview Panel           DOCX Element Mapping
                               ↓
                         DOCX Package (docx)
                               ↓
                         Download .docx
```

Plus a **share pipeline**:

```
Markdown
   ↓
lz-string compress
   ↓
URL-encode
   ↓
window.location.hash    ← stays in browser, never sent to server
   ↓
Copy to clipboard
```

> Preview is optimized for browser display.
> Export is optimized for Word document structure.
> Sharing is a pure-frontend, zero-backend solution.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build
```

The app is auto-deployed via GitHub Actions on every push to `main` — no manual deploy needed.

---

## Deployment

Continuous deployment is configured via `.github/workflows/deploy.yml`:

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
```

Pages source: **Settings → Pages → Source = GitHub Actions** (no `gh-pages` branch needed).

---

## Customizing Word Styles

Edit `src/styles/wordStyleConfig.js` to change fonts, sizes, spacing, and colors:

```js
export const wordStyleConfig = {
  document: { font: 'Arial', fontSize: 22 },
  heading1: { fontSize: 36, bold: true, spacingAfter: 240 },
  paragraph: { fontSize: 22, spacingAfter: 160, lineSpacing: 276 },
  codeBlock: { font: 'Consolas', fontSize: 20, shading: 'F5F5F5' },
  // ...
}
```

All converter modules read from this config — no hardcoded styles (SSOT principle).

---

## Design Principle

This project is built as a **small document compiler**, not a format converter.

```
Markdown  →  AST  →  DOCX Object Model  →  .docx
```

The most important layer is `Markdown AST → DOCX mapping`.
This keeps the architecture clean and easy to extend.

---

## Roadmap

- [x] Markdown editor + live preview
- [x] Basic `.docx` export (headings, paragraphs, lists, tables, code)
- [x] Preview Mode (centered, max 1200px width)
- [x] Share via URL with embedded compressed Markdown
- [x] Preview-only mode for recipients
- [x] localStorage preference persistence
- [x] CI/CD via GitHub Actions
- [ ] Template selector (Default / Business / Technical / Minimal)
- [ ] Nested list support
- [ ] Image support
- [ ] QR code share
- [ ] URL shortener integration
- [ ] Print / Save as PDF
- [ ] Dark mode
- [ ] Table of contents
- [ ] Header / footer / page numbers
- [ ] Custom Word template upload

---

## License

MIT
