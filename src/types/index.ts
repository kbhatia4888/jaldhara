export interface Country {
  id: string;
  name: string;
  code: string;
}

export interface State {
  id: string;
  name: string;
  countryId: string;
  code: string;
  waterStressLevel?: 'Low' | 'Medium' | 'High' | 'Critical';
  notes?: string;
}

export interface CityPlaybook {
  waterCostPerKL: number;
  tankerCostRange: string;
  groundwaterSituation: string;
  governmentIncentives: string;
  keyCustomerTypes: string;
  founderNotes: string;
  bestMonthsForSales: string;
}

export interface City {
  id: string;
  name: string;
  stateId: string;
  stage: 'Not Started' | 'Researching' | 'First Visits' | 'First Revenue' | 'Scaling';
  playbook: CityPlaybook;
  lat: number;
  lng: number;
}

export interface Area {
  id: string;
  name: string;
  cityId: string;
  notes?: string;
}

export type BuildingStatus =
  | 'Cold'
  | 'Warm Lead'
  | 'Warm'
  | 'Hot'
  | 'Prospect'
  | 'Audited'
  | 'Referred'
  | 'Installed'
  | 'WaaS'
  | 'Won'
  | 'Lost';

export type BuildingType =
  | 'Apartment'
  | 'Private Hospital'
  | 'Hospital'
  | 'Private School'
  | 'School'
  | 'Banquet Hall'
  | 'Coaching Hostel'
  | 'Hostel'
  | 'Hotel'
  | 'Hotel/Guest House'
  | 'Housing Society'
  | 'Commercial'
  | 'Industrial Unit'
  | 'Corporate Office'
  | 'House'
  | 'Other';

export interface Building {
  // address replaces area/state dropdowns for quick entry
  address?: string;
  zip?: string;
  id: string;
  name: string;
  areaId: string;
  cityId: string;
  stateId: string;
  type: BuildingType;
  lat: number;
  lng: number;
  // Legacy field (annual tanker cost)
  tankerCostAnnual?: number;
  // New granular fields
  municipalSupplyQuality?: 'Good (20+ hrs)' | 'Moderate (10–20 hrs)' | 'Poor (<10 hrs)' | 'Tanker only';
  tankerCountPerMonth?: number;
  monthlyWaterSpend?: number;
  recyclingStatus?: 'None' | 'RWH only' | 'STP present unused' | 'STP active' | 'Greywater system';
  painQuote?: string;
  contactDesignation?: string;
  occupancyCount?: number;
  // Auto-calculated
  greywaterPotentialLpd?: number;
  djbRebateAnnual?: number;
  estimatedAnnualSaving?: number;
  status: BuildingStatus;
  contactName: string;
  contactPhone: string;
  contactEmail?: string;
  notes: string;
  createdAt: string;
  floors?: number;
  flats?: number;
  dailyWaterConsumption?: number;
  followUpDate?: string;
  lastContactedAt?: string;
}

export interface Deal {
  id: string;
  buildingId: string;
  stage: 'New' | 'Contacted' | 'Audit Scheduled' | 'Audit Done' | 'Proposal Sent' | 'Negotiation' | 'Won' | 'Lost';
  value: number;
  waterSavedKLD: number;
  closedAt?: string;
  createdAt: string;
  notes: string;
}

export interface Audit {
  id: string;
  buildingId: string;
  date: string;
  currentWaterBill: number;
  tankerSpend: number;
  borewellDepth: number;
  tdsLevel: number;
  recommendedSystem: string;
  potentialSavings: number;
  notes: string;
  conductedBy: string;
  // Extended fields
  dailyConsumptionLitres?: number;
  occupancyCount?: number;
  benchmarkConsumption?: number;
  wasteChecklist?: string[];
  greywaterPotentialLpd?: number;
  capexEstimate?: number;
  paybackMonths?: number;
  djbRebateAnnual?: number;
  priorityActions?: { description: string; estimatedCost: number; monthlySaving: number; urgency: 'Quick win' | 'Medium' | 'Long term' }[];
}

