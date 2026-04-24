import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { Card, CardBody } from '../components/ui/Card';
import { Badge, getDealStageBadgeVariant, getBuildingStatusBadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { MapView } from '../components/maps/MapView';
import type { Building, Deal } from '../types';
import {
  Plus, Map, List, Columns, Phone, Mail, Building2, Calendar, Droplets,
  ChevronRight, Search, Clock, AlertTriangle, ArrowUpDown,
} from 'lucide-react';
import { format, isPast, isToday, parseISO, differenceInDays } from 'date-fns';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000)   return `₹${(n / 100000).toFixed(1)}L`;
  if (n > 0)         return `₹${(n / 1000).toFixed(0)}K`;
  return '—';
};

const BUILDING_TYPES = [
  'Private Hospital','Private School / College','Banquet Hall / Marriage Venue',
  'Coaching Institute / Hostel','Hotel / Guest House','Housing Society (Gated / DDA)',
  'Individual Bungalow / Villa','Industrial Unit / Factory','Corporate Office / Business Park',
  'Government Institution','Restaurant / Food Business','Gym / Sports Facility','Other',
];

const ALL_STATUSES: Building['status'][] = [
  'Cold','Warm Lead','Warm','Hot','Prospect','Audited','Referred','Installed','WaaS','Won','Lost',
];

// Statuses shown in pipeline kanban
const PIPELINE_STATUSES: Building['status'][] = [
  'Cold','Warm Lead','Warm','Hot','Audited','Referred','Installed','WaaS',
];

const STATUS_COLORS: Record<string, string> = {
  Cold:       'bg-gray-100 text-gray-600',
  'Warm Lead':'bg-amber-100 text-amber-700',
  Warm:       'bg-amber-100 text-amber-700',
  Hot:        'bg-red-100 text-red-700',
  Prospect:   'bg-blue-100 text-blue-700',
  Audited:    'bg-blue-100 text-blue-800',
  Referred:   'bg-purple-100 text-purple-700',
  Installed:  'bg-teal-100 text-teal-700',
  WaaS:       'bg-green-100 text-green-700',
  Won:        'bg-green-100 text-green-700',
  Lost:       'bg-gray-100 text-gray-500',
};

const STATUS_HINTS: Record<string, string> = {
  'Cold→Warm Lead':   'Good progress. Send the DJB rebate WhatsApp within 3 days.',
  'Cold→Warm':        'Good progress. Send the DJB rebate WhatsApp within 3 days.',
  'Warm Lead→Hot':    'They are interested. Offer to do a free audit.',
  'Warm→Hot':         'They are interested. Offer to do a free audit.',
  'Hot→Audited':      'Audit complete. Review the report and introduce a manufacturer.',
  'Audited→Referred': 'Referral made. Follow up with the manufacturer in 2 weeks.',
  'Referred→Installed':'Installation confirmed! Chase commission in 30 days.',
};

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh','Uttarakhand',
  'West Bengal','Delhi','Chandigarh','Jammu and Kashmir','Ladakh','Puducherry',
];

const INDIAN_CITIES_SUGGESTIONS = [
  'Delhi','New Delhi','Noida','Gurgaon','Gurugram','Faridabad','Ghaziabad','Greater Noida',
  'Mumbai','Pune','Nagpur','Bengaluru','Chennai','Hyderabad','Ahmedabad','Jaipur',
  'Lucknow','Kolkata','Bhopal','Indore','Patna','Chandigarh','Visakhapatnam',
];

type SortKey = 'status' | 'lastContacted' | 'monthlySpend' | 'createdAt';

