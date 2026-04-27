import React, { useState } from 'react'
import { TEMPLATE_LIST } from '../styles/templates/index.js'

function Row({ label, hint, children }) {
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

function TextInput({ value, onChange, placeholder }) {
  return (
    <input
      className="layout-input"
      type="text"
      value={value || ''}
      placeholder={placeholder}
      onChange={(e) => onChange(e.target.value)}
    />
  )
}

export default function DocumentLayoutSheet({ doc, onUpdate, onClose }) {
  const [templateId, setTemplateId] = useState(doc.templateId || 'default')
  const [layout, setLayout] = useState(doc.layout)

  function commit(patch) {
    onUpdate(patch)
  }

  function setLayoutField(key, val) {
    const next = { ...layout, [key]: val }
    setLayout(next)
    commit({ layout: { [key]: val } })
  }

  function setCoverField(key, val) {
    const next = { ...layout, coverPage: { ...layout.coverPage, [key]: val } }
    setLayout(next)
    commit({ layout: { coverPage: { [key]: val } } })
  }

  function setTemplate(id) {
    setTemplateId(id)
    commit({ templateId: id })
  }

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal layout-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <span>Document Layout</span>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        <div className="modal-body settings-body">
          <section className="settings-section">
            <div className="settings-section-title">Template</div>
            <div className="layout-template-grid">
              {TEMPLATE_LIST.map((t) => (
                <button
                  key={t.id}
                  className={`layout-template-card ${templateId === t.id ? 'active' : ''}`}
                  onClick={() => setTemplate(t.id)}
                >
                  <div
                    className="layout-template-swatch"
                    style={{ fontFamily: t.document.font }}
                  >
                    Aa
                  </div>
                  <div className="layout-template-name">{t.name}</div>
                  <div className="layout-template-desc">{t.description}</div>
                </button>
              ))}
            </div>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Page</div>
            <Row label="Page Size">
              <Segmented
                ariaLabel="Page size"
                value={layout.pageSize}
                onChange={(v) => setLayoutField('pageSize', v)}
                options={[
                  { label: 'A4', value: 'a4' },
                  { label: 'Letter', value: 'letter' },
                  { label: 'A3', value: 'a3' },
                ]}
              />
            </Row>
            <Row label="Orientation">
              <Segmented
                ariaLabel="Orientation"
                value={layout.orientation}
                onChange={(v) => setLayoutField('orientation', v)}
                options={[
                  { label: 'Portrait', value: 'portrait' },
                  { label: 'Landscape', value: 'landscape' },
                ]}
              />
            </Row>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Header & Footer</div>
            <Row label="Page Numbers" hint="Show 'Page N of M' in footer">
              <Switch
                ariaLabel="Page numbers"
                checked={!!layout.pageNumbers}
                onChange={(v) => setLayoutField('pageNumbers', v)}
              />
            </Row>
            <Row label="Header" hint="Tokens: {title}, {date}">
              <TextInput
                value={layout.header}
                placeholder="e.g. {title}"
                onChange={(v) => setLayoutField('header', v)}
              />
            </Row>
            <Row label="Footer" hint="Tokens: {title}, {date}, {page}, {total}">
              <TextInput
                value={layout.footer}
                placeholder="e.g. {date}"
                onChange={(v) => setLayoutField('footer', v)}
              />
            </Row>
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Cover Page</div>
            <Row label="Generate Cover Page">
              <Switch
                ariaLabel="Generate cover page"
                checked={!!layout.coverPage.enabled}
                onChange={(v) => setCoverField('enabled', v)}
              />
            </Row>
            {layout.coverPage.enabled && (
              <>
                <Row label="Title">
                  <TextInput
                    value={layout.coverPage.title}
                    placeholder={doc.title}
                    onChange={(v) => setCoverField('title', v)}
                  />
                </Row>
                <Row label="Subtitle">
                  <TextInput
                    value={layout.coverPage.subtitle}
                    placeholder="Optional subtitle"
                    onChange={(v) => setCoverField('subtitle', v)}
                  />
                </Row>
                <Row label="Author">
                  <TextInput
                    value={layout.coverPage.author}
                    placeholder="Your name"
                    onChange={(v) => setCoverField('author', v)}
                  />
                </Row>
                <Row label="Date">
                  <TextInput
                    value={layout.coverPage.date}
                    placeholder={new Date().toLocaleDateString()}
                    onChange={(v) => setCoverField('date', v)}
                  />
                </Row>
              </>
            )}
          </section>

          <section className="settings-section">
            <div className="settings-section-title">Insert TOC</div>
            <p className="layout-hint">
              Add <code>[TOC]</code> on its own line in your Markdown to insert a Table of Contents.
              Word will populate page numbers automatically when you open the file.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
