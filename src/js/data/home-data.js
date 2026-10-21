/**
 * home-data.js
 * Mock data for the Home / Public Area portal page — Intellistrata Community Portal
 * Replicates and modernizes the legacy Owners Corporation screen.
 */

export const STRATA_PROPERTY_DETAILS = {
  schemeName: 'Owners Corporation ABC1313',
  planNumber: 'ABC1313',
  ownerNameOnTitle: 'Kikzy',
  legalEntityName: 'The Owners of Crown Apartment-ABC1313',
  registrationDate: '12 November 2021',
  propertyType: 'Residential & Mixed Use Strata Scheme',
  totalLots: 42,
  activeEntitlements: 1000,
  address: {
    line1: 'Demo 7 Wolsley Street 3 15th Brightnton Scout',
    suburb: 'Melbourne',
    state: 'VIC',
    postcode: '3204',
    country: 'Australia',
    fullFormatted: 'Demo 7 Wolsley Street 3 15th Brightnton Scout Melbourne VIC 3204',
  },
  managingCompany: {
    name: 'DEMOX Strata Pty Ltd',
    abn: '48 102 938 412',
    license: 'NSW Lic #2049182 / VIC #003912',
    address: '9999 Hanson Avenue ANNA BAY NSW 2316',
    phone: '1300 123 456',
    phoneRaw: '1300123456',
    website: 'strataschemes.com.au',
    websiteUrl: 'https://strataschemes.com.au',
    email: 'info@abc.com',
    hours: 'Monday – Friday: 8:30 AM – 5:30 PM AEST',
  },
  strataManager: {
    name: 'John Smith',
    role: 'Licensed Strata Community Manager',
    email: 'Ravimali.S@intellistrata.com.au',
    phone: 'Not Available',
    directPhone: '+61 3 9820 4110',
    mobile: '0412 345 678',
    avatarInitials: 'JS',
    department: 'Residential Management Division',
  },
  committeeMembers: [
    { id: 1, name: 'Kikzy', position: 'Chairperson', role: 'Chairperson', initials: 'K', lot: 'Lot 101' },
    { id: 2, name: 'Judy Fizz', position: 'Member', role: 'Committee Member', initials: 'JF', lot: 'Lot 204' },
    { id: 3, name: 'Test_Mahesha-2', position: 'Member', role: 'Committee Member', initials: 'TM', lot: 'Lot 308' },
  ],
  emergencyContact: {
    label: '24/7 Urgent Facilities & Building Emergency',
    phone: '1800 555 888',
    phoneRaw: '1800555888',
    contractor: 'IntelliStrata Rapid Response Hub',
  },
  amenities: [
    { id: 'pool', label: 'Heated Lap Pool', icon: 'waves', location: 'Level 1 Podium', hours: '6:00 AM - 10:00 PM' },
    { id: 'gym', label: 'Fitness Center', icon: 'dumbbell', location: 'Level 1 North', hours: '24 Hours Access' },
    { id: 'terrace', label: 'Sky Garden & BBQ', icon: 'sun', location: 'Rooftop Level 5', hours: '7:00 AM - 10:30 PM' },
    { id: 'parking', label: 'Secure Basement Parking', icon: 'car', location: 'Basement B1-B2', hours: 'Restricted Access' },
    { id: 'waste', label: 'Waste & Recycling Chutes', icon: 'trash', location: 'Every Floor Core', hours: '24 Hours' },
    { id: 'ev', label: 'EV Charging Bays', icon: 'zap', location: 'B1 Bays 01-08', hours: 'App-activated' },
  ],
  wasteSchedule: {
    general: 'Tuesdays & Fridays (early morning collection)',
    recycle: 'Wednesdays (yellow commingled bins)',
    bulk: 'Quarterly hard waste booking available via portal',
  },
  location: {
    lat: -37.8920,
    lng: 144.9980,
    suburb: 'Brighton / Melbourne VIC 3204',
    mapQuery: 'Brighton Melbourne VIC 3204 Australia',
    transit: [
      { type: 'Train', name: 'Middle Brighton Railway Station', distance: '350m (4 min walk)' },
      { type: 'Tram', name: 'Route 64 / Dendy St Stop', distance: '140m (2 min walk)' },
      { type: 'Bus', name: 'Bus 600/922 Beach Rd Interchange', distance: '400m (5 min walk)' },
    ],
  },
};

