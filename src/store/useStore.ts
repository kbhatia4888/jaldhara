import { createContext, useContext, useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Country, State, City, Area, Building, Deal, Audit, Referral, Manufacturer, Script, Reminder, AppSettings, RwhAssessment, TreeProject, TreeMonitoringLog, WaterBody, LakeRestorationLog, CsrPartner, JournalEntry, ContactLog } from '../types';
import {
  countries as seedCountries,
  states as seedStates,
  cities as seedCities,
  areas as seedAreas,
  buildings as seedBuildings,
  deals as seedDeals,
  audits as seedAudits,
  referrals as seedReferrals,
  manufacturers as seedManufacturers,
  scripts as seedScripts,
  reminders as seedReminders,
  rwhAssessments as seedRwhAssessments,
  treeProjects as seedTreeProjects,
  treeMonitoringLogs as seedTreeMonitoringLogs,
  waterBodies as seedWaterBodies,
  lakeRestorationLogs as seedLakeRestorationLogs,
  csrPartners as seedCsrPartners,
  journalEntries as seedJournalEntries,
} from '../data/seed';
import React from 'react';

const defaultSettings: AppSettings = {
  consultantName: '',
  consultantPhone: '',
  consultantEmail: '',
  businessAddress: 'Model Town, Delhi',
  msmeNumber: '',
  gstNumber: '',
  mapboxToken: '',
  defaultMapLat: 28.7041,
  defaultMapLng: 77.1025,
  currentPhase: 1,
  reportFooter: 'This is an independent audit. The consultant has no commercial affiliation with any installation company or manufacturer.',
  onboardingComplete: true,
};

interface AppState {
  countries: Country[];
  states: State[];
  cities: City[];
  areas: Area[];
  buildings: Building[];
  deals: Deal[];
  audits: Audit[];
  referrals: Referral[];
  manufacturers: Manufacturer[];
  scripts: Script[];
  reminders: Reminder[];
  settings: AppSettings;
  rwhAssessments: RwhAssessment[];
  treeProjects: TreeProject[];
  treeMonitoringLogs: TreeMonitoringLog[];
  waterBodies: WaterBody[];
  lakeRestorationLogs: LakeRestorationLog[];
  csrPartners: CsrPartner[];
  journalEntries: JournalEntry[];
  contactLogs: ContactLog[];
}

