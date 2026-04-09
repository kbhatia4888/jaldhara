import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import type { TreeProject, TreeMonitoringLog, TreeProjectStatus } from '../types';
import { Leaf, Plus, Edit2, Trash2, ChevronDown, ChevronUp, BarChart2 } from 'lucide-react';

const STATUS_OPTIONS: TreeProjectStatus[] = ['Planning', 'Site Ready', 'Plantation Done', 'Monitoring', 'Established'];
const STATUS_COLORS: Record<TreeProjectStatus, string> = {
  'Planning': 'bg-[#EDE4D4] text-[#5C5244]',
  'Site Ready': 'bg-amber-100 text-amber-700',
  'Plantation Done': 'bg-blue-100 text-blue-700',
  'Monitoring': 'bg-purple-100 text-purple-700',
  'Established': 'bg-green-100 text-green-700',
};
const PROJECT_TYPES = [
  'Miyawaki Urban Forest',
  'Avenue Plantation (Roadside)',
  'School Green Campus',
  'Institutional Campus Trees',
  'RWA/Society Green Spaces',
  'Wasteland Reforestation',
  'Riparian Buffer Plantation',
  'Other',
];
const SUNLIGHT_OPTIONS = ['Full sun', 'Partial shade', 'Mixed'];
const IRRIGATION_OPTIONS = ['Drip irrigation', 'Manual watering', 'Rainwater fed', 'None planned'];

interface ProjForm {
  cityId: string;
  areaId: string;
  buildingId: string;
  projectName: string;
  projectType: string;
  availableLandSqm: number;
  currentLandUse: string;
  soilCondition: string;
  sunlight: string;
  waterSourceAvailable: boolean;
  irrigationMethod: string;
  isMiyawakiMethod: boolean;
  miyawakiLayersPlanned: number;
  nativeSpeciesList: string;
  treesPlanned: number;
  treesPlanted: number;
  tresSurviving: number;
  plantationDate: string;
  lastMonitoringDate: string;
  costPerTreeInr: number;
  fundingSource: string;
  ngoPartner: string;
  csrSponsor: string;
  volunteerCount: number;
  status: TreeProjectStatus;
  notes: string;
}

const blankProj: ProjForm = {
  cityId: '',
  areaId: '',
  buildingId: '',
  projectName: '',
  projectType: 'Miyawaki Urban Forest',
  availableLandSqm: 0,
  currentLandUse: '',
  soilCondition: '',
  sunlight: 'Full sun',
  waterSourceAvailable: true,
  irrigationMethod: 'Drip irrigation',
  isMiyawakiMethod: true,
  miyawakiLayersPlanned: 4,
  nativeSpeciesList: '',
  treesPlanned: 0,
  treesPlanted: 0,
  tresSurviving: 0,
  plantationDate: '',
  lastMonitoringDate: '',
  costPerTreeInr: 150,
  fundingSource: '',
  ngoPartner: '',
  csrSponsor: '',
  volunteerCount: 0,
  status: 'Planning',
  notes: '',
};

interface LogForm {
  logDate: string;
  treesCounted: number;
  treesSurviving: number;
  healthNotes: string;
  monitoredBy: string;
}
const blankLog: LogForm = {
  logDate: new Date().toISOString().split('T')[0],
  treesCounted: 0,
  treesSurviving: 0,
  healthNotes: '',
  monitoredBy: '',
};

function fmt(n: number) { return n.toLocaleString('en-IN'); }

