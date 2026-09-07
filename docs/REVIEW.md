# Review evidence — source baseline and documentation reconciliation

Reviewed: **2026-09-07 (UTC)**. Historical documentation baseline: **`445cc05bcbc69647c3d08eb17edcd2d2da5ee56a`**. Current implementation baseline: **`edd7906`**. Package: `markdown-editor@0.1.0`.

This is a point-in-time evidence record, not a declaration that the application is safe or fully tested. [TASK](../TASK.md) owns current remediation status. [TESTING](../TESTING.md) owns acceptance procedures.

Follow-up verification on **2026-09-07 (UTC)** re-ran the production build and direct dependency listing from the same source baseline. The build still passes. A fresh audit request could not reach the npm advisory endpoint in this environment, so the audit counts below remain the earlier time-stamped snapshot rather than a current advisory result.

## 1. Scope and environment

Inspected root documentation, source modules, package/lockfile, Vite/PWA config and Pages workflow. Followed document/save/share/restore/image dependencies and examined generated DOCX XML. Latest source includes Read/presentation and laser saturation changes.

Local environment: Windows, Node **25.2.1**, npm **11.6.2**. Existing CI config uses Node 20; parity was not tested. The documentation-only reconciliation itself did not change application source, package/lockfile or CI; later follow-up commits are recorded below. Dependency installation and build created local ignored artifacts.

No external KB sync was performed. Browser/Office execution was not completed: the local Vite/static servers were blocked by the managed environment (config/parent-directory access and socket permission), and the browser tool rejected the built `file://` URL by policy. There was no live-site or actual browser/Office result, so static findings and isolated probes must not be described as browser-reproduced bugs.

## 2. Commands/results observed

| Check | Result | Interpretation |
|---|---|---|
| `git status --short` before documentation edits | Clean | No pre-existing tracked changes at review baseline |
| `npm ci --ignore-scripts --no-audit --no-fund` | Completed; 635 packages installed | Local inspection install; does not change CI's npm ci behavior |
| `npm ls --depth=0` | Resolved direct packages listed successfully | Versions captured in DEPENDENCIES.md |
| `npm test` at the review baseline | Passed; 12 Node built-in contract tests | Historical pure-contract baseline; not browser, storage or Office validation |
| `npm run build` | Passed; Vite 6.4.2 and PWA 1.2.0 generated dist | Build only, not user-flow validation |
| `npm audit --json` | 19 affected-package vulnerability entries: 12 high, 6 moderate, 1 low, 0 critical | Includes transitive/build chains; exposure still requires triage |
| Follow-up `npm.cmd run build` | Passed again; the same production chunks and PWA output were generated | Confirms source/build reproducibility in the current Windows workspace |
| Follow-up `npm.cmd test` | Passed; 23 Node built-in contract tests | Adds save timing, image ownership, local-image share warning, backup manifest/reference, DOCX XML/media and math HTML-boundary contracts; still not browser, storage or Office validation |
| Latest follow-up `npm.cmd test` | Passed; 25 Node built-in contract tests | Adds page/layout/print-readiness contracts for orientation, cover/TOC settings and delayed print state; still not browser, storage or Office validation |
| Current working-tree `npm.cmd test` | Passed; 35 Node built-in contract tests | Adds preference normalization/theme mode, document metadata, batch identity/cancellation, resource/image boundaries and shortener cancellation contracts; still not browser, storage or Office validation |
| Current working-tree `npm.cmd run build` | Passed; Vite 6.4.2, 2250 transformed modules and 69 PWA precache entries / 4566.89 KiB | Confirms current source compiles; existing Mermaid chunk warning remains under T18 |
| Current working-tree `git diff --check` | Passed; only CRLF normalization warnings | No whitespace error detected in the current source/docs diff |
| Current browser acceptance attempt | Blocked before app load | Local server startup was denied by the managed environment and direct `file://` navigation was rejected by browser URL policy; T01/T11–T15 browser evidence remains pending |
| Current local Git commit | Blocked before commit creation | The managed workspace denied creation of `.git/index.lock`; no commit or push is claimed |
| Follow-up `npm.cmd audit --json` | Not completed; npm advisory endpoint request failed | Do not reinterpret the earlier audit snapshot as a fresh security result |
| Isolated preview rule evaluation | Raw injected `<img ... onerror=...>` retained in generated placeholder HTML | Confirms unsafe string construction, not browser execution |
| DOCX XML probe | Strike/nested-code/quoted-heading/inline-image preservation checks false | Concrete export fidelity omissions |
| Layout XML probe | A4 landscape encoded as 11906×16838 plus landscape flag | Dimensions are portrait-shaped due to double swap |
| Cover XML probe | No `w:titlePg` setting | No different-first-page section handling; source also uses one section |
| Math postprocessor probe | Code content `$x$` transformed into KaTeX markup | Structure-unaware HTML replacement affects code |

