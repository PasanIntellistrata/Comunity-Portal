import React, { useState, useMemo, useCallback } from 'react';
import {
  FileText,
  Upload,
  Filter,
  Search,
  ChevronDown,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  MoreHorizontal,
  Download,
  Eye,
  Share2,
  Trash2,
  X,
  CheckCircle2,
  Wrench,
  CreditCard,
  Image as ImageIcon,
  Monitor,
  Users,
  BarChart2,
  Archive,
  Folder,
  FileSpreadsheet,
  FileCode,
  FileArchive,
  Layers,
  Building2,
  Home,
  Check,
  Star,
  ShieldCheck,
  Sparkles,
  Info,
  Calendar,
  User,
  ArrowUpDown,
  Lock,
} from 'lucide-react';
import { PROPERTIES as FALLBACK_PROPERTIES } from '../js/data/invoice-data.js';
import MobilePropertyLotPicker from './MobilePropertyLotPicker.jsx';

/**
 * Helper to render folder icon by type
 */
const renderFolderIcon = (type, color) => {
  const iconProps = { size: 18, color };
  switch (type) {
    case 'wrench':
      return <Wrench {...iconProps} />;
    case 'credit-card':
      return <CreditCard {...iconProps} />;
    case 'image':
      return <ImageIcon {...iconProps} />;
    case 'monitor':
      return <Monitor {...iconProps} />;
    case 'users':
      return <Users {...iconProps} />;
    case 'chart':
      return <BarChart2 {...iconProps} />;
    case 'archive':
      return <Archive {...iconProps} />;
    case 'document':
    default:
      return <Folder {...iconProps} />;
  }
};

/**
 * Helper to render document file icon with badge coloring
 */
const renderDocIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'excel':
      return <FileSpreadsheet size={18} className="doc-icon-emerald" />;
    case 'word':
      return <FileText size={18} className="doc-icon-blue" />;
    case 'zip':
      return <FileArchive size={18} className="doc-icon-amber" />;
    case 'powerpoint':
      return <FileCode size={18} className="doc-icon-rose" />;
    case 'pdf':
    default:
      return <FileText size={18} className="doc-icon-red" />;
  }
};

