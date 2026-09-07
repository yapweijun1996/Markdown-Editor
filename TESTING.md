# TESTING — Evidence, regression plan and manual acceptance

Baseline: `445cc05` · reviewed 2026-09-07 (UTC).

**A checklist is not a test report.** All unchecked items below are pending acceptance, not passed checks. Known-broken scenarios intentionally appear as regression requirements. Actual review results and an exploratory reproduction script are in [docs/REVIEW.md](docs/REVIEW.md).

## 1. Current verification infrastructure

- `npm run build` exists and passed in this review.
- A small committed `node:test` suite covers pure DB helpers, Markdown AST parsing, share URL round trips, preview escaping and snapshot policy. It is not a browser, component, IndexedDB or Office suite.
- GitHub Actions now runs `npm test` and `npm run build` on pull requests and main pushes; lint/type-check and richer fixtures remain T17 work. The UI sample's percentage coverage table is illustrative content, not measured coverage.
- No live-site, browser installation/offline update, Lighthouse, real-device, screen-reader or Word/LibreOffice/Google Docs acceptance was performed during the review.

```sh
npm ci
npm test
npm run build
npm run preview
```

Use the `/Markdown-Editor/` base path on the printed local URL. `npm run dev` disables PWA; use production preview for service-worker testing. Match the selected CI/runtime policy when established (T16); current CI is Node 20, while review-time local Node was 25.2.1.

Do **not** run a destructive regression against valuable browser data. Use a disposable profile/origin, synthetic documents and exported copies. Do not paste hostile fixtures into the live site or send private documents through TinyURL.

## 2. Evidence levels

| Level | What it establishes | What it does not establish |
|---|---|---|
| Static source trace | A path/omission/race is visible in the implementation | Actual browser timing or platform reproduction |
| Isolated renderer/XML probe | A specific generated string or DOCX XML has the recorded property | Browser script execution, Office interoperability or complete application behavior |
| Automated unit/component | Tested contract with runner/fixtures | Device/PWA/Word behavior not modeled by that runner |
| Browser E2E/manual | Behavior in named browser/profile/version with recorded steps | Other browsers/devices automatically |
| Office/manual | Named reader renders/updates a file as expected | All readers or all documents |

For every result record commit, environment, command/steps, expected/actual, artifact and linked requirement/task. Keep known failures visible; do not turn defect-detection output into a passing acceptance label.

## 3. Critical regression scenarios (before release)

| Case | Steps with disposable data | Required outcome after fix | Task |
|---|---|---|---|
| Preview injection | Render an internal-image reference with HTML-like alt text before its asset loads | Unit escaping contract passes; browser DOM still must prove text remains inert with no executable injected node/attribute | T01 |
| Continuous typing | Type longer than all configured debounce intervals without pausing | Content checkpoint occurs within the defined maximum wait | T02 |
| Transition flush | Edit A; immediately open B, create New, upload, load Sample or enter Read | Current handlers await the save barrier; browser/persistence failure fixtures still required | T02 |
| Empty content | Save A, select all/delete, wait, reload | Existing document intentionally persists empty content, not the old text | T02 |
| Draft freshness | Make recovery draft newer than the stored current doc; reload | Newer recovery content is offered after load, not silently ignored/overwritten | T02 |
| Stale current ID | Remember a deleted document with a recoverable draft; reload | Missing ID is cleared/recovered and draft fallback works | T02 |
| PWA update | Make unsaved edits; trigger waiting SW and countdown/Reload Now | Flush completes before activation, or failure leaves reload paused | T02 |
| Storage failure | Inject quota/open/put failure | Visible recoverable error; destructive transition is not silently allowed | T02 |
| Restore B while viewing A | Open B's timeline from History without selecting B, restore a version | Only B changes; B's previous content is backed up | T03 |
| Shared session | Select local A, open a shared URL, click Edit and save | A stays unchanged; received content has new local identity; current code forks before autosave resumes | T04 |
| Share transitions | Exercise first-load hash/query, later hashchange, hash removal and editable share mode | Isolation and saving policy remain consistent, no permanent paused state; browser acceptance is pending | T04 |
| Equal-length snapshot | Replace content with different same-length text; also make small edits | Unit policy covers both changes; persistence must prove the defined snapshot protection and forced backups | T05 |
| Failed restore backup | Force the recovery-snapshot write to fail | Restore aborts or preserves a documented recovery path; no silent overwrite | T03, T05 |
| Multi-tab | Concurrent edits/metadata changes and DB version upgrade across two tabs | Defined conflict/blocked-upgrade recovery; no silent metadata reversal | T02, T12 |

Known baseline defects are described in TASK and REVIEW. These cases have not been run as browser E2E in this review.

## 4. Automated suite expansion (T17; partially installed)

