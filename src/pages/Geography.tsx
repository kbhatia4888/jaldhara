import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { LabelWithTooltip } from '../components/ui/Tooltip';
import type { City, State, Area } from '../types';
import { Globe, ChevronRight, Edit2, Droplets, Building2, TrendingUp, Plus, MapPin } from 'lucide-react';
import { getCityStageBadgeVariant } from '../components/ui/Badge';

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const WATER_STRESS_COLORS: Record<string, string> = {
  Critical: 'bg-red-100 text-red-700',
  High: 'bg-orange-100 text-orange-700',
  Medium: 'bg-yellow-100 text-yellow-700',
  Low: 'bg-green-100 text-green-700',
};

const WATER_STRESS_OPTIONS = ['Low', 'Medium', 'High', 'Critical'] as const;
const CITY_STAGES = ['Not Started', 'Researching', 'First Visits', 'First Revenue', 'Scaling'] as const;
const KEY_CUSTOMER_TYPE_OPTIONS = [
  'Private hospital', 'Private school', 'Banquet hall', 'Coaching hostel',
  'Hotel', 'Housing society', 'Industrial unit',
];

// Auto-suggest 2-letter state code from name
function suggestStateCode(name: string): string {
  const map: Record<string, string> = {
    'andhra pradesh': 'AP', 'arunachal pradesh': 'AR', 'assam': 'AS', 'bihar': 'BR',
    'chhattisgarh': 'CG', 'goa': 'GA', 'gujarat': 'GJ', 'haryana': 'HR',
    'himachal pradesh': 'HP', 'jharkhand': 'JH', 'karnataka': 'KA', 'kerala': 'KL',
    'madhya pradesh': 'MP', 'maharashtra': 'MH', 'manipur': 'MN', 'meghalaya': 'ML',
    'mizoram': 'MZ', 'nagaland': 'NL', 'odisha': 'OD', 'punjab': 'PB',
    'rajasthan': 'RJ', 'sikkim': 'SK', 'tamil nadu': 'TN', 'telangana': 'TS',
    'tripura': 'TR', 'uttar pradesh': 'UP', 'uttarakhand': 'UK', 'west bengal': 'WB',
    'andaman and nicobar islands': 'AN', 'chandigarh': 'CH', 'dadra and nagar haveli': 'DN',
    'daman and diu': 'DD', 'delhi': 'DL', 'jammu and kashmir': 'JK',
    'ladakh': 'LA', 'lakshadweep': 'LD', 'puducherry': 'PY',
  };
  return map[name.toLowerCase()] || name.slice(0, 2).toUpperCase();
}

type ModalMode = 'add-state' | 'edit-state' | 'add-city' | 'edit-city' | 'add-area' | 'edit-area' | 'edit-playbook' | null;