const MobileDocumentsView = ({
  documents = [],
  setDocuments,
  propertyFolders = [],
  categories = [],
  types = [],
  categoryColors = {},
  selectedProperty,
  selectedLot = 'Lot A-03',
  properties = [],
  onSelectProperty,
  onSelectLot,
  currentUser,
  showToast = () => {},
}) => {
  // Mobile Tabs: 'all' | 'folders' | 'recent'
  const [activeTab, setActiveTab] = useState('all');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedType, setSelectedType] = useState('All Types');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'list'

  // Starred / Pinned Documents
  const [starredDocIds, setStarredDocIds] = useState(new Set(['DOC-2026-001', 'DOC-2026-003']));

  // Modals & Sheets
  const [previewDoc, setPreviewDoc] = useState(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [actionMenuDoc, setActionMenuDoc] = useState(null);

  // Effective properties list
  const effectiveProperties = properties && properties.length > 0 ? properties : FALLBACK_PROPERTIES;

  // Upload Form State
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Notices & Circulars');
  const [newDocFolder, setNewDocFolder] = useState('Meetings');
  const [newDocType, setNewDocType] = useState('PDF');
  const [isUploading, setIsUploading] = useState(false);

  // Available lots
  const availableLots = selectedProperty?.lots || [
    'All Lots',
    'Lot A-01',
    'Lot A-02',
    'Lot A-03',
    'Lot B-01',
    'Lot B-02',
  ];

  // Toggle Star
  const handleToggleStar = (docId, e) => {
    e?.stopPropagation?.();
    setStarredDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) {
        next.delete(docId);
        showToast('Document unpinned');
      } else {
        next.add(docId);
        showToast('Document pinned to favorites');
      }
      return next;
    });
  };

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // Tab filter
      if (activeTab === 'recent') {
        const isRecent = doc.uploadedOn?.toLowerCase().includes('today') ||
          doc.uploadedOn?.toLowerCase().includes('may 2026') ||
          starredDocIds.has(doc.id);
        if (!isRecent) return false;
      }

      // Folder filter
      if (selectedFolderId && doc.folderId !== selectedFolderId) {
        return false;
      }

      // Category filter
      if (selectedCategory !== 'All Categories' && doc.category !== selectedCategory) {
        return false;
      }

      // Type filter
      if (selectedType !== 'All Types' && doc.type !== selectedType) {
        return false;
      }

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = doc.name.toLowerCase().includes(q);
        const matchCat = doc.category.toLowerCase().includes(q);
        const matchUploader = doc.uploadedBy.toLowerCase().includes(q);
        const matchType = doc.type.toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchUploader && !matchType) {
          return false;
        }
      }

      return true;
    });
  }, [documents, activeTab, selectedFolderId, selectedCategory, selectedType, searchQuery, starredDocIds]);

  // Handle Download simulation
  const handleDownload = (doc, e) => {
    e?.stopPropagation?.();
    showToast(`Downloading "${doc.name}" (${doc.size})...`);
    // Simulated anchor click
    const element = document.createElement('a');
    element.setAttribute('href', '#');
    element.setAttribute('download', doc.name);
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Handle Share simulation
  const handleShare = (doc, e) => {
    e?.stopPropagation?.();
    if (navigator.clipboard) {
      navigator.clipboard.writeText(`https://portal.intellistrata.com/docs/${doc.id}`);
      showToast('Direct document link copied to clipboard!');
    } else {
      showToast('Document link generated');
    }
  };

  // Handle Upload Submission
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      showToast('Please enter a document title');
      return;
    }

    setIsUploading(true);
    setTimeout(() => {
      const ext = newDocType === 'PDF' ? '.pdf' : newDocType === 'Excel' ? '.xlsx' : newDocType === 'Word' ? '.docx' : '.zip';
      const cleanName = newDocName.toLowerCase().endsWith(ext) ? newDocName : `${newDocName}${ext}`;

      const created = {
        id: `DOC-2026-${String(documents.length + 1).padStart(3, '0')}`,
        name: cleanName,
        category: newDocCategory,
        type: newDocType,
        uploadedBy: currentUser?.name || 'Alice Smith',
        uploadedOn: 'Today',
        size: '1.4 MB',
        folderId: newDocFolder,
      };

      if (setDocuments) {
        setDocuments((prev) => [created, ...prev]);
      }
      setIsUploading(false);
      setIsUploadModalOpen(false);
      setNewDocName('');
      showToast(`"${created.name}" uploaded successfully!`);
    }, 600);
  };

  return (
    <div className="mobile-docs-container">
      {/* ── 1. SCHEME & CONTEXT HEADER ── */}
      <div className="mobile-docs-header-card">
        <div className="mobile-docs-header-top">
          <MobilePropertyLotPicker
            selectedProperty={selectedProperty}
            selectedLot={selectedLot}
            properties={effectiveProperties}
            onSelectProperty={onSelectProperty}
            onSelectLot={onSelectLot}
            showToast={showToast}
          />

          <button
            type="button"
            className="mobile-docs-upload-cta"
            onClick={() => setIsUploadModalOpen(true)}
            aria-label="Upload document"
          >
            <Upload size={13} />
            <span>Upload</span>
          </button>
        </div>
      </div>

      {/* ── 2. STORAGE & KPIS HERO CARDS ── */}
      <div className="mobile-docs-kpi-grid">
        <div className="mobile-docs-kpi-chip">
          <div className="mobile-docs-kpi-icon blue">
            <FileText size={16} />
          </div>
          <div className="mobile-docs-kpi-content">
            <span className="mobile-docs-kpi-val">{documents.length}</span>
            <span className="mobile-docs-kpi-lbl">Total Documents</span>
          </div>
        </div>

        <div className="mobile-docs-kpi-chip">
          <div className="mobile-docs-kpi-icon amber">
            <Clock size={16} />
          </div>
          <div className="mobile-docs-kpi-content">
            <span className="mobile-docs-kpi-val">12</span>
            <span className="mobile-docs-kpi-lbl">New in 7 Days</span>
          </div>
        </div>

        <div className="mobile-docs-kpi-chip">
          <div className="mobile-docs-kpi-icon emerald">
            <ShieldCheck size={16} />
          </div>
          <div className="mobile-docs-kpi-content">
            <span className="mobile-docs-kpi-val">18.4 MB</span>
            <span className="mobile-docs-kpi-lbl">Encrypted Storage</span>
          </div>
        </div>
      </div>

      {/* ── 3. SEGMENTED TABS (All Files | Property Folders | Recent) ── */}
      <div className="mobile-docs-tabs-nav">
        <button
          type="button"
          className={`mobile-docs-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => {
            setActiveTab('all');
            setSelectedFolderId(null);
          }}
        >
          <FileText size={14} />
          <span>All Documents</span>
          <span className="mobile-docs-tab-count">{documents.length}</span>
        </button>

        <button
          type="button"
          className={`mobile-docs-tab-btn ${activeTab === 'folders' ? 'active' : ''}`}
          onClick={() => setActiveTab('folders')}
        >
          <Folder size={14} />
          <span>Folders</span>
          <span className="mobile-docs-tab-count">{propertyFolders.length}</span>
        </button>

        <button
          type="button"
          className={`mobile-docs-tab-btn ${activeTab === 'recent' ? 'active' : ''}`}
          onClick={() => setActiveTab('recent')}
        >
          <Clock size={14} />
          <span>Recent &amp; Starred</span>
        </button>
      </div>

      {/* ── 4. TAB CONTENT: PROPERTY FOLDERS GRID ── */}
      {activeTab === 'folders' && (
        <div className="mobile-docs-folders-section animate-fade-in">
          <div className="mobile-docs-section-title-row">
            <div>
              <h2 className="mobile-docs-section-title">Property Folders</h2>
              <p className="mobile-docs-section-desc">Tap any folder to view its strata files</p>
            </div>
            <span className="mobile-docs-badge-subtle">{propertyFolders.length} categories</span>
          </div>

          <div className="mobile-docs-folder-grid">
            {propertyFolders.map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              return (
                <div
                  key={folder.id}
                  className={`mobile-docs-folder-card ${isSelected ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedFolderId(folder.id);
                    setActiveTab('all');
                    showToast(`Opened folder: ${folder.name}`);
                  }}
                >
                  <div
                    className="mobile-docs-folder-icon-wrap"
                    style={{ background: folder.bgColor || 'rgba(20, 184, 166, 0.15)' }}
                  >
                    {renderFolderIcon(folder.iconType, folder.color || '#0d9488')}
                  </div>
                  <div className="mobile-docs-folder-name" title={folder.name}>
                    {folder.name}
                  </div>
                  <div className="mobile-docs-folder-desc">{folder.description}</div>
                  <div className="mobile-docs-folder-footer">
                    <span className="mobile-docs-folder-count">
                      {folder.documentCount || 0} files
                    </span>
                    <ChevronRight size={13} className="mobile-docs-folder-arrow" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 5. TAB CONTENT: ALL DOCUMENTS & RECENT ── */}
      {activeTab !== 'folders' && (
        <div className="mobile-docs-files-section animate-fade-in">
          {/* Active Folder Filter Bar if Selected */}
          {selectedFolderId && (
            <div className="mobile-docs-active-folder-banner">
              <div className="mobile-docs-active-folder-left">
                <Folder size={14} className="text-teal-400" />
                <span>
                  Filtering by <strong>{propertyFolders.find((f) => f.id === selectedFolderId)?.name || selectedFolderId}</strong>
                </span>
              </div>
              <button
                type="button"
                className="mobile-docs-clear-filter-btn"
                onClick={() => setSelectedFolderId(null)}
              >
                <X size={13} />
                <span>Clear</span>
              </button>
            </div>
          )}

          {/* Horizontal Folder Snap-Scroll Pills */}
          <div className="mobile-docs-folder-pills-scroll">
            <button
              type="button"
              className={`mobile-docs-folder-pill ${selectedFolderId === null ? 'active' : ''}`}
              onClick={() => setSelectedFolderId(null)}
            >
              <span>All Folders</span>
              <span className="mobile-docs-pill-count">{documents.length}</span>
            </button>
            {propertyFolders.slice(0, 10).map((folder) => {
              const isSelected = selectedFolderId === folder.id;
              return (
                <button
                  key={folder.id}
                  type="button"
                  className={`mobile-docs-folder-pill ${isSelected ? 'active' : ''}`}
                  onClick={() => setSelectedFolderId(isSelected ? null : folder.id)}
                >
                  <span
                    className="mobile-docs-pill-dot"
                    style={{ background: folder.color || '#0d9488' }}
                  />
                  <span>{folder.name}</span>
                  <span className="mobile-docs-pill-count">{folder.documentCount || 0}</span>
                </button>
              );
            })}
          </div>

          {/* Search & Filter Toolbar */}
          <div className="mobile-docs-search-toolbar">
            <div className="mobile-docs-search-box">
              <Search size={14} className="mobile-docs-search-icon" />
              <input
                type="text"
                className="mobile-docs-search-input"
                placeholder="Search file title, uploader..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  type="button"
                  className="mobile-docs-search-clear"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* View Mode Toggle Button */}
            <div className="mobile-docs-view-toggle">
              <button
                type="button"
                className={`mobile-docs-mode-btn ${viewMode === 'cards' ? 'active' : ''}`}
                onClick={() => setViewMode('cards')}
                title="Cards View"
              >
                <LayoutGrid size={14} />
              </button>
              <button
                type="button"
                className={`mobile-docs-mode-btn ${viewMode === 'list' ? 'active' : ''}`}
                onClick={() => setViewMode('list')}
                title="List View"
              >
                <List size={14} />
              </button>
            </div>
          </div>

          {/* Category & Type Dropdowns Filter Row */}
          <div className="mobile-docs-selects-row">
            <select
              className="mobile-docs-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <select
              className="mobile-docs-filter-select"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          {/* Results Summary Bar */}
          <div className="mobile-docs-results-meta">
            <span>
              Showing <strong>{filteredDocuments.length}</strong> of {documents.length} files
            </span>
            {(selectedCategory !== 'All Categories' || selectedType !== 'All Types' || searchQuery || selectedFolderId) && (
              <button
                type="button"
                className="mobile-docs-reset-filters-link"
                onClick={() => {
                  setSelectedCategory('All Categories');
                  setSelectedType('All Types');
                  setSelectedFolderId(null);
                  setSearchQuery('');
                  showToast('Filters reset');
                }}
              >
                Reset All
              </button>
            )}
          </div>

          {/* Documents Stream: Cards View or List View */}
          {filteredDocuments.length === 0 ? (
            <div className="mobile-docs-empty-state">
              <div className="mobile-docs-empty-icon">
                <FileText size={32} />
              </div>
              <h3 className="mobile-docs-empty-title">No Documents Found</h3>
              <p className="mobile-docs-empty-desc">
                No strata documents match your current filter or search criteria.
              </p>
              <button
                type="button"
                className="mobile-docs-empty-btn"
                onClick={() => {
                  setSelectedCategory('All Categories');
                  setSelectedType('All Types');
                  setSelectedFolderId(null);
                  setSearchQuery('');
                }}
              >
                Show All Documents
              </button>
            </div>
          ) : viewMode === 'cards' ? (
            <div className="mobile-docs-cards-list">
              {filteredDocuments.map((doc) => {
                const isStarred = starredDocIds.has(doc.id);
                const catColor = categoryColors[doc.category] || {
                  bg: 'rgba(255, 255, 255, 0.08)',
                  text: '#cbd5e1',
                  border: 'rgba(255, 255, 255, 0.1)',
                };

                return (
                  <div
                    key={doc.id}
                    className="mobile-docs-card"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <div className="mobile-docs-card-top">
                      <div className="mobile-docs-file-badge">
                        {renderDocIcon(doc.type)}
                      </div>
                      <div className="mobile-docs-card-header-text">
                        <div className="mobile-docs-card-title" title={doc.name}>
                          {doc.name}
                        </div>
                        <div className="mobile-docs-card-pills">
                          <span
                            className="mobile-docs-category-tag"
                            style={{
                              backgroundColor: catColor.bg,
                              color: catColor.text,
                              borderColor: catColor.border,
                            }}
                          >
                            {doc.category}
                          </span>
                          <span className="mobile-docs-folder-tag">
                            📁 {doc.folderId || 'General'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        className={`mobile-docs-star-btn ${isStarred ? 'starred' : ''}`}
                        onClick={(e) => handleToggleStar(doc.id, e)}
                        aria-label={isStarred ? 'Unpin' : 'Pin'}
                      >
                        <Star size={15} fill={isStarred ? '#f59e0b' : 'none'} />
                      </button>
                    </div>

                    <div className="mobile-docs-card-meta-row">
                      <div className="mobile-docs-meta-chip">
                        <User size={11} />
                        <span>{doc.uploadedBy}</span>
                      </div>
                      <div className="mobile-docs-meta-chip">
                        <Calendar size={11} />
                        <span>{doc.uploadedOn}</span>
                      </div>
                      <div className="mobile-docs-meta-chip size">
                        <span>{doc.size}</span>
                      </div>
                    </div>

                    <div className="mobile-docs-card-actions">
                      <button
                        type="button"
                        className="mobile-docs-action-btn primary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewDoc(doc);
                        }}
                      >
                        <Eye size={13} />
                        <span>Preview</span>
                      </button>

                      <button
                        type="button"
                        className="mobile-docs-action-btn"
                        onClick={(e) => handleDownload(doc, e)}
                        title="Download Document"
                      >
                        <Download size={13} />
                        <span>Download</span>
                      </button>

                      <button
                        type="button"
                        className="mobile-docs-action-btn icon-only"
                        onClick={(e) => handleShare(doc, e)}
                        title="Share Document"
                      >
                        <Share2 size={13} />
                      </button>

                      <button
                        type="button"
                        className="mobile-docs-action-btn icon-only"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActionMenuDoc(doc);
                        }}
                        title="More actions"
                      >
                        <MoreHorizontal size={13} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Compact List View */
            <div className="mobile-docs-compact-list">
              {filteredDocuments.map((doc) => {
                const isStarred = starredDocIds.has(doc.id);
                return (
                  <div
                    key={doc.id}
                    className="mobile-docs-compact-row"
                    onClick={() => setPreviewDoc(doc)}
                  >
                    <div className="mobile-docs-compact-left">
                      <div className="mobile-docs-compact-icon">
                        {renderDocIcon(doc.type)}
                      </div>
                      <div className="mobile-docs-compact-info">
                        <div className="mobile-docs-compact-name">{doc.name}</div>
                        <div className="mobile-docs-compact-sub">
                          <span>{doc.category}</span>
                          <span>•</span>
                          <span>{doc.uploadedOn}</span>
                          <span>•</span>
                          <span className="text-teal-400">{doc.size}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mobile-docs-compact-actions">
                      <button
                        type="button"
                        className="mobile-docs-compact-btn"
                        onClick={(e) => handleDownload(doc, e)}
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── 6. DOCUMENT PREVIEW MODAL ── */}
      {previewDoc && (
        <div className="mobile-docs-modal-overlay" onClick={() => setPreviewDoc(null)}>
          <div
            className="mobile-docs-preview-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-docs-sheet-handle" />
            <div className="mobile-docs-preview-header">
              <div className="mobile-docs-preview-icon-box">
                {renderDocIcon(previewDoc.type)}
              </div>
              <div className="mobile-docs-preview-title-box">
                <h3 className="mobile-docs-preview-name">{previewDoc.name}</h3>
                <span className="mobile-docs-preview-cat">{previewDoc.category}</span>
              </div>
              <button
                type="button"
                className="mobile-docs-sheet-close"
                onClick={() => setPreviewDoc(null)}
              >
                <X size={17} />
              </button>
            </div>

            {/* Document Metadata Details */}
            <div className="mobile-docs-details-box">
              <div className="mobile-docs-detail-item">
                <span className="mobile-docs-detail-label">File Size</span>
                <span className="mobile-docs-detail-value">{previewDoc.size}</span>
              </div>
              <div className="mobile-docs-detail-item">
                <span className="mobile-docs-detail-label">Format</span>
                <span className="mobile-docs-detail-value">{previewDoc.type}</span>
              </div>
              <div className="mobile-docs-detail-item">
                <span className="mobile-docs-detail-label">Uploaded By</span>
                <span className="mobile-docs-detail-value">{previewDoc.uploadedBy}</span>
              </div>
              <div className="mobile-docs-detail-item">
                <span className="mobile-docs-detail-label">Date Added</span>
                <span className="mobile-docs-detail-value">{previewDoc.uploadedOn}</span>
              </div>
              <div className="mobile-docs-detail-item">
                <span className="mobile-docs-detail-label">Assigned Folder</span>
                <span className="mobile-docs-detail-value">📁 {previewDoc.folderId}</span>
              </div>
              <div className="mobile-docs-detail-item">
                <span className="mobile-docs-detail-label">Security</span>
                <span className="mobile-docs-detail-value text-emerald-400">
                  <ShieldCheck size={12} className="inline mr-1" />
                  Verified &amp; Safe
                </span>
              </div>
            </div>

            {/* Simulated Document Mockup Preview Container */}
            <div className="mobile-docs-rendered-preview">
              <div className="mobile-docs-preview-paper">
                <div className="mobile-docs-preview-paper-header">
                  <div className="mobile-docs-preview-crest-stamp">
                    <Building2 size={24} />
                    <span>INTELLISTRATA OFFICIAL ARCHIVE</span>
                  </div>
                  <span className="mobile-docs-preview-ref">{previewDoc.id}</span>
                </div>
                <div className="mobile-docs-preview-body-lines">
                  <div className="mobile-docs-line bold" />
                  <div className="mobile-docs-line medium" />
                  <div className="mobile-docs-line full" />
                  <div className="mobile-docs-line full" />
                  <div className="mobile-docs-line short" />
                </div>
                <div className="mobile-docs-preview-watermark">
                  <span>CONFIDENTIAL STRATA DOCUMENT</span>
                </div>
              </div>
            </div>

            {/* Modal Action Buttons */}
            <div className="mobile-docs-preview-actions">
              <button
                type="button"
                className="mobile-docs-btn-full primary"
                onClick={(e) => {
                  handleDownload(previewDoc, e);
                  setPreviewDoc(null);
                }}
              >
                <Download size={15} />
                <span>Download Document ({previewDoc.size})</span>
              </button>

              <button
                type="button"
                className="mobile-docs-btn-full secondary"
                onClick={(e) => {
                  handleShare(previewDoc, e);
                }}
              >
                <Share2 size={15} />
                <span>Share Document Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. UPLOAD DOCUMENT BOTTOM SHEET ── */}
      {isUploadModalOpen && (
        <div className="mobile-docs-modal-overlay" onClick={() => setIsUploadModalOpen(false)}>
          <div
            className="mobile-docs-upload-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-docs-sheet-handle" />
            <div className="mobile-docs-sheet-title-row">
              <div>
                <h3 className="mobile-docs-sheet-title">Upload Strata Document</h3>
                <p className="mobile-docs-sheet-desc">Upload files to {selectedProperty?.name}</p>
              </div>
              <button
                type="button"
                className="mobile-docs-sheet-close"
                onClick={() => setIsUploadModalOpen(false)}
              >
                <X size={17} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="mobile-docs-upload-form">
              {/* Dropzone Simulation */}
              <div
                className="mobile-docs-dropzone"
                onClick={() => {
                  if (!newDocName) setNewDocName('Strata General Notice');
                  showToast('Sample file attached');
                }}
              >
                <Upload size={24} className="text-teal-400 mb-1" />
                <span className="mobile-docs-drop-title">Tap to Select File from Device</span>
                <span className="mobile-docs-drop-sub">PDF, Word, Excel, ZIP up to 25 MB</span>
              </div>

              {/* Document Title Input */}
              <div className="mobile-docs-form-group">
                <label className="mobile-docs-form-label">Document Title</label>
                <input
                  type="text"
                  className="mobile-docs-form-input"
                  placeholder="e.g. By-Law Resolution 2026"
                  value={newDocName}
                  onChange={(e) => setNewDocName(e.target.value)}
                  required
                />
              </div>

              {/* Target Folder & Category */}
              <div className="mobile-docs-form-row">
                <div className="mobile-docs-form-group">
                  <label className="mobile-docs-form-label">Property Folder</label>
                  <select
                    className="mobile-docs-form-select"
                    value={newDocFolder}
                    onChange={(e) => setNewDocFolder(e.target.value)}
                  >
                    {propertyFolders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="mobile-docs-form-group">
                  <label className="mobile-docs-form-label">File Type</label>
                  <select
                    className="mobile-docs-form-select"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                  >
                    <option value="PDF">PDF</option>
                    <option value="Excel">Excel (.xlsx)</option>
                    <option value="Word">Word (.docx)</option>
                    <option value="ZIP">ZIP Archive</option>
                  </select>
                </div>
              </div>

              <div className="mobile-docs-form-group">
                <label className="mobile-docs-form-label">Category</label>
                <select
                  className="mobile-docs-form-select"
                  value={newDocCategory}
                  onChange={(e) => setNewDocCategory(e.target.value)}
                >
                  {categories.filter((c) => c !== 'All Categories').map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="mobile-docs-upload-footer">
                <button
                  type="submit"
                  className="mobile-docs-btn-full primary"
                  disabled={isUploading}
                >
                  <Upload size={15} />
                  <span>{isUploading ? 'Uploading Document...' : 'Submit & Save Document'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* ── 9. MORE ACTION SHEET ── */}
      {actionMenuDoc && (
        <div className="mobile-docs-modal-overlay" onClick={() => setActionMenuDoc(null)}>
          <div
            className="mobile-docs-action-sheet"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mobile-docs-sheet-handle" />
            <div className="mobile-docs-action-sheet-head">
              <span className="mobile-docs-action-sheet-title">{actionMenuDoc.name}</span>
              <span className="mobile-docs-action-sheet-sub">{actionMenuDoc.size} • {actionMenuDoc.category}</span>
            </div>

            <div className="mobile-docs-action-sheet-buttons">
              <button
                type="button"
                className="mobile-docs-action-row"
                onClick={() => {
                  setPreviewDoc(actionMenuDoc);
                  setActionMenuDoc(null);
                }}
              >
                <Eye size={16} />
                <span>View Full Preview</span>
              </button>

              <button
                type="button"
                className="mobile-docs-action-row"
                onClick={(e) => {
                  handleDownload(actionMenuDoc, e);
                  setActionMenuDoc(null);
                }}
              >
                <Download size={16} />
                <span>Download to Device</span>
              </button>

              <button
                type="button"
                className="mobile-docs-action-row"
                onClick={(e) => {
                  handleShare(actionMenuDoc, e);
                  setActionMenuDoc(null);
                }}
              >
                <Share2 size={16} />
                <span>Copy Shareable Link</span>
              </button>

              <button
                type="button"
                className="mobile-docs-action-row"
                onClick={(e) => {
                  handleToggleStar(actionMenuDoc.id, e);
                  setActionMenuDoc(null);
                }}
              >
                <Star size={16} fill={starredDocIds.has(actionMenuDoc.id) ? '#f59e0b' : 'none'} />
                <span>{starredDocIds.has(actionMenuDoc.id) ? 'Unpin Document' : 'Pin to Favorites'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDocumentsView;
