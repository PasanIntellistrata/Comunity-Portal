import React, { useEffect } from 'react';
import { X, Sparkles, ChevronRight } from 'lucide-react';

const DEFAULT_SUGGESTIONS = [
  'Show unpaid invoices',
  'Which invoices need approval?',
  'Explain invoice INV-2026-0587',
  'Show invoices from ABC Services',
];

/**
 * AiAssistantPopup — shared AI Assistant chat popup card.
 *
 * Props:
 *   popupRef       {React.ref}  — ref for click-outside detection by parent
 *   onClose        {fn()}       — close popup
 *   messages       {array}      — [{ id, sender:'user'|'assistant', text, time }]
 *   isTyping       {boolean}    — show typing indicator
 *   input          {string}     — controlled input value
 *   onInputChange  {fn(value)}  — called on input change
 *   onSubmit       {fn(e)}      — form submit handler
 *   onSuggestion   {fn(query)}  — suggestion chip clicked
 *   aiChatEndRef   {React.ref}  — ref to scroll to bottom of messages
 *   onClearChat    {fn()}       — reset messages to suggestions view
 *   promptQuestion {string}     — header question
 *   suggestions    {array}      — suggestion strings
 */
const AiAssistantPopup = ({
  popupRef,
  onClose,
  messages = [],
  isTyping = false,
  input = '',
  onInputChange,
  onSubmit,
  onSuggestion,
  aiChatEndRef,
  onClearChat,
  promptQuestion = 'How can I help you today?',
  suggestions = DEFAULT_SUGGESTIONS,
}) => {
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (aiChatEndRef?.current) {
      aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  return (
    <div className="invoice-popup-card invoice-ai-popup" ref={popupRef}>
      {/* Header */}
      <div className="invoice-popup-header">
        <div className="invoice-popup-header-left">
          <div className="invoice-popup-icon ai-header-icon">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M12 3C12 7.97 7.97 12 3 12C7.97 12 12 16.03 12 21C12 16.03 16.03 12 21 12C16.03 12 12 7.97 12 3Z"
                stroke="#00BFA5"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx="12" cy="12" r="2" fill="#00BFA5" />
              <circle cx="18.5" cy="5.5" r="1.5" fill="#00BFA5" />
            </svg>
          </div>
          <h2 className="invoice-popup-title">AI Assistant</h2>
        </div>
        <button
          type="button"
          className="invoice-popup-close-btn"
          onClick={onClose}
          aria-label="Close AI Assistant"
        >
          <X size={16} />
        </button>
      </div>

      {/* Body */}
      <div className="invoice-ai-body">
        <div className="invoice-ai-subhead">{promptQuestion}</div>

        {messages.length === 0 ? (
          /* Suggestions view */
          <div className="invoice-ai-suggestions-view">
            <div className="invoice-ai-section-title">AI suggestions</div>
            <div className="invoice-ai-suggestions-list">
              {suggestions.map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  className="invoice-ai-suggestion-chip"
                  onClick={() => onSuggestion?.(sugg)}
                >
                  <span className="invoice-ai-suggestion-text">{sugg}</span>
                  <span className="invoice-ai-suggestion-chevron">
                    <ChevronRight size={14} />
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Chat thread */
          <div className="invoice-ai-chat-thread">
            <div className="invoice-ai-chat-header-row">
              <span className="invoice-ai-chat-active-label">Conversation</span>
              <button
                type="button"
                className="invoice-ai-clear-btn"
                onClick={onClearChat}
              >
                Reset suggestions
              </button>
            </div>
            <div className="invoice-ai-messages-list">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`invoice-ai-msg ${
                    msg.sender === 'user' ? 'user' : 'assistant'
                  }`}
                >
                  {msg.sender === 'assistant' && (
                    <div className="invoice-ai-msg-avatar">
                      <Sparkles size={14} color="#00BFA5" />
                    </div>
                  )}
                  <div className="invoice-ai-msg-bubble">
                    <div className="invoice-ai-msg-text">{msg.text}</div>
                    <div className="invoice-ai-msg-time">{msg.time}</div>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="invoice-ai-msg assistant typing">
                  <div className="invoice-ai-msg-avatar">
                    <Sparkles size={14} color="#00BFA5" />
                  </div>
                  <div className="invoice-ai-msg-bubble typing-bubble">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </div>
                </div>
              )}
              <div ref={aiChatEndRef} />
            </div>
          </div>
        )}

        {/* Input Form */}
        <form className="invoice-ai-input-form" onSubmit={onSubmit}>
          <input
            type="text"
            className="invoice-ai-input"
            placeholder="Ask anything..."
            value={input}
            onChange={(e) => onInputChange?.(e.target.value)}
            aria-label="Ask AI a question"
          />
          <button
            type="submit"
            className="invoice-ai-send-btn"
            aria-label="Send query"
            disabled={!input.trim()}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>

        <div className="invoice-ai-disclaimer">
          AI can make mistakes. Please verify important information.
        </div>
      </div>
    </div>
  );
};

export default AiAssistantPopup;