export default function Geography() {
  const { state, addState, updateState, addCity, updateCity, addArea, updateArea } = useStore();
  const { cities, states: statesData, areas, buildings, deals } = state;

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [modalMode, setModalMode] = useState<ModalMode>(null);

  // State form
  const blankStateForm = { name: '', code: '', waterStressLevel: 'Medium' as State['waterStressLevel'], notes: '' };
  const [stateForm, setStateForm] = useState(blankStateForm);
  const [editingState, setEditingState] = useState<State | null>(null);

  // City form
  const blankCityForm = {
    stateId: '', name: '', waterCostPerKL: 0, tankerCostRange: '',
    groundwaterSituation: '', governmentIncentives: '',
    keyCustomerTypes: [] as string[], bestMonthsForSales: '',
    stage: 'Not Started' as City['stage'], founderNotes: '',
    lat: 20.5937, lng: 78.9629,
  };
  const [cityForm, setCityForm] = useState(blankCityForm);
  const [editingCity, setEditingCity] = useState<City | null>(null);

  // Area form
  const blankAreaForm = { cityId: '', name: '', notes: '' };
  const [areaForm, setAreaForm] = useState(blankAreaForm);
  const [editingArea, setEditingArea] = useState<Area | null>(null);

  // Playbook form
  const [playbookForm, setPlaybookForm] = useState<City['playbook'] | null>(null);

  // Compute city stats
  const cityStats = useMemo(() => {
    return cities.map(city => {
      const cityAreas = areas.filter(a => a.cityId === city.id);
      const cityBuildings = buildings.filter(b => b.cityId === city.id);
      const cityDeals = deals.filter(d => cityBuildings.some(b => b.id === d.buildingId));
      const wonDeals = cityDeals.filter(d => d.stage === 'Won');
      const revenue = wonDeals.reduce((s, d) => s + d.value, 0);
      const waterSaved = wonDeals.reduce((s, d) => s + d.waterSavedKLD, 0);
      const hotProspects = cityBuildings.filter(b => b.status === 'Hot').length;
      const convRate = cityBuildings.length > 0
        ? Math.round((cityBuildings.filter(b => ['Won', 'Installed', 'WaaS'].includes(b.status)).length / cityBuildings.length) * 100)
        : 0;
      const st = statesData.find(s => s.id === city.stateId);
      return { city, state: st, areas: cityAreas, buildings: cityBuildings, wonDeals, revenue, waterSaved, hotProspects, convRate };
    });
  }, [cities, statesData, areas, buildings, deals]);

  // Area breakdown for selected city
  const areaBreakdown = useMemo(() => {
    if (!selectedCity) return [];
    return areas
      .filter(a => a.cityId === selectedCity.id)
      .map(area => {
        const areaBuildings = buildings.filter(b => b.areaId === area.id);
        const hotProspects = areaBuildings.filter(b => b.status === 'Hot').length;
        const wonBuildings = areaBuildings.filter(b => ['Won', 'Installed', 'WaaS'].includes(b.status)).length;
        const areaDeals = deals.filter(d => areaBuildings.some(b => b.id === d.buildingId));
        const revenue = areaDeals.filter(d => d.stage === 'Won').reduce((s, d) => s + d.value, 0);
        const avgSpend = areaBuildings.length > 0
          ? Math.round(areaBuildings.reduce((s, b) => s + (b.monthlyWaterSpend || (b.tankerCostAnnual ? b.tankerCostAnnual / 12 : 0)), 0) / areaBuildings.length)
          : 0;
        return { area, buildings: areaBuildings.length, hotProspects, wonBuildings, revenue, avgSpend };
      });
  }, [selectedCity, areas, buildings, deals]);

  // State groups (only states with cities or Delhi)
  const stateGroups = useMemo(() => {
    return statesData.map(s => {
      const stateCities = cityStats.filter(c => c.city.stateId === s.id);
      const totalBuildings = stateCities.reduce((sum, c) => sum + c.buildings.length, 0);
      const totalRevenue = stateCities.reduce((sum, c) => sum + c.revenue, 0);
      const totalWaterSaved = stateCities.reduce((sum, c) => sum + c.waterSaved, 0);
      return { state: s, cities: stateCities, totalBuildings, totalRevenue, totalWaterSaved };
    });
  }, [statesData, cityStats]);

  const statesWithCities = stateGroups.filter(sg => sg.cities.length > 0);
  const statesWithoutCities = stateGroups.filter(sg => sg.cities.length === 0);

  // ── HANDLERS ──────────────────────────────────────────

  function openAddState() {
    setStateForm(blankStateForm);
    setEditingState(null);
    setModalMode('add-state');
  }

  function openEditState(s: State) {
    setStateForm({ name: s.name, code: s.code, waterStressLevel: s.waterStressLevel || 'Medium', notes: s.notes || '' });
    setEditingState(s);
    setModalMode('edit-state');
  }

  function saveState() {
    if (!stateForm.name.trim()) return;
    if (editingState) {
      updateState({ ...editingState, name: stateForm.name, code: stateForm.code, waterStressLevel: stateForm.waterStressLevel, notes: stateForm.notes });
    } else {
      addState({ name: stateForm.name, code: stateForm.code, waterStressLevel: stateForm.waterStressLevel, notes: stateForm.notes, countryId: 'c1' });
    }
    setModalMode(null);
  }

  function openAddCity(stateId?: string) {
    setCityForm({ ...blankCityForm, stateId: stateId || '' });
    setEditingCity(null);
    setModalMode('add-city');
  }

  function openEditCity(city: City) {
    const types = city.playbook.keyCustomerTypes
      ? city.playbook.keyCustomerTypes.split(',').map(t => t.trim()).filter(Boolean)
      : [];
    setCityForm({
      stateId: city.stateId,
      name: city.name,
      waterCostPerKL: city.playbook.waterCostPerKL,
      tankerCostRange: city.playbook.tankerCostRange,
      groundwaterSituation: city.playbook.groundwaterSituation,
      governmentIncentives: city.playbook.governmentIncentives,
      keyCustomerTypes: types,
      bestMonthsForSales: city.playbook.bestMonthsForSales,
      stage: city.stage,
      founderNotes: city.playbook.founderNotes,
      lat: city.lat,
      lng: city.lng,
    });
    setEditingCity(city);
    setModalMode('edit-city');
  }

  function saveCity() {
    if (!cityForm.name.trim() || !cityForm.stateId) return;
    const playbook = {
      waterCostPerKL: cityForm.waterCostPerKL,
      tankerCostRange: cityForm.tankerCostRange,
      groundwaterSituation: cityForm.groundwaterSituation,
      governmentIncentives: cityForm.governmentIncentives,
      keyCustomerTypes: cityForm.keyCustomerTypes.join(', '),
      bestMonthsForSales: cityForm.bestMonthsForSales,
      founderNotes: cityForm.founderNotes,
    };
    if (editingCity) {
      updateCity({ ...editingCity, name: cityForm.name, stateId: cityForm.stateId, stage: cityForm.stage, playbook, lat: cityForm.lat, lng: cityForm.lng });
    } else {
      addCity({ name: cityForm.name, stateId: cityForm.stateId, stage: cityForm.stage, playbook, lat: cityForm.lat, lng: cityForm.lng });
    }
    setModalMode(null);
  }

  function openAddArea(cityId?: string) {
    setAreaForm({ ...blankAreaForm, cityId: cityId || selectedCity?.id || '' });
    setEditingArea(null);
    setModalMode('add-area');
  }

  function openEditArea(area: Area) {
    setAreaForm({ cityId: area.cityId, name: area.name, notes: area.notes || '' });
    setEditingArea(area);
    setModalMode('edit-area');
  }

  function saveArea() {
    if (!areaForm.name.trim() || !areaForm.cityId) return;
    if (editingArea) {
      updateArea({ ...editingArea, name: areaForm.name, cityId: areaForm.cityId, notes: areaForm.notes });
    } else {
      addArea({ name: areaForm.name, cityId: areaForm.cityId, notes: areaForm.notes });
    }
    setModalMode(null);
  }

  function openPlaybookEdit(city: City) {
    setPlaybookForm({ ...city.playbook });
    setModalMode('edit-playbook');
  }

  function savePlaybook() {
    if (!selectedCity || !playbookForm) return;
    updateCity({ ...selectedCity, playbook: playbookForm });
    setModalMode(null);
  }

  // ── CITY DETAIL VIEW ────────────────────────────────

  if (selectedCity) {
    const stats = cityStats.find(c => c.city.id === selectedCity.id);
    const st = statesData.find(s => s.id === selectedCity.stateId);
    const cityAreas = areaBreakdown;

    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        <div>
          <button
            onClick={() => setSelectedCity(null)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" /> Back to Geography
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{selectedCity.name}</h1>
                <Badge variant={getCityStageBadgeVariant(selectedCity.stage)}>{selectedCity.stage}</Badge>
                {st?.waterStressLevel && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${WATER_STRESS_COLORS[st.waterStressLevel]}`}>
                    <LabelWithTooltip label={`${st.waterStressLevel} stress`} term="Water stress level" />
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">{st?.name} · {st?.code}</p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button size="sm" variant="ghost" onClick={() => openEditCity(selectedCity)}>
                <Edit2 size={14} className="mr-1" /> Edit City
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openPlaybookEdit(selectedCity)}>
                <Edit2 size={14} className="mr-1" /> Edit Playbook
              </Button>
              <Button size="sm" onClick={() => openAddArea(selectedCity.id)}>
                <Plus size={14} className="mr-1" /> Add Area
              </Button>
            </div>
          </div>
        </div>

        {/* City KPIs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Buildings', value: stats?.buildings.length || 0, icon: Building2, color: 'text-blue-700', bg: 'bg-blue-100' },
            { label: 'Hot Prospects', value: stats?.hotProspects || 0, icon: TrendingUp, color: 'text-red-700', bg: 'bg-red-100' },
            { label: 'Revenue', value: fmtLakh(stats?.revenue || 0), icon: TrendingUp, color: 'text-green-700', bg: 'bg-green-100' },
            { label: 'Water Saved', value: `${stats?.waterSaved || 0} KLD`, icon: Droplets, color: 'text-teal-700', bg: 'bg-teal-100' },
          ].map(kpi => (
            <Card key={kpi.label}>
              <CardBody className="flex items-center gap-3 py-4">
                <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                  <kpi.icon size={18} className={kpi.color} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-medium">{kpi.label}</p>
                  <p className="text-xl font-bold text-gray-900">{kpi.value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        {/* City Playbook */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">City Playbook</h2>
              <Button size="sm" variant="ghost" onClick={() => openPlaybookEdit(selectedCity)}>
                <Edit2 size={14} className="mr-1" /> Edit
              </Button>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <LabelWithTooltip label="Water Cost per KL" term="KL" />
                </p>
                <p className="text-sm text-gray-900 mt-1">₹{selectedCity.playbook.waterCostPerKL}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <LabelWithTooltip label="Tanker Cost Range" term="Tanker dependency" />
                </p>
                <p className="text-sm text-gray-900 mt-1">{selectedCity.playbook.tankerCostRange || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Best Sales Months</p>
                <p className="text-sm text-gray-900 mt-1">{selectedCity.playbook.bestMonthsForSales || '—'}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Customer Types</p>
                <p className="text-sm text-gray-900 mt-1">{selectedCity.playbook.keyCustomerTypes || '—'}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Groundwater Situation</p>
              <p className="text-sm text-gray-900 mt-1">{selectedCity.playbook.groundwaterSituation || '—'}</p>
            </div>
            {selectedCity.playbook.governmentIncentives && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  <LabelWithTooltip label="Government Incentives" term="DJB Rebate" />
                </p>
                <p className="text-sm text-gray-700 mt-1 bg-teal-50 rounded-xl p-3 border border-teal-100">{selectedCity.playbook.governmentIncentives}</p>
              </div>
            )}
            {selectedCity.playbook.founderNotes && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Founder Notes</p>
                <p className="text-sm text-gray-900 bg-amber-50 rounded-xl p-3 border border-amber-100">{selectedCity.playbook.founderNotes}</p>
              </div>
            )}
          </CardBody>
        </Card>

        {/* Area Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Areas in {selectedCity.name}</h2>
              <Button size="sm" onClick={() => openAddArea(selectedCity.id)}>
                <Plus size={14} className="mr-1" /> Add Area
              </Button>
            </div>
          </CardHeader>
          {cityAreas.length === 0 ? (
            <CardBody>
              <div className="text-center py-8">
                <MapPin size={32} className="mx-auto text-gray-300 mb-2" />
                <p className="text-gray-500 text-sm">No areas added yet.</p>
                <Button size="sm" className="mt-3" onClick={() => openAddArea(selectedCity.id)}>Add first area</Button>
              </div>
            </CardBody>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Area</TH>
                  <TH>Buildings</TH>
                  <TH>Hot Prospects</TH>
                  <TH>Converted</TH>
                  <TH>Revenue</TH>
                  <TH>Avg Monthly Spend</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {cityAreas.map(row => (
                  <TR key={row.area.id}>
                    <TD className="font-medium text-gray-900">{row.area.name}</TD>
                    <TD>{row.buildings}</TD>
                    <TD>
                      <span className={`font-semibold ${row.hotProspects > 0 ? 'text-red-600' : 'text-gray-400'}`}>{row.hotProspects}</span>
                    </TD>
                    <TD>
                      <span className="font-semibold text-[#0F6E56]">{row.wonBuildings}</span>
                    </TD>
                    <TD className="font-semibold text-blue-700">{fmtLakh(row.revenue)}</TD>
                    <TD className="text-sm text-gray-600">
                      {row.avgSpend > 0 ? `₹${row.avgSpend.toLocaleString('en-IN')}/mo` : '—'}
                    </TD>
                    <TD>
                      <button onClick={() => openEditArea(row.area)} className="text-gray-400 hover:text-[#0F6E56] transition-colors p-1">
                        <Edit2 size={14} />
                      </button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </Card>

        {/* Edit Playbook Modal */}
        <Modal open={modalMode === 'edit-playbook'} onClose={() => setModalMode(null)} title={`Edit ${selectedCity.name} Playbook`} size="lg">
          {playbookForm && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Water Cost per KL (₹)"
                  type="number"
                  value={playbookForm.waterCostPerKL.toString()}
                  onChange={e => setPlaybookForm({ ...playbookForm, waterCostPerKL: parseFloat(e.target.value) || 0 })}
                />
                <Input
                  label="Tanker Cost Range"
                  value={playbookForm.tankerCostRange}
                  placeholder="e.g. ₹1,800–3,200 per tanker"
                  onChange={e => setPlaybookForm({ ...playbookForm, tankerCostRange: e.target.value })}
                />
              </div>
              <Input
                label="Best Months for Sales"
                value={playbookForm.bestMonthsForSales}
                placeholder="e.g. April–June when water shortage is acute"
                onChange={e => setPlaybookForm({ ...playbookForm, bestMonthsForSales: e.target.value })}
              />
              <Input
                label="Key Customer Types"
                value={playbookForm.keyCustomerTypes}
                placeholder="e.g. Private hospitals, coaching hostels, banquet halls"
                onChange={e => setPlaybookForm({ ...playbookForm, keyCustomerTypes: e.target.value })}
              />
              <TextArea
                label="Groundwater Situation"
                value={playbookForm.groundwaterSituation}
                placeholder="Describe groundwater depth, quality, extraction issues"
                onChange={e => setPlaybookForm({ ...playbookForm, groundwaterSituation: e.target.value })}
              />
              <TextArea
                label="Government Incentives"
                value={playbookForm.governmentIncentives}
                placeholder="List any state/municipal rebates or mandates"
                onChange={e => setPlaybookForm({ ...playbookForm, governmentIncentives: e.target.value })}
              />
              <TextArea
                label="Founder Notes"
                value={playbookForm.founderNotes}
                placeholder="Your personal observations about this city"
                onChange={e => setPlaybookForm({ ...playbookForm, founderNotes: e.target.value })}
                rows={5}
              />
              <div className="flex gap-3 pt-2">
                <Button onClick={savePlaybook} className="flex-1">Save Playbook</Button>
                <Button variant="ghost" onClick={() => setModalMode(null)} className="flex-1">Cancel</Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Edit City Modal */}
        <CityModal
          mode="edit-city"
          open={modalMode === 'edit-city'}
          onClose={() => setModalMode(null)}
          form={cityForm}
          setForm={setCityForm}
          statesData={statesData}
          onSave={saveCity}
        />

        {/* Add/Edit Area Modal */}
        <AreaModal
          open={modalMode === 'add-area' || modalMode === 'edit-area'}
          mode={modalMode as 'add-area' | 'edit-area'}
          onClose={() => setModalMode(null)}
          form={areaForm}
          setForm={setAreaForm}
          cities={cities}
          onSave={saveArea}
        />
      </div>
    );
  }

  // ── STATE OVERVIEW ───────────────────────────────────

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Globe size={22} className="text-[#0F6E56]" />
            <h1 className="text-2xl font-bold text-gray-900">Geography</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Manage states, cities, and areas for expansion</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="ghost" onClick={openAddState}>
            <Plus size={14} className="mr-1" /> Add State
          </Button>
          <Button size="sm" onClick={() => openAddCity()}>
            <Plus size={14} className="mr-1" /> Add City
          </Button>
        </div>
      </div>

      {/* Active states (with cities) */}
      {statesWithCities.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">Active — Cities Added</h2>
          {statesWithCities.map(({ state: s, cities: stateCities, totalBuildings, totalRevenue, totalWaterSaved }) => (
            <Card key={s.id}>
              <CardHeader>
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="font-semibold text-gray-900 text-lg">{s.name}</h2>
                    <span className="text-xs text-gray-400 font-mono bg-gray-100 px-1.5 py-0.5 rounded">{s.code}</span>
                    {s.waterStressLevel && (
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${WATER_STRESS_COLORS[s.waterStressLevel]}`}>
                        <LabelWithTooltip label={`${s.waterStressLevel} Water Stress`} term="Water stress level" />
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span><strong className="text-gray-900">{totalBuildings}</strong> bldgs</span>
                    <span className="font-semibold text-green-700">{fmtLakh(totalRevenue)}</span>
                    <span className="font-semibold text-teal-700">
                      <LabelWithTooltip label={`${totalWaterSaved} KLD`} term="KLD" /> saved
                    </span>
                    <button onClick={() => openEditState(s)} className="text-gray-400 hover:text-[#0F6E56] transition-colors p-1">
                      <Edit2 size={14} />
                    </button>
                    <Button size="sm" variant="ghost" onClick={() => openAddCity(s.id)}>
                      <Plus size={13} className="mr-1" /> Add City
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardBody className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {stateCities.map(({ city, buildings: cityBuildings, revenue, hotProspects, convRate }) => (
                    <button
                      key={city.id}
                      onClick={() => setSelectedCity(city)}
                      className="text-left p-4 rounded-xl border border-gray-100 hover:border-[#0F6E56]/30 hover:bg-[#0F6E56]/5 transition-all group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="font-semibold text-gray-900 group-hover:text-[#0F6E56] transition-colors">{city.name}</p>
                          <div className="mt-1">
                            <Badge variant={getCityStageBadgeVariant(city.stage)}>{city.stage}</Badge>
                          </div>
                        </div>
                        <ChevronRight size={16} className="text-gray-300 group-hover:text-[#0F6E56] transition-colors mt-1 flex-shrink-0" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
                        <div>
                          <p className="text-gray-400">Buildings</p>
                          <p className="font-semibold text-gray-900">{cityBuildings.length}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Hot prospects</p>
                          <p className={`font-semibold ${hotProspects > 0 ? 'text-red-600' : 'text-gray-400'}`}>{hotProspects}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">Revenue</p>
                          <p className="font-semibold text-green-700">{fmtLakh(revenue)}</p>
                        </div>
                        <div>
                          <p className="text-gray-400">
                            <LabelWithTooltip label="Conversion" term="Conversion rate" />
                          </p>
                          <p className="font-semibold text-gray-900">{convRate}%</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* All other states (no cities yet) */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">All States — No Cities Added Yet</h2>
          <span className="text-xs text-gray-400">{statesWithoutCities.length} states</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
          {statesWithoutCities.map(({ state: s }) => (
            <div
              key={s.id}
              className="p-3 rounded-xl border border-gray-100 bg-white hover:border-gray-200 transition-all group"
            >
              <div className="flex items-start justify-between gap-1">
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-gray-700 truncate">{s.name}</p>
                  <span className="text-[10px] text-gray-400 font-mono">{s.code}</span>
                </div>
                <button onClick={() => openEditState(s)} className="text-gray-300 hover:text-[#0F6E56] transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100">
                  <Edit2 size={11} />
                </button>
              </div>
              {s.waterStressLevel && (
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium mt-1.5 ${WATER_STRESS_COLORS[s.waterStressLevel]}`}>
                  {s.waterStressLevel}
                </span>
              )}
              <button
                onClick={() => openAddCity(s.id)}
                className="mt-2 w-full text-[10px] text-[#0F6E56] font-medium border border-[#0F6E56]/20 rounded-lg py-1 hover:bg-[#0F6E56]/5 transition-colors opacity-0 group-hover:opacity-100"
              >
                + Add city
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Add/Edit State Modal */}
      <Modal
        open={modalMode === 'add-state' || modalMode === 'edit-state'}
        onClose={() => setModalMode(null)}
        title={modalMode === 'edit-state' ? 'Edit State' : 'Add State'}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="State / UT Name"
            value={stateForm.name}
            onChange={e => {
              const name = e.target.value;
              setStateForm(f => ({ ...f, name, code: f.code || suggestStateCode(name) }));
            }}
            placeholder="e.g. Maharashtra"
          />
          <Input
            label="State Code (2 letters)"
            value={stateForm.code}
            onChange={e => setStateForm(f => ({ ...f, code: e.target.value.toUpperCase().slice(0, 2) }))}
            placeholder="e.g. MH"
            maxLength={2}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <LabelWithTooltip label="Water Stress Level" term="Water stress level" />
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20"
              value={stateForm.waterStressLevel}
              onChange={e => setStateForm(f => ({ ...f, waterStressLevel: e.target.value as State['waterStressLevel'] }))}
            >
              {WATER_STRESS_OPTIONS.map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>
          <TextArea
            label="Notes (optional)"
            value={stateForm.notes}
            onChange={e => setStateForm(f => ({ ...f, notes: e.target.value }))}
            placeholder="Any notes about this state for expansion planning"
            rows={2}
          />
          <div className="flex gap-3 pt-2">
            <Button onClick={saveState} className="flex-1" disabled={!stateForm.name.trim()}>
              {modalMode === 'edit-state' ? 'Save Changes' : 'Add State'}
            </Button>
            <Button variant="ghost" onClick={() => setModalMode(null)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* Add/Edit City Modal */}
      <CityModal
        mode={modalMode as 'add-city' | 'edit-city'}
        open={modalMode === 'add-city' || modalMode === 'edit-city'}
        onClose={() => setModalMode(null)}
        form={cityForm}
        setForm={setCityForm}
        statesData={statesData}
        onSave={saveCity}
      />

      {/* Add/Edit Area Modal */}
      <AreaModal
        open={modalMode === 'add-area' || modalMode === 'edit-area'}
        mode={modalMode as 'add-area' | 'edit-area'}
        onClose={() => setModalMode(null)}
        form={areaForm}
        setForm={setAreaForm}
        cities={cities}
        onSave={saveArea}
      />
    </div>
  );
}

// ── SUB-COMPONENTS ─────────────────────────────────────

interface CityFormState {
  stateId: string; name: string; waterCostPerKL: number; tankerCostRange: string;
  groundwaterSituation: string; governmentIncentives: string;
  keyCustomerTypes: string[]; bestMonthsForSales: string;
  stage: City['stage']; founderNotes: string; lat: number; lng: number;
}

function CityModal({ mode, open, onClose, form, setForm, statesData, onSave }: {
  mode: 'add-city' | 'edit-city' | null;
  open: boolean;
  onClose: () => void;
  form: CityFormState;
  setForm: React.Dispatch<React.SetStateAction<CityFormState>>;
  statesData: State[];
  onSave: () => void;
}) {
  if (!open) return null;

  const sortedStates = [...statesData].sort((a, b) => a.name.localeCompare(b.name));

  function toggleType(t: string) {
    setForm(f => ({
      ...f,
      keyCustomerTypes: f.keyCustomerTypes.includes(t)
        ? f.keyCustomerTypes.filter(x => x !== t)
        : [...f.keyCustomerTypes, t],
    }));
  }

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit-city' ? 'Edit City' : 'Add New City'} size="lg">
      <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">State / UT <span className="text-red-500">*</span></label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20"
              value={form.stateId}
              onChange={e => setForm(f => ({ ...f, stateId: e.target.value }))}
            >
              <option value="">Select state…</option>
              {sortedStates.map(s => (
                <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
              ))}
            </select>
          </div>
          <Input
            label="City Name *"
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            placeholder="e.g. Jaipur"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <LabelWithTooltip label="Water Cost per KL (₹)" term="KL" />
            </label>
            <input
              type="number"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20"
              value={form.waterCostPerKL || ''}
              onChange={e => setForm(f => ({ ...f, waterCostPerKL: parseFloat(e.target.value) || 0 }))}
              placeholder="e.g. 5"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <LabelWithTooltip label="Expansion Stage" term="Expansion stage" />
            </label>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20"
              value={form.stage}
              onChange={e => setForm(f => ({ ...f, stage: e.target.value as City['stage'] }))}
            >
              {CITY_STAGES.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Tanker Cost Range"
            value={form.tankerCostRange}
            onChange={e => setForm(f => ({ ...f, tankerCostRange: e.target.value }))}
            placeholder="e.g. ₹1,500–2,500 per tanker"
          />
          <Input
            label="Best Months for Sales"
            value={form.bestMonthsForSales}
            onChange={e => setForm(f => ({ ...f, bestMonthsForSales: e.target.value }))}
            placeholder="e.g. April–June"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Key Customer Types</label>
          <div className="flex flex-wrap gap-2">
            {KEY_CUSTOMER_TYPE_OPTIONS.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => toggleType(t)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  form.keyCustomerTypes.includes(t)
                    ? 'bg-[#0F6E56] text-white border-[#0F6E56]'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-[#0F6E56]/50'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <TextArea
          label="Groundwater Situation"
          value={form.groundwaterSituation}
          onChange={e => setForm(f => ({ ...f, groundwaterSituation: e.target.value }))}
          placeholder="Describe groundwater depth, quality, extraction issues"
          rows={2}
        />
        <TextArea
          label="Government Incentives"
          value={form.governmentIncentives}
          onChange={e => setForm(f => ({ ...f, governmentIncentives: e.target.value }))}
          placeholder="List any state/municipal rebates or mandates"
          rows={2}
        />
        <TextArea
          label="Founder Notes"
          value={form.founderNotes}
          onChange={e => setForm(f => ({ ...f, founderNotes: e.target.value }))}
          placeholder="Your personal observations about this city — which areas to start, who to talk to, what to avoid"
          rows={3}
        />
        <div className="flex gap-3 pt-2">
          <Button onClick={onSave} className="flex-1" disabled={!form.name.trim() || !form.stateId}>
            {mode === 'edit-city' ? 'Save Changes' : 'Add City'}
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}

function AreaModal({ open, mode, onClose, form, setForm, cities, onSave }: {
  open: boolean;
  mode: 'add-area' | 'edit-area' | null;
  onClose: () => void;
  form: { cityId: string; name: string; notes: string };
  setForm: React.Dispatch<React.SetStateAction<{ cityId: string; name: string; notes: string }>>;
  cities: City[];
  onSave: () => void;
}) {
  if (!open) return null;
  const sortedCities = [...cities].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <Modal open={open} onClose={onClose} title={mode === 'edit-area' ? 'Edit Area' : 'Add Area'} size="sm">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">City <span className="text-red-500">*</span></label>
          <select
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#0F6E56]/20"
            value={form.cityId}
            onChange={e => setForm(f => ({ ...f, cityId: e.target.value }))}
          >
            <option value="">Select city…</option>
            {sortedCities.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <Input
          label="Area / Neighbourhood Name *"
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          placeholder="e.g. Connaught Place, Lajpat Nagar"
        />
        <TextArea
          label="Notes (optional)"
          value={form.notes}
          onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
          placeholder="Any notes about this area — building density, key landmarks, access"
          rows={2}
        />
        <div className="flex gap-3 pt-2">
          <Button onClick={onSave} className="flex-1" disabled={!form.name.trim() || !form.cityId}>
            {mode === 'edit-area' ? 'Save Changes' : 'Add Area'}
          </Button>
          <Button variant="ghost" onClick={onClose} className="flex-1">Cancel</Button>
        </div>
      </div>
    </Modal>
  );
}
