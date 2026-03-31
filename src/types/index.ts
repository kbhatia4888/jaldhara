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
  | 'Other';

export interface Building {
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
}

export type CityStage = City['stage'];
export type DealStage = Deal['stage'];
