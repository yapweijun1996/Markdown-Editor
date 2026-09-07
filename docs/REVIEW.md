# Review evidence — source baseline and documentation reconciliation

Reviewed: **2026-09-07 (UTC)**. Source commit: **`445cc05bcbc69647c3d08eb17edcd2d2da5ee56a`**. Package: `markdown-editor@0.1.0`.

This is a point-in-time evidence record, not a declaration that the application is safe or fully tested. [TASK](../TASK.md) owns current remediation status. [TESTING](../TESTING.md) owns acceptance procedures.

Follow-up verification on **2026-09-07 (UTC)** re-ran the production build and direct dependency listing from the same source baseline. The build still passes. A fresh audit request could not reach the npm advisory endpoint in this environment, so the audit counts below remain the earlier time-stamped snapshot rather than a current advisory result.

## 1. Scope and environment

Inspected root documentation, source modules, package/lockfile, Vite/PWA config and Pages workflow. Followed document/save/share/restore/image dependencies and examined generated DOCX XML. Latest source includes Read/presentation and laser saturation changes.

Local environment: Windows, Node **25.2.1**, npm **11.6.2**. Existing CI config uses Node 20; parity was not tested. No application source, package/lockfile, CI or contributor-instruction changes were made by the documentation reconciliation. Dependency installation and build created local ignored artifacts.

No browser automation/subagent/MCP KB tool was available in this session. No external KB sync was performed. There was no live-site or actual browser/Office execution, so static findings and isolated probes must not be described as browser-reproduced bugs.

## 2. Commands/results observed

| Check | Result | Interpretation |
|---|---|---|
| `git status --short` before documentation edits | Clean | No pre-existing tracked changes at review baseline |
| `npm ci --ignore-scripts --no-audit --no-fund` | Completed; 635 packages installed | Local inspection install; does not change CI's npm ci behavior |
| `npm ls --depth=0` | Resolved direct packages listed successfully | Versions captured in DEPENDENCIES.md |
| `npm test` | Passed; 6 Node built-in contract tests | Pure helpers/parser/share only; not browser, storage or Office validation |
| `npm run build` | Passed; Vite 6.4.2 and PWA 1.2.0 generated dist | Build only, not user-flow validation |
| `npm audit --json` | 19 affected-package vulnerability entries: 12 high, 6 moderate, 1 low, 0 critical | Includes transitive/build chains; exposure still requires triage |
| Follow-up `npm.cmd run build` | Passed again; the same production chunks and PWA output were generated | Confirms source/build reproducibility in the current Windows workspace |
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
| T02 | Trailing saves can be postponed indefinitely; open/new/Read/update do not flush; empty text skipped; newer draft bypassed | `src/history/useHistory.js`, App startup/draft effects, UpdatePrompt |
| T03 | Restore callback after opening another doc closes over previous document identity/content | `src/history/HistoryPanel.jsx`, `useHistory.js` |
| T04 | Share Edit resumes autosave with old local ID; initial/hashchange/editable-share states differ | `src/App.jsx` |
| T05 | Snapshot filter compares length difference, and forced recovery uses the same filter | `src/history/snapshotRepo.js`, `useHistory.js` |
| T06 | Markdown-only memo excludes cache revision; attach callback unused; no cache deletion/eviction | Preview, useImages, imageCache |
| T07 | Archives/shares omit assets and metadata; no importer; snapshot title/timestamp collisions | `src/history/exportHistory.js`, `src/share/shareLink.js` |
| T08 | List/block/inline conversion lacks full recursion and supported-node diagnostics | `src/converter/` |
| T09 | Regex math processes arbitrary HTML; async load/hydration error/readiness incomplete | Preview math/Mermaid modules |
| T10 | App and docx both swap landscape dimensions; cover/body one section; PDF fixed timeout/CSS | `pageLayout.js`, `markdownToDocx.js`, `coverPage.js`, downloadPdf |
| T11 | Layout/batch/image-picker actions exist only in mobile More | `src/App.jsx`, `.show-on-mobile` CSS |
| T12 | Theme hooks independent, reset limited, unvalidated merge, autosave re-derives renamed title, get/put races | Theme/preferences, documentRepo |
| T13 | Batch identity maps use filenames; selection mutable during processing; no traversal | Batch sheet/processor |
| T14 | Typed/shared/batch/image limits incomplete, format normalization gaps, shortener lacks timeout/stale-result guard | File/image/share/batch modules |
| T15 | No common modal focus/escape contract, nested rename input/button, laser ignores reduced-motion preference | Modal components, HistoryPanel, LaserPointer |
| T17 | Minimal Node contract suite and test/build PR gate now exist; component/storage/E2E/lint/type checks remain absent | `package.json`, `test/`, workflow and tracked file inventory |
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
- Added a seven-test Node contract layer and made test/build verification run for pull requests and main pushes; richer application coverage remains T17.
- The documentation-only baseline did not fix an application defect; subsequent implementation work is tracked separately below.

Final local documentation validation passed:

- 13 Markdown files inspected (12 updated/created documents plus unchanged CLAUDE.md).
- 62 local links/anchors, 64 literal source-path references, 21 task IDs and 18 requirement IDs checked.
- All 19 direct dependency ranges/resolved versions matched package.json/package-lock.json.
- The reproduction script extracted directly from this document produced exactly the recorded baseline output.
- Production build rerun passed with the same reported artifact sizes/precache count and existing Mermaid chunk warning.
- `git diff --check` passed; source, package/lockfile, Vite config, CI and contributor instructions remain unchanged.

These are local consistency checks, not an installed CI documentation gate. The application hardening/test harness remains open.

## 5a. Follow-up implementation evidence (T17/T01)

- T17 added `npm test`, seven Node built-in contract tests and a pull-request/main-push test/build gate.
- T01 now escapes image-loading alt text and Mermaid error text through `src/preview/htmlEscape.js`; the focused escaping regression test passes.
- `npm test`, `npm run build` and `git diff --check` pass locally. The build still reports the existing large Mermaid chunk warning; this is tracked under T18.
- Browser DOM/security fixtures, storage/persistence tests, Office validation, lint/type checks and dependency triage remain incomplete.

## 6. Remaining evidence gaps and next step

No end-to-end browser reproduction, real storage-failure injection, actual PWA install/update, Office/print visual validation, accessibility certification, first-paint/profile or live deployment check was performed. These are pending acceptance under TESTING, not assumed passes.

Recommended next implementation: complete T01 browser/security acceptance and continue T16 dependency triage; then fix T02/T05 and T03/T04 using disposable fixtures. Preserve user data before exercising destructive paths, and record new commit-specific evidence before changing task status.
