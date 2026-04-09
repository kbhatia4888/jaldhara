import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { BarChart } from '../components/charts/BarChart';
import { LabelWithTooltip } from '../components/ui/Tooltip';
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
  ChevronDown,
  Lock,
  BookOpen,
  ArrowRight,
  Leaf,
  Waves,
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
    case 'Won': case 'Installed': case 'WaaS': return 'bg-teal-100 text-brand-700';
    case 'Hot': return 'bg-red-100 text-red-700';
    case 'Warm Lead': case 'Warm': return 'bg-amber-100 text-amber-800';
    case 'Audited': return 'bg-blue-100 text-blue-800';
    case 'Referred': return 'bg-purple-100 text-purple-800';
    default: return 'bg-[#EDE4D4] text-[#5C5244]';
  }
}

const PHASES = [
  {
    num: 1,
    title: 'Audit and Refer',
    timeline: 'Now to Month 18',
    color: 'teal',
    unlockAt: '₹5L commissions',
    unlockValue: 500000,
    what: 'Visit buildings in North Delhi. Conduct free water audits. Show the DJB rebate customers are missing. When a building wants a system, refer them to a vetted manufacturer — who pays you 10–15% commission.',
    capital: 'Zero capital needed. Only your time and this app.',
    earn: '₹40,000–₹1,50,000 per referral commission. Target ₹8–15 lakh total by Month 18.',
    building: 'Relationships, a database of building water data, and a reputation as the trusted water expert.',
    risk: 'Very low — you own no equipment, take no debt.',
    nextSteps: ['Visit 3 buildings this week (hospital, school, or banquet hall)', 'Use Scripts section for what to say', 'Add every building you visit to CRM'],
  },
  {
    num: 2,
    title: 'Own Installations',
    timeline: 'Month 12–24',
    color: 'blue',
    unlockAt: '2 owned systems running',
    unlockValue: 2,
    what: 'Use Phase 1 savings to buy and install your first greywater system under the JalDhara brand. You own it. You charge the building an installation fee + Annual Maintenance Contract (AMC) every year.',
    capital: '₹3–8 lakh saved capital. One trusted civil/plumbing contractor.',
    earn: 'Full installation margin (not just commission) + ₹15,000–50,000 AMC per system per year.',
    building: 'Your own installation track record. Case studies with real performance data.',
    risk: 'Moderate — capital tied up per system. Never borrow until Phase 1 has funded it fully.',
    nextSteps: ['Complete 10+ audits to identify best first installation candidate', 'Save ₹3L+ from Phase 1 commissions', 'Find 1 civil contractor who has worked with water systems'],
  },
  {
    num: 3,
    title: 'Water-as-a-Service',
    timeline: 'Month 24 onwards',
    color: 'purple',
    unlockAt: '₹15L ARR',
    unlockValue: 1500000,
    what: 'Install systems at zero upfront cost to the customer. They pay a monthly fee or per-KL rate. You own the asset, maintain it, and earn recurring income for 5–10 years.',
    capital: '2+ owned systems already running as proof. Capital or credit for new installations.',
    earn: '₹1.5–3 lakh per system per year. 10 systems = ₹15–30 lakh/year recurring.',
    building: 'Monthly recurring revenue (MRR), an asset portfolio, and a data platform for ESG investors.',
    risk: 'Low once you have proof. Never start WaaS before Phases 1 and 2 give you knowledge and capital.',
    nextSteps: ['Complete Phase 2 with 2+ owned systems', 'Document system performance data month by month', 'Draft your first WaaS contract template'],
  },
];