The audit is time-dependent; do not expect these exact counts after registry/advisory changes. Its nonzero exit status is expected when advisories exist. No dependency upgrades were performed.

### Build artifact snapshot

Selected emitted sizes from the production build (Vite reports decimal kB):

| Asset/group | Size | gzip |
|---|---:|---:|
| App index JS | 79.42 kB | 24.11 kB |
| React vendor | 143.57 kB | 45.98 kB |
| markdown-it vendor | 103.18 kB | 46.07 kB |
| DOCX vendor | 366.88 kB | 106.32 kB |
| Mermaid vendor | 2,746.50 kB | 745.68 kB |
| KaTeX vendor JS | 259.26 kB | 77.06 kB |
| JSZip vendor | 97.54 kB | 30.33 kB |
| Remark vendor | 110.90 kB | 32.42 kB |

Build warned that a chunk exceeds the configured 600 kB threshold. Workbox generated **69 precache entries / 4537.39 KiB**. Precache includes lazy-library assets. These are build artifact sizes, **not** first-paint, time-to-interactive, browser transfer or Lighthouse measurements. Hashed filenames are intentionally omitted because they are build-specific.

## 3. Isolated reproduction script

Run from repository root after dependency installation using a shell that supports heredocs (for example Git Bash). It reads current renderer code, stubs only image-cache resolution, generates DOCX without browser-only image/diagram content, and invokes the math postprocessor with loaded KaTeX instead of its CSS import. It does **not** mount React, open a browser or exercise IndexedDB.

```sh
node --input-type=module <<'NODE'
import fs from 'node:fs';
import MarkdownIt from 'markdown-it';
import JSZip from 'jszip';
import { markdownToDocx } from './src/converter/markdownToDocx.js';
import katex from 'katex';

const read = p => fs.readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const source = read('src/preview/MarkdownPreview.jsx');
const rule = source.match(/md\.renderer\.rules\.image = ([\s\S]*?)\n}\n/)[1] + '\n}';
const md = new MarkdownIt({ html: false });
md.renderer.rules.image = new Function(
  'isInternalImageUri', 'imageIdFromUri', 'getObjectUrl', 'ensureLoaded',
  'return (' + rule + ')'
)(s => s?.startsWith('mdimg://'), s => s.slice(8), () => null,
  () => Promise.resolve(null));
console.log('UNESCAPED_IMAGE_FALLBACK', md.render(
  '![<img src=x onerror=alert(1)>](mdimg://missing)'
).includes('<img src=x onerror=alert(1)>'));

const input = '~~deleted~~\n\n- item\n\n  ```js\n  UNIQUE_NESTED_CODE\n  ```\n\n> # UNIQUE_QUOTED_HEADING\n\ntext ![INLINE_IMAGE](mdimg://missing) end';
const blob = await markdownToDocx(input, {
  layout: {
    pageSize: 'a4', orientation: 'landscape', header: 'HEADER',
    coverPage: { enabled: true, title: 'COVER' }
  }
});
const zip = await JSZip.loadAsync(await blob.arrayBuffer());
const xml = await zip.file('word/document.xml').async('string');
for (const [key, token] of [
  ['STRIKE', '<w:strike'], ['NESTED_CODE', 'UNIQUE_NESTED_CODE'],
  ['QUOTED_HEADING', 'UNIQUE_QUOTED_HEADING'], ['INLINE_IMAGE', 'INLINE_IMAGE']
]) console.log(key + '_PRESERVED', xml.includes(token));
console.log('PAGE_SIZE', xml.match(/<w:pgSz\b[^>]+>/)?.[0]);
console.log('DIFFERENT_FIRST_PAGE', xml.includes('<w:titlePg'));

const math = read('src/preview/mathRenderer.js');
const renderer = new Function('loadKatex',
  math.slice(math.indexOf('const HAS_MATH_RE')).replaceAll('export ', '') +
  '\nreturn renderMathInHtml;'
)(() => Promise.resolve(katex));
console.log('CODE_MATH_REWRITTEN',
  (await renderer('<pre><code>$x$</code></pre>')).includes('class="katex"'));
NODE
```

