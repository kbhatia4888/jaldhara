import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import type { RwhAssessment } from '../types';
import { Droplets, Plus, Edit2, Trash2, ChevronDown, ChevronUp, Calculator } from 'lucide-react';

const ROOF_MATERIALS = ['RCC/Concrete', 'GI Sheet', 'Asbestos', 'Clay Tile', 'Green Roof', 'Other'];
const ROOF_CONDITIONS = ['Good', 'Fair', 'Poor'];
const SYSTEM_TYPES = [
  'Rooftop RWH to Underground Sump',
  'Rooftop RWH to Overhead Tank',
  'Rooftop RWH + Groundwater Recharge (Percolation Pit)',
  'Rooftop RWH + Recharge Well',
  'Integrated RWH + Greywater System',
];

function calcRwh(form: Partial<FormState>) {
  const area = form.totalRoofAreaSqm ?? 0;
  const catchPct = (form.usableCatchmentPct ?? 75) / 100;
  const rainfall = form.avgAnnualRainfallMm ?? 0;
  // Annual harvest in litres = area(m²) × rainfall(mm) × 0.8 runoff coeff × catchment%
  const annualHarvest = area * catchPct * rainfall * 0.8;
  // Storage = 1 month peak (assume 30% of annual in peak month)
  const storage = annualHarvest * 0.3;
  // Capex: ₹25–45 per litre of storage
  const capexMin = Math.round(storage * 25);
  const capexMax = Math.round(storage * 45);
  // Saving: assume ₹4.5 per KL (DJB rate)
  const annualSaving = Math.round((annualHarvest / 1000) * 4.5 * 12);
  const payback = annualSaving > 0 ? Math.round(((capexMin + capexMax) / 2) / (annualSaving / 12)) : 0;
  // DJB rebate: 15% if with greywater else 10%
  const djbPct = form.withGreywater ? 15 : 10;
  const djbInr = Math.round((form.djbAnnualBill ?? 0) * djbPct / 100);
  return {
    annualHarvestPotentialLitres: Math.round(annualHarvest),
    storageRecommendedLitres: Math.round(storage),
    capexEstimateMin: capexMin,
    capexEstimateMax: capexMax,
    annualSavingInr: annualSaving,
    paybackMonths: payback,
    combinedDjbRebatePct: djbPct,
    combinedDjbRebateInr: djbInr,
  };
}

interface FormState {
  buildingId: string;
  assessmentDate: string;
  totalRoofAreaSqm: number;
  usableCatchmentPct: number;
  roofMaterial: string;
  roofCondition: string;
  avgAnnualRainfallMm: number;
  monsoonMonths: string;
  rwhSystemPresent: boolean;
  rwhSystemFunctional: boolean;
  rwhSystemNotes: string;
  ngtMandateApplicable: boolean;
  currentlyCompliant: boolean;
  recommendedSystemType: string;
  withGreywater: boolean;
  djbAnnualBill: number;
  notes: string;
}

const blankForm: FormState = {
  buildingId: '',
  assessmentDate: new Date().toISOString().split('T')[0],
  totalRoofAreaSqm: 0,
  usableCatchmentPct: 75,
  roofMaterial: 'RCC/Concrete',
  roofCondition: 'Good',
  avgAnnualRainfallMm: 790,
  monsoonMonths: 'Jul–Sep',
  rwhSystemPresent: false,
  rwhSystemFunctional: false,
  rwhSystemNotes: '',
  ngtMandateApplicable: false,
  currentlyCompliant: false,
  recommendedSystemType: SYSTEM_TYPES[0],
  withGreywater: false,
  djbAnnualBill: 0,
  notes: '',
};

function fmt(n: number) {
  return n.toLocaleString('en-IN');
}

