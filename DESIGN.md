# DESIGN.md — Markdown to Microsoft Word Converter

## 1. Product Overview

This project is a web-based Markdown to Microsoft Word converter.

The application allows users to:

1. Write Markdown content.
2. Upload an existing `.md` file.
3. Preview the Markdown in real time.
4. Export the Markdown content as a Microsoft Word `.docx` file.

The main goal is to convert Markdown into a clean, editable, professional Word document.

This project should prioritize:

- Correct document structure
- Clean Word formatting
- Editable `.docx` output
- Simple user experience
- Stable export behavior

Pixel-perfect matching between browser preview and Word output is not the main goal.

---

## 2. Product Goals

### Primary Goals

- Provide a simple Markdown editor.
- Provide live Markdown preview.
- Convert Markdown into `.docx`.
- Allow users to download the generated Word file.
- Preserve important Markdown structure such as headings, paragraphs, lists, tables, and code blocks.

### Secondary Goals

- Support reusable Word style templates.
- Support business report formatting.
- Support technical documentation formatting.
- Support future extension for images, table of contents, page numbers, and company templates.

---

## 3. Non-Goals

The MVP does not aim to support:

- Perfect visual matching between browser preview and Microsoft Word.
- Complex Word layout features.
- Track changes.
- Comments.
- Advanced citations.
- Footnotes.
- Mathematical equation rendering.
- Complex nested tables.
- Remote image downloading.
- Full Pandoc-level document conversion.

---

## 4. Target Users

### Main Users

- Developers
- Technical writers
- Product managers
- Business users
- Students
- Internal documentation teams

### Common Use Cases

- Convert README files to Word documents.
- Convert technical specs to Word documents.
- Convert PRD documents to Word documents.
- Convert meeting notes to Word documents.
- Convert AI-generated Markdown reports into editable Word files.
- Convert internal documentation into business-friendly `.docx` format.

---

## 5. Core User Flow

```text
User opens app
  ↓
User writes Markdown or uploads .md file
  ↓
App renders live preview
  ↓
User clicks Export DOCX
  ↓
App converts Markdown into Word document
  ↓
User downloads .docx file
```

---

## 6. High-Level Architecture

```text
Markdown Input
  ↓
Markdown Parser
  ↓
Markdown AST
  ↓
DOCX Converter
  ↓
DOCX Document Object
  ↓
Blob Download
  ↓
Microsoft Word File
```

The system has two separate pipelines:

### Preview Pipeline

```text
Markdown Text
  ↓
Markdown Parser
  ↓
HTML
  ↓
Preview Panel
```

### Export Pipeline

```text
Markdown Text
  ↓
Markdown AST
  ↓
DOCX Element Mapping
  ↓
DOCX Package
  ↓
Download .docx
```

The preview pipeline is optimized for browser display.

The export pipeline is optimized for Microsoft Word document generation.

---

## 7. Recommended Tech Stack

### Frontend

- Vite
- React
- TypeScript (optional for future version)
- CSS modules or plain CSS

### Markdown Preview

Recommended libraries:

- `markdown-it`
- `marked`

### Markdown AST Parsing

Recommended libraries:

- `unified`
- `remark-parse`
- `remark-gfm`

### DOCX Generation

Recommended library:

- `docx`

### File Download

Recommended options:

- Native `Blob`
- `URL.createObjectURL`
- `file-saver`

---

## 8. Suggested Project Structure

```text
md-to-word/
├── package.json
├── index.html
├── README.md
├── DESIGN.md
├── src/
│   ├── main.js
│   ├── app.js
│   │
│   ├── editor/
│   │   ├── MarkdownEditor.js
│   │   └── FileUploader.js
│   │
│   ├── preview/
│   │   └── MarkdownPreview.js
│   │
│   ├── parser/
│   │   └── parseMarkdown.js
│   │
│   ├── converter/
│   │   ├── markdownToDocx.js
│   │   ├── convertHeading.js
│   │   ├── convertParagraph.js
│   │   ├── convertInline.js
│   │   ├── convertList.js
│   │   ├── convertTable.js
│   │   ├── convertCodeBlock.js
│   │   └── convertBlockquote.js
│   │
│   ├── styles/
│   │   ├── wordStyleConfig.js
│   │   └── app.css
│   │
│   └── download/
│       └── downloadDocx.js
```

---

## 9. Main Modules

### 9.1 Editor Module

Responsible for Markdown input.

Features:

- Text input area
- Markdown typing
- `.md` file upload
- Clear content
- Optional sample document loading

Responsibilities:

```text
Receive user input
Store Markdown text
Update preview state
Pass Markdown text to export pipeline
```

---

### 9.2 Preview Module

Responsible for rendering Markdown into preview HTML.

Features:

- Live preview
- Heading rendering
- List rendering
- Code block rendering
- Table rendering
- Link rendering

Security rule:

```text
Do not allow unsafe raw HTML by default.
```

Preview should avoid dangerous HTML injection.

---

### 9.3 Parser Module

Responsible for converting Markdown text into a structured AST.

Input:

```text
Markdown string
```

Output:

```text
Markdown AST
```

Example:

```text
# Title

Hello **world**
```

Should become structured nodes like:

```text
heading
paragraph
strong
text
```

The parser is important because the DOCX exporter should not depend only on rendered HTML.

---

### 9.4 Converter Module

Responsible for converting Markdown AST nodes into DOCX document elements.

This is the core module of the project.

Main responsibility:

```text
Markdown AST Node → DOCX Element
```

Example mapping:

```text
heading → Word heading paragraph
paragraph → Word paragraph
strong → bold text run
emphasis → italic text run
list → Word bullet or numbered list
table → Word table
code → Word code block
```

---

### 9.5 Style Module

Responsible for controlling Word document appearance.

The style system should define:

- Default font
- Default font size
- Paragraph spacing
- Heading styles
- Code block style
- Table style
- Blockquote style
- Link style

Example:

```js
export const wordStyleConfig = {
  document: {
    font: "Arial",
    fontSize: 22
  },

  heading1: {
    fontSize: 36,
    bold: true,
    spacingAfter: 240
  },

  heading2: {
    fontSize: 30,
    bold: true,
    spacingAfter: 200
  },

  paragraph: {
    fontSize: 22,
    spacingAfter: 160,
    lineSpacing: 276
  },

  codeBlock: {
    font: "Consolas",
    fontSize: 20,
    shading: "F5F5F5"
  }
};
```

All styles should be configurable.

Do not hardcode styles directly inside conversion logic.

---

### 9.6 Download Module

Responsible for generating and downloading the `.docx` file.

Flow:

```text
DOCX document object
  ↓
Pack into Blob
  ↓
Create object URL
  ↓
Trigger browser download
```

Expected output:

```text
document.docx
```

---

## 10. Markdown to DOCX Mapping

| Markdown Element    | DOCX Output                |
| ------------------- | -------------------------- |
| `# Heading 1`       | Heading 1 paragraph        |
| `## Heading 2`      | Heading 2 paragraph        |
| `### Heading 3`     | Heading 3 paragraph        |
| Normal text         | Paragraph                  |
| `**bold**`          | Bold TextRun               |
| `*italic*`          | Italic TextRun             |
| `` `inline code` `` | Monospace TextRun          |
| Code block          | Shaded monospace paragraph |
| `- item`            | Bullet list                |
| `1. item`           | Numbered list              |
| `> quote`           | Indented quote paragraph   |
| Markdown table      | DOCX table                 |
| `---`               | Horizontal separator       |
| `[link](url)`       | Hyperlink text             |
| Image               | Future support             |

---

## 11. MVP Supported Markdown

The first version should support:

```text
Heading 1 to Heading 6
Paragraph
Bold
Italic
Inline code
Code block
Bullet list
Numbered list
Blockquote
Horizontal rule
Basic table
Links
```

---

## 12. Future Supported Markdown

Future versions may support:

```text
Images
Nested lists
Nested blockquotes
Task lists
Footnotes
Table of contents
Page breaks
Header and footer
Page number
Custom Word template
Company logo
Cover page
Metadata
Front matter
```

---

## 13. Export Rules

### 13.1 Heading Rules

Markdown headings should map to Word heading levels.

```md
# Title
## Section
### Subsection
```

Should become:

```text
Heading 1
Heading 2
Heading 3
```

The heading hierarchy should be preserved.

---

### 13.2 Paragraph Rules

Normal Markdown text should become Word paragraphs.

Paragraphs should have:

- Consistent font
- Consistent size
- Proper spacing after paragraph
- Editable text

---

### 13.3 Inline Formatting Rules

Markdown inline formatting should be preserved.

Examples:

```md
This is **bold** text.
This is *italic* text.
This is `inline code`.
```

Should become:

```text
Normal text + bold run
Normal text + italic run
Normal text + monospace run
```

---

### 13.4 List Rules

Bullet list:

```md
- Item A
- Item B
```

Should become a Word bullet list.

Numbered list:

```md
1. First
2. Second
```

Should become a Word numbered list.

Nested list support can be added later.

---

### 13.5 Code Block Rules

Markdown code block:

````md
```js
console.log("hello");
```
````

Should become a Word paragraph or block with:

- Monospace font
- Light background shading
- Preserved line breaks
- Optional language label in future version

---

### 13.6 Table Rules

Markdown table:

```md
| Name | Role |
|---|---|
| Wei Jun | Developer |
```

Should become a Word table.

Table export should preserve:

- Header row
- Cell text
- Row count
- Column count
- Basic border
- Basic padding

Complex table layout is not required in MVP.

---

### 13.7 Link Rules

Markdown link:

```md
[OpenAI](https://openai.com)
```

Should become readable link text in Word.

MVP may export link as normal blue underlined text.

Future version may export actual Word hyperlink relationship.

---

### 13.8 Image Rules

Image support is not required for MVP.

Future image support should handle:

- Local uploaded images
- Base64 images
- Image width
- Image height
- Aspect ratio
- Missing image fallback

---

## 14. UI Design

### Main Layout