export interface Manufacturer {
  id: string;
  name: string;
  city: string;
  website?: string;
  contactName?: string;
  contactPhone?: string;
  email?: string;
  commissionRatePct: number;
  speciality: string;
  citiesCovered: string[];
  notes?: string;
  active: boolean;
}

export type ReferralStatus =
  | 'Pending'
  | 'Contacted'
  | 'Converted'
  | 'Referred'
  | 'Manufacturer Visited'
  | 'Proposal Sent'
  | 'Accepted'
  | 'Installation in Progress'
  | 'Complete'
  | 'Commission Paid';

export interface Referral {
  id: string;
  fromBuildingId: string;
  toBuildingId?: string;
  referredName: string;
  referredContact: string;
  // Manufacturer referral / commission fields
  manufacturerId?: string;
  installationValue?: number;
  commissionPct?: number;
  expectedCommission?: number;
  commissionPaid?: number;
  commissionPaidDate?: string;
  referredDate?: string;
  status: ReferralStatus;
  notes: string;
  createdAt: string;
}

export interface Script {
  id: string;
  category: 'Cold Approach' | 'DJB Rebate' | 'Objection Handlers' | 'WhatsApp Templates' | 'Referral Handover' | 'Commission';
  title: string;
  content: string;
}

export interface Reminder {
  id: string;
  buildingId?: string;
  referralId?: string;
  type: string;
  dueDate: string;
  message: string;
  whatsappTemplate?: string;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export interface AppSettings {
  consultantName: string;
  consultantPhone: string;
  consultantEmail: string;
  businessAddress: string;
  msmeNumber: string;
  gstNumber: string;
  mapboxToken: string;
  defaultMapLat: number;
  defaultMapLng: number;
  currentPhase: 1 | 2 | 3;
  reportFooter: string;
  onboardingComplete: boolean;
}

// ── NEW STREAM TYPES ─────────────────────────────────

export interface CityRainfallData {
  annualRainfallMm: number;
  monsoonMonths: string;
}

export interface CityPlaybookExtended extends CityPlaybook {
  annualRainfallMm?: number;
  monsoonMonths?: string;
  majorWaterBodiesAtRisk?: string;
  treePlantationPartners?: string;
  dominantInvasiveSpecies?: string;
  governmentSchemes?: string;
}

// RAINWATER HARVESTING

export interface RwhAssessment {
  id: string;
  buildingId: string;
  assessmentDate: string;
  totalRoofAreaSqm: number;
  usableCatchmentPct: number;   // default 75
  roofMaterial: string;
  roofCondition: string;
  avgAnnualRainfallMm: number;  // from city playbook
  monsoonMonths: string;
  rwhSystemPresent: boolean;
  rwhSystemFunctional?: boolean;
  rwhSystemNotes?: string;
  ngtMandateApplicable: boolean;
  currentlyCompliant?: boolean;
  // Calculated
  annualHarvestPotentialLitres: number;
  storageRecommendedLitres: number;
  capexEstimateMin: number;
  capexEstimateMax: number;
  annualSavingInr: number;
  paybackMonths: number;
  combinedDjbRebatePct: number;  // 15% if with greywater, else 10%
  combinedDjbRebateInr: number;
  recommendedSystemType: string;
  notes: string;
  createdAt: string;
}

// URBAN TREES

export type TreeProjectStatus = 'Planning' | 'Site Ready' | 'Plantation Done' | 'Monitoring' | 'Established';

export interface TreeProject {
  id: string;
  buildingId?: string;
  areaId?: string;
  cityId: string;
  projectName: string;
  projectType: string;
  availableLandSqm: number;
  currentLandUse: string;
  soilCondition: string;
  sunlight: string;
  waterSourceAvailable: boolean;
  irrigationMethod: string;
  isMiyawakiMethod: boolean;
  miyawakiLayersPlanned?: number;
  nativeSpeciesList: string;
  treesPlanned: number;
  treesPlanted: number;
  tresSurviving: number;
  survivalRatePct: number;
  plantationDate?: string;
  lastMonitoringDate?: string;
  estimatedCo2PerYearKg: number;
  biodiversityScore?: number;
  canopyCoverSqm?: number;
  ngoPartner?: string;
  csrSponsor?: string;
  volunteerCount?: number;
  costPerTreeInr: number;
  totalProjectCostInr: number;
  fundingSource?: string;
  status: TreeProjectStatus;
  notes?: string;
  createdAt: string;
}

export interface TreeMonitoringLog {
  id: string;
  projectId: string;
  logDate: string;
  treesCounted: number;
  treesSurviving: number;
  healthNotes: string;
  monitoredBy: string;
  createdAt: string;
}

// LAKES & WATER BODIES

export type WaterBodyCondition = 'Healthy' | 'Degraded' | 'Heavily Encroached' | 'Sewage Discharge' | 'Dry' | 'Polluted';
export type WaterBodyStatus = 'Identified' | 'Assessment Done' | 'Partner Engaged' | 'Work Started' | 'Restoration Complete' | 'Monitoring';

export interface WaterBody {
  id: string;
  areaId?: string;
  cityId: string;
  name: string;
  localName?: string;
  type: 'Natural Lake' | 'Johad' | 'Pond' | 'Nala' | 'Baoli' | 'Seasonal Wetland' | 'Check Dam';
  lat?: number;
  lng?: number;
  address?: string;
  surfaceAreaSqm?: number;
  maxDepthM?: number;
  currentWaterLevel?: 'Full' | 'Half' | 'Dry' | 'Encroached';
  condition: WaterBodyCondition;
  encroachmentPresent?: boolean;
  sewageInflow?: boolean;
  solidWasteDumping?: boolean;
  invasiveSpecies?: string;
  traditionalUse?: string;
  lastKnownFunctionalYear?: number;
  restorationFeasibility?: 'High' | 'Medium' | 'Low' | 'Not Feasible';
  estimatedWaterHoldingLitres?: number;
  restorationStatus: WaterBodyStatus;
  responsibleAuthority?: string;
  ngoPartner?: string;
  csrSponsor?: string;
  communityChampion?: string;
  estimatedRestorationCostInr?: number;
  fundingSecuredInr?: number;
  notes?: string;
  createdAt: string;
}

export interface LakeRestorationLog {
  id: string;
  waterBodyId: string;
  logDate: string;
  workDone: string;
  waterLevelChange?: string;
  volunteersInvolved?: number;
  notes?: string;
  createdAt: string;
}

// CSR PARTNERS

export type CsrStatus = 'Prospect' | 'Conversation' | 'Proposal Sent' | 'Active' | 'Completed';

export interface CsrPartner {
  id: string;
  companyName: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
  csrFocusAreas: string[];
  typicalBudgetInr?: number;
  preferredProjectTypes?: string;
  relationshipStatus: CsrStatus;
  notes?: string;
  createdAt: string;
}

// Extended Audit type for multi-step form
export interface AuditStep1 {
  auditDate: string;
  auditorName: string;
  contactPresentName: string;
  contactPresentDesignation: string;
  djbBillShown: 'Yes' | 'No' | 'Partially';
  walkedPremises: 'Yes' | 'No';
  siteVisitNotes: string;
}

export interface AuditStep2 {
  hasMunicipalConnection: boolean;
  connectionSize?: string;
  municipalHoursPerDay?: number;
  municipalLitresPerDay?: number;
  municipalAdequacy?: string;
  hasOHT: boolean;
  ohtCapacityLitres?: number;
  ohtOverflows?: string;
  ohtOverflowSensor?: boolean;
  ohtOverflowTime?: string;
  hasBorewell: boolean;
  borewellDepthFt?: number;
  borewellQuality?: string;
  borewellLitresPerDay?: number;
  usesTankers: boolean;
  tankerCountPerMonth?: number;
  tankerCapacityLitres?: number;
  tankerCostPerTanker?: number;
  tankerMonthlySpend?: number;
  tankerMonthlyLitres?: number;
  tankersSufficient?: string;
  totalDailyConsumption?: number;
  djbMonthlyBill?: number;
  totalMonthlyWaterSpend?: number;
}

export interface AuditStep3 {
  // Hospital
  hospitalBeds?: number;
  hospitalBedOccupancyPct?: number;
  hospitalOpdPerDay?: number;
  hospitalResidentialStaff?: boolean;
  hospitalResidentialCount?: number;
  hospitalHasKitchen?: boolean;
  hospitalHasLaundry?: boolean;
  // School
  schoolStudents?: number;
  schoolStaff?: number;
  schoolHasHostel?: boolean;
  schoolHostelCapacity?: number;
  schoolHasPool?: boolean;
  schoolHasKitchen?: boolean;
  // Banquet
  banquetHalls?: number;
  banquetLargestHallCapacity?: number;
  banquetEventsPerMonth?: number;
  banquetHasKitchen?: boolean;
  banquetHasRooms?: boolean;
  banquetRoomCount?: number;
  // Hostel
  hostelResidents?: number;
  hostelBathroomType?: string;
  hostelHasMess?: boolean;
  hostelToiletsPerFloor?: number;
  // Hotel
  hotelRooms?: number;
  hotelOccupancyPct?: number;
  hotelHasRestaurant?: boolean;
  hotelHasPool?: boolean;
  hotelHasLaundry?: boolean;
  // Society
  societyFlats?: number;
  societyResidentsPerFlat?: number;
  societyCommonAreas?: string;
  societyHasSTP?: boolean;
  societySTPFunctional?: boolean;
  // Industrial
  industrialType?: string;
  industrialEmployees?: number;
  industrialProcessWater?: boolean;
  industrialCoolingTowers?: boolean;
}

export interface AuditStep4 {
  wasteItems: {
    type: string;
    found: boolean;
    description: string;
    dailyLitres: number;
    monthlyCost: number;
  }[];
  totalWasteLitresPerDay: number;
  totalWasteMonthlyCost: number;
}

export interface AuditStep5 {
  greywaterPotentialLpd: number;
  recoverableLpd: number;
  monthlyValueINR: number;
  occupancyOverride?: number;
}

export interface AuditStep6 {
  buildingAreaSqM?: number;
  eligibleForDjbRebate: boolean;
  djbRebateAnnual: number;
  recommendedSizeKLD: number;
  capexMin: number;
  capexMax: number;
  annualOpexEstimate: number;
  annualAMC: number;
  annualWaterSaving: number;
  totalAnnualBenefit: number;
  paybackMonths: number;
  fiveYearNetBenefit: number;
  tenYearNetBenefit: number;
}

export interface AuditStep7 {
  recommendations: {
    rank: number;
    title: string;
    description: string;
    estimatedCostMin: number;
    estimatedCostMax: number;
    monthlySaving: number;
    urgency: 'Quick win' | 'Medium' | 'Long term';
  }[];
}

export interface FullAudit extends Audit {
  step1?: AuditStep1;
  step2?: AuditStep2;
  step3?: AuditStep3;
  step4?: AuditStep4;
  step5?: AuditStep5;
  step6?: AuditStep6;
  step7?: AuditStep7;
  isDraft?: boolean;
  currentStep?: number;
}

export type CityStage = City['stage'];
export type DealStage = Deal['stage'];

// ── JOURNAL ──────────────────────────────────────────────

export type JournalCategory =
  | 'Inspiration'
  | 'Meeting Notes'
  | 'Product Idea'
  | 'Research'
  | 'Observation'
  | 'Personal'
  | 'Other';

export interface JournalEntry {
  id: string;
  title: string;
  body: string;
  category: JournalCategory;
  tags: string[];
  pinned: boolean;
  linkedBuildingId?: string;
  createdAt: string;
  updatedAt: string;
}

// ── CONTACT LOG ───────────────────────────────────────────

export type ContactLogType =
  | 'Meeting'
  | 'Phone call'
  | 'WhatsApp'
  | 'Email sent'
  | 'No response'
  | 'Follow-up set'
  | 'Other';

export interface ContactLog {
  id: string;
  buildingId: string;
  date: string;
  type: ContactLogType;
  notes: string;
  nextAction?: string;
  followUpDate?: string;
  createdAt: string;
}
