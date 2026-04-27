# EPIC.md — V2 Mobile-First, Offline-Capable Markdown Editor

## Overview

This epic upgrades the Markdown to Word Converter from a desktop-only web tool into a **mobile-first, offline-capable, Apple-style Progressive Web App (PWA)** with a rich preference system, document history, and forced-update support.

The current MVP is a static React app deployed on GitHub Pages. The V2 epic does **not** rebuild the converter — it adds an experience layer on top.

---

## Epic Goals

### Primary Goals

- Run as an installable PWA on iOS, Android, and desktop.
- Work offline after first visit (core editor + preview + export).
- Force users onto the latest version when a new release ships.
- Render correctly inside iPhone notch / Dynamic Island / home indicator areas.
- Be usable on a 320px-wide phone screen with a single thumb.
- Follow Apple Human Interface Guidelines for visual hierarchy, typography, and motion.
- Auto-save drafts so users never lose work.
- Persist a searchable document history in IndexedDB.
- Expose user preferences for font size, theme color, draft auto-save, etc.

### Secondary Goals

- Support installation from browser without an app store.
- Reduce time-to-interactive on repeat visits to under 500 ms.
- Allow exporting / importing the entire history archive.
- Enable keyboard shortcuts for power users on desktop.

---

## Non-Goals

- Native iOS / Android app store submissions.
- Cloud sync (cross-device history requires a backend, out of scope).
- Multi-user collaboration / real-time editing.
- E2E encryption of stored documents.
- Custom font uploads.
- Advanced PWA push notifications.

---

## Sub-Epics (Scope Breakdown)

| # | Sub-Epic | Priority | Estimated Effort |
|---|---|---|---|
| 1 | PWA + Service Worker with Forced Update | P0 | M |
| 2 | iOS Safe Area Support | P0 | S |
| 3 | Mobile Responsive Layout | P0 | M |
| 4 | Apple-Style Design System | P1 | L |
| 5 | Expanded Preferences (font, theme, auto-save) | P1 | M |
| 6 | Document History via IndexedDB | P1 | L |

> **P0** = Must ship in V2.
> **P1** = Should ship in V2, can be split across releases.
> Effort: S (≤1 day), M (2–3 days), L (4–7 days).

---

## 1. Sub-Epic — PWA + Service Worker + Forced Update

### 1.1 Goal

Make the app installable, offline-capable, and able to force users onto the latest version when a deploy goes out.

### 1.2 Deliverables

- `public/manifest.webmanifest` — name, icons, theme color, display mode.
- `public/sw.js` — service worker with cache strategy.
- `src/pwa/registerSW.js` — registration + update detection module.
- `src/pwa/UpdatePrompt.jsx` — toast UI when new version detected.
- App icons at 192×192, 512×512, maskable variants.
- iOS-specific apple-touch-icon and splash screens.

### 1.3 Cache Strategy

```text
HTML (index.html)              → Network-first, fallback to cache
JS / CSS / fonts               → Cache-first, revalidate in background
Markdown sample docs           → Cache-first
External CDN (if any)          → Network-only
```

This guarantees users always get the latest HTML when online (which references the latest hashed assets), but the app still loads instantly when offline.

### 1.4 Forced Update Flow

```text
New version pushed to main
  ↓
GitHub Actions builds with new asset hashes
  ↓
User reloads page → fetches new sw.js
  ↓
sw.js detects version mismatch → install + skipWaiting
  ↓
App posts message to all clients
  ↓
UpdatePrompt shows: "New version available — Reload now"
  ↓
User clicks → window.location.reload(true)
```

### 1.5 Versioning

- `BUILD_VERSION` constant injected at build time via Vite `define`.
- Service worker compares stored version to fetched version.
- Mismatch → trigger update flow.

### 1.6 Acceptance Criteria

- [ ] App installs to iOS home screen with custom icon.
- [ ] App installs to Android home screen with custom icon.
- [ ] App installs to desktop Chrome / Edge.
- [ ] After installation, app opens in standalone mode (no browser UI).
- [ ] Editor + preview + export work fully offline.
- [ ] When a new version is deployed, user sees update prompt within 30 seconds of opening the app.
- [ ] User can dismiss prompt or click "Reload now" to apply update.
- [ ] No stale assets are served after an update.

