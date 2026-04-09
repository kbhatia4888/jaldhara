import React, { useState, useMemo, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { LabelWithTooltip } from '../components/ui/Tooltip';
import type { Building, Audit } from '../types';
import { ClipboardList, Plus, ChevronRight, ChevronLeft, Eye, Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';

const fmtINR = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtLakh = (n: number) => {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const STEP_LABELS = [
  'Building', 'Basic Info', 'Water Supply', 'Occupancy',
  'Waste Audit', 'Greywater', 'Financials', 'Recommendations', 'Review',
];

const WASTE_ITEMS = [
  { id: 'oht_overflow', label: 'OHT overflow', tooltip: 'OHT', tip: 'Common at night in Delhi. An overflow sensor (₹6,000–10,000) stops this instantly.' },
  { id: 'leaking_taps', label: 'Leaking taps, pipes, or joints', tip: 'A dripping tap wastes 15–30 litres per day. A running cistern wastes 200+ litres per day.' },
  { id: 'flood_irrigation', label: 'Flood irrigation for garden', tip: 'Flood irrigation wastes 60–80% of water used. Drip irrigation saves most of it.' },
  { id: 'stp_unused', label: 'STP present but not operational', tooltip: 'STP', tip: 'A working STP can provide 50–200 KLD of treated water for flushing and gardening.' },
  { id: 'no_meter', label: 'No water meter', tip: 'Without a meter, you cannot know how much water is being used — or wasted.' },
  { id: 'cistern_overfill', label: 'Toilet cisterns overfilling', tip: 'Older cisterns lack a functioning ballcock and constantly overflow into the bowl.' },
  { id: 'ro_reject', label: 'RO reject water going to drain', tip: 'RO systems waste 50–70% of input water as reject water. This can be redirected to toilet flushing at low cost.' },
  { id: 'cooling_tower', label: 'Cooling tower blowdown not recycled', tip: 'Hotels and hospitals with cooling towers discharge blowdown water that can be partially recycled.' },
  { id: 'kitchen_not_separated', label: 'Kitchen water not separated from sewage', tip: 'Kitchen greywater mixed with sewage cannot be easily recycled. Separating at source is cheap and enables recycling.' },
  { id: 'car_wash_pipe', label: 'Car washing with pipe (not bucket)', tip: 'Hosepipe car washing uses 150–200 litres. Bucket washing uses 15–20 litres.' },
  { id: 'staff_no_meter', label: 'Staff quarters without metered supply', tip: 'Unmetered supply to staff quarters is almost universally over-used.' },
];

interface WasteItem { id: string; found: boolean; dailyLitres: number; description: string; }
type WasteMap = Record<string, WasteItem>;

const GREY_RATES: Partial<Record<Building['type'], number>> = {
  'Private Hospital': 150, 'Hospital': 150,
  'Private School': 45, 'School': 45,
  'Coaching Hostel': 80, 'Hostel': 80,
  'Hotel': 200, 'Hotel/Guest House': 200,
  'Banquet Hall': 30,
  'Housing Society': 90, 'Apartment': 90,
  'Industrial Unit': 50,
  'Commercial': 40, 'Corporate Office': 40,
};

function calcCapexRange(kld: number): [number, number] {
  if (kld <= 5) return [80000, 150000];
  if (kld <= 20) return [150000, 500000];
  if (kld <= 50) return [400000, 1000000];
  return [900000, 2200000];
}

export default function Audits() {
  const { state, addAudit, deleteAudit } = useStore();
  const { audits, buildings, areas, cities } = state;

  const [showForm, setShowForm] = useState(false);
  const [viewAudit, setViewAudit] = useState<Audit | null>(null);
  const [step, setStep] = useState(0);

  const [buildingSearch, setBuildingSearch] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const [s1, setS1] = useState({
    auditDate: new Date().toISOString().split('T')[0],
    auditorName: state.settings.consultantName || '',
    contactPresentName: '', contactPresentDesignation: '',
    djbBillShown: 'No' as 'Yes' | 'No' | 'Partially',
    walkedPremises: 'Yes' as 'Yes' | 'No',
    siteVisitNotes: '',
  });

  const [s2, setS2] = useState({
    hasMunicipal: true, connSize: 'three-quarter inch', municipalHrs: 6,
    municipalLpd: 0, municipalAdequacy: 'Rarely',
    hasOHT: true, ohtCapacity: 10000, ohtOverflows: 'Yes, regularly',
    ohtSensor: false, ohtOverflowTime: 'Night',
    hasBorewell: false, borewellDepth: 0, borewellQuality: 'Good', borewellLpd: 0,
    usesTankers: true, tankerCount: 0, tankerCapacity: 6000,
    tankerCost: 2000, tankerSufficient: 'Sometimes not', djbBill: 0, totalDailyConsumption: 0,
  });

  const tankerMonthlySpend = s2.tankerCount * s2.tankerCost;
  const tankerMonthlyLitres = s2.tankerCount * s2.tankerCapacity;
  const totalMonthlyWaterSpend = (s2.djbBill || 0) + tankerMonthlySpend;

  const [s3, setS3] = useState({
    beds: 0, bedOccupancyPct: 80, opdPerDay: 0,
    residentialStaff: false, residentialCount: 0, hasKitchen: true, hasLaundry: false,
    students: 0, schoolStaff: 0, hasHostel: false, hostelCapacity: 0, hasPool: false,
    halls: 1, largestHallCapacity: 200, eventsPerMonth: 8,
    residents: 0, bathroomType: 'Common', toiletsPerFloor: 4,
    rooms: 0, hotelOccupancyPct: 70, hasRestaurant: false,
    flats: 0, residentsPerFlat: 3.5, societyCommon: 'None', hasSTP: false, stpFunctional: false,
    industryType: '', employees: 0, processWater: false, coolingTowers: false,
  });

  const effectiveOccupancy = useMemo(() => {
    if (!selectedBuilding) return 0;
    const t = selectedBuilding.type;
    if (t === 'Private Hospital' || t === 'Hospital')
      return Math.round((s3.beds * s3.bedOccupancyPct) / 100) + Math.round(s3.opdPerDay * 0.5) + (s3.residentialStaff ? s3.residentialCount : 0);
    if (t === 'Private School' || t === 'School')
      return s3.students + s3.schoolStaff + (s3.hasHostel ? s3.hostelCapacity : 0);
    if (t === 'Coaching Hostel' || t === 'Hostel') return s3.residents;
    if (t === 'Hotel' || t === 'Hotel/Guest House')
      return Math.round(s3.rooms * s3.hotelOccupancyPct / 100) * 2;
    if (t === 'Housing Society' || t === 'Apartment')
      return Math.round(s3.flats * s3.residentsPerFlat);
    if (t === 'Industrial Unit') return s3.employees;
    if (t === 'Banquet Hall')
      return Math.round(s3.eventsPerMonth * s3.largestHallCapacity * 0.5);
    return selectedBuilding.occupancyCount || 50;
  }, [selectedBuilding, s3]);

  const [wasteMap, setWasteMap] = useState<WasteMap>(() =>
    Object.fromEntries(WASTE_ITEMS.map(w => [w.id, { id: w.id, found: false, dailyLitres: 0, description: '' }]))
  );

  const totalWasteLpd = Object.values(wasteMap).filter(w => w.found).reduce((s, w) => s + w.dailyLitres, 0);
  const totalWasteMonthlyCost = Math.round(totalWasteLpd * 30 * 0.015);

  const greyRate = selectedBuilding ? (GREY_RATES[selectedBuilding.type] || 80) : 80;
  const greywaterPotentialLpd = Math.round(effectiveOccupancy * greyRate);
  const recoverableLpd = Math.round(greywaterPotentialLpd * 0.75);
  const waterCostPerL = 0.015;
  const monthlyValueINR = Math.round(recoverableLpd * 30 * waterCostPerL);

  const [s6BuildingAreaSqM, setS6BuildingAreaSqM] = useState(500);
  const djbRebateEligible = s6BuildingAreaSqM >= 500;
  const djbRebateAnnual = djbRebateEligible ? Math.round(s2.djbBill * 12 * 0.10) : 0;
  const recommendedKLD = Math.max(1, Math.round(recoverableLpd / 1000));
  const capexRange = useMemo(() => calcCapexRange(recommendedKLD), [recommendedKLD]);
  const capexMid = Math.round((capexRange[0] + capexRange[1]) / 2);
  const annualOpex = Math.round(recommendedKLD * 800);
  const annualAMC = Math.round(recommendedKLD * 3000);
  const annualWaterSaving = Math.round(totalMonthlyWaterSpend * 12 * 0.35);
  const totalAnnualBenefit = annualWaterSaving + djbRebateAnnual;
  const paybackMonths = totalAnnualBenefit > 0 ? Math.round((capexMid / totalAnnualBenefit) * 12) : 0;
  const fiveYearNet = totalAnnualBenefit * 5 - capexMid;
  const tenYearNet = totalAnnualBenefit * 10 - capexMid;

  const autoRecs = useMemo(() => {
    const recs: { rank: number; title: string; description: string; costMin: number; costMax: number; monthlySaving: number; urgency: 'Quick win' | 'Medium' | 'Long term' }[] = [];
    let rank = 1;
    if (wasteMap['oht_overflow']?.found) {
      recs.push({ rank: rank++, title: 'Install OHT overflow sensor', description: `Saves ${wasteMap['oht_overflow'].dailyLitres} L/day immediately. Payback: 1–2 months.`, costMin: 6000, costMax: 10000, monthlySaving: Math.round((wasteMap['oht_overflow'].dailyLitres || 500) * 30 * waterCostPerL), urgency: 'Quick win' });
    }
    if (wasteMap['ro_reject']?.found) {
      recs.push({ rank: rank++, title: 'Redirect RO reject water to toilet flushing', description: 'Saves 50–70% of RO water. Low-cost plumbing change.', costMin: 5000, costMax: 15000, monthlySaving: Math.round((wasteMap['ro_reject'].dailyLitres || 1500) * 30 * waterCostPerL), urgency: 'Quick win' });
    }
    if (wasteMap['stp_unused']?.found) {
      recs.push({ rank: rank++, title: 'Recommission existing STP', description: 'Provides treated water for garden and flushing. Avoids new installation cost.', costMin: 30000, costMax: 80000, monthlySaving: Math.round(recommendedKLD * 0.5 * 1000 * 30 * waterCostPerL), urgency: 'Medium' });
    }
    if (greywaterPotentialLpd >= 5000) {
      recs.push({ rank: rank++, title: `Install ${recommendedKLD} KLD greywater recycling system`, description: `Annual saving: ${fmtLakh(annualWaterSaving)}. Payback: ${paybackMonths} months. DJB rebate: ${fmtINR(djbRebateAnnual)}/yr.`, costMin: capexRange[0], costMax: capexRange[1], monthlySaving: Math.round(totalAnnualBenefit / 12), urgency: 'Long term' });
    }
    if (wasteMap['flood_irrigation']?.found) {
      recs.push({ rank: rank++, title: 'Replace flood irrigation with drip system', description: 'Saves 60% of gardening water.', costMin: 10000, costMax: 30000, monthlySaving: Math.round((wasteMap['flood_irrigation'].dailyLitres || 500) * 30 * waterCostPerL), urgency: 'Medium' });
    }
    return recs.slice(0, 5);
  }, [wasteMap, greywaterPotentialLpd, recommendedKLD, annualWaterSaving, djbRebateAnnual, paybackMonths, capexRange, totalAnnualBenefit]);

  const [customRecs] = useState<typeof autoRecs>([]);
  const allRecs = useMemo(() => [...autoRecs, ...customRecs], [autoRecs, customRecs]);

  const resetForm = useCallback(() => {
    setStep(0); setSelectedBuilding(null); setBuildingSearch('');
    setS1({ auditDate: new Date().toISOString().split('T')[0], auditorName: state.settings.consultantName || '', contactPresentName: '', contactPresentDesignation: '', djbBillShown: 'No', walkedPremises: 'Yes', siteVisitNotes: '' });
    setS2({ hasMunicipal: true, connSize: 'three-quarter inch', municipalHrs: 6, municipalLpd: 0, municipalAdequacy: 'Rarely', hasOHT: true, ohtCapacity: 10000, ohtOverflows: 'Yes, regularly', ohtSensor: false, ohtOverflowTime: 'Night', hasBorewell: false, borewellDepth: 0, borewellQuality: 'Good', borewellLpd: 0, usesTankers: true, tankerCount: 0, tankerCapacity: 6000, tankerCost: 2000, tankerSufficient: 'Sometimes not', djbBill: 0, totalDailyConsumption: 0 });
    setS3({ beds: 0, bedOccupancyPct: 80, opdPerDay: 0, residentialStaff: false, residentialCount: 0, hasKitchen: true, hasLaundry: false, students: 0, schoolStaff: 0, hasHostel: false, hostelCapacity: 0, hasPool: false, halls: 1, largestHallCapacity: 200, eventsPerMonth: 8, residents: 0, bathroomType: 'Common', toiletsPerFloor: 4, rooms: 0, hotelOccupancyPct: 70, hasRestaurant: false, flats: 0, residentsPerFlat: 3.5, societyCommon: 'None', hasSTP: false, stpFunctional: false, industryType: '', employees: 0, processWater: false, coolingTowers: false });
    setWasteMap(Object.fromEntries(WASTE_ITEMS.map(w => [w.id, { id: w.id, found: false, dailyLitres: 0, description: '' }])));
    setS6BuildingAreaSqM(500);
  }, [state.settings.consultantName]);

  function saveAudit() {
    if (!selectedBuilding) return;
    const foundWaste = Object.values(wasteMap).filter(w => w.found).map(w => WASTE_ITEMS.find(i => i.id === w.id)?.label || w.id);
    addAudit({
      buildingId: selectedBuilding.id,
      date: s1.auditDate,
      currentWaterBill: s2.djbBill,
      tankerSpend: tankerMonthlySpend,
      borewellDepth: s2.borewellDepth,
      tdsLevel: 0,
      recommendedSystem: allRecs.length > 0 ? allRecs[0].title : '',
      potentialSavings: totalAnnualBenefit,
      notes: s1.siteVisitNotes,
      conductedBy: s1.auditorName,
      dailyConsumptionLitres: s2.totalDailyConsumption || Math.round(greywaterPotentialLpd / 0.38),
      occupancyCount: effectiveOccupancy,
      greywaterPotentialLpd,
      capexEstimate: capexMid,
      paybackMonths,
      djbRebateAnnual,
      wasteChecklist: foundWaste,
      priorityActions: allRecs.map(r => ({
        description: `${r.title}: ${r.description}`,
        estimatedCost: Math.round((r.costMin + r.costMax) / 2),
        monthlySaving: r.monthlySaving,
        urgency: r.urgency,
      })),
    });
    setShowForm(false);
    resetForm();
  }

  const matchingBuildings = useMemo(() => {
    const q = buildingSearch.toLowerCase();
    if (!q) return buildings.slice(0, 8);
    return buildings.filter(b =>
      b.name.toLowerCase().includes(q) ||
      (areas.find(a => a.id === b.areaId)?.name.toLowerCase().includes(q) ?? false)
    ).slice(0, 8);
  }, [buildings, areas, buildingSearch]);

  const canProceed = step === 0 ? !!selectedBuilding : step === 1 ? !!s1.auditDate && !!s1.auditorName : true;

  // ── STEP CONTENT ────────────────────────────────────

  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">Search for an existing building or start typing to find it.</p>
            <Input label="Search building" value={buildingSearch} onChange={e => setBuildingSearch(e.target.value)} placeholder="Type building name or area…" />
            {selectedBuilding ? (
              <div className="p-4 rounded-xl border-2 border-[#0F6E56] bg-[#0F6E56]/5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{selectedBuilding.name}</p>
                    <p className="text-sm text-gray-500 mt-0.5">{selectedBuilding.type} · {areas.find(a => a.id === selectedBuilding.areaId)?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Contact: {selectedBuilding.contactName} · {selectedBuilding.contactDesignation}</p>
                    {selectedBuilding.monthlyWaterSpend && (
                      <p className="text-xs text-amber-700 mt-1 font-medium">Known monthly water spend: {fmtINR(selectedBuilding.monthlyWaterSpend)}</p>
                    )}
                  </div>
                  <button onClick={() => setSelectedBuilding(null)} className="text-gray-400 hover:text-red-500 text-xs mt-1 transition-colors">Change</button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-50 rounded-xl border border-gray-100 overflow-hidden">
                {matchingBuildings.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-6">No buildings found. Add one in CRM first.</p>
                )}
                {matchingBuildings.map(b => (
                  <button key={b.id} onClick={() => { setSelectedBuilding(b); setS3(s => ({ ...s, beds: b.occupancyCount || 0 })); }}
                    className="w-full text-left px-4 py-3 hover:bg-[#0F6E56]/5 transition-colors">
                    <p className="text-sm font-medium text-gray-900">{b.name}</p>
                    <p className="text-xs text-gray-400">{b.type} · {areas.find(a => a.id === b.areaId)?.name || '—'}</p>
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 1:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input label="Audit Date" type="date" value={s1.auditDate} onChange={e => setS1(s => ({ ...s, auditDate: e.target.value }))} />
              <Input label="Auditor Name" value={s1.auditorName} onChange={e => setS1(s => ({ ...s, auditorName: e.target.value }))} placeholder="Your name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Contact present — Name" value={s1.contactPresentName} onChange={e => setS1(s => ({ ...s, contactPresentName: e.target.value }))} placeholder="e.g. Rajesh Sharma" />
              <Input label="Designation" value={s1.contactPresentDesignation} onChange={e => setS1(s => ({ ...s, contactPresentDesignation: e.target.value }))} placeholder="e.g. Facilities Manager" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1"><LabelWithTooltip label="DJB bill shown?" term="DJB" /></label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20" value={s1.djbBillShown} onChange={e => setS1(s => ({ ...s, djbBillShown: e.target.value as typeof s1.djbBillShown }))}>
                  <option>Yes</option><option>No</option><option>Partially</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Walked the premises?</label>
                <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20" value={s1.walkedPremises} onChange={e => setS1(s => ({ ...s, walkedPremises: e.target.value as typeof s1.walkedPremises }))}>
                  <option>Yes</option><option>No</option>
                </select>
              </div>
            </div>
            <TextArea label="Site visit notes" value={s1.siteVisitNotes} onChange={e => setS1(s => ({ ...s, siteVisitNotes: e.target.value }))} placeholder="What did you observe while walking the building?" rows={3} />
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            {/* Municipal */}
            <div className="p-4 rounded-xl border border-gray-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={s2.hasMunicipal} onChange={e => setS2(s => ({ ...s, hasMunicipal: e.target.checked }))} className="w-4 h-4 accent-[#0F6E56]" />
                <span className="font-medium text-gray-900"><LabelWithTooltip label="DJB / Municipal connection" term="Municipal supply" /></span>
              </label>
              {s2.hasMunicipal && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Avg hours of supply per day</label>
                    <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.municipalHrs} onChange={e => setS2(s => ({ ...s, municipalHrs: +e.target.value }))} min={0} max={24} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Is supply adequate?</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.municipalAdequacy} onChange={e => setS2(s => ({ ...s, municipalAdequacy: e.target.value }))}>
                      {['Never', 'Rarely', 'Sometimes', 'Usually', 'Always'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1"><LabelWithTooltip label="DJB monthly bill (₹)" term="DJB" /></label>
                    <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.djbBill || ''} onChange={e => setS2(s => ({ ...s, djbBill: +e.target.value }))} placeholder="e.g. 12000" />
                  </div>
                </div>
              )}
            </div>
            {/* OHT */}
            <div className="p-4 rounded-xl border border-gray-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={s2.hasOHT} onChange={e => setS2(s => ({ ...s, hasOHT: e.target.checked }))} className="w-4 h-4 accent-[#0F6E56]" />
                <span className="font-medium text-gray-900"><LabelWithTooltip label="Overhead Tank (OHT)" term="OHT" /></span>
              </label>
              {s2.hasOHT && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tank capacity (litres)</label>
                    <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.ohtCapacity} onChange={e => setS2(s => ({ ...s, ohtCapacity: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Does it overflow?</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.ohtOverflows} onChange={e => setS2(s => ({ ...s, ohtOverflows: e.target.value }))}>
                      {['Yes, regularly', 'Occasionally', 'Never', 'Unknown'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer col-span-2">
                    <input type="checkbox" checked={s2.ohtSensor} onChange={e => setS2(s => ({ ...s, ohtSensor: e.target.checked }))} className="w-4 h-4 accent-[#0F6E56]" />
                    <span className="text-xs text-gray-700">Has overflow sensor</span>
                  </label>
                </div>
              )}
            </div>
            {/* Borewell */}
            <div className="p-4 rounded-xl border border-gray-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={s2.hasBorewell} onChange={e => setS2(s => ({ ...s, hasBorewell: e.target.checked }))} className="w-4 h-4 accent-[#0F6E56]" />
                <span className="font-medium text-gray-900">Borewell / Tubewell</span>
              </label>
              {s2.hasBorewell && (
                <div className="grid grid-cols-2 gap-3 ml-6">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Depth (feet)</label>
                    <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.borewellDepth} onChange={e => setS2(s => ({ ...s, borewellDepth: +e.target.value }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Water quality</label>
                    <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.borewellQuality} onChange={e => setS2(s => ({ ...s, borewellQuality: e.target.value }))}>
                      {['Good', 'Needs treatment', 'Not suitable for use'].map(o => <option key={o}>{o}</option>)}
                    </select>
                  </div>
                </div>
              )}
            </div>
            {/* Tankers */}
            <div className="p-4 rounded-xl border border-gray-100 space-y-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={s2.usesTankers} onChange={e => setS2(s => ({ ...s, usesTankers: e.target.checked }))} className="w-4 h-4 accent-[#0F6E56]" />
                <span className="font-medium text-gray-900"><LabelWithTooltip label="Water tankers" term="Tanker dependency" /></span>
              </label>
              {s2.usesTankers && (
                <div className="space-y-3 ml-6">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Tankers per month</label>
                      <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.tankerCount || ''} onChange={e => setS2(s => ({ ...s, tankerCount: +e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Capacity per tanker</label>
                      <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.tankerCapacity} onChange={e => setS2(s => ({ ...s, tankerCapacity: +e.target.value }))}>
                        <option value={5000}>5,000 L</option>
                        <option value={6000}>6,000 L</option>
                        <option value={8000}>8,000 L</option>
                        <option value={10000}>10,000 L</option>
                        <option value={12000}>12,000 L</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">Cost per tanker (₹)</label>
                      <input type="number" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s2.tankerCost || ''} onChange={e => setS2(s => ({ ...s, tankerCost: +e.target.value }))} />
                    </div>
                  </div>
                  {tankerMonthlySpend > 0 && (
                    <div className="bg-amber-50 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                      <div><strong>Monthly tanker spend:</strong> {fmtINR(tankerMonthlySpend)}</div>
                      <div><strong>Monthly tanker volume:</strong> {(tankerMonthlyLitres / 1000).toFixed(0)} KL</div>
                      <div className="text-sm font-semibold text-amber-900 border-t border-amber-200 pt-1 mt-1">Total monthly water cost: {fmtINR(totalMonthlyWaterSpend)}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );

      case 3: {
        const t = selectedBuilding?.type || '';
        const isHospital = t.includes('Hospital');
        const isSchool = t.includes('School');
        const isBanquet = t.includes('Banquet');
        const isHostel = t.includes('Hostel');
        const isHotel = t.includes('Hotel');
        const isSociety = t.includes('Society') || t.includes('Apartment');
        const isIndustrial = t.includes('Industrial');
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 rounded-xl p-3 text-sm text-blue-800">
              Building type: <strong>{t || 'Not set'}</strong>
            </div>
            {isHospital && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Number of beds" type="number" value={s3.beds.toString()} onChange={e => setS3(s => ({ ...s, beds: +e.target.value }))} />
                <Input label="Bed occupancy %" type="number" value={s3.bedOccupancyPct.toString()} onChange={e => setS3(s => ({ ...s, bedOccupancyPct: +e.target.value }))} />
                <Input label="OPD patients per day" type="number" value={s3.opdPerDay.toString()} onChange={e => setS3(s => ({ ...s, opdPerDay: +e.target.value }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Laundry on-site?</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s3.hasLaundry ? 'Yes' : 'No'} onChange={e => setS3(s => ({ ...s, hasLaundry: e.target.value === 'Yes' }))}>
                    <option>Yes</option><option>No</option>
                  </select>
                </div>
              </div>
            )}
            {isSchool && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Number of students" type="number" value={s3.students.toString()} onChange={e => setS3(s => ({ ...s, students: +e.target.value }))} />
                <Input label="Staff count" type="number" value={s3.schoolStaff.toString()} onChange={e => setS3(s => ({ ...s, schoolStaff: +e.target.value }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Residential hostel?</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s3.hasHostel ? 'Yes' : 'No'} onChange={e => setS3(s => ({ ...s, hasHostel: e.target.value === 'Yes' }))}>
                    <option>Yes</option><option>No</option>
                  </select>
                </div>
                {s3.hasHostel && <Input label="Hostel capacity" type="number" value={s3.hostelCapacity.toString()} onChange={e => setS3(s => ({ ...s, hostelCapacity: +e.target.value }))} />}
              </div>
            )}
            {isBanquet && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Number of halls" type="number" value={s3.halls.toString()} onChange={e => setS3(s => ({ ...s, halls: +e.target.value }))} />
                <Input label="Capacity of largest hall (persons)" type="number" value={s3.largestHallCapacity.toString()} onChange={e => setS3(s => ({ ...s, largestHallCapacity: +e.target.value }))} />
                <Input label="Events per month (avg)" type="number" value={s3.eventsPerMonth.toString()} onChange={e => setS3(s => ({ ...s, eventsPerMonth: +e.target.value }))} />
              </div>
            )}
            {isHostel && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Number of residents" type="number" value={s3.residents.toString()} onChange={e => setS3(s => ({ ...s, residents: +e.target.value }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bathroom type</label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s3.bathroomType} onChange={e => setS3(s => ({ ...s, bathroomType: e.target.value }))}>
                    <option>Common</option><option>Attached</option><option>Mix</option>
                  </select>
                </div>
              </div>
            )}
            {isHotel && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Number of rooms" type="number" value={s3.rooms.toString()} onChange={e => setS3(s => ({ ...s, rooms: +e.target.value }))} />
                <Input label="Average occupancy %" type="number" value={s3.hotelOccupancyPct.toString()} onChange={e => setS3(s => ({ ...s, hotelOccupancyPct: +e.target.value }))} />
              </div>
            )}
            {isSociety && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Number of flats" type="number" value={s3.flats.toString()} onChange={e => setS3(s => ({ ...s, flats: +e.target.value }))} />
                <Input label="Avg residents per flat" type="number" value={s3.residentsPerFlat.toString()} onChange={e => setS3(s => ({ ...s, residentsPerFlat: +e.target.value }))} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1"><LabelWithTooltip label="Existing STP?" term="STP" /></label>
                  <select className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" value={s3.hasSTP ? 'Yes' : 'No'} onChange={e => setS3(s => ({ ...s, hasSTP: e.target.value === 'Yes' }))}>
                    <option>Yes</option><option>No</option>
                  </select>
                </div>
              </div>
            )}
            {isIndustrial && (
              <div className="grid grid-cols-2 gap-4">
                <Input label="Industry type" value={s3.industryType} onChange={e => setS3(s => ({ ...s, industryType: e.target.value }))} placeholder="e.g. Textile, Food processing" />
                <Input label="Number of employees" type="number" value={s3.employees.toString()} onChange={e => setS3(s => ({ ...s, employees: +e.target.value }))} />
              </div>
            )}
            {!isHospital && !isSchool && !isBanquet && !isHostel && !isHotel && !isSociety && !isIndustrial && (
              <Input label="Estimated occupancy count" type="number" value={s3.beds.toString()} onChange={e => setS3(s => ({ ...s, beds: +e.target.value }))} placeholder="Number of regular occupants" />
            )}
            <div className="bg-teal-50 rounded-xl p-3 text-xs text-teal-800">
              <strong>Effective occupancy calculated:</strong> {effectiveOccupancy} persons
            </div>
          </div>
        );
      }

      case 4:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Check every waste item you found during the site visit. Estimate daily litres lost for each.</p>
            {WASTE_ITEMS.map(item => {
              const w = wasteMap[item.id];
              return (
                <div key={item.id} className={`p-3 rounded-xl border transition-all ${w.found ? 'border-red-200 bg-red-50' : 'border-gray-100 bg-white'}`}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input type="checkbox" checked={w.found} onChange={e => setWasteMap(m => ({ ...m, [item.id]: { ...m[item.id], found: e.target.checked } }))} className="w-4 h-4 mt-0.5 accent-red-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-gray-900">
                        {item.tooltip ? <LabelWithTooltip label={item.label} term={item.tooltip} /> : item.label}
                      </span>
                      {!w.found && <p className="text-xs text-gray-400 mt-0.5">{item.tip}</p>}
                    </div>
                  </label>
                  {w.found && (
                    <div className="mt-2 ml-7 grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Daily litres lost (estimate)</label>
                        <input type="number" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" value={w.dailyLitres || ''} onChange={e => setWasteMap(m => ({ ...m, [item.id]: { ...m[item.id], dailyLitres: +e.target.value } }))} placeholder="e.g. 500" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Description (optional)</label>
                        <input type="text" className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm" value={w.description} onChange={e => setWasteMap(m => ({ ...m, [item.id]: { ...m[item.id], description: e.target.value } }))} placeholder="Where / how observed" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {totalWasteLpd > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm">
                <strong className="text-red-800">Total waste identified:</strong>
                <span className="text-red-700 ml-2">{totalWasteLpd.toLocaleString('en-IN')} litres/day</span>
                <span className="text-red-600 ml-3 font-semibold">{fmtINR(totalWasteMonthlyCost)}/month</span>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-teal-900"><LabelWithTooltip label="Greywater calculation" term="Greywater recycling" /></p>
              <p className="text-teal-800">Based on <strong>{effectiveOccupancy} persons</strong> at <strong>{greyRate} L/person/day</strong> = <strong>{greywaterPotentialLpd.toLocaleString('en-IN')} litres of <LabelWithTooltip label="greywater" term="Greywater" /> generated daily.</strong></p>
              <p className="text-teal-700">Of this, <strong>75% is recoverable</strong> = <strong>{recoverableLpd.toLocaleString('en-IN')} L/day ({(recoverableLpd / 1000).toFixed(1)} <LabelWithTooltip label="KLD" term="KLD" />).</strong></p>
              <p className="text-teal-700">At current water costs, this recovered water is worth <strong>{fmtINR(monthlyValueINR)}/month.</strong></p>
            </div>
            <div className="bg-white border border-gray-100 rounded-xl p-4">
              <p className="text-sm font-semibold text-gray-700 mb-3">Sources → Treatment → Reuse</p>
              <div className="flex flex-wrap gap-2 items-start text-xs">
                <div className="bg-blue-50 rounded-lg p-2 text-blue-800 space-y-0.5"><p className="font-semibold">Sources</p><p>• Bathroom sinks & showers</p><p>• Washing machines</p><p>• Handwash basins</p></div>
                <ChevronRight size={14} className="text-gray-300 mt-3" />
                <div className="bg-gray-50 rounded-lg p-2 text-gray-700 space-y-0.5"><p className="font-semibold">Treatment</p><p>• <LabelWithTooltip label="UF Membrane" term="UF Membrane" /></p><p>• <LabelWithTooltip label="UV Disinfection" term="UV Disinfection" /></p></div>
                <ChevronRight size={14} className="text-gray-300 mt-3" />
                <div className="bg-green-50 rounded-lg p-2 text-green-800 space-y-0.5"><p className="font-semibold">Reuse</p><p>• Toilet flushing (30–40%)</p><p>• Garden irrigation</p><p>• Floor cleaning</p></div>
              </div>
            </div>
          </div>
        );

      case 6:
        return (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Section A — Current Situation</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600"><LabelWithTooltip label="Monthly DJB bill" term="DJB" /></span><span className="font-semibold text-right">{fmtINR(s2.djbBill)}</span>
                <span className="text-gray-600">Monthly tanker spend</span><span className="font-semibold text-right">{fmtINR(tankerMonthlySpend)}</span>
                <span className="font-semibold text-gray-900 border-t pt-2">Total monthly</span><span className="font-bold text-amber-700 border-t pt-2 text-right">{fmtINR(totalMonthlyWaterSpend)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-teal-50 border border-teal-200">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2"><LabelWithTooltip label="Section B — DJB Rebate" term="DJB Rebate" /></p>
              <div className="mb-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Building area (sq metres)</label>
                <input type="number" className="w-32 border border-gray-200 rounded-xl px-3 py-1.5 text-sm" value={s6BuildingAreaSqM} onChange={e => setS6BuildingAreaSqM(+e.target.value)} />
              </div>
              {djbRebateEligible
                ? <><p className="text-sm text-teal-800 font-medium">✓ Eligible for 10% DJB rebate</p><p className="text-lg font-bold text-teal-900 mt-1">Annual rebate: {fmtINR(djbRebateAnnual)}</p><p className="text-xs text-teal-700 mt-1">Applied automatically when DJB certifies the system — no separate approval needed.</p></>
                : <p className="text-sm text-orange-700">Building area below 500 sq m — may not qualify. Confirm with DJB.</p>
              }
            </div>
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
              <p className="text-xs font-bold text-blue-700 uppercase tracking-wide mb-2">Section C — Recommended System</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-600">Recommended size</span><span className="font-semibold text-right"><LabelWithTooltip label={`${recommendedKLD} KLD`} term="KLD" /></span>
                <span className="text-gray-600"><LabelWithTooltip label="Capex range" term="Capex" /></span><span className="font-semibold text-right">{fmtINR(capexRange[0])} – {fmtINR(capexRange[1])}</span>
                <span className="text-gray-600"><LabelWithTooltip label="Annual AMC" term="AMC" /></span><span className="font-semibold text-right">{fmtINR(annualAMC)}</span>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-green-50 border border-green-200">
              <p className="text-xs font-bold text-green-700 uppercase tracking-wide mb-2">Section D — Returns</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-gray-700">Annual water saving (35%)</span><span className="font-semibold text-green-800 text-right">{fmtINR(annualWaterSaving)}</span>
                <span className="text-gray-700">DJB rebate/year</span><span className="font-semibold text-green-800 text-right">{fmtINR(djbRebateAnnual)}</span>
                <span className="font-bold text-green-900 border-t border-green-200 pt-2">Total annual benefit</span><span className="font-bold text-green-900 border-t border-green-200 pt-2 text-right">{fmtINR(totalAnnualBenefit)}</span>
                <span className="text-gray-700"><LabelWithTooltip label="Payback period" term="Payback period" /></span><span className="font-semibold text-right">{paybackMonths > 0 ? `${paybackMonths} months` : '—'}</span>
                <span className="text-gray-700">5-year net benefit</span><span className={`font-semibold text-right ${fiveYearNet >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmtINR(fiveYearNet)}</span>
                <span className="text-gray-700">10-year net benefit</span><span className={`font-semibold text-right ${tenYearNet >= 0 ? 'text-green-700' : 'text-red-600'}`}>{fmtINR(tenYearNet)}</span>
              </div>
            </div>
          </div>
        );

      case 7:
        return (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">Auto-suggested based on your audit findings.</p>
            {allRecs.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-6">No recommendations yet. Go back and fill the waste checklist or enter occupancy data.</p>
            )}
            {allRecs.map((rec, i) => (
              <div key={i} className={`p-4 rounded-xl border ${rec.urgency === 'Quick win' ? 'border-green-200 bg-green-50' : rec.urgency === 'Medium' ? 'border-amber-200 bg-amber-50' : 'border-blue-100 bg-blue-50'}`}>
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 flex-shrink-0">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-gray-900 text-sm">{rec.title}</p>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${rec.urgency === 'Quick win' ? 'bg-green-200 text-green-800' : rec.urgency === 'Medium' ? 'bg-amber-200 text-amber-800' : 'bg-blue-200 text-blue-800'}`}>{rec.urgency}</span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1 leading-relaxed">{rec.description}</p>
                    <div className="flex gap-4 mt-2 text-xs text-gray-500">
                      <span>Cost: {fmtINR(rec.costMin)} – {fmtINR(rec.costMax)}</span>
                      <span>Saves: {fmtINR(rec.monthlySaving)}/mo</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 8:
        return (
          <div className="space-y-4">
            <div className="bg-[#0F6E56]/5 border border-[#0F6E56]/20 rounded-xl p-4">
              <p className="font-bold text-[#0F6E56] mb-3">Audit Summary — {selectedBuilding?.name}</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
                <span className="text-gray-500">Audit date</span><span className="font-medium">{s1.auditDate}</span>
                <span className="text-gray-500">Auditor</span><span className="font-medium">{s1.auditorName}</span>
                <span className="text-gray-500">Monthly water cost</span><span className="font-medium text-amber-700">{fmtINR(totalMonthlyWaterSpend)}</span>
                <span className="text-gray-500"><LabelWithTooltip label="Greywater potential" term="Greywater potential" /></span><span className="font-medium text-teal-700">{(greywaterPotentialLpd / 1000).toFixed(1)} <LabelWithTooltip label="KLD" term="KLD" /></span>
                <span className="text-gray-500"><LabelWithTooltip label="DJB Rebate" term="DJB Rebate" /></span><span className="font-medium text-green-700">{fmtINR(djbRebateAnnual)}/yr</span>
                <span className="text-gray-500"><LabelWithTooltip label="Payback" term="Payback period" /></span><span className="font-medium">{paybackMonths > 0 ? `${paybackMonths} months` : '—'}</span>
                <span className="text-gray-500 font-semibold">Total annual benefit</span><span className="font-bold text-green-800">{fmtINR(totalAnnualBenefit)}</span>
                <span className="text-gray-500">Waste items found</span><span className="font-medium text-red-700">{Object.values(wasteMap).filter(w => w.found).length}</span>
                <span className="text-gray-500">Recommendations</span><span className="font-medium">{allRecs.length}</span>
              </div>
            </div>
            <p className="text-sm text-gray-500">Click "Save Audit" to record this audit permanently.</p>
          </div>
        );

      default:
        return null;
    }
  }

  // ── AUDIT LIST VIEW ─────────────────────────────────

  const auditRows = [...audits]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(a => {
      const b = buildings.find(bld => bld.id === a.buildingId);
      const area = b ? areas.find(ar => ar.id === b.areaId) : null;
      const city = b ? cities.find(c => c.id === b.cityId) : null;
      return { audit: a, building: b, area, city };
    });

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ClipboardList size={22} className="text-[#0F6E56]" />
            <h1 className="text-2xl font-bold text-gray-900">Water Audits</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">India-specific 8-step building water audit</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus size={15} className="mr-1.5" /> New Audit
        </Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Audits', value: audits.length },
          { label: 'This Month', value: audits.filter(a => new Date(a.date).getMonth() === new Date().getMonth()).length },
          { label: 'Total Potential Savings', value: fmtLakh(audits.reduce((s, a) => s + a.potentialSavings, 0)) },
          { label: 'Greywater Potential', value: `${(audits.reduce((s, a) => s + (a.greywaterPotentialLpd || 0), 0) / 1000).toFixed(0)} KLD` },
        ].map(kpi => (
          <Card key={kpi.label}><CardBody className="py-4"><p className="text-xs text-gray-500 font-medium">{kpi.label}</p><p className="text-xl font-bold text-gray-900 mt-0.5">{kpi.value}</p></CardBody></Card>
        ))}
      </div>

      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Building</TH>
              <TH>Location</TH>
              <TH>Date</TH>
              <TH>Monthly Cost</TH>
              <TH><LabelWithTooltip label="Greywater" term="Greywater potential" /></TH>
              <TH><LabelWithTooltip label="DJB Rebate" term="DJB Rebate" /></TH>
              <TH><LabelWithTooltip label="Payback" term="Payback period" /></TH>
              <TH>Top Action</TH>
              <TH></TH>
            </TR>
          </THead>
          <TBody>
            {auditRows.length === 0 && (
              <TR><TD colSpan={9} className="text-center text-gray-400 py-10">No audits yet. Click "New Audit" to start your first one.</TD></TR>
            )}
            {auditRows.map(({ audit: a, building: b, area, city }) => (
              <TR key={a.id} onClick={() => setViewAudit(a)}>
                <TD className="font-medium text-gray-900">{b?.name || '—'}</TD>
                <TD className="text-gray-500">{area?.name || '—'} · {city?.name || '—'}</TD>
                <TD>{format(new Date(a.date), 'd MMM yy')}</TD>
                <TD className="font-semibold text-amber-700">{fmtINR(a.currentWaterBill + a.tankerSpend)}</TD>
                <TD className="text-teal-700 font-semibold">{a.greywaterPotentialLpd ? `${(a.greywaterPotentialLpd / 1000).toFixed(1)} KLD` : '—'}</TD>
                <TD className="text-green-700 font-semibold">{a.djbRebateAnnual ? fmtINR(a.djbRebateAnnual) + '/yr' : '—'}</TD>
                <TD>{a.paybackMonths ? `${a.paybackMonths} mo` : '—'}</TD>
                <TD className="text-xs text-gray-600 max-w-[160px] truncate">{a.priorityActions?.[0]?.description.slice(0, 50) || '—'}</TD>
                <TD onClick={e => e.stopPropagation()}>
                  <div className="flex gap-2">
                    <button onClick={() => setViewAudit(a)} className="text-gray-400 hover:text-[#0F6E56] transition-colors p-1"><Eye size={14} /></button>
                    <button onClick={() => { if (window.confirm('Delete this audit?')) deleteAudit(a.id); }} className="text-gray-400 hover:text-red-500 transition-colors p-1"><Trash2 size={14} /></button>
                  </div>
                </TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* ── NEW AUDIT FORM MODAL ─────────────────────── */}
      <Modal
        open={showForm}
        onClose={() => { setShowForm(false); resetForm(); }}
        title={`New Audit — ${STEP_LABELS[step]} (${step + 1}/${STEP_LABELS.length})`}
        size="lg"
      >
        <div className="flex gap-1 mb-5 flex-wrap">
          {STEP_LABELS.map((label, i) => (
            <button key={i} onClick={() => { if (i <= step) setStep(i); }}
              className={`flex-1 min-w-[50px] py-1.5 rounded-lg text-[10px] font-semibold transition-all ${i === step ? 'bg-[#0F6E56] text-white' : i < step ? 'bg-[#0F6E56]/20 text-[#0F6E56]' : 'bg-gray-100 text-gray-400'}`}>
              {i + 1}
            </button>
          ))}
        </div>
        <div className="max-h-[55vh] overflow-y-auto pr-1">
          {renderStep()}
        </div>
        <div className="flex items-center justify-between pt-4 mt-4 border-t border-gray-100">
          <Button variant="ghost" onClick={() => { if (step > 0) setStep(s => s - 1); else { setShowForm(false); resetForm(); } }} className="flex items-center gap-1.5">
            <ChevronLeft size={15} /> {step === 0 ? 'Cancel' : 'Back'}
          </Button>
          {step < STEP_LABELS.length - 1 ? (
            <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed} className="flex items-center gap-1.5">
              Next <ChevronRight size={15} />
            </Button>
          ) : (
            <Button onClick={saveAudit} disabled={!selectedBuilding} className="flex items-center gap-2">
              <Check size={15} /> Save Audit
            </Button>
          )}
        </div>
      </Modal>

      {/* ── VIEW AUDIT MODAL ─────────────────────────── */}
      {viewAudit && (
        <Modal open={!!viewAudit} onClose={() => setViewAudit(null)} title="Audit Report" size="lg">
          <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            {(() => {
              const b = buildings.find(bld => bld.id === viewAudit.buildingId);
              return (
                <>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div><span className="text-gray-400 text-xs">Building</span><p className="font-semibold">{b?.name || '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Date</span><p className="font-semibold">{format(new Date(viewAudit.date), 'd MMM yyyy')}</p></div>
                    <div><span className="text-gray-400 text-xs">Monthly water bill</span><p className="font-semibold text-amber-700">{fmtINR(viewAudit.currentWaterBill)}</p></div>
                    <div><span className="text-gray-400 text-xs">Monthly tanker spend</span><p className="font-semibold text-amber-700">{fmtINR(viewAudit.tankerSpend)}</p></div>
                    <div><span className="text-gray-400 text-xs">Greywater potential</span><p className="font-semibold text-teal-700">{((viewAudit.greywaterPotentialLpd || 0) / 1000).toFixed(1)} KLD/day</p></div>
                    <div><span className="text-gray-400 text-xs">DJB rebate/year</span><p className="font-semibold text-green-700">{viewAudit.djbRebateAnnual ? fmtINR(viewAudit.djbRebateAnnual) : '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Capex estimate</span><p className="font-semibold">{viewAudit.capexEstimate ? fmtINR(viewAudit.capexEstimate) : '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Payback</span><p className="font-semibold">{viewAudit.paybackMonths ? `${viewAudit.paybackMonths} months` : '—'}</p></div>
                    <div><span className="text-gray-400 text-xs">Annual potential savings</span><p className="font-bold text-green-800">{fmtINR(viewAudit.potentialSavings)}</p></div>
                    <div><span className="text-gray-400 text-xs">Conducted by</span><p className="font-semibold">{viewAudit.conductedBy}</p></div>
                  </div>
                  {viewAudit.wasteChecklist && viewAudit.wasteChecklist.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Waste Found</p>
                      <div className="flex flex-wrap gap-2">{viewAudit.wasteChecklist.map(w => <span key={w} className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">{w}</span>)}</div>
                    </div>
                  )}
                  {viewAudit.priorityActions && viewAudit.priorityActions.length > 0 && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Priority Recommendations</p>
                      <div className="space-y-2">
                        {viewAudit.priorityActions.map((a, i) => (
                          <div key={i} className="p-3 bg-gray-50 rounded-xl text-sm">
                            <p className="font-medium text-gray-900">{i + 1}. {a.description}</p>
                            <div className="flex gap-4 text-xs text-gray-500 mt-1">
                              <span>Cost: {fmtINR(a.estimatedCost)}</span>
                              <span>Saves: {fmtINR(a.monthlySaving)}/mo</span>
                              <span className={`font-semibold ${a.urgency === 'Quick win' ? 'text-green-700' : a.urgency === 'Medium' ? 'text-amber-700' : 'text-blue-700'}`}>{a.urgency}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {viewAudit.notes && (
                    <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-1">Notes</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl p-3">{viewAudit.notes}</p>
                    </div>
                  )}
                </>
              );
            })()}
          </div>
          <Button variant="ghost" onClick={() => setViewAudit(null)} className="w-full mt-4">Close</Button>
        </Modal>
      )}
    </div>
  );
}
