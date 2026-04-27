# Markdown to Word Converter

A web-based tool to write, preview, and export Markdown as a Microsoft Word `.docx` file.

🔗 **Live Demo:** [https://yapweijun1996.github.io/Markdown-Editor/](https://yapweijun1996.github.io/Markdown-Editor/)

---

## Features

- **Live Preview** — See rendered Markdown as you type
- **Upload `.md` file** — Load any local Markdown file
- **Export `.docx`** — Download a clean, editable Word document
- **Load Sample** — Try the app instantly with sample content
- **Template-ready styles** — All Word styles are configurable via `wordStyleConfig.js`

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

---

## Project Structure

```
src/
├── App.jsx                     # Main app, state management
├── editor/
│   ├── MarkdownEditor.jsx      # Textarea editor
│   └── FileUploader.jsx        # .md file upload
├── preview/
│   └── MarkdownPreview.jsx     # Live HTML preview
├── parser/
│   └── parseMarkdown.js        # Markdown → AST (remark)
├── converter/
│   ├── markdownToDocx.js       # Main converter entry
│   ├── convertHeading.js       # H1–H6
│   ├── convertParagraph.js     # Paragraphs
│   ├── convertInline.js        # Bold, italic, code, links
│   ├── convertList.js          # Bullet & numbered lists
│   ├── convertTable.js         # Tables
│   ├── convertCodeBlock.js     # Fenced code blocks
│   └── convertBlockquote.js   # Blockquotes
├── styles/
│   ├── wordStyleConfig.js      # All Word styles (SSOT)
│   └── app.css                 # UI styles
└── download/
    └── downloadDocx.js         # Blob → file-saver
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

> Preview is optimized for browser display.  
> Export is optimized for Word document structure.

---

## Getting Started

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Deploy to GitHub Pages
npm run deploy
```

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

All converter modules read from this config — no hardcoded styles.

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
- [ ] Template selector (Default / Business / Technical / Minimal)
- [ ] Nested list support
- [ ] Image support
- [ ] Table of contents
- [ ] Header / footer / page numbers
- [ ] Custom Word template upload

---

## License

MIT
