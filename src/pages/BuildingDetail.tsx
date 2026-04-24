import React, { useState, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { Card, CardBody } from '../components/ui/Card';
import { Badge, getBuildingStatusBadgeVariant, getDealStageBadgeVariant } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import type { Building, ContactLog, ContactLogType, Script, Manufacturer, City } from '../types';
import {
  ArrowLeft, Edit2, Plus, Phone, Mail, MapPin, Building2, Droplets,
  Calendar, MessageCircle, FileText, Users, ClipboardList, BookOpen,
  Clock, CheckCircle2, ChevronRight, Trash2, Copy, Check, Factory, Star,
} from 'lucide-react';
import { format, formatDistanceToNow, isPast, isToday, parseISO } from 'date-fns';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const LOG_TYPES: ContactLogType[] = [
  'Meeting', 'Phone call', 'WhatsApp', 'Email sent', 'No response', 'Follow-up set', 'Other',
];

const LOG_TYPE_COLORS: Record<ContactLogType, string> = {
  'Meeting':       'bg-blue-100 text-blue-700',
  'Phone call':    'bg-teal-100 text-teal-700',
  'WhatsApp':      'bg-green-100 text-green-700',
  'Email sent':    'bg-purple-100 text-purple-700',
  'No response':   'bg-gray-100 text-gray-600',
  'Follow-up set': 'bg-amber-100 text-amber-700',
  'Other':         'bg-[#EDE4D4] text-[#5C5244]',
};

const ALL_STATUSES: Building['status'][] = [
  'Cold', 'Warm Lead', 'Warm', 'Hot', 'Prospect', 'Audited', 'Referred', 'Installed', 'WaaS', 'Won', 'Lost',
];

const STATUS_COLORS: Record<string, string> = {
  Cold:       'bg-gray-100 text-gray-600 border-gray-200',
  'Warm Lead':'bg-amber-100 text-amber-700 border-amber-200',
  Warm:       'bg-amber-100 text-amber-700 border-amber-200',
  Hot:        'bg-red-100 text-red-700 border-red-200',
  Prospect:   'bg-blue-100 text-blue-700 border-blue-200',
  Audited:    'bg-blue-100 text-blue-700 border-blue-200',
  Referred:   'bg-purple-100 text-purple-700 border-purple-200',
  Installed:  'bg-teal-100 text-teal-700 border-teal-200',
  WaaS:       'bg-green-100 text-green-700 border-green-200',
  Won:        'bg-green-100 text-green-700 border-green-200',
  Lost:       'bg-gray-100 text-gray-500 border-gray-200',
};

const STATUS_HINTS: Record<string, string> = {
  'Cold→Warm Lead':   'Good progress. Send the DJB rebate WhatsApp within 3 days.',
  'Cold→Warm':        'Good progress. Send the DJB rebate WhatsApp within 3 days.',
  'Warm Lead→Warm':   'They are warming up. Follow up with DJB rebate details.',
  'Warm Lead→Hot':    'They are interested. Offer to do a free audit.',
  'Warm→Hot':         'They are interested. Offer to do a free audit.',
  'Hot→Prospect':     'Great! Schedule the audit visit now.',
  'Hot→Audited':      'Audit complete. Review the report and introduce a manufacturer.',
  'Prospect→Audited': 'Audit complete. Review the report and introduce a manufacturer.',
  'Audited→Referred': 'Referral made. Follow up with the manufacturer in 2 weeks.',
  'Referred→Installed':'Installation confirmed! Chase commission in 30 days.',
  'Installed→WaaS':   'Excellent! They have moved to Water-as-a-Service.',
};

const SCRIPT_CONTEXT: Record<string, Script['category'][]> = {
  Cold:       ['Cold Approach'],
  'Warm Lead':['DJB Rebate', 'WhatsApp Templates'],
  Warm:       ['DJB Rebate', 'WhatsApp Templates'],
  Hot:        ['Objection Handlers'],
  Prospect:   ['Objection Handlers', 'DJB Rebate'],
  Audited:    ['Referral Handover'],
  Referred:   ['Commission'],
  Installed:  ['Commission'],
};

const BUILDING_TYPES = [
  'Private Hospital','Private School / College','Banquet Hall / Marriage Venue',
  'Coaching Institute / Hostel','Hotel / Guest House','Housing Society (Gated / DDA)',
  'Individual Bungalow / Villa','Industrial Unit / Factory','Corporate Office / Business Park',
  'Government Institution','Restaurant / Food Business','Gym / Sports Facility','Other',
];
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

export default function BuildingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const {
    state,
    updateBuilding,
    addContactLog, deleteContactLog,
  } = useStore();

  const { buildings, contactLogs, audits, referrals, scripts, areas, cities, deals } = state;

  const building = buildings.find(b => b.id === id);

  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'audits' | 'referrals' | 'scripts'>('overview');
  const [showLogModal, setShowLogModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);

  // Log form
  const today = format(new Date(), 'yyyy-MM-dd');
  const [logForm, setLogForm] = useState<{
    date: string; type: ContactLogType; notes: string; nextAction: string; followUpDate: string;
  }>({ date: today, type: 'Meeting', notes: '', nextAction: '', followUpDate: '' });

  // Edit form
  const [eForm, setEForm] = useState({
    name: '', address: '', cityId: '', stateId: '', zip: '',
    type: '' as Building['type'] | '',
    status: 'Cold' as Building['status'],
    contactName: '', contactPhone: '', contactEmail: '', notes: '',
    monthlyWaterSpend: '', floors: '', flats: '', occupancyCount: '',
  });
  const [copied, setCopied] = useState<string | null>(null);

  const buildingLogs = useMemo(() =>
    contactLogs
      .filter(l => l.buildingId === id)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    [contactLogs, id]
  );

  const buildingAudits = useMemo(() =>
    audits.filter(a => a.buildingId === id),
    [audits, id]
  );

  const buildingDeals = useMemo(() =>
    deals.filter(d => d.buildingId === id),
    [deals, id]
  );

  const buildingReferrals = useMemo(() =>
    referrals.filter(r => r.fromBuildingId === id),
    [referrals, id]
  );

  const contextScripts = useMemo(() => {
    if (!building) return scripts;
    const relevantCats = SCRIPT_CONTEXT[building.status] ?? [];
    if (relevantCats.length === 0) return scripts;
    return scripts.filter(s => relevantCats.includes(s.category));
  }, [scripts, building]);

  const getAreaName = (areaId: string) => areas.find(a => a.id === areaId)?.name || '';
  const getCityName = (cityId: string) => cities.find(c => c.id === cityId)?.name || '';

  if (!building) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-16 text-center">
        <Building2 size={48} className="text-[#ADA082] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#2C2820] mb-2">Building not found</h2>
        <p className="text-[#8C8062] mb-6">This building may have been deleted.</p>
        <Button onClick={() => navigate('/crm')}>Back to CRM</Button>
      </div>
    );
  }

  // ── Derived metrics ──────────────────────────────────────
  const monthlySpend = building.monthlyWaterSpend ?? 0;
  const annualSpend = monthlySpend * 12;
  const greywaterLpd = building.greywaterPotentialLpd ?? 0;
  const djbRebate = building.djbRebateAnnual ?? (monthlySpend * 12 * 0.1);
  const estimatedSaving = building.estimatedAnnualSaving ?? (annualSpend * 0.35);

  const latestLog = buildingLogs[0];
  const daysSinceContact = latestLog
    ? Math.floor((Date.now() - new Date(latestLog.date).getTime()) / 86400000)
    : null;

  // ── Status change ────────────────────────────────────────
  function handleStatusChange(newStatus: Building['status']) {
    if (!building) return;
    const hint = STATUS_HINTS[`${building.status}→${newStatus}`];
    updateBuilding({ ...(building as Building), status: newStatus });
    setShowStatusMenu(false);
    toast('Status updated to ' + newStatus);
    if (hint) {
      setTimeout(() => toast(hint, 'info'), 400);
    }
  }

  // ── Log activity ─────────────────────────────────────────
  function handleAddLog() {
    if (!building || !logForm.notes.trim()) return;
    addContactLog({
      buildingId: building.id,
      date: logForm.date,
      type: logForm.type,
      notes: logForm.notes,
      nextAction: logForm.nextAction || undefined,
      followUpDate: logForm.followUpDate || undefined,
      createdAt: new Date().toISOString(),
    });
    // Auto-update building followUpDate if set
    if (logForm.followUpDate) {
      updateBuilding({ ...(building as Building), followUpDate: logForm.followUpDate, lastContactedAt: logForm.date });
    } else {
      updateBuilding({ ...(building as Building), lastContactedAt: logForm.date });
    }
    setLogForm({ date: today, type: 'Meeting', notes: '', nextAction: '', followUpDate: '' });
    setShowLogModal(false);
    toast('Activity logged');
  }

  // ── Edit building ─────────────────────────────────────────
  function openEdit() {
    if (!building) return;
    setEForm({
      name: building.name,
      address: building.address ?? '',
      cityId: building.cityId,
      stateId: building.stateId,
      zip: building.zip ?? '',
      type: building.type,
      status: building.status,
      contactName: building.contactName,
      contactPhone: building.contactPhone,
      contactEmail: building.contactEmail ?? '',
      notes: building.notes,
      monthlyWaterSpend: building.monthlyWaterSpend ? String(building.monthlyWaterSpend) : '',
      floors: building.floors ? String(building.floors) : '',
      flats: building.flats ? String(building.flats) : '',
      occupancyCount: building.occupancyCount ? String(building.occupancyCount) : '',
    });
    setShowEditModal(true);
  }

  function handleSaveEdit() {
    if (!building || (!eForm.name.trim() && !eForm.address.trim())) return;
    const selectedCity = cities.find(c => c.id === eForm.cityId);
    updateBuilding({
      ...(building as Building),
      name: eForm.name || eForm.address || building.name,
      address: eForm.address || undefined,
      zip: eForm.zip || undefined,
      cityId: eForm.cityId,
      stateId: eForm.stateId || selectedCity?.stateId || building.stateId,
      areaId: selectedCity ? (areas.find(a => a.cityId === selectedCity.id)?.id ?? building.areaId) : building.areaId,
      type: (eForm.type || building.type) as Building['type'],
      status: eForm.status,
      contactName: eForm.contactName,
      contactPhone: eForm.contactPhone,
      contactEmail: eForm.contactEmail || undefined,
      notes: eForm.notes,
      monthlyWaterSpend: parseInt(eForm.monthlyWaterSpend) || undefined,
      floors: parseInt(eForm.floors) || undefined,
      flats: parseInt(eForm.flats) || undefined,
      occupancyCount: parseInt(eForm.occupancyCount) || undefined,
    });
    setShowEditModal(false);
    toast('Building updated');
  }

  function copyScript(content: string, id: string) {
    navigator.clipboard.writeText(content);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function openWhatsApp(content: string) {
    if (!building) return;
    const phone = building.contactPhone.replace(/\D/g, '');
    const num = phone.startsWith('91') ? phone : `91${phone}`;
    const encoded = encodeURIComponent(content);
    if (phone.length >= 10) {
      window.open(`https://wa.me/${num}?text=${encoded}`, '_blank');
    } else {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    }
  }

  const TABS = [
    { key: 'overview',   label: 'Overview',      icon: Building2 },
    { key: 'activity',   label: `Activity (${buildingLogs.length})`, icon: ClipboardList },
    { key: 'audits',     label: `Audits (${buildingAudits.length})`, icon: FileText },
    { key: 'referrals',  label: `Referrals (${buildingReferrals.length})`, icon: Users },
    { key: 'scripts',    label: 'Scripts',        icon: BookOpen },
  ] as const;

  return (
    <div className="max-w-screen-lg mx-auto px-4 py-6 space-y-6">

      {/* Back + Header */}
      <div>
        <button
          onClick={() => navigate('/crm')}
          className="flex items-center gap-1.5 text-sm text-[#8C8062] hover:text-[#463F2E] mb-4 transition-colors"
        >
          <ArrowLeft size={16} /> Back to CRM
        </button>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-2xl font-bold text-[#2C2820]">{building.name}</h1>
              {/* Status badge — click to change */}
              <div className="relative">
                <button
                  onClick={() => setShowStatusMenu(v => !v)}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium border cursor-pointer ${STATUS_COLORS[building.status] ?? 'bg-gray-100 text-gray-600'}`}
                >
                  {building.status}
                  <ChevronRight size={12} className="rotate-90" />
                </button>
                {showStatusMenu && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-[#E2D5BE] rounded-xl shadow-xl z-50 py-1 min-w-[160px]">
                    {ALL_STATUSES.map(s => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(s)}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-[#F6F1EA] transition-colors ${building.status === s ? 'font-semibold text-[#567C45]' : 'text-[#463F2E]'}`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mt-1 text-[#8C8062] text-sm">
              <MapPin size={14} />
              <span>{[building.address, getAreaName(building.areaId), getCityName(building.cityId)].filter(Boolean).join(', ')}</span>
            </div>
            {daysSinceContact !== null && (
              <p className={`text-xs mt-1 ${daysSinceContact >= 14 ? 'text-red-600 font-medium' : 'text-[#8C8062]'}`}>
                Last contact: {daysSinceContact === 0 ? 'today' : `${daysSinceContact} days ago`}
                {daysSinceContact >= 14 && ' — overdue!'}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" onClick={openEdit}>
              <Edit2 size={14} className="mr-1" /> Edit
            </Button>
            <Button size="sm" onClick={() => setShowLogModal(true)}>
              <Plus size={14} className="mr-1" /> Log Activity
            </Button>
            <Link to="/audits">
              <Button size="sm" variant="secondary">
                <FileText size={14} className="mr-1" /> Start Audit
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <SummaryCard
          label="Monthly Water Spend"
          value={monthlySpend > 0 ? fmtCurrency(monthlySpend) : '—'}
          sub={monthlySpend > 0 ? `${fmtCurrency(annualSpend)}/yr` : 'Not recorded'}
          color="red"
        />
        <SummaryCard
          label="Greywater Potential"
          value={greywaterLpd > 0 ? `${greywaterLpd.toFixed(0)} L/day` : '—'}
          sub={greywaterLpd > 0 ? `${(greywaterLpd * 365 / 1000).toFixed(0)} KL/year` : 'Run audit first'}
          color="teal"
        />
        <SummaryCard
          label="DJB Rebate"
          value={djbRebate > 0 ? fmtCurrency(djbRebate) : '—'}
          sub="per year"
          color="blue"
        />
        <SummaryCard
          label="Est. Annual Saving"
          value={estimatedSaving > 0 ? fmtCurrency(estimatedSaving) : '—'}
          sub="water cost reduction"
          color="green"
        />
      </div>

      {/* Tabs */}
      <div className="border-b border-[#E2D5BE] overflow-x-auto">
        <div className="flex gap-0 min-w-max">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  isActive
                    ? 'border-[#567C45] text-[#567C45]'
                    : 'border-transparent text-[#8C8062] hover:text-[#463F2E]'
                }`}
              >
                <Icon size={15} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid sm:grid-cols-2 gap-5">
          {/* Contact */}
          <Card>
            <CardBody className="space-y-3">
              <h3 className="font-semibold text-[#2C2820]">Contact</h3>
              <Row icon={Users} label="Name" value={building.contactName || '—'} />
              <Row icon={Phone} label="Phone"
                value={building.contactPhone
                  ? <a href={`tel:${building.contactPhone}`} className="text-blue-600 hover:underline">{building.contactPhone}</a>
                  : '—'}
              />
              {building.contactEmail && (
                <Row icon={Mail} label="Email"
                  value={<a href={`mailto:${building.contactEmail}`} className="text-blue-600 hover:underline truncate block">{building.contactEmail}</a>}
                />
              )}
              {building.contactDesignation && (
                <Row icon={Users} label="Role" value={building.contactDesignation} />
              )}
            </CardBody>
          </Card>

          {/* Building info */}
          <Card>
            <CardBody className="space-y-3">
              <h3 className="font-semibold text-[#2C2820]">Building Info</h3>
              <Row icon={Building2} label="Type" value={building.type} />
              {building.address && <Row icon={MapPin} label="Address" value={building.address} />}
              {building.floors != null && <Row icon={Building2} label="Floors" value={String(building.floors)} />}
              {building.flats != null && <Row icon={Building2} label="Flats" value={String(building.flats)} />}
              {building.occupancyCount != null && <Row icon={Users} label="Occupancy" value={String(building.occupancyCount)} />}
              <Row icon={Calendar} label="Added" value={format(new Date(building.createdAt), 'dd MMM yyyy')} />
            </CardBody>
          </Card>

          {/* Water info */}
          <Card>
            <CardBody className="space-y-3">
              <h3 className="font-semibold text-[#2C2820]">Water Profile</h3>
              {building.municipalSupplyQuality && <Row icon={Droplets} label="Municipal Supply" value={building.municipalSupplyQuality} />}
              {building.tankerCountPerMonth != null && <Row icon={Droplets} label="Tankers/Month" value={String(building.tankerCountPerMonth)} />}
              {building.monthlyWaterSpend != null && <Row icon={Droplets} label="Monthly Spend" value={fmtCurrency(building.monthlyWaterSpend)} />}
              {building.recyclingStatus && <Row icon={Droplets} label="Recycling" value={building.recyclingStatus} />}
              {building.dailyWaterConsumption != null && <Row icon={Droplets} label="Daily Consumption" value={`${building.dailyWaterConsumption} KLD`} />}
            </CardBody>
          </Card>

          {/* Notes + follow-up */}
          <Card>
            <CardBody className="space-y-3">
              <h3 className="font-semibold text-[#2C2820]">Notes & Follow-up</h3>
              {building.notes && (
                <p className="text-sm text-[#5C5244] bg-yellow-50 rounded-xl p-3 leading-relaxed">{building.notes}</p>
              )}
              {building.followUpDate && (
                <div className={`flex items-center gap-2 text-sm rounded-xl p-3 ${
                  isPast(parseISO(building.followUpDate)) && !isToday(parseISO(building.followUpDate))
                    ? 'bg-red-50 text-red-700'
                    : isToday(parseISO(building.followUpDate))
                    ? 'bg-amber-50 text-amber-700'
                    : 'bg-[#F6F1EA] text-[#463F2E]'
                }`}>
                  <Clock size={14} />
                  <span>Follow up: {format(parseISO(building.followUpDate), 'dd MMM yyyy')}</span>
                  {isPast(parseISO(building.followUpDate)) && !isToday(parseISO(building.followUpDate)) && (
                    <span className="ml-auto font-medium">Overdue</span>
                  )}
                </div>
              )}
              {building.painQuote && (
                <blockquote className="border-l-2 border-[#567C45] pl-3 text-sm italic text-[#5C5244]">
                  "{building.painQuote}"
                </blockquote>
              )}
              {!building.notes && !building.followUpDate && !building.painQuote && (
                <p className="text-sm text-[#ADA082]">No notes yet. Log an activity to start building this record.</p>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Tab: Activity Log ── */}
      {activeTab === 'activity' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2C2820]">Activity Timeline</h2>
            <Button size="sm" onClick={() => setShowLogModal(true)}>
              <Plus size={14} className="mr-1" /> Log Activity
            </Button>
          </div>

          {buildingLogs.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#E2D5BE]">
              <ClipboardList size={40} className="text-[#ADA082] mx-auto mb-3" />
              <h3 className="font-semibold text-[#2C2820] mb-1">No activity logged yet</h3>
              <p className="text-sm text-[#8C8062] mb-4">
                Record every meeting, call, or WhatsApp so you never lose context.
              </p>
              <Button onClick={() => setShowLogModal(true)}>
                <Plus size={14} className="mr-1" /> Log first activity
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-[#E2D5BE]" />
              <div className="space-y-4 pl-10">
                {buildingLogs.map(log => (
                  <div key={log.id} className="relative">
                    <div className="absolute -left-10 w-4 h-4 rounded-full bg-white border-2 border-[#567C45] top-3" />
                    <Card>
                      <CardBody className="space-y-2">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${LOG_TYPE_COLORS[log.type]}`}>
                              {log.type}
                            </span>
                            <span className="text-xs text-[#ADA082]">
                              {format(new Date(log.date), 'dd MMM yyyy')}
                            </span>
                          </div>
                          <button
                            onClick={() => deleteContactLog(log.id)}
                            className="p-1 text-[#ADA082] hover:text-red-500 rounded transition-colors flex-shrink-0"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                        <p className="text-sm text-[#463F2E] leading-relaxed">{log.notes}</p>
                        {log.nextAction && (
                          <div className="flex items-start gap-1.5 text-sm text-[#567C45]">
                            <CheckCircle2 size={13} className="mt-0.5 flex-shrink-0" />
                            <span>Next: {log.nextAction}</span>
                          </div>
                        )}
                        {log.followUpDate && (
                          <div className={`flex items-center gap-1.5 text-xs rounded-lg px-2 py-1 w-fit ${
                            isPast(parseISO(log.followUpDate)) && !isToday(parseISO(log.followUpDate))
                              ? 'bg-red-50 text-red-600'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            <Clock size={11} />
                            Follow up: {format(parseISO(log.followUpDate), 'dd MMM yyyy')}
                          </div>
                        )}
                      </CardBody>
                    </Card>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Audits ── */}
      {activeTab === 'audits' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2C2820]">Audits</h2>
            <Link to="/audits">
              <Button size="sm"><Plus size={14} className="mr-1" /> Start Audit</Button>
            </Link>
          </div>
          {buildingAudits.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-[#E2D5BE]">
              <FileText size={40} className="text-[#ADA082] mx-auto mb-3" />
              <h3 className="font-semibold text-[#2C2820] mb-1">No audits yet</h3>
              <p className="text-sm text-[#8C8062] mb-4">
                A free water audit is your best opening move. It gives the building owner real numbers.
              </p>
              <Link to="/audits">
                <Button>Start first audit</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {buildingAudits.map(audit => (
                <Card key={audit.id}>
                  <CardBody>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-[#2C2820]">{format(new Date(audit.date), 'dd MMM yyyy')}</span>
                      <span className="text-sm font-bold text-teal-700">{fmtCurrency(audit.potentialSavings)}/yr savings</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs text-[#8C8062]">
                      <span>TDS: {audit.tdsLevel} ppm</span>
                      <span>Borewell: {audit.borewellDepth}m</span>
                      <span>Monthly bill: {fmtCurrency(audit.currentWaterBill)}</span>
                      <span>By: {audit.conductedBy}</span>
                    </div>
                    {audit.recommendedSystem && (
                      <p className="text-xs text-[#ADA082] mt-2 truncate">{audit.recommendedSystem}</p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Referrals ── */}
      {activeTab === 'referrals' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#2C2820]">Referrals</h2>
            <Link to="/referrals">
              <Button size="sm"><Plus size={14} className="mr-1" /> New Referral</Button>
            </Link>
          </div>

          {/* Provider Matching Widget */}
          <ProviderMatchWidget building={building} manufacturers={state.manufacturers} cities={cities} navigate={navigate} />

          {buildingReferrals.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E2D5BE]">
              <Users size={40} className="text-[#ADA082] mx-auto mb-3" />
              <h3 className="font-semibold text-[#2C2820] mb-1">No referrals yet</h3>
              <p className="text-sm text-[#8C8062] mb-4">
                Use the suggestions above to match this building with the right provider.
              </p>
              <Link to="/referrals">
                <Button>Create referral</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {buildingReferrals.map(ref => (
                <Card key={ref.id}>
                  <CardBody>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-[#2C2820]">{ref.referredName}</span>
                      <Badge variant="info">{ref.status}</Badge>
                    </div>
                    <p className="text-xs text-[#8C8062]">{ref.referredContact}</p>
                    {ref.expectedCommission != null && (
                      <p className="text-xs text-teal-700 mt-1">Expected commission: {fmtCurrency(ref.expectedCommission)}</p>
                    )}
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Scripts ── */}
      {activeTab === 'scripts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-[#2C2820]">Relevant Scripts</h2>
              <p className="text-xs text-[#8C8062] mt-0.5">
                Showing scripts for <span className="font-medium">{building.status}</span> status.
                <button onClick={() => navigate('/scripts')} className="ml-1 text-[#567C45] hover:underline">View all scripts →</button>
              </p>
            </div>
          </div>

          {contextScripts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-[#E2D5BE]">
              <BookOpen size={36} className="text-[#ADA082] mx-auto mb-3" />
              <p className="text-sm text-[#8C8062]">No scripts assigned for this status. <Link to="/scripts" className="text-[#567C45] hover:underline">Browse all scripts →</Link></p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {contextScripts.map(script => (
                <Card key={script.id}>
                  <CardBody className="space-y-3">
                    <div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-[#EDE4D4] text-[#5C5244] mb-1">
                        {script.category}
                      </span>
                      <h3 className="font-semibold text-sm text-[#2C2820]">{script.title}</h3>
                    </div>
                    <pre className="text-xs text-[#463F2E] whitespace-pre-wrap font-sans leading-relaxed bg-[#F6F1EA] rounded-xl p-3 max-h-40 overflow-y-auto">
                      {script.content}
                    </pre>
                    <div className="flex gap-2">
                      <button
                        onClick={() => copyScript(script.content, script.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2D5BE] text-[#463F2E] rounded-lg text-xs font-medium hover:bg-[#F6F1EA] transition-colors"
                      >
                        {copied === script.id ? <Check size={12} className="text-green-500" /> : <Copy size={12} />}
                        {copied === script.id ? 'Copied!' : 'Copy'}
                      </button>
                      <button
                        onClick={() => openWhatsApp(script.content)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                      >
                        <MessageCircle size={12} />
                        {building.contactPhone ? 'Send WhatsApp' : 'WhatsApp (no phone)'}
                      </button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Log Activity Modal ── */}
      <Modal open={showLogModal} onClose={() => setShowLogModal(false)} title="Log Activity" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Date"
              type="date"
              value={logForm.date}
              onChange={e => setLogForm({ ...logForm, date: e.target.value })}
            />
            <div>
              <label className="text-sm font-medium text-[#463F2E] block mb-1">Activity Type *</label>
              <select
                value={logForm.type}
                onChange={e => setLogForm({ ...logForm, type: e.target.value as ContactLogType })}
                className="w-full px-3 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820]"
              >
                {LOG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <TextArea
            label="Notes * — what was said, what was learned"
            value={logForm.notes}
            onChange={e => setLogForm({ ...logForm, notes: e.target.value })}
            rows={4}
            placeholder="e.g. Met the facilities manager. They spend ₹25,000/month on tankers. Interested in the DJB rebate. Will share the audit report by Thursday."
          />
          <Input
            label="Next action (optional)"
            value={logForm.nextAction}
            onChange={e => setLogForm({ ...logForm, nextAction: e.target.value })}
            placeholder="e.g. Call back Thursday with audit report"
          />
          <Input
            label="Follow-up date (optional)"
            type="date"
            value={logForm.followUpDate}
            onChange={e => setLogForm({ ...logForm, followUpDate: e.target.value })}
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleAddLog} className="flex-1" disabled={!logForm.notes.trim()}>
            Save Activity
          </Button>
          <Button variant="ghost" onClick={() => setShowLogModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>

      {/* ── Edit Building Modal ── */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Building" size="lg">
        <div className="space-y-4">
          <Input label="Building Name *" value={eForm.name} onChange={e => setEForm({ ...eForm, name: e.target.value })} placeholder="e.g. Sunrise Apartments" />
          <Input label="Address" value={eForm.address} onChange={e => setEForm({ ...eForm, address: e.target.value })} placeholder="e.g. 12 Model Town, Delhi" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#463F2E] block mb-1">State</label>
              {state.states.length > 0 ? (
                <select value={eForm.stateId}
                  onChange={e => setEForm({ ...eForm, stateId: e.target.value, cityId: '' })}
                  className="w-full px-3 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820]">
                  <option value="">— Select state —</option>
                  {state.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              ) : (
                <p className="text-xs text-[#ADA082] px-3 py-2 border border-[#D8CEBC] rounded-xl bg-[#FDFAF4]">Add states in Geography first</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-[#463F2E] block mb-1">City</label>
              {cities.length > 0 ? (
                <select value={eForm.cityId}
                  onChange={e => {
                    const city = cities.find(c => c.id === e.target.value);
                    setEForm({ ...eForm, cityId: e.target.value, stateId: city?.stateId ?? eForm.stateId });
                  }}
                  className="w-full px-3 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820]">
                  <option value="">— Select city —</option>
                  {(eForm.stateId
                    ? cities.filter(c => c.stateId === eForm.stateId)
                    : cities
                  ).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              ) : (
                <p className="text-xs text-[#ADA082] px-3 py-2 border border-[#D8CEBC] rounded-xl bg-[#FDFAF4]">Add cities in Geography first</p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-[#463F2E] block mb-1">Building Type</label>
              <select value={eForm.type} onChange={e => setEForm({ ...eForm, type: e.target.value as Building['type'] })}
                className="w-full px-3 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820]">
                <option value="">— Select type —</option>
                {BUILDING_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-[#463F2E] block mb-1">Status</label>
              <select value={eForm.status} onChange={e => setEForm({ ...eForm, status: e.target.value as Building['status'] })}
                className="w-full px-3 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820]">
                {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={eForm.contactName} onChange={e => setEForm({ ...eForm, contactName: e.target.value })} />
            <Input label="Contact Phone" value={eForm.contactPhone} onChange={e => setEForm({ ...eForm, contactPhone: e.target.value })} />
          </div>
          <Input label="Contact Email" type="email" value={eForm.contactEmail} onChange={e => setEForm({ ...eForm, contactEmail: e.target.value })} />
          <div className="grid grid-cols-3 gap-4">
            <Input label="Monthly Water Spend (₹)" type="number" value={eForm.monthlyWaterSpend} onChange={e => setEForm({ ...eForm, monthlyWaterSpend: e.target.value })} placeholder="e.g. 25000" />
            <Input label="Floors" type="number" value={eForm.floors} onChange={e => setEForm({ ...eForm, floors: e.target.value })} />
            <Input label="Flats / Beds" type="number" value={eForm.flats} onChange={e => setEForm({ ...eForm, flats: e.target.value })} />
          </div>
          <TextArea label="Notes" value={eForm.notes} onChange={e => setEForm({ ...eForm, notes: e.target.value })} rows={3} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSaveEdit} className="flex-1" disabled={!eForm.name.trim() && !eForm.address.trim()}>
            Save Changes
          </Button>
          <Button variant="ghost" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────

function SummaryCard({ label, value, sub, color }: {
  label: string; value: string; sub: string;
  color: 'red' | 'teal' | 'blue' | 'green';
}) {
  const colors = {
    red:   'bg-red-50 border-red-100',
    teal:  'bg-teal-50 border-teal-100',
    blue:  'bg-blue-50 border-blue-100',
    green: 'bg-green-50 border-green-100',
  };
  const textColors = {
    red:   'text-red-700',
    teal:  'text-teal-700',
    blue:  'text-blue-700',
    green: 'text-green-700',
  };
  return (
    <div className={`rounded-2xl border p-4 ${colors[color]}`}>
      <p className="text-xs text-[#8C8062] font-medium mb-1">{label}</p>
      <p className={`text-xl font-bold ${textColors[color]}`}>{value}</p>
      <p className="text-xs text-[#ADA082] mt-0.5">{sub}</p>
    </div>
  );
}

function Row({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2">
      <Icon size={14} className="text-[#ADA082] mt-0.5 flex-shrink-0" />
      <div className="min-w-0">
        <span className="text-xs text-[#ADA082]">{label}</span>
        <div className="text-sm text-[#463F2E] font-medium truncate">{value}</div>
      </div>
    </div>
  );
}

// ── Provider Matching Widget ──────────────────────────────
function ProviderMatchWidget({
  building,
  manufacturers,
  cities,
  navigate,
}: {
  building: Building;
  manufacturers: Manufacturer[];
  cities: City[];
  navigate: ReturnType<typeof useNavigate>;
}) {
  const [open, setOpen] = React.useState(false);

  const cityName = cities.find(c => c.id === building.cityId)?.name ?? '';
  const greywaterKLD = building.greywaterPotentialLpd
    ? building.greywaterPotentialLpd / 1000
    : (building.monthlyWaterSpend ? building.monthlyWaterSpend * 12 / 365 / 1000 * 0.4 : 0);

  const topMatches = React.useMemo(() => {
    const active = manufacturers.filter(m => !m.isFlagged && (m.providerStatus !== 'Flagged') && m.active);
    const scored = active.map(m => {
      let score = 0;
      // Stream: greywater preferred for most buildings
      if ((m.stream ?? 'greywater') === 'greywater') score += 20;
      // Building type match
      const buildingBestFor = m.bestFor ?? [];
      if (buildingBestFor.some(b => building.type.toLowerCase().includes(b.toLowerCase()) || b.toLowerCase().includes(building.type.split(' ')[0].toLowerCase()))) score += 20;
      // Capacity match
      const minK = m.capacityMinKld ?? 0;
      const maxK = m.capacityMaxKld ?? 9999;
      if (greywaterKLD >= minK && greywaterKLD <= maxK) score += 20;
      // Coverage
      const coverage = [...(m.geographicCoverage ?? []), ...(m.citiesCovered ?? [])];
      if (cityName && coverage.some(c => c.toLowerCase().includes(cityName.toLowerCase()) || c.toLowerCase().includes('pan-india'))) score += 20;
      // Star rating
      score += (m.starRating ?? 0) * 4;
      // Preferred
      if (m.isPreferred) score += 10;
      return { m, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 3).filter(s => s.score > 0);
  }, [manufacturers, building, cityName, greywaterKLD]);

  if (topMatches.length === 0) return null;

  const STREAM_LABELS: Record<string, string> = {
    greywater: 'Greywater', rainwater: 'Rainwater', trees: 'Trees', lakes: 'Lakes',
  };

  return (
    <div className="bg-[#FDFAF4] border border-[#EDE4D4] rounded-2xl overflow-hidden">
      <button
        className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-[#F6F1EA] transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className="flex items-center gap-2">
          <Factory size={16} className="text-[#567C45]" />
          <span className="font-semibold text-sm text-[#2C2820]">Suggested Providers</span>
          <span className="text-xs bg-[#567C45] text-white px-1.5 py-0.5 rounded-full">{topMatches.length}</span>
        </div>
        <ChevronRight size={14} className={`text-[#ADA082] transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>
      {open && (
        <div className="border-t border-[#EDE4D4] divide-y divide-[#F0E8D8]">
          {topMatches.map(({ m, score }) => {
            const coverage = [...(m.geographicCoverage ?? []), ...(m.citiesCovered ?? [])];
            const matchReasons = [
              m.stream && STREAM_LABELS[m.stream],
              m.capacityMinKld != null && m.capacityMaxKld != null ? `${m.capacityMinKld}–${m.capacityMaxKld} KLD` : null,
              coverage.some(c => c.toLowerCase().includes(cityName.toLowerCase())) ? `Covers ${cityName}` : coverage.some(c => c.toLowerCase().includes('pan-india')) ? 'Pan-India' : null,
              m.providerType,
            ].filter(Boolean);
            return (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-[#2C2820] truncate">{m.name}</p>
                  <p className="text-xs text-[#8C8062] mt-0.5">{m.city}</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {matchReasons.map((r, i) => (
                      <span key={i} className="text-[10px] bg-[#EDE4D4] text-[#5C5244] px-1.5 py-0.5 rounded-full">{r}</span>
                    ))}
                    {m.starRating && (
                      <span className="text-[10px] flex items-center gap-0.5 text-amber-600">
                        <Star size={9} className="fill-amber-400 text-amber-400" /> {m.starRating}/5
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/providers/${m.id}`)}
                  className="flex-shrink-0 text-xs font-medium text-[#567C45] border border-[#567C45]/30 rounded-lg px-3 py-1.5 hover:bg-[#567C45]/5 transition-colors whitespace-nowrap"
                >
                  View provider →
                </button>
              </div>
            );
          })}
          <div className="px-4 py-2.5 bg-[#F6F1EA]">
            <button onClick={() => navigate('/providers')} className="text-xs text-[#567C45] hover:underline">
              Browse all providers →
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