export default function UrbanTrees() {
  const { state, addTreeProject, updateTreeProject, deleteTreeProject, addTreeLog, deleteTreeLog } = useStore();
  const { treeProjects, treeMonitoringLogs, cities, areas } = state;

  const [showProjModal, setShowProjModal] = useState(false);
  const [editProj, setEditProj] = useState<TreeProject | null>(null);
  const [projForm, setProjForm] = useState<ProjForm>(blankProj);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showLogModal, setShowLogModal] = useState<string | null>(null); // projectId
  const [logForm, setLogForm] = useState<LogForm>(blankLog);

  function openAddProj() {
    setEditProj(null);
    const firstCity = cities[0];
    setProjForm({ ...blankProj, cityId: firstCity?.id ?? '' });
    setShowProjModal(true);
  }

  function openEditProj(p: TreeProject) {
    setEditProj(p);
    setProjForm({
      cityId: p.cityId,
      areaId: p.areaId ?? '',
      buildingId: p.buildingId ?? '',
      projectName: p.projectName,
      projectType: p.projectType,
      availableLandSqm: p.availableLandSqm,
      currentLandUse: p.currentLandUse,
      soilCondition: p.soilCondition,
      sunlight: p.sunlight,
      waterSourceAvailable: p.waterSourceAvailable,
      irrigationMethod: p.irrigationMethod,
      isMiyawakiMethod: p.isMiyawakiMethod,
      miyawakiLayersPlanned: p.miyawakiLayersPlanned ?? 4,
      nativeSpeciesList: p.nativeSpeciesList,
      treesPlanned: p.treesPlanned,
      treesPlanted: p.treesPlanted,
      tresSurviving: p.tresSurviving,
      plantationDate: p.plantationDate ?? '',
      lastMonitoringDate: p.lastMonitoringDate ?? '',
      costPerTreeInr: p.costPerTreeInr,
      fundingSource: p.fundingSource ?? '',
      ngoPartner: p.ngoPartner ?? '',
      csrSponsor: p.csrSponsor ?? '',
      volunteerCount: p.volunteerCount ?? 0,
      status: p.status,
      notes: p.notes ?? '',
    });
    setShowProjModal(true);
  }

  function saveProj() {
    if (!projForm.projectName.trim() || !projForm.cityId) return;
    const treesPlanted = projForm.treesPlanted;
    const tresSurviving = projForm.tresSurviving;
    const survivalRatePct = treesPlanted > 0 ? Math.round((tresSurviving / treesPlanted) * 100) : 0;
    const estimatedCo2PerYearKg = Math.round(tresSurviving * 21);
    const totalProjectCostInr = Math.round(projForm.treesPlanned * projForm.costPerTreeInr);

    const payload = {
      cityId: projForm.cityId,
      areaId: projForm.areaId || undefined,
      buildingId: projForm.buildingId || undefined,
      projectName: projForm.projectName,
      projectType: projForm.projectType,
      availableLandSqm: projForm.availableLandSqm,
      currentLandUse: projForm.currentLandUse,
      soilCondition: projForm.soilCondition,
      sunlight: projForm.sunlight,
      waterSourceAvailable: projForm.waterSourceAvailable,
      irrigationMethod: projForm.irrigationMethod,
      isMiyawakiMethod: projForm.isMiyawakiMethod,
      miyawakiLayersPlanned: projForm.isMiyawakiMethod ? projForm.miyawakiLayersPlanned : undefined,
      nativeSpeciesList: projForm.nativeSpeciesList,
      treesPlanned: projForm.treesPlanned,
      treesPlanted,
      tresSurviving,
      survivalRatePct,
      plantationDate: projForm.plantationDate || undefined,
      lastMonitoringDate: projForm.lastMonitoringDate || undefined,
      estimatedCo2PerYearKg,
      costPerTreeInr: projForm.costPerTreeInr,
      totalProjectCostInr,
      fundingSource: projForm.fundingSource || undefined,
      ngoPartner: projForm.ngoPartner || undefined,
      csrSponsor: projForm.csrSponsor || undefined,
      volunteerCount: projForm.volunteerCount || undefined,
      status: projForm.status,
      notes: projForm.notes || undefined,
      createdAt: editProj?.createdAt ?? new Date().toISOString(),
    };
    if (editProj) {
      updateTreeProject({ ...payload, id: editProj.id });
    } else {
      addTreeProject(payload);
    }
    setShowProjModal(false);
  }

  function openAddLog(projectId: string) {
    setLogForm({ ...blankLog, logDate: new Date().toISOString().split('T')[0] });
    setShowLogModal(projectId);
  }

  function saveLog() {
    if (!showLogModal) return;
    addTreeLog({ ...logForm, projectId: showLogModal, createdAt: new Date().toISOString() });
    setShowLogModal(null);
  }

  // Summary
  const totalPlanned = treeProjects.reduce((s, p) => s + p.treesPlanned, 0);
  const totalPlanted = treeProjects.reduce((s, p) => s + p.treesPlanted, 0);
  const totalSurviving = treeProjects.reduce((s, p) => s + p.tresSurviving, 0);
  const totalCo2 = treeProjects.reduce((s, p) => s + p.estimatedCo2PerYearKg, 0);

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Leaf size={22} className="text-green-600" />
            <h1 className="text-2xl font-bold text-[#2C2820]">Urban Tree Plantation</h1>
          </div>
          <p className="text-[#8C8062] text-sm mt-0.5">Track Miyawaki forests, avenue plantation, and community green space projects</p>
        </div>
        <Button onClick={openAddProj} className="flex-shrink-0 bg-green-700 hover:bg-green-800">
          <Plus size={15} className="mr-1" /> New Project
        </Button>
      </div>

      {/* KPIs */}
      {treeProjects.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Trees Planned', value: fmt(totalPlanned), color: 'text-[#2C2820]' },
            { label: 'Trees Planted', value: fmt(totalPlanted), color: 'text-green-700' },
            { label: 'Surviving', value: fmt(totalSurviving), color: 'text-[#567C45]' },
            { label: 'CO₂ Seq/yr (kg)', value: fmt(totalCo2), color: 'text-amber-600' },
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

      {/* Miyawaki explainer */}
      <Card>
        <CardBody>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Leaf size={16} className="text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#2C2820] text-sm">Miyawaki Method</h3>
              <p className="text-xs text-[#8C8062] mt-1 leading-relaxed">
                Plant 3–4 native trees per m² in 4 layers (canopy, sub-canopy, shrub, ground cover).
                Grows 10× faster than conventional plantation. 30× denser. Self-sustaining after 3 years.
                Each surviving tree sequesters ~21 kg CO₂/year. 400 m² = ~1,200 trees = 25 tonnes CO₂/yr.
                Pairs well with RWH (trees anchor soil, reduce runoff) and lake restoration (buffer zones).
              </p>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Projects */}
      {treeProjects.length === 0 ? (
        <Card>
          <CardBody className="py-12 text-center">
            <Leaf size={32} className="mx-auto text-green-200 mb-3" />
            <p className="text-[#8C8062] text-sm">No tree projects yet.</p>
            <p className="text-[#ADA082] text-xs mt-1">Add a Miyawaki urban forest or plantation project to start tracking.</p>
            <Button onClick={openAddProj} className="mt-4 mx-auto bg-green-700 hover:bg-green-800">
              <Plus size={14} className="mr-1" /> Add First Project
            </Button>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {treeProjects.map(p => {
            const city = cities.find(c => c.id === p.cityId);
            const area = areas.find(a => a.id === p.areaId);
            const logs = treeMonitoringLogs.filter(l => l.projectId === p.id);
            const isExpanded = expandedId === p.id;
            return (
              <Card key={p.id}>
                <CardBody>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-[#2C2820] text-sm">{p.projectName}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_COLORS[p.status]}`}>{p.status}</span>
                        {p.isMiyawakiMethod && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">Miyawaki</span>
                        )}
                      </div>
                      <p className="text-xs text-[#8C8062] mt-0.5">
                        {area?.name ? `${area.name}, ` : ''}{city?.name ?? ''} · {p.availableLandSqm} m² · {p.projectType}
                      </p>
                      <div className="flex gap-4 mt-2 text-xs">
                        <span className="text-[#5C5244]">Planned: <strong>{fmt(p.treesPlanned)}</strong></span>
                        <span className="text-green-700">Planted: <strong>{fmt(p.treesPlanted)}</strong></span>
                        <span className="text-[#567C45]">Surviving: <strong>{fmt(p.tresSurviving)}</strong></span>
                        {p.treesPlanted > 0 && (
                          <span className="text-amber-600">Survival: <strong>{p.survivalRatePct}%</strong></span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : p.id)}
                        className="p-1.5 text-[#ADA082] hover:text-[#463F2E] rounded-lg hover:bg-[#EDE4D4] transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      </button>
                      <button onClick={() => openEditProj(p)} className="p-1.5 text-[#ADA082] hover:text-[#463F2E] rounded-lg hover:bg-[#EDE4D4] transition-colors">
                        <Edit2 size={13} />
                      </button>
                      <button onClick={() => { if (window.confirm('Delete this project?')) deleteTreeProject(p.id); }} className="p-1.5 text-[#ADA082] hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="mt-4 pt-4 border-t border-[#EDE4D4] space-y-4">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">CO₂/yr</p>
                          <p className="font-semibold text-[#2C2820]">{fmt(p.estimatedCo2PerYearKg)} kg</p>
                        </div>
                        <div>
                          <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">Project Cost</p>
                          <p className="font-semibold text-[#2C2820]">₹{fmt(p.totalProjectCostInr)}</p>
                        </div>
                        {p.ngoPartner && (
                          <div>
                            <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">NGO Partner</p>
                            <p className="font-semibold text-[#2C2820]">{p.ngoPartner}</p>
                          </div>
                        )}
                        {p.csrSponsor && (
                          <div>
                            <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">CSR Sponsor</p>
                            <p className="font-semibold text-[#2C2820]">{p.csrSponsor}</p>
                          </div>
                        )}
                      </div>
                      {p.nativeSpeciesList && (
                        <div className="text-xs">
                          <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">Native Species</p>
                          <p className="text-[#463F2E] mt-0.5">{p.nativeSpeciesList}</p>
                        </div>
                      )}
                      {p.notes && (
                        <div className="text-xs">
                          <p className="text-[#ADA082] uppercase tracking-wide text-[10px]">Notes</p>
                          <p className="text-[#463F2E]">{p.notes}</p>
                        </div>
                      )}

                      {/* Monitoring logs */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-xs font-semibold text-[#463F2E] flex items-center gap-1.5">
                            <BarChart2 size={12} /> Monitoring Logs ({logs.length})
                          </p>
                          <button
                            onClick={() => openAddLog(p.id)}
                            className="text-xs text-green-700 hover:text-green-900 font-medium"
                          >+ Add log</button>
                        </div>
                        {logs.length === 0 ? (
                          <p className="text-xs text-[#ADA082]">No monitoring logs yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {logs.map(l => (
                              <div key={l.id} className="flex items-start justify-between bg-[#F6F1EA] rounded-lg p-2.5 text-xs">
                                <div>
                                  <p className="font-medium text-gray-800">{l.logDate} · {l.treesSurviving}/{l.treesCounted} surviving</p>
                                  {l.healthNotes && <p className="text-[#8C8062] mt-0.5">{l.healthNotes}</p>}
                                  <p className="text-[#ADA082] mt-0.5">By: {l.monitoredBy}</p>
                                </div>
                                <button onClick={() => { if (window.confirm('Delete log?')) deleteTreeLog(l.id); }} className="text-gray-300 hover:text-red-500 ml-2">
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

      {/* Project Modal */}
      <Modal open={showProjModal} onClose={() => setShowProjModal(false)} title={editProj ? 'Edit Project' : 'New Tree Project'} size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Project Name *" value={projForm.projectName} onChange={e => setProjForm({ ...projForm, projectName: e.target.value })} />
            <Select
              label="City *"
              options={cities.map(c => ({ value: c.id, label: c.name }))}
              value={projForm.cityId}
              onChange={e => setProjForm({ ...projForm, cityId: e.target.value })}
            />
            <Select
              label="Project Type"
              options={PROJECT_TYPES.map(t => ({ value: t, label: t }))}
              value={projForm.projectType}
              onChange={e => setProjForm({ ...projForm, projectType: e.target.value })}
            />
            <Select
              label="Status"
              options={STATUS_OPTIONS.map(s => ({ value: s, label: s }))}
              value={projForm.status}
              onChange={e => setProjForm({ ...projForm, status: e.target.value as TreeProjectStatus })}
            />
            <Input label="Available Land (m²)" type="number" value={projForm.availableLandSqm.toString()} onChange={e => setProjForm({ ...projForm, availableLandSqm: parseFloat(e.target.value) || 0 })} />
            <Input label="Trees Planned" type="number" value={projForm.treesPlanned.toString()} onChange={e => setProjForm({ ...projForm, treesPlanned: parseInt(e.target.value) || 0 })} />
            <Input label="Trees Planted" type="number" value={projForm.treesPlanted.toString()} onChange={e => setProjForm({ ...projForm, treesPlanted: parseInt(e.target.value) || 0 })} />
            <Input label="Trees Surviving" type="number" value={projForm.tresSurviving.toString()} onChange={e => setProjForm({ ...projForm, tresSurviving: parseInt(e.target.value) || 0 })} />
            <Input label="Cost per Tree (₹)" type="number" value={projForm.costPerTreeInr.toString()} onChange={e => setProjForm({ ...projForm, costPerTreeInr: parseFloat(e.target.value) || 0 })} />
            <Input label="Plantation Date" type="date" value={projForm.plantationDate} onChange={e => setProjForm({ ...projForm, plantationDate: e.target.value })} />
            <Input label="NGO Partner" value={projForm.ngoPartner} onChange={e => setProjForm({ ...projForm, ngoPartner: e.target.value })} placeholder="e.g. SayTrees" />
            <Input label="CSR Sponsor" value={projForm.csrSponsor} onChange={e => setProjForm({ ...projForm, csrSponsor: e.target.value })} />
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={projForm.isMiyawakiMethod}
              onChange={e => setProjForm({ ...projForm, isMiyawakiMethod: e.target.checked })}
              className="rounded border-gray-300 text-[#567C45]"
            />
            <span className="text-sm text-[#463F2E]">Using Miyawaki method</span>
          </label>

          <TextArea
            label="Native Species List"
            value={projForm.nativeSpeciesList}
            onChange={e => setProjForm({ ...projForm, nativeSpeciesList: e.target.value })}
            rows={2}
            placeholder="e.g. Neem, Peepal, Jamun, Arjun..."
          />

          <TextArea
            label="Notes"
            value={projForm.notes}
            onChange={e => setProjForm({ ...projForm, notes: e.target.value })}
            rows={2}
          />

          {/* Cost preview */}
          <div className="bg-green-50 border border-green-100 rounded-xl p-3 text-xs">
            <p className="font-semibold text-green-900 mb-1">Calculated values</p>
            <div className="flex gap-6">
              <span>Total cost: <strong>₹{fmt(projForm.treesPlanned * projForm.costPerTreeInr)}</strong></span>
              <span>Survival rate: <strong>{projForm.treesPlanted > 0 ? Math.round((projForm.tresSurviving / projForm.treesPlanted) * 100) : 0}%</strong></span>
              <span>CO₂/yr: <strong>{fmt(projForm.tresSurviving * 21)} kg</strong></span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={saveProj} className="flex-1 bg-green-700 hover:bg-green-800" disabled={!projForm.projectName.trim() || !projForm.cityId}>
              {editProj ? 'Save Changes' : 'Create Project'}
            </Button>
            <Button variant="ghost" onClick={() => setShowProjModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Log Modal */}
      <Modal open={!!showLogModal} onClose={() => setShowLogModal(null)} title="Add Monitoring Log">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Date" type="date" value={logForm.logDate} onChange={e => setLogForm({ ...logForm, logDate: e.target.value })} />
            <Input label="Monitored By" value={logForm.monitoredBy} onChange={e => setLogForm({ ...logForm, monitoredBy: e.target.value })} />
            <Input label="Trees Counted" type="number" value={logForm.treesCounted.toString()} onChange={e => setLogForm({ ...logForm, treesCounted: parseInt(e.target.value) || 0 })} />
            <Input label="Trees Surviving" type="number" value={logForm.treesSurviving.toString()} onChange={e => setLogForm({ ...logForm, treesSurviving: parseInt(e.target.value) || 0 })} />
          </div>
          <TextArea label="Health Notes" value={logForm.healthNotes} onChange={e => setLogForm({ ...logForm, healthNotes: e.target.value })} rows={2} />
          <div className="flex gap-3">
            <Button onClick={saveLog} className="flex-1 bg-green-700 hover:bg-green-800">Save Log</Button>
            <Button variant="ghost" onClick={() => setShowLogModal(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