### 1.7 Risks

- iOS Safari has historically limited PWA storage / lifecycle — must test on real iOS device.
- Service worker bugs can permanently break the app — include kill-switch (unregister via URL flag).

---

## 2. Sub-Epic — iOS Safe Area Support

### 2.1 Goal

Render the app correctly on iPhones with notch, Dynamic Island, and home indicator — never under or behind system UI.

### 2.2 Deliverables

- Update `<meta name="viewport">` to include `viewport-fit=cover`.
- Add `env(safe-area-inset-*)` CSS variables to all fixed layout boundaries.
- Add `--safe-top`, `--safe-bottom`, `--safe-left`, `--safe-right` CSS custom properties.

### 2.3 Layout Targets

```text
Top toolbar       → padding-top: env(safe-area-inset-top)
Bottom action bar → padding-bottom: env(safe-area-inset-bottom)
Modal backdrop    → full bleed but content respects safe area
Workspace         → side padding respects safe-area-inset-left/right (landscape)
```

### 2.4 Acceptance Criteria

- [ ] Toolbar title not clipped by Dynamic Island on iPhone 14/15/16 Pro.
- [ ] Bottom buttons not covered by home indicator.
- [ ] Landscape mode respects left/right safe areas.
- [ ] App in standalone PWA mode looks identical to in-browser mode.
- [ ] No content hidden behind status bar.

### 2.5 Reference

```css
:root {
  --safe-top:    env(safe-area-inset-top, 0px);
  --safe-bottom: env(safe-area-inset-bottom, 0px);
  --safe-left:   env(safe-area-inset-left, 0px);
  --safe-right:  env(safe-area-inset-right, 0px);
}

.toolbar {
  padding-top: calc(10px + var(--safe-top));
  padding-left: calc(16px + var(--safe-left));
  padding-right: calc(16px + var(--safe-right));
}
```

---

## 3. Sub-Epic — Mobile Responsive Layout

### 3.1 Goal

Make the app fully usable on a phone screen as small as 320px wide, with one thumb.

### 3.2 Breakpoints

| Range | Layout |
|---|---|
| < 768 px (mobile) | Single panel, tab-switched between Editor / Preview |
| 768–1024 px (tablet) | Side-by-side, smaller toolbar |
| > 1024 px (desktop) | Current layout |

### 3.3 Mobile-Specific UI Changes

```text
Toolbar collapses → hamburger menu for secondary actions
Editor / Preview → swipeable tabs at top
Buttons → minimum 44×44 px touch targets (Apple HIG)
Modals → full-screen sheets on mobile, centered on desktop
File upload → uses native file picker
Share modal → native Web Share API where supported
```

### 3.4 Touch Interactions

- Swipe left/right between Editor and Preview tabs.
- Pull-to-refresh disabled on editor (interferes with text selection).
- Long-press on Share button copies link directly.
- Haptic feedback on key actions where supported (`navigator.vibrate`).

### 3.5 Acceptance Criteria

- [ ] Lighthouse mobile score ≥ 90.
- [ ] All buttons ≥ 44×44 px on mobile.
- [ ] No horizontal scroll on any screen ≥ 320 px wide.
- [ ] Editor and preview both reachable on mobile via tabs.
- [ ] Share modal opens as full-screen sheet on mobile.
- [ ] Web Share API used when available (single tap to share via system).

---

## 4. Sub-Epic — Apple-Style Design System

### 4.1 Design Principles (Apple HIG)

```text
Clarity     — Text is legible, icons precise, content prioritized.
Deference   — UI helps people understand and interact with content.
Depth       — Distinct layers convey hierarchy and motion.
```

### 4.2 Typography

- Use system font stack: `-apple-system, BlinkMacSystemFont, 'SF Pro Text', 'Segoe UI', system-ui, sans-serif`.
- Type scale based on Apple's Dynamic Type:

```text
Caption     11 px / 13 px line
Footnote    13 px / 18 px
Subhead     15 px / 20 px
Body        17 px / 22 px        ← default
Title 3     20 px / 25 px
Title 2     22 px / 28 px
Title 1     28 px / 34 px
Large Title 34 px / 41 px
```

### 4.3 Color System

```text
Light Mode
─────────────
Background     #FFFFFF
Secondary BG   #F2F2F7
Tertiary BG    #FFFFFF (on grouped)
Label          #000000
Secondary      #3C3C4399
Separator      #3C3C432F
Tint (accent)  #007AFF (iOS Blue, configurable)

Dark Mode
─────────────
Background     #000000
Secondary BG   #1C1C1E
Tertiary BG    #2C2C2E
Label          #FFFFFF
Secondary      #EBEBF599
Separator      #54545899
Tint           #0A84FF
```

### 4.4 Materials & Effects

```text
Translucent toolbar    backdrop-filter: blur(20px) saturate(180%)
Cards                  rounded 12 px, soft shadow, subtle border
Modals                 16 px corner radius, blur backdrop
Buttons                rounded 8 px (small) / 12 px (large)
Active states          0.96 scale + opacity 0.7 on tap
```

### 4.5 Motion

```text
Standard ease    cubic-bezier(0.4, 0, 0.2, 1) over 200 ms
Spring           cubic-bezier(0.32, 0.72, 0, 1) over 350 ms (modal open)
Tap response     scale + opacity, 150 ms
Page transition  fade + slide, 250 ms
```

### 4.6 Theming Implementation

- All design tokens in `src/styles/theme.js`.
- Light / dark / system-auto modes.
- Accent color configurable (Blue, Indigo, Pink, Green, Orange, Red).
- Theme synced to `prefers-color-scheme` by default.

### 4.7 Acceptance Criteria

- [ ] All UI uses tokens from `theme.js` — no hardcoded colors.
- [ ] Light and dark modes both fully styled.
- [ ] Accent color changes propagate everywhere within 1 frame.
- [ ] All transitions use defined motion curves.
- [ ] Toolbar uses backdrop blur where supported.
- [ ] Tap feedback (scale + opacity) on every interactive element.
- [ ] Looks at home next to native iOS / macOS apps.

---

## 5. Sub-Epic — Expanded Preferences

### 5.1 Goal

Give users fine-grained control over their editing experience, all persisted locally.

### 5.2 Preference Schema

```js
{
  editor: {
    fontSize: 'sm' | 'md' | 'lg' | 'xl',     // 13/15/17/19 px
    fontFamily: 'system' | 'mono' | 'serif',
    lineHeight: 'compact' | 'normal' | 'relaxed',
    wordWrap: boolean,
    autoSave: boolean,
    autoSaveInterval: number,                 // milliseconds
  },
  appearance: {
    theme: 'light' | 'dark' | 'system',
    accent: 'blue' | 'indigo' | 'pink' | 'green' | 'orange' | 'red',
    reducedMotion: boolean,
  },
  share: {
    previewOnly: boolean,                     // already exists
  },
  export: {
    defaultFilename: string,
    template: 'default' | 'business' | 'technical' | 'minimal',
  },
}
```

### 5.3 Storage

- All preferences stored in `localStorage` under key `prefs.v1`.
- Versioned schema — `v1`, `v2` migrations explicitly handled.
- Single React context `PreferencesProvider` exposes read + update.
- Default values defined in `src/preferences/defaults.js`.

### 5.4 UI

- Settings sheet accessible from toolbar gear icon.
- Grouped sections matching schema (Editor / Appearance / Share / Export).
- Live preview — changes apply immediately.
- "Reset to defaults" button at bottom.
- "Export preferences as JSON" / "Import" for power users.

### 5.5 Auto-Save Draft

- Draft saved to `localStorage` under `draft.current` every N seconds (default 3).
- On app load, if a draft exists, prompt: "Restore unsaved draft?"
- Draft cleared when user explicitly Clears or Loads Sample.

