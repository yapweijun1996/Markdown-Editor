# Markdown to Word Converter

A client-side Markdown editor with HTML preview, Word `.docx` export, browser-print PDF, local document history and installable PWA support.

[Live site](https://yapweijun1996.github.io/Markdown-Editor/) · [Documentation index](docs/README.md) · [Requirements](SPEC.md) · [Tasks](TASK.md) · [Testing](TESTING.md)

> **Current reliability warning:** the baseline review reproduced an HTML-injection path in custom preview output, unsafe save/share/version transitions and incomplete Word conversion. The current code escapes image-loading and Mermaid-error text interpolation and has a focused regression test, but browser-level hostile-input acceptance and the other reliability risks remain open. Avoid untrusted Markdown/share links and keep independent copies of important work. See [review evidence](docs/REVIEW.md) and [open tasks](TASK.md).

Documentation baseline: source commit `445cc05`, reviewed 2026-09-07 (UTC). Package version is `0.1.0`; historical V1/V2/V3 names refer to feature groups, not current release guarantees. Live deployment was not verified during this review.

## What is implemented

- Markdown textarea, `.md` upload (up to 2 MiB), sample content and live preview.
- Basic editable Word export: headings, text formatting, direct links, lists, tables, code and paragraph blockquotes. Some nested/inline content is currently omitted; see [syntax coverage](SPEC.md#4-markdownoutput-contract-at-this-baseline).
- Four built-in Word templates, per-document page settings, cover and TOC generation code. Landscape/cover behavior has known defects; Office field compatibility needs testing.
- Image paste/drop/picker with local Blob storage and standalone-image DOCX embedding. Image reload, ownership and format limitations remain.
- KaTeX preview and Mermaid SVG preview/PNG Word export attempt. Word math is not rendered as equations or images.
- PDF through the browser print dialog, using the HTML preview and separate print CSS, not Word layout settings.
- Sequential conversion of multiple selected/dropped `.md` **files** into a DOCX ZIP. Folder traversal is not implemented.
- Compressed-text share links, QR canvas/PNG download and opt-in TinyURL shortening.
- Draft/history/snapshot storage, search, document pin/rename/delete and text-only history ZIP export.
- Responsive mobile tabs/sheets, light/dark/system themes, editor and presentation preferences.
- Read mode with zoom/width-lock/scroll toolbar controls; desktop presentation laser with configurable color/size/trail/fullscreen.
- Generated PWA manifest/service worker and update prompt. Offline use depends on successful cache installation and browser storage retention.

## Important limitations

- **Save is not guaranteed:** draft/history/snapshots use inactivity debounces, not fixed periodic checkpoints. Switching documents or auto-reloading for a PWA update does not first flush pending changes. Read mode pauses saving.
- **Share/save identity is partially hardened:** a shared session now pauses local persistence and Edit creates a new local document before autosave resumes. Pending saves still do not flush across transitions, and browser/failure acceptance remains pending (T02–T04).
- **No complete backup:** history ZIP and share URLs contain text, not local `mdimg://` image bytes or document layout. There is no archive import. Clearing/evicting browser site data may delete all stored work.
- **Desktop action gap:** Layout, Batch Convert and Insert Image picker are wired only into the mobile More menu. Image paste/drop still has editor handlers. These features need desktop entry points (T11).
- **Preview is not authorization:** recipients can edit/export shared content. Compression is not encryption, URLs/QR have practical capacity limits, and TinyURL receives the entire content-bearing URL.
- **No claim of comprehensive validation:** a small `node:test` suite and CI test/build gate now exist, but there is no browser/component/IndexedDB E2E suite, measured Lighthouse report or recorded full browser/Office acceptance. The sample's illustrative coverage percentages are not real test coverage.

## Getting started

```sh
npm ci
npm run dev

# Production build and local preview
npm run build
npm run preview
```

The Vite base path is `/Markdown-Editor/`; use the URL printed by Vite with that path. PWA is disabled under the development server, so test service-worker behavior against the production build.

CI currently uses Node 20; no `engines` field or Node-version file is committed. The review build ran on Node 25.2.1/npm 11.6.2 on Windows. A supported/pinned CI/local toolchain policy is pending T16. Exact packages and security-audit caveats: [Dependencies](docs/DEPENDENCIES.md).

`dev`, `test`, `build` and `preview` scripts exist. The current `npm test` command covers pure JavaScript contracts only; lint, type-check, browser E2E and Office validation remain T17 work.

## Modes

| Mode | Controls and behavior |
|---|---|
| Edit | Side-by-side editor/preview on desktop; Editor/Preview tabs below 768 px |
| Read | Editor hidden; 820 px base maximum reading column, zoom 70–300%, width lock on by default; toolbar hides on scroll down and returns on scroll up |
| Shared preview | Same Read layout with `PREVIEW` badge; Edit and Word export remain available |
| Presentation | Desktop Read action; mouse-following colored laser, optional trail/fullscreen; Escape or Exit leaves it |
| Installed PWA | Standalone window where supported; local data is still browser-owned |

Read mode is not browser fullscreen. Presentation optionally requests the Fullscreen API. Zoom/width settings persist independently of editor preferences. Settings reset currently affects only the editor/draft/presentation preference object, not theme/share/read keys.

## Local data and privacy

- IndexedDB `markdown-editor-db` version 2 stores documents, snapshots and image Blobs.
- localStorage holds editor/draft/presentation preferences, theme, read controls, share preference, current document ID and one draft.
- Default draft delay is 3 seconds, document delay 8 seconds, snapshot delay 30 seconds, all trailing debounces. Snapshot retention is 50 per document; snapshot pinning does not exist.
- No backend, authentication, cloud sync, encryption or telemetry integration is implemented.
- A URL fragment is not sent as part of the ordinary page HTTP request, but page JavaScript and anyone receiving the URL can read it. Opting into TinyURL sends the full encoded link to a third party. Remote preview images and clicked links can make network requests.

[Architecture and schema](DESIGN.md) explain ownership, startup recovery, known races and storage limitations. Do not clear site data to troubleshoot before independently preserving important text/assets.

## Project structure

```text
src/
  App.jsx, main.jsx       root state/orchestration and React entry
  editor/                 text/file/image input
  preview/                HTML, math, diagrams, read controls, laser
  parser/, converter/     remark AST -> DOCX, images, layout, cover, TOC
  download/               Word download and browser print
  images/, history/       IndexedDB repositories, cache, hooks and UI
  preferences/, theme/    local settings and appearance
  components/             More menu and Document Layout sheet
  batch/, share/, pwa/     conversion queue, link/QR/shortener, updates
  styles/                 theme/app/print CSS and built-in Word templates
```

Most converters read `src/styles/templates/`; `wordStyleConfig.js` still duplicates baseline values and is not a universal SSOT. Preview and export currently use separate parsers. Consolidation is proposed, not already complete.

## Deployment and offline behavior

`.github/workflows/deploy.yml` runs npm ci, the Node contract suite and the Vite build on pull requests and pushes to `main`; only main pushes upload the Pages artifact and deploy to GitHub Pages. Browser/storage/Office acceptance, lint and type checks remain outside CI.

Workbox precaches generated assets, including lazy-loaded libraries. Lazy execution does not mean those bytes are never downloaded in the background. UpdatePrompt explicitly checks for updates hourly and starts a 30-second reload countdown once an update is detected; it does not guarantee discovery within 30 seconds of deployment. Saving before reload is not coordinated yet.

## Development direction

1. **Safety first:** automated regression harness, safe preview, durable saves and correct share/restore identity.
2. **Then correctness:** complete asset backups, recursive DOCX fidelity, math/layout/print fixes and action parity.
3. **Then optimization/extensions:** measured performance, configuration consolidation and separately scoped future features.

See [ROADMAP.md](ROADMAP.md) for gates and [TASK.md](TASK.md) for dependencies, acceptance criteria and current status. Documentation maintenance is complete; application remediation remains open.

## License

The previous README advertised MIT, but this repository has no tracked LICENSE file. The owner must confirm and add the authoritative license (T21); this documentation update does not select a license. Third-party dependencies retain their own licenses.