Baseline output:

```text
UNESCAPED_IMAGE_FALLBACK true
STRIKE_PRESERVED false
NESTED_CODE_PRESERVED false
QUOTED_HEADING_PRESERVED false
INLINE_IMAGE_PRESERVED false
PAGE_SIZE <w:pgSz w:w="11906" w:h="16838" w:orient="landscape"/>
DIFFERENT_FIRST_PAGE false
CODE_MATH_REWRITTEN true
```

These are **defect-detection results**, not successful acceptance outcomes. The exploratory extraction depends on current source shape; T17 should replace it with maintained module/component tests rather than treating regex extraction as a permanent test API. Node emitted a localStorage-related runtime warning during DOCX import; browser compatibility was not inferred from that run.

## 4. Static findings and dependencies

The following were traced in source but not executed as complete browser workflows:

| Task | Finding | Primary evidence |
|---|---|---|
| T01 | Baseline custom preview interpolation could execute HTML; current image-placeholder and Mermaid-error text paths use `escapeHtml`, but browser hostile-input acceptance remains pending | `src/preview/MarkdownPreview.jsx`, `src/preview/mermaidRenderer.js`, `src/preview/htmlEscape.js`, `test/htmlEscape.test.js` |
| T02 | Baseline trailing saves could be postponed indefinitely and transitions did not flush; current hook serializes writes, bounds delay, persists empty existing docs, exposes errors and flushes transition/PWA paths, but IndexedDB failure/multi-tab evidence remains | `src/history/useHistory.js`, `src/history/savePolicy.js`, `src/App.jsx`, `src/pwa/UpdatePrompt.jsx` |
| T03 | Baseline restore callback closed over the previous document identity; current callback passes the selected target ID and forces a recovery snapshot before persistence, but IndexedDB failure/atomicity evidence remains | `src/history/HistoryPanel.jsx`, `src/history/useHistory.js`, `src/history/VersionsView.jsx` |
| T04 | Baseline share Edit resumed autosave with the old local ID; current `sharedSession` pauses local persistence and forks on Edit/hash removal, but browser transition and pending-save acceptance remain | `src/App.jsx`, `src/history/useHistory.js` |
| T05 | Baseline snapshot filter compared length difference and forced recovery used the same filter; current code records changed content, supports forced recovery and keeps insertion/eviction in one transaction, but persistence/failure tests remain | `src/history/snapshotRepo.js`, `useHistory.js`, `test/snapshot.test.js` |
| T06 | Baseline preview memo excluded cache revision and orphan attachment was unused; current preview subscribes to cache load/error revisions and local hooks attach only orphan records without reparenting owned assets, but eviction/deletion/reference tests remain | `src/preview/MarkdownPreview.jsx`, `src/images/useImages.js`, `src/images/imageCache.js`, `src/images/imageRepo.js`, `test/imageOwnership.test.js` |
| T07 | Baseline archives/shares omitted assets and metadata, had no importer and allowed snapshot path collisions; current code has a versioned asset-bearing import/export path with ID remapping and text-only share warnings, but browser/IndexedDB round-trip and failure evidence remain | `src/history/exportHistory.js`, `src/share/shareLink.js`, `src/history/HistoryPanel.jsx`, `test/backupManifest.test.js` |
| T08 | Baseline list/block/inline conversion dropped nested blocks, inline images and deletion formatting; current converter preserves the focused recursive/inline cases, emits unsupported block fallbacks and has XML/media contract tests, while reader/browser acceptance remains | `src/converter/`, `test/docx.test.js` |
| T09 | Baseline regex math processed arbitrary HTML; current math scans text nodes and skips code/attributes, while math/Mermaid browser readiness, rapid-edit and accessibility acceptance remain | `src/preview/mathRenderer.js`, `src/preview/mermaidRenderer.js`, `src/preview/MarkdownPreview.jsx`, `test/mathRenderer.test.js` |
| T10 | Baseline app/docx double-swap, missing first-page cover rule and fixed PDF delay are corrected in `d946eab`; current XML/print contracts still need reader/browser evidence | `pageLayout.js`, `markdownToDocx.js`, `coverPage.js`, `downloadPdf.js`, `test/layoutPrint.test.js` |
| T11 | Layout/batch/image-picker actions remain in the shared More registry; the overflow trigger is now visible across Edit-mode viewport sizes, while browser keyboard/focus acceptance remains | `src/App.jsx`, `src/components/MoreMenu.jsx` |
| T12 | Current code shares theme state, validates persisted preference values, handles theme storage events, defines reset scope, preserves manual titles and serializes per-document mutations; browser/concurrency acceptance remains | `src/preferences/storage.js`, `src/theme/useTheme.js`, `src/history/documentRepo.js`, `test/preferences.test.js`, `test/documentMetadata.test.js` |
| T13 | Current code assigns stable batch IDs, freezes a processing copy, bounds file/total counts, keys progress/errors by ID, retries failed entries and supports cancellation; browser edge acceptance remains | `src/batch/BatchConvertSheet.jsx`, `src/batch/batchProcess.js`, `test/batchProcess.test.js` |
| T14 | Current code centralizes share/image/diagram/batch limits, normalizes supported image types, rejects active SVG, bounds QR/share work and adds cancellable/stale-safe TinyURL requests; browser large-input/decode acceptance remains | `src/limits/resourceLimits.js`, `src/share/`, `src/images/`, `src/preview/mermaidRenderer.js`, tests |
| T15 | Current code uses a shared modal focus/Tab/Escape/return hook, removes the nested rename control and suppresses laser canvas animation under reduced motion; browser assistive-technology/contrast/touch-target acceptance remains | `src/accessibility/useModalA11y.js`, modal components, `HistoryPanel.jsx`, `LaserPointer.jsx` |
| T17 | Node contract suite and test/build PR gate now exist; the current committed run passes 35 tests; component/storage/E2E/lint/type checks remain absent | `package.json`, `test/`, workflow and tracked file inventory |
| T18 | Full synchronous preview, getAll history and broad precache; no browser profiling evidence | Preview/history/Vite config |
| T19 | Root orchestration and sample/icons combined; duplicate config/settings controls | App/styles/components |
| T21 | MIT badge previously existed but no tracked license file | Original README and git file inventory |