- **Current:** Node built-in `node:test` runs pure DB helper, Markdown AST, share URL, preview escaping and snapshot-policy tests through `npm test`.
- **Unit/component:** candidate Vitest + React Testing Library; preference/schema/URL limits and renderer fixtures.
- **Persistence:** candidate fake-indexeddb with explicit IDs, delayed/failing transactions, concurrent operations, snapshot retention and image references.
- **DOCX integration:** generate Blob, unzip with JSZip, assert XML text/styles/relationships/page dimensions/media content and unsupported-node warnings. Check semantics, not unstable byte-for-byte ZIP equality.
- **Browser:** candidate Playwright for actual IndexedDB, clipboard/drop workflows where supported, mode transitions, DOM injection safety, PWA update/offline, print readiness and focus.
- **CI:** PR lint/tests/build with retained reports; deploy depends on successful gates. Choose supported browsers/Node versions explicitly.

Each fix must carry a focused regression fixture. Complete browser/Office checks supplement, not replace, these tests. Performance budgets need measurement before numerical gates are selected.

## 5. Authoring and basic Markdown

- [ ] Type/upload a valid `.md`; confirm controlled input and latest preview agree.
- [ ] Reject a wrong extension and a single upload above 2 MiB without losing current text.
- [ ] Test H1–H6, paragraphs, strong/emphasis combinations, inline code, hard breaks, direct/reference links, lists, tables, rules and quotes.
- [ ] Confirm HTTP(S) preview links have target `_blank` and `noopener noreferrer`.
- [ ] Tables/code/long identifiers remain readable at narrow widths; no whole-page overflow.
- [ ] Test Sample/upload/new/clear under the transition policy (T02); current handlers have a save barrier, but browser failure evidence is pending.
- [ ] Deliberately unsupported Markdown produces explicit export warnings/fallbacks after T08, not disappearance.

## 6. DOCX fidelity and layout

- [ ] Assert nested code, quoted headings, inline images and deletion formatting survive; these fail current isolated checks.
- [ ] Include lists starting at values other than 1, separated lists, mixed nesting, six-plus levels, continuation paragraphs, task state and blocks inside items.
- [ ] Test table alignment, nested inline runs, header bold/color/shading and row/column counts in XML and a reader.
- [ ] Exercise all four template IDs; default fallback leaves content unchanged and template typography/spacing applies where promised. Check font substitution on reader machines.
- [ ] Verify A4/Letter/A3 portrait and landscape numeric XML dimensions; current landscape output is incorrect.
- [ ] Check header/footer title/date/page/total expansion and page-number toggle.
- [ ] Check cover values versus placeholders and promised first-page header/footer/page-number policy. Current cover shares the body section and does not suppress header/footer.
- [ ] Test `[TOC]` and HTML TOC placeholders; verify generated XML structure, Word field update, links and actual heading/page numbers. Do not assume fields update automatically on open.
- [ ] Open representative files in Word and LibreOffice, then optionally Google Docs/Apple Pages; record versions, warnings and screenshots.

## 7. Images and complete backups

- [ ] Paste/drop/pick multiple images, including insertion at selected text and while writes are delayed.
- [ ] After T11, verify the picker is reachable on desktop as well as mobile.
- [ ] Test insertion before a document has an ID, then save/reload; ownership is attached and preview loads without editing Markdown.
- [ ] Missing/deleted assets resolve to useful inert placeholders, not perpetual loading or injected HTML.
- [ ] Test PNG/JPEG/GIF/WebP/SVG/BMP, invalid MIME/bytes, very large pixels/bytes, transparent images and downscale behavior. Picker acceptance is not proof of DOCX support.
- [ ] Confirm standalone/inline asset embedding, reader compatibility and page-aware dimensions; compare aspect ratio.
- [ ] Delete a document while another document/snapshot references its image; enforce defined ownership/retention policy.
- [ ] Bound cache growth and revoke only unused object URLs on removal/switches.
- [ ] For current history ZIP, inspect text entries only; do not claim asset/layout recovery or import.
- [ ] After T07, export/import into a fresh profile and compare document IDs/remapping, content, images, settings and snapshots; test duplicate titles/timestamps, corrupt entries, missing assets and oversized archives.

## 8. Math and Mermaid

- [ ] Inline/block math renders only intended tokens; escaped dollars, currency, code fences/inline code, HTML attributes and `<`/`&` formula text are preserved correctly.
- [ ] Invalid LaTeX displays an intelligible error; failed KaTeX JS/CSS load is recoverable.
- [ ] Test current `output: html` accessibility limitation; verify chosen accessible output after T09.
- [ ] Word math remains ordinary parsed text until separately implemented; do not mark equation-image/native-math tests passed.
- [ ] Test valid/invalid Mermaid, several diagrams per document and diagrams with long rendering times.
- [ ] Rapidly edit while imports/renders are pending; newest content must win without stale/duplicate diagrams or orphan DOM.
- [ ] Confirm SVG preview and PNG DOCX rendering in actual browsers, including fallback behavior and input limits.

## 9. PDF/printing

