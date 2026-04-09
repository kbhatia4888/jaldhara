import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import type { WaterBody, WaterBodyCondition, WaterBodyStatus, LakeRestorationLog } from '../types';
import { Waves, Plus, Edit2, Trash2, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';

const WATER_BODY_TYPES = ['Natural Lake', 'Johad', 'Pond', 'Nala', 'Baoli', 'Seasonal Wetland', 'Check Dam'] as const;
const CONDITIONS: WaterBodyCondition[] = ['Healthy', 'Degraded', 'Heavily Encroached', 'Sewage Discharge', 'Dry', 'Polluted'];
const STATUSES: WaterBodyStatus[] = ['Identified', 'Assessment Done', 'Partner Engaged', 'Work Started', 'Restoration Complete', 'Monitoring'];
const FEASIBILITIES = ['High', 'Medium', 'Low', 'Not Feasible'] as const;
const WATER_LEVELS = ['Full', 'Half', 'Dry', 'Encroached'] as const;

const CONDITION_COLORS: Record<WaterBodyCondition, string> = {
  'Healthy': 'bg-green-100 text-green-700',
  'Degraded': 'bg-amber-100 text-amber-700',
  'Heavily Encroached': 'bg-red-100 text-red-700',
  'Sewage Discharge': 'bg-red-200 text-red-800',
  'Dry': 'bg-[#EDE4D4] text-[#5C5244]',
  'Polluted': 'bg-orange-100 text-orange-700',
};
const STATUS_COLORS: Record<WaterBodyStatus, string> = {
  'Identified': 'bg-[#EDE4D4] text-[#5C5244]',
  'Assessment Done': 'bg-blue-100 text-blue-700',
  'Partner Engaged': 'bg-purple-100 text-purple-700',
  'Work Started': 'bg-amber-100 text-amber-700',
  'Restoration Complete': 'bg-green-100 text-green-700',
  'Monitoring': 'bg-teal-100 text-teal-700',
};

interface WbForm {
  cityId: string;
  areaId: string;
  name: string;
  localName: string;
  type: typeof WATER_BODY_TYPES[number];
  address: string;
  surfaceAreaSqm: number;
  maxDepthM: number;
  currentWaterLevel: typeof WATER_LEVELS[number];
  condition: WaterBodyCondition;
  encroachmentPresent: boolean;
  sewageInflow: boolean;
  solidWasteDumping: boolean;
  invasiveSpecies: string;
  traditionalUse: string;
  lastKnownFunctionalYear: number;
  restorationFeasibility: typeof FEASIBILITIES[number];
  restorationStatus: WaterBodyStatus;
  responsibleAuthority: string;
  ngoPartner: string;
  csrSponsor: string;
  communityChampion: string;
  estimatedRestorationCostInr: number;
  fundingSecuredInr: number;
  notes: string;
}

const blankForm: WbForm = {
  cityId: '',
  areaId: '',
  name: '',
  localName: '',
  type: 'Natural Lake',
  address: '',
  surfaceAreaSqm: 0,
  maxDepthM: 0,
  currentWaterLevel: 'Dry',
  condition: 'Degraded',
  encroachmentPresent: false,
  sewageInflow: false,
  solidWasteDumping: false,
  invasiveSpecies: '',
  traditionalUse: '',
  lastKnownFunctionalYear: 0,
  restorationFeasibility: 'Medium',
  restorationStatus: 'Identified',
  responsibleAuthority: '',
  ngoPartner: '',
  csrSponsor: '',
  communityChampion: '',
  estimatedRestorationCostInr: 0,
  fundingSecuredInr: 0,
  notes: '',
};

interface LogForm {
  logDate: string;
  workDone: string;
  waterLevelChange: string;
  volunteersInvolved: number;
  notes: string;
}
const blankLog: LogForm = {
  logDate: new Date().toISOString().split('T')[0],
  workDone: '',
  waterLevelChange: '',
  volunteersInvolved: 0,
  notes: '',
};

function fmt(n: number) { return n.toLocaleString('en-IN'); }

export default function Lakes() {
  const { state, addWaterBody, updateWaterBody, deleteWaterBody, addLakeLog, deleteLakeLog } = useStore();
  const { waterBodies, lakeRestorationLogs, cities, areas } = state;

  const [showWbModal, setShowWbModal] = useState(false);
  const [editWb, setEditWb] = useState<WaterBody | null>(null);
  const [form, setForm] = useState<WbForm>(blankForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState<string | null>(null);
  const [logForm, setLogForm] = useState<LogForm>(blankLog);

  function openAdd() {
    setEditWb(null);
    setForm({ ...blankForm, cityId: cities[0]?.id ?? '' });
    setShowWbModal(true);
  }

  function openEdit(wb: WaterBody) {
    setEditWb(wb);
    setForm({
      cityId: wb.cityId,
      areaId: wb.areaId ?? '',
      name: wb.name,
      localName: wb.localName ?? '',
      type: wb.type,
      address: wb.address ?? '',
      surfaceAreaSqm: wb.surfaceAreaSqm ?? 0,
      maxDepthM: wb.maxDepthM ?? 0,
      currentWaterLevel: wb.currentWaterLevel ?? 'Dry',
      condition: wb.condition,
      encroachmentPresent: wb.encroachmentPresent ?? false,
      sewageInflow: wb.sewageInflow ?? false,
      solidWasteDumping: wb.solidWasteDumping ?? false,
      invasiveSpecies: wb.invasiveSpecies ?? '',
      traditionalUse: wb.traditionalUse ?? '',
      lastKnownFunctionalYear: wb.lastKnownFunctionalYear ?? 0,
      restorationFeasibility: wb.restorationFeasibility ?? 'Medium',
      restorationStatus: wb.restorationStatus,
      responsibleAuthority: wb.responsibleAuthority ?? '',
      ngoPartner: wb.ngoPartner ?? '',
      csrSponsor: wb.csrSponsor ?? '',
      communityChampion: wb.communityChampion ?? '',
      estimatedRestorationCostInr: wb.estimatedRestorationCostInr ?? 0,
      fundingSecuredInr: wb.fundingSecuredInr ?? 0,
      notes: wb.notes ?? '',
    });
    setShowWbModal(true);
  }

  function save() {
    if (!form.name.trim() || !form.cityId) return;
    const estimatedWaterHoldingLitres = form.surfaceAreaSqm > 0 && form.maxDepthM > 0
      ? Math.round(form.surfaceAreaSqm * form.maxDepthM * 1000)
      : undefined;
    const payload = {
      cityId: form.cityId,
      areaId: form.areaId || undefined,
      name: form.name,
      localName: form.localName || undefined,
      type: form.type,
      address: form.address || undefined,
      surfaceAreaSqm: form.surfaceAreaSqm || undefined,
      maxDepthM: form.maxDepthM || undefined,
      currentWaterLevel: form.currentWaterLevel,
      condition: form.condition,
      encroachmentPresent: form.encroachmentPresent,
      sewageInflow: form.sewageInflow,
      solidWasteDumping: form.solidWasteDumping,
      invasiveSpecies: form.invasiveSpecies || undefined,
      traditionalUse: form.traditionalUse || undefined,
      lastKnownFunctionalYear: form.lastKnownFunctionalYear || undefined,
      restorationFeasibility: form.restorationFeasibility,
      estimatedWaterHoldingLitres,
      restorationStatus: form.restorationStatus,
      responsibleAuthority: form.responsibleAuthority || undefined,
      ngoPartner: form.ngoPartner || undefined,
      csrSponsor: form.csrSponsor || undefined,
      communityChampion: form.communityChampion || undefined,
      estimatedRestorationCostInr: form.estimatedRestorationCostInr || undefined,
      fundingSecuredInr: form.fundingSecuredInr || undefined,
      notes: form.notes || undefined,
      createdAt: editWb?.createdAt ?? new Date().toISOString(),
    };
    if (editWb) {
      updateWaterBody({ ...payload, id: editWb.id });
    } else {
      addWaterBody(payload);
    }
    setShowWbModal(false);
  }

  function saveLog() {
    if (!showLogModal) return;
    addLakeLog({ ...logForm, waterBodyId: showLogModal, createdAt: new Date().toISOString() });
    setShowLogModal(null);
  }

  const totalWaterHolding = waterBodies.reduce((s, wb) => s + (wb.estimatedWaterHoldingLitres ?? 0), 0);
  const needsAttention = waterBodies.filter(wb => wb.condition === 'Sewage Discharge' || wb.condition === 'Heavily Encroached').length;
  const inProgress = waterBodies.filter(wb => wb.restorationStatus === 'Work Started' || wb.restorationStatus === 'Partner Engaged').length;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Waves size={22} className="text-cyan-600" />
            <h1 className="text-2xl font-bold text-[#2C2820]">Lakes & Water Bodies</h1>
          </div>
          <p className="text-[#8C8062] text-sm mt-0.5">Map, assess, and track restoration of lakes, johads, ponds, and nalas</p>
        </div>
        <Button onClick={openAdd} className="flex-shrink-0 bg-cyan-700 hover:bg-cyan-800">
          <Plus size={15} className="mr-1" /> Map Water Body
        </Button>
      </div>

      {/* KPIs */}
      {waterBodies.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Water Bodies Mapped', value: waterBodies.length.toString(), color: 'text-[#2C2820]' },
            { label: 'Water Holding (KL)', value: fmt(Math.round(totalWaterHolding / 1000)), color: 'text-cyan-700' },
            { label: 'Needs Urgent Action', value: needsAttention.toString(), color: 'text-red-600' },
            { label: 'Restoration Active', value: inProgress.toString(), color: 'text-[#567C45]' },
          ].map(k => (
            <Card key={k.label}>
              <CardBody className="py-4">
                <p className="text-xs text-[#8C8062] uppercase tracking-wide">{k.label}</p>
                <p className={`text-xl font-bold mt-1 ${k.color}`}>{k.value}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* Why water bodies matter */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Waves size={16} className="text-cyan-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2C2820] text-sm">Why restore urban water bodies?</h3>
              <p className="text-xs text-[#8C8062] mt-1 leading-relaxed">
                Delhi had 1,012 lakes and water bodies historically — fewer than 600 are traceable today, and only ~200 hold water year-round.
                A restored johad or lake recharges groundwater (reducing borewell dependency), reduces urban flooding, hosts biodiversity,
                and cuts surface temperature by 2–4°C in surrounding neighbourhoods.
                Restoration typically costs ₹5–40 lakh depending on size and encroachment severity.
                CSR funding under Section 135 of Companies Act can be directed here.
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Water bodies list */}
      {waterBodies.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Waves size={32} className="mx-auto text-cyan-200 mb-3" />
            <p className="text-[#8C8062] text-sm">No water bodies mapped yet.</p>
            <p className="text-[#ADA082] text-xs mt-1">Start by mapping the water bodies in your operating area.</p>
            <Button onClick={openAdd} className="mt-4 mx-auto bg-cyan-700 hover:bg-cyan-800">
              <Plus size={14} className="mr-1" /> Map First Water Body
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {waterBodies.map(wb => {
            const city = cities.find(c => c.id === wb.cityId);
            const area = areas.find(a => a.id === wb.areaId);
            const logs = lakeRestorationLogs.filter(l => l.waterBodyId === wb.id);
            const isExpanded = expandedId === wb.id;
            const isUrgent = wb.condition === 'Sewage Discharge' || wb.condition === 'Heavily Encroached';
            return (
              <Card key={wb.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isUrgent && <AlertTriangle size={12} className="text-red-500 flex-shrink-0" />}
                        <p className="font-semibold text-[#2C2820] text-sm">{wb.name}</p>
                        {wb.localName && <span className="text-xs text-[#ADA082]">({wb.localName})</span>}
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CONDITION_COLORS[wb.condition]}`}>{wb.condition}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[wb.restorationStatus]}`}>{wb.restorationStatus}</span>
                      </div>
                      <p className="text-xs text-[#8C8062] mt-0.5">
                        {wb.type} · {area?.name ? `${area.name}, ` : ''}{city?.name ?? ''}
                        {wb.surfaceAreaSqm ? ` · ${fmt(wb.surfaceAreaSqm)} m²` : ''}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs flex-wrap">
                        {wb.estimatedWaterHoldingLitres && (
                          <span className="text-cyan-700 font-medium">{fmt(Math.round(wb.estimatedWaterHoldingLitres / 1000))} KL capacity</span>
                        )}
                        {wb.estimatedRestorationCostInr && (
                          <span className="text-[#8C8062]">₹{fmt(wb.estimatedRestorationCostInr)} est. cost</span>
                        )}
                        {wb.restorationFeasibility && (
                          <span className="text-[#8C8062]">Feasibility: {wb.restorationFeasibility}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : wb.id)}
                        className="p-1.5 text-[#ADA082] hover:text-[#463F2E] rounded-lg hover:bg-[#EDE4D4] transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => openEdit(wb)} className="p-1.5 text-[#ADA082] hover:text-[#463F2E] rounded-lg hover:bg-[#EDE4D4] transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => { if (window.confirm('Delete this water body?')) deleteWaterBody(wb.id); }} className="p-1.5 text-[#ADA082] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#EDE4D4] space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">Water Level</p>
                          <p className="font-semibold text-[#2C2820]">{wb.currentWaterLevel ?? '—'}</p>
                        </div>
                        {wb.lastKnownFunctionalYear && (
                          <div>
                            <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">Last Functional</p>
                            <p className="font-semibold text-[#2C2820]">{wb.lastKnownFunctionalYear}</p>
                          </div>
                        )}
                        {wb.fundingSecuredInr !== undefined && wb.estimatedRestorationCostInr && (
                          <div>
                            <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">Funding</p>
                            <p className="font-semibold text-[#2C2820]">₹{fmt(wb.fundingSecuredInr)} / ₹{fmt(wb.estimatedRestorationCostInr)}</p>
                          </div>
                        )}
                        {wb.ngoPartner && (
                          <div>
                            <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">NGO Partner</p>
                            <p className="font-semibold text-[#2C2820]">{wb.ngoPartner}</p>
                          </div>
                        )}
                      </div>

                      {/* Issues */}
                      <div className="flex flex-wrap gap-2 text-xs">
                        {wb.encroachmentPresent && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">Encroachment</span>}
                        {wb.sewageInflow && <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded">Sewage inflow</span>}
                        {wb.solidWasteDumping && <span className="bg-orange-50 text-orange-600 px-2 py-0.5 rounded">Solid waste dumping</span>}
                        {wb.invasiveSpecies && <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded">Invasive: {wb.invasiveSpecies}</span>}
                      </div>

                      {wb.traditionalUse && (
                        <div className="text-xs">
                          <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">Traditional Use</p>
                          <p className="text-[#463F2E]">{wb.traditionalUse}</p>
                        </div>
                      )}
                      {wb.notes && (
                        <div className="text-xs">
                          <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">Notes</p>
                          <p className="text-[#463F2E]">{wb.notes}</p>
                        </div>
                      )}

                      {/* Restoration logs */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[#463F2E]">Restoration Logs ({logs.length})</p>
                          <button
                            onClick={() => { setLogForm({ ...blankLog, logDate: new Date().toISOString().split('T')[0] }); setShowLogModal(wb.id); }}
                            className="text-xs text-cyan-700 hover:text-cyan-900 font-medium"
                          >+ Add log</button>
                        </div>
                        {logs.length === 0 ? (
                          <p className="text-xs text-[#ADA082]">No restoration logs yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {logs.map(l => (
                              <div key={l.id} className="flex items-start justify-between bg-[#F6F1EA] rounded-lg p-2.5 text-xs">
                                <div>
                                  <p className="font-medium text-gray-800">{l.logDate}</p>
                                  <p className="text-[#463F2E] mt-0.5">{l.workDone}</p>
                                  {l.waterLevelChange && <p className="text-cyan-700 mt-0.5">Water level: {l.waterLevelChange}</p>}
                                  {l.volunteersInvolved && <p className="text-[#ADA082]">Volunteers: {l.volunteersInvolved}</p>}
                                </div>
                                <button onClick={() => { if (window.confirm('Delete log?')) deleteLakeLog(l.id); }} className="text-gray-300 hover:text-red-500 ml-2">
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Water Body Modal */}
      <Modal open={showWbModal} onClose={() => setShowWbModal(false)} title={editWb ? 'Edit Water Body' : 'Map Water Body'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            <Input label="Local Name" value={form.localName} onChange={e => setForm({ ...form, localName: e.target.value })} placeholder="e.g. Azadpur ki Baoli" />
            <Select
              label="City *"
              options={cities.map(c => ({ value: c.id, label: c.name }))}
              value={form.cityId}
              onChange={e => setForm({ ...form, cityId: e.target.value })}
            />
            <Select
              label="Type"
              options={WATER_BODY_TYPES.map(t => ({ value: t, label: t }))}
              value={form.type}
              onChange={e => setForm({ ...form, type: e.target.value as typeof WATER_BODY_TYPES[number] })}
            />
            <Select
              label="Current Condition"
              options={CONDITIONS.map(c => ({ value: c, label: c }))}
              value={form.condition}
              onChange={e => setForm({ ...form, condition: e.target.value as WaterBodyCondition })}
            />
            <Select
              label="Restoration Status"
              options={STATUSES.map(s => ({ value: s, label: s }))}
              value={form.restorationStatus}
              onChange={e => setForm({ ...form, restorationStatus: e.target.value as WaterBodyStatus })}
            />
            <Input label="Surface Area (m²)" type="number" value={form.surfaceAreaSqm.toString()} onChange={e => setForm({ ...form, surfaceAreaSqm: parseFloat(e.target.value) || 0 })} />
            <Input label="Max Depth (m)" type="number" value={form.maxDepthM.toString()} onChange={e => setForm({ ...form, maxDepthM: parseFloat(e.target.value) || 0 })} />
            <Input label="Est. Restoration Cost (₹)" type="number" value={form.estimatedRestorationCostInr.toString()} onChange={e => setForm({ ...form, estimatedRestorationCostInr: parseFloat(e.target.value) || 0 })} />
            <Input label="Funding Secured (₹)" type="number" value={form.fundingSecuredInr.toString()} onChange={e => setForm({ ...form, fundingSecuredInr: parseFloat(e.target.value) || 0 })} />
            <Input label="NGO Partner" value={form.ngoPartner} onChange={e => setForm({ ...form, ngoPartner: e.target.value })} />
            <Input label="Responsible Authority" value={form.responsibleAuthority} onChange={e => setForm({ ...form, responsibleAuthority: e.target.value })} />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {[
              { key: 'encroachmentPresent', label: 'Encroachment present' },
              { key: 'sewageInflow', label: 'Sewage inflow' },
              { key: 'solidWasteDumping', label: 'Solid waste dumping' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form[key as keyof WbForm] as boolean}
                  onChange={e => setForm({ ...form, [key]: e.target.checked })}
                  className="rounded border-gray-300 text-[#567C45]"
                />
                <span className="text-xs text-[#463F2E]">{label}</span>
              </label>
            ))}
          </div>

          <Input label="Invasive Species" value={form.invasiveSpecies} onChange={e => setForm({ ...form, invasiveSpecies: e.target.value })} placeholder="e.g. Water hyacinth" />
          <Input label="Traditional Use" value={form.traditionalUse} onChange={e => setForm({ ...form, traditionalUse: e.target.value })} />

          {form.surfaceAreaSqm > 0 && form.maxDepthM > 0 && (
            <div className="bg-cyan-50 border border-cyan-100 rounded-xl p-3 text-xs">
              <p className="text-cyan-700 font-medium">Estimated water holding capacity: <strong>{fmt(Math.round(form.surfaceAreaSqm * form.maxDepthM * 1000 / 1000))} KL</strong></p>
            </div>
          )}

          <TextArea label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} />

          <div className="flex gap-3">
            <Button onClick={save} className="flex-1 bg-cyan-700 hover:bg-cyan-800" disabled={!form.name.trim() || !form.cityId}>
              {editWb ? 'Save Changes' : 'Map Water Body'}
            </Button>
            <Button variant="ghost" onClick={() => setShowWbModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Log Modal */}
      <Modal open={!!showLogModal} onClose={() => setShowLogModal(null)} title="Add Restoration Log">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={logForm.logDate} onChange={e => setLogForm({ ...logForm, logDate: e.target.value })} />
            <Input label="Volunteers Involved" type="number" value={logForm.volunteersInvolved.toString()} onChange={e => setLogForm({ ...logForm, volunteersInvolved: parseInt(e.target.value) || 0 })} />
          </div>
          <TextArea label="Work Done *" value={logForm.workDone} onChange={e => setLogForm({ ...logForm, workDone: e.target.value })} rows={2} placeholder="e.g. Desilting complete, 20 truckloads removed..." />
          <Input label="Water Level Change" value={logForm.waterLevelChange} onChange={e => setLogForm({ ...logForm, waterLevelChange: e.target.value })} placeholder="e.g. Rose from 30cm to 60cm" />
          <TextArea label="Notes" value={logForm.notes} onChange={e => setLogForm({ ...logForm, notes: e.target.value })} rows={2} />
          <div className="flex gap-3">
            <Button onClick={saveLog} className="flex-1 bg-cyan-700 hover:bg-cyan-800" disabled={!logForm.workDone.trim()}>Save Log</Button>
            <Button variant="ghost" onClick={() => setShowLogModal(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
