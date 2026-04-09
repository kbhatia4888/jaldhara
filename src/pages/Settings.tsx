import React, { useState } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import type { Manufacturer, CsrPartner, CsrStatus } from '../types';
import { Settings as SettingsIcon, User, Map, FileText, Building2, Database, Plus, Edit2, Trash2, CheckCircle2, Heart } from 'lucide-react';

const CSR_STATUSES: CsrStatus[] = ['Prospect', 'Conversation', 'Proposal Sent', 'Active', 'Completed'];
const CSR_FOCUS_OPTIONS = [
  'Urban reforestation', 'Lake/water body restoration', 'Rainwater harvesting',
  'Greywater recycling', 'Waste management', 'Community water access',
  'Biodiversity', 'Carbon sequestration', 'Education', 'Other',
];

export default function Settings() {
  const { state, updateSettings, addManufacturer, updateManufacturer, deleteManufacturer, resetState, addCsrPartner, updateCsrPartner, deleteCsrPartner } = useStore();
  const { settings, manufacturers, csrPartners } = state;

  const [saved, setSaved] = useState(false);
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showMfrModal, setShowMfrModal] = useState(false);
  const [editMfr, setEditMfr] = useState<Manufacturer | null>(null);
  const [mfrForm, setMfrForm] = useState<Omit<Manufacturer, 'id'>>({
    name: '', city: '', website: '', contactName: '', contactPhone: '', email: '',
    commissionRatePct: 12, speciality: '', citiesCovered: [], notes: '', active: true,
  });
  const [showCsrModal, setShowCsrModal] = useState(false);
  const [editCsr, setEditCsr] = useState<CsrPartner | null>(null);
  const [csrForm, setCsrForm] = useState<Omit<CsrPartner, 'id' | 'createdAt'>>({
    companyName: '', contactName: '', contactEmail: '', contactPhone: '',
    csrFocusAreas: [], typicalBudgetInr: undefined, preferredProjectTypes: '',
    relationshipStatus: 'Prospect', notes: '',
  });

  function saveSettings() {
    updateSettings(localSettings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function exportData() {
    const json = JSON.stringify(state, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jaldrishti_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function exportAnonymised() {
    const anonymised = {
      ...state,
      buildings: state.buildings.map((b, idx) => ({
        ...b,
        name: `Building_${String(idx + 1).padStart(3, '0')}`,
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        lat: undefined,
        lng: undefined,
        notes: '',
        painQuote: '',
      })),
    };
    const headers = ['id', 'type', 'areaId', 'cityId', 'stateId', 'status', 'monthlyWaterSpend', 'tankerCountPerMonth', 'dailyWaterConsumption', 'floors', 'flats', 'occupancyCount', 'greywaterPotentialLpd', 'djbRebateAnnual'];
    const rows = anonymised.buildings.map(b =>
      headers.map(h => (b as Record<string, unknown>)[h] ?? '').join(',')
    );
    const csv = [
      '# Anonymised water consumption dataset',
      `# ${state.buildings.length} buildings — Delhi — Independent audit, no commercial affiliation`,
      `# Generated: ${new Date().toISOString()}`,
      headers.join(','),
      ...rows,
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jaldrishti_anonymised_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function openAddMfr() {
    setEditMfr(null);
    setMfrForm({ name: '', city: '', website: '', contactName: '', contactPhone: '', email: '', commissionRatePct: 12, speciality: '', citiesCovered: [], notes: '', active: true });
    setShowMfrModal(true);
  }

  function openEditMfr(m: Manufacturer) {
    setEditMfr(m);
    setMfrForm({ ...m });
    setShowMfrModal(true);
  }

  function saveMfr() {
    if (!mfrForm.name.trim()) return;
    if (editMfr) {
      updateManufacturer({ ...editMfr, ...mfrForm });
    } else {
      addManufacturer(mfrForm);
    }
    setShowMfrModal(false);
  }

  function handleDeleteMfr(id: string) {
    if (window.confirm('Delete this manufacturer?')) deleteManufacturer(id);
  }

  function openAddCsr() {
    setEditCsr(null);
    setCsrForm({ companyName: '', contactName: '', contactEmail: '', contactPhone: '', csrFocusAreas: [], preferredProjectTypes: '', relationshipStatus: 'Prospect', notes: '' });
    setShowCsrModal(true);
  }

  function openEditCsr(c: CsrPartner) {
    setEditCsr(c);
    setCsrForm({ companyName: c.companyName, contactName: c.contactName ?? '', contactEmail: c.contactEmail ?? '', contactPhone: c.contactPhone ?? '', csrFocusAreas: c.csrFocusAreas, typicalBudgetInr: c.typicalBudgetInr, preferredProjectTypes: c.preferredProjectTypes ?? '', relationshipStatus: c.relationshipStatus, notes: c.notes ?? '' });
    setShowCsrModal(true);
  }

  function saveCsr() {
    if (!csrForm.companyName.trim()) return;
    if (editCsr) {
      updateCsrPartner({ ...editCsr, ...csrForm });
    } else {
      addCsrPartner({ ...csrForm, createdAt: new Date().toISOString() });
    }
    setShowCsrModal(false);
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <SettingsIcon size={22} className="text-[#0F6E56]" />
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">Configure your business profile and preferences</p>
      </div>

      {/* Consultant Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <User size={16} className="text-[#0F6E56]" />
            <h2 className="font-semibold text-gray-900">Consultant Profile</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Your Name"
              value={localSettings.consultantName}
              onChange={e => setLocalSettings({ ...localSettings, consultantName: e.target.value })}
            />
            <Input
              label="Phone"
              value={localSettings.consultantPhone}
              onChange={e => setLocalSettings({ ...localSettings, consultantPhone: e.target.value })}
            />
            <Input
              label="Email"
              value={localSettings.consultantEmail}
              onChange={e => setLocalSettings({ ...localSettings, consultantEmail: e.target.value })}
            />
            <Input
              label="Business Address"
              value={localSettings.businessAddress}
              onChange={e => setLocalSettings({ ...localSettings, businessAddress: e.target.value })}
            />
            <Input
              label="MSME Number"
              value={localSettings.msmeNumber}
              onChange={e => setLocalSettings({ ...localSettings, msmeNumber: e.target.value })}
              placeholder="Optional"
            />
            <Input
              label="GST Number"
              value={localSettings.gstNumber}
              onChange={e => setLocalSettings({ ...localSettings, gstNumber: e.target.value })}
              placeholder="Optional"
            />
          </div>
        </CardBody>
      </Card>

      {/* Phase Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 size={16} className="text-[#0F6E56]" />
            <h2 className="font-semibold text-gray-900">Phase Settings</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <Select
            label="Current Business Phase"
            options={[
              { value: '1', label: 'Phase 1 — Referral Commissions' },
              { value: '2', label: 'Phase 2 — Own Installations + AMC' },
              { value: '3', label: 'Phase 3 — Water-as-a-Service (WaaS)' },
            ]}
            value={localSettings.currentPhase.toString()}
            onChange={e => setLocalSettings({ ...localSettings, currentPhase: parseInt(e.target.value) as 1 | 2 | 3 })}
          />
          <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 text-sm text-teal-800">
            <strong>Phase 1:</strong> Conduct audits, refer buildings to manufacturers, earn 10–15% commission. Goal: ₹5L in commissions.<br />
            <strong>Phase 2:</strong> Own installations. Source components, manage civil contractors. Earn full margin + AMC.<br />
            <strong>Phase 3:</strong> Water-as-a-Service. Zero upfront cost to customer. Monthly fee or per-KL billing.
          </div>
        </CardBody>
      </Card>

      {/* Map Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Map size={16} className="text-[#0F6E56]" />
            <h2 className="font-semibold text-gray-900">Map Settings</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-4">
          <Input
            label="Mapbox Public Token"
            value={localSettings.mapboxToken}
            onChange={e => setLocalSettings({ ...localSettings, mapboxToken: e.target.value })}
            placeholder="pk.eyJ1..."
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Default Map Latitude"
              type="number"
              value={localSettings.defaultMapLat.toString()}
              onChange={e => setLocalSettings({ ...localSettings, defaultMapLat: parseFloat(e.target.value) })}
            />
            <Input
              label="Default Map Longitude"
              type="number"
              value={localSettings.defaultMapLng.toString()}
              onChange={e => setLocalSettings({ ...localSettings, defaultMapLng: parseFloat(e.target.value) })}
            />
          </div>
          <p className="text-xs text-gray-400">Get a free Mapbox token at mapbox.com. Used for map pins in the CRM.</p>
        </CardBody>
      </Card>

      {/* Report Settings */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText size={16} className="text-[#0F6E56]" />
            <h2 className="font-semibold text-gray-900">Report Settings</h2>
          </div>
        </CardHeader>
        <CardBody>
          <TextArea
            label="Report Footer (appears on every audit PDF)"
            value={localSettings.reportFooter}
            onChange={e => setLocalSettings({ ...localSettings, reportFooter: e.target.value })}
            rows={3}
          />
          <p className="text-xs text-amber-600 font-medium mt-2">
            ⚠ This text must always state your independence from manufacturers. Do not remove the independence declaration.
          </p>
        </CardBody>
      </Card>

      {/* Save button */}
      <div>
        <Button onClick={saveSettings} className="w-full sm:w-auto">
          {saved ? <><CheckCircle2 size={16} className="mr-1" /> Saved!</> : 'Save Settings'}
        </Button>
      </div>

      {/* Manufacturer Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 size={16} className="text-[#0F6E56]" />
              <h2 className="font-semibold text-gray-900">Manufacturers</h2>
            </div>
            <Button size="sm" onClick={openAddMfr}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {manufacturers.map(m => (
            <div key={m.id} className="flex items-start justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 text-sm">{m.name}</p>
                  <span className="text-xs text-[#0F6E56] font-semibold">{m.commissionRatePct}%</span>
                  {!m.active && <span className="text-xs text-gray-400 bg-gray-200 px-1.5 py-0.5 rounded">Inactive</span>}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{m.city} · {m.contactName} · {m.contactPhone}</p>
                <p className="text-xs text-gray-600 mt-0.5 truncate max-w-md">{m.speciality}</p>
              </div>
              <div className="flex gap-1.5 flex-shrink-0 ml-3">
                <button onClick={() => openEditMfr(m)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-white transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => handleDeleteMfr(m.id)} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* CSR Partners */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Heart size={16} className="text-[#0F6E56]" />
              <h2 className="font-semibold text-gray-900">CSR Partners</h2>
            </div>
            <Button size="sm" onClick={openAddCsr}>
              <Plus size={14} className="mr-1" /> Add
            </Button>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          {csrPartners.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">No CSR partners yet. Add NGOs, foundations, and corporates who can co-fund environmental projects.</p>
          )}
          {csrPartners.map(c => (
            <div key={c.id} className="flex items-start justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-gray-900 text-sm">{c.companyName}</p>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">{c.relationshipStatus}</span>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">{c.contactName}{c.contactEmail ? ` · ${c.contactEmail}` : ''}</p>
                {c.csrFocusAreas.length > 0 && (
                  <p className="text-xs text-gray-600 mt-0.5 truncate max-w-md">{c.csrFocusAreas.join(', ')}</p>
                )}
                {c.typicalBudgetInr && (
                  <p className="text-xs text-[#0F6E56] mt-0.5">Budget: ₹{c.typicalBudgetInr.toLocaleString('en-IN')}</p>
                )}
              </div>
              <div className="flex gap-1.5 flex-shrink-0 ml-3">
                <button onClick={() => openEditCsr(c)} className="p-1.5 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-white transition-colors">
                  <Edit2 size={13} />
                </button>
                <button onClick={() => { if (window.confirm('Delete this CSR partner?')) deleteCsrPartner(c.id); }} className="p-1.5 text-gray-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          ))}
        </CardBody>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database size={16} className="text-[#0F6E56]" />
            <h2 className="font-semibold text-gray-900">Data Management</h2>
          </div>
        </CardHeader>
        <CardBody className="space-y-3">
          <div className="flex flex-wrap gap-3">
            <Button variant="ghost" onClick={exportData}>
              Export Full Backup (JSON)
            </Button>
            <Button variant="ghost" onClick={exportAnonymised}>
              Export Anonymised Dataset (CSV)
            </Button>
            <Button
              variant="ghost"
              onClick={() => { updateSettings({ onboardingComplete: false }); window.location.reload(); }}
              className="text-[#534AB7] hover:bg-purple-50 border-purple-200"
            >
              Start Welcome Tour Again
            </Button>
            <Button
              variant="ghost"
              onClick={() => setShowResetConfirm(true)}
              className="text-red-600 hover:bg-red-50 border-red-200"
            >
              Reset to Seed Data
            </Button>
          </div>
          <p className="text-xs text-gray-400">
            The anonymised CSV export strips contact names, phones, and GPS coordinates. Suitable for sharing with ESG lenders, developers, or government bodies.
          </p>
        </CardBody>
      </Card>

      {/* Reset confirmation modal */}
      <Modal open={showResetConfirm} onClose={() => setShowResetConfirm(false)} title="Reset All Data?">
        <p className="text-sm text-gray-700">
          This will delete all your buildings, deals, audits, and referrals and restore the demo seed data. This cannot be undone.
        </p>
        <p className="text-sm font-semibold text-red-600 mt-2">Consider exporting a backup first.</p>
        <div className="flex gap-3 mt-6">
          <Button
            onClick={() => { resetState(); setShowResetConfirm(false); }}
            className="flex-1 bg-red-600 hover:bg-red-700"
          >
            Yes, Reset Everything
          </Button>
          <Button variant="ghost" onClick={() => setShowResetConfirm(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>

      {/* CSR Partner modal */}
      <Modal open={showCsrModal} onClose={() => setShowCsrModal(false)} title={editCsr ? 'Edit CSR Partner' : 'Add CSR Partner'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Company / Organisation Name *" value={csrForm.companyName} onChange={e => setCsrForm({ ...csrForm, companyName: e.target.value })} />
          <Input label="Contact Name" value={csrForm.contactName ?? ''} onChange={e => setCsrForm({ ...csrForm, contactName: e.target.value })} />
          <Input label="Contact Email" value={csrForm.contactEmail ?? ''} onChange={e => setCsrForm({ ...csrForm, contactEmail: e.target.value })} />
          <Input label="Contact Phone" value={csrForm.contactPhone ?? ''} onChange={e => setCsrForm({ ...csrForm, contactPhone: e.target.value })} />
          <Select
            label="Relationship Status"
            options={CSR_STATUSES.map(s => ({ value: s, label: s }))}
            value={csrForm.relationshipStatus}
            onChange={e => setCsrForm({ ...csrForm, relationshipStatus: e.target.value as CsrStatus })}
          />
          <Input label="Typical Annual Budget (₹)" type="number" value={csrForm.typicalBudgetInr?.toString() ?? ''} onChange={e => setCsrForm({ ...csrForm, typicalBudgetInr: parseFloat(e.target.value) || undefined })} placeholder="e.g. 500000" />
        </div>
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-700 mb-2">CSR Focus Areas</p>
          <div className="grid grid-cols-2 gap-2">
            {CSR_FOCUS_OPTIONS.map(opt => (
              <label key={opt} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={csrForm.csrFocusAreas.includes(opt)}
                  onChange={e => {
                    const arr = e.target.checked
                      ? [...csrForm.csrFocusAreas, opt]
                      : csrForm.csrFocusAreas.filter(a => a !== opt);
                    setCsrForm({ ...csrForm, csrFocusAreas: arr });
                  }}
                  className="rounded border-gray-300 text-[#0F6E56]"
                />
                <span className="text-xs text-gray-700">{opt}</span>
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4 sm:col-span-2">
          <TextArea label="Notes / Preferred Project Types" value={csrForm.notes ?? ''} onChange={e => setCsrForm({ ...csrForm, notes: e.target.value })} rows={2} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={saveCsr} className="flex-1" disabled={!csrForm.companyName.trim()}>{editCsr ? 'Save Changes' : 'Add CSR Partner'}</Button>
          <Button variant="ghost" onClick={() => setShowCsrModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>

      {/* Manufacturer modal */}
      <Modal open={showMfrModal} onClose={() => setShowMfrModal(false)} title={editMfr ? 'Edit Manufacturer' : 'Add Manufacturer'} size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Name *" value={mfrForm.name} onChange={e => setMfrForm({ ...mfrForm, name: e.target.value })} />
          <Input label="City" value={mfrForm.city} onChange={e => setMfrForm({ ...mfrForm, city: e.target.value })} />
          <Input label="Website" value={mfrForm.website || ''} onChange={e => setMfrForm({ ...mfrForm, website: e.target.value })} />
          <Input label="Commission Rate %" type="number" value={mfrForm.commissionRatePct.toString()} onChange={e => setMfrForm({ ...mfrForm, commissionRatePct: parseFloat(e.target.value) || 0 })} />
          <Input label="Contact Name" value={mfrForm.contactName || ''} onChange={e => setMfrForm({ ...mfrForm, contactName: e.target.value })} />
          <Input label="Contact Phone" value={mfrForm.contactPhone || ''} onChange={e => setMfrForm({ ...mfrForm, contactPhone: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Speciality" value={mfrForm.speciality} onChange={e => setMfrForm({ ...mfrForm, speciality: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Notes" value={mfrForm.notes || ''} onChange={e => setMfrForm({ ...mfrForm, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={saveMfr} className="flex-1">{editMfr ? 'Save Changes' : 'Add Manufacturer'}</Button>
          <Button variant="ghost" onClick={() => setShowMfrModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