const JOURNEY_STAGES = [
  {
    num: 1, title: 'First Visit', sub: 'Cold',
    color: 'bg-[#EDE4D4] text-[#463F2E]',
    what: 'You visit the building for the first time. You are listening and learning — not selling.',
    jaldhara: 'Add the building to CRM. Fill the data sheet. Set a 3-day follow-up reminder.',
    duration: '1 visit, 20–45 min',
  },
  {
    num: 2, title: 'Follow-up', sub: 'Warm',
    color: 'bg-amber-100 text-amber-700',
    what: 'You send the DJB rebate info via WhatsApp. You answer questions. You build trust.',
    jaldhara: 'Use Scripts → WhatsApp template. Mark building Warm. Log the follow-up.',
    duration: '1–3 weeks',
  },
  {
    num: 3, title: 'Audit', sub: 'Hot',
    color: 'bg-red-100 text-red-700',
    what: 'The building agrees to a full water audit. You spend 1–2 hours measuring everything.',
    jaldhara: 'Complete the 8-step audit form. Generate PDF report. Present it in person.',
    duration: '1 site visit + 2–3 days for report',
  },
  {
    num: 4, title: 'Referral', sub: 'Referred',
    color: 'bg-purple-100 text-purple-700',
    what: 'The building wants a system. You introduce them to a manufacturer who visits and proposes.',
    jaldhara: 'Log the referral. Track status. Follow up with manufacturer every 2 weeks.',
    duration: '4–12 weeks',
  },
  {
    num: 5, title: 'Commission', sub: 'Complete',
    color: 'bg-green-100 text-green-700',
    what: 'Installation is complete. Manufacturer pays your 10–15% referral commission.',
    jaldhara: 'Mark referral as Commission Paid. Log the amount. Update revenue tracker.',
    duration: '2–4 weeks after install',
  },
  {
    num: 6, title: 'AMC', sub: 'Phase 2+',
    color: 'bg-blue-100 text-blue-700',
    what: 'If you own the installation, you service the system annually and charge an AMC fee.',
    jaldhara: 'Log AMC schedule. Set annual reminder. Generate AMC invoice.',
    duration: 'Annual, recurring',
  },
  {
    num: 7, title: 'WaaS', sub: 'Phase 3',
    color: 'bg-teal-100 text-teal-700',
    what: 'You install at zero cost to the customer. They pay monthly. You own the asset.',
    jaldhara: 'Create WaaS contract. Log monthly payments. Generate monthly impact certificate.',
    duration: '5–10 year contracts',
  },
];

