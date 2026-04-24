import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { useToast } from '../components/ui/Toast';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import type { Manufacturer, ProviderStream, ProviderType, ProviderStatus } from '../types';
import {
  Factory, Search, Star, MapPin, Zap, Flag, Crown, Plus, ChevronRight,
  AlertTriangle, Globe, Phone, Mail, Building2,
} from 'lucide-react';

// ── Constants ────────────────────────────────────────────
const STREAMS: { key: ProviderStream; label: string; color: string; bg: string }[] = [
  { key: 'greywater', label: 'Greywater Recycling',   color: 'text-blue-700',  bg: 'bg-blue-100'  },
  { key: 'rainwater', label: 'Rainwater Harvesting',  color: 'text-sky-700',   bg: 'bg-sky-100'   },
  { key: 'trees',     label: 'Urban Trees',           color: 'text-green-700', bg: 'bg-green-100' },
  { key: 'lakes',     label: 'Lakes & Water Bodies',  color: 'text-teal-700',  bg: 'bg-teal-100'  },
];

const PROVIDER_TYPES: ProviderType[] = [
  'Manufacturer', 'NGO', 'EPC Contractor', 'Consultant', 'Component Supplier',
];

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

function Stars({ rating, size = 14 }: { rating?: number; size?: number }) {
  if (!rating) return <span className="text-xs text-[#ADA082]">Not rated</span>;
  return (
    <span className="flex items-center gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={size}
          className={i < rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200 fill-gray-200'}
        />
      ))}
    </span>
  );
}

