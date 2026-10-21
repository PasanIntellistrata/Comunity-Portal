/**
 * invoiceData.js
 * Mock data for Invoice Approval page — Intellistrata Community Portal
 * Edit this file to update the displayed data without touching the UI.
 */

export const CURRENT_USER = {
  name: 'Pasan Udara',
  initials: 'PU',
  role: 'Chairperson',
  avatarBg: '#0d9488',
};

export const CURRENT_PROPERTY = {
  name: 'Green Valley Residence',
  lot: 'Lot A-03',
};

export const SUMMARY_STATS = [
  {
    id: 'pending',
    label: 'Pending Approval',
    value: 12,
    sub: 'Total $12,450.00',
    iconBg: 'rgba(139, 92, 246, 0.12)',
    iconColor: '#8b5cf6',
    icon: '⧈',
    trend: null,
  },
  {
    id: 'overdue',
    label: 'Overdue',
    value: 2,
    sub: 'Total $1,250.00',
    iconBg: 'rgba(245, 158, 11, 0.12)',
    iconColor: '#f59e0b',
    icon: '⏱',
    trend: 'down',
  },
  {
    id: 'approved',
    label: 'Approved This Month',
    value: 18,
    sub: 'Total $18,760.00',
    iconBg: 'rgba(16, 185, 129, 0.12)',
    iconColor: '#10b981',
    icon: '✓',
    trend: 'up',
  },
  {
    id: 'total',
    label: 'Total This Month',
    value: '$31,210.00',
    sub: null,
    iconBg: 'rgba(13, 148, 136, 0.12)',
    iconColor: '#0d9488',
    icon: '$',
    trend: null,
  },
];

export const VENDORS = [
  'All Vendors',
  'ABC Services (Pvt) Ltd',
  'BlueWave Supplies',
  'City Cleaners',
  'TechFix Solutions',
  'Green Lanka Pvt Ltd',
  'Sunrise Electricals',
];

export const INVOICES = [
  {
    id: 'INV-2026-0587',
    vendor: 'ABC Services (Pvt) Ltd',
    date: '18 May 2026',
    dueDate: '25 May 2026',
    amount: '$950.00',
    status: 'Pending',
    submittedBy: 'Nimal Perera',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0586',
    vendor: 'BlueWave Supplies',
    date: '17 May 2026',
    dueDate: '24 May 2026',
    amount: '$1,250.00',
    status: 'Pending',
    submittedBy: 'Nimal Perera',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0585',
    vendor: 'City Cleaners',
    date: '16 May 2026',
    dueDate: '23 May 2026',
    amount: '$780.00',
    status: 'Pending',
    submittedBy: 'Saman Weerasekara',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0584',
    vendor: 'TechFix Solutions',
    date: '15 May 2026',
    dueDate: '22 May 2026',
    amount: '$450.00',
    status: 'Pending',
    submittedBy: 'Saman Weerasekara',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0583',
    vendor: 'Green Lanka Pvt Ltd',
    date: '14 May 2026',
    dueDate: '21 May 2026',
    amount: '$2,350.00',
    status: 'Overdue',
    submittedBy: 'Nimal Perera',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0582',
    vendor: 'Sunrise Electricals',
    date: '13 May 2026',
    dueDate: '20 May 2026',
    amount: '$1,580.00',
    status: 'Pending',
    submittedBy: 'Nimal Perera',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0581',
    vendor: 'ABC Services (Pvt) Ltd',
    date: '12 May 2026',
    dueDate: '19 May 2026',
    amount: '$320.00',
    status: 'Pending',
    submittedBy: 'Saman Weerasekara',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0580',
    vendor: 'BlueWave Supplies',
    date: '11 May 2026',
    dueDate: '18 May 2026',
    amount: '$680.00',
    status: 'Approved',
    submittedBy: 'Nimal Perera',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0579',
    vendor: 'City Cleaners',
    date: '10 May 2026',
    dueDate: '17 May 2026',
    amount: '$1,420.00',
    status: 'Approved',
    submittedBy: 'Saman Weerasekara',
    lot: 'A-03',
  },
  {
    id: 'INV-2026-0578',
    vendor: 'TechFix Solutions',
    date: '09 May 2026',
    dueDate: '16 May 2026',
    amount: '$550.00',
    status: 'Approved',
    submittedBy: 'Saman Weerasekara',
    lot: 'A-03',
  },
];

export const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: '⊞', active: false, children: [] },
  { id: 'levy', label: 'My Levy', icon: '◈', active: false, children: ['Levy Summary', 'Payment History'] },
  { id: 'payments', label: 'Payments', icon: '⊟', active: false, children: [] },
  {
    id: 'invoices', label: 'Invoices', icon: '⊞', active: true,
    children: ['Invoices Paid', 'Invoice Approval', 'Quotation Approval'],
    activeChild: 'Invoice Approval',
  },
  { id: 'documents', label: 'Documents', icon: '⊡', active: false, children: ['All Documents', 'Meeting Minutes'] },
  { id: 'maintenance', label: 'Maintenance', icon: '⚙', active: false, children: ['Work Orders', 'Requests'] },
  { id: 'finance', label: 'Finance', icon: '⊡', active: false, children: [] },
  { id: 'investments', label: 'Investments', icon: '⊞', active: false, children: [] },
  { id: 'community', label: 'Community', icon: '⊞', active: false, children: [] },
  { id: 'committee', label: 'Committee', icon: '⊞', active: false, children: [] },
  { id: 'reports', label: 'Reports', icon: '⊞', active: false, children: [] },
  { id: 'accessibility', label: 'Accessibility', icon: '⊞', active: false, children: [] },
  { id: 'profile', label: 'Profile', icon: '⊞', active: false, children: [] },
];

export const TOTAL_INVOICES = 24;
export const ITEMS_PER_PAGE = 10;
export const TOTAL_PAGES = 3;
