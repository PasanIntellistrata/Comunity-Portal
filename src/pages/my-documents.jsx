import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { Page, f7 } from 'framework7-react';
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
} from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { NAV_ITEMS as BASE_NAV_ITEMS } from '../js/data/invoice-data.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import LotSelector from '../components/LotSelector.jsx';
import MobileDocumentsView from '../components/MobileDocumentsView.jsx';
import QuickActionsPopup from '../components/QuickActionsPopup.jsx';
import AiAssistantPopup from '../components/AiAssistantPopup.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';
import {
  PROPERTY_FOLDERS,
  DOCUMENT_CATEGORIES,
  DOCUMENT_TYPES,
  CATEGORY_COLORS,
  INITIAL_DOCUMENTS,
} from '../js/data/documents-data.js';

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
      return <FileText {...iconProps} />;
  }
};

/**
 * Helper to render document file icon
 */
const renderDocIcon = (type) => {
  switch (type?.toLowerCase()) {
    case 'excel':
      return <FileSpreadsheet size={18} color="#10b981" />;
    case 'word':
      return <FileText size={18} color="#3b82f6" />;
    case 'zip':
      return <FileArchive size={18} color="#f59e0b" />;
    case 'powerpoint':
      return <FileCode size={18} color="#ef4444" />;
    case 'pdf':
    default:
      return <FileText size={18} color="#64748b" />;
  }
};