export default function RainwaterHarvesting() {
  const { state, addRwh, updateRwh, deleteRwh } = useStore();
  const { rwhAssessments, buildings, cities } = state;

  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState<RwhAssessment | null>(null);
  const [form, setForm] = useState<FormState>(blankForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const calc = useMemo(() => calcRwh(form), [form]);

  const buildingOptions = buildings.map(b => {
    const city = cities.find(c => c.id === b.cityId);
    return { value: b.id, label: `${b.name} — ${city?.name ?? ''}` };
  });

  function openAdd() {
    setEditItem(null);
    setForm({ ...blankForm, assessmentDate: new Date().toISOString().split('T')[0] });
    setShowModal(true);
  }

  function openEdit(a: RwhAssessment) {
    setEditItem(a);
    setForm({
      buildingId: a.buildingId,
      assessmentDate: a.assessmentDate,
      totalRoofAreaSqm: a.totalRoofAreaSqm,
      usableCatchmentPct: a.usableCatchmentPct,
      roofMaterial: a.roofMaterial,
      roofCondition: a.roofCondition,
      avgAnnualRainfallMm: a.avgAnnualRainfallMm,
      monsoonMonths: a.monsoonMonths,
      rwhSystemPresent: a.rwhSystemPresent,
      rwhSystemFunctional: a.rwhSystemFunctional ?? false,
      rwhSystemNotes: a.rwhSystemNotes ?? '',
      ngtMandateApplicable: a.ngtMandateApplicable,
      currentlyCompliant: a.currentlyCompliant ?? false,
      recommendedSystemType: a.recommendedSystemType,
      withGreywater: a.combinedDjbRebatePct === 15,
      djbAnnualBill: a.combinedDjbRebateInr > 0 ? Math.round(a.combinedDjbRebateInr / a.combinedDjbRebatePct * 100) : 0,
      notes: a.notes,
    });
    setShowModal(true);
  }

  function save() {
    const building = buildings.find(b => b.id === form.buildingId);
    if (!building) return;
    const computed = calcRwh(form);
    const payload = {
      buildingId: form.buildingId,
      assessmentDate: form.assessmentDate,
      totalRoofAreaSqm: form.totalRoofAreaSqm,
      usableCatchmentPct: form.usableCatchmentPct,
      roofMaterial: form.roofMaterial,
      roofCondition: form.roofCondition,
      avgAnnualRainfallMm: form.avgAnnualRainfallMm,
      monsoonMonths: form.monsoonMonths,
      rwhSystemPresent: form.rwhSystemPresent,
      rwhSystemFunctional: form.rwhSystemFunctional,
      rwhSystemNotes: form.rwhSystemNotes,
      ngtMandateApplicable: form.ngtMandateApplicable,
      currentlyCompliant: form.currentlyCompliant,
      recommendedSystemType: form.recommendedSystemType,
      notes: form.notes,
      createdAt: editItem?.createdAt ?? new Date().toISOString(),
      ...computed,
    };
    if (editItem) {
      updateRwh({ ...payload, id: editItem.id });
    } else {
      addRwh(payload);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this RWH assessment?')) deleteRwh(id);
  }

  // Summary stats
  const totalHarvest = rwhAssessments.reduce((s, a) => s + a.annualHarvestPotentialLitres, 0);
  const totalSaving = rwhAssessments.reduce((s, a) => s + a.annualSavingInr, 0);
  const totalDjb = rwhAssessments.reduce((s, a) => s + a.combinedDjbRebateInr, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Droplets size={22} className="text-blue-600" />
            <h1 className="text-2xl font-bold text-gray-900">Rainwater Harvesting</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Assess rooftop catchment potential and design RWH systems for buildings</p>
        </div>
        <Button onClick={openAdd} className="flex-shrink-0">
          <Plus size={15} className="mr-1" /> New Assessment
        </Button>
      </div>

      {/* Summary KPIs */}
      {rwhAssessments.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <Card>
            <CardBody className="py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Annual Harvest Potential</p>
              <p className="text-xl font-bold text-blue-700 mt-1">{fmt(Math.round(totalHarvest / 1000))} KL</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">Total Water Saving / yr</p>
              <p className="text-xl font-bold text-[#0F6E56] mt-1">₹{fmt(totalSaving)}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody className="py-4">
              <p className="text-xs text-gray-500 uppercase tracking-wide">DJB Rebate Unlocked / yr</p>
              <p className="text-xl font-bold text-amber-600 mt-1">₹{fmt(totalDjb)}</p>
            </CardBody>
          </Card>
        </div>
      )}

      {/* Explainer */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Droplets size={16} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">How RWH assessments work</h3>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                Annual harvest = Roof area × Catchment % × Annual rainfall (mm) × 0.8 runoff coefficient.
                Delhi gets ~790 mm/year (mostly Jul–Sep). A 500 m² rooftop can harvest ~240,000 litres/year.
                DJB gives an additional <strong>10% annual bill rebate</strong> for RWH (15% if combined with greywater recycling).
                NGT mandates RWH for plots &gt;100 m² in many Indian cities.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Assessments list */}
      {rwhAssessments.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Droplets size={32} className="mx-auto text-blue-200 mb-3" />
            <p className="text-gray-500 text-sm">No RWH assessments yet.</p>
            <p className="text-gray-400 text-xs mt-1">Add an assessment to calculate harvest potential and DJB rebate eligibility.</p>
            <Button onClick={openAdd} className="mt-4 mx-auto">
              <Plus size={14} className="mr-1" /> Add First Assessment
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {rwhAssessments.map(a => {
            const building = buildings.find(b => b.id === a.buildingId);
            const isExpanded = expandedId === a.id;
            return (
              <Card key={a.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900 text-sm">{building?.name ?? 'Unknown Building'}</p>
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          {fmt(Math.round(a.annualHarvestPotentialLitres / 1000))} KL/yr harvest
                        </span>
                        {a.ngtMandateApplicable && (
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">NGT Mandate</span>
                        )}
                        {!a.currentlyCompliant && a.ngtMandateApplicable && (
                          <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">Non-Compliant</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {a.totalRoofAreaSqm} m² roof · {a.roofMaterial} · {a.avgAnnualRainfallMm}mm rainfall · Assessed {a.assessmentDate}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-[#0F6E56] font-medium">₹{fmt(a.annualSavingInr)}/yr saving</span>
                        <span className="text-amber-600 font-medium">₹{fmt(a.combinedDjbRebateInr)} DJB rebate</span>
                        <span className="text-gray-500">{a.paybackMonths}mo payback</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : a.id)}
                        className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => openEdit(a)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => handleDelete(a.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                      <div>
                        <p className="text-gray-400 uppercase tracking-wide text-[10px]">Storage Recommended</p>
                        <p className="font-semibold text-gray-900">{fmt(a.storageRecommendedLitres)} L</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase tracking-wide text-[10px]">Capex Range</p>
                        <p className="font-semibold text-gray-900">₹{fmt(a.capexEstimateMin)} – {fmt(a.capexEstimateMax)}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase tracking-wide text-[10px]">DJB Rebate %</p>
                        <p className="font-semibold text-gray-900">{a.combinedDjbRebatePct}%</p>
                      </div>
                      <div>
                        <p className="text-gray-400 uppercase tracking-wide text-[10px]">System Type</p>
                        <p className="font-semibold text-gray-900">{a.recommendedSystemType}</p>
                      </div>
                      {a.notes && (
                        <div className="col-span-2 sm:col-span-4">
                          <p className="text-gray-400 uppercase tracking-wide text-[10px]">Notes</p>
                          <p className="text-gray-700">{a.notes}</p>
                        </div>
                      )}
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editItem ? 'Edit RWH Assessment' : 'New RWH Assessment'} size="lg">
        <div className="space-y-5">
          {/* Building + Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Select
              label="Building *"
              options={buildingOptions}
              value={form.buildingId}
              onChange={e => setForm({ ...form, buildingId: e.target.value })}
            />
            <Input
              label="Assessment Date"
              type="date"
              value={form.assessmentDate}
              onChange={e => setForm({ ...form, assessmentDate: e.target.value })}
            />
          </div>

          {/* Roof */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Total Roof Area (m²)"
              type="number"
              value={form.totalRoofAreaSqm.toString()}
              onChange={e => setForm({ ...form, totalRoofAreaSqm: parseFloat(e.target.value) || 0 })}
            />
            <Input
              label="Usable Catchment %"
              type="number"
              value={form.usableCatchmentPct.toString()}
              onChange={e => setForm({ ...form, usableCatchmentPct: parseFloat(e.target.value) || 75 })}
            />
            <Select
              label="Roof Material"
              options={ROOF_MATERIALS.map(r => ({ value: r, label: r }))}
              value={form.roofMaterial}
              onChange={e => setForm({ ...form, roofMaterial: e.target.value })}
            />
          </div>

          {/* Rainfall */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Annual Rainfall (mm)"
              type="number"
              value={form.avgAnnualRainfallMm.toString()}
              onChange={e => setForm({ ...form, avgAnnualRainfallMm: parseFloat(e.target.value) || 0 })}
              placeholder="Delhi: 790"
            />
            <Input
              label="Monsoon Months"
              value={form.monsoonMonths}
              onChange={e => setForm({ ...form, monsoonMonths: e.target.value })}
              placeholder="e.g. Jul–Sep"
            />
          </div>

          {/* Checkboxes */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {[
              { key: 'rwhSystemPresent', label: 'RWH system already present' },
              { key: 'ngtMandateApplicable', label: 'NGT mandate applicable (plot >100m²)' },
              { key: 'withGreywater', label: 'Building also has / will have greywater system (15% DJB rebate)' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof FormState] as boolean}
                  onChange={e => setForm({ ...form, [key]: e.target.checked })}
                  className="rounded border-gray-300 text-[#0F6E56]"
                />
                <span className="text-gray-700 text-xs">{label}</span>
              </label>
            ))}
          </div>

          {/* DJB Bill for rebate calc */}
          <Input
            label="DJB Annual Water Bill (₹) — for rebate calculation"
            type="number"
            value={form.djbAnnualBill.toString()}
            onChange={e => setForm({ ...form, djbAnnualBill: parseFloat(e.target.value) || 0 })}
            placeholder="e.g. 144000"
          />

          {/* System type */}
          <Select
            label="Recommended System Type"
            options={SYSTEM_TYPES.map(s => ({ value: s, label: s }))}
            value={form.recommendedSystemType}
            onChange={e => setForm({ ...form, recommendedSystemType: e.target.value })}
          />

          <TextArea
            label="Notes"
            value={form.notes}
            onChange={e => setForm({ ...form, notes: e.target.value })}
            rows={2}
          />

          {/* Live calc preview */}
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Calculator size={14} className="text-blue-600" />
              <p className="text-sm font-semibold text-blue-900">Auto-calculated results</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <p className="text-blue-500">Annual Harvest</p>
                <p className="font-bold text-blue-900">{fmt(Math.round(calc.annualHarvestPotentialLitres / 1000))} KL</p>
              </div>
              <div>
                <p className="text-blue-500">Storage Needed</p>
                <p className="font-bold text-blue-900">{fmt(calc.storageRecommendedLitres)} L</p>
              </div>
              <div>
                <p className="text-blue-500">Capex Estimate</p>
                <p className="font-bold text-blue-900">₹{fmt(calc.capexEstimateMin)} – {fmt(calc.capexEstimateMax)}</p>
              </div>
              <div>
                <p className="text-blue-500">Annual Water Saving</p>
                <p className="font-bold text-blue-900">₹{fmt(calc.annualSavingInr)}</p>
              </div>
              <div>
                <p className="text-blue-500">DJB Rebate ({calc.combinedDjbRebatePct}%)</p>
                <p className="font-bold text-blue-900">₹{fmt(calc.combinedDjbRebateInr)}/yr</p>
              </div>
              <div>
                <p className="text-blue-500">Payback</p>
                <p className="font-bold text-blue-900">{calc.paybackMonths} months</p>
              </div>
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <Button onClick={save} className="flex-1" disabled={!form.buildingId}>
              {editItem ? 'Save Changes' : 'Save Assessment'}
            </Button>
            <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
