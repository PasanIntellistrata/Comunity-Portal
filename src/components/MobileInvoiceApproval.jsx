import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search,
  X,
  SlidersHorizontal,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Clock,
  DollarSign,
  Building2,
  Calendar,
  Download,
  FileText,
  User,
  Check,
  ChevronRight,
  ChevronDown,
  Layers,
  Wrench,
  Zap,
  Sparkles,
  Shield,
  Trees,
  Droplets,
  Paperclip,
  CheckSquare,
  Square,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { PROPERTIES as FALLBACK_PROPERTIES } from '../js/data/invoice-data.js';
import MobilePropertyLotPicker from './MobilePropertyLotPicker.jsx';

/**
 * Category meta helper for modern mobile cards
 */
export const getCategoryMeta = (category, vendor) => {
  const cat = (category || '').toLowerCase();
  const v = (vendor || '').toLowerCase();

  if (cat.includes('plumb') || v.includes('plumb')) {
    return {
      name: 'Plumbing',
      icon: Droplets,
      bg: 'rgba(6, 182, 212, 0.12)',
      color: '#0891b2',
      badgeBg: 'rgba(6, 182, 212, 0.1)',
      borderColor: 'rgba(6, 182, 212, 0.25)',
    };
  }
  if (cat.includes('elect') || v.includes('spark') || v.includes('elect')) {
    return {
      name: 'Electrical',
      icon: Zap,
      bg: 'rgba(245, 158, 11, 0.14)',
      color: '#d97706',
      badgeBg: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
    };
  }
  if (cat.includes('clean') || v.includes('clean')) {
    return {
      name: 'Cleaning',
      icon: Sparkles,
      bg: 'rgba(13, 148, 136, 0.14)',
      color: '#0d9488',
      badgeBg: 'rgba(13, 148, 136, 0.1)',
      borderColor: 'rgba(13, 148, 136, 0.25)',
    };
  }
  if (cat.includes('garden') || cat.includes('landscap') || v.includes('green') || v.includes('landscap')) {
    return {
      name: 'Gardening',
      icon: Trees,
      bg: 'rgba(16, 185, 129, 0.14)',
      color: '#059669',
      badgeBg: 'rgba(16, 185, 129, 0.1)',
      borderColor: 'rgba(16, 185, 129, 0.25)',
    };
  }
  if (cat.includes('secur') || v.includes('guard') || v.includes('secur')) {
    return {
      name: 'Security',
      icon: Shield,
      bg: 'rgba(139, 92, 246, 0.14)',
      color: '#7c3aed',
      badgeBg: 'rgba(139, 92, 246, 0.1)',
      borderColor: 'rgba(139, 92, 246, 0.25)',
    };
  }
  if (cat.includes('lift') || v.includes('lift') || v.includes('elevat')) {
    return {
      name: 'Lifts',
      icon: ArrowUpDown,
      bg: 'rgba(99, 102, 241, 0.14)',
      color: '#4f46e5',
      badgeBg: 'rgba(99, 102, 241, 0.1)',
      borderColor: 'rgba(99, 102, 241, 0.25)',
    };
  }
  if (cat.includes('pool') || v.includes('pool') || v.includes('aqua')) {
    return {
      name: 'Pool Care',
      icon: Droplets,
      bg: 'rgba(14, 165, 233, 0.14)',
      color: '#0284c7',
      badgeBg: 'rgba(14, 165, 233, 0.1)',
      borderColor: 'rgba(14, 165, 233, 0.25)',
    };
  }
  return {
    name: category || 'Maintenance',
    icon: Wrench,
    bg: 'rgba(100, 116, 139, 0.14)',
    color: '#475569',
    badgeBg: 'rgba(100, 116, 139, 0.1)',
    borderColor: 'rgba(100, 116, 139, 0.25)',
  };
};