export default function CRM() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, addBuilding, updateBuilding, addDeal, updateDeal } = useStore();
  const { buildings, deals, areas, cities, states: statesData, audits, contactLogs } = state;

  const [view, setView] = useState<'list' | 'map' | 'pipeline'>('list');
  const [search, setSearch] = useState('');
  const [filterState, setFilterState] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterArea, setFilterArea] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);

  const [showAddBuilding, setShowAddBuilding] = useState(false);
  const [showAddDeal, setShowAddDeal] = useState(false);
  const [editDeal, setEditDeal] = useState<Deal | null>(null);

  const [bForm, setBForm] = useState({
    name: '', address: '', cityId: '', stateId: '', zip: '',
    type: '' as Building['type'] | '',
    status: 'Cold' as Building['status'],
    contactName: '', contactPhone: '', contactEmail: '', notes: '',
    monthlyWaterSpend: '',
  });

  const [dForm, setDForm] = useState({
    stage: 'New' as Deal['stage'],
    value: '', waterSavedKLD: '', notes: '', closedAt: '',
  });

  // ── helpers ──────────────────────────────────────────────
  const getAreaName = (areaId: string) => areas.find(a => a.id === areaId)?.name ?? '';
  const getCityName = (cityId: string) => cities.find(c => c.id === cityId)?.name ?? '';
  const getLastLog = (buildingId: string) => {
    const logs = contactLogs.filter(l => l.buildingId === buildingId);
    if (!logs.length) return null;
    return logs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  };
  const getLatestDeal = (buildingId: string) => {
    const bd = deals.filter(d => d.buildingId === buildingId);
    if (!bd.length) return null;
    return bd.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0];
  };
  const getBuildingDeals = (buildingId: string) => deals.filter(d => d.buildingId === buildingId);
  const getBuildingAudits = (buildingId: string) => audits.filter(a => a.buildingId === buildingId);

  const filteredCities = useMemo(() =>
    filterState ? cities.filter(c => c.stateId === filterState) : cities,
    [cities, filterState]
  );
  const filteredAreas = useMemo(() =>
    filterCity ? areas.filter(a => a.cityId === filterCity) : areas,
    [areas, filterCity]
  );

  const filteredBuildings = useMemo(() => {
    let bs = buildings.filter(b => {
      if (search) {
        const q = search.toLowerCase();
        if (
          !b.name.toLowerCase().includes(q) &&
          !(b.address ?? '').toLowerCase().includes(q) &&
          !getCityName(b.cityId).toLowerCase().includes(q) &&
          !getAreaName(b.areaId).toLowerCase().includes(q)
        ) return false;
      }
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

    bs = [...bs].sort((a, b) => {
      if (sortKey === 'status') return ALL_STATUSES.indexOf(a.status) - ALL_STATUSES.indexOf(b.status);
      if (sortKey === 'monthlySpend') return (b.monthlyWaterSpend ?? 0) - (a.monthlyWaterSpend ?? 0);
      if (sortKey === 'lastContacted') {
        const la = getLastLog(a.id)?.date ?? '';
        const lb = getLastLog(b.id)?.date ?? '';
        return lb.localeCompare(la);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return bs;
  }, [buildings, search, filterState, filterCity, filterArea, filterType, filterStatus, sortKey, cities, areas, contactLogs]);

  // ── handlers ─────────────────────────────────────────────
  function handleAddBuilding() {
    if (!bForm.address.trim() && !bForm.name.trim()) return;
    const matchedCity = cities.find(c => c.id === bForm.cityId);
    addBuilding({
      name: bForm.name || bForm.address || 'Unnamed Building',
      address: bForm.address || undefined,
      zip: bForm.zip || undefined,
      areaId: matchedCity ? (areas.find(a => a.cityId === matchedCity.id)?.id ?? '') : '',
      cityId: bForm.cityId,
      stateId: bForm.stateId || matchedCity?.stateId || '',
      type: (bForm.type || 'Other') as Building['type'],
      lat: 28.7041, lng: 77.1025,
      status: bForm.status,
      contactName: bForm.contactName,
      contactPhone: bForm.contactPhone,
      contactEmail: bForm.contactEmail || undefined,
      notes: bForm.notes,
      monthlyWaterSpend: parseInt(bForm.monthlyWaterSpend) || undefined,
      createdAt: new Date().toISOString(),
    });
    setShowAddBuilding(false);
    setBForm({ name:'', address:'', cityId:'', stateId:'', zip:'', type:'', status:'Cold', contactName:'', contactPhone:'', contactEmail:'', notes:'', monthlyWaterSpend:'' });
    toast('Building added');
  }

  function handleStatusChange(building: Building, newStatus: Building['status']) {
    const hint = STATUS_HINTS[`${building.status}→${newStatus}`];
    updateBuilding({ ...building, status: newStatus });
    toast('Status updated to ' + newStatus);
    if (hint) setTimeout(() => toast(hint, 'info'), 400);
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
    editDeal ? updateDeal({ ...editDeal, ...payload }) : addDeal(payload);
    setShowAddDeal(false); setEditDeal(null);
    setDForm({ stage:'New', value:'', waterSavedKLD:'', notes:'', closedAt:'' });
    toast(editDeal ? 'Deal updated' : 'Deal added');
  }

  function openEditDeal(deal: Deal) {
    setEditDeal(deal);
    setDForm({ stage: deal.stage, value: String(deal.value), waterSavedKLD: String(deal.waterSavedKLD), notes: deal.notes, closedAt: deal.closedAt || '' });
    setShowAddDeal(true);
  }

  // ── render ───────────────────────────────────────────────
  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2820]">CRM</h1>
          <p className="text-[#8C8062] text-sm">{buildings.length} buildings tracked</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* View toggle */}
          <div className="flex bg-[#EDE4D4] rounded-lg p-1">
            {([['list', List, 'List'], ['pipeline', Columns, 'Pipeline'], ['map', Map, 'Map']] as const).map(([key, Icon, label]) => (
              <button key={key} onClick={() => setView(key as typeof view)}
                className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center gap-1.5 transition-colors ${view === key ? 'bg-white shadow-sm text-[#2C2820]' : 'text-[#8C8062] hover:text-[#463F2E]'}`}>
                <Icon size={15} /> {label}
              </button>
            ))}
          </div>
          <Button onClick={() => setShowAddBuilding(true)} size="sm">
            <Plus size={16} className="mr-1" /> Add Building
          </Button>
        </div>
      </div>

      {/* Search + Filters */}
      <Card>
        <CardBody className="py-3 space-y-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ADA082]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by building name, area or city…"
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820] placeholder-[#BFB39E]"
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            <Select placeholder="All States" options={statesData.map(s => ({ value: s.id, label: s.name }))}
              value={filterState} onChange={e => { setFilterState(e.target.value); setFilterCity(''); setFilterArea(''); }} />
            <Select placeholder="All Cities" options={filteredCities.map(c => ({ value: c.id, label: c.name }))}
              value={filterCity} onChange={e => { setFilterCity(e.target.value); setFilterArea(''); }} />
            <Select placeholder="All Areas" options={filteredAreas.map(a => ({ value: a.id, label: a.name }))}
              value={filterArea} onChange={e => setFilterArea(e.target.value)} />
            <Select placeholder="All Types" options={BUILDING_TYPES.map(t => ({ value: t, label: t }))}
              value={filterType} onChange={e => setFilterType(e.target.value)} />
            <Select placeholder="All Statuses" options={ALL_STATUSES.map(s => ({ value: s, label: s }))}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)} />
          </div>
        </CardBody>
      </Card>

      {/* ── MAP VIEW ── */}
      {view === 'map' && (
        <MapView buildings={filteredBuildings} deals={deals} onBuildingClick={b => navigate(`/buildings/${b.id}`)} />
      )}

      {/* ── LIST VIEW ── */}
      {view === 'list' && (
        <Card>
          {/* Sort bar */}
          <div className="px-4 py-2 border-b border-[#EDE4D4] flex items-center gap-3 text-xs text-[#8C8062]">
            <ArrowUpDown size={13} />
            <span>Sort by:</span>
            {([['createdAt','Date added'],['status','Status'],['monthlySpend','Water spend'],['lastContacted','Last contacted']] as [SortKey, string][]).map(([key, label]) => (
              <button key={key} onClick={() => setSortKey(key)}
                className={`px-2 py-0.5 rounded-full transition-colors ${sortKey === key ? 'bg-[#567C45] text-white' : 'hover:bg-[#EDE4D4] text-[#5C5244]'}`}>
                {label}
              </button>
            ))}
          </div>

          {filteredBuildings.length === 0 ? (
            <div className="text-center py-16 px-6">
              <Building2 size={48} className="text-[#ADA082] mx-auto mb-4" />
              {buildings.length === 0 ? (
                <>
                  <h3 className="font-semibold text-[#2C2820] text-lg mb-2">No buildings yet</h3>
                  <p className="text-[#8C8062] mb-6 max-w-sm mx-auto">Your first step is to visit a school or hospital near Model Town and add it here.</p>
                  <Button onClick={() => setShowAddBuilding(true)}>
                    <Plus size={16} className="mr-1" /> Add your first building
                  </Button>
                </>
              ) : (
                <>
                  <h3 className="font-semibold text-[#2C2820] mb-2">No buildings match your filters</h3>
                  <p className="text-[#8C8062]">Try adjusting the search or filters above.</p>
                </>
              )}
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Building</TH>
                  <TH>Area / City</TH>
                  <TH>Type</TH>
                  <TH>Status</TH>
                  <TH>Monthly Spend</TH>
                  <TH>Last Contact</TH>
                  <TH>Follow-up</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {filteredBuildings.map(building => {
                  const lastLog = getLastLog(building.id);
                  const daysSince = lastLog ? differenceInDays(new Date(), new Date(lastLog.date)) : null;
                  const followUp = building.followUpDate ? parseISO(building.followUpDate) : null;
                  const isOverdue = followUp && isPast(followUp) && !isToday(followUp);
                  return (
                    <TR key={building.id}
                      className="cursor-pointer hover:bg-[#F6F1EA] transition-colors"
                      onClick={() => navigate(`/buildings/${building.id}`)}>
                      <TD>
                        <div className="font-medium text-[#2C2820]">{building.name}</div>
                        {building.address && <div className="text-xs text-[#ADA082] truncate max-w-[180px]">{building.address}</div>}
                      </TD>
                      <TD>
                        <div>{getAreaName(building.areaId) || getCityName(building.cityId) || '—'}</div>
                        {getAreaName(building.areaId) && <div className="text-xs text-[#ADA082]">{getCityName(building.cityId)}</div>}
                      </TD>
                      <TD><span className="text-sm text-[#5C5244]">{building.type}</span></TD>
                      <TD onClick={e => e.stopPropagation()}>
                        {/* Inline status change */}
                        <select
                          value={building.status}
                          onChange={e => handleStatusChange(building, e.target.value as Building['status'])}
                          className={`text-xs font-medium px-2 py-1 rounded-full border-0 outline-none cursor-pointer ${STATUS_COLORS[building.status] ?? 'bg-gray-100 text-gray-600'}`}
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                      </TD>
                      <TD className="font-semibold text-[#463F2E]">
                        {fmtLakh(building.monthlyWaterSpend ? building.monthlyWaterSpend * 12 : (building.tankerCostAnnual ?? 0))}
                      </TD>
                      <TD>
                        {daysSince === null
                          ? <span className="text-xs text-red-500 font-medium">Never</span>
                          : <span className={`text-xs ${daysSince >= 14 ? 'text-red-600 font-medium' : 'text-[#8C8062]'}`}>
                              {daysSince === 0 ? 'Today' : `${daysSince}d ago`}
                              {daysSince >= 14 && ' ⚠'}
                            </span>
                        }
                      </TD>
                      <TD>
                        {followUp
                          ? <span className={`text-xs ${isOverdue ? 'text-red-600 font-medium' : isToday(followUp) ? 'text-amber-600 font-medium' : 'text-[#8C8062]'}`}>
                              {isOverdue ? 'Overdue' : isToday(followUp) ? 'Today' : format(followUp, 'dd MMM')}
                            </span>
                          : <span className="text-xs text-[#ADA082]">—</span>
                        }
                      </TD>
                      <TD><ChevronRight size={16} className="text-[#ADA082]" /></TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      )}

      {/* ── PIPELINE VIEW ── */}
      {view === 'pipeline' && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {PIPELINE_STATUSES.map(status => {
              const col = filteredBuildings.filter(b => b.status === status);
              return (
                <div key={status} className="w-64 flex-shrink-0">
                  <div className={`px-3 py-2 rounded-t-xl flex items-center justify-between ${STATUS_COLORS[status] ?? 'bg-gray-100'}`}>
                    <span className="font-semibold text-sm">{status}</span>
                    <span className="text-xs font-bold">{col.length}</span>
                  </div>
                  <div className="bg-[#F6F1EA] rounded-b-xl min-h-[200px] p-2 space-y-2">
                    {col.length === 0 && (
                      <p className="text-xs text-[#ADA082] text-center py-6">No buildings here yet</p>
                    )}
                    {col.map(building => {
                      const lastLog = getLastLog(building.id);
                      const daysSince = lastLog ? differenceInDays(new Date(), new Date(lastLog.date)) : null;
                      const isOverdue = daysSince !== null && daysSince >= 14;
                      return (
                        <div key={building.id}
                          className="bg-white rounded-xl p-3 border border-[#E2D5BE] hover:shadow-sm transition-shadow cursor-pointer"
                          onClick={() => navigate(`/buildings/${building.id}`)}>
                          <div className="flex items-start justify-between gap-1">
                            <p className="font-medium text-sm text-[#2C2820] leading-tight">{building.name}</p>
                            {isOverdue && <AlertTriangle size={13} className="text-red-500 flex-shrink-0 mt-0.5" />}
                          </div>
                          <p className="text-xs text-[#ADA082] mt-0.5">
                            {getAreaName(building.areaId) || getCityName(building.cityId) || '—'}
                          </p>
                          {building.monthlyWaterSpend != null && building.monthlyWaterSpend > 0 && (
                            <p className="text-xs font-semibold text-[#463F2E] mt-1">
                              {fmtLakh(building.monthlyWaterSpend * 12)}/yr
                            </p>
                          )}
                          {daysSince !== null && (
                            <p className={`text-xs mt-1 ${isOverdue ? 'text-red-500 font-medium' : 'text-[#ADA082]'}`}>
                              {daysSince === 0 ? 'Contacted today' : `${daysSince}d since contact`}
                              {isOverdue && ' — overdue'}
                            </p>
                          )}
                          {/* Quick move */}
                          <div onClick={e => e.stopPropagation()} className="mt-2">
                            <select
                              value={building.status}
                              onChange={e => handleStatusChange(building, e.target.value as Building['status'])}
                              className="w-full text-xs bg-[#F6F1EA] border border-[#E2D5BE] rounded-lg px-2 py-1 outline-none cursor-pointer text-[#5C5244]"
                            >
                              {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Add Building Modal ── */}
      <Modal open={showAddBuilding} onClose={() => setShowAddBuilding(false)} title="Add New Building" size="lg">
        <div className="space-y-4">
          <Input label="Address *" value={bForm.address} onChange={e => setBForm({ ...bForm, address: e.target.value })} placeholder="e.g. 12 Model Town, Delhi 110009" />
          <Input label="Building Name (optional)" value={bForm.name} onChange={e => setBForm({ ...bForm, name: e.target.value })} placeholder="e.g. Sunrise Apartments" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#463F2E] block mb-1">State</label>
              {statesData.length > 0 ? (
                <select value={bForm.stateId}
                  onChange={e => setBForm({ ...bForm, stateId: e.target.value, cityId: '' })}
                  className="w-full px-3 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820]">
                  <option value="">— Select state —</option>
                  {statesData.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <p className="text-xs text-[#ADA082] px-3 py-2 border border-[#D8CEBC] rounded-xl bg-[#FDFAF4]">
                  Add states in Geography first
                </p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-[#463F2E] block mb-1">City</label>
              {cities.length > 0 ? (
                <select value={bForm.cityId}
                  onChange={e => {
                    const city = cities.find(c => c.id === e.target.value);
                    setBForm({ ...bForm, cityId: e.target.value, stateId: city?.stateId ?? bForm.stateId });
                  }}
                  className="w-full px-3 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820]">
                  <option value="">— Select city —</option>
                  {(bForm.stateId
                    ? cities.filter(c => c.stateId === bForm.stateId)
                    : cities
                  ).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <p className="text-xs text-[#ADA082] px-3 py-2 border border-[#D8CEBC] rounded-xl bg-[#FDFAF4]">
                  Add cities in Geography first
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#463F2E] block mb-1">Building Type</label>
              <select value={bForm.type} onChange={e => setBForm({ ...bForm, type: e.target.value as Building['type'] })}
                className="w-full px-3 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820]">
                <option value="">— Select type —</option>
                {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Select label="Status" options={ALL_STATUSES.map(s => ({ value: s, label: s }))}
              value={bForm.status} onChange={e => setBForm({ ...bForm, status: e.target.value as Building['status'] })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={bForm.contactName} onChange={e => setBForm({ ...bForm, contactName: e.target.value })} placeholder="e.g. Ramesh Sharma" />
            <Input label="Contact Phone" value={bForm.contactPhone} onChange={e => setBForm({ ...bForm, contactPhone: e.target.value })} placeholder="e.g. 98101 00000" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Email" type="email" value={bForm.contactEmail} onChange={e => setBForm({ ...bForm, contactEmail: e.target.value })} placeholder="optional" />
            <Input label="Monthly Water Spend (₹)" type="number" value={bForm.monthlyWaterSpend} onChange={e => setBForm({ ...bForm, monthlyWaterSpend: e.target.value })} placeholder="e.g. 25000" />
          </div>
          <TextArea label="Notes" value={bForm.notes} onChange={e => setBForm({ ...bForm, notes: e.target.value })} rows={3}
            placeholder="How you heard about them, key concerns, what they said…" />
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleAddBuilding} className="flex-1" disabled={!bForm.address.trim() && !bForm.name.trim()}>
            Add Building
          </Button>
          <Button variant="ghost" onClick={() => setShowAddBuilding(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>

      {/* ── Add/Edit Deal Modal ── */}
      <Modal open={showAddDeal} onClose={() => { setShowAddDeal(false); setEditDeal(null); }} title={editDeal ? 'Edit Deal' : 'Add Deal'}>
        <div className="space-y-4">
          <p className="text-sm text-[#8C8062]">Building: <span className="font-medium text-[#463F2E]">{selectedBuilding?.name}</span></p>
          <Select label="Deal Stage" options={['New','Contacted','Audit Scheduled','Audit Done','Proposal Sent','Negotiation','Won','Lost'].map(s => ({ value: s, label: s }))}
            value={dForm.stage} onChange={e => setDForm({ ...dForm, stage: e.target.value as Deal['stage'] })} />
          <Input label="Deal Value (₹)" type="number" value={dForm.value} onChange={e => setDForm({ ...dForm, value: e.target.value })} placeholder="e.g. 1500000" />
          <Input label="Water Saved (KLD)" type="number" value={dForm.waterSavedKLD} onChange={e => setDForm({ ...dForm, waterSavedKLD: e.target.value })} />
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
