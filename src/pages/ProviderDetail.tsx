import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import type { Manufacturer, FlagReason, CommissionStatus, ProviderStatus, ProviderType } from '../types';
import {
  ArrowLeft, Edit2, Flag, Plus, Star, Crown, Globe, Phone, Mail,
  MapPin, Factory, Zap, Building2, FileText, MessageSquare,
  BadgeCheck, Trash2, AlertTriangle, CheckCircle2, ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

// ── Constants ─────────────────────────────────────────────
const STREAMS: Record<string, { label: string; color: string; bg: string }> = {
  greywater: { label: 'Greywater Recycling',   color: 'text-blue-700',  bg: 'bg-blue-100'  },
  rainwater: { label: 'Rainwater Harvesting',  color: 'text-sky-700',   bg: 'bg-sky-100'   },
  trees:     { label: 'Urban Trees',           color: 'text-green-700', bg: 'bg-green-100' },
  lakes:     { label: 'Lakes & Water Bodies',  color: 'text-teal-700',  bg: 'bg-teal-100'  },
};

const TYPE_COLORS: Record<string, string> = {
  'Manufacturer':       'bg-blue-100 text-blue-700',
  'NGO':                'bg-purple-100 text-purple-700',
  'EPC Contractor':     'bg-orange-100 text-orange-700',
  'Consultant':         'bg-amber-100 text-amber-700',
  'Component Supplier': 'bg-gray-100 text-gray-600',
};

const STATUS_COLORS: Record<string, string> = {
  'Active':             'bg-green-100 text-green-700',
  'Pending contact':    'bg-amber-100 text-amber-700',
  'Commission agreed':  'bg-teal-100 text-teal-700',
  'Flagged':            'bg-red-100 text-red-700',
  'Paused':             'bg-gray-100 text-gray-500',
};

const FLAG_REASONS: FlagReason[] = [
  'Commission dispute', 'Poor quality', 'Unresponsive',
  'Geographic mismatch', 'Conflict of interest', 'Other',
];

const COMMISSION_STATUSES: CommissionStatus[] = [
  'Not discussed', 'In conversation', 'Verbally agreed', 'Signed agreement',
];

const PROVIDER_TYPES: ProviderType[] = [
  'Manufacturer', 'NGO', 'EPC Contractor', 'Consultant', 'Component Supplier',
];

const PROVIDER_STATUSES: ProviderStatus[] = [
  'Pending contact', 'Active', 'Commission agreed', 'Flagged', 'Paused',
];

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

// ── Star picker ───────────────────────────────────────────
function StarPicker({ value, onChange }: { value?: number; onChange: (n: number) => void }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }, (_, i) => i + 1).map(n => (
        <button
          key={n}
          type="button"
          onMouseEnter={() => setHovered(n)}
          onMouseLeave={() => setHovered(0)}
          onClick={() => onChange(n)}
        >
          <Star
            size={20}
            className={
              n <= (hovered || value || 0)
                ? 'text-amber-400 fill-amber-400'
                : 'text-gray-300 fill-gray-200'
            }
          />
        </button>
      ))}
      {value && <span className="text-xs text-[#8C8062] ml-1">{value}/5</span>}
    </div>
  );
}

function StarDisplay({ rating }: { rating?: number }) {
  if (!rating) return <span className="text-xs text-[#ADA082]">Not rated</span>;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star key={i} size={14} className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'} />
      ))}
      <span className="text-xs text-[#8C8062] ml-1">{rating}/5</span>
    </span>
  );
}