### 5.6 Acceptance Criteria

- [ ] Font size change reflects instantly in editor + preview.
- [ ] Theme change reflects instantly across entire app.
- [ ] Accent color change reflects instantly.
- [ ] Auto-save draft survives accidental tab close and browser crash.
- [ ] Settings persist across browser sessions.
- [ ] "Reset to defaults" restores everything.
- [ ] Schema migrations work when upgrading from v1 to future v2.

---

## 6. Sub-Epic — Document History via IndexedDB

### 6.1 Goal

Persist a versioned history of every document the user works on, with search, restore, and export.

### 6.2 Why IndexedDB (not localStorage)

| Feature | localStorage | IndexedDB |
|---|---|---|
| Storage limit | 5–10 MB | 50% of free disk (often GB) |
| Data type | strings only | structured objects, blobs |
| Indexing / search | none | indexed queries |
| Async | sync (blocks UI) | async (non-blocking) |
| Suitable for history | ❌ | ✅ |

### 6.3 Schema

```js
// IndexedDB: markdown-editor-db, version 1

ObjectStore: documents {
  keyPath: 'id',                        // UUID
  indexes: {
    updatedAt: { unique: false },
    title:     { unique: false },
  },
  record: {
    id: string,                         // UUID
    title: string,                      // first H1 or first 60 chars
    content: string,                    // raw markdown
    createdAt: number,                  // epoch ms
    updatedAt: number,
    wordCount: number,
    sizeBytes: number,
    pinned: boolean,
  },
}

ObjectStore: snapshots {
  keyPath: 'id',                        // UUID
  indexes: {
    documentId: { unique: false },
    createdAt:  { unique: false },
  },
  record: {
    id: string,
    documentId: string,                 // foreign key
    content: string,                    // markdown at this point
    createdAt: number,
  },
}
```

### 6.4 Module

```text
src/history/
├── db.js                     # IndexedDB wrapper (open, transaction helpers)
├── documentRepo.js           # CRUD on documents
├── snapshotRepo.js           # CRUD on snapshots
├── HistoryProvider.jsx       # React context + hooks
├── HistoryPanel.jsx          # List view UI
└── HistoryItem.jsx           # Row UI with preview
```

### 6.5 Auto-Snapshot Strategy

- On every meaningful change (debounced 5 seconds), check if content differs from last snapshot.
- If yes, create a snapshot.
- Cap at 50 snapshots per document — oldest deleted first (FIFO).
- "Pinned" snapshots are exempt from FIFO eviction.

### 6.6 UI

- "History" button in toolbar opens panel.
- Panel shows list of documents (most recent first).
- Each row shows: title, preview snippet, last updated, word count.
- Click a row → opens the document.
- Long-press / right-click → context menu: Pin, Rename, Delete, Export.
- Top-of-panel search box filters by title or content.
- "Export all as ZIP" button (uses `JSZip`) downloads entire history.

### 6.7 Privacy & Data Lifecycle

- All data stored locally in browser, never sent to a server.
- "Clear History" button in Settings wipes the database.
- Browser clearing site data also clears history (expected behavior).

### 6.8 Acceptance Criteria

- [ ] Every document edit auto-saves a snapshot within 5 seconds.
- [ ] History panel lists all documents sorted by `updatedAt`.
- [ ] Search returns results within 100 ms for ≤ 1000 documents.
- [ ] Pinned documents survive snapshot cap eviction.
- [ ] Export all as ZIP produces a valid archive of `.md` files.
- [ ] Clearing browser data correctly empties IndexedDB.
- [ ] No UI jank during snapshot writes (async transactions).

---

## Cross-Cutting Concerns

### Performance

- Service worker precaches critical assets at install.
- React lazy-load Settings panel and History panel.
- Debounce all auto-save / snapshot operations.
- Use `requestIdleCallback` for non-critical work.
- Lighthouse target: Performance ≥ 90, PWA ≥ 100, Accessibility ≥ 95.

### Accessibility