```text
┌─────────────────────────────────────────────┐
│ Markdown to Word Converter                  │
│ [Upload .md] [Export .docx] [Template ▼]    │
├───────────────────────┬─────────────────────┤
│ Markdown Editor       │ Preview             │
│                       │                     │
│ # Title               │ Title               │
│ Hello **world**       │ Hello world         │
│                       │                     │
└───────────────────────┴─────────────────────┘
```

### UI Sections

1. Top toolbar
2. Markdown editor panel
3. Preview panel
4. Export status area
5. Error message area

---

## 15. Toolbar Actions

The toolbar should include:

```text
Upload .md
Export .docx
Clear
Load Sample
Template Selector
```

### Upload `.md`

Allows user to select a local Markdown file.

### Export `.docx`

Converts current Markdown into Word document and downloads it.

### Clear

Clears the current editor content.

### Load Sample

Loads sample Markdown content for testing.

### Template Selector

Allows user to choose Word output style.

MVP templates:

```text
Default
Business Report
Technical Document
Minimal
```

---

## 16. Error Handling

The app should handle:

- Empty Markdown content
- Invalid file type
- Large file warning
- Export failure
- Unsupported Markdown node
- Browser download failure

Example error messages:

```text
Please enter Markdown content before exporting.
Only .md files are supported.
Export failed. Please try again.
Some Markdown features are not supported yet.
```

---

## 17. Performance Considerations

The app should support normal Markdown files smoothly.

MVP target:

```text
Small document: < 50 KB
Medium document: 50 KB - 500 KB
Large document: 500 KB - 2 MB
```

For large files:

- Debounce preview rendering.
- Avoid re-parsing on every keystroke immediately.
- Show loading status during export.
- Consider web worker in future version.

---

## 18. Security Considerations

Preview rendering should be safe.

Rules:

```text
Do not execute user-provided scripts.
Disable raw HTML by default.
Sanitize rendered HTML if raw HTML is enabled.
Do not automatically fetch remote resources during export.
```

Potential risks:

- XSS from Markdown preview
- Unsafe remote image loading
- Malicious HTML inside Markdown
- Large file memory usage

---

## 19. Accessibility Requirements

The app should be usable with keyboard and screen readers.

Requirements:

- Buttons must have clear labels.
- Editor must be focusable.
- Preview area should have clear heading.
- Error messages should be readable by assistive technology.
- Color contrast should be sufficient.
- Keyboard navigation should work.

---

## 20. Testing Strategy

### Unit Tests

Test converter functions:

```text
convertHeading
convertParagraph
convertInline
convertList
convertTable
convertCodeBlock
```

### Integration Tests

Test full conversion flow:

```text
Markdown input
  ↓
AST parse
  ↓
DOCX generation
  ↓
Blob output
```

### Manual Tests

Open exported `.docx` in:

```text
Microsoft Word
Google Docs
LibreOffice Writer
Apple Pages
```

### Test Documents

Create test Markdown files for:

```text
Basic document
Long document
Lists
Tables
Code blocks
Mixed formatting
Unsupported elements
```

---

## 21. Acceptance Criteria

MVP is complete when:

- User can type Markdown.
- User can preview Markdown.
- User can upload `.md` file.
- User can export `.docx`.
- Exported `.docx` opens in Microsoft Word.
- Headings are preserved.
- Paragraphs are preserved.
- Bold and italic text are preserved.
- Bullet lists are preserved.
- Numbered lists are preserved.
- Code blocks are visually distinguishable.
- Basic tables are exported as Word tables.
- Empty input is handled gracefully.
- Invalid file type is handled gracefully.

---

## 22. Known Limitations

Markdown preview and Word output will not look exactly the same.

Reasons:

- Browser uses HTML/CSS layout.
- Microsoft Word uses Word layout engine.
- DOCX has different spacing and style rules.
- Some Markdown features do not map directly to Word features.

The correct expectation is:

```text
Preview shows content meaning.
DOCX export preserves document structure.
```

Not:

```text
Preview and Word are pixel-perfect identical.
```

---

## 23. Future Roadmap

### Version 1

- Markdown editor
- Live preview
- Basic `.docx` export
- Basic style config

### Version 2

- Table improvements
- Nested list support
- Link support improvement
- Template selector
- Better code block style

### Version 3

- Image support
- Header and footer
- Page number
- Cover page
- Table of contents

### Version 4

- Custom Word template upload
- Enterprise branding
- Batch conversion
- Markdown folder conversion
- API mode
- Desktop app mode

---

## 24. Design Principle

This project should behave like a small document compiler.

```text
Markdown is the source language.
DOCX is the target format.
The converter is the compiler.
```

The most important part of the system is not the UI.

The most important part is:

```text
Markdown AST → DOCX mapping
```

If this layer is clean, the project can grow into a serious document export engine.

---

## 25. Attention Point

Do not build the converter by copying preview HTML directly into Word.

That approach looks easy at first, but it becomes hard to control when handling:

- Tables
- Lists
- Nested formatting
- Code blocks
- Word styles
- Templates
- Page layout

The better long-term approach is:

```text
Markdown
  ↓
AST
  ↓
DOCX object model
  ↓
.docx
```

This gives the project better control, cleaner architecture, and easier future extension.