type Action =
  | { type: 'ADD_JOURNAL'; payload: JournalEntry }
  | { type: 'UPDATE_JOURNAL'; payload: JournalEntry }
  | { type: 'DELETE_JOURNAL'; payload: string }
  | { type: 'ADD_RWH'; payload: RwhAssessment }
  | { type: 'UPDATE_RWH'; payload: RwhAssessment }
  | { type: 'DELETE_RWH'; payload: string }
  | { type: 'ADD_TREE_PROJECT'; payload: TreeProject }
  | { type: 'UPDATE_TREE_PROJECT'; payload: TreeProject }
  | { type: 'DELETE_TREE_PROJECT'; payload: string }
  | { type: 'ADD_TREE_LOG'; payload: TreeMonitoringLog }
  | { type: 'UPDATE_TREE_LOG'; payload: TreeMonitoringLog }
  | { type: 'DELETE_TREE_LOG'; payload: string }
  | { type: 'ADD_WATER_BODY'; payload: WaterBody }
  | { type: 'UPDATE_WATER_BODY'; payload: WaterBody }
  | { type: 'DELETE_WATER_BODY'; payload: string }
  | { type: 'ADD_LAKE_LOG'; payload: LakeRestorationLog }
  | { type: 'UPDATE_LAKE_LOG'; payload: LakeRestorationLog }
  | { type: 'DELETE_LAKE_LOG'; payload: string }
  | { type: 'ADD_CSR_PARTNER'; payload: CsrPartner }
  | { type: 'UPDATE_CSR_PARTNER'; payload: CsrPartner }
  | { type: 'DELETE_CSR_PARTNER'; payload: string }
  | { type: 'ADD_COUNTRY'; payload: Country }
  | { type: 'UPDATE_COUNTRY'; payload: Country }
  | { type: 'DELETE_COUNTRY'; payload: string }
  | { type: 'ADD_STATE'; payload: State }
  | { type: 'UPDATE_STATE'; payload: State }
  | { type: 'DELETE_STATE'; payload: string }
  | { type: 'ADD_CITY'; payload: City }
  | { type: 'UPDATE_CITY'; payload: City }
  | { type: 'DELETE_CITY'; payload: string }
  | { type: 'ADD_AREA'; payload: Area }
  | { type: 'UPDATE_AREA'; payload: Area }
  | { type: 'DELETE_AREA'; payload: string }
  | { type: 'ADD_BUILDING'; payload: Building }
  | { type: 'UPDATE_BUILDING'; payload: Building }
  | { type: 'DELETE_BUILDING'; payload: string }
  | { type: 'ADD_DEAL'; payload: Deal }
  | { type: 'UPDATE_DEAL'; payload: Deal }
  | { type: 'DELETE_DEAL'; payload: string }
  | { type: 'ADD_AUDIT'; payload: Audit }
  | { type: 'UPDATE_AUDIT'; payload: Audit }
  | { type: 'DELETE_AUDIT'; payload: string }
  | { type: 'ADD_REFERRAL'; payload: Referral }
  | { type: 'UPDATE_REFERRAL'; payload: Referral }
  | { type: 'DELETE_REFERRAL'; payload: string }
  | { type: 'ADD_MANUFACTURER'; payload: Manufacturer }
  | { type: 'UPDATE_MANUFACTURER'; payload: Manufacturer }
  | { type: 'DELETE_MANUFACTURER'; payload: string }
  | { type: 'ADD_SCRIPT'; payload: Script }
  | { type: 'UPDATE_SCRIPT'; payload: Script }
  | { type: 'DELETE_SCRIPT'; payload: string }
  | { type: 'ADD_REMINDER'; payload: Reminder }
  | { type: 'UPDATE_REMINDER'; payload: Reminder }
  | { type: 'DELETE_REMINDER'; payload: string }
  | { type: 'ADD_CONTACT_LOG'; payload: ContactLog }
  | { type: 'UPDATE_CONTACT_LOG'; payload: ContactLog }
  | { type: 'DELETE_CONTACT_LOG'; payload: string }
  | { type: 'UPDATE_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'LOAD_STATE'; payload: AppState }
  | { type: 'RESET_STATE' };

// ── localStorage (fast local cache) ─────────────────────
const STORAGE_KEY = 'jaldrishti_state_v3';

function loadFromLocalStorage(): AppState | null {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return { ...seedState, ...JSON.parse(stored) };
  } catch {
    // ignore
  }
  return null;
}

function saveToLocalStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

// ── Firestore helpers ────────────────────────────────────
const FIRESTORE_DOC = 'jaldrishti/app_state';

async function loadFromFirestore(): Promise<AppState | null> {
  try {
    const ref = doc(db, 'jaldrishti', 'app_state');
    const snap = await getDoc(ref);
    if (snap.exists()) {
      return { ...seedState, ...snap.data() };
    }
  } catch (err) {
    console.warn('Firestore load failed, using local cache:', err);
  }
  return null;
}

async function saveToFirestore(state: AppState): Promise<void> {
  try {
    const ref = doc(db, 'jaldrishti', 'app_state');
    // JSON round-trip strips undefined values which Firestore rejects
    const cleaned = JSON.parse(JSON.stringify(state));
    await setDoc(ref, cleaned);
  } catch (err) {
    console.warn('Firestore save failed:', err);
  }
}

// ── Seed & initial state ─────────────────────────────────
const seedState: AppState = {
  countries: seedCountries,
  states: seedStates,
  cities: seedCities,
  areas: seedAreas,
  buildings: seedBuildings,
  deals: seedDeals,
  audits: seedAudits,
  referrals: seedReferrals,
  manufacturers: seedManufacturers,
  scripts: seedScripts,
  reminders: seedReminders,
  settings: defaultSettings,
  rwhAssessments: seedRwhAssessments,
  treeProjects: seedTreeProjects,
  treeMonitoringLogs: seedTreeMonitoringLogs,
  waterBodies: seedWaterBodies,
  lakeRestorationLogs: seedLakeRestorationLogs,
  csrPartners: seedCsrPartners,
  journalEntries: seedJournalEntries,
  contactLogs: [],
};

// Start with localStorage for instant first paint; Firestore replaces it on load
const initialState: AppState = loadFromLocalStorage() || seedState;