Missing original-plan features (custom templates, Word math, gallery, directory traversal, Web Share/swipe/haptics, preferences import/export, clear-history control, cloud/API/plugin systems) were not reclassified as implementation blockers. They are deferred unless promoted through a defined requirement/task.

## 5. Documentation reconciliation completed (T20)

- Replaced stale MVP architecture and blanket V2/V3 completion/planning claims with current implementation matrices and explicit limits.
- Added SPEC, ROADMAP and TASK with requirement IDs, stable task IDs, dependencies, gates, acceptance and deferred scope.
- Updated README/TESTING and added this docs index, decision log and dependency inventory.
- Corrected schema v2, mdimg references, trailing save timing, snapshot pin/filter behavior, batch files-only scope, TinyURL cutoff direction, preview permissions, math/PDF/template scope and Read/presentation behavior.
- Removed unverified coverage/Lighthouse/performance/deployment claims and an unsupported project-license badge; recorded the license decision as pending.
- At the documentation baseline, added a twelve-test Node contract layer and made test/build verification run for pull requests and main pushes; richer application coverage remains T17.
- The documentation-only baseline did not fix an application defect; subsequent implementation work is tracked separately below.

Final local documentation validation passed at the documentation baseline:

- 13 Markdown files inspected (12 updated/created documents plus unchanged CLAUDE.md).
- 62 local links/anchors, 64 literal source-path references, 21 task IDs and 18 requirement IDs checked.
- All 19 direct dependency ranges/resolved versions matched package.json/package-lock.json.
- The reproduction script extracted directly from this document produced exactly the recorded baseline output.
- Production build rerun passed with the same reported artifact sizes/precache count and existing Mermaid chunk warning.
- `git diff --check` passed; source, package/lockfile, Vite config, CI and contributor instructions remain unchanged.

