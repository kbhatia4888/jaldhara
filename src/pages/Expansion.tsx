import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import type { City } from '../types';
import { Map, Globe, Building2, TrendingUp, Droplets, ChevronRight, Star, AlertTriangle } from 'lucide-react';
import { getCityStageBadgeVariant } from '../components/ui/Badge';

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const STAGE_ORDER: City['stage'][] = ['Not Started', 'Researching', 'First Visits', 'First Revenue', 'Scaling'];

const STAGE_COLORS: Record<City['stage'], string> = {
  'Not Started': 'bg-[#EDE4D4] text-[#5C5244]',
  'Researching': 'bg-amber-100 text-amber-700',
  'First Visits': 'bg-blue-100 text-blue-700',
  'First Revenue': 'bg-purple-100 text-purple-700',
  'Scaling': 'bg-teal-100 text-teal-700',
};

const WATER_STRESS_PRIORITY: Record<string, number> = {
  Critical: 4,
  High: 3,
  Medium: 2,
  Low: 1,
};

export default function Expansion() {
  const { state, updateCity } = useStore();
  const { cities, states: statesData, buildings, deals, referrals } = state;

  const cityStats = useMemo(() => {
    return cities.map(city => {
      const cityBuildings = buildings.filter(b => b.cityId === city.id);
      const cityDeals = deals.filter(d => cityBuildings.some(b => b.id === d.buildingId));
      const wonDeals = cityDeals.filter(d => d.stage === 'Won');
      const wonBuildings = cityBuildings.filter(b => ['Won', 'Installed', 'WaaS'].includes(b.status)).length;
      const revenue = wonDeals.reduce((s, d) => s + d.value, 0);
      const waterSaved = wonDeals.reduce((s, d) => s + d.waterSavedKLD, 0);
      const convRate = cityBuildings.length > 0
        ? Math.round((wonBuildings / cityBuildings.length) * 100)
        : 0;
      const state = statesData.find(s => s.id === city.stateId);
      const pipeline = cityDeals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);

      // Auto stage progression rules
      let computedStage: City['stage'] = city.stage;
      if (cityBuildings.length >= 1 && city.stage === 'Not Started') computedStage = 'First Visits';
      if (cityBuildings.length >= 1 && city.stage === 'Researching') computedStage = 'First Visits';
      if (revenue > 0 && ['Not Started', 'Researching', 'First Visits'].includes(city.stage)) computedStage = 'First Revenue';
      if (wonBuildings >= 5 && ['First Revenue'].includes(city.stage)) computedStage = 'Scaling';

      return { city, state, buildings: cityBuildings, wonBuildings, wonDeals, revenue, waterSaved, convRate, pipeline, computedStage };
    }).sort((a, b) => {
      const stageA = STAGE_ORDER.indexOf(a.city.stage);
      const stageB = STAGE_ORDER.indexOf(b.city.stage);
      return stageB - stageA;
    });
  }, [cities, statesData, buildings, deals]);

  // Header metrics
  const totalStats = useMemo(() => ({
    statesActive: new Set(cityStats.filter(c => c.buildings.length > 0).map(c => c.city.stateId)).size,
    citiesActive: cityStats.filter(c => c.buildings.length > 0).length,
    totalBuildings: buildings.length,
    totalRevenue: cityStats.reduce((s, c) => s + c.revenue, 0),
  }), [cityStats, buildings]);

  // Recommended next cities (not started, high water stress)
  const recommendedCities = useMemo(() => {
    const notStarted = cityStats.filter(c => c.city.stage === 'Not Started' || c.city.stage === 'Researching');
    return notStarted
      .filter(c => c.state?.waterStressLevel === 'Critical' || c.state?.waterStressLevel === 'High')
      .sort((a, b) => (WATER_STRESS_PRIORITY[b.state?.waterStressLevel || ''] || 0) - (WATER_STRESS_PRIORITY[a.state?.waterStressLevel || ''] || 0))
      .slice(0, 3);
  }, [cityStats]);

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2">
          <Map size={22} className="text-[#567C45]" />
          <h1 className="text-2xl font-bold text-[#2C2820]">Expansion Tracker</h1>
        </div>
        <p className="text-[#8C8062] text-sm mt-0.5">Strategic view for scaling city by city across India</p>
      </div>

      {/* Header metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'States Active', value: totalStats.statesActive, icon: Globe, color: 'text-blue-700', bg: 'bg-blue-100' },
          { label: 'Cities Active', value: totalStats.citiesActive, icon: Map, color: 'text-purple-700', bg: 'bg-purple-100' },
          { label: 'Total Buildings', value: totalStats.totalBuildings, icon: Building2, color: 'text-teal-700', bg: 'bg-teal-100' },
          { label: 'Total Revenue', value: fmtLakh(totalStats.totalRevenue), icon: TrendingUp, color: 'text-amber-700', bg: 'bg-amber-100' },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardBody className="flex items-center gap-3 py-4">
              <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
                <kpi.icon size={18} className={kpi.color} />
              </div>
              <div>
                <p className="text-xs text-[#8C8062] font-medium">{kpi.label}</p>
                <p className="text-xl font-bold text-[#2C2820]">{kpi.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Recommended next cities */}
      {recommendedCities.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Star size={16} className="text-amber-500" />
              <h2 className="font-semibold text-[#2C2820]">Recommended Next Cities</h2>
            </div>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {recommendedCities.map(({ city, state: s }) => (
              <div key={city.id} className="p-4 rounded-xl bg-amber-50 border border-amber-100">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-semibold text-[#2C2820]">{city.name}</p>
                    <p className="text-xs text-[#8C8062]">{s?.name}</p>
                  </div>
                  {s?.waterStressLevel && (
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                      s.waterStressLevel === 'Critical' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {s.waterStressLevel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#5C5244] mt-2 line-clamp-2">{city.playbook.founderNotes}</p>
                <Link to="/geography" className="text-xs text-[#567C45] font-medium hover:underline flex items-center gap-1 mt-2">
                  View playbook <ChevronRight size={11} />
                </Link>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* City pipeline table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[#2C2820]">City Pipeline</h2>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>City</TH>
              <TH>State</TH>
              <TH>Stage</TH>
              <TH>Buildings</TH>
              <TH>Converted</TH>
              <TH>Conv. Rate</TH>
              <TH>Revenue</TH>
              <TH>Pipeline</TH>
              <TH>Water Saved</TH>
            </TR>
          </THead>
          <TBody>
            {cityStats.map(({ city, state: s, buildings: cb, wonBuildings, convRate, revenue, pipeline, waterSaved, computedStage }) => (
              <TR key={city.id}>
                <TD>
                  <Link to="/geography" className="font-medium text-[#567C45] hover:underline">
                    {city.name}
                  </Link>
                </TD>
                <TD className="text-sm text-[#5C5244]">{s?.name || '—'}</TD>
                <TD>
                  <div className="flex items-center gap-1">
                    <Badge variant={getCityStageBadgeVariant(city.stage)}>{city.stage}</Badge>
                    {computedStage !== city.stage && (
                      <span className="text-[10px] text-green-600 font-medium">(ready: {computedStage})</span>
                    )}
                  </div>
                </TD>
                <TD>{cb.length}</TD>
                <TD className="font-semibold text-[#567C45]">{wonBuildings}</TD>
                <TD>
                  <span className={`font-semibold ${convRate >= 40 ? 'text-green-600' : convRate >= 20 ? 'text-amber-600' : 'text-[#8C8062]'}`}>
                    {convRate}%
                  </span>
                </TD>
                <TD className="font-semibold text-blue-700">{fmtLakh(revenue)}</TD>
                <TD className="text-purple-700">{fmtLakh(pipeline)}</TD>
                <TD className="font-semibold text-teal-700">{waterSaved} KLD</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* Stage progression guide */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[#2C2820]">Stage Progression Guide</h2>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-3">
            {STAGE_ORDER.map((stage, idx) => (
              <div key={stage} className="flex items-center gap-2">
                <div className={`px-3 py-1.5 rounded-lg text-sm font-medium ${STAGE_COLORS[stage]}`}>
                  {stage}
                </div>
                {idx < STAGE_ORDER.length - 1 && <ChevronRight size={14} className="text-gray-300" />}
              </div>
            ))}
          </div>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs text-[#5C5244]">
            <div className="bg-[#F6F1EA] rounded-lg p-3">
              <strong>Not Started → Researching:</strong> Manual — decide to investigate this city
            </div>
            <div className="bg-blue-50 rounded-lg p-3">
              <strong>Researching → First Visits:</strong> Auto — first building added in city
            </div>
            <div className="bg-purple-50 rounded-lg p-3">
              <strong>First Visits → First Revenue:</strong> Auto — first commission received from city
            </div>
            <div className="bg-teal-50 rounded-lg p-3">
              <strong>First Revenue → Scaling:</strong> Auto — 5+ converted buildings in city
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
