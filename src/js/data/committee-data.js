/**
 * committee-data.js
 * Mock data and helpers for Strata Committee Decisions — Intellistrata Community Portal
 * Replicates and modernizes the legacy Committee Decisions register.
 */

export const COMMITTEE_METRICS = {
  totalDecisions: 7,
  unanimousDecisions: 4,
  averageApprovalRate: '83.2%',
  activeMembers: 7,
  lastMeetingDate: '01 Mar 2026',
};

export const COMMITTEE_CATEGORIES = [
  'All Categories',
  'Safety & Amenities',
  'Security & Access',
  'Maintenance & Repairs',
  'By-Laws & Rules',
  'Sustainability & Utilities',
  'Compliance & Safety',
  'Capital Works',
];

export const COMMITTEE_STATUSES = [
  { value: 'all', label: 'All Outcomes' },
  { value: 'unanimous', label: 'Unanimous (100%)' },
  { value: 'passed', label: 'Passed (>50%)' },
  { value: 'rejected', label: 'Rejected (<=50%)' },
];

export const COMMITTEE_MEMBERS_OPTIONS = [
  { id: 1, name: 'Kikzy', role: 'Chairperson', display: 'Kikzy (Chairperson)' },
  { id: 2, name: 'Judy Fizz', role: 'Member', display: 'Judy Fizz (Member)' },
  { id: 3, name: 'Test_Mahesha-2', role: 'Member', display: 'Test_Mahesha-2 (Member)' },
  { id: 4, name: 'Test Mahesha-1', role: 'Secretary', display: 'Test Mahesha-1 (Secretary)' },
  { id: 5, name: 'Rose.Test', role: 'Treasurer', display: 'Rose.Test (Treasurer)' },
  { id: 6, name: 'John Smith', role: 'Strata Manager', display: 'John Smith (Strata Manager)' },
];