// ── Reducer ──────────────────────────────────────────────
function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'ADD_COUNTRY':
      return { ...state, countries: [...state.countries, action.payload] };
    case 'UPDATE_COUNTRY':
      return { ...state, countries: state.countries.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_COUNTRY':
      return { ...state, countries: state.countries.filter(c => c.id !== action.payload) };

    case 'ADD_STATE':
      return { ...state, states: [...state.states, action.payload] };
    case 'UPDATE_STATE':
      return { ...state, states: state.states.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_STATE':
      return { ...state, states: state.states.filter(s => s.id !== action.payload) };

    case 'ADD_CITY':
      return { ...state, cities: [...state.cities, action.payload] };
    case 'UPDATE_CITY':
      return { ...state, cities: state.cities.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CITY':
      return { ...state, cities: state.cities.filter(c => c.id !== action.payload) };

    case 'ADD_AREA':
      return { ...state, areas: [...state.areas, action.payload] };
    case 'UPDATE_AREA':
      return { ...state, areas: state.areas.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_AREA':
      return { ...state, areas: state.areas.filter(a => a.id !== action.payload) };

    case 'ADD_BUILDING':
      return { ...state, buildings: [...state.buildings, action.payload] };
    case 'UPDATE_BUILDING':
      return { ...state, buildings: state.buildings.map(b => b.id === action.payload.id ? action.payload : b) };
    case 'DELETE_BUILDING':
      return { ...state, buildings: state.buildings.filter(b => b.id !== action.payload) };

    case 'ADD_DEAL':
      return { ...state, deals: [...state.deals, action.payload] };
    case 'UPDATE_DEAL':
      return { ...state, deals: state.deals.map(d => d.id === action.payload.id ? action.payload : d) };
    case 'DELETE_DEAL':
      return { ...state, deals: state.deals.filter(d => d.id !== action.payload) };

    case 'ADD_AUDIT':
      return { ...state, audits: [...state.audits, action.payload] };
    case 'UPDATE_AUDIT':
      return { ...state, audits: state.audits.map(a => a.id === action.payload.id ? action.payload : a) };
    case 'DELETE_AUDIT':
      return { ...state, audits: state.audits.filter(a => a.id !== action.payload) };

    case 'ADD_REFERRAL':
      return { ...state, referrals: [...state.referrals, action.payload] };
    case 'UPDATE_REFERRAL':
      return { ...state, referrals: state.referrals.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_REFERRAL':
      return { ...state, referrals: state.referrals.filter(r => r.id !== action.payload) };

    case 'ADD_MANUFACTURER':
      return { ...state, manufacturers: [...state.manufacturers, action.payload] };
    case 'UPDATE_MANUFACTURER':
      return { ...state, manufacturers: state.manufacturers.map(m => m.id === action.payload.id ? action.payload : m) };
    case 'DELETE_MANUFACTURER':
      return { ...state, manufacturers: state.manufacturers.filter(m => m.id !== action.payload) };

    case 'ADD_SCRIPT':
      return { ...state, scripts: [...state.scripts, action.payload] };
    case 'UPDATE_SCRIPT':
      return { ...state, scripts: state.scripts.map(s => s.id === action.payload.id ? action.payload : s) };
    case 'DELETE_SCRIPT':
      return { ...state, scripts: state.scripts.filter(s => s.id !== action.payload) };

    case 'ADD_REMINDER':
      return { ...state, reminders: [...state.reminders, action.payload] };
    case 'UPDATE_REMINDER':
      return { ...state, reminders: state.reminders.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_REMINDER':
      return { ...state, reminders: state.reminders.filter(r => r.id !== action.payload) };

    case 'ADD_JOURNAL':
      return { ...state, journalEntries: [...state.journalEntries, action.payload] };
    case 'UPDATE_JOURNAL':
      return { ...state, journalEntries: state.journalEntries.map(e => e.id === action.payload.id ? action.payload : e) };
    case 'DELETE_JOURNAL':
      return { ...state, journalEntries: state.journalEntries.filter(e => e.id !== action.payload) };

    case 'ADD_RWH':
      return { ...state, rwhAssessments: [...state.rwhAssessments, action.payload] };
    case 'UPDATE_RWH':
      return { ...state, rwhAssessments: state.rwhAssessments.map(r => r.id === action.payload.id ? action.payload : r) };
    case 'DELETE_RWH':
      return { ...state, rwhAssessments: state.rwhAssessments.filter(r => r.id !== action.payload) };

    case 'ADD_TREE_PROJECT':
      return { ...state, treeProjects: [...state.treeProjects, action.payload] };
    case 'UPDATE_TREE_PROJECT':
      return { ...state, treeProjects: state.treeProjects.map(t => t.id === action.payload.id ? action.payload : t) };
    case 'DELETE_TREE_PROJECT':
      return { ...state, treeProjects: state.treeProjects.filter(t => t.id !== action.payload) };

    case 'ADD_TREE_LOG':
      return { ...state, treeMonitoringLogs: [...state.treeMonitoringLogs, action.payload] };
    case 'UPDATE_TREE_LOG':
      return { ...state, treeMonitoringLogs: state.treeMonitoringLogs.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_TREE_LOG':
      return { ...state, treeMonitoringLogs: state.treeMonitoringLogs.filter(l => l.id !== action.payload) };

    case 'ADD_WATER_BODY':
      return { ...state, waterBodies: [...state.waterBodies, action.payload] };
    case 'UPDATE_WATER_BODY':
      return { ...state, waterBodies: state.waterBodies.map(w => w.id === action.payload.id ? action.payload : w) };
    case 'DELETE_WATER_BODY':
      return { ...state, waterBodies: state.waterBodies.filter(w => w.id !== action.payload) };

    case 'ADD_LAKE_LOG':
      return { ...state, lakeRestorationLogs: [...state.lakeRestorationLogs, action.payload] };
    case 'UPDATE_LAKE_LOG':
      return { ...state, lakeRestorationLogs: state.lakeRestorationLogs.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_LAKE_LOG':
      return { ...state, lakeRestorationLogs: state.lakeRestorationLogs.filter(l => l.id !== action.payload) };

    case 'ADD_CSR_PARTNER':
      return { ...state, csrPartners: [...state.csrPartners, action.payload] };
    case 'UPDATE_CSR_PARTNER':
      return { ...state, csrPartners: state.csrPartners.map(c => c.id === action.payload.id ? action.payload : c) };
    case 'DELETE_CSR_PARTNER':
      return { ...state, csrPartners: state.csrPartners.filter(c => c.id !== action.payload) };

    case 'ADD_CONTACT_LOG':
      return { ...state, contactLogs: [...state.contactLogs, action.payload] };
    case 'UPDATE_CONTACT_LOG':
      return { ...state, contactLogs: state.contactLogs.map(l => l.id === action.payload.id ? action.payload : l) };
    case 'DELETE_CONTACT_LOG':
      return { ...state, contactLogs: state.contactLogs.filter(l => l.id !== action.payload) };

    case 'UPDATE_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };

    case 'LOAD_STATE':
      return action.payload;

    case 'RESET_STATE':
      return seedState;

    default:
      return state;
  }
}

// ── Context ──────────────────────────────────────────────
interface StoreContextType {
  state: AppState;
  isLoading: boolean;
  // Countries
  addCountry: (country: Omit<Country, 'id'>) => void;
  updateCountry: (country: Country) => void;
  deleteCountry: (id: string) => void;
  // States
  addState: (s: Omit<State, 'id'>) => void;
  updateState: (s: State) => void;
  deleteState: (id: string) => void;
  // Cities
  addCity: (city: Omit<City, 'id'>) => void;
  updateCity: (city: City) => void;
  deleteCity: (id: string) => void;
  // Areas
  addArea: (area: Omit<Area, 'id'>) => void;
  updateArea: (area: Area) => void;
  deleteArea: (id: string) => void;
  // Buildings
  addBuilding: (building: Omit<Building, 'id'>) => void;
  updateBuilding: (building: Building) => void;
  deleteBuilding: (id: string) => void;
  // Deals
  addDeal: (deal: Omit<Deal, 'id'>) => void;
  updateDeal: (deal: Deal) => void;
  deleteDeal: (id: string) => void;
  // Audits
  addAudit: (audit: Omit<Audit, 'id'>) => void;
  updateAudit: (audit: Audit) => void;
  deleteAudit: (id: string) => void;
  // Referrals
  addReferral: (referral: Omit<Referral, 'id'>) => void;
  updateReferral: (referral: Referral) => void;
  deleteReferral: (id: string) => void;
  // Manufacturers
  addManufacturer: (m: Omit<Manufacturer, 'id'>) => void;
  updateManufacturer: (m: Manufacturer) => void;
  deleteManufacturer: (id: string) => void;
  // Scripts
  addScript: (s: Omit<Script, 'id'>) => void;
  updateScript: (s: Script) => void;
  deleteScript: (id: string) => void;
  // Reminders
  addReminder: (r: Omit<Reminder, 'id'>) => void;
  updateReminder: (r: Reminder) => void;
  deleteReminder: (id: string) => void;
  // Settings
  updateSettings: (s: Partial<AppSettings>) => void;
  resetState: () => void;
  // RWH
  addRwh: (r: Omit<RwhAssessment, 'id'>) => void;
  updateRwh: (r: RwhAssessment) => void;
  deleteRwh: (id: string) => void;
  // Tree Projects
  addTreeProject: (t: Omit<TreeProject, 'id'>) => void;
  updateTreeProject: (t: TreeProject) => void;
  deleteTreeProject: (id: string) => void;
  // Tree Logs
  addTreeLog: (l: Omit<TreeMonitoringLog, 'id'>) => void;
  updateTreeLog: (l: TreeMonitoringLog) => void;
  deleteTreeLog: (id: string) => void;
  // Water Bodies
  addWaterBody: (w: Omit<WaterBody, 'id'>) => void;
  updateWaterBody: (w: WaterBody) => void;
  deleteWaterBody: (id: string) => void;
  // Lake Logs
  addLakeLog: (l: Omit<LakeRestorationLog, 'id'>) => void;
  updateLakeLog: (l: LakeRestorationLog) => void;
  deleteLakeLog: (id: string) => void;
  // CSR Partners
  addCsrPartner: (c: Omit<CsrPartner, 'id'>) => void;
  updateCsrPartner: (c: CsrPartner) => void;
  deleteCsrPartner: (id: string) => void;
  // Journal
  addJournal: (e: Omit<JournalEntry, 'id'>) => void;
  updateJournal: (e: JournalEntry) => void;
  deleteJournal: (id: string) => void;
  // Contact Logs
  addContactLog: (l: Omit<ContactLog, 'id'>) => void;
  updateContactLog: (l: ContactLog) => void;
  deleteContactLog: (id: string) => void;
}

const StoreContext = createContext<StoreContextType | null>(null);

function genId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isLoading, setIsLoading] = useState(true);

  // Track whether current state change came from Firestore (to avoid re-saving it)
  const fromFirestore = useRef(false);
  // Debounce timer for Firestore saves
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // On mount: load from Firestore (source of truth)
  useEffect(() => {
    loadFromFirestore().then(firestoreState => {
      if (firestoreState) {
        fromFirestore.current = true;
        dispatch({ type: 'LOAD_STATE', payload: firestoreState });
      }
      setIsLoading(false);
    });
  }, []);

  // On state change: save to localStorage immediately, Firestore debounced
  useEffect(() => {
    if (isLoading) return; // don't save while initial load is in progress

    saveToLocalStorage(state);

    if (fromFirestore.current) {
      // This change came from Firestore — don't write back
      fromFirestore.current = false;
      return;
    }

    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      saveToFirestore(state);
    }, 1500); // debounce 1.5s to batch rapid changes
  }, [state, isLoading]);

  const addCountry = useCallback((c: Omit<Country, 'id'>) =>
    dispatch({ type: 'ADD_COUNTRY', payload: { ...c, id: genId() } }), []);
  const updateCountry = useCallback((c: Country) =>
    dispatch({ type: 'UPDATE_COUNTRY', payload: c }), []);
  const deleteCountry = useCallback((id: string) =>
    dispatch({ type: 'DELETE_COUNTRY', payload: id }), []);

  const addState = useCallback((s: Omit<State, 'id'>) =>
    dispatch({ type: 'ADD_STATE', payload: { ...s, id: genId() } }), []);
  const updateState = useCallback((s: State) =>
    dispatch({ type: 'UPDATE_STATE', payload: s }), []);
  const deleteState = useCallback((id: string) =>
    dispatch({ type: 'DELETE_STATE', payload: id }), []);

  const addCity = useCallback((c: Omit<City, 'id'>) =>
    dispatch({ type: 'ADD_CITY', payload: { ...c, id: genId() } }), []);
  const updateCity = useCallback((c: City) =>
    dispatch({ type: 'UPDATE_CITY', payload: c }), []);
  const deleteCity = useCallback((id: string) =>
    dispatch({ type: 'DELETE_CITY', payload: id }), []);

  const addArea = useCallback((a: Omit<Area, 'id'>) =>
    dispatch({ type: 'ADD_AREA', payload: { ...a, id: genId() } }), []);
  const updateArea = useCallback((a: Area) =>
    dispatch({ type: 'UPDATE_AREA', payload: a }), []);
  const deleteArea = useCallback((id: string) =>
    dispatch({ type: 'DELETE_AREA', payload: id }), []);

  const addBuilding = useCallback((b: Omit<Building, 'id'>) =>
    dispatch({ type: 'ADD_BUILDING', payload: { ...b, id: genId() } }), []);
  const updateBuilding = useCallback((b: Building) =>
    dispatch({ type: 'UPDATE_BUILDING', payload: b }), []);
  const deleteBuilding = useCallback((id: string) =>
    dispatch({ type: 'DELETE_BUILDING', payload: id }), []);

  const addDeal = useCallback((d: Omit<Deal, 'id'>) =>
    dispatch({ type: 'ADD_DEAL', payload: { ...d, id: genId() } }), []);
  const updateDeal = useCallback((d: Deal) =>
    dispatch({ type: 'UPDATE_DEAL', payload: d }), []);
  const deleteDeal = useCallback((id: string) =>
    dispatch({ type: 'DELETE_DEAL', payload: id }), []);

  const addAudit = useCallback((a: Omit<Audit, 'id'>) =>
    dispatch({ type: 'ADD_AUDIT', payload: { ...a, id: genId() } }), []);
  const updateAudit = useCallback((a: Audit) =>
    dispatch({ type: 'UPDATE_AUDIT', payload: a }), []);
  const deleteAudit = useCallback((id: string) =>
    dispatch({ type: 'DELETE_AUDIT', payload: id }), []);

  const addReferral = useCallback((r: Omit<Referral, 'id'>) =>
    dispatch({ type: 'ADD_REFERRAL', payload: { ...r, id: genId() } }), []);
  const updateReferral = useCallback((r: Referral) =>
    dispatch({ type: 'UPDATE_REFERRAL', payload: r }), []);
  const deleteReferral = useCallback((id: string) =>
    dispatch({ type: 'DELETE_REFERRAL', payload: id }), []);

  const addManufacturer = useCallback((m: Omit<Manufacturer, 'id'>) =>
    dispatch({ type: 'ADD_MANUFACTURER', payload: { ...m, id: genId() } }), []);
  const updateManufacturer = useCallback((m: Manufacturer) =>
    dispatch({ type: 'UPDATE_MANUFACTURER', payload: m }), []);
  const deleteManufacturer = useCallback((id: string) =>
    dispatch({ type: 'DELETE_MANUFACTURER', payload: id }), []);

  const addScript = useCallback((s: Omit<Script, 'id'>) =>
    dispatch({ type: 'ADD_SCRIPT', payload: { ...s, id: genId() } }), []);
  const updateScript = useCallback((s: Script) =>
    dispatch({ type: 'UPDATE_SCRIPT', payload: s }), []);
  const deleteScript = useCallback((id: string) =>
    dispatch({ type: 'DELETE_SCRIPT', payload: id }), []);

  const addReminder = useCallback((r: Omit<Reminder, 'id'>) =>
    dispatch({ type: 'ADD_REMINDER', payload: { ...r, id: genId() } }), []);
  const updateReminder = useCallback((r: Reminder) =>
    dispatch({ type: 'UPDATE_REMINDER', payload: r }), []);
  const deleteReminder = useCallback((id: string) =>
    dispatch({ type: 'DELETE_REMINDER', payload: id }), []);

  const updateSettings = useCallback((s: Partial<AppSettings>) =>
    dispatch({ type: 'UPDATE_SETTINGS', payload: s }), []);

  const resetState = useCallback(() =>
    dispatch({ type: 'RESET_STATE' }), []);

  const addRwh = useCallback((r: Omit<RwhAssessment, 'id'>) =>
    dispatch({ type: 'ADD_RWH', payload: { ...r, id: genId() } }), []);
  const updateRwh = useCallback((r: RwhAssessment) =>
    dispatch({ type: 'UPDATE_RWH', payload: r }), []);
  const deleteRwh = useCallback((id: string) =>
    dispatch({ type: 'DELETE_RWH', payload: id }), []);

  const addTreeProject = useCallback((t: Omit<TreeProject, 'id'>) =>
    dispatch({ type: 'ADD_TREE_PROJECT', payload: { ...t, id: genId() } }), []);
  const updateTreeProject = useCallback((t: TreeProject) =>
    dispatch({ type: 'UPDATE_TREE_PROJECT', payload: t }), []);
  const deleteTreeProject = useCallback((id: string) =>
    dispatch({ type: 'DELETE_TREE_PROJECT', payload: id }), []);

  const addTreeLog = useCallback((l: Omit<TreeMonitoringLog, 'id'>) =>
    dispatch({ type: 'ADD_TREE_LOG', payload: { ...l, id: genId() } }), []);
  const updateTreeLog = useCallback((l: TreeMonitoringLog) =>
    dispatch({ type: 'UPDATE_TREE_LOG', payload: l }), []);
  const deleteTreeLog = useCallback((id: string) =>
    dispatch({ type: 'DELETE_TREE_LOG', payload: id }), []);

  const addWaterBody = useCallback((w: Omit<WaterBody, 'id'>) =>
    dispatch({ type: 'ADD_WATER_BODY', payload: { ...w, id: genId() } }), []);
  const updateWaterBody = useCallback((w: WaterBody) =>
    dispatch({ type: 'UPDATE_WATER_BODY', payload: w }), []);
  const deleteWaterBody = useCallback((id: string) =>
    dispatch({ type: 'DELETE_WATER_BODY', payload: id }), []);

  const addLakeLog = useCallback((l: Omit<LakeRestorationLog, 'id'>) =>
    dispatch({ type: 'ADD_LAKE_LOG', payload: { ...l, id: genId() } }), []);
  const updateLakeLog = useCallback((l: LakeRestorationLog) =>
    dispatch({ type: 'UPDATE_LAKE_LOG', payload: l }), []);
  const deleteLakeLog = useCallback((id: string) =>
    dispatch({ type: 'DELETE_LAKE_LOG', payload: id }), []);

  const addCsrPartner = useCallback((c: Omit<CsrPartner, 'id'>) =>
    dispatch({ type: 'ADD_CSR_PARTNER', payload: { ...c, id: genId() } }), []);
  const updateCsrPartner = useCallback((c: CsrPartner) =>
    dispatch({ type: 'UPDATE_CSR_PARTNER', payload: c }), []);
  const deleteCsrPartner = useCallback((id: string) =>
    dispatch({ type: 'DELETE_CSR_PARTNER', payload: id }), []);

  const addJournal = useCallback((e: Omit<JournalEntry, 'id'>) =>
    dispatch({ type: 'ADD_JOURNAL', payload: { ...e, id: genId() } }), []);
  const updateJournal = useCallback((e: JournalEntry) =>
    dispatch({ type: 'UPDATE_JOURNAL', payload: e }), []);
  const deleteJournal = useCallback((id: string) =>
    dispatch({ type: 'DELETE_JOURNAL', payload: id }), []);

  const addContactLog = useCallback((l: Omit<ContactLog, 'id'>) =>
    dispatch({ type: 'ADD_CONTACT_LOG', payload: { ...l, id: genId() } }), []);
  const updateContactLog = useCallback((l: ContactLog) =>
    dispatch({ type: 'UPDATE_CONTACT_LOG', payload: l }), []);
  const deleteContactLog = useCallback((id: string) =>
    dispatch({ type: 'DELETE_CONTACT_LOG', payload: id }), []);

  return React.createElement(
    StoreContext.Provider,
    {
      value: {
        state,
        isLoading,
        addCountry, updateCountry, deleteCountry,
        addState, updateState, deleteState,
        addCity, updateCity, deleteCity,
        addArea, updateArea, deleteArea,
        addBuilding, updateBuilding, deleteBuilding,
        addDeal, updateDeal, deleteDeal,
        addAudit, updateAudit, deleteAudit,
        addReferral, updateReferral, deleteReferral,
        addManufacturer, updateManufacturer, deleteManufacturer,
        addScript, updateScript, deleteScript,
        addReminder, updateReminder, deleteReminder,
        updateSettings,
        resetState,
        addRwh, updateRwh, deleteRwh,
        addTreeProject, updateTreeProject, deleteTreeProject,
        addTreeLog, updateTreeLog, deleteTreeLog,
        addWaterBody, updateWaterBody, deleteWaterBody,
        addLakeLog, updateLakeLog, deleteLakeLog,
        addCsrPartner, updateCsrPartner, deleteCsrPartner,
        addJournal, updateJournal, deleteJournal,
        addContactLog, updateContactLog, deleteContactLog,
      }
    },
    children
  );
}

export function useStore(): StoreContextType {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
