import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { Building2, ChevronDown, Check, X } from 'lucide-react';
import { PROPERTIES as FALLBACK_PROPERTIES } from '../js/data/invoice-data.js';

/**
 * MobilePropertyLotPicker
 * Unified Property & Lot selection trigger pill and bottom sheet modal
 * matching the canonical Mobile Invoice Approval design.
 */
const MobilePropertyLotPicker = ({
  selectedProperty,
  selectedLot,
  properties = [],
  onSelectProperty,
  onSelectLot,
  showToast,
  className = '',
  buttonClassName = '',
  pillStyle,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const effectiveProperties =
    properties && properties.length > 0 ? properties : FALLBACK_PROPERTIES;

  const currentProperty =
    selectedProperty ||
    effectiveProperties[0] || {
      id: 'prop-1',
      name: 'Green Valley Residence',
      address: '12-18 Valley Road, Glen Iris VIC',
      lots: ['All Lots', 'Lot A-01', 'Lot A-02', 'Lot A-03'],
    };

  const matchedProp = effectiveProperties.find(
    (p) => p.id === currentProperty?.id || p.name === currentProperty?.name
  );

  const lotsList =
    currentProperty?.lots && currentProperty.lots.length > 0
      ? currentProperty.lots
      : matchedProp?.lots && matchedProp.lots.length > 0
      ? matchedProp.lots
      : ['All Lots', 'Lot A-01', 'Lot A-02', 'Lot A-03', 'Lot B-01', 'Lot B-02'];

  const currentLot = selectedLot || lotsList[0] || 'All Lots';

  const triggerToast = (msg, type = 'info') => {
    if (typeof showToast === 'function') {
      try {
        showToast(msg, type);
      } catch (err) {
        showToast(msg);
      }
    }
  };

  const sheetContent = (
    <div
      className="mobile-sheet-overlay mobile-prop-lot-sheet-overlay"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-label="Switch Property & Lot"
    >
      <div
        className="mobile-sheet-content picker-sheet mobile-prop-lot-sheet-content"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mobile-sheet-handle" />

        <div className="mobile-sheet-header">
          <h3 className="sheet-filter-title">Switch Property &amp; Lot</h3>
          <button
            type="button"
            className="sheet-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div className="mobile-sheet-scrollable-body">
          {/* Section 1: Property List */}
          <div className="sheet-filter-group">
            <span className="sheet-filter-label">Property</span>
            <div className="sheet-props-list">
              {effectiveProperties.map((p) => {
                const isSelected = currentProperty?.id === p.id || currentProperty?.name === p.name;
                return (
                  <button
                    key={p.id}
                    type="button"
                    className={`sheet-prop-row ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectProperty) onSelectProperty(p);
                      triggerToast(`Switched to ${p.name}`, 'success');
                    }}
                  >
                    <Building2 size={16} className="prop-row-icon" />
                    <div className="prop-row-details">
                      <span className="prop-row-name">{p.name}</span>
                      <span className="prop-row-address">{p.address}</span>
                    </div>
                    {isSelected && <Check size={16} className="prop-check-icon" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 2: Lot Chips */}
          <div className="sheet-filter-group">
            <span className="sheet-filter-label">
              Lot ({currentProperty?.name || 'Active Property'})
            </span>
            <div className="sheet-chips-grid">
              {lotsList.map((lot) => {
                const isSelected = currentLot === lot;
                return (
                  <button
                    key={lot}
                    type="button"
                    className={`sheet-choice-chip ${isSelected ? 'active' : ''}`}
                    onClick={() => {
                      if (onSelectLot) onSelectLot(lot);
                      setIsOpen(false);
                      triggerToast(`Selected ${lot}`, 'info');
                    }}
                  >
                    {lot}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mobile-sheet-footer">
          <button
            type="button"
            className="sheet-btn-done"
            onClick={() => setIsOpen(false)}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={`mobile-property-lot-picker-wrap ${className}`.trim()}>
      <button
        type="button"
        className={`mobile-property-lot-pill ${buttonClassName}`.trim()}
        onClick={() => setIsOpen(true)}
        aria-label="Switch property or lot"
        style={pillStyle}
      >
        <Building2 size={13} className="pill-building-icon" />
        <span className="pill-prop-name">{currentProperty?.name || 'Green Valley Residence'}</span>
        <span className="pill-dot">·</span>
        <span className="pill-lot-name">{currentLot}</span>
        <ChevronDown size={12} className="pill-chevron" />
      </button>

      {isOpen && (typeof document !== 'undefined' ? createPortal(sheetContent, document.body) : sheetContent)}
    </div>
  );
};

export default MobilePropertyLotPicker;
