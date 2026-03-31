import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import type { City, State } from '../types';
import { Globe, ChevronRight, ChevronDown, Edit2, Droplets, Building2, TrendingUp } from 'lucide-react';
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

export default function Geography() {
  const { state, updateCity } = useStore();
  const { cities, states: statesData, areas, buildings, deals } = state;

  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [editPlaybook, setEditPlaybook] = useState(false);
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
      const state = statesData.find(s => s.id === city.stateId);
      return { city, state, areas: cityAreas, buildings: cityBuildings, wonDeals, revenue, waterSaved, hotProspects, convRate };
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
        const avgTanker = areaBuildings.length > 0
          ? Math.round(areaBuildings.reduce((s, b) => s + (b.monthlyWaterSpend || (b.tankerCostAnnual ? b.tankerCostAnnual / 12 : 0)), 0) / areaBuildings.length)
          : 0;
        return { area, buildings: areaBuildings.length, hotProspects, wonBuildings, revenue, avgTanker };
      });
  }, [selectedCity, areas, buildings, deals]);

  function openPlaybookEdit(city: City) {
    setPlaybookForm({ ...city.playbook });
    setEditPlaybook(true);
  }

  function savePlaybook() {
    if (!selectedCity || !playbookForm) return;
    updateCity({ ...selectedCity, playbook: playbookForm });
    setEditPlaybook(false);
  }

  if (selectedCity) {
    const stats = cityStats.find(c => c.city.id === selectedCity.id);
    const state = statesData.find(s => s.id === selectedCity.stateId);

    return (
      <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
        {/* Back + header */}
        <div>
          <button
            onClick={() => setSelectedCity(null)}
            className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-900 mb-3 transition-colors"
          >
            <ChevronRight size={14} className="rotate-180" /> Back to Geography
          </button>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-gray-900">{selectedCity.name}</h1>
                <Badge variant={getCityStageBadgeVariant(selectedCity.stage)}>{selectedCity.stage}</Badge>
                {state?.waterStressLevel && (
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${WATER_STRESS_COLORS[state.waterStressLevel] || 'bg-gray-100 text-gray-700'}`}>
                    {state.waterStressLevel} stress
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mt-1">{state?.name}</p>
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
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Water Cost per KL</p>
                <p className="text-sm text-gray-900 mt-1">₹{selectedCity.playbook.waterCostPerKL}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tanker Cost Range</p>
                <p className="text-sm text-gray-900 mt-1">{selectedCity.playbook.tankerCostRange}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Best Sales Months</p>
                <p className="text-sm text-gray-900 mt-1">{selectedCity.playbook.bestMonthsForSales}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Key Customer Types</p>
                <p className="text-sm text-gray-900 mt-1">{selectedCity.playbook.keyCustomerTypes}</p>
              </div>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Groundwater Situation</p>
              <p className="text-sm text-gray-900 mt-1">{selectedCity.playbook.groundwaterSituation}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Government Incentives</p>
              <p className="text-sm text-gray-700 mt-1 bg-teal-50 rounded-xl p-3 border border-teal-100">{selectedCity.playbook.governmentIncentives}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Founder Notes</p>
              <p className="text-sm text-gray-900 bg-amber-50 rounded-xl p-3 border border-amber-100">{selectedCity.playbook.founderNotes}</p>
            </div>
          </CardBody>
        </Card>

        {/* Area Breakdown */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Area Breakdown</h2>
          </CardHeader>
          <Table>
            <THead>
              <TR>
                <TH>Area</TH>
                <TH>Buildings</TH>
                <TH>Hot Prospects</TH>
                <TH>Converted</TH>
                <TH>Revenue</TH>
                <TH>Avg Monthly Spend</TH>
              </TR>
            </THead>
            <TBody>
              {areaBreakdown.map(row => (
                <TR key={row.area.id}>
                  <TD className="font-medium text-gray-900">{row.area.name}</TD>
                  <TD>{row.buildings}</TD>
                  <TD>
                    <span className={`font-semibold ${row.hotProspects > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                      {row.hotProspects}
                    </span>
                  </TD>
                  <TD>
                    <span className="font-semibold text-[#0F6E56]">{row.wonBuildings}</span>
                  </TD>
                  <TD className="font-semibold text-blue-700">{fmtLakh(row.revenue)}</TD>
                  <TD className="text-sm text-gray-600">
                    {row.avgTanker > 0 ? `₹${row.avgTanker.toLocaleString('en-IN')}/mo` : '—'}
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </Card>

        {/* Edit Playbook Modal */}
        <Modal
          open={editPlaybook}
          onClose={() => setEditPlaybook(false)}
          title={`Edit ${selectedCity.name} Playbook`}
          size="lg"
        >
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
                  onChange={e => setPlaybookForm({ ...playbookForm, tankerCostRange: e.target.value })}
                />
              </div>
              <Input
                label="Best Months for Sales"
                value={playbookForm.bestMonthsForSales}
                onChange={e => setPlaybookForm({ ...playbookForm, bestMonthsForSales: e.target.value })}
              />
              <Input
                label="Key Customer Types"
                value={playbookForm.keyCustomerTypes}
                onChange={e => setPlaybookForm({ ...playbookForm, keyCustomerTypes: e.target.value })}
              />
              <TextArea
                label="Groundwater Situation"
                value={playbookForm.groundwaterSituation}
                onChange={e => setPlaybookForm({ ...playbookForm, groundwaterSituation: e.target.value })}
              />
              <TextArea
                label="Government Incentives"
                value={playbookForm.governmentIncentives}
                onChange={e => setPlaybookForm({ ...playbookForm, governmentIncentives: e.target.value })}
              />
              <TextArea
                label="Founder Notes (most important)"
                value={playbookForm.founderNotes}
                onChange={e => setPlaybookForm({ ...playbookForm, founderNotes: e.target.value })}
                rows={5}
              />
            </div>
          )}
          <div className="flex gap-3 mt-6">
            <Button onClick={savePlaybook} className="flex-1">Save Playbook</Button>
            <Button variant="ghost" onClick={() => setEditPlaybook(false)} className="flex-1">Cancel</Button>
          </div>
        </Modal>
      </div>
    );
  }

  // State overview
  const stateGroups = useMemo(() => {
    return statesData.map(s => {
      const stateCities = cityStats.filter(c => c.city.stateId === s.id);
      const totalBuildings = stateCities.reduce((sum, c) => sum + c.buildings.length, 0);
      const totalRevenue = stateCities.reduce((sum, c) => sum + c.revenue, 0);
      const totalWaterSaved = stateCities.reduce((sum, c) => sum + c.waterSaved, 0);
      return { state: s, cities: stateCities, totalBuildings, totalRevenue, totalWaterSaved };
    }).filter(sg => sg.cities.length > 0 || sg.state.id === 's1');
  }, [statesData, cityStats]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <Globe size={22} className="text-[#0F6E56]" />
          <h1 className="text-2xl font-bold text-gray-900">Geography Dashboard</h1>
        </div>
        <p className="text-gray-500 text-sm mt-0.5">Strategic command centre for geographic expansion</p>
      </div>

      {/* State cards */}
      <div className="space-y-4">
        {stateGroups.map(({ state: s, cities: stateCities, totalBuildings, totalRevenue, totalWaterSaved }) => (
          <Card key={s.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="font-semibold text-gray-900 text-lg">{s.name}</h2>
                  {s.waterStressLevel && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${WATER_STRESS_COLORS[s.waterStressLevel] || 'bg-gray-100 text-gray-700'}`}>
                      {s.waterStressLevel} Water Stress
                    </span>
                  )}
                </div>
                <div className="flex gap-4 text-sm text-gray-500">
                  <span><strong className="text-gray-900">{stateCities.length}</strong> cities</span>
                  <span><strong className="text-gray-900">{totalBuildings}</strong> buildings</span>
                  <span className="font-semibold text-green-700">{fmtLakh(totalRevenue)}</span>
                  <span className="font-semibold text-teal-700">{totalWaterSaved} KLD saved</span>
                </div>
              </div>
            </CardHeader>
            <CardBody className="pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {stateCities.map(({ city, buildings: cityBuildings, wonDeals, revenue, hotProspects, convRate }) => (
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
                        <p className="text-gray-400">Conversion</p>
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
    </div>
  );
}
