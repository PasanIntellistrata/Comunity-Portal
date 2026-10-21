import React, { useState, useRef, useEffect } from 'react';
import { Home, ChevronDown, Check } from 'lucide-react';

/**
 * LotSelector — Common lot selector component for all Intellistrata portal pages.
 *
 * Props:
 *   selectedLot   {string}    — currently selected lot (e.g. 'Lot A-03')
 *   lots          {array}     — list of available lots for current property
 *   propertyName  {string}    — name of property displayed in dropdown header
 *   onSelectLot   {fn(lot)}   — callback when a lot is selected
 *   className     {string}    — optional extra CSS class
 */
const LotSelector = ({
  selectedLot = 'Lot A-03',
  lots = ['All Lots', 'Lot A-01', 'Lot A-02', 'Lot A-03', 'Lot B-01', 'Lot B-02'],
  propertyName = 'Green Valley Residence',
  onSelectLot,
  className = '',
}) => {
  const [isLotMenuOpen, setIsLotMenuOpen] = useState(false);
  const lotMenuRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (lotMenuRef.current && !lotMenuRef.current.contains(e.target)) {
        setIsLotMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div
      className={`app-lot-selector-wrap invoice-lot-selector-wrap ${className}`.trim()}
      ref={lotMenuRef}
    >
      <div
        className={`app-lot-selector invoice-lot-selector ${isLotMenuOpen ? 'active' : ''}`}
        onClick={() => setIsLotMenuOpen((prev) => !prev)}
        role="button"
        tabIndex={0}
        aria-label="Select Lot"
        aria-expanded={isLotMenuOpen}
      >
        <span className="app-lot-selector-icon invoice-lot-selector-icon">
          <Home size={15} />
        </span>
        <span className="app-lot-selector-name invoice-lot-selector-name">{selectedLot}</span>
        <span
          className={`app-lot-selector-chevron invoice-lot-selector-chevron ${
            isLotMenuOpen ? 'open' : ''
          }`}
        >
          <ChevronDown size={14} />
        </span>
      </div>

      {isLotMenuOpen && (
        <div className="app-lot-dropdown invoice-lot-dropdown">
          <div className="app-lot-dropdown-header invoice-dropdown-header">
            <div className="app-lot-dropdown-title invoice-dropdown-title">
              {propertyName}
            </div>
            <div className="app-lot-dropdown-subtitle invoice-dropdown-subtitle">
              Select lot or unit
            </div>
          </div>
          <div className="app-lot-dropdown-list invoice-dropdown-list">
            {lots.map((lot) => (
              <button
                key={lot}
                type="button"
                className={`app-lot-item invoice-lot-item ${
                  lot === selectedLot ? 'selected' : ''
                }`}
                onClick={() => {
                  if (onSelectLot) onSelectLot(lot);
                  setIsLotMenuOpen(false);
                }}
              >
                <span className="app-lot-item-icon invoice-lot-item-icon">
                  <Home size={14} />
                </span>
                <span className="app-lot-item-name invoice-lot-item-name">{lot}</span>
                {lot === selectedLot && (
                  <span className="app-lot-item-check invoice-lot-item-check">
                    <Check size={14} />
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default LotSelector;
