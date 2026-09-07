import React from 'react'
import { useModalA11y } from '../accessibility/useModalA11y.js'

export default function MoreMenu({ onClose, items }) {
  const menuRef = useModalA11y(onClose)

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        ref={menuRef}
        className="more-sheet"
        role="menu"
        aria-label="More actions"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="more-sheet-grabber" />
        <div className="more-sheet-list">
          {items.map((item, i) => {
            if (item.type === 'separator') {
              return <div key={i} className="more-sheet-separator" />
            }
            return (
              <button
                key={i}
                className={`more-sheet-item ${item.danger ? 'danger' : ''}`}
                onClick={() => {
                  onClose()
                  item.onClick()
                }}
                disabled={item.disabled}
                role="menuitem"
              >
                {item.icon && <span className="more-sheet-icon">{item.icon}</span>}
                <span className="more-sheet-label">{item.label}</span>
              </button>
            )
          })}
        </div>
        <button className="more-sheet-cancel" onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  )
}