export default function Dashboard() {
  const { state, updateReminder } = useStore();
  const { buildings, deals, areas, audits, referrals, reminders, settings, rwhAssessments, treeProjects, waterBodies } = state;

  const [phasesOpen, setPhasesOpen] = useState(false);
  const [journeyOpen, setJourneyOpen] = useState(false);

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
      tooltip: 'KLD',
      icon: Droplets,
      color: 'bg-cyan-50 text-cyan-700',
      iconBg: 'bg-cyan-100',
      sub: `${Math.round(totalWaterSaved * 365)} KL/year`,
    },
  ] as { label: string; value: string; tooltip?: string; icon: React.ElementType; color: string; iconBg: string; sub: string }[];

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#2C2820]">Dashboard</h1>
          <p className="text-[#8C8062] text-sm mt-0.5">Water Business Expansion OS</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Link to="/crm" className="flex items-center gap-1.5 px-3 py-1.5 bg-[#567C45] text-white rounded-lg text-sm font-medium hover:bg-[#436036] transition-colors">
            <Plus size={14} /> New Building
          </Link>
          <Link to="/audits" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2D5BE] text-[#463F2E] rounded-lg text-sm font-medium hover:bg-[#F6F1EA] transition-colors">
            <ClipboardList size={14} /> New Audit
          </Link>
          <Link to="/referrals" className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2D5BE] text-[#463F2E] rounded-lg text-sm font-medium hover:bg-[#F6F1EA] transition-colors">
            <Users size={14} /> Log Referral
          </Link>
        </div>
      </div>

      {/* Phase progress bar */}
      {phaseProgress && (
        <Card className="border-l-4 border-l-[#567C45]">
          <CardBody className="py-3">
            <div className="flex items-center justify-between mb-1.5">
              <div>
                <span className="text-xs font-semibold text-[#567C45] uppercase tracking-wide">{phaseProgress.label}</span>
                <span className="ml-2 text-xs text-[#8C8062]">→ {phaseProgress.milestone}</span>
              </div>
              <span className="text-sm font-bold text-[#2C2820]">{phaseProgress.current} / {phaseProgress.target}</span>
            </div>
            <div className="w-full bg-[#EDE4D4] rounded-full h-2">
              <div
                className="bg-[#567C45] h-2 rounded-full transition-all"
                style={{ width: `${phaseProgress.pct}%` }}
              />
            </div>
            {phaseProgress.pct >= 100 && (
              <p className="text-xs text-[#567C45] font-semibold mt-1.5">🎉 Milestone reached! Review Phase 2 readiness in Expansion.</p>
            )}
          </CardBody>
        </Card>
      )}

      {/* Data asset counter */}
      <div className="bg-[#F6F1EA] border border-[#E2D5BE] rounded-xl px-4 py-3 flex flex-wrap gap-4 items-center">
        <Database size={16} className="text-[#ADA082] flex-shrink-0" />
        <span className="text-sm text-[#5C5244]">
          <strong className="text-[#2C2820]">Your database:</strong>{' '}
          <span className="font-semibold text-[#567C45]">{buildings.length} buildings</span>
          {' · '}
          <span className="font-semibold text-blue-700">{Math.round(totalGreywaterPotential / 1000)} KLD recoverable</span>
          {' · '}
          <span className="font-semibold text-amber-700">{fmtLakh(totalWaterWasteIdentified)} water waste/yr identified</span>
        </span>
        <Link to="/reports" className="ml-auto text-xs text-[#567C45] font-medium hover:underline flex items-center gap-1">
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
                <p className="text-[10px] font-semibold text-[#8C8062] uppercase tracking-wide leading-none">
                  {card.tooltip ? <LabelWithTooltip label={card.label} term={card.tooltip} /> : card.label}
                </p>
                <p className="text-xl font-bold text-[#2C2820] mt-0.5 truncate">{card.value}</p>
                <p className="text-[10px] text-[#ADA082] mt-0.5 truncate">{card.sub}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* ── 4-STREAM IMPACT PANEL ─────────────────────── */}
      <div>
        <h2 className="text-sm font-semibold text-[#8C8062] uppercase tracking-wide mb-3">Impact Streams</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Greywater */}
          <Link to="/audits" className="group">
            <Card className="hover:shadow-md transition-shadow">
              <CardBody className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center">
                    <Droplets size={14} className="text-teal-700" />
                  </div>
                  <span className="text-xs font-semibold text-teal-700">Greywater</span>
                </div>
                <p className="text-xl font-bold text-[#2C2820]">{buildings.filter(b => b.recyclingStatus && b.recyclingStatus !== 'None').length}</p>
                <p className="text-xs text-[#8C8062] mt-0.5">systems tracked</p>
                <p className="text-xs text-teal-600 mt-1">{Math.round(buildings.reduce((s, b) => s + (b.greywaterPotentialLpd ?? 0), 0) / 1000)} KLD potential</p>
                <p className="text-[10px] text-[#ADA082] mt-2 group-hover:text-teal-600 transition-colors">Go to Audits →</p>
              </CardBody>
            </Card>
          </Link>

          {/* RWH */}
          <Link to="/rwh" className="group">
            <Card className="hover:shadow-md transition-shadow">
              <CardBody className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center">
                    <Droplets size={14} className="text-blue-700" />
                  </div>
                  <span className="text-xs font-semibold text-blue-700">Rainwater</span>
                </div>
                <p className="text-xl font-bold text-[#2C2820]">{rwhAssessments.length}</p>
                <p className="text-xs text-[#8C8062] mt-0.5">assessments</p>
                <p className="text-xs text-blue-600 mt-1">
                  {Math.round(rwhAssessments.reduce((s, r) => s + r.annualHarvestPotentialLitres, 0) / 1000)} KL/yr harvest
                </p>
                <p className="text-[10px] text-[#ADA082] mt-2 group-hover:text-blue-600 transition-colors">Go to RWH →</p>
              </CardBody>
            </Card>
          </Link>

          {/* Urban Trees */}
          <Link to="/trees" className="group">
            <Card className="hover:shadow-md transition-shadow">
              <CardBody className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-green-100 flex items-center justify-center">
                    <Leaf size={14} className="text-green-700" />
                  </div>
                  <span className="text-xs font-semibold text-green-700">Urban Trees</span>
                </div>
                <p className="text-xl font-bold text-[#2C2820]">{treeProjects.reduce((s, p) => s + p.treesPlanted, 0)}</p>
                <p className="text-xs text-[#8C8062] mt-0.5">trees planted</p>
                <p className="text-xs text-green-600 mt-1">
                  {Math.round(treeProjects.reduce((s, p) => s + p.estimatedCo2PerYearKg, 0) / 1000 * 10) / 10} t CO₂/yr
                </p>
                <p className="text-[10px] text-[#ADA082] mt-2 group-hover:text-green-600 transition-colors">Go to Trees →</p>
              </CardBody>
            </Card>
          </Link>

          {/* Lakes */}
          <Link to="/lakes" className="group">
            <Card className="hover:shadow-md transition-shadow">
              <CardBody className="py-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center">
                    <Waves size={14} className="text-cyan-700" />
                  </div>
                  <span className="text-xs font-semibold text-cyan-700">Lakes</span>
                </div>
                <p className="text-xl font-bold text-[#2C2820]">{waterBodies.length}</p>
                <p className="text-xs text-[#8C8062] mt-0.5">water bodies</p>
                <p className="text-xs text-cyan-600 mt-1">
                  {waterBodies.filter(wb => wb.restorationStatus === 'Work Started' || wb.restorationStatus === 'Restoration Complete').length} in restoration
                </p>
                <p className="text-[10px] text-[#ADA082] mt-2 group-hover:text-cyan-600 transition-colors">Go to Lakes →</p>
              </CardBody>
            </Card>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Revenue by city */}
        <Card className="xl:col-span-2">
          <CardHeader>
            <h2 className="font-semibold text-[#2C2820]">Commission Revenue by City</h2>
          </CardHeader>
          <CardBody>
            <BarChart
              data={revenueByCity}
              bars={[{ dataKey: 'revenue', fill: '#567C45', name: 'Revenue' }]}
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
              <h2 className="font-semibold text-[#2C2820]">Where to Focus</h2>
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
              <p className="text-[#ADA082] text-sm text-center py-4">No urgent insights right now.</p>
            )}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        {/* Pipeline Funnel */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[#2C2820]">Pipeline Funnel</h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-2">
              {funnelData.filter(f => f.count > 0).map(item => {
                const maxCount = Math.max(...funnelData.map(f => f.count), 1);
                const widthPct = Math.max((item.count / maxCount) * 100, 8);
                return (
                  <div key={item.stage} className="flex items-center gap-3">
                    <div className="w-28 text-xs text-[#5C5244] font-medium text-right flex-shrink-0">{item.stage}</div>
                    <div className="flex-1 bg-[#EDE4D4] rounded-full h-7 relative overflow-hidden">
                      <div
                        className={`h-full rounded-full flex items-center px-3 transition-all ${
                          item.stage === 'Won' ? 'bg-[#567C45]' :
                          item.stage === 'Lost' ? 'bg-red-400' :
                          item.stage === 'Negotiation' ? 'bg-amber-500' :
                          'bg-blue-600'
                        }`}
                        style={{ width: `${widthPct}%` }}
                      >
                        <span className="text-white text-xs font-semibold">{item.count}</span>
                      </div>
                    </div>
                    <div className="w-16 text-xs text-[#8C8062] text-right flex-shrink-0">{fmtLakh(item.value)}</div>
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
                <Bell size={16} className="text-[#567C45]" />
                <h2 className="font-semibold text-[#2C2820]">Today's Follow-ups</h2>
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
              <p className="text-sm text-[#ADA082] text-center py-4">No follow-ups due today. Nice work!</p>
            )}
            {todayReminders.map(rem => {
              const building = rem.buildingId ? buildings.find(b => b.id === rem.buildingId) : null;
              return (
                <div key={rem.id} className="flex items-start gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex-shrink-0 mt-0.5">
                    <AlertTriangle size={14} className="text-amber-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#2C2820] truncate">{rem.message}</p>
                    {building && (
                      <p className="text-xs text-[#8C8062] mt-0.5">{building.name} · {building.contactName}</p>
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
                      className="px-2 py-1 bg-[#EDE4D4] text-[#463F2E] rounded text-xs font-medium hover:bg-[#DDD0BC] transition-colors"
                    >
                      Done
                    </button>
                  </div>
                </div>
              );
            })}
            {todayReminders.length > 0 && (
              <div className="pt-3">
                <Link to="/reminders" className="text-xs text-[#567C45] font-medium hover:underline flex items-center gap-1">
                  View all reminders <ChevronRight size={12} />
                </Link>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* ── BUSINESS PHASES ─────────────────────────────── */}
      <Card className="border-l-4 border-l-[#534AB7]">
        <CardHeader>
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setPhasesOpen(o => !o)}
          >
            <div className="flex items-center gap-2">
              <BookOpen size={16} className="text-[#534AB7]" />
              <h2 className="font-semibold text-[#2C2820]">Business Phases — How This Works</h2>
            </div>
            <ChevronDown size={16} className={`text-[#ADA082] transition-transform ${phasesOpen ? 'rotate-180' : ''}`} />
          </button>
        </CardHeader>
        {phasesOpen && (
          <CardBody className="space-y-4 pt-0">
            {/* Phase stepper */}
            <div className="flex items-center gap-0 mb-4">
              {PHASES.map((p, i) => {
                const isActive = settings.currentPhase === p.num;
                const isLocked = p.num > settings.currentPhase;
                return (
                  <React.Fragment key={p.num}>
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                      isActive ? 'bg-[#567C45] text-white' :
                      isLocked ? 'bg-[#EDE4D4] text-[#ADA082]' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {isLocked && <Lock size={11} />}
                      {!isLocked && !isActive && <CheckCircle2 size={11} />}
                      Phase {p.num}: {p.title}
                    </div>
                    {i < PHASES.length - 1 && (
                      <ArrowRight size={14} className="text-gray-300 flex-shrink-0 mx-1" />
                    )}
                  </React.Fragment>
                );
              })}
            </div>

            {/* Phase cards */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
              {PHASES.map(p => {
                const isActive = settings.currentPhase === p.num;
                const isLocked = p.num > settings.currentPhase;
                return (
                  <div
                    key={p.num}
                    className={`rounded-2xl p-4 border-2 ${
                      isActive ? 'border-[#567C45] bg-[#567C45]/5' :
                      isLocked ? 'border-[#EDE4D4] bg-[#F6F1EA] opacity-60' :
                      'border-green-200 bg-green-50'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${
                          isActive ? 'text-[#567C45]' : isLocked ? 'text-[#ADA082]' : 'text-green-700'
                        }`}>
                          Phase {p.num} · {p.timeline}
                        </div>
                        <h3 className="font-bold text-[#2C2820]">{p.title}</h3>
                      </div>
                      {isLocked && <span className="text-[10px] bg-[#DDD0BC] text-[#8C8062] px-2 py-0.5 rounded-full font-semibold">Locked until {p.unlockAt}</span>}
                      {isActive && <span className="text-[10px] bg-[#567C45] text-white px-2 py-0.5 rounded-full font-semibold">You are here</span>}
                      {!isActive && !isLocked && <span className="text-[10px] bg-green-200 text-green-700 px-2 py-0.5 rounded-full font-semibold">Completed</span>}
                    </div>
                    <p className="text-xs text-[#5C5244] leading-relaxed mb-3">{p.what}</p>
                    <div className="space-y-2 text-xs">
                      <div className="flex gap-2"><span className="text-[#ADA082] font-semibold w-16 flex-shrink-0">Capital:</span><span className="text-[#463F2E]">{p.capital}</span></div>
                      <div className="flex gap-2"><span className="text-[#ADA082] font-semibold w-16 flex-shrink-0">You earn:</span><span className="text-[#463F2E]">{p.earn}</span></div>
                      <div className="flex gap-2"><span className="text-[#ADA082] font-semibold w-16 flex-shrink-0">Risk:</span><span className="text-[#463F2E]">{p.risk}</span></div>
                    </div>
                    {isActive && (
                      <div className="mt-3 border-t border-[#567C45]/20 pt-3">
                        <p className="text-[10px] font-bold text-[#567C45] uppercase tracking-wide mb-1.5">Your next steps</p>
                        <ul className="space-y-1">
                          {p.nextSteps.map((s, i) => (
                            <li key={i} className="text-xs text-[#463F2E] flex gap-1.5 items-start">
                              <span className="text-[#567C45] font-bold flex-shrink-0">→</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </CardBody>
        )}
      </Card>

      {/* ── JOURNEY MAP ─────────────────────────────────── */}
      <Card>
        <CardHeader>
          <button
            className="w-full flex items-center justify-between"
            onClick={() => setJourneyOpen(o => !o)}
          >
            <div className="flex items-center gap-2">
              <ArrowRight size={16} className="text-[#BA7517]" />
              <h2 className="font-semibold text-[#2C2820]">How a Building Becomes Revenue — 7 Stages</h2>
            </div>
            <ChevronDown size={16} className={`text-[#ADA082] transition-transform ${journeyOpen ? 'rotate-180' : ''}`} />
          </button>
        </CardHeader>
        {journeyOpen && (
          <CardBody className="pt-0">
            {/* Mobile: vertical list */}
            <div className="flex flex-col sm:hidden gap-3">
              {JOURNEY_STAGES.map((s, i) => (
                <div key={s.num} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${s.color}`}>{s.num}</span>
                    {i < JOURNEY_STAGES.length - 1 && <div className="w-px bg-[#DDD0BC] flex-1 mt-1" />}
                  </div>
                  <div className="pb-3 min-w-0">
                    <div className="font-semibold text-sm text-[#2C2820]">{s.title} <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${s.color}`}>{s.sub}</span></div>
                    <p className="text-xs text-[#5C5244] mt-1 leading-relaxed">{s.what}</p>
                    <p className="text-xs text-[#567C45] mt-1 font-medium">In JalDhara: {s.jaldhara}</p>
                    <p className="text-[10px] text-[#ADA082] mt-1">⏱ {s.duration}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop: horizontal scroll */}
            <div className="hidden sm:flex gap-0 overflow-x-auto pb-2">
              {JOURNEY_STAGES.map((s, i) => (
                <React.Fragment key={s.num}>
                  <div className="flex-shrink-0 w-44 xl:w-48">
                    <div className={`px-3 py-2 rounded-xl text-center text-xs font-bold ${s.color}`}>
                      {s.num}. {s.title}
                      <div className="font-normal opacity-75">{s.sub}</div>
                    </div>
                    <div className="px-1 mt-2 space-y-1.5">
                      <p className="text-xs text-[#5C5244] leading-relaxed">{s.what}</p>
                      <p className="text-xs text-[#567C45] font-medium leading-snug">{s.jaldhara}</p>
                      <p className="text-[10px] text-[#ADA082]">⏱ {s.duration}</p>
                    </div>
                  </div>
                  {i < JOURNEY_STAGES.length - 1 && (
                    <div className="flex items-start pt-3 flex-shrink-0 mx-1">
                      <ArrowRight size={14} className="text-gray-300" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </CardBody>
        )}
      </Card>

      {/* Recent Buildings */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2C2820]">Recent Building Activity</h2>
            <Link to="/crm" className="text-xs text-[#567C45] font-medium hover:underline flex items-center gap-1">
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
                    <p className="text-sm font-medium text-[#2C2820] truncate">{b.name}</p>
                    <p className="text-xs text-[#ADA082] mt-0.5">{b.type} · {area?.name || '—'} · {b.contactName}</p>
                    {b.painQuote && (
                      <p className="text-xs text-[#8C8062] italic mt-0.5 truncate max-w-xs">"{b.painQuote}"</p>
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
