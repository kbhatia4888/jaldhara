import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge, getDealStageBadgeVariant, getBuildingStatusBadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MapView } from '../components/maps/MapView';
import type { Building, Deal, Audit } from '../types';
import {
  Plus, Map, List, Phone, Mail, Building2, Calendar, Droplets, ChevronRight, X,
} from 'lucide-react';
import { format } from 'date-fns';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const BUILDING_TYPES = ['Apartment', 'Hospital', 'Hotel', 'Hostel', 'Commercial', 'School', 'Other'];
const BUILDING_STATUSES = ['Cold', 'Warm Lead', 'Prospect', 'Won', 'Lost'];
const DEAL_STAGES = ['New', 'Contacted', 'Audit Scheduled', 'Audit Done', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export default function CRM() {
  const { state, addBuilding, updateBuilding, addDeal, updateDeal } = useStore();
  const { buildings, deals, areas, cities, states: statesData, audits } = state;

  const [view, setView] = useState<'list' | 'map'>('list');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  // New building form
  const [bForm, setBForm] = useState({
    name: '', areaId: '', cityId: '', stateId: '',
    type: 'Apartment' as Building['type'],
    lat: '28.7041', lng: '77.1025',
    tankerCostAnnual: '', status: 'Cold' as Building['status'],
    contactName: '', contactPhone: '', contactEmail: '', notes: '',
    floors: '', flats: '', dailyWaterConsumption: '',
  });

  // New deal form
  const [dForm, setDForm] = useState({
    stage: 'New' as Deal['stage'],
    value: '', waterSavedKLD: '', notes: '', closedAt: '',
  });

  const filteredCities = useMemo(() =>
    filterState ? cities.filter(c => c.stateId === filterState) : cities,
    [cities, filterState]
  );
  const filteredAreas = useMemo(() =>
    filterCity ? areas.filter(a => a.cityId === filterCity) : areas,
    [areas, filterCity]
  );

  const bFormAreas = useMemo(() =>
    bForm.cityId ? areas.filter(a => a.cityId === bForm.cityId) : areas,
    [areas, bForm.cityId]
  );

  const filteredBuildings = useMemo(() => {
    return buildings.filter(b => {
      if (filterState) {
        const city = cities.find(c => c.id === b.cityId);
        if (!city || city.stateId !== filterState) return false;
      }
      if (filterCity && b.cityId !== filterCity) return false;
      if (filterArea && b.areaId !== filterArea) return false;
      if (filterType && b.type !== filterType) return false;
      if (filterStatus && b.status !== filterStatus) return false;
      return true;
    });
  }, [buildings, cities, filterState, filterCity, filterArea, filterType, filterStatus]);

  const getAreaName = (areaId: string) => areas.find(a => a.id === areaId)?.name || '-';
  const getCityName = (cityId: string) => cities.find(c => c.id === cityId)?.name || '-';
  const getBuildingDeals = (buildingId: string) => deals.filter(d => d.buildingId === buildingId);
  const getBuildingAudits = (buildingId: string): Audit[] => audits.filter(a => a.buildingId === buildingId);
  const getLatestDeal = (buildingId: string) => {
    const bDeals = getBuildingDeals(buildingId);
    if (!bDeals.length) return null;
    return bDeals.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };

  function handleAddBuilding() {
    if (!bForm.name || !bForm.cityId || !bForm.areaId) return;
    addBuilding({
      name: bForm.name,
      areaId: bForm.areaId,
      cityId: bForm.cityId,
      stateId: bForm.stateId || cities.find(c => c.id === bForm.cityId)?.stateId || '',
      type: bForm.type,
      lat: parseFloat(bForm.lat) || 28.7041,
      lng: parseFloat(bForm.lng) || 77.1025,
      tankerCostAnnual: parseInt(bForm.tankerCostAnnual) || 0,
      status: bForm.status,
      contactName: bForm.contactName,
      contactPhone: bForm.contactPhone,
      contactEmail: bForm.contactEmail,
      notes: bForm.notes,
      createdAt: new Date().toISOString().split('T')[0],
      floors: parseInt(bForm.floors) || 0,
      flats: parseInt(bForm.flats) || 0,
      dailyWaterConsumption: parseInt(bForm.dailyWaterConsumption) || 0,
    });
    setShowAddBuilding(false);
    setBForm({
      name: '', areaId: '', cityId: '', stateId: '',
      type: 'Apartment', lat: '28.7041', lng: '77.1025',
      tankerCostAnnual: '', status: 'Cold',
      contactName: '', contactPhone: '', contactEmail: '', notes: '',
      floors: '', flats: '', dailyWaterConsumption: '',
    });
  }

  function handleAddDeal() {
    if (!selectedBuilding) return;
    const payload = {
      buildingId: selectedBuilding.id,
      stage: dForm.stage,
      value: parseInt(dForm.value) || 0,
      waterSavedKLD: parseInt(dForm.waterSavedKLD) || 0,
      notes: dForm.notes,
      createdAt: new Date().toISOString().split('T')[0],
      closedAt: dForm.closedAt || undefined,
    };
    if (editDeal) {
      updateDeal({ ...editDeal, ...payload });
    } else {
      addDeal(payload);
    }
    setShowAddDeal(false);
    setEditDeal(null);
    setDForm({ stage: 'New', value: '', waterSavedKLD: '', notes: '', closedAt: '' });
  }

  function openEditDeal(deal: Deal) {
    setEditDeal(deal);
    setDForm({
      stage: deal.stage,
      value: String(deal.value),
      waterSavedKLD: String(deal.waterSavedKLD),
      notes: deal.notes,
      closedAt: deal.closedAt || '',
    });
    setShowAddDeal(true);
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2820]">CRM</h1>
          <p className="text-[#8C8062] text-sm">Manage buildings and deals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-[#EDE4D4] rounded-lg p-1">
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                view === 'list' ? 'bg-white shadow-sm text-[#2C2820]' : 'text-[#8C8062] hover:text-[#463F2E]'
              }`}
            >
              <List size={16} /> List
            </button>
            <button
              onClick={() => setView('map')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${
                view === 'map' ? 'bg-white shadow-sm text-[#2C2820]' : 'text-[#8C8062] hover:text-[#463F2E]'
              }`}
            >
              <Map size={16} /> Map
            </button>
          </div>
          <Button onClick={() => setShowAddBuilding(true)} size="sm">
            <Plus size={16} className="mr-1" /> Add Building
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardBody className="py-3">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select
              placeholder="All States"
              options={statesData.map(s => ({ value: s.id, label: s.name }))}
              value={filterState}
              onChange={e => { setFilterState(e.target.value); setFilterCity(''); setFilterArea(''); }}
            />
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
              options={BUILDING_TYPES.map(t => ({ value: t, label: t }))}
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            />
            <Select
              placeholder="All Statuses"
              options={BUILDING_STATUSES.map(s => ({ value: s, label: s }))}
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
            />
          </div>
        </CardBody>
      </Card>

      {/* Map View */}
      {view === 'map' && (
        <MapView
          buildings={filteredBuildings}
          deals={deals}
          onBuildingClick={setSelectedBuilding}
        />
      )}

      {/* List View */}
      {view === 'list' && (
        <Card>
          <Table>
            <THead>
              <TR>
                <TH>Building</TH>
                <TH>Area / City</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Tanker Cost/yr</TH>
                <TH>Deal Stage</TH>
                <TH>Contact</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {filteredBuildings.map(building => {
                const latestDeal = getLatestDeal(building.id);
                return (
                  <TR key={building.id} onClick={() => setSelectedBuilding(building)}>
                    <TD>
                      <div className="font-medium text-[#2C2820]">{building.name}</div>
                      <div className="text-xs text-[#ADA082]">{(building.flats ?? 0) > 0 ? `${building.flats} flats` : `${building.floors ?? 0} floors`}</div>
                    </TD>
                    <TD>
                      <div>{getAreaName(building.areaId)}</div>
                      <div className="text-xs text-[#ADA082]">{getCityName(building.cityId)}</div>
                    </TD>
                    <TD><Badge>{building.type}</Badge></TD>
                    <TD><Badge variant={getBuildingStatusBadgeVariant(building.status)}>{building.status}</Badge></TD>
                    <TD className="font-semibold text-[#463F2E]">{fmtLakh(building.monthlyWaterSpend ? building.monthlyWaterSpend * 12 : (building.tankerCostAnnual ?? 0))}</TD>
                    <TD>
                      {latestDeal ? (
                        <Badge variant={getDealStageBadgeVariant(latestDeal.stage)}>{latestDeal.stage}</Badge>
                      ) : (
                        <span className="text-[#ADA082] text-xs">—</span>
                      )}
                    </TD>
                    <TD>
                      <div className="text-sm">{building.contactName}</div>
                      <div className="text-xs text-[#ADA082]">{building.contactPhone}</div>
                    </TD>
                    <TD>
                      <ChevronRight size={16} className="text-[#ADA082]" />
                    </TD>
                  </TR>
                );
              })}
              {filteredBuildings.length === 0 && (
                <TR>
                  <TD className="text-center text-[#ADA082] py-8" colSpan={8}>
                    No buildings found. Adjust filters or add a building.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </Card>
      )}

      {/* Building Detail Side Panel */}
      {selectedBuilding && (
        <div className="fixed inset-y-0 right-0 w-full sm:w-[480px] bg-white shadow-2xl z-50 flex flex-col overflow-hidden border-l border-[#E2D5BE]">
          {/* Panel header */}
          <div className="bg-blue-900 text-white px-6 py-4 flex-shrink-0">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold">{selectedBuilding.name}</h2>
                <p className="text-blue-300 text-sm mt-0.5">
                  {getAreaName(selectedBuilding.areaId)} · {getCityName(selectedBuilding.cityId)}
                </p>
              </div>
              <button
                onClick={() => setSelectedBuilding(null)}
                className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-blue-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="p-5 space-y-5">
              {/* Building info */}
              <div className="grid grid-cols-2 gap-3">
                <InfoItem icon={Building2} label="Type" value={selectedBuilding.type} />
                <InfoItem icon={Droplets} label="Daily Water" value={`${selectedBuilding.dailyWaterConsumption} KLD`} />
                <InfoItem icon={Calendar} label="Added" value={format(new Date(selectedBuilding.createdAt), 'dd MMM yyyy')} />
                <InfoItem icon={Building2} label="Floors / Flats" value={`${selectedBuilding.floors} / ${selectedBuilding.flats}`} />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-red-50 rounded-xl p-3">
                  <p className="text-xs text-red-600 font-medium">Annual Tanker Spend</p>
                  <p className="text-xl font-bold text-red-700 mt-1">{fmtCurrency(selectedBuilding.monthlyWaterSpend ? selectedBuilding.monthlyWaterSpend * 12 : (selectedBuilding.tankerCostAnnual ?? 0))}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3">
                  <p className="text-xs text-blue-600 font-medium">Status</p>
                  <div className="mt-1">
                    <Badge variant={getBuildingStatusBadgeVariant(selectedBuilding.status)} className="text-sm">
                      {selectedBuilding.status}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Contact */}
              <div>
                <h3 className="text-sm font-semibold text-[#463F2E] mb-2">Contact</h3>
                <div className="bg-[#F6F1EA] rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 size={14} className="text-[#ADA082]" />
                    <span className="font-medium text-[#463F2E]">{selectedBuilding.contactName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#5C5244]">
                    <Phone size={14} className="text-[#ADA082]" />
                    <a href={`tel:${selectedBuilding.contactPhone}`} className="hover:text-blue-600">
                      {selectedBuilding.contactPhone}
                    </a>
                  </div>
                  {selectedBuilding.contactEmail && (
                    <div className="flex items-center gap-2 text-sm text-[#5C5244]">
                      <Mail size={14} className="text-[#ADA082]" />
                      <a href={`mailto:${selectedBuilding.contactEmail}`} className="hover:text-blue-600 truncate">
                        {selectedBuilding.contactEmail}
                      </a>
                    </div>
                  )}
                </div>
              </div>

              {selectedBuilding.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-[#463F2E] mb-1">Notes</h3>
                  <p className="text-sm text-[#5C5244] bg-yellow-50 rounded-xl p-3">{selectedBuilding.notes}</p>
                </div>
              )}

              {/* Deals */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-semibold text-[#463F2E]">Deals</h3>
                  <Button
                    size="sm"
                    onClick={() => { setEditDeal(null); setShowAddDeal(true); }}
                  >
                    <Plus size={14} className="mr-1" /> Add Deal
                  </Button>
                </div>
                {getBuildingDeals(selectedBuilding.id).length > 0 ? (
                  <div className="space-y-2">
                    {getBuildingDeals(selectedBuilding.id).map(deal => (
                      <div
                        key={deal.id}
                        className="border border-[#EDE4D4] rounded-xl p-3 cursor-pointer hover:bg-[#F6F1EA] transition-colors"
                        onClick={() => openEditDeal(deal)}
                      >
                        <div className="flex items-center justify-between">
                          <Badge variant={getDealStageBadgeVariant(deal.stage)}>{deal.stage}</Badge>
                          <span className="text-sm font-bold text-[#463F2E]">{fmtCurrency(deal.value)}</span>
                        </div>
                        <div className="flex items-center justify-between mt-2 text-xs text-[#8C8062]">
                          <span>{deal.waterSavedKLD} KLD saved</span>
                          <span>{format(new Date(deal.createdAt), 'dd MMM yyyy')}</span>
                        </div>
                        {deal.notes && <p className="text-xs text-[#ADA082] mt-1 truncate">{deal.notes}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#ADA082] text-center py-4 bg-[#F6F1EA] rounded-xl">No deals yet.</p>
                )}
              </div>

              {/* Audits */}
              <div>
                <h3 className="text-sm font-semibold text-[#463F2E] mb-2">Audits</h3>
                {getBuildingAudits(selectedBuilding.id).length > 0 ? (
                  <div className="space-y-2">
                    {getBuildingAudits(selectedBuilding.id).map(audit => (
                      <div key={audit.id} className="border border-[#EDE4D4] rounded-xl p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">{format(new Date(audit.date), 'dd MMM yyyy')}</span>
                          <span className="text-sm font-bold text-teal-700">{fmtCurrency(audit.potentialSavings)}/yr savings</span>
                        </div>
                        <p className="text-xs text-[#8C8062] mt-1">TDS: {audit.tdsLevel} ppm · Borewell: {audit.borewellDepth}m</p>
                        <p className="text-xs text-[#ADA082] mt-1 truncate">{audit.recommendedSystem}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#ADA082] text-center py-4 bg-[#F6F1EA] rounded-xl">No audits yet.</p>
                )}
              </div>

              {/* Update building status */}
              <div>
                <h3 className="text-sm font-semibold text-[#463F2E] mb-2">Update Status</h3>
                <div className="flex flex-wrap gap-2">
                  {BUILDING_STATUSES.map(s => (
                    <button
                      key={s}
                      onClick={() => updateBuilding({ ...selectedBuilding, status: s as Building['status'] })}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        selectedBuilding.status === s
                          ? 'bg-blue-800 text-white border-blue-800'
                          : 'bg-white text-[#5C5244] border-[#E2D5BE] hover:border-blue-300'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Building Modal */}
      <Modal open={showAddBuilding} onClose={() => setShowAddBuilding(false)} title="Add New Building" size="lg">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Input label="Building Name *" value={bForm.name} onChange={e => setBForm({ ...bForm, name: e.target.value })} placeholder="e.g. Sunrise Apartments" />
          </div>
          <Select label="State *" options={statesData.map(s => ({ value: s.id, label: s.name }))} placeholder="Select state" value={bForm.stateId} onChange={e => setBForm({ ...bForm, stateId: e.target.value, cityId: '', areaId: '' })} />
          <Select label="City *" options={cities.filter(c => !bForm.stateId || c.stateId === bForm.stateId).map(c => ({ value: c.id, label: c.name }))} placeholder="Select city" value={bForm.cityId} onChange={e => setBForm({ ...bForm, cityId: e.target.value, areaId: '' })} />
          <Select label="Area *" options={bFormAreas.map(a => ({ value: a.id, label: a.name }))} placeholder="Select area" value={bForm.areaId} onChange={e => setBForm({ ...bForm, areaId: e.target.value })} />
          <Select label="Building Type" options={BUILDING_TYPES.map(t => ({ value: t, label: t }))} value={bForm.type} onChange={e => setBForm({ ...bForm, type: e.target.value as Building['type'] })} />
          <Input label="Latitude" type="number" value={bForm.lat} onChange={e => setBForm({ ...bForm, lat: e.target.value })} />
          <Input label="Longitude" type="number" value={bForm.lng} onChange={e => setBForm({ ...bForm, lng: e.target.value })} />
          <Input label="Annual Tanker Cost (₹)" type="number" value={bForm.tankerCostAnnual} onChange={e => setBForm({ ...bForm, tankerCostAnnual: e.target.value })} placeholder="e.g. 400000" />
          <Select label="Status" options={BUILDING_STATUSES.map(s => ({ value: s, label: s }))} value={bForm.status} onChange={e => setBForm({ ...bForm, status: e.target.value as Building['status'] })} />
          <Input label="Floors" type="number" value={bForm.floors} onChange={e => setBForm({ ...bForm, floors: e.target.value })} />
          <Input label="Flats" type="number" value={bForm.flats} onChange={e => setBForm({ ...bForm, flats: e.target.value })} />
          <Input label="Daily Water Consumption (KLD)" type="number" value={bForm.dailyWaterConsumption} onChange={e => setBForm({ ...bForm, dailyWaterConsumption: e.target.value })} />
          <Input label="Contact Name" value={bForm.contactName} onChange={e => setBForm({ ...bForm, contactName: e.target.value })} />
          <Input label="Contact Phone" value={bForm.contactPhone} onChange={e => setBForm({ ...bForm, contactPhone: e.target.value })} />
          <div className="sm:col-span-2">
            <Input label="Contact Email" type="email" value={bForm.contactEmail} onChange={e => setBForm({ ...bForm, contactEmail: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Notes" value={bForm.notes} onChange={e => setBForm({ ...bForm, notes: e.target.value })} rows={3} />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleAddBuilding} className="flex-1">Add Building</Button>
          <Button variant="ghost" onClick={() => setShowAddBuilding(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>

      {/* Add/Edit Deal Modal */}
      <Modal
        open={showAddDeal}
        onClose={() => { setShowAddDeal(false); setEditDeal(null); }}
        title={editDeal ? 'Edit Deal' : 'Add Deal'}
      >
        <div className="space-y-4">
          <p className="text-sm text-[#8C8062]">Building: <span className="font-medium text-[#463F2E]">{selectedBuilding?.name}</span></p>
          <Select label="Deal Stage" options={DEAL_STAGES.map(s => ({ value: s, label: s }))} value={dForm.stage} onChange={e => setDForm({ ...dForm, stage: e.target.value as Deal['stage'] })} />
          <Input label="Deal Value (₹)" type="number" value={dForm.value} onChange={e => setDForm({ ...dForm, value: e.target.value })} placeholder="e.g. 1500000" />
          <Input label="Water Saved (KLD)" type="number" value={dForm.waterSavedKLD} onChange={e => setDForm({ ...dForm, waterSavedKLD: e.target.value })} placeholder="e.g. 20" />
          <Input label="Closed Date (if Won/Lost)" type="date" value={dForm.closedAt} onChange={e => setDForm({ ...dForm, closedAt: e.target.value })} />
          <TextArea label="Notes" value={dForm.notes} onChange={e => setDForm({ ...dForm, notes: e.target.value })} />
          <div className="flex gap-3">
            <Button onClick={handleAddDeal} className="flex-1">{editDeal ? 'Update' : 'Add'} Deal</Button>
            <Button variant="ghost" onClick={() => { setShowAddDeal(false); setEditDeal(null); }} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function InfoItem({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="bg-[#F6F1EA] rounded-xl p-3">
      <div className="flex items-center gap-1.5 text-[#8C8062] mb-1">
        <Icon size={12} />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="text-sm font-semibold text-gray-800">{value}</p>
    </div>
  );
}
