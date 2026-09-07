# Dependencies and tooling

Baseline: `b691ca6` · inspected 2026-09-07 (UTC).

`package.json` is authoritative for declared ranges; `package-lock.json` is authoritative for resolved versions. The following snapshot was checked using `npm ls --depth=0` and a successful production build on 2026-09-07 (UTC). It is not an upgrade proposal or claim that installed versions have no advisories.

## Runtime dependencies

| Package | Declared | Resolved | Role |
|---|---|---|---|
| react | ^18.3.1 | 18.3.1 | UI/hooks |
| react-dom | ^18.3.1 | 18.3.1 | Browser root rendering |
| markdown-it | ^14.1.0 | 14.1.1 | HTML preview |
| unified | ^11.0.5 | 11.0.5 | Export parsing pipeline |
| remark-parse | ^11.0.0 | 11.0.0 | Markdown AST |
| remark-gfm | ^4.0.1 | 4.0.1 | GFM parsing support; converter support remains partial |
| docx | ^9.5.0 | 9.6.1 | Word object model and ZIP packing |
| file-saver | ^2.0.5 | 2.0.5 | DOCX/history/batch downloads |
| idb | ^8.0.3 | 8.0.3 | IndexedDB Promise API |
| nanoid | ^5.1.9 | 5.1.9 | Document/snapshot/image identifiers |
| jszip | ^3.10.1 | 3.10.1 | History and batch archives |
| lz-string | ^1.5.0 | 1.5.0 | Share-text compression |
| katex | ^0.16.45 | 0.16.45 | Preview math HTML/CSS |
| mermaid | ^11.14.0 | 11.14.0 | Diagram SVG; rasterized for DOCX |
| qrcode | ^1.5.4 | 1.5.4 | Share QR canvas/PNG |

## Development dependencies

| Package | Declared | Resolved | Role |
|---|---|---|---|
| @vitejs/plugin-react | ^4.3.4 | 4.7.0 | React transform |
| vite | ^6.3.3 | 6.4.2 | Development/build/preview |
| vite-plugin-pwa | ^1.2.0 | 1.2.0 | Virtual registration, manifest and Workbox generation |
| @vite-pwa/assets-generator | ^1.0.2 | 1.0.2 | PWA icon generation tooling; configuration in pwa-assets.config.js |

Workbox, DOMPurify (through diagram dependencies), linkify-it, Rollup and other packages are transitive, not direct application dependencies. Inventory them with npm rather than assuming direct ownership.

## Loading and environmental dependencies

- Initial application imports React, markdown-it, local DB/share utilities and modal component modules.
- DOCX/remark load through the export import; JSZip through archive operations; KaTeX JS/CSS when math is detected; Mermaid when diagrams are requested; qrcode when QR is shown.
- `manualChunks` partitions selected libraries. Workbox precaches matching emitted assets, including lazy chunks; these loading statements concern execution/import triggers, not a guarantee about network timing.
- Image and Mermaid export require DOM/Image/canvas/Blob/browser APIs. Simple text DOCX generation can run under Node, but that is not a supported complete headless API.
- IndexedDB/localStorage, clipboard/file APIs, print, service workers and optional Fullscreen API vary by browser. No compatibility polyfill or supported-version matrix has been verified.
- TinyURL is an optional external service, not an npm dependency or local backend. Network availability, response format, privacy and service limits must be considered.

## Scripts and CI

Only these scripts are configured:

```sh
npm run dev       # vite
npm test          # node --test "test/*.test.js"
npm run build     # vite build (includes PWA generation)
npm run preview   # vite preview
```

Use `npm ci` for lockfile-based installs. The review used `npm ci --ignore-scripts --no-audit --no-fund` followed by an explicit build and audit; this was a local inspection choice, not a change to CI's installation policy.

Deployment uses Node 20 through setup-node. Pull requests and main pushes now run `npm ci`, `npm test` and `npm run build`; only main pushes upload/deploy the Pages artifact. No engines field, Node-version file, lint/type-check script or browser test dependency exists. Review environment: Windows, Node 25.2.1, npm 11.6.2. Do not mistake this environment difference for a validated compatibility matrix; T16/T17 own a supported/pinned toolchain policy.

## Security audit snapshot

The review-time `npm audit --json` reported:

| Severity | Affected-package count |
|---|---:|
| Critical | 0 |
| High | 12 |
| Moderate | 6 |
| Low | 1 |
| Total | 19 |

These counts include transitive and build-tool chains; npm may count parent packages because of vulnerable descendants. They are **not** 19 proven application exploit paths. Advisory data changes independently of the repository, so rerun the audit before upgrades or release decisions.

Relevant runtime chains include markdown-it/linkify-it, Mermaid/DOMPurify and nanoid; build chains include Vite, Babel/PostCSS and PWA/Workbox/assets tooling. Applicability depends on used APIs, input paths and advisory conditions. T01's reproduced raw-HTML injection was application code and required an independent fix; the current custom text paths are escaped, while browser-level acceptance remains open.

Some suggested remediations span major versions (the review output even suggested a PWA downgrade for a transitive chain). Do not blindly run `npm audit fix --force`. T16 requires exposure triage, compatible upgrades, lockfile changes and regression/build/PWA evidence, or explicit risk acceptance.

Useful inspection commands:

```sh
npm ls --depth=0
npm audit
npm audit --omit=dev
npm audit --json
```

Audit commands can exit nonzero when advisories exist. The full audit ran in the original review snapshot; a follow-up `npm.cmd audit --json` attempt on 2026-09-07 could not reach npm's advisory endpoint. Production-only audit is still a recommended follow-up, not a recorded result. Treat the counts above as dated evidence, not current registry truth.

## Not installed

No TypeScript, ESLint, Vitest, Jest, React Testing Library, fake-indexeddb or Playwright setup is committed. The repository uses Node's built-in `node:test` for a small pure-logic suite; Vitest/RTL/fake-indexeddb/Playwright are candidates for T17, not current dependencies.

No remark-math, markdown-it-katex, mammoth, pdf-lib, jsPDF or html2canvas exists in package.json. Custom Word template extraction, Word math and programmatic PDF must not be documented as delivered because they appeared in historical plans.

## License and dependency maintenance

Third-party package licenses remain their own. The project-level license requires owner confirmation because no tracked LICENSE file exists (T21).

When dependencies change: update the lockfile, rerun build/security/behavior checks, refresh this snapshot and [REVIEW](REVIEW.md), and document actual loading/cache effects rather than copying old bundle claims.
