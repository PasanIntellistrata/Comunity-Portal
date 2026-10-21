import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  Calendar,
  Landmark,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Download,
  Plus,
  ArrowRight,
  ShieldCheck,
  Building2,
  FileText,
  ChevronDown,
  TrendingUp,
  Receipt,
  Eye,
  X,
  Check,
  Search,
  CheckCheck,
  HelpCircle,
  ChevronRight,
} from 'lucide-react';
import { formatCurrency } from '../js/data/payment-plan-data.js';
import { PROPERTIES as FALLBACK_PROPERTIES } from '../js/data/invoice-data.js';
import MobilePropertyLotPicker from './MobilePropertyLotPicker.jsx';

/**
 * MobilePaymentPlanView
 * Modern Enterprise & Fintech Experience for Payment Plans on Mobile (<= 900px)
 */
const MobilePaymentPlanView = ({
  selectedProperty,
  effectiveLot,
  properties = [],
  onSelectProperty,
  currentPlan,
  progressPct = 0,
  onApply,
  onPay,
  onSelectReceipt,
  onSelectLot,
  showToast,
}) => {
  // Mobile Tabs: 'schedule' | 'history' | 'details'
  const [activeTab, setActiveTab] = useState('schedule');

  // Search in payment history
  const [searchTerm, setSearchTerm] = useState('');


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
    const list = currentPlan.history || [];
    if (!searchTerm.trim()) return list;
    const q = searchTerm.toLowerCase();
    return list.filter(
      (item) =>
        item.installment.toLowerCase().includes(q) ||
        item.paidDate.toLowerCase().includes(q) ||
        item.amount.toLowerCase().includes(q) ||
        item.method.toLowerCase().includes(q) ||
        item.status.toLowerCase().includes(q)
    );
  }, [currentPlan.history, searchTerm]);

  return (
    <div className="payment-plan-mobile-view">
      {/* ── 1. SCHEME & LOT CONTEXT BAR ── */}
      <div className="mobile-pp-context-card">
        <MobilePropertyLotPicker
          selectedProperty={selectedProperty}
          selectedLot={effectiveLot}
          properties={effectiveProperties}
          onSelectProperty={onSelectProperty}
          onSelectLot={onSelectLot}
          showToast={showToast}
        />
      </div>

      {/* ── 2. FINTECH HERO BALANCE & INSTALLMENT CARD ── */}
      {currentPlan.hasPlan ? (
        <section className="mobile-pp-hero-card" aria-label="Active Payment Plan">
          <div className="mobile-pp-hero-pattern" />

          <div className="mobile-pp-hero-header">
            <div className="mobile-pp-hero-badge-wrap">
              <ShieldCheck size={14} />
              <span>Active Payment Agreement</span>
            </div>
            <span className="mobile-pp-hero-freq-pill">{currentPlan.frequency}</span>
          </div>

          <div className="mobile-pp-hero-amount-row">
            <div>
              <span className="mobile-pp-hero-label">Remaining Balance Due</span>
              <div className="mobile-pp-hero-amount">
                {formatCurrency(currentPlan.dueAmount)}
              </div>
            </div>
            <div className="mobile-pp-hero-installment-preview">
              <span className="mobile-pp-hero-label">Next Installment</span>
              <div className="mobile-pp-hero-inst-val">
                {formatCurrency(currentPlan.nextPaymentAmount || currentPlan.installmentAmount)}
              </div>
              <span className="mobile-pp-hero-inst-due">Due {currentPlan.nextPaymentDate}</span>
            </div>
          </div>

          {/* Progress Bar & Subtext */}
          <div className="mobile-pp-hero-progress-box">
            <div className="mobile-pp-hero-progress-labels">
              <span>Agreement Progress</span>
              <strong>{progressPct}% Paid</strong>
            </div>
            <div className="mobile-pp-hero-progress-track">
              <div
                className="mobile-pp-hero-progress-fill"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <div className="mobile-pp-hero-progress-meta">
              <span>Paid {formatCurrency(currentPlan.amountPaid)}</span>
              <span>Total Agreed {formatCurrency(currentPlan.agreedAmount)}</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mobile-pp-hero-actions-row">
            <button
              type="button"
              className="mobile-pp-hero-btn-pay"
              onClick={onPay}
            >
              <DollarSign size={15} />
              <span>Pay {formatCurrency(currentPlan.nextPaymentAmount || currentPlan.installmentAmount)}</span>
            </button>

            <button
              type="button"
              className="mobile-pp-hero-btn-doc"
              onClick={() => {
                if (showToast) showToast('Downloading Payment Plan Agreement (PDF)...', 'success');
              }}
            >
              <FileText size={14} />
              <span>Agreement</span>
            </button>
          </div>
        </section>
      ) : (
        <section className="mobile-pp-no-plan-hero" aria-label="No Payment Plan Active">
          <div className="mobile-pp-no-plan-icon">
            <CreditCard size={24} />
          </div>
          <h2 className="mobile-pp-no-plan-title">No Active Payment Plan</h2>
          <p className="mobile-pp-no-plan-desc">
            You currently have no payment plan registered for <strong>{effectiveLot}</strong>. You can spread overdue or upcoming strata levies into manageable weekly, fortnightly, or monthly installments.
          </p>
          <button
            type="button"
            className="mobile-pp-btn-apply-hero"
            onClick={onApply}
          >
            <Plus size={16} />
            <span>Apply for Strata Payment Plan</span>
          </button>
        </section>
      )}

      {/* ── 3. 2x2 COMPACT METRICS GRID ── */}
      <section className="mobile-pp-metrics-grid" aria-label="Key Plan Metrics">
        {/* Metric 1: Agreed */}
        <div className="mobile-pp-metric-item">
          <div className="mobile-pp-metric-top">
            <span className="mobile-pp-metric-label">Agreed Plan</span>
            <div className="mobile-pp-metric-icon blue">
              <FileText size={14} />
            </div>
          </div>
          <div className="mobile-pp-metric-val">{formatCurrency(currentPlan.agreedAmount)}</div>
          <div className="mobile-pp-metric-sub">
            {currentPlan.hasPlan ? `${currentPlan.totalInstallments} installments` : 'No plan active'}
          </div>
        </div>

        {/* Metric 2: Remaining Due */}
        <div className="mobile-pp-metric-item">
          <div className="mobile-pp-metric-top">
            <span className="mobile-pp-metric-label">Balance Due</span>
            <div className="mobile-pp-metric-icon amber">
              <Clock size={14} />
            </div>
          </div>
          <div className="mobile-pp-metric-val">{formatCurrency(currentPlan.dueAmount)}</div>
          <div className="mobile-pp-metric-sub">
            {currentPlan.hasPlan && currentPlan.dueAmount > 0
              ? `Next: ${formatCurrency(currentPlan.nextPaymentAmount)}`
              : 'Settled'}
          </div>
        </div>

        {/* Metric 3: Amount Paid */}
        <div className="mobile-pp-metric-item">
          <div className="mobile-pp-metric-top">
            <span className="mobile-pp-metric-label">Total Paid</span>
            <div className="mobile-pp-metric-icon emerald">
              <TrendingUp size={14} />
            </div>
          </div>
          <div className="mobile-pp-metric-val">{formatCurrency(currentPlan.amountPaid)}</div>
          <div className="mobile-pp-metric-sub">
            {currentPlan.hasPlan
              ? `${currentPlan.completedInstallments} settled`
              : '$0.00 paid'}
          </div>
        </div>

        {/* Metric 4: Paid On Time */}
        <div className="mobile-pp-metric-item">
          <div className="mobile-pp-metric-top">
            <span className="mobile-pp-metric-label">Payment Track</span>
            <div className="mobile-pp-metric-icon purple">
              <CheckCircle2 size={14} />
            </div>
          </div>
          <div className="mobile-pp-metric-val">{currentPlan.paidOnTime}</div>
          <div className="mobile-pp-metric-sub">Zero dishonour fees</div>
        </div>
      </section>

      {/* ── 4. STICKY SEGMENTED NAVIGATION BAR ── */}
      <div className="mobile-pp-nav-container">
        <nav className="mobile-pp-segmented-bar" aria-label="Payment Plan Sections">
          <button
            type="button"
            className={`mobile-pp-seg-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            <Calendar size={13} />
            <span>Schedule</span>
          </button>

          <button
            type="button"
            className={`mobile-pp-seg-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            <Receipt size={13} />
            <span>History</span>
            <span className="mobile-pp-seg-count">{(currentPlan.history || []).length}</span>
          </button>

          <button
            type="button"
            className={`mobile-pp-seg-btn ${activeTab === 'details' ? 'active' : ''}`}
            onClick={() => setActiveTab('details')}
          >
            <FileText size={13} />
            <span>Terms</span>
          </button>
        </nav>
      </div>

      {/* ── 5. TAB CONTENTS ── */}

      {/* TAB 1: UPCOMING SCHEDULE */}
      {activeTab === 'schedule' && (
        <div className="mobile-pp-tab-pane">
          {/* Direct Debit Info Box */}
          <div className="mobile-pp-auto-debit-box">
            <div className="mobile-pp-auto-debit-icon">
              <CheckCircle2 size={16} />
            </div>
            <div>
              <div className="mobile-pp-auto-debit-title">Auto-Debit Active</div>
              <p className="mobile-pp-auto-debit-text">
                Your direct debit via Commonwealth Bank (•••• 4821) is active. The next installment of {formatCurrency(currentPlan.nextPaymentAmount || currentPlan.installmentAmount)} will be debited on {currentPlan.nextPaymentDate}.
              </p>
            </div>
          </div>

          {/* Sequence of Scheduled Installments */}
          <div className="mobile-pp-schedule-list">
            {(currentPlan.schedule || []).map((item, idx) => {
              const isPending = item.status.toLowerCase() === 'pending' || item.status.toLowerCase().includes('due');
              return (
                <div key={item.id || idx} className="mobile-pp-schedule-card">
                  <div className="mobile-pp-schedule-card-left">
                    <div className="mobile-pp-schedule-card-icon">
                      <Calendar size={14} />
                    </div>
                    <div>
                      <div className="mobile-pp-schedule-inst-label">
                        {item.installment || `Installment ${idx + 1}`}
                      </div>
                      <div className="mobile-pp-schedule-due-date">{item.dueDate}</div>
                    </div>
                  </div>

                  <div className="mobile-pp-schedule-card-right">
                    <span className="mobile-pp-schedule-amount">{item.amount}</span>
                    <span className={`mobile-pp-status-badge ${isPending ? 'pending' : 'scheduled'}`}>
                      {isPending ? 'Next Due' : 'Scheduled'}
                    </span>
                  </div>
                </div>
              );
            })}

            {(!currentPlan.schedule || currentPlan.schedule.length === 0) && (
              <div className="mobile-pp-empty-state">
                No scheduled installments found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENT HISTORY & RECEIPTS */}
      {activeTab === 'history' && (
        <div className="mobile-pp-tab-pane">
          {/* Search Box */}
          <div className="mobile-pp-search-box">
            <Search size={14} />
            <input
              type="text"
              className="mobile-pp-search-input"
              placeholder="Search installments, dates, methods..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <X
                size={13}
                style={{ cursor: 'pointer', color: '#94a3b8' }}
                onClick={() => setSearchTerm('')}
              />
            )}
          </div>

          {/* History Cards List */}
          <div className="mobile-pp-history-list">
            {filteredHistory.map((item, idx) => (
              <div key={item.id || idx} className="mobile-pp-history-card">
                <div className="mobile-pp-history-card-header">
                  <div className="mobile-pp-history-inst-group">
                    <span className="mobile-pp-history-inst-name">{item.installment}</span>
                    <span className="mobile-pp-status-badge paid">
                      <CheckCircle2 size={10} />
                      <span>{item.status}</span>
                    </span>
                  </div>
                  <span className="mobile-pp-history-amount">{item.amount}</span>
                </div>

                <div className="mobile-pp-history-card-body">
                  <div className="mobile-pp-history-detail-row">
                    <span className="mobile-pp-history-detail-lbl">Paid Date:</span>
                    <span className="mobile-pp-history-detail-val">{item.paidDate}</span>
                  </div>
                  <div className="mobile-pp-history-detail-row">
                    <span className="mobile-pp-history-detail-lbl">Payment Method:</span>
                    <span className="mobile-pp-history-detail-val">{item.method}</span>
                  </div>
                </div>

                <div className="mobile-pp-history-card-footer">
                  <button
                    type="button"
                    className="mobile-pp-btn-receipt-view"
                    onClick={() => {
                      if (onSelectReceipt) onSelectReceipt(item);
                    }}
                  >
                    <Eye size={12} />
                    <span>View</span>
                  </button>

                  <button
                    type="button"
                    className="mobile-pp-btn-receipt-download"
                    onClick={() => {
                      if (showToast) showToast(`Downloading official receipt for ${item.installment} (PDF)...`, 'success');
                    }}
                  >
                    <Download size={12} />
                    <span>Download Receipt</span>
                  </button>
                </div>
              </div>
            ))}

            {filteredHistory.length === 0 && (
              <div className="mobile-pp-empty-state">
                No payment history records found.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: AGREEMENT DETAILS & TERMS */}
      {activeTab === 'details' && (
        <div className="mobile-pp-tab-pane">
          <div className="mobile-pp-details-card">
            <div className="mobile-pp-details-card-header">
              <div className="mobile-pp-details-card-icon">
                <FileText size={15} />
              </div>
              <div>
                <h3 className="mobile-pp-details-card-title">Agreement Specifications</h3>
                <span className="mobile-pp-details-card-sub">Legally binding strata settlement plan</span>
              </div>
            </div>

            <div className="mobile-pp-details-list">
              <div className="mobile-pp-detail-row">
                <span className="mobile-pp-detail-lbl">Agreement Status</span>
                <span className="mobile-pp-status-badge active">{currentPlan.statusLabel || 'ACTIVE'}</span>
              </div>

              <div className="mobile-pp-detail-row">
                <span className="mobile-pp-detail-lbl">Plan Frequency</span>
                <span className="mobile-pp-detail-val bold">{currentPlan.frequency}</span>
              </div>

              <div className="mobile-pp-detail-row">
                <span className="mobile-pp-detail-lbl">Agreement Start</span>
                <span className="mobile-pp-detail-val">{currentPlan.planStarted}</span>
              </div>

              <div className="mobile-pp-detail-row">
                <span className="mobile-pp-detail-lbl">Projected Discharge</span>
                <span className="mobile-pp-detail-val">{currentPlan.planEnds}</span>
              </div>

              <div className="mobile-pp-detail-row">
                <span className="mobile-pp-detail-lbl">Installment Amount</span>
                <span className="mobile-pp-detail-val bold teal-text">
                  {formatCurrency(currentPlan.installmentAmount)}
                </span>
              </div>

              <div className="mobile-pp-detail-row">
                <span className="mobile-pp-detail-lbl">Default Payment Method</span>
                <span className="mobile-pp-detail-val">{currentPlan.paymentMethod || 'Direct Debit'}</span>
              </div>

              <div className="mobile-pp-detail-row">
                <span className="mobile-pp-detail-lbl">Committee Review</span>
                <span className="mobile-pp-detail-val">Approved &bull; No Penalties Applied</span>
              </div>
            </div>

            <div className="mobile-pp-details-footer">
              <button
                type="button"
                className="mobile-pp-btn-download-full"
                onClick={() => {
                  if (showToast) showToast('Downloading complete Executed Agreement (PDF)...', 'success');
                }}
              >
                <Download size={14} />
                <span>Download Executed Agreement (PDF)</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobilePaymentPlanView;