- All interactive elements have `aria-label`.
- Keyboard navigation works in all modes.
- Color contrast ratio ≥ 4.5:1 (WCAG AA).
- `prefers-reduced-motion` respected for all animations.
- Focus rings clearly visible in both light and dark modes.

### Internationalization (Future)

- All UI strings centralized in `src/i18n/strings.js`.
- Default English; placeholder for `zh-CN` and `ja-JP`.
- Date / time formatting via `Intl.DateTimeFormat`.

### Testing

- Unit tests for `shareLink.js`, `documentRepo.js`, `snapshotRepo.js`.
- Component tests for `ShareModal`, `HistoryPanel`, `UpdatePrompt`.
- E2E test on real iOS Safari + Android Chrome.
- PWA install + offline + force update test on each platform.

### Security

- `Content-Security-Policy` meta tag forbids inline scripts.
- Service worker scope limited to app origin.
- No external resources loaded in offline mode.
- Markdown rendered with `html: false` (already in place).

---

## Dependencies

### New Libraries

| Library | Purpose | Approx Size |
|---|---|---|
| `idb` | IndexedDB Promise wrapper | 1 KB |
| `nanoid` | UUID generation | 0.5 KB |
| `jszip` | History export | 30 KB |
| `vite-plugin-pwa` | Service worker + manifest tooling | dev only |

### No Backend Required

All sub-epics are pure-frontend. GitHub Pages remains the only deployment target.

---

## Roadmap (Suggested Sequence)

```text
Release V2.0  ── PWA + Forced Update + iOS Safe Area
Release V2.1  ── Mobile Responsive + Apple Design System (theme tokens)
Release V2.2  ── Expanded Preferences + Auto-Save Draft
Release V2.3  ── Document History (IndexedDB)
Release V2.4  ── History Search + Export + Polish
```

Each release is independent — can ship to production even if later releases slip.

---

## Risks & Open Questions

### Risks

- **iOS PWA limitations** — Safari frequently changes PWA behavior. Mitigation: test on every iOS major release.
- **Service worker corruption** — A buggy SW can permanently break the app. Mitigation: implement `?unregister-sw=1` URL flag.
- **IndexedDB quota** — User can hit storage limit. Mitigation: monitor `navigator.storage.estimate()`, warn at 80%.
- **Browser fragmentation** — `backdrop-filter`, `env()`, IndexedDB versioning differ across browsers. Mitigation: feature-detect, graceful fallback.

### Open Questions

- Should history be searchable by full-text content, or only by title?
- Should we offer encrypted history (passphrase-protected)?
- Should auto-save draft be enabled by default, or opt-in?
- Should installable app prompt show automatically, or only behind a button?

---

## Success Metrics

```text
Installation rate              ≥ 5 % of returning visitors
PWA Lighthouse score           = 100
Mobile Lighthouse Performance  ≥ 90
Time to Interactive (mobile)   < 1.5 s on 4G
Offline session success rate   ≥ 99 %
History snapshot reliability   100 % (no lost edits within debounce window)
Update adoption rate           ≥ 80 % within 24 h of release
```

---

## Attention Point

Do not treat this epic as a single monolithic release.

```text
Each sub-epic must ship independently.
Each release must be reverible — feature flags or kill switches.
Each release must keep the existing converter pipeline untouched.
```

The current MVP works. The V2 epic adds polish and depth, but the core
`Markdown → AST → DOCX` compiler stays the load-bearing center of the project.

---

## Deep Reasoning with Reflection (DRR)

This epic separates concerns by lifecycle layer:

```text
Service Worker layer    →  app delivery & freshness
Layout layer            →  device-shape adaptation
Design layer            →  visual identity & motion
Preferences layer       →  user-controlled state
Persistence layer       →  long-lived data (IndexedDB)
```

Each layer is independently buildable and testable. None of them touches
the converter (`src/converter/`), which means the V2 epic carries minimal
risk of regressing the existing export functionality — the highest-value
asset of the project.

The architecture goal of V2 is the same as V1:

```text
Markdown → AST → DOCX
```

V2 simply wraps this compiler in a better delivery vehicle.