These are local consistency checks, not an installed CI documentation gate. The application hardening/test harness remains open.

## 5a. Follow-up implementation evidence (T17/T01–T15)

- T17 added `npm test`, now covering thirty-five Node built-in contract tests, and a pull-request/main-push test/build gate.
- T01 now escapes image-loading alt text and Mermaid error text through `src/preview/htmlEscape.js`; the focused escaping regression test passes.
- T02–T05 now have bounded/serialized save and transition code, explicit shared-session fork behavior, target-ID restoration and content-aware/forced snapshot policy; browser and persistence acceptance remains pending.
- `npm test`, `npm run build` and `git diff --check` pass locally. The build still reports the existing large Mermaid chunk warning; this is tracked under T18.
- T06 now has reactive cache/error rendering, orphan-only attachment and pure ownership coverage; eviction and full asset lifecycle acceptance remain pending.
- T07 now exports/imports a versioned `markdown-editor-backup` v1 manifest with document metadata/layout, snapshots and image assets. Imports validate archive paths/limits/references, remap IDs to avoid collisions and write all three stores transactionally; text-only share URLs warn about local images without uploading them. Pure manifest/reference tests pass, while disposable-profile browser/IndexedDB round-trip and failure evidence remain pending.
- T08 now awaits recursive DOCX block/inline conversion, preserves focused list/quote/strike/image/table contracts and makes unsupported block nodes explicit. `test/docx.test.js` unzips the generated package and passes XML/media assertions; Word/LibreOffice and browser-only image acceptance remain pending.
- T09 now ignores code/attributes during math HTML processing, handles KaTeX load failure through base-HTML fallback, and guards Mermaid hydration against stale/cancelled containers. `test/mathRenderer.test.js` passes; browser rapid-edit, diagram and accessibility acceptance remains pending.
- T10 now uses one page-size mapping with explicit margins, emits correct portrait/landscape XML, derives DOCX image width from writable page dimensions, defines first-page cover header/footer behavior, requests TOC field updates, and waits for preview/fonts/images/layout readiness before browser print. `test/layoutPrint.test.js` passes; Word/LibreOffice and browser print/pagination acceptance remains pending.
- The latest follow-up production build passed with 2250 transformed modules and 69 PWA precache entries (4566.89 KiB in this run); the existing large Mermaid chunk warning remains tracked under T18.
- T12 now validates preference values, shares theme state, consumes theme storage events, defines Settings reset scope, preserves manual document titles and queues document mutations; pure preference/metadata contracts pass, while browser/IndexedDB concurrency evidence remains pending.
- T13 now uses stable batch IDs, immutable processing snapshots, unique output names, bounded file/total input, failed-entry retry and cancellation; pure identity/cancellation coverage passes, while browser queue evidence remains pending.
- T14 now rejects oversized share/image/diagram/batch inputs, limits QR use, normalizes supported image formats, rejects active SVG content, hardens copy and adds abortable/stale-safe shortener requests; browser large-input/decode evidence remains pending.
- T15 now provides shared modal focus/Tab/Escape/return behavior, accessible dialog/menu labels, non-nested rename editing and reduced-motion laser-trail suppression; browser screen-reader/contrast/touch-target evidence remains pending.
- Browser DOM/security fixtures, storage/persistence tests, Office/print validation, lint/type checks and dependency triage remain incomplete; T02/T05/T06/T07/T09/T10/T11/T12/T13/T14/T15 still need browser, fake-IndexedDB or reader evidence as specified in TESTING.

## 6. Remaining evidence gaps and next step

No end-to-end browser reproduction, real storage-failure injection, actual PWA install/update, Office/print visual validation, accessibility certification, first-paint/profile or live deployment check was performed. These are pending acceptance under TESTING, not assumed passes.

Recommended next implementation: run T10's disposable browser/Office reader checks for layout, TOC and print readiness, then run T07's disposable-profile backup round trip and failure cases alongside T01 browser/security, T04 transition and T05 persistence acceptance. Preserve user data before exercising destructive paths, and record commit-specific evidence before changing task status.
