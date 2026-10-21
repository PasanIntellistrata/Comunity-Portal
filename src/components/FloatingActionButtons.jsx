import React from 'react';

/**
 * FloatingActionButtons — shared FAB group for Quick Actions and AI Assistant.
 *
 * Props:
 *   fabGroupRef          {React.ref}     — ref for click-outside detection by parent
 *   activePopup          {string|null}   — 'quickActions' | 'aiAssistant' | null
 *   onToggleQuickActions {fn()}          — toggle Quick Actions popup
 *   onToggleAiAssistant  {fn()}          — toggle AI Assistant popup
 */
const FloatingActionButtons = ({
  fabGroupRef,
  activePopup,
  onToggleQuickActions,
  onToggleAiAssistant,
}) => {
  return (
    <div className="invoice-fab-group" ref={fabGroupRef}>
      {/* Upper Button: Quick Actions */}
      <button
        type="button"
        className={`invoice-fab invoice-fab-quick ${
          activePopup === 'quickActions' ? 'active' : ''
        }`}
        title="Quick Actions"
        onClick={onToggleQuickActions}
        aria-label="Quick Actions"
        aria-expanded={activePopup === 'quickActions'}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#00BFA5"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </svg>
      </button>

      {/* Lower Button: AI Assistant */}
      <button
        type="button"
        className={`invoice-fab invoice-fab-ai ${
          activePopup === 'aiAssistant' ? 'active' : ''
        }`}
        title="AI Assistant"
        onClick={onToggleAiAssistant}
        aria-label="AI Assistant"
        aria-expanded={activePopup === 'aiAssistant'}
      >
        <svg
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 3C12 7.97 7.97 12 3 12C7.97 12 12 16.03 12 21C12 16.03 16.03 12 21 12C16.03 12 12 7.97 12 3Z"
            stroke="#ffffff"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="2.2" fill="#ffffff" />
          <circle cx="18.5" cy="5.5" r="1.6" fill="#ffffff" />
          <circle cx="5.5" cy="18.5" r="1.2" fill="#ffffff" />
        </svg>
      </button>
    </div>
  );
};

export default FloatingActionButtons;
