import React from 'react'
import { useTheme } from '../theme/useTheme.js'
import { AUTO_SAVE_INTERVALS } from './defaults.js'

function Segmented({ value, options, onChange, ariaLabel }) {
  return (
    <div className="segmented" role="radiogroup" aria-label={ariaLabel}>
      {options.map((opt) => (
        <button
          key={opt.value}
          role="radio"
          aria-checked={value === opt.value}
          className={value === opt.value ? 'active' : ''}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}

function Switch({ checked, onChange, ariaLabel }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      className={`switch ${checked ? 'on' : ''}`}
      onClick={() => onChange(!checked)}
    />
  )
}

function Row({ label, children, hint }) {
  return (
    <div className="settings-row">
      <div className="settings-row-text">
        <div className="settings-row-label">{label}</div>
        {hint && <div className="settings-row-hint">{hint}</div>}
      </div>
      <div className="settings-row-control">{children}</div>
    </div>
  )
}

export default function SettingsSheet({ prefs, update, reset, onClose }) {
  const { mode: themeMode, setMode: setThemeMode } = useTheme()

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Settings</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body settings-body">
          <section className="settings-section">
            <div className="settings-section-title">Appearance</div>
            <Row label="Theme">
              <Segmented
                ariaLabel="Theme"
                value={themeMode}
                onChange={setThemeMode}
                options={[
                  { label: 'Light', value: 'light' },
                  { label: 'Dark', value: 'dark' },
                  { label: 'Auto', value: 'system' },
                ]}
              />
            </Row>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Editor</div>
            <Row label="Font Size">
              <Segmented
                ariaLabel="Font Size"
                value={prefs.editor.fontSize}
                onChange={(v) => update('editor', 'fontSize', v)}
                options={[
                  { label: 'S', value: 'sm' },
                  { label: 'M', value: 'md' },
                  { label: 'L', value: 'lg' },
                  { label: 'XL', value: 'xl' },
                ]}
              />
            </Row>
            <Row label="Font Family">
              <Segmented
                ariaLabel="Font Family"
                value={prefs.editor.fontFamily}
                onChange={(v) => update('editor', 'fontFamily', v)}
                options={[
                  { label: 'Mono', value: 'mono' },
                  { label: 'System', value: 'system' },
                  { label: 'Serif', value: 'serif' },
                ]}
              />
            </Row>
            <Row label="Line Height">
              <Segmented
                ariaLabel="Line Height"
                value={prefs.editor.lineHeight}
                onChange={(v) => update('editor', 'lineHeight', v)}
                options={[
                  { label: 'Compact', value: 'compact' },
                  { label: 'Normal', value: 'normal' },
                  { label: 'Relaxed', value: 'relaxed' },
                ]}
              />
            </Row>
            <Row label="Word Wrap" hint="Wrap long lines instead of horizontal scroll">
              <Switch
                ariaLabel="Word Wrap"
                checked={prefs.editor.wordWrap}
                onChange={(v) => update('editor', 'wordWrap', v)}
              />
            </Row>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Draft Auto-Save</div>
            <Row label="Auto-save drafts" hint="Recover unsaved work after browser crash">
              <Switch
                ariaLabel="Auto-save drafts"
                checked={prefs.draft.autoSave}
                onChange={(v) => update('draft', 'autoSave', v)}
              />
            </Row>
            {prefs.draft.autoSave && (
              <Row label="Save every">
                <Segmented
                  ariaLabel="Auto-save interval"
                  value={prefs.draft.autoSaveInterval}
                  onChange={(v) => update('draft', 'autoSaveInterval', v)}
                  options={AUTO_SAVE_INTERVALS}
                />
              </Row>
            )}
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Presentation Mode (Laser)</div>
            <Row label="Laser Color">
              <Segmented
                ariaLabel="Laser Color"
                value={prefs.presentation?.color || 'red'}
                onChange={(v) => update('presentation', 'color', v)}
                options={[
                  { label: 'Red', value: 'red' },
                  { label: 'Green', value: 'green' },
                  { label: 'Blue', value: 'blue' },
                  { label: 'Yellow', value: 'yellow' },
                ]}
              />
            </Row>
            <Row label="Laser Size">
              <Segmented
                ariaLabel="Laser Size"
                value={prefs.presentation?.size || 'md'}
                onChange={(v) => update('presentation', 'size', v)}
                options={[
                  { label: 'S', value: 'sm' },
                  { label: 'M', value: 'md' },
                  { label: 'L', value: 'lg' },
                ]}
              />
            </Row>
            <Row label="Glow Trail" hint="Fading red streak behind the laser">
              <Switch
                ariaLabel="Glow Trail"
                checked={prefs.presentation?.trail !== false}
                onChange={(v) => update('presentation', 'trail', v)}
              />
            </Row>
            <Row label="Auto Fullscreen" hint="Enter browser fullscreen when starting presentation">
              <Switch
                ariaLabel="Auto Fullscreen"
                checked={prefs.presentation?.fullscreen !== false}
                onChange={(v) => update('presentation', 'fullscreen', v)}
              />
            </Row>
          </section>

          <section className="settings-section">
            <button className="settings-danger-btn" onClick={reset}>
              Reset All Settings
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}
