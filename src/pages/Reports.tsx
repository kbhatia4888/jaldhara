import React, { useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { BarChart } from '../components/charts/BarChart';
import { LineChart } from '../components/charts/LineChart';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import {
  BarChart2, TrendingUp, Droplets, DollarSign,
} from 'lucide-react';
import { format, parseISO, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const DEAL_STAGES = ['New', 'Contacted', 'Audit Scheduled', 'Audit Done', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

export default function Reports() {
  const { state } = useStore();
  const { deals, buildings, areas, cities } = state;

  const wonDeals = useMemo(() => deals.filter(d => d.stage === 'Won'), [deals]);

  // Revenue by month (last 12 months)
  const revenueByMonth = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({
      start: subMonths(now, 11),
      end: now,
    });
    return months.map(month => {
      const key = format(month, 'MMM yy');
      const monthRevenue = wonDeals
        .filter(d => {
          if (!d.closedAt) return false;
          const closed = startOfMonth(parseISO(d.closedAt));
          return closed.getTime() === startOfMonth(month).getTime();
        })
        .reduce((s, d) => s + d.value, 0);
      return { month: key, revenue: monthRevenue };
    });
  }, [wonDeals]);

  // Conversion funnel
  const funnelData = useMemo(() => {
    return DEAL_STAGES.map(stage => ({
      stage,
      count: deals.filter(d => d.stage === stage).length,
    }));
  }, [deals]);

  // Water saved by month
  const waterByMonth = useMemo(() => {
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(now, 11), end: now });
    return months.map(month => {
      const key = format(month, 'MMM yy');
      const water = wonDeals
        .filter(d => {
          if (!d.closedAt) return false;
          const closed = startOfMonth(parseISO(d.closedAt));
          return closed.getTime() === startOfMonth(month).getTime();
        })
        .reduce((s, d) => s + d.waterSavedKLD, 0);
      return { month: key, water };
    });
  }, [wonDeals]);

  // Top areas
  const areaStats = useMemo(() => {
    return areas.map(area => {
      const areaBuildings = buildings.filter(b => b.areaId === area.id);
      const city = cities.find(c => c.id === areaBuildings[0]?.cityId);
      const areaDeals = deals.filter(d => areaBuildings.some(b => b.id === d.buildingId));
      const wonAreas = areaDeals.filter(d => d.stage === 'Won');
      const revenue = wonAreas.reduce((s, d) => s + d.value, 0);
      const waterSaved = wonAreas.reduce((s, d) => s + d.waterSavedKLD, 0);
      const convRate = areaDeals.length > 0 ? (wonAreas.length / areaDeals.filter(d => d.stage !== 'New').length) * 100 : 0;
      return {
        area,
        city: city?.name || '-',
        buildings: areaBuildings.length,
        deals: areaDeals.length,
        wonDeals: wonAreas.length,
        revenue,
        waterSaved,
        convRate: Math.round(convRate),
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [areas, buildings, deals, cities]);

  // City comparison
  const cityStats = useMemo(() => {
    return cities.map(city => {
      const cityBuildings = buildings.filter(b => b.cityId === city.id);
      const cityDeals = deals.filter(d => cityBuildings.some(b => b.id === d.buildingId));
      const wonCity = cityDeals.filter(d => d.stage === 'Won');
      const revenue = wonCity.reduce((s, d) => s + d.value, 0);
      const waterSaved = wonCity.reduce((s, d) => s + d.waterSavedKLD, 0);
      const pipelineValue = cityDeals.filter(d => !['Won', 'Lost'].includes(d.stage)).reduce((s, d) => s + d.value, 0);
      return {
        city, buildings: cityBuildings.length, deals: cityDeals.length, wonDeals: wonCity.length,
        revenue, waterSaved, pipelineValue,
      };
    }).sort((a, b) => b.revenue - a.revenue);
  }, [cities, buildings, deals]);

  const totalRevenue = wonDeals.reduce((s, d) => s + d.value, 0);
  const totalWaterSaved = wonDeals.reduce((s, d) => s + d.waterSavedKLD, 0);
  const totalActive = deals.filter(d => !['Won', 'Lost'].includes(d.stage)).length;
  const overallConvRate = deals.length > 0 ? Math.round((wonDeals.length / deals.length) * 100) : 0;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#2C2820]">Reports</h1>
        <p className="text-[#8C8062] text-sm">Performance metrics and analytics</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={DollarSign} label="Total Revenue" value={fmtLakh(totalRevenue)} sub={`${wonDeals.length} closed deals`} color="blue" />
        <StatCard icon={TrendingUp} label="Overall Conversion" value={`${overallConvRate}%`} sub={`${wonDeals.length} of ${deals.length} deals`} color="green" />
        <StatCard icon={Droplets} label="Water Saved" value={`${totalWaterSaved} KLD`} sub={`${Math.round(totalWaterSaved * 365 / 1000)} ML/year`} color="teal" />
        <StatCard icon={BarChart2} label="Active Deals" value={String(totalActive)} sub="in pipeline" color="purple" />
      </div>

      {/* Revenue by month */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[#2C2820]">Revenue by Month (Last 12 Months)</h2>
        </CardHeader>
        <CardBody>
          <BarChart
            data={revenueByMonth}
            bars={[{ dataKey: 'revenue', fill: '#1e40af', name: 'Revenue (₹)' }]}
            xKey="month"
            yTickFormatter={fmtLakh}
            tooltipFormatter={fmtCurrency}
            height={280}
          />
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Water saved by month */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[#2C2820]">Water Saved by Month (KLD)</h2>
          </CardHeader>
          <CardBody>
            <LineChart
              data={waterByMonth}
              lines={[{ dataKey: 'water', stroke: '#0d9488', name: 'Water Saved (KLD)' }]}
              xKey="month"
              height={250}
            />
          </CardBody>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[#2C2820]">Conversion Funnel</h2>
          </CardHeader>
          <CardBody>
            <BarChart
              data={funnelData}
              bars={[{ dataKey: 'count', fill: '#7c3aed', name: 'Deals' }]}
              xKey="stage"
              height={250}
            />
          </CardBody>
        </Card>
      </div>

      {/* Top Areas Table */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[#2C2820]">Top Performing Areas</h2>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Area</TH>
              <TH>City</TH>
              <TH>Buildings</TH>
              <TH>Total Deals</TH>
              <TH>Won</TH>
              <TH>Conv. Rate</TH>
              <TH>Revenue</TH>
              <TH>Water Saved</TH>
            </TR>
          </THead>
          <TBody>
            {areaStats.map(row => (
              <TR key={row.area.id}>
                <TD className="font-medium text-[#2C2820]">{row.area.name}</TD>
                <TD>{row.city}</TD>
                <TD>{row.buildings}</TD>
                <TD>{row.deals}</TD>
                <TD>{row.wonDeals}</TD>
                <TD>
                  <span className={`font-semibold ${row.convRate >= 50 ? 'text-green-600' : row.convRate >= 25 ? 'text-yellow-600' : 'text-[#8C8062]'}`}>
                    {row.convRate}%
                  </span>
                </TD>
                <TD className="font-semibold text-blue-700">{fmtLakh(row.revenue)}</TD>
                <TD className="font-semibold text-teal-700">{row.waterSaved} KLD</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>

      {/* City Comparison */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[#2C2820]">City Comparison</h2>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>City</TH>
              <TH>Stage</TH>
              <TH>Buildings</TH>
              <TH>Won Deals</TH>
              <TH>Revenue</TH>
              <TH>Pipeline</TH>
              <TH>Water Saved</TH>
            </TR>
          </THead>
          <TBody>
            {cityStats.map(row => (
              <TR key={row.city.id}>
                <TD className="font-medium text-[#2C2820]">{row.city.name}</TD>
                <TD>
                  <Badge variant={
                    row.city.stage === 'Scaling' ? 'success' :
                    row.city.stage === 'First Revenue' ? 'orange' :
                    row.city.stage === 'First Visits' ? 'warning' :
                    row.city.stage === 'Researching' ? 'info' : 'default'
                  }>
                    {row.city.stage}
                  </Badge>
                </TD>
                <TD>{row.buildings}</TD>
                <TD>{row.wonDeals}</TD>
                <TD className="font-semibold text-blue-700">{fmtLakh(row.revenue)}</TD>
                <TD className="font-semibold text-purple-700">{fmtLakh(row.pipelineValue)}</TD>
                <TD className="font-semibold text-teal-700">{row.waterSaved} KLD</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: {
  icon: React.ElementType; label: string; value: string; sub: string; color: string;
}) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    teal: 'bg-teal-100 text-teal-700',
    purple: 'bg-purple-100 text-purple-700',
  };
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className={`p-3 rounded-xl ${colorMap[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-xs text-[#8C8062] font-medium">{label}</p>
          <p className="text-xl font-bold text-[#2C2820]">{value}</p>
          <p className="text-xs text-[#ADA082]">{sub}</p>
        </div>
      </CardBody>
    </Card>
  );
}
