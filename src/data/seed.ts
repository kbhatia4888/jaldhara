import type { Country, State, City, Area, Building, Deal, Audit, Referral, Manufacturer, Script, Reminder, RwhAssessment, TreeProject, TreeMonitoringLog, WaterBody, LakeRestorationLog, CsrPartner, JournalEntry, ProviderNote } from '../types';

export const countries: Country[] = [
  { id: 'c1', name: 'India', code: 'IN' },
];

// All 28 states + 8 UTs of India
export const states: State[] = [
  { id: 's-ap', name: 'Andhra Pradesh',               countryId: 'c1', code: 'AP', waterStressLevel: 'High' },
  { id: 's-ar', name: 'Arunachal Pradesh',            countryId: 'c1', code: 'AR', waterStressLevel: 'Low' },
  { id: 's-as', name: 'Assam',                        countryId: 'c1', code: 'AS', waterStressLevel: 'Medium' },
  { id: 's-br', name: 'Bihar',                        countryId: 'c1', code: 'BR', waterStressLevel: 'High' },
  { id: 's-cg', name: 'Chhattisgarh',                 countryId: 'c1', code: 'CG', waterStressLevel: 'Medium' },
  { id: 's-ga', name: 'Goa',                          countryId: 'c1', code: 'GA', waterStressLevel: 'Low' },
  { id: 's-gj', name: 'Gujarat',                      countryId: 'c1', code: 'GJ', waterStressLevel: 'Critical' },
  { id: 's-hr', name: 'Haryana',                      countryId: 'c1', code: 'HR', waterStressLevel: 'Critical' },
  { id: 's-hp', name: 'Himachal Pradesh',             countryId: 'c1', code: 'HP', waterStressLevel: 'Low' },
  { id: 's-jh', name: 'Jharkhand',                    countryId: 'c1', code: 'JH', waterStressLevel: 'Medium' },
  { id: 's-ka', name: 'Karnataka',                    countryId: 'c1', code: 'KA', waterStressLevel: 'High' },
  { id: 's-kl', name: 'Kerala',                       countryId: 'c1', code: 'KL', waterStressLevel: 'Medium' },
  { id: 's-mp', name: 'Madhya Pradesh',               countryId: 'c1', code: 'MP', waterStressLevel: 'High' },
  { id: 's-mh', name: 'Maharashtra',                  countryId: 'c1', code: 'MH', waterStressLevel: 'Critical' },
  { id: 's-mn', name: 'Manipur',                      countryId: 'c1', code: 'MN', waterStressLevel: 'Medium' },
  { id: 's-ml', name: 'Meghalaya',                    countryId: 'c1', code: 'ML', waterStressLevel: 'Low' },
  { id: 's-mz', name: 'Mizoram',                      countryId: 'c1', code: 'MZ', waterStressLevel: 'Low' },
  { id: 's-nl', name: 'Nagaland',                     countryId: 'c1', code: 'NL', waterStressLevel: 'Low' },
  { id: 's-od', name: 'Odisha',                       countryId: 'c1', code: 'OD', waterStressLevel: 'Medium' },
  { id: 's-pb', name: 'Punjab',                       countryId: 'c1', code: 'PB', waterStressLevel: 'High' },
  { id: 's-rj', name: 'Rajasthan',                    countryId: 'c1', code: 'RJ', waterStressLevel: 'Critical' },
  { id: 's-sk', name: 'Sikkim',                       countryId: 'c1', code: 'SK', waterStressLevel: 'Low' },
  { id: 's-tn', name: 'Tamil Nadu',                   countryId: 'c1', code: 'TN', waterStressLevel: 'Critical' },
  { id: 's-ts', name: 'Telangana',                    countryId: 'c1', code: 'TS', waterStressLevel: 'Critical' },
  { id: 's-tr', name: 'Tripura',                      countryId: 'c1', code: 'TR', waterStressLevel: 'Medium' },
  { id: 's-up', name: 'Uttar Pradesh',                countryId: 'c1', code: 'UP', waterStressLevel: 'High' },
  { id: 's-uk', name: 'Uttarakhand',                  countryId: 'c1', code: 'UK', waterStressLevel: 'Medium' },
  { id: 's-wb', name: 'West Bengal',                  countryId: 'c1', code: 'WB', waterStressLevel: 'Medium' },
  // Union Territories
  { id: 's-an', name: 'Andaman and Nicobar Islands',  countryId: 'c1', code: 'AN', waterStressLevel: 'Low' },
  { id: 's-ch', name: 'Chandigarh',                   countryId: 'c1', code: 'CH', waterStressLevel: 'Medium' },
  { id: 's-dn', name: 'Dadra and Nagar Haveli',       countryId: 'c1', code: 'DN', waterStressLevel: 'Medium' },
  { id: 's-dd', name: 'Daman and Diu',                countryId: 'c1', code: 'DD', waterStressLevel: 'Medium' },
  { id: 's-dl', name: 'Delhi',                        countryId: 'c1', code: 'DL', waterStressLevel: 'Critical' },
  { id: 's-jk', name: 'Jammu and Kashmir',            countryId: 'c1', code: 'JK', waterStressLevel: 'Medium' },
  { id: 's-la', name: 'Ladakh',                       countryId: 'c1', code: 'LA', waterStressLevel: 'High' },
  { id: 's-ld', name: 'Lakshadweep',                  countryId: 'c1', code: 'LD', waterStressLevel: 'Low' },
  { id: 's-py', name: 'Puducherry',                   countryId: 'c1', code: 'PY', waterStressLevel: 'High' },
];