- [ ] With the production preview, print from desktop and mobile actions; only intended document content appears.
- [ ] Test slow images/fonts/math/diagrams; printing waits for readiness after T10 rather than the current fixed delay.
- [ ] Test long tables/code, headings near page boundaries and horizontal overflow across Chrome/Edge/Firefox/Safari.
- [ ] Check light/dark theme, Read zoom/width and presentation mode for print artifacts; no laser/trail/Exit overlay should appear.
- [ ] Confirm external link URL suffixes and static A4 CSS behavior. Word templates/header/footer/cover/page settings are not currently PDF features.
- [ ] Save and reopen the PDF, recording browser and print options; a dialog opening alone is insufficient.

## 10. Share, QR and network boundaries

- [ ] Encode/decode empty, multilingual, emoji, malformed and large inputs; reject unsafe resource sizes after T14.
- [ ] Exercise clipboard success, denied clipboard access and fallback failure with visible feedback.
- [ ] QR small links display/download/scan; capacity errors are useful and do not freeze the UI.
- [ ] Preview toggle changes URL/QR. UI must not promise recipients cannot edit.
- [ ] TinyURL is disabled/rejected **above** 6,000 characters; test a small non-sensitive URL only with explicit consent.
- [ ] Test offline/timeout/non-HTTP responses and toggling mode while shortening; late results must not replace a new URL.
- [ ] Confirm fragment sharing versus legacy query exposure and explain that compression is not encryption.
- [ ] In a clean profile, local `mdimg://` images are unavailable in current text links; after any asset-aware sharing feature, retest its explicit portability/privacy contract.

## 11. History, preferences and batch

- [ ] Save/open/search/pin/rename/delete documents; verify manual rename survives later edits after T12.
- [ ] Confirm 50-snapshot FIFO and no snapshot pin feature unless explicitly implemented; test same timestamps/concurrent inserts and failing writes. Pure policy coverage exists for equal-length/small changes.
- [ ] Theme controls stay synchronized; system theme changes, reload and Settings reset match the chosen scope.
- [ ] Editor size/family/line-height/wrap affect textarea; read zoom and Word templates remain separate controls.
- [ ] Invalid/stale stored preferences recover safely; unsupported-version behavior is documented.
- [ ] Batch processes multiple files sequentially and ZIPs successes; all-failed outcome is clear.
- [ ] Test identical names with different sizes/content, duplicate selection, retries, adding files while running, failure progress and cancellation policy.
- [ ] Current batch is files only and uses default export options; directory traversal and active-document layout inheritance are not delivered.

## 12. Read, presentation, responsive and accessibility

- [ ] At mobile/tablet/desktop widths, every intended action is reachable; known desktop More gap is T11.
- [ ] Read defaults: 820 px base maximum column, 100% zoom, width locked; 70–300% steps/reset and persistence work.
- [ ] Toolbar hides on meaningful downward scrolling beyond threshold, returns on upward scrolling; clicking content is not a reveal action.
- [ ] Presentation starts from desktop Read: saturated red/green/blue/yellow, S/M/L sizes and optional trail match preferences on light/dark backgrounds.
- [ ] Fullscreen requested only when enabled/available; refusal does not break presentation. Escape/Exit/fullscreen exit and leaving Read stop listeners/animation appropriately.
- [ ] Keyboard navigation covers tabs, radio groups, menus and dialogs, including Escape, focus trap and focus return after T15.
- [ ] Screen-reader labels/statuses, contrast, touch targets and iOS safe areas are measured, not inferred from CSS tokens.
- [ ] Reduced-motion preference suppresses inappropriate animation after T15; existing CSS duration reduction does not stop the laser canvas loop.

## 13. PWA, browser matrix and performance

- [ ] Install production build on representative Chrome/Edge desktop, Android and iOS/Safari; record actual devices/versions.
- [ ] Wait for successful cache installation/offline-ready, then test offline reload, text export, images, math and Mermaid without network.
- [ ] Verify broad precache includes heavy lazy assets; do not assume only previously invoked libraries are cached.
- [ ] Update through two production builds with changed assets, multiple open tabs, dirty documents and network interruption. Check save-aware activation after T02 and no stale-chunk failures.
- [ ] Explicit SW polling is hourly; 30 seconds describes countdown after detection, not detection latency.
- [ ] Test blocked DB upgrades, storage quota/eviction and failure recovery without deleting valuable data.
- [ ] Measure representative small/large documents, image sets, history collections and batch queues on declared devices.
- [ ] Record cold/warm JS execution, network/precache bytes, input latency and long tasks separately. Mermaid chunk warnings are not Lighthouse results.
- [ ] Run supported Lighthouse categories and accessibility tools, recording tool versions. Do not use obsolete/unavailable PWA scores as a release certificate.

## 14. Release evidence and reporting

A release candidate must link its commit and all required results to TASK/ROADMAP gates. Do not label it healthy based on eight clicks or a compile alone.

Report failures with: R/T IDs, commit, browser/OS/Node/Office version, minimal synthetic input, exact steps, expected/actual, console/network details, relevant XML or screenshot, and storage state. Remove personal document data from reports.

After a fix, rerun dependent flows (for example save -> share -> restore -> reload -> export), update the task evidence, and only then mark acceptance complete. The documentation reconciliation T20 is done; application checks and fixes remain open.