export const getInvoiceDetailInfo = (inv, propertyName, lotName) => {
  const numericAmount = parseFloat((inv.amount || '$0').replace(/[^0-9.]/g, '')) || 0;
  const gst = numericAmount * 0.1;
  const subtotal = Math.max(0, numericAmount - gst);

  const descriptions = {
    Plumbing: 'Emergency repair of burst copper pipe connection in Lot riser. Replaced elbow fitting, sealed isolation valves, and certified pressure test at 500 kPa.',
    Electrical: 'Scheduled 6-month emergency corridor exit lighting testing, emergency battery replacements, and main switchboard thermal scan inspection.',
    Cleaning: 'Bi-weekly common area deep cleaning, waste chute sanitization, foyer glass treatment, and basement foyer pressure wash.',
    Gardening: 'Seasonal pruning of perimeter boundary hedging, lawn fertilization, weeding, and irrigation drip inspection.',
    Security: 'Firmware upgrades on perimeter access control readers, keycard database backup, and CCTV camera lens alignment.',
    Lifts: 'Quarterly lift car hoistway guide lubrication, brake test calibration, and safety governor inspection (AS1735 certification).',
    'Pool Care': 'Water chemistry testing, replacement of chlorinator cell, filter backwashing, and deep vacuuming of pool tiles.',
    'Pest Control': 'Preventative treatment and bait station replenishment across subterranean basement car parks and perimeter grounds.'
  };

  const category = inv.category || 'Maintenance';
  const desc = descriptions[category] || 'Scheduled strata maintenance and certified service delivery according to property service agreement.';

  return {
    ...inv,
    subtotal: `$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    gst: `$${gst.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    description: desc,
    property: inv.property || propertyName || 'Green Valley Residence',
    lot: inv.lot || lotName || 'Lot A-03',
    fileName: `${inv.id}-${inv.vendor.replace(/[^a-zA-Z0-9]/g, '')}.pdf`,
    fileSize: '248 KB',
  };
};

/**
 * MobileInvoiceApproval — Dedicated mobile-first UI for Invoice Approvals
 */
const MobileInvoiceApproval = ({
  invoices,
  onApprove,
  onReject,
  onApproveSelected,
  onRejectSelected,
  selectedIds,
  onSelectRow,
  onSelectAll,
  selectedProperty,
  selectedLot,
  properties,
  onSelectProperty,
  onSelectLot,
  showToast,
  currentUser,
}) => {
  // Mobile UI States
  const [activeTab, setActiveTab] = useState('Pending'); // 'Pending' | 'Overdue' | 'Approved' | 'All'
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortOption, setSortOption] = useState('newest'); // 'newest' | 'amount-high' | 'amount-low' | 'due-soonest'
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('All');
  
  // Interactive Modals / Bottom Sheets
  const [activeDetailInvoice, setActiveDetailInvoice] = useState(null);
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Effective properties list
  const effectiveProperties = properties && properties.length > 0 ? properties : FALLBACK_PROPERTIES;

  // Pagination for mobile: progressive loading (e.g. 5 at a time)
  const [visibleCount, setVisibleCount] = useState(5);

  const searchInputRef = useRef(null);

  // Auto-focus search when opened
  useEffect(() => {
    if (isSearchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchVisible]);

  // Reset pagination count when filters change
  useEffect(() => {
    setVisibleCount(5);
  }, [activeTab, searchTerm, selectedCategory, sortOption, selectedVendorFilter, selectedProperty, selectedLot]);

  // Calculate dynamic counts and amounts for tabs
  const tabMetrics = useMemo(() => {
    const pendingInvs = invoices.filter((i) => i.status === 'Pending');
    const overdueInvs = invoices.filter((i) => i.status === 'Overdue');
    const approvedInvs = invoices.filter((i) => i.status === 'Approved');

    const sumPending = pendingInvs.reduce((acc, curr) => {
      const val = parseFloat((curr.amount || '$0').replace(/[^0-9.]/g, '')) || 0;
      return acc + val;
    }, 0);

    const sumOverdue = overdueInvs.reduce((acc, curr) => {
      const val = parseFloat((curr.amount || '$0').replace(/[^0-9.]/g, '')) || 0;
      return acc + val;
    }, 0);

    return {
      pendingCount: pendingInvs.length,
      overdueCount: overdueInvs.length,
      approvedCount: approvedInvs.length,
      totalCount: invoices.length,
      sumPending: `$${sumPending.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
      sumOverdue: `$${sumOverdue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }, [invoices]);

  // Unique categories list from current invoices
  const categoriesList = useMemo(() => {
    const set = new Set();
    invoices.forEach((inv) => {
      if (inv.category) set.add(inv.category);
    });
    return ['All', ...Array.from(set)];
  }, [invoices]);

  // Unique vendors list
  const vendorsList = useMemo(() => {
    const set = new Set();
    invoices.forEach((inv) => {
      if (inv.vendor) set.add(inv.vendor);
    });
    return ['All', ...Array.from(set)];
  }, [invoices]);

  // Filtered and sorted invoices
  const filteredInvoices = useMemo(() => {
    let list = invoices.filter((inv) => {
      // Tab Status
      if (activeTab === 'Pending' && inv.status !== 'Pending') return false;
      if (activeTab === 'Overdue' && inv.status !== 'Overdue') return false;
      if (activeTab === 'Approved' && inv.status !== 'Approved') return false;

      // Category
      if (selectedCategory !== 'All' && inv.category !== selectedCategory) return false;

      // Vendor
      if (selectedVendorFilter !== 'All' && inv.vendor !== selectedVendorFilter) return false;

      // Property & Lot
      if (inv.property && inv.property !== selectedProperty.name) return false;
      if (
        selectedLot !== 'All Lots' &&
        inv.lot &&
        inv.lot !== selectedLot &&
        inv.lot !== 'Common Area' &&
        inv.lot !== 'All Lots'
      ) {
        return false;
      }

      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matchesId = (inv.id || '').toLowerCase().includes(query);
        const matchesVendor = (inv.vendor || '').toLowerCase().includes(query);
        const matchesSubmitter = (inv.submittedBy || '').toLowerCase().includes(query);
        const matchesAmount = (inv.amount || '').toLowerCase().includes(query);
        const matchesCategory = (inv.category || '').toLowerCase().includes(query);
        if (!matchesId && !matchesVendor && !matchesSubmitter && !matchesAmount && !matchesCategory) {
          return false;
        }
      }

      return true;
    });

    // Sorting
    list = [...list].sort((a, b) => {
      const amountA = parseFloat((a.amount || '$0').replace(/[^0-9.]/g, '')) || 0;
      const amountB = parseFloat((b.amount || '$0').replace(/[^0-9.]/g, '')) || 0;

      if (sortOption === 'amount-high') return amountB - amountA;
      if (sortOption === 'amount-low') return amountA - amountB;
      if (sortOption === 'due-soonest') {
        const dateA = new Date(a.dueDate || '2026-05-01');
        const dateB = new Date(b.dueDate || '2026-05-01');
        return dateA - dateB;
      }
      // 'newest' default
      return (b.id || '').localeCompare(a.id || '');
    });

    return list;
  }, [
    invoices,
    activeTab,
    selectedCategory,
    selectedVendorFilter,
    selectedProperty,
    selectedLot,
    searchTerm,
    sortOption,
  ]);

  // Sliced for progressive mobile scroll
  const visibleInvoices = useMemo(() => {
    return filteredInvoices.slice(0, visibleCount);
  }, [filteredInvoices, visibleCount]);

  // Selected invoices summary
  const selectedSummary = useMemo(() => {
    const selectedList = invoices.filter((i) => selectedIds.has(i.id));
    const total = selectedList.reduce((acc, curr) => {
      const val = parseFloat((curr.amount || '$0').replace(/[^0-9.]/g, '')) || 0;
      return acc + val;
    }, 0);
    return {
      count: selectedList.length,
      amountFormatted: `$${total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    };
  }, [invoices, selectedIds]);

  // Check if any filter is active besides default tab
  const hasActiveFilters =
    selectedCategory !== 'All' ||
    selectedVendorFilter !== 'All' ||
    sortOption !== 'newest' ||
    Boolean(searchTerm.trim());

  const handleResetFilters = () => {
    setSelectedCategory('All');
    setSelectedVendorFilter('All');
    setSortOption('newest');
    setSearchTerm('');
    setIsSearchVisible(false);
    showToast('Filters reset', 'info');
  };

  const handleSingleApprove = (id, e) => {
    if (e) e.stopPropagation();
    onApprove(id);
    if (activeDetailInvoice && activeDetailInvoice.id === id) {
      setActiveDetailInvoice(null);
    }
  };

  const handleSingleReject = (id, e) => {
    if (e) e.stopPropagation();
    onReject(id);
    if (activeDetailInvoice && activeDetailInvoice.id === id) {
      setActiveDetailInvoice(null);
    }
  };

  const handleOpenDetail = (inv) => {
    setActiveDetailInvoice(getInvoiceDetailInfo(inv, selectedProperty.name, selectedLot));
  };

  return (
    <div className="invoice-mobile-view" id="invoice-mobile-container">
      {/* ── MOBILE HEADER / CONTEXT BAR ── */}
      <div className="mobile-invoice-header">
        <div className="mobile-header-top-row">
          <div>
            <div className="mobile-title-wrap">
              <h1 className="mobile-title">Invoice Approvals</h1>
              {tabMetrics.pendingCount > 0 && (
                <span className="mobile-title-count-pill">{tabMetrics.pendingCount} to review</span>
              )}
            </div>
            <MobilePropertyLotPicker
              selectedProperty={selectedProperty}
              selectedLot={selectedLot}
              properties={effectiveProperties}
              onSelectProperty={onSelectProperty}
              onSelectLot={onSelectLot}
              showToast={showToast}
            />
          </div>

          <div className="mobile-header-actions">
            <button
              type="button"
              className={`mobile-icon-action-btn ${isSearchVisible ? 'active' : ''}`}
              onClick={() => setIsSearchVisible((prev) => !prev)}
              title="Search invoices"
              aria-label="Toggle search"
            >
              <Search size={17} />
            </button>

            <button
              type="button"
              className={`mobile-select-toggle-btn ${isMultiSelectMode ? 'active' : ''}`}
              onClick={() => {
                setIsMultiSelectMode((prev) => !prev);
                if (isMultiSelectMode && selectedIds.size > 0) {
                  onSelectAll(false);
                }
              }}
              title="Batch select"
              aria-label="Batch select"
            >
              {isMultiSelectMode ? (
                <span>Done</span>
              ) : (
                <>
                  <CheckSquare size={14} />
                  <span>Select</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* ── ANIMATED EXPANDABLE SEARCH BAR ── */}
        {isSearchVisible && (
          <div className="mobile-search-bar-wrap">
            <Search size={15} className="mobile-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              className="mobile-search-input"
              placeholder="Search by vendor, ID, amount, category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="mobile-search-clear"
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── MOBILE HERO FINANCIAL SNAPSHOT CARD ── */}
      <div className="mobile-hero-kpi-card">
        <div className="mobile-hero-top">
          <span className="mobile-hero-badge">
            <Clock size={13} strokeWidth={2.4} />
            Awaiting Committee Sign-off
          </span>
          <span className="mobile-hero-count">
            {tabMetrics.pendingCount} {tabMetrics.pendingCount === 1 ? 'Invoice' : 'Invoices'}
          </span>
        </div>

        <div className="mobile-hero-amount-row">
          <span className="mobile-hero-amount">{tabMetrics.sumPending}</span>
          <button
            type="button"
            className="mobile-hero-export-btn"
            onClick={() => showToast('Exporting invoices to CSV...', 'success')}
            aria-label="Export invoices to CSV"
            title="Export invoices to CSV"
          >
            <Download size={13} strokeWidth={2.4} />
            <span>CSV</span>
          </button>
        </div>

        {/* Overdue alert banner inside hero */}
        {tabMetrics.overdueCount > 0 && (
          <div
            className="mobile-hero-urgent-banner"
            onClick={() => {
              setActiveTab('Overdue');
              showToast(`Showing ${tabMetrics.overdueCount} overdue invoices`, 'error');
            }}
            role="button"
            tabIndex={0}
          >
            <div className="banner-left">
              <AlertTriangle size={14} className="banner-alert-icon" />
              <span>
                <strong>{tabMetrics.overdueCount} Overdue ({tabMetrics.sumOverdue})</strong> require urgent action
              </span>
            </div>
            <ChevronRight size={14} className="banner-chevron" />
          </div>
        )}
      </div>

      {/* ── MOBILE STICKY SEGMENTED TABS ── */}
      <div className="mobile-segmented-tabs-bar">
        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'Pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('Pending')}
        >
          <span>Pending</span>
          <span className="mobile-tab-badge amber">{tabMetrics.pendingCount}</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'Overdue' ? 'active' : ''}`}
          onClick={() => setActiveTab('Overdue')}
        >
          <span>Overdue</span>
          {tabMetrics.overdueCount > 0 ? (
            <span className="mobile-tab-badge red">{tabMetrics.overdueCount}</span>
          ) : (
            <span className="mobile-tab-badge muted">0</span>
          )}
        </button>

        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'Approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('Approved')}
        >
          <span>Approved</span>
          <span className="mobile-tab-badge green">{tabMetrics.approvedCount}</span>
        </button>

        <button
          type="button"
          className={`mobile-tab-btn ${activeTab === 'All' ? 'active' : ''}`}
          onClick={() => setActiveTab('All')}
        >
          <span>All</span>
          <span className="mobile-tab-badge slate">{tabMetrics.totalCount}</span>
        </button>
      </div>

      {/* ── HORIZONTAL CATEGORY & FILTER PILL BAR ── */}
      <div className="mobile-filter-pills-strip">
        {/* Main Filter Bottom Sheet Trigger */}
        <button
          type="button"
          className={`mobile-filter-chip-btn ${hasActiveFilters ? 'has-active' : ''}`}
          onClick={() => setIsFilterSheetOpen(true)}
        >
          <SlidersHorizontal size={13} />
          <span>Filters</span>
          {(selectedCategory !== 'All' || selectedVendorFilter !== 'All' || sortOption !== 'newest') && (
            <span className="filter-dot-indicator" />
          )}
        </button>

        {/* Quick Sort Toggle Pill */}
        <button
          type="button"
          className={`mobile-filter-chip-btn ${sortOption !== 'newest' ? 'active' : ''}`}
          onClick={() => {
            const nextSort =
              sortOption === 'newest'
                ? 'amount-high'
                : sortOption === 'amount-high'
                ? 'due-soonest'
                : 'newest';
            setSortOption(nextSort);
            const sortLabel =
              nextSort === 'amount-high'
                ? 'Highest Amount'
                : nextSort === 'due-soonest'
                ? 'Due Soonest'
                : 'Newest First';
            showToast(`Sorted by: ${sortLabel}`, 'info');
          }}
        >
          <ArrowUpDown size={12} />
          <span>
            {sortOption === 'amount-high'
              ? 'Amount: High'
              : sortOption === 'due-soonest'
              ? 'Due Soon'
              : 'Sort: Newest'}
          </span>
        </button>

        {/* Category Horizontal Quick Pills */}
        <div className="mobile-category-scroll">
          {categoriesList.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`mobile-category-pill ${isSelected ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── ACTIVE FILTERS TAGS BAR ── */}
      {hasActiveFilters && (
        <div className="mobile-active-filters-bar">
          <div className="active-tags-list">
            {selectedCategory !== 'All' && (
              <span className="active-tag-chip">
                Cat: {selectedCategory}
                <button type="button" onClick={() => setSelectedCategory('All')}>
                  <X size={10} />
                </button>
              </span>
            )}
            {selectedVendorFilter !== 'All' && (
              <span className="active-tag-chip">
                Vendor: {selectedVendorFilter}
                <button type="button" onClick={() => setSelectedVendorFilter('All')}>
                  <X size={10} />
                </button>
              </span>
            )}
            {sortOption !== 'newest' && (
              <span className="active-tag-chip">
                {sortOption === 'amount-high' ? 'High Amount' : 'Due Soon'}
                <button type="button" onClick={() => setSortOption('newest')}>
                  <X size={10} />
                </button>
              </span>
            )}
            {searchTerm && (
              <span className="active-tag-chip">
                "{searchTerm}"
                <button type="button" onClick={() => setSearchTerm('')}>
                  <X size={10} />
                </button>
              </span>
            )}
          </div>
          <button type="button" className="mobile-reset-filters-btn" onClick={handleResetFilters}>
            <RotateCcw size={11} />
            <span>Reset</span>
          </button>
        </div>
      )}

      {/* ── SELECT ALL HEADER (WHEN MULTI-SELECT ACTIVE) ── */}
      {isMultiSelectMode && filteredInvoices.length > 0 && (
        <div className="mobile-select-all-banner">
          <label className="mobile-select-all-label">
            <input
              type="checkbox"
              checked={
                visibleInvoices.length > 0 &&
                visibleInvoices.every((inv) => selectedIds.has(inv.id))
              }
              onChange={(e) => {
                const checked = e.target.checked;
                visibleInvoices.forEach((inv) => onSelectRow(inv.id, checked));
              }}
            />
            <span className="mobile-checkbox-custom">
              {visibleInvoices.length > 0 &&
                visibleInvoices.every((inv) => selectedIds.has(inv.id)) && (
                  <Check size={12} strokeWidth={3} />
                )}
            </span>
            <span className="select-all-text">
              Select All Visible ({visibleInvoices.length})
            </span>
          </label>
          <span className="selected-counter-badge">{selectedIds.size} selected</span>
        </div>
      )}

      {/* ── CARD FEED LIST ── */}
      <div className="mobile-invoices-feed">
        {filteredInvoices.length === 0 ? (
          <div className="mobile-empty-state">
            <div className="empty-icon-wrap">
              <FileText size={32} />
            </div>
            <h3 className="empty-title">No invoices found</h3>
            <p className="empty-subtitle">
              {hasActiveFilters
                ? 'Try adjusting your filters or search keywords.'
                : `There are currently no ${activeTab.toLowerCase()} invoices for this selection.`}
            </p>
            {hasActiveFilters && (
              <button
                type="button"
                className="mobile-empty-reset-btn"
                onClick={handleResetFilters}
              >
                Reset All Filters
              </button>
            )}
          </div>
        ) : (
          visibleInvoices.map((inv) => {
            const isSelected = selectedIds.has(inv.id);
            const catMeta = getCategoryMeta(inv.category, inv.vendor);
            const CatIcon = catMeta.icon;

            const isPending = inv.status === 'Pending';
            const isOverdue = inv.status === 'Overdue';
            const isApproved = inv.status === 'Approved';

            return (
              <div
                key={inv.id}
                className={`mobile-invoice-card ${isSelected ? 'selected' : ''} ${
                  isOverdue ? 'card-overdue' : ''
                }`}
                onClick={() => {
                  if (isMultiSelectMode) {
                    onSelectRow(inv.id, !isSelected);
                  } else {
                    handleOpenDetail(inv);
                  }
                }}
              >
                {/* Checkbox (if multi-select active or card selected) */}
                {isMultiSelectMode && (
                  <div
                    className="mobile-card-select-col"
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectRow(inv.id, !isSelected);
                    }}
                  >
                    <span className={`mobile-checkbox-custom ${isSelected ? 'checked' : ''}`}>
                      {isSelected && <Check size={12} strokeWidth={3} />}
                    </span>
                  </div>
                )}

                <div className="mobile-card-main-content">
                  {/* Card Header Row */}
                  <div className="mobile-card-header-row">
                    <div
                      className="mobile-card-category-avatar"
                      style={{ background: catMeta.bg, color: catMeta.color, borderColor: catMeta.borderColor }}
                    >
                      <CatIcon size={18} strokeWidth={2.2} />
                    </div>

                    <div className="mobile-card-vendor-info">
                      <div className="mobile-card-vendor-name">{inv.vendor}</div>
                      <div className="mobile-card-category-tag">
                        <span>{catMeta.name}</span>
                        <span className="dot-sep">·</span>
                        <span>{inv.lot || selectedLot}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mobile-card-status-wrap">
                      {isPending && (
                        <span className="mobile-status-pill pending">
                          <span className="status-dot pulsing" />
                          Pending
                        </span>
                      )}
                      {isOverdue && (
                        <span className="mobile-status-pill overdue">
                          <AlertTriangle size={11} className="mr-1" />
                          Overdue
                        </span>
                      )}
                      {isApproved && (
                        <span className="mobile-status-pill approved">
                          <CheckCircle2 size={11} className="mr-1" />
                          Approved
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card Financial & Meta Row */}
                  <div className="mobile-card-body-row">
                    <div className="mobile-card-amount-block">
                      <span className="mobile-card-amount">{inv.amount}</span>
                      <span className="mobile-card-id-tag">#{inv.id}</span>
                    </div>

                    <div className="mobile-card-due-block">
                      {isOverdue && (
                        <span className="mobile-due-text text-danger">
                          <Clock size={11} />
                          Overdue ({inv.dueDate})
                        </span>
                      )}
                      {isPending && (
                        <span className="mobile-due-text text-warning">
                          <Calendar size={11} />
                          Due {inv.dueDate}
                        </span>
                      )}
                      {isApproved && (
                        <span className="mobile-due-text text-success">
                          <Check size={11} />
                          Processed
                        </span>
                      )}
                      <span className="mobile-submitter-text">
                        <User size={10} />
                        {inv.submittedBy.split('(')[0].trim()}
                      </span>
                    </div>
                  </div>

                  {/* Card Thumb Actions (Approval / Review) */}
                  <div
                    className="mobile-card-actions-bar"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {!isApproved ? (
                      <>
                        <button
                          type="button"
                          className="mobile-btn-approve"
                          onClick={(e) => handleSingleApprove(inv.id, e)}
                          title="Approve invoice"
                        >
                          <Check size={15} strokeWidth={2.8} />
                          <span>Approve</span>
                        </button>

                        <button
                          type="button"
                          className="mobile-btn-reject"
                          onClick={(e) => handleSingleReject(inv.id, e)}
                          title="Review or reject invoice"
                        >
                          <X size={15} strokeWidth={2.4} />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          className="mobile-btn-details-link"
                          onClick={() => handleOpenDetail(inv)}
                          title="View complete details & PDF"
                          aria-label="View details"
                        >
                          <ChevronRight size={17} strokeWidth={2.4} />
                        </button>
                      </>
                    ) : (
                      <div className="mobile-approved-footer">
                        <span className="approved-stamp-text">
                          <CheckCircle2 size={13} />
                          Approved for Strata Disbursement
                        </span>
                        <button
                          type="button"
                          className="mobile-btn-view-pdf"
                          onClick={() => handleOpenDetail(inv)}
                        >
                          <FileText size={12} />
                          <span>Details</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* ── PROGRESSIVE MOBILE PAGINATION / LOAD MORE ── */}
        {filteredInvoices.length > visibleCount && (
          <div className="mobile-load-more-wrap">
            <button
              type="button"
              className="mobile-load-more-btn"
              onClick={() => setVisibleCount((prev) => prev + 5)}
            >
              <span>Load More Invoices</span>
              <span className="load-count-chip">
                +{Math.min(5, filteredInvoices.length - visibleCount)} remaining
              </span>
            </button>
            <div className="mobile-items-counter">
              Showing {visibleCount} of {filteredInvoices.length} invoices
            </div>
          </div>
        )}

        {filteredInvoices.length > 0 && filteredInvoices.length <= visibleCount && (
          <div className="mobile-feed-end-notice">
            <span>Showing all {filteredInvoices.length} invoices</span>
          </div>
        )}
      </div>

      {/* ── FLOATING BATCH ACTIONS BAR (MOBILE) ── */}
      {selectedIds.size > 0 && (
        <div className="mobile-floating-batch-bar">
          <div className="batch-info-left">
            <div className="batch-count-title">
              <strong>{selectedSummary.count}</strong> Selected
            </div>
            <div className="batch-amount-sub">{selectedSummary.amountFormatted}</div>
          </div>

          <div className="batch-actions-right">
            <button
              type="button"
              className="batch-btn-approve"
              onClick={onApproveSelected}
            >
              <Check size={14} strokeWidth={2.8} />
              <span>Approve All</span>
            </button>

            <button
              type="button"
              className="batch-btn-reject"
              onClick={onRejectSelected}
            >
              <X size={14} />
            </button>

            <button
              type="button"
              className="batch-btn-cancel"
              onClick={() => onSelectAll(false)}
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* ── MOBILE INVOICE DETAIL BOTTOM SHEET (NATIVE MODAL) ── */}
      {activeDetailInvoice && (
        <div
          className="mobile-sheet-overlay"
          onClick={() => setActiveDetailInvoice(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mobile-sheet-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sheet-handle" />

            <div className="mobile-sheet-header">
              <div className="sheet-header-left">
                <span className="sheet-id-badge">#{activeDetailInvoice.id}</span>
                <h2 className="sheet-vendor-title">{activeDetailInvoice.vendor}</h2>
              </div>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setActiveDetailInvoice(null)}
                aria-label="Close invoice details"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-scrollable-body">
              {/* Financial Hero Box */}
              <div className="sheet-financial-box">
                <div className="sheet-fin-label">Total Payable</div>
                <div className="sheet-fin-amount">{activeDetailInvoice.amount}</div>
                <div className="sheet-fin-breakdown">
                  <span>Net: {activeDetailInvoice.subtotal}</span>
                  <span className="dot">·</span>
                  <span>GST (10%): {activeDetailInvoice.gst}</span>
                </div>
              </div>

              {/* Status & Timing Banner */}
              <div className="sheet-meta-grid">
                <div className="sheet-meta-item">
                  <span className="meta-label">Status</span>
                  <span className={`meta-status-tag ${activeDetailInvoice.status.toLowerCase()}`}>
                    {activeDetailInvoice.status}
                  </span>
                </div>

                <div className="sheet-meta-item">
                  <span className="meta-label">Due Date</span>
                  <span className="meta-value">{activeDetailInvoice.dueDate}</span>
                </div>

                <div className="sheet-meta-item">
                  <span className="meta-label">Property</span>
                  <span className="meta-value">{activeDetailInvoice.property}</span>
                </div>

                <div className="sheet-meta-item">
                  <span className="meta-label">Lot Allocation</span>
                  <span className="meta-value">{activeDetailInvoice.lot}</span>
                </div>
              </div>

              {/* Scope of Work */}
              <div className="sheet-section">
                <h4 className="sheet-section-heading">Work Order / Description</h4>
                <p className="sheet-desc-text">{activeDetailInvoice.description}</p>
              </div>

              {/* Attachment Card */}
              <div className="sheet-section">
                <h4 className="sheet-section-heading">Attached Tax Invoice</h4>
                <div className="sheet-attachment-card">
                  <div className="attachment-icon-box">
                    <FileText size={20} />
                  </div>
                  <div className="attachment-details">
                    <span className="attachment-name">{activeDetailInvoice.fileName}</span>
                    <span className="attachment-size">{activeDetailInvoice.fileSize} · Certified PDF</span>
                  </div>
                  <button
                    type="button"
                    className="attachment-download-btn"
                    onClick={() => showToast(`Downloading ${activeDetailInvoice.fileName}...`, 'success')}
                    aria-label="Download attachment"
                  >
                    <Download size={15} />
                  </button>
                </div>
              </div>

              {/* Approval History / Audit Trail */}
              <div className="sheet-section">
                <h4 className="sheet-section-heading">Audit Trail</h4>
                <div className="sheet-timeline">
                  <div className="timeline-step done">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <span className="timeline-step-title">Work Completed & Invoiced</span>
                      <span className="timeline-step-time">Date: {activeDetailInvoice.date}</span>
                    </div>
                  </div>

                  <div className="timeline-step done">
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <span className="timeline-step-title">Verified by Submitter</span>
                      <span className="timeline-step-time">{activeDetailInvoice.submittedBy}</span>
                    </div>
                  </div>

                  <div className={`timeline-step ${activeDetailInvoice.status === 'Approved' ? 'done' : 'active'}`}>
                    <div className="timeline-dot" />
                    <div className="timeline-content">
                      <span className="timeline-step-title">
                        {activeDetailInvoice.status === 'Approved'
                          ? 'Committee Approved'
                          : 'Committee Sign-off (You)'}
                      </span>
                      <span className="timeline-step-time">
                        {activeDetailInvoice.status === 'Approved'
                          ? 'Authorized for payment'
                          : 'Awaiting your decision'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Sticky Sheet Actions Footer */}
            <div className="mobile-sheet-footer">
              {activeDetailInvoice.status !== 'Approved' ? (
                <>
                  <button
                    type="button"
                    className="sheet-btn-reject"
                    onClick={() => handleSingleReject(activeDetailInvoice.id)}
                  >
                    <X size={16} />
                    <span>Reject</span>
                  </button>
                  <button
                    type="button"
                    className="sheet-btn-approve"
                    onClick={() => handleSingleApprove(activeDetailInvoice.id)}
                  >
                    <Check size={16} strokeWidth={2.8} />
                    <span>Approve {activeDetailInvoice.amount}</span>
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  className="sheet-btn-done"
                  onClick={() => setActiveDetailInvoice(null)}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── MOBILE FILTER DRAWER BOTTOM SHEET ── */}
      {isFilterSheetOpen && (
        <div
          className="mobile-sheet-overlay"
          onClick={() => setIsFilterSheetOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="mobile-sheet-content filter-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-sheet-handle" />

            <div className="mobile-sheet-header">
              <h3 className="sheet-filter-title">Filter & Sort Invoices</h3>
              <button
                type="button"
                className="sheet-close-btn"
                onClick={() => setIsFilterSheetOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-scrollable-body">
              {/* Sort By Section */}
              <div className="sheet-filter-group">
                <span className="sheet-filter-label">Sort Order</span>
                <div className="sheet-chips-grid">
                  {[
                    { id: 'newest', label: 'Newest First' },
                    { id: 'due-soonest', label: 'Due Soonest' },
                    { id: 'amount-high', label: 'Amount: High to Low' },
                    { id: 'amount-low', label: 'Amount: Low to High' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className={`sheet-choice-chip ${sortOption === s.id ? 'active' : ''}`}
                      onClick={() => setSortOption(s.id)}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Vendor Filter Section */}
              <div className="sheet-filter-group">
                <span className="sheet-filter-label">Vendor</span>
                <div className="sheet-chips-grid">
                  {vendorsList.map((v) => (
                    <button
                      key={v}
                      type="button"
                      className={`sheet-choice-chip ${selectedVendorFilter === v ? 'active' : ''}`}
                      onClick={() => setSelectedVendorFilter(v)}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category Filter Section */}
              <div className="sheet-filter-group">
                <span className="sheet-filter-label">Category</span>
                <div className="sheet-chips-grid">
                  {categoriesList.map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`sheet-choice-chip ${selectedCategory === c ? 'active' : ''}`}
                      onClick={() => setSelectedCategory(c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mobile-sheet-footer">
              <button
                type="button"
                className="sheet-btn-reset"
                onClick={handleResetFilters}
              >
                Reset All
              </button>
              <button
                type="button"
                className="sheet-btn-apply"
                onClick={() => {
                  setIsFilterSheetOpen(false);
                  showToast(`Applied filters (${filteredInvoices.length} results)`, 'info');
                }}
              >
                Show {filteredInvoices.length} Invoices
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default MobileInvoiceApproval;