export const COMMITTEE_DECISIONS = [
  {
    id: 'CD-2026-001',
    topic: 'Swimming Pool Safety and Maintenance Improvement',
    category: 'Safety & Amenities',
    meetingType: 'Executive Committee Meeting',
    decision:
      'The committee decided to improve the safety and maintenance standards of the swimming pool area to ensure a clean, safe, and well-maintained facility for all residents and visitors.',
    fullResolution:
      'The committee resolved unanimously to engage AquaPure Facility Services on a 12-month commercial servicing agreement. The contract includes bi-weekly water chemistry balancing, monthly non-slip deck treatment, child-safety gate self-latching mechanism audits, and emergency lifebuoy replacement, funded from the Administrative Maintenance budget.',
    inFavourVotes: 2,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 2,
    inFavourPct: '100.0%',
    decisionDate: '01/03/2026',
    dateRaw: '2026-03-01',
    submittedBy: 'Test Mahesha-1 (Secretary)',
    submitterName: 'Test Mahesha-1',
    submitterRole: 'Secretary',
    status: 'Unanimous',
    quorumMet: true,
    attachments: ['Pool_Safety_Audit_2026.pdf', 'Contract_Quote_AquaPure.pdf'],
  },
  {
    id: 'CD-2026-002',
    topic: 'Short-Stay Letting & Common Area Noise By-Law Revision',
    category: 'By-Laws & Rules',
    meetingType: 'Special Committee Meeting',
    decision:
      'The committee reviewed community complaints regarding unmonitored short-term holiday rentals causing noise disturbances in residential corridors after 10 PM. The motion to implement strict keycard lockouts and fines for unauthorized short-term letting was voted upon.',
    fullResolution:
      'Motion proposed by Chairperson to instruct strata lawyers to draft an amendment to Special By-Law 14 prohibiting commercial short-stay letting under 30 days without prior Executive approval. After extensive debate regarding legal enforceability and owner rights, the resolution did not attain majority committee support.',
    inFavourVotes: 1,
    againstVotes: 1,
    abstainVotes: 1,
    totalVotes: 3,
    inFavourPct: '33.3%',
    decisionDate: '07/02/2026',
    dateRaw: '2026-02-07',
    submittedBy: 'test (Chairperson)',
    submitterName: 'test',
    submitterRole: 'Chairperson',
    status: 'Rejected',
    quorumMet: true,
    attachments: ['Legal_Advice_ByLaw14.pdf'],
  },
  {
    id: 'CD-2026-003',
    topic: 'Lobby Entrance & Foyer Painting Renovation',
    category: 'Maintenance & Repairs',
    meetingType: 'Executive Committee Meeting',
    decision:
      'The committee resolved to approve quotation Q-8821 from Elite Commercial Coatings for repainting the ground floor foyer and elevator surrounds, utilizing low-VOC architectural grade paint.',
    fullResolution:
      'Resolved that the quotation submitted by Elite Commercial Coatings Pty Ltd in the sum of $4,850 inc GST be accepted. Works to commence on Monday 16 February 2026 outside of peak morning hours (9:00 AM – 3:30 PM). Notices to be posted in lifts 48 hours prior.',
    inFavourVotes: 2,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 2,
    inFavourPct: '100.0%',
    decisionDate: '01/02/2026',
    dateRaw: '2026-02-01',
    submittedBy: 'Test_Mahesha-2 (Chairperson)',
    submitterName: 'Test_Mahesha-2',
    submitterRole: 'Chairperson',
    status: 'Unanimous',
    quorumMet: true,
    attachments: ['Elite_Coatings_Quote_Q8821.pdf'],
  },
  {
    id: 'CD-2025-004',
    topic: 'Installation of Comprehensive CCTV Security System',
    category: 'Security & Access',
    meetingType: 'Annual General Meeting Resolution Vote',
    decision:
      'The committee reviewed quotes from licensed security suppliers and resident feedback regarding unauthorized access in visitor parking and lift lobbies. The committee agreed that installing CCTV cameras in key common property areas would significantly improve safety and accountability. Although two members expressed concerns regarding privacy and maintenance costs, the majority agreed that the benefits outweigh the risks. Therefore, the committee has approved the installation of the CCTV system using the recommended supplier, subject to final contract review.',
    fullResolution:
      'The owners corporation resolved by ordinary resolution pursuant to Section 106 of the Strata Schemes Management Act to authorize expenditure of $18,400 from the Capital Works Fund for supply and installation of an IP-based 16-camera 4K security monitoring system across B1/B2 garages, mailroom, and perimeter entry points. Footage retention capped at 30 days strictly compliant with Australian Privacy Principles.',
    inFavourVotes: 5,
    againstVotes: 2,
    abstainVotes: 1,
    totalVotes: 8,
    inFavourPct: '62.5%',
    decisionDate: '01/11/2025',
    dateRaw: '2025-11-01',
    submittedBy: 'Rose.Test (Treasurer)',
    submitterName: 'Rose.Test',
    submitterRole: 'Treasurer',
    status: 'Passed',
    quorumMet: true,
    attachments: ['SafeGuard_CCTV_Specification.pdf', 'Privacy_Policy_Addendum.pdf'],
  },
  {
    id: 'CD-2025-005',
    topic: 'Basement 2 EV Charger Load Management & Sub-Metering Policy',
    category: 'Sustainability & Utilities',
    meetingType: 'Executive Committee Meeting',
    decision:
      'Approved infrastructure upgrade for dynamic phase load-balancing and direct tenant sub-metering to allow up to 16 private electric vehicle charging wallboxes across Basement levels without grid overloading.',
    fullResolution:
      'Resolved to commission BrightSpark Electrical to install dynamic Schneider load management gateway in switchboard MSB-2. Individual lot owners may connect private chargers subject to installation bond and signing Standard EV By-Law Deed of Indemnity.',
    inFavourVotes: 6,
    againstVotes: 0,
    abstainVotes: 1,
    totalVotes: 7,
    inFavourPct: '85.7%',
    decisionDate: '15/10/2025',
    dateRaw: '2025-10-15',
    submittedBy: 'Alex Wong (Committee Member)',
    submitterName: 'Alex Wong',
    submitterRole: 'Committee Member',
    status: 'Passed',
    quorumMet: true,
    attachments: ['EV_Infrastructure_Feasibility_Report.pdf'],
  },
  {
    id: 'CD-2025-006',
    topic: 'Annual Fire Safety Statement (AFSS) Certification Sign-off',
    category: 'Compliance & Safety',
    meetingType: 'Electronic Ballot Determination',
    decision:
      'Unanimous electronic confirmation of the 2025 Annual Fire Safety Statement inspection report following rectification of corridor emergency exit lights and fire door dampers.',
    fullResolution:
      'Resolved that the Secretary and Strata Managing Agent be authorized to endorse the statutory Annual Fire Safety Statement for submission to Fire and Rescue NSW and local council, certifying all 14 scheduled fire safety measures meet BCA performance requirements.',
    inFavourVotes: 7,
    againstVotes: 0,
    abstainVotes: 0,
    totalVotes: 7,
    inFavourPct: '100.0%',
    decisionDate: '20/09/2025',
    dateRaw: '2025-09-20',
    submittedBy: 'Sarah Jenkins (Building Manager)',
    submitterName: 'Sarah Jenkins',
    submitterRole: 'Building Manager',
    status: 'Unanimous',
    quorumMet: true,
    attachments: ['AFSS_Compliance_Certificate_2025.pdf'],
  },
  {
    id: 'CD-2025-007',
    topic: 'Rooftop Terrace Solar Inverter Replacement & Green Energy Grant',
    category: 'Capital Works',
    meetingType: 'Executive Committee Meeting',
    decision:
      'Approved allocation of $45,000 from the Capital Works Fund to replace failing legacy solar inverters with high-efficiency smart hybrid units and apply for state clean energy sustainability rebate.',
    fullResolution:
      'Resolved to accept proposal from Solis Commercial Energy for 35kW commercial inverter replacement. Anticipated payback period of 3.2 years through reduced common area HVAC and lighting tariffs.',
    inFavourVotes: 5,
    againstVotes: 1,
    abstainVotes: 1,
    totalVotes: 7,
    inFavourPct: '71.4%',
    decisionDate: '12/08/2025',
    dateRaw: '2025-08-12',
    submittedBy: 'John Smith (Chairperson)',
    submitterName: 'John Smith',
    submitterRole: 'Chairperson',
    status: 'Passed',
    quorumMet: true,
    attachments: ['Solar_PV_Audit_Report.pdf', 'Rebate_Application_Copy.pdf'],
  },
];

/**
 * generateDecisionsCSV — generates downloadable CSV content for Excel/Spreadsheets
 */
export const generateDecisionsCSV = (decisions) => {
  const headers = [
    'Decision ID',
    'Topic',
    'Category',
    'Decision Summary',
    'In Favour Votes',
    'Against Votes',
    'Abstain Votes',
    'Total Votes',
    'In Favour %',
    'Decision Date',
    'Submitted By',
    'Status',
  ];

  const rows = decisions.map((d) => [
    `"${d.id}"`,
    `"${d.topic.replace(/"/g, '""')}"`,
    `"${d.category}"`,
    `"${d.decision.replace(/"/g, '""')}"`,
    d.inFavourVotes,
    d.againstVotes,
    d.abstainVotes,
    d.totalVotes,
    `"${d.inFavourPct}"`,
    `"${d.decisionDate}"`,
    `"${d.submittedBy.replace(/"/g, '""')}"`,
    `"${d.status}"`,
  ]);

  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
};
