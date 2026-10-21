import React, { useState, useMemo, useCallback } from 'react';
import {
  Wallet,
  Calendar,
  Download,
  FileText,
  Landmark,
  PiggyBank,
  Wrench,
  ChevronRight,
  ChevronDown,
  ArrowDownToLine,
  CheckCircle2,
  Clock,
  Building,
  Building2,
  CreditCard,
  Search,
  Check,
  X,
  ShieldCheck,
  Copy,
  ExternalLink,
  DollarSign,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import { PROPERTIES as FALLBACK_PROPERTIES } from '../js/data/invoice-data.js';
import MobilePropertyLotPicker from './MobilePropertyLotPicker.jsx';

/**
 * MobileLevyView
 * Modern Enterprise & Fintech Experience for My Levy / Levy Overview on Mobile
 */
const MobileLevyView = ({
  selectedProperty,
  selectedLot,
  properties = [],
  onSelectProperty,
  onSelectLot,
  totalAmount = 3240,
  levyFunds = [],
  donutSegments = [],
  paymentHistory = [],
  upcomingPayments = [],
  showToast,
  onNavigate,
}) => {
  // Mobile Segments: 'breakdown' | 'history' | 'schedule' | 'payinfo'
  const [activeSegment, setActiveSegment] = useState('breakdown');

  // Search in payment history
  const [searchTerm, setSearchTerm] = useState('');

  // Payment Bottom Sheet
  const [isPaySheetOpen, setIsPaySheetOpen] = useState(false);
  const [selectedPayOption, setSelectedPayOption] = useState('card');
  const [payAmountType, setPayAmountType] = useState('installment'); // 'installment' | 'full'


  // Effective properties list
  const effectiveProperties = properties && properties.length > 0 ? properties : FALLBACK_PROPERTIES;

  // Available lots list
  const availableLots = selectedProperty?.lots || [
    'All Lots',
    'Lot A-01',
    'Lot A-02',
    'Lot A-03',
    'Lot B-01',
    'Lot B-02',
  ];

  // Filtered payment history
  const filteredHistory = useMemo(() => {
    if (!searchTerm.trim()) return paymentHistory;
    const q = searchTerm.toLowerCase();
    return paymentHistory.filter(
      (p) =>
        p.id.toLowerCase().includes(q) ||
        p.dueDate.toLowerCase().includes(q) ||
        p.amount.toLowerCase().includes(q) ||
        p.paidDate.toLowerCase().includes(q) ||
        p.method.toLowerCase().includes(q)
    );
  }, [paymentHistory, searchTerm]);

  // Copy helper
  const handleCopy = (text, label) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    }
    if (showToast) showToast(`${label} copied to clipboard`, 'success');
  };

  // Payment confirmation
  const handleConfirmPayment = () => {
    setIsPaySheetOpen(false);
    const amountStr = payAmountType === 'installment' ? '$810.00' : `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
    if (showToast) {
      showToast(`Payment of ${amountStr} successful! Receipt generated.`, 'success');
    }
  };

  return (
    <div className="levy-mobile-view">
      {/* ── 1. CONTEXT / SCHEME BAR ── */}
      <div className="mobile-levy-context-card">
        <MobilePropertyLotPicker
          selectedProperty={selectedProperty}
          selectedLot={selectedLot}
          properties={effectiveProperties}
          onSelectProperty={onSelectProperty}
          onSelectLot={onSelectLot}
          showToast={showToast}
        />
      </div>

      {/* ── 2. ENTERPRISE FINTECH HERO CARD ── */}
      <section className="mobile-levy-hero-card" aria-label="Total Outstanding Levy">
        <div className="mobile-levy-hero-pattern" />

        <div className="mobile-levy-hero-header">
          <div className="mobile-levy-hero-label-wrap">
            <ShieldCheck size={14} />
            <span>Total Levy Balance</span>
          </div>
          <span className="mobile-levy-hero-status-pill">Due in 15 days</span>
        </div>

        <div className="mobile-levy-hero-amount-row">
          <span className="mobile-levy-hero-amount">
            ${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </span>
          <span className="mobile-levy-hero-total-tag">AUD</span>
        </div>

        <div className="mobile-levy-hero-meta-bar">
          <div className="mobile-levy-hero-meta-item">
            <Calendar size={13} />
            <span>Due 20 Aug 2026</span>
          </div>
          <div className="mobile-levy-hero-meta-item">
            <Wallet size={13} />
            <span>Installment: <strong>$810.00</strong></span>
          </div>
        </div>

        <div className="mobile-levy-hero-actions-row">
          <button
            type="button"
            className="mobile-levy-hero-btn-pay"
            onClick={() => setIsPaySheetOpen(true)}
          >
            <CreditCard size={15} />
            <span>Pay $810.00</span>
          </button>

          <button
            type="button"
            className="mobile-levy-hero-btn-statement"
            onClick={() => {
              if (showToast) showToast(`Downloading Levy Statement for ${selectedLot} (PDF)...`, 'success');
            }}
          >
            <ArrowDownToLine size={13} />
            <span>Statement</span>
          </button>
        </div>
      </section>

      {/* ── 3. SEGMENTED NAVIGATION BAR ── */}
      <div className="mobile-levy-nav-container">
        <nav className="mobile-levy-segmented-bar" aria-label="Levy Sections">
          <button
            type="button"
            className={`mobile-levy-seg-btn ${activeSegment === 'breakdown' ? 'active' : ''}`}
            onClick={() => setActiveSegment('breakdown')}
          >
            <Wallet size={13} />
            <span>Breakdown</span>
          </button>

          <button
            type="button"
            className={`mobile-levy-seg-btn ${activeSegment === 'history' ? 'active' : ''}`}
            onClick={() => setActiveSegment('history')}
          >
            <FileText size={13} />
            <span>History</span>
            <span className="mobile-levy-seg-count">{paymentHistory.length}</span>
          </button>

          <button
            type="button"
            className={`mobile-levy-seg-btn ${activeSegment === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveSegment('schedule')}
          >
            <Calendar size={13} />
            <span>Schedule</span>
          </button>

          <button
            type="button"
            className={`mobile-levy-seg-btn ${activeSegment === 'payinfo' ? 'active' : ''}`}
            onClick={() => setActiveSegment('payinfo')}
          >
            <Landmark size={13} />
            <span>Pay Info</span>
          </button>
        </nav>
      </div>

      {/* ── 4. TAB CONTENTS ── */}

      {/* TAB 1: FUND BREAKDOWN */}
      {activeSegment === 'breakdown' && (
        <div className="mobile-levy-tab-pane">
          <div className="mobile-levy-breakdown-card">
            {/* Donut Chart */}
            <div className="mobile-levy-chart-wrap">
              <svg
                className="mobile-levy-donut-svg"
                viewBox="0 0 200 200"
              >
                {/* Background track */}
                <circle
                  cx="100"
                  cy="100"
                  r="70"
                  fill="none"
                  stroke="#f1f5f9"
                  strokeWidth="18"
                />

                {/* Segments */}
                {donutSegments.map((segment) => (
                  <circle
                    key={segment.id}
                    cx="100"
                    cy="100"
                    r="70"
                    fill="none"
                    stroke={segment.color}
                    strokeWidth="18"
                    strokeDasharray={segment.strokeDasharray}
                    strokeDashoffset={segment.strokeDashoffset}
                    strokeLinecap="butt"
                    style={{
                      transform: 'rotate(-90deg)',
                      transformOrigin: '100px 100px',
                    }}
                  />
                ))}

                <text
                  x="100"
                  y="92"
                  textAnchor="middle"
                  className="mobile-levy-donut-center-lbl"
                >
                  Total Due
                </text>
                <text
                  x="100"
                  y="114"
                  textAnchor="middle"
                  className="mobile-levy-donut-center-val"
                >
                  ${totalAmount.toLocaleString()}
                </text>
              </svg>
            </div>

            {/* Interactive Fund Cards */}
            <div className="mobile-levy-funds-list">
              {levyFunds.map((fund) => {
                let iconClass = '';
                if (fund.id === 'sinking') iconClass = 'sinking';
                else if (fund.id === 'reserve') iconClass = 'reserve';
                else if (fund.id === 'maintenance') iconClass = 'maintenance';

                const FundIcon = fund.icon || Wallet;

                return (
                  <div key={fund.id} className="mobile-levy-fund-item">
                    <div className="mobile-levy-fund-item-top">
                      <div className="mobile-levy-fund-identity">
                        <div className={`mobile-levy-fund-icon-circle ${iconClass}`}>
                          <FundIcon size={14} />
                        </div>
                        <span className="mobile-levy-fund-name">{fund.name}</span>
                      </div>

                      <div className="mobile-levy-fund-values">
                        <span className="mobile-levy-fund-amount">
                          ${fund.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </span>
                        <span className="mobile-levy-fund-pct-badge">{fund.percentage}%</span>
                      </div>
                    </div>

                    <div className="mobile-levy-progress-track">
                      <div
                        className="mobile-levy-progress-fill"
                        style={{
                          width: `${fund.percentage}%`,
                          backgroundColor: fund.color,
                        }}
                      />
                    </div>

                    <p className="mobile-levy-fund-desc">{fund.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT HISTORY */}
      {activeSegment === 'history' && (
        <div className="mobile-levy-tab-pane">
          {/* Search Bar */}
          <div className="mobile-levy-search-bar">
            <Search size={15} />
            <input
              type="text"
              className="mobile-levy-search-input"
              placeholder="Search invoices, dates, payment methods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X
                size={14}
                style={{ cursor: 'pointer', color: '#94a3b8' }}
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>

          {/* Transaction Cards List */}
          {filteredHistory.map((item) => (
            <div key={item.id} className="mobile-levy-history-card">
              <div className="mobile-levy-history-header">
                <span className="mobile-levy-inv-badge">{item.id}</span>
                <span className="mobile-levy-status-pill paid">
                  <CheckCircle2 size={10} />
                  <span>{item.status}</span>
                </span>
              </div>

              <div className="mobile-levy-history-body">
                <div>
                  <span className="mobile-levy-history-amount">{item.amount}</span>
                </div>
                <div className="mobile-levy-history-details">
                  <span className="mobile-levy-history-date">Paid: {item.paidDate}</span>
                  <span className="mobile-levy-history-method">{item.method}</span>
                </div>
              </div>

              <div className="mobile-levy-history-footer">
                <button
                  type="button"
                  className="mobile-levy-receipt-btn"
                  onClick={() => {
                    if (showToast) showToast(`Downloading Receipt for ${item.id} (PDF)...`, 'success');
                  }}
                >
                  <FileText size={12} />
                  <span>Download Receipt</span>
                </button>
              </div>
            </div>
          ))}

          {filteredHistory.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 16px', color: '#64748b', fontSize: 13 }}>
              No payments match your search criteria.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: UPCOMING PAYMENT SCHEDULE */}
      {activeSegment === 'schedule' && (
        <div className="mobile-levy-tab-pane">
          {/* Direct Debit Info Banner */}
          <div className="mobile-levy-auto-debit-box">
            <div className="mobile-levy-auto-debit-icon">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="mobile-levy-auto-debit-title">Auto-Debit Scheduled</div>
              <p className="mobile-levy-auto-debit-text">
                Your direct debit via Commonwealth Bank (ending in 4821) is active. The next quarterly installment of $810.00 will be debited automatically on 20 Aug 2026.
              </p>
            </div>
          </div>

          {/* Schedule Sequence Cards */}
          {upcomingPayments.map((item, idx) => {
            const isPending = item.status.toLowerCase() === 'pending';
            return (
              <div key={item.id} className="mobile-levy-schedule-item">
                <div className="mobile-levy-schedule-left">
                  <div className="mobile-levy-schedule-icon">
                    <Calendar size={15} />
                  </div>
                  <div>
                    <div className="mobile-levy-schedule-due-label">
                      {idx === 0 ? 'Next Due' : `Installment ${idx + 1}`}
                    </div>
                    <div className="mobile-levy-schedule-due-date">{item.dueDate}</div>
                  </div>
                </div>

                <div className="mobile-levy-schedule-right">
                  <span className="mobile-levy-schedule-amount">{item.amount}</span>
                  <span
                    className={`mobile-levy-status-pill ${isPending ? 'pending' : 'scheduled'}`}
                  >
                    {isPending ? 'Next Due' : 'Scheduled'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 4: PAYMENT INFO & BPAY */}
      {activeSegment === 'payinfo' && (
        <div className="mobile-levy-tab-pane">
          {/* BPAY Details Card */}
          <div className="mobile-levy-info-card">
            <div className="mobile-levy-info-card-header">
              <div className="mobile-levy-info-card-title-group">
                <div className="mobile-levy-info-card-icon">
                  <CreditCard size={15} />
                </div>
                <span>BPAY Payment Information</span>
              </div>
            </div>

            <div className="mobile-levy-info-list">
              <div className="mobile-levy-info-row">
                <span className="mobile-levy-info-label">Biller Code</span>
                <div className="mobile-levy-info-val-wrap">
                  <span className="mobile-levy-info-val">29841</span>
                  <button
                    type="button"
                    className="mobile-levy-copy-btn"
                    onClick={() => handleCopy('29841', 'Biller Code')}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="mobile-levy-info-row">
                <span className="mobile-levy-info-label">Reference Number</span>
                <div className="mobile-levy-info-val-wrap">
                  <span className="mobile-levy-info-val">1029 4812 003</span>
                  <button
                    type="button"
                    className="mobile-levy-copy-btn"
                    onClick={() => handleCopy('10294812003', 'BPAY Reference')}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="mobile-levy-info-row">
                <span className="mobile-levy-info-label">Biller Name</span>
                <span className="mobile-levy-info-val" style={{ fontFamily: 'inherit' }}>
                  DEMOX Strata Levies
                </span>
              </div>
            </div>
          </div>

          {/* Bank Transfer Card */}
          <div className="mobile-levy-info-card">
            <div className="mobile-levy-info-card-header">
              <div className="mobile-levy-info-card-title-group">
                <div className="mobile-levy-info-card-icon blue">
                  <Landmark size={15} />
                </div>
                <span>Direct Bank Transfer (EFT)</span>
              </div>
            </div>

            <div className="mobile-levy-info-list">
              <div className="mobile-levy-info-row">
                <span className="mobile-levy-info-label">Bank</span>
                <span className="mobile-levy-info-val" style={{ fontFamily: 'inherit' }}>
                  Macquarie Bank
                </span>
              </div>

              <div className="mobile-levy-info-row">
                <span className="mobile-levy-info-label">Account Name</span>
                <span className="mobile-levy-info-val" style={{ fontFamily: 'inherit' }}>
                  Owners SP ABC1313
                </span>
              </div>

              <div className="mobile-levy-info-row">
                <span className="mobile-levy-info-label">BSB</span>
                <div className="mobile-levy-info-val-wrap">
                  <span className="mobile-levy-info-val">182-512</span>
                  <button
                    type="button"
                    className="mobile-levy-copy-btn"
                    onClick={() => handleCopy('182512', 'BSB')}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div className="mobile-levy-info-row">
                <span className="mobile-levy-info-label">Account Number</span>
                <div className="mobile-levy-info-val-wrap">
                  <span className="mobile-levy-info-val">8492 1092</span>
                  <button
                    type="button"
                    className="mobile-levy-copy-btn"
                    onClick={() => handleCopy('84921092', 'Account Number')}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. PAY INSTALLMENT BOTTOM SHEET ── */}
      {isPaySheetOpen && (
        <div
          className="mobile-levy-sheet-overlay"
          onClick={() => setIsPaySheetOpen(false)}
        >
          <div
            className="mobile-levy-sheet-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-levy-sheet-drag-handle" />

            <div className="mobile-levy-sheet-header">
              <h3 className="mobile-levy-sheet-title">Pay Levy</h3>
              <button
                type="button"
                className="mobile-levy-sheet-close"
                onClick={() => setIsPaySheetOpen(false)}
              >
                <X size={16} />
              </button>
            </div>

            {/* Amount Selection */}
            <div className="mobile-levy-pay-amount-box">
              <div className="mobile-levy-pay-amount-lbl">
                {payAmountType === 'installment' ? 'Quarterly Installment Due' : 'Full Outstanding Balance'}
              </div>
              <div className="mobile-levy-pay-amount-val">
                {payAmountType === 'installment' ? '$810.00' : `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`}
              </div>
            </div>

            {/* Payment Options */}
            <div className="mobile-levy-pay-options-list">
              <div
                className={`mobile-levy-pay-option ${selectedPayOption === 'card' ? 'selected' : ''}`}
                onClick={() => setSelectedPayOption('card')}
              >
                <div className="mobile-levy-pay-option-left">
                  <CreditCard size={18} color="#0d9488" />
                  <div className="mobile-levy-pay-option-text">
                    <span className="mobile-levy-pay-option-name">Credit / Debit Card</span>
                    <span className="mobile-levy-pay-option-sub">Visa, Mastercard, AMEX</span>
                  </div>
                </div>
                {selectedPayOption === 'card' && <Check size={16} color="#0d9488" />}
              </div>

              <div
                className={`mobile-levy-pay-option ${selectedPayOption === 'applepay' ? 'selected' : ''}`}
                onClick={() => setSelectedPayOption('applepay')}
              >
                <div className="mobile-levy-pay-option-left">
                  <Wallet size={18} color="#0284c7" />
                  <div className="mobile-levy-pay-option-text">
                    <span className="mobile-levy-pay-option-name">Apple Pay / Google Pay</span>
                    <span className="mobile-levy-pay-option-sub">Instant biometric checkout</span>
                  </div>
                </div>
                {selectedPayOption === 'applepay' && <Check size={16} color="#0d9488" />}
              </div>

              <div
                className={`mobile-levy-pay-option ${selectedPayOption === 'debit' ? 'selected' : ''}`}
                onClick={() => setSelectedPayOption('debit')}
              >
                <div className="mobile-levy-pay-option-left">
                  <Landmark size={18} color="#10b981" />
                  <div className="mobile-levy-pay-option-text">
                    <span className="mobile-levy-pay-option-name">Direct Debit Account</span>
                    <span className="mobile-levy-pay-option-sub">CommBank (ending in 4821)</span>
                  </div>
                </div>
                {selectedPayOption === 'debit' && <Check size={16} color="#0d9488" />}
              </div>
            </div>

            <button
              type="button"
              className="mobile-levy-btn-confirm-pay"
              onClick={handleConfirmPayment}
            >
              Pay {payAmountType === 'installment' ? '$810.00' : `$${totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}`} Now
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileLevyView;