export const cities: City[] = [
  {
    id: 'city1',
    name: 'Delhi',
    stateId: 's-dl',
    stage: 'First Visits',
    lat: 28.7041,
    lng: 77.1025,
    playbook: {
      waterCostPerKL: 4.5,
      tankerCostRange: '₹1,800–3,200 per tanker (6 KL)',
      groundwaterSituation: 'Critical — extracted at 101% of sustainable level. Yamuna polluted. Annual Haryana water disputes cause supply shocks April–June. TDS often 800–1,500 ppm in South Delhi.',
      governmentIncentives: 'Delhi Jal Board: 10% rebate on annual water bill for buildings 500+ sq m with greywater recycling. 15% if also has rainwater harvesting. Reference: Category C, DJB Water Tariff.',
      keyCustomerTypes: 'Private hospitals, private schools, banquet halls, coaching institute hostels, mid-size hotels, DDA housing societies',
      founderNotes: 'Starting base. Model Town is home neighbourhood. Expand ring by ring: Mukherjee Nagar, Rohini, Pitampura, Shalimar Bagh, Azadpur, NSP. Best entry through RWA president or welfare associations.',
      bestMonthsForSales: 'April–June is crisis season — fastest decisions. Build relationships November–March.',
    },
  },
];

export const areas: Area[] = [
  { id: 'a1', name: 'Model Town', cityId: 'city1' },
  { id: 'a2', name: 'Rohini', cityId: 'city1' },
  { id: 'a3', name: 'Pitampura', cityId: 'city1' },
  { id: 'a4', name: 'Mukherjee Nagar', cityId: 'city1' },
  { id: 'a5', name: 'Shalimar Bagh', cityId: 'city1' },
];

