import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BarChart } from '../components/charts/BarChart';
import {
  Building2,
  TrendingUp,
  Droplets,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Star,
  Bell,
  Plus,
  ClipboardList,
  Users,
  ChevronRight,
  Database,
} from 'lucide-react';
import { format } from 'date-fns';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const DEAL_STAGES = ['New', 'Contacted', 'Audit Scheduled', 'Audit Done', 'Proposal Sent', 'Negotiation', 'Won', 'Lost'];

function getStatusColor(status: string): string {
  switch (status) {
    case 'Won': case 'Installed': case 'WaaS': return 'bg-teal-100 text-teal-800';
    case 'Hot': return 'bg-red-100 text-red-700';
    case 'Warm Lead': case 'Warm': return 'bg-amber-100 text-amber-800';
    case 'Audited': return 'bg-blue-100 text-blue-800';
    case 'Referred': return 'bg-purple-100 text-purple-800';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export default function Dashboard() {
  const { state, updateReminder } = useStore();
  const { buildings, deals, areas, audits, referrals, reminders, settings } = state;

  const today = new Date();
  const isCrisisSeason = today.getMonth() >= 3 && today.getMonth() <= 5;

  const wonReferrals = useMemo(() =>
    referrals.filter(r => r.status === 'Commission Paid'), [referrals]);

  const totalCommissions = useMemo(() =>
    wonReferrals.reduce((s, r) => s + (r.commissionPaid || 0), 0), [wonReferrals]);

  const activeReferrals = useMemo(() =>
    referrals.filter(r => !['Commission Paid', 'Converted'].includes(r.status)).length, [referrals]);

  const auditsThisMonth = useMemo(() => {
    return audits.filter(a => {
      const d = new Date(a.date);
      return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
    });
  }, [audits, today]);

  const totalWaterSaved = useMemo(() =>
    deals.filter(d => d.stage === 'Won').reduce((s, d) => s + d.waterSavedKLD, 0), [deals]);

  const totalGreywaterPotential = useMemo(() =>
    buildings.reduce((s, b) => s + (b.greywaterPotentialLpd || (b.dailyWaterConsumption || 0) * 1000 * 0.38), 0), [buildings]);

  const totalWaterWasteIdentified = useMemo(() =>
    buildings.reduce((s, b) => {
      const monthly = b.monthlyWaterSpend || (b.tankerCostAnnual ? b.tankerCostAnnual / 12 : 0);
      return s + monthly * 12 * 0.35;
    }, 0), [buildings]);

  // Pipeline funnel
  const funnelData = useMemo(() => {
    return DEAL_STAGES.map(stage => ({
      stage,
      count: deals.filter(d => d.stage === stage).length,
      value: deals.filter(d => d.stage === stage).reduce((s, d) => s + d.value, 0),
    }));
  }, [deals]);

  // Revenue by city
  const revenueByCity = useMemo(() => {
    const cityMap: Record<string, number> = {};
    deals.filter(d => d.stage === 'Won').forEach(deal => {
      const building = buildings.find(b => b.id === deal.buildingId);
      if (!building) return;
      const city = state.cities.find(c => c.id === building.cityId);
      if (!city) return;
      cityMap[city.name] = (cityMap[city.name] || 0) + deal.value;
    });
    return Object.entries(cityMap).map(([city, revenue]) => ({ city, revenue }));
  }, [deals, buildings, state.cities]);

  // Today's reminders
  const todayReminders = useMemo(() => {
    const todayStr = today.toISOString().split('T')[0];
    return reminders.filter(r => !r.completed && r.dueDate <= todayStr);
  }, [reminders, today]);

  // Strategic insights
  const insights = useMemo(() => {
    const result: { type: 'warning' | 'success' | 'star' | 'urgent'; text: string; action?: string }[] = [];

    if (isCrisisSeason) {
      result.push({
        type: 'urgent',
        text: 'Delhi water crisis season is active. This is your highest-conversion window of the year.',
        action: 'Contact all Hot and Warm prospects this week.',
      });
    }

    const hotNoContact = buildings.filter(b => {
      if (b.status !== 'Hot') return false;
      if (!b.lastContactedAt) return true;
      const daysSince = (today.getTime() - new Date(b.lastContactedAt).getTime()) / (1000 * 60 * 60 * 24);
      return daysSince > 14;
    });
    if (hotNoContact.length > 0) {
      result.push({
        type: 'warning',
        text: `${hotNoContact.length} Hot prospect(s) with no contact in 14+ days.`,
        action: `Call ${hotNoContact[0].contactName} at ${hotNoContact[0].name} today.`,
      });
    }

    const areaStats = areas.map(area => {
      const areaBuildings = buildings.filter(b => b.areaId === area.id);
      const wonBuildings = areaBuildings.filter(b => ['Won', 'Installed', 'WaaS'].includes(b.status)).length;
      const conversionRate = areaBuildings.length ? wonBuildings / areaBuildings.length : 0;
      return { area, conversionRate, total: areaBuildings.length };
    });

    const highConvArea = areaStats.filter(a => a.total >= 2).sort((a, b) => b.conversionRate - a.conversionRate)[0];
    if (highConvArea && highConvArea.conversionRate > 0) {
      result.push({
        type: 'success',
        text: `${highConvArea.area.name} has your best conversion rate (${Math.round(highConvArea.conversionRate * 100)}%).`,
        action: 'Spend more prospecting time here this week.',
      });
    }

    const overdueCommission = referrals.filter(r => {
      if (r.status !== 'Complete') return false;
      return true;
    });
    if (overdueCommission.length > 0) {
      const overdue = overdueCommission.reduce((s, r) => s + (r.expectedCommission || 0) - (r.commissionPaid || 0), 0);
      if (overdue > 0) {
        result.push({
          type: 'warning',
          text: `${fmtLakh(overdue)} in commissions pending payment from completed installations.`,
          action: 'Follow up with manufacturers today.',
        });
      }
    }

    if (settings.currentPhase === 1 && totalCommissions >= 500000) {
      result.push({
        type: 'star',
        text: `You have earned ${fmtLakh(totalCommissions)} in commissions. You are ready for Phase 2.`,
        action: 'Review Phase 2 readiness checklist in Expansion.',
      });
    }

    return result.slice(0, 5);
  }, [areas, buildings, deals, referrals, isCrisisSeason, today, settings.currentPhase, totalCommissions]);

  // Phase progress
  const phaseProgress = useMemo(() => {
    if (settings.currentPhase === 1) {
      const pct = Math.min((totalCommissions / 500000) * 100, 100);
      return {
        phase: 1,
        label: 'Phase 1 — Referral Commissions',
        milestone: '₹5L commissions → Phase 2',
        pct,
        current: fmtLakh(totalCommissions),
        target: '₹5L',
      };
    }
    return null;
  }, [settings.currentPhase, totalCommissions]);

  // KPI cards
  const kpiCards = [
    {
      label: 'Total Buildings',
      value: buildings.length.toString(),
      icon: Building2,
      color: 'bg-teal-50 text-teal-700',
      iconBg: 'bg-teal-100',
      sub: `${buildings.filter(b => ['Won', 'Installed', 'WaaS'].includes(b.status)).length} converted`,
    },
    {
      label: 'Audits This Month',
      value: auditsThisMonth.length.toString(),
      icon: ClipboardList,
      color: 'bg-blue-50 text-blue-700',
      iconBg: 'bg-blue-100',
      sub: `${audits.length} total audits`,
    },
    {
      label: 'Active Referrals',
      value: activeReferrals.toString(),
      icon: Users,
      color: 'bg-purple-50 text-purple-700',
      iconBg: 'bg-purple-100',
      sub: `${wonReferrals.length} commissions paid`,
    },
    {
      label: 'Total Commissions',
      value: fmtLakh(totalCommissions),
      icon: TrendingUp,
      color: 'bg-amber-50 text-amber-700',
      iconBg: 'bg-amber-100',
      sub: `Phase ${settings.currentPhase} of 3`,
    },
    {
      label: 'Water Saved',
      value: `${totalWaterSaved} KLD`,
      icon: Droplets,
      color: 'bg-cyan-50 text-cyan-700',
      iconBg: 'bg-cyan-100',
      sub: `${Math.round(totalWaterSaved * 365)} KL/year`,
    },
  ];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">Water Business Expansion OS</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/crm" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0F6E56] text-white rounded-lg text-sm font-medium hover:bg-[#0c5844] transition-colors">
            <Plus size={14} /> New Building
          </Link>
          <Link to="/audits" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <ClipboardList size={14} /> New Audit
          </Link>
          <Link to="/referrals" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
            <Users size={14} /> Log Referral
          </Link>
        </div>
      </div>

      {/* Phase progress bar */}
      {phaseProgress && (
        <Card className="border-l-4 border-l-[#0F6E56]">
          <CardBody className="py-3">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-xs font-semibold text-[#0F6E56] uppercase tracking-wide">{phaseProgress.label}</span>
                <span className="ml-2 text-xs text-gray-500">→ {phaseProgress.milestone}</span>
              </div>
              <span className="text-sm font-bold text-gray-900">{phaseProgress.current} / {phaseProgress.target}</span>
            </div>
            <div className="w-full bg-gray-100 rounded-full h-2">
              <div
                className="bg-[#0F6E56] h-2 rounded-full transition-all"
                style={{ width: `${phaseProgress.pct}%` }}
              />
            </div>
            {phaseProgress.pct >= 100 && (
              <p className="text-xs text-[#0F6E56] font-semibold mt-1.5">🎉 Milestone reached! Review Phase 2 readiness in Expansion.</p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Data asset counter */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 flex flex-wrap gap-4 items-center">
        <Database size={16} className="text-gray-400 flex-shrink-0" />
        <span className="text-sm text-gray-600">
          <strong className="text-gray-900">Your database:</strong>{' '}
          <span className="font-semibold text-[#0F6E56]">{buildings.length} buildings</span>
          {' · '}
          <span className="font-semibold text-blue-700">{Math.round(totalGreywaterPotential / 1000)} KLD recoverable</span>
          {' · '}
          <span className="font-semibold text-amber-700">{fmtLakh(totalWaterWasteIdentified)} water waste/yr identified</span>
        </span>
        <Link to="/reports" className="ml-auto text-xs text-[#0F6E56] font-medium hover:underline flex items-center gap-1">
          Export data <ChevronRight size={12} />
        </Link>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-3">
        {kpiCards.map(card => (
          <Card key={card.label}>
            <CardBody className="flex items-center gap-3 py-4">
              <div className={`p-2.5 rounded-xl flex-shrink-0 ${card.iconBg}`}>
                <card.icon size={18} className={card.color.split(' ')[1]} />
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide leading-none">{card.label}</p>
                <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{card.value}</p>
                <p className="text-[10px] text-gray-400 mt-0.5 truncate">{card.sub}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue by city */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Commission Revenue by City</h2>
          </CardHeader>
          <CardBody>
            <BarChart
              data={revenueByCity}
              bars={[{ dataKey: 'revenue', fill: '#0F6E56', name: 'Revenue' }]}
              xKey="city"
              yTickFormatter={fmtLakh}
              tooltipFormatter={fmtCurrency}
              height={220}
            />
          </CardBody>
        </Card>

        {/* Strategic insights */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb size={16} className="text-amber-500" />
              <h2 className="font-semibold text-gray-900">Where to Focus</h2>
            </div>
          </CardHeader>
          <CardBody className="space-y-2.5">
            {insights.map((insight, i) => (
              <div
                key={i}
                className={`p-3 rounded-xl text-sm border ${
                  insight.type === 'urgent'
                    ? 'bg-red-50 border-red-100'
                    : insight.type === 'warning'
                    ? 'bg-amber-50 border-amber-100'
                    : insight.type === 'success'
                    ? 'bg-green-50 border-green-100'
                    : 'bg-blue-50 border-blue-100'
                }`}
              >
                <div className="flex gap-2">
                  <div className="flex-shrink-0 mt-0.5">
                    {(insight.type === 'warning' || insight.type === 'urgent') && <AlertTriangle size={14} className={insight.type === 'urgent' ? 'text-red-500' : 'text-amber-500'} />}
                    {insight.type === 'success' && <CheckCircle2 size={14} className="text-green-500" />}
                    {insight.type === 'star' && <Star size={14} className="text-blue-500" />}
                  </div>
                  <div>
                    <p className={`leading-snug text-xs ${
                      insight.type === 'urgent' ? 'text-red-800' :
                      insight.type === 'warning' ? 'text-amber-800' :
                      insight.type === 'success' ? 'text-green-800' : 'text-blue-800'
                    }`}>{insight.text}</p>
                    {insight.action && (
                      <p className={`text-xs font-semibold mt-1 ${
                        insight.type === 'urgent' ? 'text-red-700' :
                        insight.type === 'warning' ? 'text-amber-700' :
                        insight.type === 'success' ? 'text-green-700' : 'text-blue-700'
                      }`}>→ {insight.action}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-4">No urgent insights right now.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Pipeline Funnel</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {funnelData.filter(f => f.count > 0).map(item => {
                const maxCount = Math.max(...funnelData.map(f => f.count), 1);
                const widthPct = Math.max((item.count / maxCount) * 100, 8);
                return (
                  <div key={item.stage} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-gray-600 font-medium text-right flex-shrink-0">{item.stage}</div>
                    <div className="flex-1 bg-gray-100 rounded-full h-7 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center px-3 transition-all ${
                          item.stage === 'Won' ? 'bg-[#0F6E56]' :
                          item.stage === 'Lost' ? 'bg-red-400' :
                          item.stage === 'Negotiation' ? 'bg-amber-500' :
                          'bg-blue-600'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="text-white text-xs font-semibold">{item.count}</span>
                      </div>
                    </div>
                    <div className="w-16 text-xs text-gray-500 text-right flex-shrink-0">{fmtLakh(item.value)}</div>
                  </div>
                );
              })}
            </div>
          </CardBody>
        </Card>

        {/* Today's Reminders */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-[#0F6E56]" />
                <h2 className="font-semibold text-gray-900">Today's Follow-ups</h2>
              </div>
              {todayReminders.length > 0 && (
                <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {todayReminders.length} due
                </span>
              )}
            </div>
          </CardHeader>
          <CardBody className="divide-y divide-gray-50">
            {todayReminders.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-4">No follow-ups due today. Nice work!</p>
            )}
            {todayReminders.map(rem => {
              const building = rem.buildingId ? buildings.find(b => b.id === rem.buildingId) : null;
              return (
                <div key={rem.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle size={14} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{rem.message}</p>
                    {building && (
                      <p className="text-xs text-gray-500 mt-0.5">{building.name} · {building.contactName}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {building?.contactPhone && (
                      <a
                        href={`https://wa.me/${building.contactPhone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium hover:bg-green-200 transition-colors"
                      >
                        WhatsApp
                      </a>
                    )}
                    <button
                      onClick={() => updateReminder({ ...rem, completed: true, completedAt: new Date().toISOString() })}
                      className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium hover:bg-gray-200 transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
            {todayReminders.length > 0 && (
              <div className="pt-3">
                <Link to="/reminders" className="text-xs text-[#0F6E56] font-medium hover:underline flex items-center gap-1">
                  View all reminders <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* Recent Buildings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Recent Building Activity</h2>
            <Link to="/crm" className="text-xs text-[#0F6E56] font-medium hover:underline flex items-center gap-1">
              View all <ChevronRight size={12} />
            </Link>
          </div>
        </CardHeader>
        <CardBody className="divide-y divide-gray-50">
          {[...buildings]
            .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
            .slice(0, 6)
            .map(b => {
              const area = areas.find(a => a.id === b.areaId);
              return (
                <div key={b.id} className="flex items-start justify-between py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{b.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{b.type} · {area?.name || '—'} · {b.contactName}</p>
                    {b.painQuote && (
                      <p className="text-xs text-gray-500 italic mt-0.5 truncate max-w-xs">"{b.painQuote}"</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 ml-3 flex-shrink-0">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(b.status)}`}>
                      {b.status}
                    </span>
                    {b.followUpDate && new Date(b.followUpDate) <= new Date() && (
                      <span className="text-[10px] text-red-500 font-medium">Follow-up due</span>
                    )}
                  </div>
                </div>
              );
            })}
        </CardBody>
      </Card>
    </div>
  );
}