const MyDocumentsPage = () => {
  // Global portal state
  const {
    selectedProperty,
    selectedLot,
    setSelectedProperty,
    setSelectedLot,
    properties,
  } = usePortalSelection();

  const currentUser = authService.getUser?.() || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  // Navigation state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [expandedNav, setExpandedNav] = useState({ documents: true });

  // Popups & FABs state
  const [activePopup, setActivePopup] = useState(null); // 'quickActions' | 'aiAssistant' | null
  const [aiInput, setAiInput] = useState('');
  const [aiMessages, setAiMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const popupRef = useRef(null);
  const fabGroupRef = useRef(null);
  const aiChatEndRef = useRef(null);

  // Global search in navbar
  const [navbarSearch, setNavbarSearch] = useState('');

  // Toast state
  const [toastMsg, setToastMsg] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToastMsg(msg);
    toastTimeoutRef.current = setTimeout(() => {
      setToastMsg(null);
    }, 3200);
  }, []);

  // UI state for My Documents
  const [folderViewMode, setFolderViewMode] = useState('list'); // 'list' | 'grid'
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');
  const [selectedType, setSelectedType] = useState('All Types');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Documents list
  const [documents, setDocuments] = useState(INITIAL_DOCUMENTS);

  // Upload modal state
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [newDocName, setNewDocName] = useState('');
  const [newDocCategory, setNewDocCategory] = useState('Notices & Circulars');
  const [newDocFolder, setNewDocFolder] = useState('ATO');
  const [selectedFile, setSelectedFile] = useState(null);

  // Action Menu state
  const [activeMenuDocId, setActiveMenuDocId] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setActiveMenuDocId(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Filtered documents
  const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
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
      // Combined search query (from in-table search and top navbar)
      const effectiveSearch = (searchQuery || navbarSearch).trim().toLowerCase();
      if (effectiveSearch) {
        const matchName = doc.name.toLowerCase().includes(effectiveSearch);
        const matchCat = doc.category.toLowerCase().includes(effectiveSearch);
        const matchUploader = doc.uploadedBy.toLowerCase().includes(effectiveSearch);
        const matchType = doc.type.toLowerCase().includes(effectiveSearch);
        if (!matchName && !matchCat && !matchUploader && !matchType) {
          return false;
        }
      }
      return true;
    });
  }, [documents, selectedFolderId, selectedCategory, selectedType, searchQuery, navbarSearch]);

  // Paginated documents
  const displayedDocuments = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredDocuments.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredDocuments, currentPage]);

  // Sidebar navigation items with active states
  const navItems = useMemo(() => {
    return BASE_NAV_ITEMS.map((item) => ({
      ...item,
      active: item.id === 'documents',
    }));
  }, []);

  const handleToggleExpand = (id) => {
    setExpandedNav((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleNavClick = (item) => {
    if (item.id === 'home') {
      try {
        f7.views.main.router.navigate('/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/';
      }
    } else if (item.id === 'invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/invoices/';
      }
    } else if (item.id === 'levy') {
      try {
        f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/levy/';
      }
    } else if (item.id === 'maintenance') {
      try {
        f7.views.main.router.navigate('/maintenance/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/maintenance/';
      }
    } else if (item.id === 'documents') {
      // already on documents
      setSelectedFolderId(null);
    } else if (item.id === 'profile') {
      try {
        f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/profile/';
      }
    } else if (item.id === 'committee') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/committee/decisions/';
      }
    } else {
      showToast(`${item.label} section coming soon!`);
    }
  };

  const handleChildNavClick = (child) => {
    if (child === 'Invoice Approval' || child === 'All Invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/invoices/';
      }
    } else if (child === 'Levy Overview') {
      try {
        f7.views.main.router.navigate('/levy/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/levy/';
      }
    } else if (child === 'Report Issues') {
      try {
        f7.views.main.router.navigate('/report-issues/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/report-issues/';
      }
    } else if (child === 'Maintenance') {
      try {
        f7.views.main.router.navigate('/maintenance/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/maintenance/';
      }
    } else if (child === 'Committee Decisions') {
      try {
        f7.views.main.router.navigate('/committee/decisions/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/committee/decisions/';
      }
    }
  };

  const handleLogout = async () => {
    await authService.logout();
    if (onLogout) {
      onLogout();
    }
    try {
      f7.views.main.router.navigate('/login/', { reloadCurrent: true, ignoreCache: true });
    } catch (e) {
      window.location.href = '/login/';
    }
  };

  // Upload handler
  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!newDocName.trim()) {
      showToast('Please provide a document name');
      return;
    }

    const newDoc = {
      id: `DOC-2026-${String(documents.length + 1).padStart(3, '0')}`,
      name: newDocName.endsWith('.pdf') ? newDocName : `${newDocName}.pdf`,
      category: newDocCategory,
      type: 'PDF',
      uploadedBy: 'Pasan Udara',
      uploadedOn: 'Today',
      size: '1.5 MB',
      folderId: newDocFolder,
    };

    setDocuments((prev) => [newDoc, ...prev]);
    setUploadModalOpen(false);
    setNewDocName('');
    setSelectedFile(null);
    showToast(`"${newDoc.name}" uploaded successfully!`);
  };

  return (
    <Page name="my-documents" noNavbar noToolbar className="invoice-page">
      <div className="invoice-app-shell">
        {/* Sidebar Navigation */}
        <AppSidebar
          isOpen={sidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeChildNav=""
          activeNavId="documents"
          onToggleExpand={handleToggleExpand}
          onNavClick={handleNavClick}
          onChildNavClick={handleChildNavClick}
          onLogout={handleLogout}
          onLogoClick={() => {
            try {
              f7.views.main.router.navigate('/');
            } catch (e) {
              window.location.href = '/';
            }
          }}
          onClose={() => setSidebarOpen(false)}
          selectedProperty={selectedProperty}
          selectedLot={selectedLot}
          onSelectProperty={(prop) => {
            setSelectedProperty(prop);
            showToast(`Switched to ${prop.name}`);
          }}
          onSelectLot={(lot) => {
            setSelectedLot(lot);
            showToast(`Selected ${lot}`);
          }}
          properties={properties}
          currentUser={currentUser}
        />

        {/* Main Area */}
        <div className="invoice-main-area">
          {/* Top Header Navbar */}
          <AppNavbar
            searchTerm={navbarSearch}
            onSearchChange={(e) => setNavbarSearch(e.target.value)}
            onSearchClear={() => setNavbarSearch('')}
            searchPlaceholder="Search for invoices, documents, notices..."
            selectedProperty={selectedProperty}
            properties={properties}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              showToast(`Switched to ${prop.name}`);
            }}
            notificationCount={3}
            currentUser={currentUser}
            onProfileClick={() => {
              try { f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true }); } catch (e) { window.location.href = '/profile/'; }
            }}
            onLogout={handleLogout}
            onMobileMenuToggle={() => setSidebarOpen((prev) => !prev)}
          />

          {/* Page Content */}
          <main className="invoice-content-area">
            {/* DESKTOP EXPERIENCE (> 900px) */}
            <div className="docs-desktop-view">
              {/* Breadcrumb Navigation */}
            <nav className="invoice-breadcrumb" aria-label="Breadcrumb">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  try {
                    f7.views.main.router.navigate('/');
                  } catch (err) {
                    window.location.href = '/';
                  }
                }}
              >
                Dashboard
              </a>
              <span className="sep">&gt;</span>
              <span className="current">My Documents</span>
            </nav>

            {/* Sub-label badge */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#0d9488' }} />
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#0d9488', letterSpacing: '0.06em' }}>
                COMMUNITY PORTAL
              </span>
            </div>

            {/* Title Row */}
            <div className="invoice-page-title-row">
              <div>
                <h1 className="invoice-page-title">My Documents</h1>
                <p className="invoice-page-subtitle">
                  Managing{' '}
                  <span className="property-highlight">
                    {selectedProperty?.name || 'Green Valley Residence'}
                  </span>{' '}
                  &bull; <span className="lot-highlight">{selectedLot}</span>
                </p>
              </div>

              <LotSelector
                selectedLot={selectedLot}
                lots={
                  selectedProperty?.lots || [
                    'All Lots',
                    'Lot A-01',
                    'Lot A-02',
                    'Lot A-03',
                    'Lot B-01',
                    'Lot B-02',
                  ]
                }
                propertyName={selectedProperty?.name || 'Green Valley Residence'}
                onSelectLot={(lot) => {
                  setSelectedLot(lot);
                  showToast(`Selected ${lot}`);
                }}
              />
            </div>

            {/* Top KPI Stat Cards */}
            <div className="docs-kpi-grid">
              <div className="docs-kpi-card">
                <div className="docs-kpi-icon-wrap blue">
                  <FileText size={24} />
                </div>
                <div className="docs-kpi-info">
                  <span className="docs-kpi-label">Total Documents</span>
                  <span className="docs-kpi-stat">82</span>
                  <span className="docs-kpi-subtext">Documents uploaded by you</span>
                </div>
              </div>

              <div className="docs-kpi-card">
                <div className="docs-kpi-icon-wrap purple">
                  <Clock size={24} />
                </div>
                <div className="docs-kpi-info">
                  <span className="docs-kpi-label">Recently Added</span>
                  <span className="docs-kpi-stat">12</span>
                  <span className="docs-kpi-subtext">Added in the last 7 days</span>
                </div>
              </div>
            </div>

            {/* Two-Column Main Layout */}
            <div className="docs-main-grid">
              {/* Left Column: Property Folders */}
              <div className="docs-folders-card">
                <div className="docs-folders-header">
                  <div className="docs-folders-header-row1">
                    <h2 className="docs-card-title">Property Folders</h2>
                    <div className="docs-folders-header-actions">
                      <div className="docs-view-toggle-group">
                        <button
                          type="button"
                          className={`docs-view-toggle-btn ${folderViewMode === 'grid' ? 'active' : ''}`}
                          onClick={() => setFolderViewMode('grid')}
                          title="Grid View"
                        >
                          <LayoutGrid size={15} />
                        </button>
                        <button
                          type="button"
                          className={`docs-view-toggle-btn ${folderViewMode === 'list' ? 'active' : ''}`}
                          onClick={() => setFolderViewMode('list')}
                          title="List View"
                        >
                          <List size={15} />
                        </button>
                      </div>
                      <button
                        type="button"
                        className="docs-btn-primary docs-btn-upload-files"
                        onClick={() => setUploadModalOpen(true)}
                        title="Upload Files"
                      >
                        <Upload size={13} />
                        <span>Upload Files</span>
                      </button>
                    </div>
                  </div>

                  <div className="docs-folders-header-row2">
                    <p className="docs-card-subtitle">
                      Browse the documents stored for the selected property and lot
                    </p>
                    <span className="docs-folders-count-badge">
                      {PROPERTY_FOLDERS.length} folders
                    </span>
                  </div>
                </div>

                {/* Folder List or Grid */}
                {folderViewMode === 'list' ? (
                  <div className="docs-folders-list">
                    {PROPERTY_FOLDERS.map((folder) => {
                      const isSelected = selectedFolderId === folder.id;
                      return (
                        <button
                          type="button"
                          key={folder.id}
                          className={`docs-folder-item ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedFolderId(isSelected ? null : folder.id);
                            setCurrentPage(1);
                            if (!isSelected) {
                              showToast(`Filtered by folder: ${folder.name}`);
                            }
                          }}
                        >
                          <div className="docs-folder-left">
                            <div
                              className="docs-folder-icon-box"
                              style={{ background: folder.bgColor }}
                            >
                              {renderFolderIcon(folder.iconType, folder.color)}
                            </div>
                            <div className="docs-folder-text-wrap">
                              <span className="docs-folder-name">{folder.name}</span>
                              <span className="docs-folder-desc">{folder.description}</span>
                            </div>
                          </div>
                          <span className="docs-folder-chevron">
                            <ChevronRight size={16} />
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="docs-folders-grid">
                    {PROPERTY_FOLDERS.map((folder) => {
                      const isSelected = selectedFolderId === folder.id;
                      return (
                        <div
                          key={folder.id}
                          className={`docs-folder-grid-item ${isSelected ? 'active' : ''}`}
                          onClick={() => {
                            setSelectedFolderId(isSelected ? null : folder.id);
                            setCurrentPage(1);
                          }}
                        >
                          <div
                            className="docs-folder-icon-box"
                            style={{ background: folder.bgColor, width: 44, height: 44 }}
                          >
                            {renderFolderIcon(folder.iconType, folder.color)}
                          </div>
                          <span className="docs-folder-name">{folder.name}</span>
                          <span style={{ fontSize: '11px', color: '#94a3b8' }}>
                            {folder.documentCount} files
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="docs-folders-footer">
                  {selectedFolderId ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <span>Filtered by <strong>{selectedFolderId}</strong></span>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#0d9488',
                          fontSize: '12px',
                          fontWeight: '600',
                          cursor: 'pointer',
                        }}
                        onClick={() => setSelectedFolderId(null)}
                      >
                        (Clear Filter)
                      </button>
                    </div>
                  ) : (
                    <span>20 property folders &bull; Select a folder to open it</span>
                  )}
                </div>
              </div>

              {/* Right Column: Documents Table */}
              <div className="docs-table-card">
                <div className="docs-card-header-row docs-table-header-row">
                  <div>
                    {selectedFolderId && (
                      <div className="docs-active-folder-badge">
                        <span>Folder: <strong>{PROPERTY_FOLDERS.find((f) => f.id === selectedFolderId)?.name || selectedFolderId}</strong></span>
                        <button
                          type="button"
                          className="docs-clear-folder-btn"
                          onClick={() => setSelectedFolderId(null)}
                          title="Clear folder filter"
                        >
                          &times;
                        </button>
                      </div>
                    )}
                  </div>
                  <div className="docs-table-top-actions">
                    <button
                      type="button"
                      className="docs-btn-primary"
                      onClick={() => setUploadModalOpen(true)}
                    >
                      <Upload size={14} />
                      <span>Upload Document</span>
                    </button>
                    <button
                      type="button"
                      className="docs-btn-secondary"
                      onClick={() => {
                        // Quick reset or toggle filters
                        if (selectedCategory !== 'All Categories' || selectedType !== 'All Types' || searchQuery || navbarSearch) {
                          setSelectedCategory('All Categories');
                          setSelectedType('All Types');
                          setSearchQuery('');
                          setNavbarSearch('');
                          showToast('Filters cleared');
                        } else {
                          showToast('Use search or category dropdowns below to filter documents');
                        }
                      }}
                    >
                      <Filter size={14} />
                      <span>Filter</span>
                    </button>
                  </div>
                </div>

                {/* Search & Dropdown Controls */}
                <div className="docs-table-controls">
                  <div className="docs-search-wrap">
                    <span className="docs-search-icon">
                      <Search size={15} />
                    </span>
                    <input
                      type="text"
                      className="docs-search-input"
                      placeholder="Search documents..."
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setCurrentPage(1);
                      }}
                    />
                  </div>

                  <select
                    className="docs-filter-select"
                    value={selectedCategory}
                    onChange={(e) => {
                      setSelectedCategory(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {DOCUMENT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    className="docs-filter-select"
                    value={selectedType}
                    onChange={(e) => {
                      setSelectedType(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {DOCUMENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Documents Table */}
                <div className="docs-table-responsive">
                  <table className="docs-table">
                    <thead>
                      <tr>
                        <th className="th-icon"></th>
                        <th>Name</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Uploaded By</th>
                        <th>Uploaded On</th>
                        <th>Size</th>
                        <th className="th-actions">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayedDocuments.length > 0 ? (
                        displayedDocuments.map((doc) => {
                          const catColor = CATEGORY_COLORS[doc.category] || {
                            bg: '#f1f5f9',
                            text: '#475569',
                            border: '#e2e8f0',
                          };
                          const isMenuOpen = activeMenuDocId === doc.id;

                          return (
                            <tr key={doc.id}>
                              <td className="td-icon">{renderDocIcon(doc.type)}</td>
                              <td
                                className="td-name"
                                title={doc.name}
                                onClick={() => {
                                  showToast(`Opening preview for ${doc.name}...`);
                                }}
                              >
                                {doc.name}
                              </td>
                              <td>
                                <span
                                  className="docs-cat-badge"
                                  style={{
                                    background: catColor.bg,
                                    color: catColor.text,
                                    borderColor: catColor.border,
                                  }}
                                >
                                  {doc.category}
                                </span>
                              </td>
                              <td>
                                <span className="docs-type-badge">{doc.type}</span>
                              </td>
                              <td>
                                <span className="docs-uploader">{doc.uploadedBy}</span>
                              </td>
                              <td>
                                <span className="docs-date">{doc.uploadedOn}</span>
                              </td>
                              <td>
                                <span className="docs-size">{doc.size}</span>
                              </td>
                              <td style={{ position: 'relative', textAlign: 'center' }}>
                                <button
                                  type="button"
                                  className="docs-action-btn"
                                  title="Actions"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setActiveMenuDocId(isMenuOpen ? null : doc.id);
                                  }}
                                >
                                  <MoreHorizontal size={16} />
                                </button>

                                {isMenuOpen && (
                                  <div className="docs-action-menu-dropdown" ref={menuRef}>
                                    <button
                                      type="button"
                                      className="docs-action-menu-item"
                                      onClick={() => {
                                        showToast(`Downloading ${doc.name}...`);
                                        setActiveMenuDocId(null);
                                      }}
                                    >
                                      <Download size={13} />
                                      <span>Download</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="docs-action-menu-item"
                                      onClick={() => {
                                        showToast(`Opening preview for ${doc.name}`);
                                        setActiveMenuDocId(null);
                                      }}
                                    >
                                      <Eye size={13} />
                                      <span>Preview</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="docs-action-menu-item"
                                      onClick={() => {
                                        showToast(`Share link copied for ${doc.name}`);
                                        setActiveMenuDocId(null);
                                      }}
                                    >
                                      <Share2 size={13} />
                                      <span>Share Link</span>
                                    </button>
                                    <button
                                      type="button"
                                      className="docs-action-menu-item danger"
                                      onClick={() => {
                                        setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
                                        showToast(`Removed ${doc.name}`);
                                        setActiveMenuDocId(null);
                                      }}
                                    >
                                      <Trash2 size={13} />
                                      <span>Delete</span>
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={8}>
                            <div className="docs-empty-state">
                              <FileText size={36} className="docs-empty-state-icon" />
                              <h4 className="docs-empty-state-title">No documents found</h4>
                              <p className="docs-empty-state-text">
                                Try adjusting your search query or category filters.
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Bar */}
                <div className="docs-pagination-bar">
                  <span className="docs-pagination-count">
                    Showing 1 to {Math.min(displayedDocuments.length, itemsPerPage)} of 248 documents
                  </span>
                  <div className="docs-pagination-buttons">
                    <button
                      type="button"
                      className="docs-page-btn"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                    >
                      &lt;
                    </button>
                    <button
                      type="button"
                      className={`docs-page-btn ${currentPage === 1 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(1)}
                    >
                      1
                    </button>
                    <button
                      type="button"
                      className={`docs-page-btn ${currentPage === 2 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(2)}
                    >
                      2
                    </button>
                    <button
                      type="button"
                      className={`docs-page-btn ${currentPage === 3 ? 'active' : ''}`}
                      onClick={() => setCurrentPage(3)}
                    >
                      3
                    </button>
                    <span className="docs-page-ellipsis">...</span>
                    <button
                      type="button"
                      className="docs-page-btn"
                      onClick={() => setCurrentPage(25)}
                    >
                      25
                    </button>
                    <button
                      type="button"
                      className="docs-page-btn"
                      disabled={currentPage >= 25}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                    >
                      &gt;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* End of DESKTOP EXPERIENCE */}

            {/* MOBILE EXPERIENCE (<= 900px) */}
            <div className="docs-mobile-view">
              <MobileDocumentsView
                documents={documents}
                setDocuments={setDocuments}
                propertyFolders={PROPERTY_FOLDERS}
                categories={DOCUMENT_CATEGORIES}
                types={DOCUMENT_TYPES}
                categoryColors={CATEGORY_COLORS}
                selectedProperty={selectedProperty}
                selectedLot={selectedLot}
                properties={properties}
                onSelectProperty={(prop) => {
                  setSelectedProperty(prop);
                  showToast(`Switched to ${prop.name}`);
                }}
                onSelectLot={(lot) => {
                  setSelectedLot(lot);
                  showToast(`Selected ${lot}`);
                }}
                currentUser={currentUser}
                showToast={showToast}
              />
            </div>
          </main>
        </div>
      </div>

      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="docs-modal-overlay" onClick={() => setUploadModalOpen(false)}>
          <div className="docs-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="docs-modal-header">
              <h3 className="docs-modal-title">Upload New Document</h3>
              <button
                type="button"
                className="docs-modal-close"
                onClick={() => setUploadModalOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit}>
              <div className="docs-modal-body">
                <div
                  className="docs-dropzone"
                  onClick={() => {
                    const input = document.createElement('input');
                    input.type = 'file';
                    input.onchange = (e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0]);
                        setNewDocName(e.target.files[0].name);
                      }
                    };
                    input.click();
                  }}
                >
                  <Upload size={32} className="docs-dropzone-icon" />
                  <p className="docs-dropzone-text">
                    {selectedFile ? selectedFile.name : 'Click or drag files here to upload'}
                  </p>
                  <p className="docs-dropzone-subtext">
                    Supports PDF, DOCX, XLSX, PPTX, ZIP up to 25MB
                  </p>
                </div>

                <div className="docs-form-group">
                  <label className="docs-form-label">Document Name</label>
                  <input
                    type="text"
                    className="docs-form-input"
                    placeholder="e.g. By-Laws Annual Review 2026.pdf"
                    value={newDocName}
                    onChange={(e) => setNewDocName(e.target.value)}
                    required
                  />
                </div>

                <div className="docs-form-group">
                  <label className="docs-form-label">Category</label>
                  <select
                    className="docs-form-select"
                    value={newDocCategory}
                    onChange={(e) => setNewDocCategory(e.target.value)}
                  >
                    {DOCUMENT_CATEGORIES.filter((c) => c !== 'All Categories').map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="docs-form-group">
                  <label className="docs-form-label">Target Folder</label>
                  <select
                    className="docs-form-select"
                    value={newDocFolder}
                    onChange={(e) => setNewDocFolder(e.target.value)}
                  >
                    {PROPERTY_FOLDERS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} — {f.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="docs-modal-footer">
                <button
                  type="button"
                  className="docs-btn-secondary"
                  onClick={() => setUploadModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="docs-btn-primary">
                  <Upload size={14} />
                  <span>Upload</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Actions Popup */}
      {activePopup === 'quickActions' && (
        <QuickActionsPopup
          popupRef={popupRef}
          onClose={() => setActivePopup(null)}
          onAction={(key) => {
            setActivePopup(null);
            if (key === 'documents' || key === 'export') {
              showToast('My Documents repository is currently active');
            } else {
              showToast(`Action "${key}" triggered`);
            }
          }}
        />
      )}

      {/* AI Assistant Popup */}
      {activePopup === 'aiAssistant' && (
        <AiAssistantPopup
          popupRef={popupRef}
          onClose={() => setActivePopup(null)}
          messages={aiMessages}
          isTyping={isAiTyping}
          input={aiInput}
          onInputChange={setAiInput}
          onSubmit={() => {
            if (!aiInput.trim()) return;
            const userMsg = { role: 'user', content: aiInput };
            setAiMessages((prev) => [...prev, userMsg]);
            setAiInput('');
            setIsAiTyping(true);
            setTimeout(() => {
              setAiMessages((prev) => [
                ...prev,
                {
                  role: 'assistant',
                  content: 'Here are the relevant strata documents for your query.',
                },
              ]);
              setIsAiTyping(false);
            }, 800);
          }}
          onSuggestion={(sugg) => {
            setAiInput(sugg);
          }}
          aiChatEndRef={aiChatEndRef}
          onClearChat={() => setAiMessages([])}
        />
      )}

      {/* Floating Action Buttons */}
      <FloatingActionButtons
        fabGroupRef={fabGroupRef}
        activePopup={activePopup}
        onToggleQuickActions={() =>
          setActivePopup((prev) => (prev === 'quickActions' ? null : 'quickActions'))
        }
        onToggleAiAssistant={() =>
          setActivePopup((prev) => (prev === 'aiAssistant' ? null : 'aiAssistant'))
        }
      />

      {/* Toast Notification */}
      {toastMsg && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#0f172a',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: '500',
            boxShadow: '0 8px 20px rgba(0, 0, 0, 0.2)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            animation: 'appDropdownFade 0.2s ease',
          }}
        >
          <CheckCircle2 size={16} color="#10b981" />
          <span>{toastMsg}</span>
        </div>
      )}
    </Page>
  );
};

export default MyDocumentsPage;