// Single realistic building: New Durga Hospital, Model Town, Delhi
export const buildings: Building[] = [
  {
    id: 'b1',
    name: 'New Durga Hospital',
    areaId: 'a1',
    cityId: 'city1',
    stateId: 's-dl',
    type: 'Private Hospital',
    lat: 28.7215,
    lng: 77.1905,
    status: 'Hot',
    contactName: 'Rajesh Sharma',
    contactPhone: '+919811234567',
    contactEmail: 'rajesh.sharma@newdurgahospital.in',
    contactDesignation: 'Facilities Manager',
    notes: 'Very interested in DJB rebate. Currently spending heavily on tankers during summer. 60-bed hospital, running at ~80% occupancy. RO reject water going to drain.',
    painQuote: 'We spend ₹28,000 a month on water and it is still not enough in summer.',
    monthlyWaterSpend: 28000,
    tankerCountPerMonth: 8,
    municipalSupplyQuality: 'Poor (<10 hrs)',
    recyclingStatus: 'None',
    occupancyCount: 60,
    greywaterPotentialLpd: 7200,
    djbRebateAnnual: 21600,
    floors: 4,
    dailyWaterConsumption: 12,
    followUpDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    lastContactedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const deals: Deal[] = [];

// One completed audit for New Durga Hospital
export const audits: Audit[] = [
  {
    id: 'aud1',
    buildingId: 'b1',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    currentWaterBill: 12000,
    tankerSpend: 16000,
    borewellDepth: 0,
    tdsLevel: 850,
    recommendedSystem: '7 KLD greywater recycling system (skid-mounted)',
    potentialSavings: 110400,
    notes: '60-bed hospital. 8 tankers/month at ₹2,000 each. DJB supply only 6 hours/day. RO reject water going to drain (approx 1,500 L/day waste). OHT overflows at night — no sensor. Strong interest from Facilities Manager.',
    conductedBy: 'JalDhara Founder',
    dailyConsumptionLitres: 12000,
    occupancyCount: 60,
    greywaterPotentialLpd: 7200,
    capexEstimate: 350000,
    paybackMonths: 22,
    djbRebateAnnual: 21600,
    wasteChecklist: ['OHT overflow', 'RO reject water going to drain'],
    priorityActions: [
      { description: 'Install OHT overflow sensor', estimatedCost: 8000, monthlySaving: 3000, urgency: 'Quick win' },
      { description: 'Redirect RO reject water to toilet flushing', estimatedCost: 10000, monthlySaving: 2250, urgency: 'Quick win' },
      { description: 'Install 7 KLD greywater recycling system', estimatedCost: 350000, monthlySaving: 9200, urgency: 'Long term' },
    ],
  },
];

export const referrals: Referral[] = [];

// ─────────────────────────────────────────────────────────
// PROVIDERS  (replaces old manufacturers seed)
// 33 researched providers across 4 service streams
// ─────────────────────────────────────────────────────────
export const manufacturers: Manufacturer[] = [

  // ═══════════════════════════════════════════════
  // STREAM 1 — GREYWATER RECYCLING
  // ═══════════════════════════════════════════════
  {
    id: 'p-gw-01', name: 'JalSevak Solutions',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Pune, Maharashtra', website: 'jalsevak.in',
    contactName: 'Abhijit Sathe (Founder)',
    capacityMinKld: 1, capacityMaxKld: 100,
    capacityNotes: 'WARSHA: 1/2/5 KLD compact. JalWASH: 10–100 KLD. GREEN: mobile unit for construction sites.',
    technology: 'Multi-stage: basket strainer → micro-filter → UF membrane → liquid chemical disinfection. 90% less electricity than STP.',
    certifications: 'MoHUA Swachhata Startup Challenge winner. AFD backed.',
    bestFor: ['Private Hospital', 'Private School', 'Housing Society', 'Hotel'],
    geographicCoverage: ['Delhi', 'Mumbai', 'Pune', 'Bengaluru', 'Hyderabad', 'Chennai', 'Ahmedabad', 'Pan-India'],
    commissionRatePct: 12, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Greywater recycling', citiesCovered: ['Delhi', 'Mumbai', 'Pune', 'Bengaluru'], active: true,
  },
  {
    id: 'p-gw-02', name: 'Aguapuro Equipment Pvt. Ltd.',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Mumbai, Maharashtra', website: 'aguapuro.co',
    capacityMinKld: 0.5, capacityMaxKld: 500,
    capacityNotes: '500 LPD to 500 KLD. Custom-quoted.',
    technology: 'Ozonation → Pressure sand filter → Activated carbon filter → UV disinfection. Full EPC.',
    certifications: 'ISO certified. Export track record.',
    bestFor: ['Private Hospital', 'Housing Society', 'Hotel', 'Industrial Unit'],
    geographicCoverage: ['Pan-India', 'Mumbai', 'Delhi', 'Pune', 'Bengaluru', 'Kolkata', 'Chennai'],
    commissionRatePct: 12, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Greywater recycling, full EPC', citiesCovered: ['Delhi', 'Mumbai', 'Pune', 'Bengaluru', 'Pan-India'], active: true,
  },
  {
    id: 'p-gw-03', name: 'Era Hydro-Biotech Energy Pvt. Ltd.',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Pan-India', website: 'erahbt.com',
    capacityMinKld: 1, capacityMaxKld: 200,
    capacityNotes: 'Prefab skid-mounted GWTP. Modular. "Trishna" GWTRS product line.',
    technology: 'Biological + chemical treatment. Prefab skid-mounted. Claims 95% recycling rate.',
    certifications: 'MSME certified. Government tender eligible.',
    bestFor: ['Private Hospital', 'Banquet Hall', 'Industrial Unit'],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 10, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Greywater recycling, bio-media systems', citiesCovered: ['Delhi', 'NCR', 'Pan-India'], active: true,
  },
  {
    id: 'p-gw-04', name: 'SUGAM Paryavaran Vikalp Pvt. Ltd.',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Mumbai, Maharashtra', website: 'sugam.in',
    capacityMinKld: 1, capacityMaxKld: 5000,
    capacityNotes: 'From small institutional to MLD-scale municipal plants.',
    technology: 'Soil Biotechnology (SBT) — natural mineral media + microbial culture. Zero chemicals. Indigenous technology.',
    certifications: 'Swachh Bharat Mission partner. Sujlam 2.0 empanelled. Nine ministry joint advisory.',
    bestFor: ['Housing Society', 'Hotel'],
    geographicCoverage: ['Pan-India', 'Rural focus'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'SBT greywater, zero chemicals', citiesCovered: ['Pan-India'], active: true,
  },
  {
    id: 'p-gw-05', name: 'Shubham Aqua Vitro',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Ahmedabad, Gujarat', website: 'shubhamindia.com',
    capacityMinKld: 1, capacityMaxKld: 200,
    capacityNotes: '1–200 KLD. Fully automatic.',
    technology: 'Zero-discharge. Fully automatic. UF + UV. Odourless colourless output.',
    certifications: 'IGBC green building aligned.',
    bestFor: ['Corporate Office', 'Housing Society'],
    geographicCoverage: ['Gujarat', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Zero-discharge greywater', citiesCovered: ['Ahmedabad', 'Pan-India'], active: true,
  },
  {
    id: 'p-gw-06', name: 'Trity Enviro Solutions',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Delhi-NCR', website: 'trityenviro.com',
    capacityMinKld: 1, capacityMaxKld: 500,
    capacityNotes: '1–500 KLD. Closest manufacturer to Model Town.',
    technology: 'STP + ETP + greywater systems. Biological and physical treatment.',
    certifications: 'ISO compliance.',
    bestFor: ['Private Hospital', 'Private School', 'Housing Society', 'Corporate Office', 'Industrial Unit'],
    geographicCoverage: ['Delhi', 'NCR', 'UP', 'Bihar', 'North India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Greywater, STP, ETP — Delhi NCR specialist', citiesCovered: ['Delhi', 'NCR', 'UP', 'Bihar'], active: true,
  },
  {
    id: 'p-gw-07', name: 'Cleantech Water',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Surat, Gujarat', website: 'cleantechwater.co.in',
    contactPhone: '9558996411',
    capacityMinKld: 0.5, capacityMaxKld: 100,
    capacityNotes: '500 LPD to 100 KLD.',
    technology: 'Screening → sand filter → activated carbon → UV. Skid-mounted.',
    certifications: 'ISO 9001 certified. Certified installers.',
    bestFor: ['Private School', 'Housing Society'],
    geographicCoverage: ['Gujarat', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Compact greywater systems', citiesCovered: ['Gujarat', 'Pan-India'], active: true,
  },
  {
    id: 'p-gw-08', name: 'Ecologics India Pvt. Ltd.',
    stream: 'greywater', providerType: 'EPC Contractor',
    city: 'Pan-India', website: 'ecologicsindia.com',
    capacityMinKld: 1,
    capacityNotes: 'No upper limit — full EPC turnkey contractor.',
    technology: 'Turnkey EPC for STP, ETP, greywater. Multiple technologies. Full civil + mechanical.',
    certifications: 'EPC contractor credentials. Multiple project track record.',
    bestFor: ['Private Hospital', 'Industrial Unit', 'Housing Society'],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Full EPC turnkey, STP, ETP, greywater', citiesCovered: ['Pan-India'], active: true,
  },
  {
    id: 'p-gw-09', name: 'WTE Infra Projects Pvt. Ltd.',
    stream: 'greywater', providerType: 'EPC Contractor',
    city: 'Pan-India',
    capacityMinKld: 0.1, capacityMaxKld: 500,
    capacityNotes: '100 LPD to 500 KLD. Skid-mounted prefab.',
    technology: 'UF plants, STP, ETP, greywater. Prefab skid-mounted.',
    bestFor: ['Industrial Unit', 'Corporate Office', 'Housing Society'],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Prefab skid-mounted EPC', citiesCovered: ['Pan-India'], active: true,
  },
  {
    id: 'p-gw-10', name: 'Chemtronics Technology India',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Mumbai, Maharashtra',
    capacityMinKld: 0.5, capacityMaxKld: 200,
    capacityNotes: '500 LPD to 200 KLD.',
    technology: 'ADAO treatment. Zero-discharge. Chemical + physical. Colourless odourless output.',
    certifications: 'Export credentials. ISO aligned.',
    bestFor: ['Hotel', 'Corporate Office', 'Housing Society'],
    geographicCoverage: ['Maharashtra', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'ADAO zero-discharge greywater', citiesCovered: ['Mumbai', 'Pan-India'], active: true,
  },
  {
    id: 'p-gw-11', name: 'Hydraloop Systems BV',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Eindhoven, Netherlands', website: 'hydraloop.com',
    capacityMinKld: 0.18, capacityMaxKld: 50,
    capacityNotes: 'H300: 180–540 L/day. H600: 360–1080 L/day. No India office.',
    technology: '6-technology: sedimentation + flotation + DAF + foam fractionation + aerobic bioreactor + UV. No filters, no chemicals, self-cleaning. App-monitored 24/7.',
    certifications: 'NSF/ANSI 350. UL979. CE. KIWA. CES Innovation Award 2020.',
    bestFor: ['Hotel', 'Corporate Office'],
    geographicCoverage: ['Import opportunity — no India distributor yet'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Premium app-connected greywater, import opportunity', citiesCovered: [], active: true,
  },
  {
    id: 'p-gw-12', name: 'INTEWA GmbH (AQUALOOP)',
    stream: 'greywater', providerType: 'Manufacturer',
    city: 'Aachen, Germany', website: 'intewa.com',
    capacityMinKld: 0.19, capacityMaxKld: 75,
    capacityNotes: '50 GPD to 20,000 GPD per unit. Scalable by parallel units. No India office.',
    technology: 'Moving Bed MBR (MB-MBR). Biological pre-treatment + hollow-fibre UF membrane (0.02 µm). Automated self-cleaning. I-CONNECT browser monitoring.',
    certifications: 'NSF/ANSI 350C — only commercial-certified greywater system globally. British Standard for spray irrigation. CE.',
    bestFor: ['Hotel', 'Private School'],
    geographicCoverage: ['Import opportunity — distributors in 20+ countries but not India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'NSF/ANSI 350C certified MBR, import opportunity', citiesCovered: [], active: true,
  },
  {
    id: 'p-gw-13', name: 'Ion Exchange India Ltd.',
    stream: 'greywater', providerType: 'Component Supplier',
    city: 'Mumbai, Maharashtra', website: 'ionexchangeglobal.com',
    capacityNotes: 'UF membrane modules (HYDRAMEM). RO, UF, NF membranes.',
    technology: 'UF + RO + NF membranes. HYDRAMEM brand. Also advanced oxidation and evaporation systems.',
    certifications: 'ISO certified. NSF aligned membranes. 60+ years in water treatment.',
    bestFor: ['Industrial Unit', 'Corporate Office'],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'UF/RO/NF membrane components', citiesCovered: ['Pan-India'], active: true,
  },
  {
    id: 'p-gw-14', name: 'Ravi Enviro Industries',
    stream: 'greywater', providerType: 'Component Supplier',
    city: 'Pan-India',
    capacityNotes: 'PTFE hollow-fibre UF membranes (Sumitomo Electric licensed). Membrane modules only.',
    technology: 'PTFE hollow-fibre UF membranes. Sumitomo Electric technology license.',
    certifications: 'Japanese technology license.',
    bestFor: [],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'PTFE UF membrane components', citiesCovered: ['Pan-India'], active: true,
  },

  // ═══════════════════════════════════════════════
  // STREAM 2 — RAINWATER HARVESTING
  // ═══════════════════════════════════════════════
  {
    id: 'p-rw-01', name: 'NIPSTec',
    stream: 'rainwater', providerType: 'Consultant',
    city: 'Delhi-NCR', website: 'nipstec.com',
    capacityNotes: '500+ completed projects. Consultancy + installation + maintenance. 24 years experience.',
    technology: 'Rooftop collection, percolation pits, recharge wells, storage systems. Full design + installation.',
    certifications: 'ISO 9001:2015 certified. 24 years experience.',
    bestFor: ['Private Hospital', 'Private School', 'Industrial Unit'],
    geographicCoverage: ['Delhi-NCR', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Rainwater harvesting, 500+ projects', citiesCovered: ['Delhi', 'NCR', 'Pan-India'], active: true,
  },
  {
    id: 'p-rw-02', name: 'InRain Water Harvesting',
    stream: 'rainwater', providerType: 'Manufacturer',
    city: 'Delhi', website: 'inrainwaterharvesting.com',
    capacityNotes: 'Modular rainwater harvesting systems. Delhi-NCR specialist.',
    technology: 'Modular polymer-based systems. Rooftop + surface runoff. CGWA-compliant.',
    certifications: 'Delhi-NCR specialist.',
    bestFor: ['Housing Society', 'Corporate Office'],
    geographicCoverage: ['Delhi-NCR'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Modular RWH, Delhi specialist', citiesCovered: ['Delhi', 'NCR'], active: true,
  },
  {
    id: 'p-rw-03', name: 'Retas Water Solutions',
    stream: 'rainwater', providerType: 'Manufacturer',
    city: 'Pan-India', website: 'retaswatersolutions.com',
    capacityNotes: 'RAINMAXX modular tanks. Stormwater management + flood mitigation. CGWA-compliant.',
    technology: 'Polymer modular tanks (RAINMAXX). Surface runoff + rooftop systems.',
    certifications: 'CGWA compliant. Jal Jeevan Mission aligned.',
    bestFor: ['Housing Society', 'Corporate Office', 'Private Hospital'],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'RAINMAXX modular RWH systems', citiesCovered: ['Pan-India'], active: true,
  },
  {
    id: 'p-rw-04', name: 'Water Harvesters',
    stream: 'rainwater', providerType: 'Consultant',
    city: 'New Delhi', website: 'waterharvesters.com',
    capacityNotes: 'Consortium of scientists and hydrogeologists. Est. 2000. Largest integrated water management company.',
    technology: 'Full range RWH systems. Design + install + O&M. Groundwater management.',
    certifications: 'Hydrogeologist consortium. 25 years experience.',
    bestFor: ['Industrial Unit', 'Private Hospital', 'Housing Society'],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Full-range RWH design and install', citiesCovered: ['Pan-India'], active: true,
  },
  {
    id: 'p-rw-05', name: 'Om Jyoti Engineering Enterprises',
    stream: 'rainwater', providerType: 'Manufacturer',
    city: 'Delhi-NCR', website: 'omjyotiengg.com',
    capacityNotes: 'Delhi-NCR regional specialist. ISO certified. Full installation + service.',
    technology: 'Rooftop collection, percolation pits, recharge wells. Full design-to-install.',
    certifications: 'ISO certified.',
    bestFor: ['Housing Society', 'Corporate Office', 'Private School'],
    geographicCoverage: ['Delhi-NCR', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'RWH installation, Delhi-NCR specialist', citiesCovered: ['Delhi', 'NCR'], active: true,
  },
  {
    id: 'p-rw-06', name: 'Sintex Industries Ltd.',
    stream: 'rainwater', providerType: 'Component Supplier',
    city: 'Gandhinagar, Gujarat', website: 'sintex.in',
    capacityNotes: 'Water storage tanks — 100L to 100,000L. Widely available across India through dealers.',
    technology: 'LLDPE/HDPE storage tanks. Rooftop + underground + water harvesting tanks.',
    certifications: 'Bureau of Indian Standards (BIS) certified.',
    bestFor: [],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Water storage tanks — BIS certified', citiesCovered: ['Pan-India'], active: true,
  },
  {
    id: 'p-rw-07', name: 'Vectus Industries',
    stream: 'rainwater', providerType: 'Component Supplier',
    city: 'Noida, UP', website: 'vectuswaters.com',
    capacityNotes: 'Water tanks + pipes. 200L to 10,000L. Strong Delhi-NCR presence.',
    technology: 'LLDPE/HDPE water tanks. Pipes and fittings. ISI marked.',
    certifications: 'ISI marked. BIS certified.',
    bestFor: [],
    geographicCoverage: ['Delhi-NCR', 'North India', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'RWH tanks and pipes, Delhi-NCR', citiesCovered: ['Delhi', 'NCR', 'North India'], active: true,
  },

  // ═══════════════════════════════════════════════
  // STREAM 3 — URBAN TREES (Miyawaki + Plantation)
  // ═══════════════════════════════════════════════
  {
    id: 'p-tr-01', name: 'SayTrees Environmental Trust',
    stream: 'trees', providerType: 'NGO',
    city: 'Bengaluru, Karnataka', website: 'saytrees.org',
    contactName: 'Kapil Sharma (Founder)',
    capacityNotes: '10M+ trees planted. 200+ Miyawaki forests. 59 lakes restored. Active pan-India.',
    technology: 'Miyawaki method. Native species. Science-led. Community rooted. 3-year maintenance included.',
    certifications: 'Featured in PM Modi Mann Ki Baat. Section 80G. 18 years operational.',
    bestFor: ['Private School', 'Private Hospital', 'Housing Society'],
    geographicCoverage: ['Bengaluru', 'Delhi', 'Mumbai', 'Hyderabad', 'Chennai', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Miyawaki forests, 200+ projects', citiesCovered: ['Bengaluru', 'Delhi', 'Mumbai', 'Pan-India'], active: true,
  },
  {
    id: 'p-tr-02', name: 'Forest Creators',
    stream: 'trees', providerType: 'NGO',
    city: 'Kutch, Gujarat', website: 'forestcreators.com',
    capacityNotes: '4.5L+ native trees. 470 acres. Smritivan (world largest Miyawaki forest).',
    technology: 'Miyawaki method specialist. Soil regeneration. Native species selection. Multi-layer (shrub/sub-tree/tree/canopy).',
    certifications: 'Smritivan PM Modi inaugurated. SBIF CONSERW project JNPA.',
    bestFor: ['Housing Society'],
    geographicCoverage: ['Gujarat', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Large-scale Miyawaki, Gujarat specialist', citiesCovered: ['Gujarat', 'Pan-India'], active: true,
  },
  {
    id: 'p-tr-03', name: 'Green Yatra',
    stream: 'trees', providerType: 'NGO',
    city: 'Mumbai / Delhi',
    contactName: 'Pradeep Tripathi (Director)',
    capacityNotes: 'Otrivin Miyawaki Urban Forest Delhi Dwarka — 35,000 saplings. CSR partner for Haleon India.',
    technology: 'Miyawaki urban forest. Native species. Multi-layer. 3-year maintenance. Corporate volunteer days.',
    certifications: 'CSR partner track record with Haleon India, GlaxoSmithKline. MCD land projects.',
    bestFor: ['Private School', 'Corporate Office'],
    geographicCoverage: ['Delhi', 'Mumbai', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Miyawaki, MCD land projects, Delhi active', citiesCovered: ['Delhi', 'Mumbai'], active: true,
  },
  {
    id: 'p-tr-04', name: 'Rise Foundation',
    stream: 'trees', providerType: 'NGO',
    city: 'Delhi-NCR', website: 'ngorisefoundation.com',
    contactName: 'Madhukar Varshney (Founder)',
    capacityNotes: '50+ Miyawaki projects. Delhi-NCR schools. 40,000+ trees.',
    technology: 'Miyawaki method. Soil analysis + field survey before planting. 3-year maintenance. School programmes.',
    certifications: 'Active Delhi-NCR school partnerships. Million Miyawaki Foundation collaboration.',
    bestFor: ['Private School', 'Housing Society'],
    geographicCoverage: ['Delhi-NCR', 'Faridabad', 'Gurugram'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Miyawaki in Delhi-NCR schools, 50+ projects', citiesCovered: ['Delhi', 'NCR', 'Faridabad', 'Gurugram'], active: true,
  },
  {
    id: 'p-tr-05', name: 'Grow Billion Trees (NurseryLive)',
    stream: 'trees', providerType: 'Manufacturer',
    city: 'Pan-India', website: 'growbilliontrees.com',
    capacityNotes: 'Native sapling supply + Miyawaki plantation services. CSR tree planting packages. 1 tree to 1M trees scale.',
    technology: 'Miyawaki method + conventional plantation. Native species nursery. Corporate CSR packages. Online ordering.',
    certifications: 'Large-scale CSR delivery track record.',
    bestFor: ['Housing Society', 'Corporate Office', 'Private School'],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Native sapling supply, CSR packages', citiesCovered: ['Pan-India'], active: true,
  },
  {
    id: 'p-tr-06', name: 'Local Forest Department Nurseries',
    stream: 'trees', providerType: 'Component Supplier',
    city: 'Pan-India',
    capacityNotes: 'Native sapling supply. ₹20–80 per sapling depending on species and size.',
    technology: 'Saplings: neem, peepal, jamun, arjuna, kadamba, amaltas, maulsiri, pilkhan, bargad, gulmohar.',
    certifications: 'State forest department nurseries also available at subsidised rates.',
    bestFor: [],
    geographicCoverage: ['Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Native sapling supply, ₹20–80 per sapling', citiesCovered: ['Pan-India'], active: true,
  },

  // ═══════════════════════════════════════════════
  // STREAM 4 — LAKE & WATER BODY RESTORATION
  // ═══════════════════════════════════════════════
  {
    id: 'p-lk-01', name: 'SayTrees Environmental Trust',
    stream: 'lakes', providerType: 'NGO',
    city: 'Bengaluru, Karnataka', website: 'saytrees.org',
    contactName: 'Kapil Sharma (Founder)',
    capacityNotes: '59 lakes restored. 5 billion litres water holding capacity added.',
    technology: 'Lake desilting, bund strengthening, inlet/outlet restoration, native aquatic plant reintroduction, community engagement.',
    certifications: 'Section 80G. 18 years. PM Mann Ki Baat feature.',
    bestFor: [],
    geographicCoverage: ['Bengaluru', 'Delhi', 'Pan-India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Lake restoration, 59 lakes revived', citiesCovered: ['Bengaluru', 'Delhi', 'Pan-India'], active: true,
  },
  {
    id: 'p-lk-02', name: 'Environment Matters NGO',
    stream: 'lakes', providerType: 'NGO',
    city: 'Punjab/Delhi-NCR', website: 'environmentmatters.asia',
    capacityNotes: 'Pond rejuvenation specialist. Punjab, Haryana, Himachal Pradesh, J&K, Delhi-NCR focus.',
    technology: 'Pond desilting, bund repair, de-weeding, native plantation around banks, community awareness.',
    certifications: 'CSR project delivery track record.',
    bestFor: [],
    geographicCoverage: ['Punjab', 'Haryana', 'Delhi-NCR', 'Himachal Pradesh'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Pond rejuvenation, North India specialist', citiesCovered: ['Punjab', 'Haryana', 'Delhi', 'NCR'], active: true,
  },
  {
    id: 'p-lk-03', name: 'GuruJal',
    stream: 'lakes', providerType: 'NGO',
    city: 'Gurugram, Haryana', website: 'gurujal.org',
    capacityNotes: '8-step pond rejuvenation methodology. 20-year sustainability target.',
    technology: '8-step methodology: ecological assessment → community mobilisation → physical revival → wastewater treatment integration → monitoring.',
    certifications: 'BSF Brookfield Pond project. Science-led methodology.',
    bestFor: [],
    geographicCoverage: ['Haryana', 'Delhi-NCR'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: '8-step pond rejuvenation, science-led', citiesCovered: ['Gurugram', 'Delhi', 'NCR'], active: true,
  },
  {
    id: 'p-lk-04', name: 'Tarun Bharat Sangh (TBS)',
    stream: 'lakes', providerType: 'NGO',
    city: 'Alwar, Rajasthan',
    contactName: 'Rajendra Singh (Waterman of India)',
    capacityNotes: '4,500+ johads revived in Alwar district. Traditional johad and water body restoration specialist.',
    technology: 'Johad (traditional earthen structure) construction and revival. Rainwater harvesting integration. Community-led.',
    certifications: 'Ramon Magsaysay Award (Rajendra Singh). Globally recognised.',
    bestFor: [],
    geographicCoverage: ['Rajasthan', 'Haryana', 'UP', 'North India rural'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Johad revival, 4500+ water bodies, Ramon Magsaysay Award', citiesCovered: ['Rajasthan', 'Haryana', 'UP'], active: true,
  },
  {
    id: 'p-lk-05', name: 'Ekonnect Foundation India (EFI)',
    stream: 'lakes', providerType: 'NGO',
    city: 'Bengaluru, Karnataka',
    capacityNotes: 'Urban lake restoration specialists. Ecology + community participation.',
    technology: 'Scientific lake restoration: bund strengthening, inlet/outlet restoration, desilting, native biodiversity reintroduction.',
    certifications: 'Recognised as one of India\'s most credible lake restoration organisations.',
    bestFor: [],
    geographicCoverage: ['Bengaluru', 'South India'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Urban lake restoration, Bengaluru specialist', citiesCovered: ['Bengaluru', 'South India'], active: true,
  },
  {
    id: 'p-lk-06', name: 'Delhi Jal Board — Technical Advisory',
    stream: 'lakes', providerType: 'Consultant',
    city: 'Delhi', website: 'djb.gov.in',
    contactName: 'Ankit Srivastava (Technical Advisor)',
    capacityNotes: 'Rajokri Lake project — Delhi\'s first decentralised sewage system + lake rejuvenation.',
    technology: 'SWAB (Scientific Wetland with Active Biodigester) technology. Natural treatment. Community integration.',
    certifications: 'Jal Shakti Award winner. Government authority.',
    bestFor: [],
    geographicCoverage: ['Delhi'],
    commissionRatePct: 0, commissionStatus: 'Not discussed', providerStatus: 'Pending contact',
    speciality: 'Delhi lake rejuvenation, SWAB technology', citiesCovered: ['Delhi'], active: true,
  },
];

export const providerNotes: ProviderNote[] = [];

export const scripts: Script[] = [
  {
    id: 'sc1',
    category: 'Cold Approach',
    title: 'First phone call — Hospital / Nursing Home',
    content: `Namaste, main [Aapka Naam] bol raha hoon, JalDhara se. Hum Delhi mein buildings ko unke water bill reduce karne mein help karte hain — bina kisi upfront cost ke.

I am calling hospitals specifically because most hospitals in North Delhi are spending ₹15,000–₹40,000 per month on water, and there is a Delhi Jal Board rebate most of them are not claiming.

I would like to offer a 30-minute free water audit — no charge, no obligation. Can I speak with whoever handles your facility or maintenance costs?

[If asked what it involves]:
We visit the building, walk through the water systems, calculate how much your building is wasting and what it is worth, and leave you a written report — for free. Most hospitals save ₹8,000–₹20,000 per month after our recommendations.`,
  },
  {
    id: 'sc2',
    category: 'Cold Approach',
    title: 'First visit — Walk-in introduction',
    content: `Good morning / Good afternoon. My name is [Your Name], I am the founder of JalDhara — a water conservation advisory based in Model Town.

We work with hospitals, schools, and banquet halls in North Delhi to reduce their water costs. Our service is free of charge — we conduct a detailed water audit and give you a written report with specific recommendations.

The reason I am here specifically is that I have been working in this area and I notice most buildings are losing significant water — and money — through simple, fixable problems. Would the facilities manager or administration head be available for 10 minutes to hear more?`,
  },
  {
    id: 'sc3',
    category: 'DJB Rebate',
    title: 'DJB Rebate explanation WhatsApp / In-person',
    content: `Dear [Name],

Good news about your water bill. Delhi Jal Board offers a permanent 10% reduction in your annual water bill for buildings that install a greywater recycling system.

For your building, this would be approximately ₹[DJB rebate amount] per year — every year, from the day the system is certified by DJB.

This is in addition to the water savings from recycling. Combined, most buildings recover their installation cost in 18–30 months.

I would like to explain this in person with a short report prepared for your building specifically. Would [Day, Time] work for you?`,
  },
  {
    id: 'sc4',
    category: 'Objection Handlers',
    title: 'We don\'t have the budget for this',
    content: `I completely understand. That is actually the reason I wanted to meet — because the most common option we present does NOT require any upfront investment from you.

Here is how it works: A manufacturer installs the system at their cost. You pay nothing upfront. You simply pay a monthly fee — which is typically lower than what you are currently spending on tankers.

So instead of spending ₹[current tanker spend] on tankers this month, you would spend ₹[monthly WaaS fee] — and you would own the system after 5 years.

Would you like me to run the numbers for your building specifically?`,
  },
  {
    id: 'sc5',
    category: 'Objection Handlers',
    title: 'We already have a borewell / tube well',
    content: `That is great — and I want to make sure you are getting the best out of it. A few questions:

1. Do you know the TDS level of your borewell water? In many parts of Delhi, especially Model Town and Rohini, it is above 800 ppm — which means it needs treatment before it is safe to use for all purposes.

2. The borewell helps, but it does not replace the water you are flushing down the drain every day through normal building use. Greywater recycling captures that water and reuses it — so your borewell lasts longer and your tanker dependency drops.

Would it be useful to test your borewell water quality during the audit? We can do that at no charge.`,
  },
  {
    id: 'sc6',
    category: 'WhatsApp Templates',
    title: 'Post-visit follow-up WhatsApp',
    content: `Namaste [Name],

It was great meeting you / speaking with you today about water management at [Building Name].

As I mentioned, I am preparing a short water audit summary for your building — I will share it within the next 2–3 days.

In the meantime, if you have access to your last DJB water bill, could you share the total monthly amount? This will help me give you an accurate picture of the DJB rebate your building is eligible for.

Thank you for your time. — [Your Name], JalDhara`,
  },
  {
    id: 'sc7',
    category: 'WhatsApp Templates',
    title: 'Sharing audit report WhatsApp',
    content: `Namaste [Name],

Please find attached the water audit report for [Building Name].

Key findings:
• Current monthly water cost: ₹[amount]
• Estimated recoverable savings: ₹[savings]/month
• DJB rebate eligible: ₹[rebate]/year
• Recommended first action: [Quick win]

I would suggest a 20-minute call this week to walk you through the report. Would [Day] or [Day] work?

— [Your Name], JalDhara`,
  },
  {
    id: 'sc8',
    category: 'Referral Handover',
    title: 'Introducing manufacturer to building contact',
    content: `Dear [Building Contact Name],

I am connecting you with [Manufacturer Name] — they are one of the greywater recycling manufacturers I have vetted and worked with in Delhi.

[Manufacturer Contact] — meet [Building Contact], Facilities Manager at [Building Name]. They have completed a water audit with JalDhara and are interested in a [X KLD] greywater system.

[To manufacturer]: Please share your detailed proposal within 5 working days. Building contact is [Building Name], [Area]. Water bill: ₹[amount]/month. Tanker spend: ₹[amount]/month.

I will remain the point of contact for any questions. — [Your Name], JalDhara`,
  },
  {
    id: 'sc9',
    category: 'Referral Handover',
    title: 'Following up with manufacturer on referral',
    content: `Hi [Manufacturer Contact],

Following up on the referral I sent you — [Building Name], [Area], Delhi.

Has your team visited the site yet? The building contact is expecting to hear from you by [Date].

Please share the status with me so I can update the building as well. If there are any access issues or questions about the building, let me know.

— [Your Name], JalDhara`,
  },
  {
    id: 'sc10',
    category: 'Commission',
    title: 'Commission follow-up after installation',
    content: `Hi [Manufacturer Contact],

Congratulations on completing the installation at [Building Name] — I hope it went well.

As per our referral agreement, the commission on this installation (₹[installation value] × [commission %]%) = ₹[commission amount] is now due.

Could you confirm the expected payment date? I will share my account details once confirmed.

Thank you for the continued partnership. — [Your Name], JalDhara`,
  },
  {
    id: 'sc11',
    category: 'Cold Approach',
    title: 'Approaching a school / coaching centre',
    content: `Namaste, I am [Name] from JalDhara. We help schools and coaching centres in North Delhi reduce their water costs through a free audit service.

Most schools with 500+ students are spending ₹8,000–₹25,000 per month on water — and much of it is being wasted silently through old plumbing, garden overwatering, or leaking cisterns.

We conducted a free audit, identify the waste, and give you a detailed report. In most cases, schools can save 30–40% of their water bill with small changes.

Would the Principal or Administrative Officer be available for a 10-minute conversation?`,
  },
  {
    id: 'sc12',
    category: 'Cold Approach',
    title: 'Approaching a banquet hall / marriage venue',
    content: `Good morning. I am [Name] from JalDhara — we work with banquet halls in Delhi on water cost reduction.

Banquet halls have some of the highest water consumption per square foot of any building — because of the kitchen, the cleaning of halls after events, and often a borewell that is working overtime.

We offer a free water audit that typically identifies ₹5,000–₹20,000 per month in savings. There is no charge and no obligation.

Could I speak with the owner or manager for 10 minutes to explain?`,
  },
];

export const reminders: Reminder[] = [
  {
    id: 'rem1',
    buildingId: 'b1',
    referralId: 'ref1',
    type: 'Referral follow-up',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    message: 'Follow up with Aguapuro — check if proposal has been sent to New Durga Hospital',
    whatsappTemplate: 'Hi Vikram, following up on New Durga Hospital referral. Has the proposal been sent yet? — JalDhara',
    completed: false,
    createdAt: new Date().toISOString(),
  },
];

export const rwhAssessments: RwhAssessment[] = [];

export const treeProjects: TreeProject[] = [
  {
    id: 'tp1',
    cityId: 'city1',
    areaId: 'a1',
    projectName: 'Model Town Park Miyawaki Forest',
    projectType: 'Miyawaki Urban Forest',
    availableLandSqm: 400,
    currentLandUse: 'Unused park corner / compacted soil',
    soilCondition: 'Compacted, low organic matter',
    sunlight: 'Full sun',
    waterSourceAvailable: true,
    irrigationMethod: 'Drip irrigation',
    isMiyawakiMethod: true,
    miyawakiLayersPlanned: 4,
    nativeSpeciesList: 'Neem (Azadirachta indica), Peepal (Ficus religiosa), Jamun (Syzygium cumini), Arjun (Terminalia arjuna), Maulsari (Mimusops elengi), Kadamba (Neolamarckia cadamba)',
    treesPlanned: 800,
    treesPlanted: 0,
    tresSurviving: 0,
    survivalRatePct: 0,
    estimatedCo2PerYearKg: 16800,
    costPerTreeInr: 150,
    totalProjectCostInr: 120000,
    fundingSource: 'CSR / RWA contribution',
    status: 'Planning',
    notes: 'Miyawaki method: 3–4 trees per sq m. Target 10× faster growth than conventional plantation. Native species only. SayTrees interested in partnering.',
    createdAt: new Date().toISOString(),
  },
];

export const treeMonitoringLogs: TreeMonitoringLog[] = [];

export const waterBodies: WaterBody[] = [
  {
    id: 'wb1',
    cityId: 'city1',
    areaId: 'a1',
    name: 'Model Town Lake',
    localName: 'Model Town Jheel',
    type: 'Natural Lake',
    lat: 28.7196,
    lng: 77.1883,
    address: 'Model Town Park, North Delhi',
    surfaceAreaSqm: 18000,
    maxDepthM: 3.5,
    currentWaterLevel: 'Half',
    condition: 'Degraded',
    encroachmentPresent: false,
    sewageInflow: true,
    solidWasteDumping: true,
    invasiveSpecies: 'Water hyacinth (Eichhornia crassipes)',
    traditionalUse: 'Fishing, recreational bathing, religious rituals (Chhath Puja)',
    lastKnownFunctionalYear: 2015,
    restorationFeasibility: 'High',
    estimatedWaterHoldingLitres: 63000000,
    restorationStatus: 'Identified',
    responsibleAuthority: 'North Delhi Municipal Corporation',
    estimatedRestorationCostInr: 2500000,
    fundingSecuredInr: 0,
    notes: 'Sewage inflow from nearby drain needs to be cut off first. Desilting and water hyacinth removal estimated at ₹8–12 lakh. Strong community support from local RWA.',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'wb2',
    cityId: 'city1',
    areaId: 'a4',
    name: 'Azadpur Johad',
    type: 'Johad',
    lat: 28.7124,
    lng: 77.1756,
    address: 'Near Azadpur Mandi, North Delhi',
    surfaceAreaSqm: 4500,
    currentWaterLevel: 'Dry',
    condition: 'Heavily Encroached',
    encroachmentPresent: true,
    sewageInflow: true,
    solidWasteDumping: true,
    traditionalUse: 'Traditional rainwater storage for local community and livestock',
    lastKnownFunctionalYear: 2008,
    restorationFeasibility: 'Medium',
    restorationStatus: 'Identified',
    responsibleAuthority: 'DDA / Revenue Department',
    estimatedRestorationCostInr: 800000,
    fundingSecuredInr: 0,
    notes: 'Partially encroached by informal structures. Would require legal action to free boundary. Could hold ~4.5 million litres if restored.',
    createdAt: new Date().toISOString(),
  },
];

export const lakeRestorationLogs: LakeRestorationLog[] = [];

export const csrPartners: CsrPartner[] = [
  {
    id: 'csr1',
    companyName: 'SayTrees Environmental Trust',
    contactName: 'Coordination Team',
    contactEmail: 'contact@saytrees.org',
    csrFocusAreas: ['Urban reforestation', 'Miyawaki plantation', 'Community green spaces'],
    preferredProjectTypes: 'Miyawaki urban forests, school plantation drives, corporate green days',
    relationshipStatus: 'Conversation',
    notes: 'Leading urban reforestation NGO. Strong track record in Bangalore and Delhi. Open to partnering on Miyawaki projects with RWAs and corporates. Check saytrees.org for current campaigns.',
    createdAt: new Date().toISOString(),
  },
];

export const journalEntries: JournalEntry[] = [
  {
    id: 'j1',
    title: 'Why I started JalDhara',
    body: `Delhi loses 40% of its treated water to leaks before it reaches homes. Most buildings pay for water they never use. The DJB rebate scheme exists but barely anyone knows about it.\n\nI want to be the person who fixes that — one building at a time. Starting with hospitals in Model Town because they have the highest pain and the clearest ROI.`,
    category: 'Inspiration',
    tags: ['origin', 'mission'],
    pinned: true,
    createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'j2',
    title: 'Meeting notes — New Durga Hospital',
    body: `Met Rajesh Sharma, Facilities Manager. Warm conversation. Key pain: tanker dependency in summer. They spend ~₹28k/month on water but feel out of control.\n\nHe mentioned the RO reject water going to drain — this is a quick win. Estimate 1,500L/day wasted.\n\nFollow up: share DJB rebate calculation. Book audit date.`,
    category: 'Meeting Notes',
    tags: ['new-durga', 'hospital', 'model-town'],
    pinned: false,
    linkedBuildingId: 'b1',
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
  },
];