// ── Main component ────────────────────────────────────────
export default function Providers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state, addManufacturer, updateManufacturer } = useStore();
  const { manufacturers: providers } = state;

  const [activeStream, setActiveStream] = useState<ProviderStream>('greywater');
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterCoverage, setFilterCoverage] = useState('');
  const [showFlagged, setShowFlagged] = useState(false);
  const [sortKey, setSortKey] = useState<'name' | 'rating' | 'status'>('name');

  const [showAddModal, setShowAddModal] = useState(false);
  const blankForm = {
    name: '', city: '', website: '', contactName: '', contactPhone: '', email: '',
    providerType: '' as ProviderType | '',
    capacityNotes: '', technology: '', certifications: '',
    bestFor: '', geographicCoverage: '', commissionRatePct: '',
    speciality: '', notes: '',
  };
  const [form, setForm] = useState(blankForm);

  const streamProviders = useMemo(() =>
    providers.filter(p => (p.stream ?? 'greywater') === activeStream),
    [providers, activeStream]
  );

  const flaggedCount = streamProviders.filter(p => p.isFlagged).length;

  const filtered = useMemo(() => {
    let list = showFlagged ? streamProviders : streamProviders.filter(p => !p.isFlagged);
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(p =>
        p.name.toLowerCase().includes(q) ||
        p.city.toLowerCase().includes(q) ||
        (p.technology ?? '').toLowerCase().includes(q) ||
        (p.speciality ?? '').toLowerCase().includes(q)
      );
    }
    if (filterType) list = list.filter(p => (p.providerType ?? p.speciality) === filterType || p.providerType === filterType);
    if (filterStatus) list = list.filter(p => (p.providerStatus ?? 'Pending contact') === filterStatus);
    if (filterCoverage) {
      const q = filterCoverage.toLowerCase();
      list = list.filter(p => {
        const coverage = [...(p.geographicCoverage ?? []), ...(p.citiesCovered ?? [])];
        return coverage.some(c => c.toLowerCase().includes(q));
      });
    }
    list = [...list].sort((a, b) => {
      if (sortKey === 'rating') return (b.starRating ?? 0) - (a.starRating ?? 0);
      if (sortKey === 'status') return (a.providerStatus ?? '').localeCompare(b.providerStatus ?? '');
      return a.name.localeCompare(b.name);
    });
    // Preferred always first
    list.sort((a, b) => (b.isPreferred ? 1 : 0) - (a.isPreferred ? 1 : 0));
    return list;
  }, [streamProviders, search, filterType, filterStatus, filterCoverage, sortKey, showFlagged]);

  function handleAdd() {
    if (!form.name.trim()) return;
    addManufacturer({
      name: form.name,
      city: form.city,
      website: form.website || undefined,
      contactName: form.contactName || undefined,
      contactPhone: form.contactPhone || undefined,
      email: form.email || undefined,
      providerType: (form.providerType || undefined) as ProviderType | undefined,
      capacityNotes: form.capacityNotes || undefined,
      technology: form.technology || undefined,
      certifications: form.certifications || undefined,
      bestFor: form.bestFor ? form.bestFor.split(',').map(s => s.trim()).filter(Boolean) : [],
      geographicCoverage: form.geographicCoverage ? form.geographicCoverage.split(',').map(s => s.trim()).filter(Boolean) : [],
      commissionRatePct: parseFloat(form.commissionRatePct) || 0,
      commissionStatus: 'Not discussed',
      providerStatus: 'Pending contact',
      stream: activeStream,
      speciality: form.speciality || form.name,
      citiesCovered: [],
      notes: form.notes || undefined,
      active: true,
      createdAt: new Date().toISOString(),
    });
    setShowAddModal(false);
    setForm(blankForm);
    toast('Provider added');
  }

  const activeStream_ = STREAMS.find(s => s.key === activeStream)!;

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-5">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Factory size={22} className="text-[#567C45]" />
            <h1 className="text-2xl font-bold text-[#2C2820]">Providers</h1>
          </div>
          <p className="text-[#8C8062] text-sm mt-0.5">
            JalDhara is a platform — every provider here is a potential match for the right building.
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} size="sm">
          <Plus size={15} className="mr-1" /> Add Provider
        </Button>
      </div>

      {/* Stream tabs */}
      <div className="flex gap-1 flex-wrap bg-[#EDE4D4] p-1 rounded-xl">
        {STREAMS.map(s => (
          <button
            key={s.key}
            onClick={() => setActiveStream(s.key)}
            className={`flex-1 min-w-max px-3 py-2 rounded-lg text-sm font-medium transition-all ${
              activeStream === s.key
                ? 'bg-white shadow-sm text-[#2C2820]'
                : 'text-[#8C8062] hover:text-[#463F2E]'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Flagged warning */}
      {flaggedCount > 0 && !showFlagged && (
        <button
          onClick={() => setShowFlagged(true)}
          className="w-full flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left hover:bg-amber-100 transition-colors"
        >
          <AlertTriangle size={16} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800 font-medium">
            {flaggedCount} provider{flaggedCount > 1 ? 's are' : ' is'} flagged in this stream.{' '}
            <span className="underline">View flagged</span>
          </p>
        </button>
      )}

      {/* Search + Filters */}
      <Card>
        <CardBody className="space-y-3 py-3">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ADA082]" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder={`Search ${activeStream_?.label} providers by name, city, technology…`}
              className="w-full pl-9 pr-4 py-2 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820] placeholder-[#BFB39E]"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="text-xs border border-[#D8CEBC] rounded-lg px-2.5 py-1.5 bg-white text-[#5C5244] outline-none focus:border-[#567C45]">
              <option value="">All types</option>
              {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="text-xs border border-[#D8CEBC] rounded-lg px-2.5 py-1.5 bg-white text-[#5C5244] outline-none focus:border-[#567C45]">
              <option value="">All statuses</option>
              {(['Active', 'Commission agreed', 'Pending contact', 'Paused', 'Flagged'] as ProviderStatus[]).map(s =>
                <option key={s} value={s}>{s}</option>
              )}
            </select>
            <select value={filterCoverage} onChange={e => setFilterCoverage(e.target.value)}
              className="text-xs border border-[#D8CEBC] rounded-lg px-2.5 py-1.5 bg-white text-[#5C5244] outline-none focus:border-[#567C45]">
              <option value="">All locations</option>
              {['Delhi', 'Mumbai', 'Bengaluru', 'Pune', 'Pan-India', 'International'].map(c =>
                <option key={c} value={c}>{c}</option>
              )}
            </select>
            <div className="flex items-center gap-1 ml-1 text-xs text-[#8C8062]">
              Sort:
              {(['name', 'rating', 'status'] as const).map(k => (
                <button key={k} onClick={() => setSortKey(k)}
                  className={`px-2 py-0.5 rounded-full capitalize transition-colors ${sortKey === k ? 'bg-[#567C45] text-white' : 'hover:bg-[#EDE4D4] text-[#5C5244]'}`}>
                  {k === 'rating' ? 'Star rating' : k.charAt(0).toUpperCase() + k.slice(1)}
                </button>
              ))}
            </div>
            {showFlagged && (
              <button onClick={() => setShowFlagged(false)}
                className="text-xs text-red-600 border border-red-200 rounded-full px-2.5 py-1 bg-red-50 hover:bg-red-100 transition-colors">
                Hide flagged ✕
              </button>
            )}
          </div>
          <p className="text-xs text-[#ADA082]">
            {filtered.length} provider{filtered.length !== 1 ? 's' : ''} in {activeStream_?.label}
            {search || filterType || filterStatus || filterCoverage ? ' (filtered)' : ''}
          </p>
        </CardBody>
      </Card>

      {/* Provider grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <Factory size={40} className="text-[#ADA082] mx-auto mb-3" />
          <h3 className="font-semibold text-[#2C2820] mb-1">No providers found</h3>
          <p className="text-[#8C8062] text-sm mb-4">
            {search || filterType || filterStatus || filterCoverage
              ? 'Try adjusting your search or filters.'
              : `No providers added for ${activeStream_?.label} yet.`}
          </p>
          <Button onClick={() => setShowAddModal(true)} size="sm">
            <Plus size={14} className="mr-1" /> Add first provider
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(provider => {
            const stream = STREAMS.find(s => s.key === (provider.stream ?? 'greywater'))!;
            const status = provider.providerStatus ?? 'Pending contact';
            const coverage = [...(provider.geographicCoverage ?? []), ...(provider.citiesCovered ?? [])].slice(0, 3);
            return (
              <div
                key={provider.id}
                onClick={() => navigate(`/providers/${provider.id}`)}
                className={`relative bg-white rounded-2xl border p-4 cursor-pointer hover:shadow-md transition-all group ${
                  provider.isFlagged ? 'border-red-200 bg-red-50/30' : 'border-[#E2D5BE] hover:border-[#567C45]/30'
                }`}
              >
                {/* Preferred crown */}
                {provider.isPreferred && (
                  <div className="absolute top-3 right-3">
                    <Crown size={16} className="text-amber-400 fill-amber-400" />
                  </div>
                )}

                {/* Header */}
                <div className="flex items-start gap-2 pr-6">
                  <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${stream.bg} flex items-center justify-center`}>
                    <Factory size={16} className={stream.color} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-[#2C2820] text-sm leading-snug group-hover:text-[#567C45] transition-colors truncate">
                      {provider.name}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                      {provider.providerType && (
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${TYPE_COLORS[provider.providerType] ?? 'bg-gray-100 text-gray-600'}`}>
                          {provider.providerType}
                        </span>
                      )}
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${STATUS_COLORS[status] ?? 'bg-gray-100 text-gray-600'}`}>
                        {status}
                      </span>
                      {provider.isFlagged && (
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 flex items-center gap-0.5">
                          <Flag size={9} /> Flagged
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 mt-2.5 text-xs text-[#8C8062]">
                  <MapPin size={11} className="flex-shrink-0" />
                  <span className="truncate">{provider.city}</span>
                </div>

                {/* Capacity */}
                {(provider.capacityMinKld !== undefined || provider.capacityNotes) && (
                  <p className="text-xs text-[#5C5244] mt-1 truncate">
                    {provider.capacityMinKld !== undefined && provider.capacityMaxKld !== undefined
                      ? `${provider.capacityMinKld}–${provider.capacityMaxKld} KLD`
                      : provider.capacityNotes?.split('.')[0]
                    }
                  </p>
                )}

                {/* Star rating */}
                <div className="mt-2">
                  <Stars rating={provider.starRating} />
                </div>

                {/* Coverage chips */}
                {coverage.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {coverage.map(c => (
                      <span key={c} className="text-[10px] bg-[#EDE4D4] text-[#5C5244] px-1.5 py-0.5 rounded-full">{c}</span>
                    ))}
                  </div>
                )}

                {/* Commission */}
                {provider.commissionRatePct > 0 && (
                  <p className="text-xs font-semibold text-[#567C45] mt-2">
                    {provider.commissionRatePct}% commission
                  </p>
                )}

                {/* CTA */}
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#F0E8D8]">
                  <span className="text-xs text-[#ADA082]">
                    {provider.lastContactedAt
                      ? `Last contact: ${new Date(provider.lastContactedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
                      : 'Never contacted'}
                  </span>
                  <ChevronRight size={14} className="text-[#ADA082] group-hover:text-[#567C45] transition-colors" />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Provider Modal */}
      <Modal open={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Provider" size="lg">
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Provider Name *" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. JalSevak Solutions" />
            <Input label="City / Location *" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} placeholder="e.g. Pune, Maharashtra" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#463F2E] mb-1">Provider Type</label>
              <select value={form.providerType} onChange={e => setForm({ ...form, providerType: e.target.value as ProviderType })}
                className="w-full border border-[#E2D5BE] rounded-xl px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-[#567C45]/20">
                <option value="">— Select type —</option>
                {PROVIDER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <Input label="Website" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} placeholder="e.g. example.com" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Name" value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} />
            <Input label="Contact Phone" value={form.contactPhone} onChange={e => setForm({ ...form, contactPhone: e.target.value })} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
          <Input label="Capacity / Scale" value={form.capacityNotes} onChange={e => setForm({ ...form, capacityNotes: e.target.value })} placeholder="e.g. 1–100 KLD, or 5,000–50,000 trees/year" />
          <TextArea label="Technology / Approach" value={form.technology} onChange={e => setForm({ ...form, technology: e.target.value })} rows={2} placeholder="Key technology or methodology used" />
          <Input label="Geographic Coverage (comma-separated)" value={form.geographicCoverage} onChange={e => setForm({ ...form, geographicCoverage: e.target.value })} placeholder="e.g. Delhi, Mumbai, Pan-India" />
          <Input label="Best For — Building Types (comma-separated)" value={form.bestFor} onChange={e => setForm({ ...form, bestFor: e.target.value })} placeholder="e.g. Private Hospital, School, Housing Society" />
          <Input label="Commission Rate %" type="number" value={form.commissionRatePct} onChange={e => setForm({ ...form, commissionRatePct: e.target.value })} placeholder="e.g. 12" />
          <TextArea label="Notes" value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Internal notes, first impressions, key contacts…" />
          <div className="flex gap-3 pt-2">
            <Button onClick={handleAdd} className="flex-1" disabled={!form.name.trim()}>Add Provider</Button>
            <Button variant="ghost" onClick={() => setShowAddModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
