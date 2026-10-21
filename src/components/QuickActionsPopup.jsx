import React from 'react';
import { X, ChevronRight } from 'lucide-react';

/**
 * QuickActionsPopup — shared quick actions popup card.
 *
 * Props:
 *   popupRef  {React.ref}  — ref passed for click-outside detection by parent
 *   onClose   {fn()}       — close the popup
 *   onAction  {fn(key)}    — handle an action; key is one of:
 *                            'approve' | 'pending' | 'overdue' |
 *                            'export'  | 'details' | 'documents'
 */
const QuickActionsPopup = ({
  popupRef,
  onClose,
  onAction,
  actions: customActions,
  title = 'Quick Actions',
}) => {
  const defaultActions = [
    {
      key: 'approve',
      label: 'Approve Invoice',
      iconClass: 'check-icon',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#059669"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
    },
    {
      key: 'pending',
      label: 'Review Pending Invoices',
      iconClass: 'clock-icon',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#D97706"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
    },
    {
      key: 'overdue',
      label: 'View Overdue Invoices',
      iconClass: 'alert-icon',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#DC2626"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <line x1="12" y1="17" x2="12.01" y2="17" />
        </svg>
      ),
    },
    {
      key: 'export',
      label: 'Export Invoices',
      iconClass: 'download-icon',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#2563EB"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
      ),
    },
    {
      key: 'details',
      label: 'View Invoice Details',
      iconClass: 'doc-icon',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#7C3AED"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      ),
    },
    {
      key: 'documents',
      label: 'My Documents',
      iconClass: 'folder-icon',
      icon: (
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#0D9488"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
        </svg>
      ),
    },
  ];

  const activeActions = customActions && customActions.length > 0 ? customActions : defaultActions;

  return (
    <div className="invoice-popup-card invoice-quick-popup" ref={popupRef}>
      {/* Header */}
      <div className="invoice-popup-header">
        <div className="invoice-popup-header-left">
          <div className="invoice-popup-icon quick-icon">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00BFA5"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
          </div>
          <h2 className="invoice-popup-title">{title}</h2>
        </div>
        <button
          type="button"
          className="invoice-popup-close-btn"
          onClick={onClose}
          aria-label="Close Quick Actions"
        >
          <X size={16} />
        </button>
      </div>

      {/* Action List */}
      <div className="invoice-quick-actions-list">
        {activeActions.map(({ key, label, iconClass, icon }) => (
          <button
            key={key}
            type="button"
            className="invoice-quick-item"
            onClick={() => onAction?.(key)}
          >
            <div className={`invoice-quick-item-icon ${iconClass}`}>{icon}</div>
            <span className="invoice-quick-item-label">{label}</span>
            <span className="invoice-quick-item-chevron">
              <ChevronRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default QuickActionsPopup;
