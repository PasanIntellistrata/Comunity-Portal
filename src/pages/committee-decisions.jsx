import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Page, f7 } from 'framework7-react';
import {
  Landmark,
  Plus,
  Download,
  Search,
  X,
  Edit2,
  Trash2,
  Eye,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Layers,
  Info,
  Calendar,
  User,
  Check,
  ChevronDown,
  ArrowUpDown,
  FileSpreadsheet,
  FileText,
  Filter,
} from 'lucide-react';
import { authService } from '../js/services/auth.js';
import { usePortalSelection } from '../js/services/portal-selection.js';
import { NAV_ITEMS as BASE_NAV_ITEMS } from '../js/data/invoice-data.js';
import {
  COMMITTEE_DECISIONS,
  COMMITTEE_CATEGORIES,
  COMMITTEE_STATUSES,
  COMMITTEE_MEMBERS_OPTIONS,
  generateDecisionsCSV,
} from '../js/data/committee-data.js';
import AppSidebar from '../components/AppSidebar.jsx';
import AppNavbar from '../components/AppNavbar.jsx';
import LotSelector from '../components/LotSelector.jsx';
import FloatingActionButtons from '../components/FloatingActionButtons.jsx';

const CommitteeDecisionsPage = ({ onLogout }) => {
  // Current user info
  const currentUser = authService.getUser() || {
    name: 'Portal Resident',
    role: 'Resident Owner',
    unit: '101',
    email: 'resident@intellistrata.com',
  };

  // Shared Portal Property & Lot selection
  const {
    selectedProperty,
    selectedLot,
    setSelectedProperty,
    setSelectedLot,
    properties,
  } = usePortalSelection();

  // Navigation State
  const [navItems] = useState(() =>
    BASE_NAV_ITEMS.map((item) => ({
      ...item,
      active: item.id === 'committee',
    }))
  );
  const [expandedNav, setExpandedNav] = useState({ committee: true });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [navbarSearch, setNavbarSearch] = useState('');

  // Committee Decisions State
  const [decisions, setDecisions] = useState(COMMITTEE_DECISIONS);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All Categories');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortField, setSortField] = useState('decisionDate');
  const [sortDirection, setSortDirection] = useState('desc'); // 'asc' | 'desc'
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [expandedTextIds, setExpandedTextIds] = useState({});

  // Modals state
  const [selectedDecisionForModal, setSelectedDecisionForModal] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [decisionToEdit, setDecisionToEdit] = useState(null);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    topic: '',
    category: 'Safety & Amenities',
    meetingType: 'Executive Committee Meeting',
    decision: '',
    fullResolution: '',
    inFavourMembers: [],
    againstMembers: [],
    abstainMembers: [],
    inFavourVotes: 0,
    againstVotes: 0,
    abstainVotes: 0,
    decisionDate: new Date().toLocaleDateString('en-GB'),
    submittedBy: '',
    actionItems: [],
  });

  const [activeVoteTab, setActiveVoteTab] = useState('inFavour'); // 'inFavour' | 'against' | 'abstain'
  const [isSubmittedByDropdownOpen, setIsSubmittedByDropdownOpen] = useState(false);
  const [isVoteDropdownOpen, setIsVoteDropdownOpen] = useState(false);
  const [isEditSubmittedByDropdownOpen, setIsEditSubmittedByDropdownOpen] = useState(false);
  const [isEditVoteDropdownOpen, setIsEditVoteDropdownOpen] = useState(false);
  const [submittedByTouched, setSubmittedByTouched] = useState(false);
  const modalBodyRef = useRef(null);
  const editModalBodyRef = useRef(null);
  const submittedByRef = useRef(null);
  const voteDropdownRef = useRef(null);
  const editSubmittedByRef = useRef(null);
  const editVoteDropdownRef = useRef(null);

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (submittedByRef.current && !submittedByRef.current.contains(e.target)) {
        setIsSubmittedByDropdownOpen(false);
      }
      if (voteDropdownRef.current && !voteDropdownRef.current.contains(e.target)) {
        setIsVoteDropdownOpen(false);
      }
      if (editSubmittedByRef.current && !editSubmittedByRef.current.contains(e.target)) {
        setIsEditSubmittedByDropdownOpen(false);
      }
      if (editVoteDropdownRef.current && !editVoteDropdownRef.current.contains(e.target)) {
        setIsEditVoteDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Voting Member Handlers
  const handleToggleMemberVote = (memberName) => {
    setFormData((prev) => {
      const inFav = [...(prev.inFavourMembers || [])];
      const against = [...(prev.againstMembers || [])];
      const abstain = [...(prev.abstainMembers || [])];

      if (activeVoteTab === 'inFavour') {
        const idx = inFav.indexOf(memberName);
        if (idx >= 0) {
          inFav.splice(idx, 1);
        } else {
          const aIdx = against.indexOf(memberName);
          if (aIdx >= 0) against.splice(aIdx, 1);
          const abIdx = abstain.indexOf(memberName);
          if (abIdx >= 0) abstain.splice(abIdx, 1);
          inFav.push(memberName);
        }
      } else if (activeVoteTab === 'against') {
        const idx = against.indexOf(memberName);
        if (idx >= 0) {
          against.splice(idx, 1);
        } else {
          const fIdx = inFav.indexOf(memberName);
          if (fIdx >= 0) inFav.splice(fIdx, 1);
          const abIdx = abstain.indexOf(memberName);
          if (abIdx >= 0) abstain.splice(abIdx, 1);
          against.push(memberName);
        }
      } else if (activeVoteTab === 'abstain') {
        const idx = abstain.indexOf(memberName);
        if (idx >= 0) {
          abstain.splice(idx, 1);
        } else {
          const fIdx = inFav.indexOf(memberName);
          if (fIdx >= 0) inFav.splice(fIdx, 1);
          const aIdx = against.indexOf(memberName);
          if (aIdx >= 0) against.splice(aIdx, 1);
          abstain.push(memberName);
        }
      }

      return {
        ...prev,
        inFavourMembers: inFav,
        againstMembers: against,
        abstainMembers: abstain,
        inFavourVotes: inFav.length,
        againstVotes: against.length,
        abstainVotes: abstain.length,
      };
    });
  };

  const handleSelectAllTabVotes = () => {
    setFormData((prev) => {
      const allMembers = COMMITTEE_MEMBERS_OPTIONS.map((m) => m.display);
      let inFav = [...(prev.inFavourMembers || [])];
      let against = [...(prev.againstMembers || [])];
      let abstain = [...(prev.abstainMembers || [])];

      if (activeVoteTab === 'inFavour') {
        inFav = allMembers;
        against = [];
        abstain = [];
      } else if (activeVoteTab === 'against') {
        inFav = [];
        against = allMembers;
        abstain = [];
      } else if (activeVoteTab === 'abstain') {
        inFav = [];
        against = [];
        abstain = allMembers;
      }

      return {
        ...prev,
        inFavourMembers: inFav,
        againstMembers: against,
        abstainMembers: abstain,
        inFavourVotes: inFav.length,
        againstVotes: against.length,
        abstainVotes: abstain.length,
      };
    });
  };

  const handleClearTabVotes = () => {
    setFormData((prev) => {
      let inFav = [...(prev.inFavourMembers || [])];
      let against = [...(prev.againstMembers || [])];
      let abstain = [...(prev.abstainMembers || [])];

      if (activeVoteTab === 'inFavour') inFav = [];
      else if (activeVoteTab === 'against') against = [];
      else if (activeVoteTab === 'abstain') abstain = [];

      return {
        ...prev,
        inFavourMembers: inFav,
        againstMembers: against,
        abstainMembers: abstain,
        inFavourVotes: inFav.length,
        againstVotes: against.length,
        abstainVotes: abstain.length,
      };
    });
  };

  const handleRemoveMemberVote = (tab, memberName, e) => {
    if (e) e.stopPropagation();
    setFormData((prev) => {
      const inFav = [...(prev.inFavourMembers || [])];
      const against = [...(prev.againstMembers || [])];
      const abstain = [...(prev.abstainMembers || [])];

      if (tab === 'inFavour') {
        const idx = inFav.indexOf(memberName);
        if (idx >= 0) inFav.splice(idx, 1);
      } else if (tab === 'against') {
        const idx = against.indexOf(memberName);
        if (idx >= 0) against.splice(idx, 1);
      } else if (tab === 'abstain') {
        const idx = abstain.indexOf(memberName);
        if (idx >= 0) abstain.splice(idx, 1);
      }

      return {
        ...prev,
        inFavourMembers: inFav,
        againstMembers: against,
        abstainMembers: abstain,
        inFavourVotes: inFav.length,
        againstVotes: against.length,
        abstainVotes: abstain.length,
      };
    });
  };

  // Action Items Handlers
  const handleCreateActionItem = () => {
    setFormData((prev) => ({
      ...prev,
      actionItems: [
        ...(prev.actionItems || []),
        {
          id: Date.now(),
          task: '',
          assignee: prev.submittedBy || (COMMITTEE_MEMBERS_OPTIONS[0]?.display || 'Kikzy (Chairperson)'),
          dueDate: '',
        },
      ],
    }));
  };

  const handleUpdateActionItem = (id, field, value) => {
    setFormData((prev) => ({
      ...prev,
      actionItems: (prev.actionItems || []).map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    }));
  };

  const handleRemoveActionItem = (id) => {
    setFormData((prev) => ({
      ...prev,
      actionItems: (prev.actionItems || []).filter((item) => item.id !== id),
    }));
  };

  const handleOpenAddModal = () => {
    setFormData({
      topic: '',
      category: 'Safety & Amenities',
      meetingType: 'Executive Committee Meeting',
      decision: '',
      fullResolution: '',
      inFavourMembers: [],
      againstMembers: [],
      abstainMembers: [],
      inFavourVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      decisionDate: new Date().toLocaleDateString('en-GB'),
      submittedBy: '',
      actionItems: [],
    });
    setActiveVoteTab('inFavour');
    setIsSubmittedByDropdownOpen(false);
    setIsVoteDropdownOpen(false);
    setSubmittedByTouched(false);
    setIsAddModalOpen(true);
    setTimeout(() => {
      if (modalBodyRef.current) {
        modalBodyRef.current.scrollTop = 0;
      }
    }, 40);
  };

  // Toast Helper
  const showToast = useCallback((text, type = 'info') => {
    f7.toast
      .create({
        text,
        position: 'bottom',
        closeTimeout: 3000,
        cssClass: type === 'success' ? 'toast-success' : '',
      })
      .open();
  }, []);

  // Sidebar navigation click handler
  const handleNavClick = (item) => {
    if (item.id === 'committee') {
      // Already on committee
    } else if (item.id === 'home') {
      try {
        f7.views.main.router.navigate('/home/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/home/';
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
      try {
        f7.views.main.router.navigate('/documents/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/documents/';
      }
    } else if (item.id === 'profile') {
      try {
        f7.views.main.router.navigate('/profile/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/profile/';
      }
    } else if (item.id === 'payments') {
      try {
        f7.views.main.router.navigate('/payment-plan/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/payment-plan/';
      }
    } else {
      showToast(`${item.label} section coming soon`);
    }
  };

  const handleChildNavClick = (child) => {
    if (child === 'Committee Decisions') {
      // Already on committee decisions
    } else if (child === 'Invoice Approval' || child === 'All Invoices') {
      try {
        f7.views.main.router.navigate('/invoices/', { animate: false, reloadCurrent: true });
      } catch (e) {
        window.location.href = '/invoices/';
      }
    } else if (child === 'Levy Overview' || child === 'My Levy') {
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
    } else {
      showToast(`${child} coming soon`);
    }
  };

  const handleLogoutClick = () => {
    authService.logout();
    if (onLogout) onLogout();
    try {
      f7.views.main.router.navigate('/login/', { animate: false, reloadCurrent: true });
    } catch (e) {
      window.location.href = '/login/';
    }
  };

  // Toggle Read More
  const toggleReadMore = (id) => {
    setExpandedTextIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Sort Handler
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Filtered & Sorted Decisions
  const filteredDecisions = useMemo(() => {
    return decisions.filter((d) => {
      // Search
      const query = searchTerm.trim().toLowerCase();
      if (query) {
        const matchesQuery =
          d.topic.toLowerCase().includes(query) ||
          d.decision.toLowerCase().includes(query) ||
          d.submittedBy.toLowerCase().includes(query) ||
          d.category.toLowerCase().includes(query);
        if (!matchesQuery) return false;
      }

      // Category
      if (categoryFilter !== 'All Categories' && d.category !== categoryFilter) {
        return false;
      }

      // Status
      if (statusFilter !== 'all') {
        if (statusFilter === 'unanimous' && d.status !== 'Unanimous') return false;
        if (statusFilter === 'passed' && d.status !== 'Passed' && d.status !== 'Unanimous') return false;
        if (statusFilter === 'rejected' && d.status !== 'Rejected') return false;
      }

      return true;
    });
  }, [decisions, searchTerm, categoryFilter, statusFilter]);

  const sortedDecisions = useMemo(() => {
    const list = [...filteredDecisions];
    list.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'inFavourPct') {
        valA = parseFloat(a.inFavourPct) || 0;
        valB = parseFloat(b.inFavourPct) || 0;
      } else if (sortField === 'decisionDate') {
        valA = a.dateRaw || a.decisionDate;
        valB = b.dateRaw || b.decisionDate;
      } else if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = (valB || '').toLowerCase();
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
    return list;
  }, [filteredDecisions, sortField, sortDirection]);

  // Pagination
  const totalPages = Math.ceil(sortedDecisions.length / pageSize) || 1;
  const paginatedDecisions = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sortedDecisions.slice(start, start + pageSize);
  }, [sortedDecisions, currentPage, pageSize]);

  // Dynamic KPI Stats
  const kpiStats = useMemo(() => {
    const total = decisions.length;
    const unanimous = decisions.filter((d) => d.status === 'Unanimous').length;
    const passed = decisions.filter((d) => d.status === 'Passed' || d.status === 'Unanimous').length;
    const rate = total > 0 ? ((passed / total) * 100).toFixed(1) + '%' : '0%';
    const totalVotesSum = decisions.reduce((acc, d) => acc + d.totalVotes, 0);

    return {
      total,
      unanimous,
      rate,
      totalVotesSum,
    };
  }, [decisions]);

  // CSV Export Action
  const handleExportCSV = () => {
    try {
      const csvContent = generateDecisionsCSV(filteredDecisions);
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `committee_decisions_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      showToast('Committee decisions spreadsheet downloaded successfully!', 'success');
    } catch (e) {
      showToast('Failed to export CSV', 'error');
    }
  };

  // Add Decision Submit
  const handleAddSubmit = (e) => {
    e.preventDefault();
    setSubmittedByTouched(true);

    if (!formData.topic.trim()) {
      showToast('Please enter a topic title.', 'error');
      return;
    }
    if (!formData.decision.trim()) {
      showToast('Please enter the decision summary.', 'error');
      return;
    }
    if (!formData.submittedBy.trim()) {
      showToast('Submitted By is required.', 'error');
      return;
    }

    const inFav = formData.inFavourMembers?.length || 0;
    const against = formData.againstMembers?.length || 0;
    const abstain = formData.abstainMembers?.length || 0;
    const total = inFav + against + abstain;
    const pctNum = total > 0 ? (inFav / total) * 100 : 0;
    const pct = `${pctNum.toFixed(1)}%`;

    let status = 'Passed';
    if (inFav === total && total > 0) status = 'Unanimous';
    else if (pctNum <= 50) status = 'Rejected';

    const submitterParts = formData.submittedBy.split(' (');
    const submitterName = submitterParts[0] || formData.submittedBy;
    const submitterRole = submitterParts[1] ? submitterParts[1].replace(')', '') : 'Committee Member';

    const newRecord = {
      id: `CD-2026-00${decisions.length + 1}`,
      topic: formData.topic.trim(),
      category: formData.category || 'Safety & Amenities',
      meetingType: formData.meetingType || 'Executive Committee Meeting',
      decision: formData.decision.trim(),
      fullResolution: formData.fullResolution?.trim() || formData.decision.trim(),
      inFavourMembers: formData.inFavourMembers || [],
      againstMembers: formData.againstMembers || [],
      abstainMembers: formData.abstainMembers || [],
      inFavourVotes: inFav,
      againstVotes: against,
      abstainVotes: abstain,
      totalVotes: total,
      inFavourPct: pct,
      decisionDate: formData.decisionDate,
      dateRaw: new Date().toISOString().slice(0, 10),
      submittedBy: formData.submittedBy,
      submitterName,
      submitterRole,
      status,
      quorumMet: total >= 2,
      actionItems: formData.actionItems || [],
      attachments: [],
    };

    setDecisions((prev) => [newRecord, ...prev]);
    setIsAddModalOpen(false);
    showToast('New committee decision recorded successfully!', 'success');
    // Reset form
    setFormData({
      topic: '',
      category: 'Safety & Amenities',
      meetingType: 'Executive Committee Meeting',
      decision: '',
      fullResolution: '',
      inFavourMembers: [],
      againstMembers: [],
      abstainMembers: [],
      inFavourVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      decisionDate: new Date().toLocaleDateString('en-GB'),
      submittedBy: '',
      actionItems: [],
    });
    setSubmittedByTouched(false);
    setIsMemberDropdownOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (item) => {
    setDecisionToEdit(item);
    let inFavour = item.inFavourMembers ? [...item.inFavourMembers] : [];
    let against = item.againstMembers ? [...item.againstMembers] : [];
    let abstain = item.abstainMembers ? [...item.abstainMembers] : [];

    // If legacy item with votes but no member array, populate with sample members
    if (inFavour.length === 0 && item.inFavourVotes > 0) {
      inFavour = COMMITTEE_MEMBERS_OPTIONS.slice(0, Math.min(item.inFavourVotes, COMMITTEE_MEMBERS_OPTIONS.length)).map((m) => m.display);
    }
    if (against.length === 0 && item.againstVotes > 0) {
      against = COMMITTEE_MEMBERS_OPTIONS.slice(inFavour.length, Math.min(inFavour.length + item.againstVotes, COMMITTEE_MEMBERS_OPTIONS.length)).map((m) => m.display);
    }

    setFormData({
      topic: item.topic || '',
      category: item.category || 'Safety & Amenities',
      meetingType: item.meetingType || 'Executive Committee Meeting',
      decision: item.decision || '',
      fullResolution: item.fullResolution || item.decision || '',
      inFavourMembers: inFavour,
      againstMembers: against,
      abstainMembers: abstain,
      inFavourVotes: inFavour.length,
      againstVotes: against.length,
      abstainVotes: abstain.length,
      decisionDate: item.decisionDate || new Date().toLocaleDateString('en-GB'),
      submittedBy: item.submittedBy || '',
      actionItems: item.actionItems || [],
    });
    setActiveVoteTab('inFavour');
    setSubmittedByTouched(false);
    setIsMemberDropdownOpen(false);
    setIsEditModalOpen(true);
    setTimeout(() => {
      if (editModalBodyRef.current) {
        editModalBodyRef.current.scrollTop = 0;
      }
    }, 40);
  };

  // Edit Decision Submit
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!decisionToEdit) return;

    setSubmittedByTouched(true);
    if (!formData.topic.trim()) {
      showToast('Please enter a topic title.', 'error');
      return;
    }
    if (!formData.decision.trim()) {
      showToast('Please enter the decision summary.', 'error');
      return;
    }
    if (!formData.submittedBy.trim()) {
      showToast('Submitted By is required.', 'error');
      return;
    }

    const inFav = formData.inFavourMembers?.length || 0;
    const against = formData.againstMembers?.length || 0;
    const abstain = formData.abstainMembers?.length || 0;
    const total = inFav + against + abstain;
    const pctNum = total > 0 ? (inFav / total) * 100 : 0;
    const pct = `${pctNum.toFixed(1)}%`;

    let status = 'Passed';
    if (inFav === total && total > 0) status = 'Unanimous';
    else if (pctNum <= 50) status = 'Rejected';

    setDecisions((prev) =>
      prev.map((d) =>
        d.id === decisionToEdit.id
          ? {
              ...d,
              topic: formData.topic.trim(),
              category: formData.category,
              meetingType: formData.meetingType,
              decision: formData.decision.trim(),
              fullResolution: formData.fullResolution.trim() || formData.decision.trim(),
              inFavourMembers: formData.inFavourMembers,
              againstMembers: formData.againstMembers,
              abstainMembers: formData.abstainMembers,
              inFavourVotes: inFav,
              againstVotes: against,
              abstainVotes: abstain,
              totalVotes: total,
              inFavourPct: pct,
              decisionDate: formData.decisionDate,
              submittedBy: formData.submittedBy,
              status,
              actionItems: formData.actionItems,
            }
          : d
      )
    );

    setIsEditModalOpen(false);
    setDecisionToEdit(null);
    showToast('Committee decision updated successfully!', 'success');
  };

  // Delete Action
  const handleDelete = (id, topic) => {
    f7.dialog.confirm(
      `Are you sure you want to remove the decision "${topic}" from the official register?`,
      'Confirm Deletion',
      () => {
        setDecisions((prev) => prev.filter((d) => d.id !== id));
        showToast('Decision removed from register', 'info');
      }
    );
  };

  return (
    <Page className="committee-page" id="committee-page">
      <div className="committee-app-shell">
        {/* Shared Sidebar */}
        <AppSidebar
          isOpen={isSidebarOpen}
          navItems={navItems}
          expandedNav={expandedNav}
          activeNavId="committee"
          activeChildNav="Committee Decisions"
          onToggleExpand={(id) => setExpandedNav((prev) => ({ ...prev, [id]: !prev[id] }))}
          onNavClick={handleNavClick}
          onChildNavClick={handleChildNavClick}
          onLogout={handleLogoutClick}
          onLogoClick={() => showToast('Intellistrata Portal')}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <div className="committee-main-area" id="committee-main-area">
          {/* Top Navbar */}
          <AppNavbar
            searchTerm={navbarSearch}
            onSearchChange={(e) => setNavbarSearch(e.target.value)}
            onSearchClear={() => setNavbarSearch('')}
            searchPlaceholder="Search committee decisions, motions, minutes..."
            selectedProperty={selectedProperty}
            properties={properties}
            onSelectProperty={(prop) => {
              setSelectedProperty(prop);
              showToast(`Switched to ${prop.name}`, 'success');
            }}
            notificationCount={3}
            currentUser={currentUser}
            onLogout={handleLogoutClick}
            onMobileMenuToggle={() => setIsSidebarOpen((prev) => !prev)}
          />

          {/* Scrollable Content Container */}
          <div className="committee-content-area" id="committee-content-area">
            <div className="committee-content-container">
              {/* Breadcrumb & Title Bar */}
              <div className="committee-title-row">
                <div>
                  <nav className="committee-breadcrumbs" aria-label="Breadcrumb">
                    <a href="/">Home</a>
                    <span>&bull;</span>
                    <a href="/committee/decisions/">Committee</a>
                    <span>&bull;</span>
                    <span>Committee Decisions</span>
                  </nav>
                  <h1 className="committee-page-title">
                    <span>Committee Decisions</span>
                  </h1>
                </div>

                {/* Header Actions */}
                <div className="committee-header-actions">
                  <LotSelector
                    selectedLot={selectedLot}
                    lots={selectedProperty?.lots || ['All Lots', 'Lot A-01', 'Lot A-02', 'Lot A-03']}
                    propertyName={selectedProperty?.name || 'Demo 7 Wolsley Street'}
                    onSelectLot={(lot) => {
                      setSelectedLot(lot);
                      showToast(`Selected ${lot}`, 'info');
                    }}
                  />
                  <button
                    type="button"
                    className="committee-btn-primary"
                    onClick={handleOpenAddModal}
                  >
                    <Plus size={16} />
                    <span>Add Committee Decision</span>
                  </button>
                  <button
                    type="button"
                    className="committee-btn-excel"
                    onClick={handleExportCSV}
                    title="Export decision list to CSV spreadsheet"
                  >
                    <Download size={15} />
                    <span>Download Excel</span>
                  </button>
                </div>
              </div>

              {/* KPI Metric Summary Cards */}
              <div className="committee-metrics-grid">
                <div className="committee-metric-card">
                  <div className="committee-metric-icon teal">
                    <Landmark size={22} />
                  </div>
                  <div className="committee-metric-text">
                    <span className="committee-metric-val">{kpiStats.total}</span>
                    <span className="committee-metric-lbl">Total Decisions</span>
                  </div>
                </div>

                <div className="committee-metric-card">
                  <div className="committee-metric-icon emerald">
                    <CheckCircle2 size={22} />
                  </div>
                  <div className="committee-metric-text">
                    <span className="committee-metric-val">{kpiStats.unanimous}</span>
                    <span className="committee-metric-lbl">Unanimous (100% In Favour)</span>
                  </div>
                </div>

                <div className="committee-metric-card">
                  <div className="committee-metric-icon blue">
                    <Check size={22} />
                  </div>
                  <div className="committee-metric-text">
                    <span className="committee-metric-val">{kpiStats.rate}</span>
                    <span className="committee-metric-lbl">Overall Passing Rate</span>
                  </div>
                </div>

                <div className="committee-metric-card">
                  <div className="committee-metric-icon purple">
                    <User size={22} />
                  </div>
                  <div className="committee-metric-text">
                    <span className="committee-metric-val">{kpiStats.totalVotesSum}</span>
                    <span className="committee-metric-lbl">Total Votes Cast</span>
                  </div>
                </div>
              </div>

              {/* Toolbar: Search & Filters */}
              <div className="committee-toolbar-card">
                <div className="committee-search-wrap">
                  <Search size={16} className="committee-search-icon" />
                  <input
                    type="text"
                    className="committee-search-input"
                    placeholder="Search an item from the list..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      className="committee-search-clear"
                      onClick={() => setSearchTerm('')}
                    >
                      <X size={15} />
                    </button>
                  )}
                </div>

                <div className="committee-filters-row">
                  <select
                    className="committee-select-filter"
                    value={categoryFilter}
                    onChange={(e) => {
                      setCategoryFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {COMMITTEE_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>

                  <select
                    className="committee-select-filter"
                    value={statusFilter}
                    onChange={(e) => {
                      setStatusFilter(e.target.value);
                      setCurrentPage(1);
                    }}
                  >
                    {COMMITTEE_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Committee Decisions Table Card */}
              <div className="committee-table-card">
                <div className="committee-table-responsive">
                  <table className="committee-table">
                    <thead>
                      <tr>
                        <th>Actions</th>
                        <th
                          className="sortable"
                          onClick={() => handleSort('topic')}
                        >
                          <div className="committee-th-inner">
                            <span>Topic</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                        <th>Decision</th>
                        <th
                          className="sortable"
                          style={{ textAlign: 'center' }}
                          onClick={() => handleSort('inFavourVotes')}
                        >
                          <div className="committee-th-inner">
                            <span>In Favour Votes</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                        <th
                          className="sortable"
                          style={{ textAlign: 'center' }}
                          onClick={() => handleSort('againstVotes')}
                        >
                          <div className="committee-th-inner">
                            <span>Against Votes</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                        <th
                          className="sortable"
                          style={{ textAlign: 'center' }}
                          onClick={() => handleSort('abstainVotes')}
                        >
                          <div className="committee-th-inner">
                            <span>Abstain Votes</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                        <th
                          className="sortable"
                          style={{ textAlign: 'center' }}
                          onClick={() => handleSort('totalVotes')}
                        >
                          <div className="committee-th-inner">
                            <span>Total Votes</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                        <th
                          className="sortable"
                          style={{ textAlign: 'center' }}
                          onClick={() => handleSort('inFavourPct')}
                        >
                          <div className="committee-th-inner">
                            <span>In Favour %</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                        <th
                          className="sortable"
                          onClick={() => handleSort('decisionDate')}
                        >
                          <div className="committee-th-inner">
                            <span>Decision Date</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                        <th
                          className="sortable"
                          onClick={() => handleSort('submittedBy')}
                        >
                          <div className="committee-th-inner">
                            <span>Submitted By</span>
                            <ArrowUpDown size={12} />
                          </div>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {paginatedDecisions.length === 0 ? (
                        <tr>
                          <td colSpan={10}>
                            <div className="committee-empty-state">
                              <div className="committee-empty-icon">
                                <Search size={24} />
                              </div>
                              <h4 className="committee-empty-title">No matching committee decisions found</h4>
                              <p className="committee-empty-desc">
                                Try adjusting your search keywords or filter settings to view more items.
                              </p>
                              {(searchTerm || categoryFilter !== 'All Categories' || statusFilter !== 'all') && (
                                <button
                                  type="button"
                                  className="committee-btn-secondary"
                                  onClick={() => {
                                    setSearchTerm('');
                                    setCategoryFilter('All Categories');
                                    setStatusFilter('all');
                                  }}
                                >
                                  Clear Filters
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ) : (
                        paginatedDecisions.map((item) => {
                          const isExpanded = !!expandedTextIds[item.id];
                          const isLongText = item.decision.length > 120;
                          const displayedDecision =
                            isLongText && !isExpanded
                              ? `${item.decision.slice(0, 120)}...`
                              : item.decision;

                          const pctVal = parseFloat(item.inFavourPct) || 0;
                          let pctClass = 'passed';
                          if (pctVal === 100) pctClass = 'unanimous';
                          else if (pctVal <= 50) pctClass = 'rejected';

                          return (
                            <tr key={item.id}>
                              {/* Actions */}
                              <td className="committee-actions-cell">
                                <div className="committee-actions-wrap">
                                  <button
                                    type="button"
                                    className="committee-action-btn"
                                    onClick={() => setSelectedDecisionForModal(item)}
                                    title="View Full Resolution Details"
                                  >
                                    <Eye size={14} />
                                  </button>
                                  <button
                                    type="button"
                                    className="committee-action-btn edit"
                                    onClick={() => handleOpenEdit(item)}
                                    title="Edit Decision"
                                  >
                                    <Edit2 size={13} />
                                  </button>
                                  <button
                                    type="button"
                                    className="committee-action-btn delete"
                                    onClick={() => handleDelete(item.id, item.topic)}
                                    title="Delete Decision"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </td>

                              {/* Topic */}
                              <td className="committee-topic-cell">
                                <div className="committee-topic-title">{item.topic}</div>
                                <span className="committee-category-badge">{item.category}</span>
                              </td>

                              {/* Decision */}
                              <td className="committee-decision-cell">
                                <p className="committee-decision-text">{displayedDecision}</p>
                                {isLongText && (
                                  <button
                                    type="button"
                                    className="committee-read-more-btn"
                                    onClick={() => toggleReadMore(item.id)}
                                  >
                                    {isExpanded ? 'Show less' : 'Read full text'}
                                  </button>
                                )}
                              </td>

                              {/* In Favour Votes */}
                              <td className="committee-votes-cell">
                                <span className="committee-vote-num favour">{item.inFavourVotes}</span>
                              </td>

                              {/* Against Votes */}
                              <td className="committee-votes-cell">
                                <span className="committee-vote-num against">{item.againstVotes}</span>
                              </td>

                              {/* Abstain Votes */}
                              <td className="committee-votes-cell">
                                <span className="committee-vote-num abstain">{item.abstainVotes}</span>
                              </td>

                              {/* Total Votes */}
                              <td className="committee-votes-cell">
                                <span className="committee-vote-num total">{item.totalVotes}</span>
                              </td>

                              {/* In Favour % */}
                              <td className="committee-pct-cell">
                                <span className={`committee-pct-badge ${pctClass}`}>
                                  {item.inFavourPct}
                                </span>
                              </td>

                              {/* Decision Date */}
                              <td className="committee-date-cell">
                                <div className="committee-date-wrap">
                                  <Calendar size={13} />
                                  <span>{item.decisionDate}</span>
                                </div>
                              </td>

                              {/* Submitted By */}
                              <td className="committee-submitter-cell">
                                <div className="committee-submitter-name">
                                  {item.submitterName || item.submittedBy.split('(')[0]}
                                </div>
                                <span className="committee-submitter-role">
                                  {item.submitterRole
                                    ? `(${item.submitterRole})`
                                    : item.submittedBy.includes('(')
                                    ? `(${item.submittedBy.split('(')[1]}`
                                    : ''}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Matching Screenshot Format */}
                <div className="committee-pagination-bar">
                  <div className="committee-pagination-info">
                    Showing {(currentPage - 1) * pageSize + 1} to{' '}
                    {Math.min(currentPage * pageSize, sortedDecisions.length)} of{' '}
                    {sortedDecisions.length} entries
                  </div>

                  <div className="committee-pagination-controls">
                    <button
                      type="button"
                      className="committee-pagination-btn"
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1}
                      title="First Page"
                    >
                      &laquo;
                    </button>
                    <button
                      type="button"
                      className="committee-pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      title="Previous Page"
                    >
                      &lsaquo;
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`committee-pagination-btn ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}
                      >
                        {page}
                      </button>
                    ))}

                    <button
                      type="button"
                      className="committee-pagination-btn"
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      title="Next Page"
                    >
                      &rsaquo;
                    </button>
                    <button
                      type="button"
                      className="committee-pagination-btn"
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages}
                      title="Last Page"
                    >
                      &raquo;
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Buttons */}
      <FloatingActionButtons />

      {/* Detail Modal */}
      {selectedDecisionForModal && createPortal(
        <div
          className="committee-modal-overlay"
          onClick={() => setSelectedDecisionForModal(null)}
        >
          <div
            className="committee-modal-box"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="committee-modal-header">
              <h3 className="committee-modal-title">
                <FileText size={18} />
                <span>Committee Resolution Details</span>
              </h3>
              <button
                type="button"
                className="committee-modal-close-btn"
                onClick={() => setSelectedDecisionForModal(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="committee-modal-body">
              <div className="committee-detail-row">
                <span className="committee-detail-label">Decision ID:</span>
                <span className="committee-detail-val">
                  <strong>{selectedDecisionForModal.id}</strong>
                </span>
              </div>
              <div className="committee-detail-row">
                <span className="committee-detail-label">Topic:</span>
                <span className="committee-detail-val">
                  <strong>{selectedDecisionForModal.topic}</strong>
                </span>
              </div>
              <div className="committee-detail-row">
                <span className="committee-detail-label">Category:</span>
                <span className="committee-detail-val">
                  {selectedDecisionForModal.category} &bull; {selectedDecisionForModal.meetingType}
                </span>
              </div>
              <div className="committee-detail-row">
                <span className="committee-detail-label">Voting Breakdown:</span>
                <div className="committee-detail-val">
                  <span className="committee-vote-num favour" style={{ marginRight: 6 }}>
                    In Favour: {selectedDecisionForModal.inFavourVotes}
                  </span>
                  <span className="committee-vote-num against" style={{ marginRight: 6 }}>
                    Against: {selectedDecisionForModal.againstVotes}
                  </span>
                  <span className="committee-vote-num abstain" style={{ marginRight: 6 }}>
                    Abstain: {selectedDecisionForModal.abstainVotes}
                  </span>
                  <span className="committee-vote-num total">
                    Total: {selectedDecisionForModal.totalVotes} ({selectedDecisionForModal.inFavourPct})
                  </span>
                </div>
              </div>
              <div className="committee-detail-row">
                <span className="committee-detail-label">Resolution Summary:</span>
                <div className="committee-detail-val">{selectedDecisionForModal.decision}</div>
              </div>
              <div className="committee-detail-row">
                <span className="committee-detail-label">Full Legal Wording:</span>
                <div className="committee-detail-val">
                  {selectedDecisionForModal.fullResolution || selectedDecisionForModal.decision}
                </div>
              </div>
              <div className="committee-detail-row">
                <span className="committee-detail-label">Determination Date:</span>
                <span className="committee-detail-val">{selectedDecisionForModal.decisionDate}</span>
              </div>
              <div className="committee-detail-row">
                <span className="committee-detail-label">Submitted By:</span>
                <span className="committee-detail-val">{selectedDecisionForModal.submittedBy}</span>
              </div>
            </div>

            <div className="committee-modal-footer">
              <button
                type="button"
                className="committee-btn-secondary"
                onClick={() => setSelectedDecisionForModal(null)}
              >
                Close
              </button>
              <button
                type="button"
                className="committee-btn-primary"
                onClick={() => {
                  showToast('Resolution details copied to clipboard!', 'success');
                  if (navigator.clipboard) {
                    navigator.clipboard.writeText(
                      `Topic: ${selectedDecisionForModal.topic}\nDate: ${selectedDecisionForModal.decisionDate}\nResolution: ${selectedDecisionForModal.fullResolution || selectedDecisionForModal.decision}\nVotes: In Favour: ${selectedDecisionForModal.inFavourVotes}, Against: ${selectedDecisionForModal.againstVotes}, Abstain: ${selectedDecisionForModal.abstainVotes}`
                    );
                  }
                }}
              >
                Copy Resolution
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Add Committee Decision Modal */}
      {isAddModalOpen && createPortal(
        <div
          className="committee-modal-overlay"
          onClick={() => {
            setIsAddModalOpen(false);
            setIsSubmittedByDropdownOpen(false);
            setIsVoteDropdownOpen(false);
          }}
        >
          <div
            className="committee-modal-box wide"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="committee-modal-header">
              <div className="committee-modal-header-branding">
                <span className="committee-modal-breadcrumb">
                  <Landmark size={18} className="committee-modal-header-icon" />
                  <span>Committee Decisions</span>
                </span>
                <span className="committee-modal-subnav-badge">
                  Add Committee Decision
                </span>
              </div>
              <button
                type="button"
                className="committee-modal-close-btn"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setIsSubmittedByDropdownOpen(false);
                  setIsVoteDropdownOpen(false);
                }}
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit}>
              <div className="committee-modal-body" ref={modalBodyRef}>
                {/* Two-Column Main Layout */}
                <div className="committee-form-grid-2">
                  {/* Left Column */}
                  <div className="committee-form-col">
                    {/* Topic Field */}
                    <div className="committee-form-group">
                      <label className="committee-form-label">
                        Topic: <span className="committee-required-star">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        required
                        className="committee-form-input"
                        placeholder="Please enter topic..."
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      />
                      <div className="committee-form-hint-row">
                        <span className="committee-hint-text">
                          Please fill this section. (Please enter no more than 120 characters)
                        </span>
                        <span className="committee-char-count">{formData.topic.length}/120</span>
                      </div>
                    </div>

                    {/* Decision Field */}
                    <div className="committee-form-group">
                      <label className="committee-form-label">
                        Decision: <span className="committee-required-star">*</span>
                      </label>
                      <textarea
                        maxLength={5000}
                        required
                        className="committee-form-textarea decision-textarea"
                        placeholder="Please enter decision summary..."
                        value={formData.decision}
                        onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                      />
                      <div className="committee-form-hint-row">
                        <span className="committee-hint-text">
                          Please fill this section. (Please enter no more than 5000 characters)
                        </span>
                        <span className="committee-char-count">{formData.decision.length}/5000</span>
                      </div>
                    </div>

                    {/* Decision Date Field */}
                    <div className="committee-form-group">
                      <label className="committee-form-label">
                        Decision Date : <span className="committee-required-star">*</span>
                      </label>
                      <div className="committee-date-input-wrap">
                        <input
                          type="text"
                          required
                          className="committee-form-input committee-date-input"
                          value={formData.decisionDate}
                          onChange={(e) => setFormData({ ...formData, decisionDate: e.target.value })}
                          placeholder="DD/MM/YYYY"
                        />
                        <Calendar size={18} className="committee-date-icon" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="committee-form-col">
                    {/* Submitted By Custom Dropdown */}
                    <div className="committee-form-group" ref={submittedByRef}>
                      <label className="committee-form-label">
                        Submitted By: <span className="committee-required-star">*</span>
                      </label>
                      <div className="committee-member-multiselect-container">
                        <button
                          type="button"
                          className={`committee-custom-select-trigger ${isSubmittedByDropdownOpen ? 'open' : ''} ${
                            submittedByTouched && !formData.submittedBy ? 'has-error' : ''
                          }`}
                          onClick={() => setIsSubmittedByDropdownOpen(!isSubmittedByDropdownOpen)}
                        >
                          <span className={formData.submittedBy ? 'committee-member-option-name' : 'committee-member-placeholder'}>
                            {formData.submittedBy || 'Select committee member'}
                          </span>
                          <ChevronDown size={16} className={`committee-multiselect-chevron ${isSubmittedByDropdownOpen ? 'open' : ''}`} />
                        </button>

                        {isSubmittedByDropdownOpen && (
                          <div className="committee-custom-dropdown-menu">
                            {COMMITTEE_MEMBERS_OPTIONS.map((m) => {
                              const isSelected = formData.submittedBy === m.display;
                              return (
                                <div
                                  key={m.id}
                                  className={`committee-custom-select-option ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, submittedBy: m.display }));
                                    setSubmittedByTouched(false);
                                    setIsSubmittedByDropdownOpen(false);
                                  }}
                                >
                                  <div className="committee-member-option-left">
                                    <span className="committee-member-option-name">{m.name}</span>
                                    <span className="committee-member-option-role">({m.role})</span>
                                  </div>
                                  {isSelected && <Check size={16} color="var(--color-primary, #0d9488)" />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {submittedByTouched && !formData.submittedBy && (
                        <span className="committee-validation-error">
                          Submitted By is required
                        </span>
                      )}
                    </div>

                    {/* Amber Warning Alert (when 0 votes selected across all tabs) */}
                    {(formData.inFavourMembers?.length || 0) +
                      (formData.againstMembers?.length || 0) +
                      (formData.abstainMembers?.length || 0) === 0 && (
                      <div className="committee-form-warning-alert">
                        <AlertCircle size={17} className="committee-warning-icon" />
                        <span>Please select at least one committee member from any tab.</span>
                      </div>
                    )}

                    {/* Voting Tabs Card */}
                    <div className="committee-voting-card">
                      <div className="committee-vote-tabs-header">
                        <button
                          type="button"
                          className={`committee-vote-tab ${activeVoteTab === 'inFavour' ? 'active' : ''}`}
                          onClick={() => setActiveVoteTab('inFavour')}
                        >
                          <span>In Favour Votes</span>
                          <span className="committee-vote-badge">{formData.inFavourMembers?.length || 0}</span>
                        </button>
                        <button
                          type="button"
                          className={`committee-vote-tab ${activeVoteTab === 'against' ? 'active' : ''}`}
                          onClick={() => setActiveVoteTab('against')}
                        >
                          <span>Against Votes</span>
                          <span className="committee-vote-badge">{formData.againstMembers?.length || 0}</span>
                        </button>
                        <button
                          type="button"
                          className={`committee-vote-tab ${activeVoteTab === 'abstain' ? 'active' : ''}`}
                          onClick={() => setActiveVoteTab('abstain')}
                        >
                          <span>Abstain Votes</span>
                          <span className="committee-vote-badge">{formData.abstainMembers?.length || 0}</span>
                        </button>
                      </div>

                      {/* Tab Body */}
                      <div className="committee-vote-tab-body">
                        <div className="committee-vote-tab-heading">Committee Members</div>
                        <div className="committee-vote-tab-desc">
                          {activeVoteTab === 'inFavour' && 'Select committee members who voted in favor'}
                          {activeVoteTab === 'against' && 'Select committee members who voted against'}
                          {activeVoteTab === 'abstain' && 'Select committee members who abstained'}
                        </div>

                        {/* Custom Multi-Select Dropdown for Members */}
                        <div className="committee-member-multiselect-container" ref={voteDropdownRef}>
                          <button
                            type="button"
                            className={`committee-member-multiselect-trigger ${isVoteDropdownOpen ? 'open' : ''}`}
                            onClick={() => setIsVoteDropdownOpen(!isVoteDropdownOpen)}
                          >
                            {(activeVoteTab === 'inFavour'
                              ? formData.inFavourMembers
                              : activeVoteTab === 'against'
                              ? formData.againstMembers
                              : formData.abstainMembers
                            )?.length === 0 ? (
                              <span className="committee-member-placeholder">Select committee members...</span>
                            ) : (
                              <span className="committee-member-active-summary">
                                {(activeVoteTab === 'inFavour'
                                  ? formData.inFavourMembers
                                  : activeVoteTab === 'against'
                                  ? formData.againstMembers
                                  : formData.abstainMembers
                                )?.length} member{(activeVoteTab === 'inFavour'
                                  ? formData.inFavourMembers
                                  : activeVoteTab === 'against'
                                  ? formData.againstMembers
                                  : formData.abstainMembers
                                )?.length > 1 ? 's' : ''} selected
                              </span>
                            )}
                            <ChevronDown size={16} className={`committee-multiselect-chevron ${isVoteDropdownOpen ? 'open' : ''}`} />
                          </button>

                          {isVoteDropdownOpen && (
                            <div className="committee-member-dropdown-menu">
                              <div className="committee-member-dropdown-header">
                                <span className="committee-member-dropdown-title">Choose Voting Members</span>
                                <div className="committee-member-dropdown-actions">
                                  <button
                                    type="button"
                                    className="committee-member-quick-btn"
                                    onClick={handleSelectAllTabVotes}
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    className="committee-member-quick-btn"
                                    onClick={handleClearTabVotes}
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              {COMMITTEE_MEMBERS_OPTIONS.map((m) => {
                                const currentList =
                                  activeVoteTab === 'inFavour'
                                    ? formData.inFavourMembers || []
                                    : activeVoteTab === 'against'
                                    ? formData.againstMembers || []
                                    : formData.abstainMembers || [];
                                const isSelected = currentList.includes(m.display);

                                const inFav = formData.inFavourMembers?.includes(m.display);
                                const inAg = formData.againstMembers?.includes(m.display);
                                const inAb = formData.abstainMembers?.includes(m.display);

                                return (
                                  <div
                                    key={m.id}
                                    className={`committee-member-option ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleToggleMemberVote(m.display)}
                                  >
                                    <div className="committee-member-option-left">
                                      <div className="committee-member-custom-checkbox">
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                      </div>
                                      <span className="committee-member-option-name">{m.name}</span>
                                      <span className="committee-member-option-role">({m.role})</span>
                                    </div>

                                    {isSelected ? (
                                      <span className="committee-member-selected-badge">Selected</span>
                                    ) : inFav ? (
                                      <span className="committee-member-other-vote">In Favour</span>
                                    ) : inAg ? (
                                      <span className="committee-member-other-vote">Against</span>
                                    ) : inAb ? (
                                      <span className="committee-member-other-vote">Abstained</span>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Selected Member Chips */}
                        {((activeVoteTab === 'inFavour'
                          ? formData.inFavourMembers
                          : activeVoteTab === 'against'
                          ? formData.againstMembers
                          : formData.abstainMembers) || []).length > 0 && (
                          <div className="committee-member-chips-wrap">
                            {(activeVoteTab === 'inFavour'
                              ? formData.inFavourMembers
                              : activeVoteTab === 'against'
                              ? formData.againstMembers
                              : formData.abstainMembers
                            ).map((memberText) => (
                              <span key={memberText} className="committee-member-chip">
                                <span>{memberText}</span>
                                <button
                                  type="button"
                                  className="committee-member-chip-remove"
                                  onClick={(e) => handleRemoveMemberVote(activeVoteTab, memberText, e)}
                                  title="Remove vote"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Blue Info Alert */}
                    <div className="committee-form-info-alert">
                      <Info size={17} className="committee-info-icon" />
                      <span>
                        <strong>Information !</strong> Please note, attachments can be added after saving the decisions.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Items (Optional) Section */}
                <div className="committee-action-items-section">
                  <div className="committee-action-items-header">
                    <div className="committee-action-items-title-wrap">
                      <Layers size={17} className="committee-action-header-icon" />
                      <span className="committee-action-items-title">Action Items</span>
                      <span className="committee-action-items-badge">(Optional)</span>
                      <span className="committee-action-items-hint">&mdash; Track follow-up tasks & assignees</span>
                    </div>
                    <button
                      type="button"
                      className="committee-add-action-btn"
                      onClick={handleCreateActionItem}
                    >
                      <Plus size={15} />
                      <span>Add Action Item</span>
                    </button>
                  </div>

                  {(formData.actionItems || []).length === 0 ? (
                    <div className="committee-action-items-empty">
                      <Layers size={36} className="committee-empty-icon" />
                      <p className="committee-empty-text">
                        No action items added yet. Click &quot;Add Action Item&quot; to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="committee-action-items-list">
                      {formData.actionItems.map((item) => (
                        <div key={item.id} className="committee-action-item-card">
                          <div className="committee-action-item-field task">
                            <label className="committee-action-field-label">Follow-up Task</label>
                            <input
                              type="text"
                              className="committee-form-input small"
                              placeholder="e.g. Schedule contractor site inspection"
                              value={item.task}
                              onChange={(e) => handleUpdateActionItem(item.id, 'task', e.target.value)}
                            />
                          </div>
                          <div className="committee-action-item-field assignee">
                            <label className="committee-action-field-label">Assignee</label>
                            <div className="committee-select-wrap">
                              <select
                                className="committee-form-select small"
                                value={item.assignee}
                                onChange={(e) => handleUpdateActionItem(item.id, 'assignee', e.target.value)}
                              >
                                {COMMITTEE_MEMBERS_OPTIONS.map((m) => (
                                  <option key={m.id} value={m.display}>
                                    {m.display}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="committee-select-icon small" />
                            </div>
                          </div>
                          <div className="committee-action-item-field date">
                            <label className="committee-action-field-label">Due Date</label>
                            <input
                              type="text"
                              className="committee-form-input small"
                              placeholder="DD/MM/YYYY"
                              value={item.dueDate}
                              onChange={(e) => handleUpdateActionItem(item.id, 'dueDate', e.target.value)}
                            />
                          </div>
                          <div className="committee-action-item-field action">
                            <button
                              type="button"
                              className="committee-action-item-del-btn"
                              title="Delete action item"
                              onClick={() => handleRemoveActionItem(item.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Modal Footer */}
              <div className="committee-modal-footer">
                <button
                  type="button"
                  className="committee-btn-secondary"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setIsSubmittedByDropdownOpen(false);
                    setIsVoteDropdownOpen(false);
                  }}
                >
                  Close
                </button>
                <button type="submit" className="committee-btn-teal-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Edit Committee Decision Modal */}
      {isEditModalOpen && decisionToEdit && createPortal(
        <div
          className="committee-modal-overlay"
          onClick={() => {
            setIsEditModalOpen(false);
            setIsEditSubmittedByDropdownOpen(false);
            setIsEditVoteDropdownOpen(false);
          }}
        >
          <div
            className="committee-modal-box wide"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="committee-modal-header">
              <div className="committee-modal-header-branding">
                <span className="committee-modal-breadcrumb">
                  <Landmark size={18} className="committee-modal-header-icon" />
                  <span>Committee Decisions</span>
                </span>
                <span className="committee-modal-subnav-badge">
                  Edit Committee Decision
                </span>
              </div>
              <button
                type="button"
                className="committee-modal-close-btn"
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsEditSubmittedByDropdownOpen(false);
                  setIsEditVoteDropdownOpen(false);
                }}
                title="Close Modal"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="committee-modal-body" ref={editModalBodyRef}>
                {/* Two-Column Grid */}
                <div className="committee-form-grid-2">
                  {/* Left Column */}
                  <div className="committee-form-col">
                    <div className="committee-form-group">
                      <label className="committee-form-label">
                        Topic: <span className="committee-required-star">*</span>
                      </label>
                      <input
                        type="text"
                        maxLength={120}
                        required
                        className="committee-form-input"
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                      />
                      <div className="committee-form-hint-row">
                        <span className="committee-hint-text">
                          Please fill this section. (Please enter no more than 120 characters)
                        </span>
                        <span className="committee-char-count">{formData.topic.length}/120</span>
                      </div>
                    </div>

                    <div className="committee-form-group">
                      <label className="committee-form-label">
                        Decision: <span className="committee-required-star">*</span>
                      </label>
                      <textarea
                        maxLength={5000}
                        required
                        className="committee-form-textarea decision-textarea"
                        value={formData.decision}
                        onChange={(e) => setFormData({ ...formData, decision: e.target.value })}
                      />
                      <div className="committee-form-hint-row">
                        <span className="committee-hint-text">
                          Please fill this section. (Please enter no more than 5000 characters)
                        </span>
                        <span className="committee-char-count">{formData.decision.length}/5000</span>
                      </div>
                    </div>

                    <div className="committee-form-group">
                      <label className="committee-form-label">
                        Decision Date : <span className="committee-required-star">*</span>
                      </label>
                      <div className="committee-date-input-wrap">
                        <input
                          type="text"
                          required
                          className="committee-form-input committee-date-input"
                          value={formData.decisionDate}
                          onChange={(e) => setFormData({ ...formData, decisionDate: e.target.value })}
                        />
                        <Calendar size={18} className="committee-date-icon" />
                      </div>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="committee-form-col">
                    {/* Submitted By Custom Dropdown */}
                    <div className="committee-form-group" ref={editSubmittedByRef}>
                      <label className="committee-form-label">
                        Submitted By: <span className="committee-required-star">*</span>
                      </label>
                      <div className="committee-member-multiselect-container">
                        <button
                          type="button"
                          className={`committee-custom-select-trigger ${isEditSubmittedByDropdownOpen ? 'open' : ''} ${
                            submittedByTouched && !formData.submittedBy ? 'has-error' : ''
                          }`}
                          onClick={() => setIsEditSubmittedByDropdownOpen(!isEditSubmittedByDropdownOpen)}
                        >
                          <span className={formData.submittedBy ? 'committee-member-option-name' : 'committee-member-placeholder'}>
                            {formData.submittedBy || 'Select committee member'}
                          </span>
                          <ChevronDown size={16} className={`committee-multiselect-chevron ${isEditSubmittedByDropdownOpen ? 'open' : ''}`} />
                        </button>

                        {isEditSubmittedByDropdownOpen && (
                          <div className="committee-custom-dropdown-menu">
                            {COMMITTEE_MEMBERS_OPTIONS.map((m) => {
                              const isSelected = formData.submittedBy === m.display;
                              return (
                                <div
                                  key={m.id}
                                  className={`committee-custom-select-option ${isSelected ? 'selected' : ''}`}
                                  onClick={() => {
                                    setFormData((prev) => ({ ...prev, submittedBy: m.display }));
                                    setSubmittedByTouched(false);
                                    setIsEditSubmittedByDropdownOpen(false);
                                  }}
                                >
                                  <div className="committee-member-option-left">
                                    <span className="committee-member-option-name">{m.name}</span>
                                    <span className="committee-member-option-role">({m.role})</span>
                                  </div>
                                  {isSelected && <Check size={16} color="var(--color-primary, #0d9488)" />}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                      {submittedByTouched && !formData.submittedBy && (
                        <span className="committee-validation-error">
                          Submitted By is required
                        </span>
                      )}
                    </div>

                    {/* Amber Warning Alert */}
                    {(formData.inFavourMembers?.length || 0) +
                      (formData.againstMembers?.length || 0) +
                      (formData.abstainMembers?.length || 0) === 0 && (
                      <div className="committee-form-warning-alert">
                        <AlertCircle size={17} className="committee-warning-icon" />
                        <span>Please select at least one committee member from any tab.</span>
                      </div>
                    )}

                    {/* Voting Tabs Card */}
                    <div className="committee-voting-card">
                      <div className="committee-vote-tabs-header">
                        <button
                          type="button"
                          className={`committee-vote-tab ${activeVoteTab === 'inFavour' ? 'active' : ''}`}
                          onClick={() => setActiveVoteTab('inFavour')}
                        >
                          <span>In Favour Votes</span>
                          <span className="committee-vote-badge">{formData.inFavourMembers?.length || 0}</span>
                        </button>
                        <button
                          type="button"
                          className={`committee-vote-tab ${activeVoteTab === 'against' ? 'active' : ''}`}
                          onClick={() => setActiveVoteTab('against')}
                        >
                          <span>Against Votes</span>
                          <span className="committee-vote-badge">{formData.againstMembers?.length || 0}</span>
                        </button>
                        <button
                          type="button"
                          className={`committee-vote-tab ${activeVoteTab === 'abstain' ? 'active' : ''}`}
                          onClick={() => setActiveVoteTab('abstain')}
                        >
                          <span>Abstain Votes</span>
                          <span className="committee-vote-badge">{formData.abstainMembers?.length || 0}</span>
                        </button>
                      </div>

                      <div className="committee-vote-tab-body">
                        <div className="committee-vote-tab-heading">Committee Members</div>
                        <div className="committee-vote-tab-desc">
                          {activeVoteTab === 'inFavour' && 'Select committee members who voted in favor'}
                          {activeVoteTab === 'against' && 'Select committee members who voted against'}
                          {activeVoteTab === 'abstain' && 'Select committee members who abstained'}
                        </div>

                        {/* Custom Multi-Select Dropdown for Members */}
                        <div className="committee-member-multiselect-container" ref={editVoteDropdownRef}>
                          <button
                            type="button"
                            className={`committee-member-multiselect-trigger ${isEditVoteDropdownOpen ? 'open' : ''}`}
                            onClick={() => setIsEditVoteDropdownOpen(!isEditVoteDropdownOpen)}
                          >
                            {(activeVoteTab === 'inFavour'
                              ? formData.inFavourMembers
                              : activeVoteTab === 'against'
                              ? formData.againstMembers
                              : formData.abstainMembers
                            )?.length === 0 ? (
                              <span className="committee-member-placeholder">Select committee members...</span>
                            ) : (
                              <span className="committee-member-active-summary">
                                {(activeVoteTab === 'inFavour'
                                  ? formData.inFavourMembers
                                  : activeVoteTab === 'against'
                                  ? formData.againstMembers
                                  : formData.abstainMembers
                                )?.length} member{(activeVoteTab === 'inFavour'
                                  ? formData.inFavourMembers
                                  : activeVoteTab === 'against'
                                  ? formData.againstMembers
                                  : formData.abstainMembers
                                )?.length > 1 ? 's' : ''} selected
                              </span>
                            )}
                            <ChevronDown size={16} className={`committee-multiselect-chevron ${isEditVoteDropdownOpen ? 'open' : ''}`} />
                          </button>

                          {isEditVoteDropdownOpen && (
                            <div className="committee-member-dropdown-menu">
                              <div className="committee-member-dropdown-header">
                                <span className="committee-member-dropdown-title">Choose Voting Members</span>
                                <div className="committee-member-dropdown-actions">
                                  <button
                                    type="button"
                                    className="committee-member-quick-btn"
                                    onClick={handleSelectAllTabVotes}
                                  >
                                    Select All
                                  </button>
                                  <button
                                    type="button"
                                    className="committee-member-quick-btn"
                                    onClick={handleClearTabVotes}
                                  >
                                    Clear
                                  </button>
                                </div>
                              </div>

                              {COMMITTEE_MEMBERS_OPTIONS.map((m) => {
                                const currentList =
                                  activeVoteTab === 'inFavour'
                                    ? formData.inFavourMembers || []
                                    : activeVoteTab === 'against'
                                    ? formData.againstMembers || []
                                    : formData.abstainMembers || [];
                                const isSelected = currentList.includes(m.display);

                                const inFav = formData.inFavourMembers?.includes(m.display);
                                const inAg = formData.againstMembers?.includes(m.display);
                                const inAb = formData.abstainMembers?.includes(m.display);

                                return (
                                  <div
                                    key={m.id}
                                    className={`committee-member-option ${isSelected ? 'selected' : ''}`}
                                    onClick={() => handleToggleMemberVote(m.display)}
                                  >
                                    <div className="committee-member-option-left">
                                      <div className="committee-member-custom-checkbox">
                                        {isSelected && <Check size={12} strokeWidth={3} />}
                                      </div>
                                      <span className="committee-member-option-name">{m.name}</span>
                                      <span className="committee-member-option-role">({m.role})</span>
                                    </div>

                                    {isSelected ? (
                                      <span className="committee-member-selected-badge">Selected</span>
                                    ) : inFav ? (
                                      <span className="committee-member-other-vote">In Favour</span>
                                    ) : inAg ? (
                                      <span className="committee-member-other-vote">Against</span>
                                    ) : inAb ? (
                                      <span className="committee-member-other-vote">Abstained</span>
                                    ) : null}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>

                        {/* Selected Member Chips */}
                        {((activeVoteTab === 'inFavour'
                          ? formData.inFavourMembers
                          : activeVoteTab === 'against'
                          ? formData.againstMembers
                          : formData.abstainMembers) || []).length > 0 && (
                          <div className="committee-member-chips-wrap">
                            {(activeVoteTab === 'inFavour'
                              ? formData.inFavourMembers
                              : activeVoteTab === 'against'
                              ? formData.againstMembers
                              : formData.abstainMembers
                            ).map((memberText) => (
                              <span key={memberText} className="committee-member-chip">
                                <span>{memberText}</span>
                                <button
                                  type="button"
                                  className="committee-member-chip-remove"
                                  onClick={(e) => handleRemoveMemberVote(activeVoteTab, memberText, e)}
                                  title="Remove vote"
                                >
                                  <X size={12} />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="committee-form-info-alert">
                      <Info size={17} className="committee-info-icon" />
                      <span>
                        <strong>Information !</strong> Please note, attachments can be added after saving the decisions.
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Items Section */}
                <div className="committee-action-items-section">
                  <div className="committee-action-items-header">
                    <div className="committee-action-items-title-wrap">
                      <Layers size={17} className="committee-action-header-icon" />
                      <span className="committee-action-items-title">Action Items</span>
                      <span className="committee-action-items-badge">(Optional)</span>
                      <span className="committee-action-items-hint">&mdash; Track follow-up tasks & assignees</span>
                    </div>
                    <button
                      type="button"
                      className="committee-add-action-btn"
                      onClick={handleCreateActionItem}
                    >
                      <Plus size={15} />
                      <span>Add Action Item</span>
                    </button>
                  </div>

                  {(formData.actionItems || []).length === 0 ? (
                    <div className="committee-action-items-empty">
                      <Layers size={36} className="committee-empty-icon" />
                      <p className="committee-empty-text">
                        No action items added yet. Click &quot;Add Action Item&quot; to create one.
                      </p>
                    </div>
                  ) : (
                    <div className="committee-action-items-list">
                      {formData.actionItems.map((item) => (
                        <div key={item.id} className="committee-action-item-card">
                          <div className="committee-action-item-field task">
                            <label className="committee-action-field-label">Follow-up Task</label>
                            <input
                              type="text"
                              className="committee-form-input small"
                              placeholder="e.g. Schedule contractor site inspection"
                              value={item.task}
                              onChange={(e) => handleUpdateActionItem(item.id, 'task', e.target.value)}
                            />
                          </div>
                          <div className="committee-action-item-field assignee">
                            <label className="committee-action-field-label">Assignee</label>
                            <div className="committee-select-wrap">
                              <select
                                className="committee-form-select small"
                                value={item.assignee}
                                onChange={(e) => handleUpdateActionItem(item.id, 'assignee', e.target.value)}
                              >
                                {COMMITTEE_MEMBERS_OPTIONS.map((m) => (
                                  <option key={m.id} value={m.display}>
                                    {m.display}
                                  </option>
                                ))}
                              </select>
                              <ChevronDown size={14} className="committee-select-icon small" />
                            </div>
                          </div>
                          <div className="committee-action-item-field date">
                            <label className="committee-action-field-label">Due Date</label>
                            <input
                              type="text"
                              className="committee-form-input small"
                              placeholder="DD/MM/YYYY"
                              value={item.dueDate}
                              onChange={(e) => handleUpdateActionItem(item.id, 'dueDate', e.target.value)}
                            />
                          </div>
                          <div className="committee-action-item-field action">
                            <button
                              type="button"
                              className="committee-action-item-del-btn"
                              title="Delete action item"
                              onClick={() => handleRemoveActionItem(item.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="committee-modal-footer">
                <button
                  type="button"
                  className="committee-btn-secondary"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsEditSubmittedByDropdownOpen(false);
                    setIsEditVoteDropdownOpen(false);
                  }}
                >
                  Close
                </button>
                <button type="submit" className="committee-btn-teal-save">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </Page>
  );
};

export default CommitteeDecisionsPage;