// ── Main component ────────────────────────────────────────
export default function ProviderDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, updateManufacturer, addProviderNote, deleteProviderNote } = useStore();
  const { manufacturers, providerNotes: allNotes, referrals, buildings, areas, cities } = state;

  const provider = manufacturers.find(m => m.id === id);

  const [activeTab, setActiveTab] = useState<'overview' | 'notes' | 'commission' | 'buildings' | 'review'>('overview');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showFlagModal, setShowFlagModal] = useState(false);

  // Note form
  const [noteText, setNoteText] = useState('');
  const [notedBy, setNotedBy] = useState('');

  // Flag form
  const [flagReason, setFlagReason] = useState<FlagReason>('Unresponsive');
  const [flagNotes, setFlagNotes] = useState('');

  // Edit form
  const [eForm, setEForm] = useState<Partial<Manufacturer> & { bestForStr: string; coverageStr: string }>({
    bestForStr: '', coverageStr: '',
  });

  const notes = useMemo(() =>
    (allNotes ?? [])
      .filter(n => n.providerId === id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [allNotes, id]
  );

  const providerReferrals = useMemo(() =>
    referrals.filter(r => r.manufacturerId === id),
    [referrals, id]
  );

  const referredBuildings = useMemo(() => {
    const bIds = new Set(providerReferrals.map(r => r.fromBuildingId));
    return buildings.filter(b => bIds.has(b.id));
  }, [buildings, providerReferrals]);

  const getCityName = (cityId: string) => cities.find(c => c.id === cityId)?.name ?? '';
  const getAreaName = (areaId: string) => areas.find(a => a.id === areaId)?.name ?? '';

  if (!provider) {
    return (
      <div className="max-w-screen-lg mx-auto px-4 py-16 text-center">
        <Factory size={48} className="text-[#ADA082] mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#2C2820] mb-2">Provider not found</h2>
        <Button onClick={() => navigate('/providers')}>Back to Providers</Button>
      </div>
    );
  }

  const stream = STREAMS[provider.stream ?? 'greywater'];
  const status = provider.providerStatus ?? 'Pending contact';

  // ── Handlers ─────────────────────────────────────────────
  // TypeScript doesn't narrow `provider` inside nested function scopes;
  // each handler re-asserts via `if (!provider) return` for safety.
  function openEdit() {
    if (!provider) return;
    setEForm({
      ...(provider as Manufacturer),
      bestForStr: (provider.bestFor ?? []).join(', '),
      coverageStr: (provider.geographicCoverage ?? provider.citiesCovered ?? []).join(', '),
    });
    setShowEditModal(true);
  }

  function handleSaveEdit() {
    if (!provider) return;
    updateManufacturer({
      ...(provider as Manufacturer),
      ...eForm,
      id: provider.id,
      bestFor: eForm.bestForStr ? eForm.bestForStr.split(',').map(s => s.trim()).filter(Boolean) : provider.bestFor,
      geographicCoverage: eForm.coverageStr ? eForm.coverageStr.split(',').map(s => s.trim()).filter(Boolean) : provider.geographicCoverage,
      commissionRatePct: parseFloat(String(eForm.commissionRatePct ?? provider.commissionRatePct)) || 0,
      lastContactedAt: new Date().toISOString(),
    } as Manufacturer);
    setShowEditModal(false);
    toast('Provider updated');
  }

  function handleAddNote() {
    if (!provider || !noteText.trim()) return;
    addProviderNote({
      providerId: provider.id,
      noteText: noteText.trim(),
      notedBy: notedBy.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    updateManufacturer({ ...(provider as Manufacturer), lastContactedAt: new Date().toISOString() });
    setNoteText('');
    setNotedBy('');
    setShowNoteModal(false);
    toast('Note logged');
  }

  function handleFlag() {
    if (!provider) return;
    updateManufacturer({
      ...(provider as Manufacturer),
      isFlagged: true,
      flagReason,
      flagNotes: flagNotes || undefined,
      providerStatus: 'Flagged',
    });
    setShowFlagModal(false);
    toast('Provider flagged', 'error');
  }

  function handleUnflag() {
    if (!provider) return;
    updateManufacturer({
      ...(provider as Manufacturer),
      isFlagged: false,
      flagReason: undefined,
      flagNotes: undefined,
      providerStatus: 'Pending contact',
    });
    toast('Flag removed');
  }

  function handleTogglePreferred() {
    if (!provider) return;
    updateManufacturer({ ...(provider as Manufacturer), isPreferred: !provider.isPreferred });
    toast(provider.isPreferred ? 'Removed preferred status' : 'Marked as preferred');
  }

  function handleRatingChange(n: number) {
    if (!provider) return;
    updateManufacturer({ ...(provider as Manufacturer), starRating: n });
    toast('Rating saved');
  }

  const TABS = [
    { key: 'overview',   label: 'Overview' },
    { key: 'notes',      label: `Notes${notes.length > 0 ? ` (${notes.length})` : ''}` },
    { key: 'commission', label: 'Commission' },
    { key: 'buildings',  label: `Referred Buildings${referredBuildings.length > 0 ? ` (${referredBuildings.length})` : ''}` },
    { key: 'review',     label: 'Internal Review' },
  ] as const;

  const totalInstallValue = providerReferrals.reduce((s, r) => s + (r.installationValue ?? 0), 0);
  const totalCommissionEarned = providerReferrals.reduce((s, r) => s + (r.commissionPaid ?? 0), 0);

  return (
    <div className="max-w-screen-xl mx-auto px-4 py-6 space-y-5">

      {/* Back */}
      <button
        onClick={() => navigate('/providers')}
        className="flex items-center gap-1 text-sm text-[#8C8062] hover:text-[#2C2820] transition-colors"
      >
        <ArrowLeft size={14} /> Back to Providers
      </button>

      {/* Flagged banner */}
      {provider.isFlagged && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <Flag size={16} className="text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-800">
              This provider has been flagged: {provider.flagReason}
            </p>
            {provider.flagNotes && <p className="text-xs text-red-700 mt-0.5">{provider.flagNotes}</p>}
            <p className="text-xs text-red-600 mt-1">Hidden from provider matching suggestions.</p>
          </div>
          <Button size="sm" variant="ghost" onClick={handleUnflag} className="text-red-700 hover:text-red-900 flex-shrink-0">
            Remove flag
          </Button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-2xl ${stream.bg} flex items-center justify-center`}>
            <Factory size={22} className={stream.color} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-bold text-[#2C2820]">{provider.name}</h1>
              {provider.isPreferred && (
                <Crown size={16} className="text-amber-400 fill-amber-400" />
              )}
            </div>
            <div className="flex items-center gap-2 flex-wrap mt-1">
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${stream.bg} ${stream.color}`}>
                {stream.label}
              </span>
              {provider.providerType && (
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${TYPE_COLORS[provider.providerType] ?? 'bg-gray-100 text-gray-600'}`}>
                  {provider.providerType}
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
                {status}
              </span>
            </div>
            <div className="mt-1.5">
              <StarDisplay rating={provider.starRating} />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="ghost" onClick={openEdit}>
            <Edit2 size={13} className="mr-1" /> Edit
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setShowNoteModal(true)}>
            <Plus size={13} className="mr-1" /> Add note
          </Button>
          {provider.isFlagged ? (
            <Button size="sm" variant="ghost" onClick={handleUnflag} className="text-red-600">
              <Flag size={13} className="mr-1" /> Unflag
            </Button>
          ) : (
            <Button size="sm" variant="ghost" onClick={() => setShowFlagModal(true)} className="text-amber-700">
              <Flag size={13} className="mr-1" /> Flag
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={handleTogglePreferred}
            className={provider.isPreferred ? 'text-amber-600' : ''}>
            <Crown size={13} className="mr-1" />
            {provider.isPreferred ? 'Unmark preferred' : 'Mark preferred'}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 border-b border-[#E2D5BE] overflow-x-auto">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab.key
                ? 'border-[#567C45] text-[#567C45]'
                : 'border-transparent text-[#8C8062] hover:text-[#463F2E]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Left column */}
          <div className="space-y-4">
            <Card>
              <CardHeader><h3 className="font-semibold text-[#2C2820]">Contact</h3></CardHeader>
              <CardBody className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-[#5C5244]">
                  <MapPin size={14} className="text-[#ADA082] flex-shrink-0" />
                  <span>{provider.city}</span>
                </div>
                {provider.contactName && (
                  <div className="flex items-center gap-2 text-[#5C5244]">
                    <Factory size={14} className="text-[#ADA082] flex-shrink-0" />
                    <span>{provider.contactName}</span>
                  </div>
                )}
                {provider.contactPhone && (
                  <div className="flex items-center gap-2 text-[#5C5244]">
                    <Phone size={14} className="text-[#ADA082] flex-shrink-0" />
                    <a href={`tel:${provider.contactPhone}`} className="hover:text-[#567C45] transition-colors">
                      {provider.contactPhone}
                    </a>
                  </div>
                )}
                {provider.email && (
                  <div className="flex items-center gap-2 text-[#5C5244]">
                    <Mail size={14} className="text-[#ADA082] flex-shrink-0" />
                    <a href={`mailto:${provider.email}`} className="hover:text-[#567C45] transition-colors">
                      {provider.email}
                    </a>
                  </div>
                )}
                {provider.website && (
                  <div className="flex items-center gap-2 text-[#5C5244]">
                    <Globe size={14} className="text-[#ADA082] flex-shrink-0" />
                    <a href={`https://${provider.website.replace(/^https?:\/\//, '')}`} target="_blank" rel="noreferrer"
                      className="hover:text-[#567C45] transition-colors truncate">
                      {provider.website}
                    </a>
                  </div>
                )}
                {provider.lastContactedAt && (
                  <p className="text-xs text-[#ADA082] mt-1">
                    Last contacted: {format(new Date(provider.lastContactedAt), 'dd MMM yyyy')}
                  </p>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h3 className="font-semibold text-[#2C2820]">Geographic Coverage</h3></CardHeader>
              <CardBody>
                <div className="flex flex-wrap gap-1.5">
                  {[...(provider.geographicCoverage ?? []), ...(provider.citiesCovered ?? [])].length === 0 ? (
                    <p className="text-sm text-[#ADA082]">Not specified</p>
                  ) : (
                    [...new Set([...(provider.geographicCoverage ?? []), ...(provider.citiesCovered ?? [])])].map(c => (
                      <span key={c} className="text-xs bg-[#EDE4D4] text-[#5C5244] px-2 py-1 rounded-full">{c}</span>
                    ))
                  )}
                </div>
              </CardBody>
            </Card>
          </div>

          {/* Right column */}
          <div className="space-y-4">
            <Card>
              <CardHeader><h3 className="font-semibold text-[#2C2820]">Capacity & Technology</h3></CardHeader>
              <CardBody className="space-y-3 text-sm">
                {(provider.capacityMinKld !== undefined || provider.capacityNotes) && (
                  <div>
                    <p className="text-xs font-semibold text-[#8C8062] uppercase tracking-wide">Capacity</p>
                    <p className="text-[#2C2820] mt-0.5">
                      {provider.capacityMinKld !== undefined && provider.capacityMaxKld !== undefined
                        ? `${provider.capacityMinKld}–${provider.capacityMaxKld} KLD`
                        : ''}
                      {provider.capacityNotes && <span className="block text-xs text-[#5C5244] mt-0.5">{provider.capacityNotes}</span>}
                    </p>
                  </div>
                )}
                {provider.technology && (
                  <div>
                    <p className="text-xs font-semibold text-[#8C8062] uppercase tracking-wide">Technology</p>
                    <p className="text-[#5C5244] mt-0.5 leading-relaxed">{provider.technology}</p>
                  </div>
                )}
                {provider.bestFor && provider.bestFor.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-[#8C8062] uppercase tracking-wide">Best For</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {provider.bestFor.map(b => (
                        <span key={b} className="text-xs bg-blue-50 text-blue-700 border border-blue-100 px-2 py-0.5 rounded-full">{b}</span>
                      ))}
                    </div>
                  </div>
                )}
                {provider.certifications && (
                  <div>
                    <p className="text-xs font-semibold text-[#8C8062] uppercase tracking-wide">Certifications</p>
                    <p className="text-[#5C5244] mt-0.5">{provider.certifications}</p>
                  </div>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader><h3 className="font-semibold text-[#2C2820]">Referral Summary</h3></CardHeader>
              <CardBody>
                <div className="grid grid-cols-3 gap-3 text-center">
                  {[
                    { label: 'Buildings referred', value: referredBuildings.length },
                    { label: 'Total install value', value: fmtCurrency(totalInstallValue) },
                    { label: 'Commissions earned', value: fmtCurrency(totalCommissionEarned) },
                  ].map(s => (
                    <div key={s.label}>
                      <p className="text-lg font-bold text-[#2C2820]">{s.value}</p>
                      <p className="text-xs text-[#8C8062]">{s.label}</p>
                    </div>
                  ))}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {/* ── Tab: Notes ── */}
      {activeTab === 'notes' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" onClick={() => setShowNoteModal(true)}>
              <Plus size={14} className="mr-1" /> Add note
            </Button>
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare size={36} className="text-[#ADA082] mx-auto mb-3" />
              <p className="text-[#8C8062]">No notes yet.</p>
              <p className="text-sm text-[#ADA082]">Log your first conversation with this provider.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map(note => (
                <Card key={note.id}>
                  <CardBody className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="text-sm text-[#2C2820] leading-relaxed whitespace-pre-wrap">{note.noteText}</p>
                        <div className="flex items-center gap-2 mt-1.5 text-xs text-[#ADA082]">
                          <span>{format(new Date(note.createdAt), 'dd MMM yyyy, h:mm a')}</span>
                          {note.notedBy && <span>· {note.notedBy}</span>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteProviderNote(note.id)}
                        className="text-[#ADA082] hover:text-red-600 transition-colors p-1 flex-shrink-0"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Tab: Commission ── */}
      {activeTab === 'commission' && (
        <div className="space-y-4">
          <Card>
            <CardHeader><h3 className="font-semibold text-[#2C2820]">Commission Agreement</h3></CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#8C8062] uppercase tracking-wide mb-1">Commission Rate</p>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      value={provider.commissionRatePct ?? ''}
                      onChange={e => updateManufacturer({ ...provider, commissionRatePct: parseFloat(e.target.value) || 0 })}
                      className="w-24 border border-[#E2D5BE] rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#567C45]/20"
                      placeholder="e.g. 12"
                    />
                    <span className="text-sm text-[#8C8062]">%</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-[#8C8062] uppercase tracking-wide mb-1">Agreement Status</p>
                  <select
                    value={provider.commissionStatus ?? 'Not discussed'}
                    onChange={e => updateManufacturer({ ...provider, commissionStatus: e.target.value as CommissionStatus })}
                    className="w-full border border-[#E2D5BE] rounded-xl px-3 py-1.5 text-sm outline-none focus:ring-2 focus:ring-[#567C45]/20"
                  >
                    {COMMISSION_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8C8062] uppercase tracking-wide mb-1">Commission Notes</p>
                <textarea
                  value={provider.commissionNotes ?? ''}
                  onChange={e => updateManufacturer({ ...provider, commissionNotes: e.target.value })}
                  rows={3}
                  placeholder="e.g. Verbally agreed 12% for hospitals in North Delhi. Needs written MOU."
                  className="w-full border border-[#E2D5BE] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#567C45]/20 resize-none"
                />
              </div>
            </CardBody>
          </Card>

          {/* Commission history */}
          {providerReferrals.length > 0 && (
            <Card>
              <CardHeader><h3 className="font-semibold text-[#2C2820]">Commission History</h3></CardHeader>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#EDE4D4] bg-[#FDFAF4]">
                      {['Building', 'Date', 'Install value', 'Expected ₹', 'Received ₹', 'Status'].map(h => (
                        <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-[#8C8062] uppercase tracking-wide">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {providerReferrals.map(r => {
                      const b = buildings.find(b => b.id === r.fromBuildingId);
                      return (
                        <tr key={r.id} className="border-b border-[#F0E8D8] hover:bg-[#FDFAF4]">
                          <td className="px-4 py-2.5 font-medium text-[#2C2820]">{b?.name ?? r.referredName}</td>
                          <td className="px-4 py-2.5 text-[#8C8062]">{r.referredDate ?? '—'}</td>
                          <td className="px-4 py-2.5">{r.installationValue ? fmtCurrency(r.installationValue) : '—'}</td>
                          <td className="px-4 py-2.5 text-[#567C45] font-semibold">{r.expectedCommission ? fmtCurrency(r.expectedCommission) : '—'}</td>
                          <td className="px-4 py-2.5 font-semibold">{r.commissionPaid ? fmtCurrency(r.commissionPaid) : '—'}</td>
                          <td className="px-4 py-2.5">
                            <span className="text-xs px-2 py-0.5 bg-[#EDE4D4] text-[#5C5244] rounded-full">{r.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* ── Tab: Referred Buildings ── */}
      {activeTab === 'buildings' && (
        <div className="space-y-3">
          {referredBuildings.length === 0 ? (
            <div className="text-center py-12">
              <Building2 size={36} className="text-[#ADA082] mx-auto mb-3" />
              <p className="text-[#8C8062]">No buildings referred to this provider yet.</p>
            </div>
          ) : (
            referredBuildings.map(b => {
              const ref = providerReferrals.find(r => r.fromBuildingId === b.id);
              return (
                <Card key={b.id}>
                  <CardBody className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-semibold text-[#2C2820]">{b.name}</p>
                      <p className="text-xs text-[#8C8062] mt-0.5">
                        {getAreaName(b.areaId) || getCityName(b.cityId)} · {b.type}
                      </p>
                      {ref && (
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs px-2 py-0.5 bg-[#EDE4D4] text-[#5C5244] rounded-full">{ref.status}</span>
                          {ref.referredDate && <span className="text-xs text-[#ADA082]">{ref.referredDate}</span>}
                          {ref.expectedCommission && (
                            <span className="text-xs font-semibold text-[#567C45]">
                              Expected: {fmtCurrency(ref.expectedCommission)}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    <button onClick={() => navigate(`/buildings/${b.id}`)}
                      className="text-[#ADA082] hover:text-[#567C45] transition-colors">
                      <ChevronRight size={16} />
                    </button>
                  </CardBody>
                </Card>
              );
            })
          )}
        </div>
      )}

      {/* ── Tab: Internal Review ── */}
      {activeTab === 'review' && (
        <div className="space-y-4 max-w-2xl">
          <Card>
            <CardHeader><h3 className="font-semibold text-[#2C2820]">Star Rating</h3></CardHeader>
            <CardBody className="space-y-3">
              <StarPicker value={provider.starRating} onChange={handleRatingChange} />
            </CardBody>
          </Card>

          <Card>
            <CardHeader><h3 className="font-semibold text-[#2C2820]">Internal Review</h3></CardHeader>
            <CardBody>
              <textarea
                value={provider.internalReview ?? ''}
                onChange={e => updateManufacturer({ ...provider, internalReview: e.target.value })}
                rows={5}
                placeholder="Your private assessment of this provider — quality of work, communication, reliability, red flags, or anything notable for future referrals."
                className="w-full border border-[#E2D5BE] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#567C45]/20 resize-none"
              />
              <Button size="sm" className="mt-2" onClick={() => { updateManufacturer({ ...provider }); toast('Review saved'); }}>
                Save review
              </Button>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-[#2C2820]">Flag Provider</h3>
              </div>
            </CardHeader>
            <CardBody>
              {provider.isFlagged ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-red-700">
                    <Flag size={14} />
                    <p className="text-sm font-semibold">Currently flagged: {provider.flagReason}</p>
                  </div>
                  {provider.flagNotes && <p className="text-sm text-[#5C5244]">{provider.flagNotes}</p>}
                  <Button size="sm" variant="ghost" onClick={handleUnflag} className="text-red-600">
                    Remove flag
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-[#8C8062]">
                    Flagged providers are hidden from matching suggestions but never deleted.
                  </p>
                  <Button size="sm" variant="ghost" onClick={() => setShowFlagModal(true)} className="text-amber-700">
                    <Flag size={13} className="mr-1" /> Flag this provider
                  </Button>
                </div>
              )}
            </CardBody>
          </Card>
        </div>
      )}

      {/* ── Add Note Modal ── */}
      <Modal open={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note" size="md">
        <div className="space-y-4">
          <TextArea
            label="Note *"
            value={noteText}
            onChange={e => setNoteText(e.target.value)}
            rows={4}
            placeholder="e.g. Spoke to Abhijit at JalSevak — open to 12% commission for North Delhi. Will send MOU template by Thursday."
          />
          <Input
            label="Your name (optional)"
            value={notedBy}
            onChange={e => setNotedBy(e.target.value)}
            placeholder="e.g. Khushboo"
          />
          <div className="flex gap-3">
            <Button onClick={handleAddNote} className="flex-1" disabled={!noteText.trim()}>Log note</Button>
            <Button variant="ghost" onClick={() => setShowNoteModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Flag Modal ── */}
      <Modal open={showFlagModal} onClose={() => setShowFlagModal(false)} title="Flag Provider" size="md">
        <div className="space-y-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
            Flagged providers are hidden from matching suggestions but remain in your database for audit trail.
          </div>
          <div>
            <label className="block text-sm font-medium text-[#463F2E] mb-1">Reason *</label>
            <select value={flagReason} onChange={e => setFlagReason(e.target.value as FlagReason)}
              className="w-full border border-[#E2D5BE] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#567C45]/20">
              {FLAG_REASONS.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <TextArea
            label="Additional notes (optional)"
            value={flagNotes}
            onChange={e => setFlagNotes(e.target.value)}
            rows={3}
            placeholder="What happened? Specific incident or concern…"
          />
          <div className="flex gap-3">
            <Button onClick={handleFlag} className="flex-1 bg-red-600 hover:bg-red-700">Flag provider</Button>
            <Button variant="ghost" onClick={() => setShowFlagModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Provider" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Name *" value={eForm.name ?? ''} onChange={e => setEForm({ ...eForm, name: e.target.value })} />
            <Input label="City" value={eForm.city ?? ''} onChange={e => setEForm({ ...eForm, city: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#463F2E] mb-1">Provider Type</label>
              <select value={eForm.providerType ?? ''} onChange={e => setEForm({ ...eForm, providerType: e.target.value as ProviderType })}
                className="w-full border border-[#E2D5BE] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#567C45]/20">
                <option value="">— Select —</option>
                {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#463F2E] mb-1">Status</label>
              <select value={eForm.providerStatus ?? 'Pending contact'} onChange={e => setEForm({ ...eForm, providerStatus: e.target.value as ProviderStatus })}
                className="w-full border border-[#E2D5BE] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#567C45]/20">
                {PROVIDER_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={eForm.contactName ?? ''} onChange={e => setEForm({ ...eForm, contactName: e.target.value })} />
            <Input label="Contact Phone" value={eForm.contactPhone ?? ''} onChange={e => setEForm({ ...eForm, contactPhone: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Email" value={eForm.email ?? ''} onChange={e => setEForm({ ...eForm, email: e.target.value })} />
            <Input label="Website" value={eForm.website ?? ''} onChange={e => setEForm({ ...eForm, website: e.target.value })} />
          </div>
          <Input label="Capacity / Scale" value={eForm.capacityNotes ?? ''} onChange={e => setEForm({ ...eForm, capacityNotes: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Capacity Min (KLD)" type="number" value={eForm.capacityMinKld ?? ''} onChange={e => setEForm({ ...eForm, capacityMinKld: parseFloat(e.target.value) || undefined })} />
            <Input label="Capacity Max (KLD)" type="number" value={eForm.capacityMaxKld ?? ''} onChange={e => setEForm({ ...eForm, capacityMaxKld: parseFloat(e.target.value) || undefined })} />
          </div>
          <TextArea label="Technology" value={eForm.technology ?? ''} onChange={e => setEForm({ ...eForm, technology: e.target.value })} rows={2} />
          <TextArea label="Certifications" value={eForm.certifications ?? ''} onChange={e => setEForm({ ...eForm, certifications: e.target.value })} rows={2} />
          <Input label="Best For (comma-separated)" value={eForm.bestForStr} onChange={e => setEForm({ ...eForm, bestForStr: e.target.value })} placeholder="e.g. Private Hospital, School" />
          <Input label="Geographic Coverage (comma-separated)" value={eForm.coverageStr} onChange={e => setEForm({ ...eForm, coverageStr: e.target.value })} placeholder="e.g. Delhi, Mumbai, Pan-India" />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Commission Rate %" type="number" value={eForm.commissionRatePct ?? ''} onChange={e => setEForm({ ...eForm, commissionRatePct: parseFloat(e.target.value) || 0 })} />
          </div>
          <div className="flex gap-3 pt-2">
            <Button onClick={handleSaveEdit} className="flex-1">Save changes</Button>
            <Button variant="ghost" onClick={() => setShowEditModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
