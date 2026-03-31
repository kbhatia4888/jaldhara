import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import type { Audit } from '../types';
import { Plus, ClipboardList, TrendingUp, Droplets } from 'lucide-react';
import { format } from 'date-fns';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

export default function Audits() {
  const { state, addAudit } = useStore();
  const { audits, buildings, areas, cities, states: statesData } = state;

  const [filterCity, setFilterCity] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [selectedAudit, setSelectedAudit] = useState<Audit | null>(null);

  const [form, setForm] = useState({
    buildingId: '',
    date: new Date().toISOString().split('T')[0],
    currentWaterBill: '',
    tankerSpend: '',
    borewellDepth: '',
    tdsLevel: '',
    recommendedSystem: '',
    potentialSavings: '',
    notes: '',
    conductedBy: '',
  });

  const filteredCities = useMemo(() => cities, [cities]);
  const filteredAreas = useMemo(() =>
    filterCity ? areas.filter(a => a.cityId === filterCity) : areas,
    [areas, filterCity]
  );

  const enrichedAudits = useMemo(() => {
    return audits
      .map(audit => {
        const building = buildings.find(b => b.id === audit.buildingId);
        const area = building ? areas.find(a => a.id === building.areaId) : null;
        const city = building ? cities.find(c => c.id === building.cityId) : null;
        return { audit, building, area, city };
      })
      .filter(({ building, city, area }) => {
        if (filterCity && building?.cityId !== filterCity) return false;
        if (filterArea && building?.areaId !== filterArea) return false;
        if (filterType && building?.type !== filterType) return false;
        return true;
      })
      .sort((a, b) => new Date(b.audit.date).getTime() - new Date(a.audit.date).getTime());
  }, [audits, buildings, areas, cities, filterCity, filterArea, filterType]);

  const totalSavings = useMemo(() =>
    audits.reduce((s, a) => s + a.potentialSavings, 0), [audits]
  );
  const avgTDS = useMemo(() => {
    if (!audits.length) return 0;
    return Math.round(audits.reduce((s, a) => s + a.tdsLevel, 0) / audits.length);
  }, [audits]);

  function handleSubmit() {
    if (!form.buildingId || !form.date) return;
    addAudit({
      buildingId: form.buildingId,
      date: form.date,
      currentWaterBill: parseInt(form.currentWaterBill) || 0,
      tankerSpend: parseInt(form.tankerSpend) || 0,
      borewellDepth: parseInt(form.borewellDepth) || 0,
      tdsLevel: parseInt(form.tdsLevel) || 0,
      recommendedSystem: form.recommendedSystem,
      potentialSavings: parseInt(form.potentialSavings) || 0,
      notes: form.notes,
      conductedBy: form.conductedBy,
    });
    setShowModal(false);
    setForm({
      buildingId: '', date: new Date().toISOString().split('T')[0],
      currentWaterBill: '', tankerSpend: '', borewellDepth: '', tdsLevel: '',
      recommendedSystem: '', potentialSavings: '', notes: '', conductedBy: '',
    });
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audits</h1>
          <p className="text-gray-500 text-sm">Water audit records and findings</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus size={16} className="mr-1" /> Add Audit
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="bg-blue-100 p-3 rounded-xl">
              <ClipboardList size={20} className="text-blue-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Audits</p>
              <p className="text-2xl font-bold text-gray-900">{audits.length}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="bg-green-100 p-3 rounded-xl">
              <TrendingUp size={20} className="text-green-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Potential Savings</p>
              <p className="text-2xl font-bold text-gray-900">{fmtLakh(totalSavings)}</p>
              <p className="text-xs text-gray-400">per year</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3">
            <div className="bg-teal-100 p-3 rounded-xl">
              <Droplets size={20} className="text-teal-700" />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Avg TDS Level</p>
              <p className="text-2xl font-bold text-gray-900">{avgTDS} <span className="text-base font-normal text-gray-500">ppm</span></p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="py-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Select
              placeholder="All Cities"
              options={filteredCities.map(c => ({ value: c.id, label: c.name }))}
              value={filterCity}
              onChange={e => { setFilterCity(e.target.value); setFilterArea(''); }}
            />
            <Select
              placeholder="All Areas"
              options={filteredAreas.map(a => ({ value: a.id, label: a.name }))}
              value={filterArea}
              onChange={e => setFilterArea(e.target.value)}
            />
            <Select
              placeholder="All Types"
              options={['Apartment', 'Hospital', 'Hotel', 'Hostel', 'Commercial', 'School', 'Other'].map(t => ({ value: t, label: t }))}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Audits Table */}
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Building</TH>
              <TH>Area / City</TH>
              <TH>Date</TH>
              <TH>Water Bill/mo</TH>
              <TH>Tanker Spend/mo</TH>
              <TH>TDS (ppm)</TH>
              <TH>Borewell</TH>
              <TH>Potential Savings</TH>
              <TH>Conducted By</TH>
            </TR>
          </THead>
          <TBody>
            {enrichedAudits.map(({ audit, building, area, city }) => (
              <TR key={audit.id} onClick={() => setSelectedAudit(audit)}>
                <TD>
                  <div className="font-medium text-gray-900">{building?.name || 'Unknown'}</div>
                  <div className="text-xs text-gray-400">{building?.type}</div>
                </TD>
                <TD>
                  <div>{area?.name || '-'}</div>
                  <div className="text-xs text-gray-400">{city?.name || '-'}</div>
                </TD>
                <TD>{format(new Date(audit.date), 'dd MMM yyyy')}</TD>
                <TD>{fmtCurrency(audit.currentWaterBill)}</TD>
                <TD>{fmtCurrency(audit.tankerSpend)}</TD>
                <TD>
                  <span className={audit.tdsLevel > 1000 ? 'text-red-600 font-semibold' : audit.tdsLevel > 600 ? 'text-yellow-600' : 'text-green-600'}>
                    {audit.tdsLevel}
                  </span>
                </TD>
                <TD>{audit.borewellDepth}m</TD>
                <TD className="font-semibold text-teal-700">{fmtLakh(audit.potentialSavings)}</TD>
                <TD>{audit.conductedBy}</TD>
              </TR>
            ))}
            {enrichedAudits.length === 0 && (
              <TR>
                <TD className="text-center text-gray-400 py-8" colSpan={9}>
                  No audits found.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>

      {/* Audit Detail Modal */}
      {selectedAudit && (
        <Modal
          open={!!selectedAudit}
          onClose={() => setSelectedAudit(null)}
          title="Audit Details"
          size="lg"
        >
          {(() => {
            const building = buildings.find(b => b.id === selectedAudit.buildingId);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500">Building</p>
                    <p className="font-semibold text-gray-900">{building?.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Date</p>
                    <p className="font-semibold text-gray-900">{format(new Date(selectedAudit.date), 'dd MMM yyyy')}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Water Bill</p>
                    <p className="font-semibold text-gray-900">{fmtCurrency(selectedAudit.currentWaterBill)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Monthly Tanker Spend</p>
                    <p className="font-semibold text-gray-900">{fmtCurrency(selectedAudit.tankerSpend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">TDS Level</p>
                    <p className={`font-semibold ${selectedAudit.tdsLevel > 1000 ? 'text-red-600' : selectedAudit.tdsLevel > 600 ? 'text-yellow-600' : 'text-green-600'}`}>
                      {selectedAudit.tdsLevel} ppm
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Borewell Depth</p>
                    <p className="font-semibold text-gray-900">{selectedAudit.borewellDepth}m</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Recommended System</p>
                  <p className="font-medium text-gray-900 mt-1">{selectedAudit.recommendedSystem}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-4">
                  <p className="text-xs text-green-600 font-medium">Annual Potential Savings</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{fmtCurrency(selectedAudit.potentialSavings)}</p>
                </div>
                {selectedAudit.notes && (
                  <div>
                    <p className="text-xs text-gray-500">Notes</p>
                    <p className="text-sm text-gray-700 mt-1">{selectedAudit.notes}</p>
                  </div>
                )}
                <p className="text-xs text-gray-400">Conducted by: {selectedAudit.conductedBy}</p>
              </div>
            );
          })()}
        </Modal>
      )}

      {/* Add Audit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add New Audit" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Building *"
              options={buildings.map(b => ({ value: b.id, label: b.name }))}
              placeholder="Select building"
              value={form.buildingId}
              onChange={e => setForm({ ...form, buildingId: e.target.value })}
            />
          </div>
          <Input label="Audit Date *" type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
          <Input label="Conducted By" value={form.conductedBy} onChange={e => setForm({ ...form, conductedBy: e.target.value })} placeholder="e.g. Arjun Mehta" />
          <Input label="Monthly Water Bill (₹)" type="number" value={form.currentWaterBill} onChange={e => setForm({ ...form, currentWaterBill: e.target.value })} />
          <Input label="Monthly Tanker Spend (₹)" type="number" value={form.tankerSpend} onChange={e => setForm({ ...form, tankerSpend: e.target.value })} />
          <Input label="Borewell Depth (m)" type="number" value={form.borewellDepth} onChange={e => setForm({ ...form, borewellDepth: e.target.value })} />
          <Input label="TDS Level (ppm)" type="number" value={form.tdsLevel} onChange={e => setForm({ ...form, tdsLevel: e.target.value })} />
          <Input label="Annual Potential Savings (₹)" type="number" value={form.potentialSavings} onChange={e => setForm({ ...form, potentialSavings: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Recommended System" value={form.recommendedSystem} onChange={e => setForm({ ...form, recommendedSystem: e.target.value })} placeholder="e.g. STP 30KLD + RO Plant 10KLD" />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSubmit} className="flex-1">Add Audit</Button>
          <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