export const GALLERY_PHOTOS = [
  {
    id: 'exterior',
    title: 'Contemporary Exterior & Landscaping',
    category: 'Architecture',
    caption: 'Modern multi-level facade with wood-slat finishes, glazed balconies, and landscaped private drive.',
    src: '/assets/gallery/exterior.jpg',
    thumb: '/assets/gallery/exterior.jpg',
  },
  {
    id: 'lobby',
    title: 'Grand Entrance Foyer & Concierge',
    category: 'Interior',
    caption: 'Double-height marble reception, timber feature walls, designer lighting, and secure lift access.',
    src: '/assets/gallery/lobby.jpg',
    thumb: '/assets/gallery/lobby.jpg',
  },
  {
    id: 'terrace',
    title: 'Resident Sky Lounge & Barbecue Terrace',
    category: 'Amenities',
    caption: 'Rooftop alfresco entertaining area with stainless outdoor kitchen and panoramic skyline views.',
    src: '/assets/gallery/terrace.jpg',
    thumb: '/assets/gallery/terrace.jpg',
  },
];

export const PROPERTY_NOTICES = [
  {
    id: 'notice-1',
    title: 'Annual Fire Safety & Alarm System Testing',
    date: '28 Sep 2026',
    time: '09:00 AM – 02:00 PM',
    category: 'Compliance',
    urgency: 'Important',
    summary: 'Technicians will test speaker alarms and smoke dampers across all common corridors and car parks. Intermittent sirens will sound for 5-second intervals.',
    author: 'Facility Management',
  },
  {
    id: 'notice-2',
    title: 'Quarterly Facade & Balcony Glass Cleaning',
    date: '05 Oct 2026',
    time: '08:00 AM – 04:30 PM',
    category: 'Maintenance',
    urgency: 'Notice',
    summary: 'Abseiling window cleaners will attend exterior glass and inaccessible balconies. Please ensure personal items are cleared from balcony railings.',
    author: 'Strata Committee',
  },
  {
    id: 'notice-3',
    title: 'Lift #2 Routine Service & Governor Inspection',
    date: '12 Oct 2026',
    time: '10:00 AM – 12:00 PM',
    category: 'Service',
    urgency: 'Informational',
    summary: 'Elevate Lifts will conduct scheduled preventive servicing on Passenger Lift 2. Lift 1 remains fully operational.',
    author: 'Building Manager',
  },
];

export const PROPERTY_RULES_BYLAWS = [
  {
    id: 'rule-1',
    code: 'By-Law 04',
    title: 'Noise & Peaceful Enjoyment',
    summary: 'Residents must not make unreasonable noise within common property or lots between 10:00 PM and 7:00 AM on weekdays, or between 11:00 PM and 8:00 AM on weekends.',
    pdfUrl: '#',
  },
  {
    id: 'rule-2',
    code: 'By-Law 11',
    title: 'Balcony Appearance & Storage Guidelines',
    summary: 'Clothing, laundry lines, or non-outdoor furniture must not be visible above balcony balustrades from the street or common areas.',
    pdfUrl: '#',
  },
  {
    id: 'rule-3',
    code: 'By-Law 16',
    title: 'Pet Registration & Common Property Leashing',
    summary: 'Domestic pets are permitted subject to committee notification. Dogs must be on a leash at all times when passing through corridors, foyers, and lifts.',
    pdfUrl: '#',
  },
  {
    id: 'rule-4',
    code: 'By-Law 22',
    title: 'Visitor Parking & EV Bay Regulations',
    summary: 'Visitor parking is restricted to bona fide guests for a maximum of 24 consecutive hours. Unregistered vehicles may be ticketed or towed.',
    pdfUrl: '#',
  },
];

export const PROPERTY_NEWS = [
  {
    id: 'news-1',
    title: 'Solar Inverter Upgrade Proposal Approved at EGM',
    date: '18 Sep 2026',
    tag: 'Sustainability',
    author: 'Strata Committee',
    readTime: '3 min read',
    content: 'The owners corporation has voted 86% in favor of installing a high-efficiency 35kW rooftop solar PV array to offset common area lighting and HVAC power costs, estimated to reduce quarterly power levies by 14%.',
  },
  {
    id: 'news-2',
    title: 'Basement 2 EV Charger Infrastructure Completed',
    date: '02 Sep 2026',
    tag: 'Facilities',
    author: 'Building Operations',
    readTime: '2 min read',
    content: 'Dedicated conduit and 32A three-phase load balancing circuits are now live in B2. Residents wishing to connect private wallboxes may submit an application via the Maintenance tab.',
  },
  {
    id: 'news-3',
    title: 'Spring Community Garden & Herb Planter Working Bee',
    date: '24 Aug 2026',
    tag: 'Community',
    author: 'Resident Social Committee',
    readTime: '1 min read',
    content: 'Join fellow neighbors on Saturday 4 October at 10 AM on the Rooftop Terrace for our seasonal herb planting morning. Refreshments and planting supplies provided.',
  },
];
