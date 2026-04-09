import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import type { JournalEntry, JournalCategory } from '../types';
import { BookOpen, Plus, Edit2, Trash2, Pin, Search, Tag, X } from 'lucide-react';
import { format } from 'date-fns';

const CATEGORIES: JournalCategory[] = [
  'Inspiration', 'Meeting Notes', 'Product Idea', 'Research', 'Observation', 'Personal', 'Other',
];

const CATEGORY_STYLES: Record<JournalCategory, string> = {
  'Inspiration':    'bg-amber-100/60 text-[#96631A] border-amber-200',
  'Meeting Notes':  'bg-blue-50 text-blue-700 border-blue-100',
  'Product Idea':   'bg-[#567C45]/10 text-[#436036] border-[#567C45]/20',
  'Research':       'bg-purple-50 text-purple-700 border-purple-100',
  'Observation':    'bg-[#EDE4D4] text-[#5C5244] border-[#D8CEBC]',
  'Personal':       'bg-rose-50 text-rose-700 border-rose-100',
  'Other':          'bg-[#F6F1EA] text-[#8C8062] border-[#E2D5BE]',
};

interface EntryForm {
  title: string;
  body: string;
  category: JournalCategory;
  tags: string;
  pinned: boolean;
  linkedBuildingId: string;
}

const blank: EntryForm = {
  title: '', body: '', category: 'Observation', tags: '', pinned: false, linkedBuildingId: '',
};

export default function Journal() {
  const { state, addJournal, updateJournal, deleteJournal } = useStore();
  const { journalEntries, buildings } = state;

  const [showModal, setShowModal] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [form, setForm] = useState<EntryForm>(blank);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState<JournalCategory | 'All'>('All');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  function openAdd(cat?: JournalCategory) {
    setEditEntry(null);
    setForm({ ...blank, category: cat ?? 'Observation' });
    setShowModal(true);
  }

  function openEdit(e: JournalEntry) {
    setEditEntry(e);
    setForm({
      title: e.title,
      body: e.body,
      category: e.category,
      tags: e.tags.join(', '),
      pinned: e.pinned,
      linkedBuildingId: e.linkedBuildingId ?? '',
    });
    setShowModal(true);
  }

  function save() {
    if (!form.title.trim() && !form.body.trim()) return;
    const tags = form.tags.split(',').map(t => t.trim()).filter(Boolean);
    const now = new Date().toISOString();
    const payload = {
      title: form.title.trim() || form.body.slice(0, 60),
      body: form.body,
      category: form.category,
      tags,
      pinned: form.pinned,
      linkedBuildingId: form.linkedBuildingId || undefined,
      updatedAt: now,
    };
    if (editEntry) {
      updateJournal({ ...editEntry, ...payload });
    } else {
      addJournal({ ...payload, createdAt: now });
    }
    setShowModal(false);
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return journalEntries
      .filter(e =>
        (filterCat === 'All' || e.category === filterCat) &&
        (!q || e.title.toLowerCase().includes(q) || e.body.toLowerCase().includes(q) || e.tags.some(t => t.toLowerCase().includes(q)))
      )
      .sort((a, b) => {
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
  }, [journalEntries, search, filterCat]);

  const pinned = filtered.filter(e => e.pinned);
  const rest = filtered.filter(e => !e.pinned);

  function EntryCard({ e }: { e: JournalEntry }) {
    const building = e.linkedBuildingId ? buildings.find(b => b.id === e.linkedBuildingId) : null;
    const isExpanded = expandedId === e.id;
    const preview = e.body.split('\n')[0].slice(0, 140);
    const hasMore = e.body.length > 140 || e.body.includes('\n');
    return (
      <Card>
        <CardBody className="py-4">
          <div className="flex items-start gap-3">
            <div className="flex-1 min-w-0">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap min-w-0">
                  {e.pinned && <Pin size={11} className="text-[#96631A] flex-shrink-0 fill-[#96631A]" />}
                  <h3
                    className="font-semibold text-[#2C2820] text-sm cursor-pointer hover:text-[#567C45] transition-colors leading-snug"
                    onClick={() => setExpandedId(isExpanded ? null : e.id)}
                  >
                    {e.title}
                  </h3>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
                  <button onClick={() => openEdit(e)} className="p-1.5 text-[#ADA082] hover:text-[#5C5244] rounded-lg hover:bg-[#EDE4D4] transition-colors">
                    <Edit2 size={12} />
                  </button>
                  <button
                    onClick={() => { if (window.confirm('Delete this entry?')) deleteJournal(e.id); }}
                    className="p-1.5 text-[#ADA082] hover:text-[#A86030] rounded-lg hover:bg-[#FBF2EC] transition-colors"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>

              {/* Category + meta */}
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${CATEGORY_STYLES[e.category]}`}>
                  {e.category}
                </span>
                <span className="text-[10px] text-[#ADA082]">
                  {format(new Date(e.updatedAt), 'd MMM yyyy')}
                </span>
                {building && (
                  <span className="text-[10px] text-[#567C45] bg-[#567C45]/8 px-1.5 py-0.5 rounded">
                    {building.name}
                  </span>
                )}
              </div>

              {/* Body preview / expanded */}
              <div
                className="mt-2.5 text-sm text-[#5C5244] leading-relaxed cursor-pointer"
                onClick={() => hasMore && setExpandedId(isExpanded ? null : e.id)}
              >
                {isExpanded ? (
                  <p className="whitespace-pre-wrap">{e.body}</p>
                ) : (
                  <p>{preview}{hasMore && !isExpanded ? <span className="text-[#ADA082]">… <span className="text-[#567C45] text-xs">read more</span></span> : ''}</p>
                )}
              </div>

              {/* Tags */}
              {e.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2.5">
                  {e.tags.map(t => (
                    <button
                      key={t}
                      onClick={() => setSearch(t)}
                      className="text-[10px] text-[#8C8062] bg-[#EDE4D4] px-2 py-0.5 rounded-full hover:bg-[#DDD0BC] transition-colors"
                    >
                      #{t}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <BookOpen size={22} className="text-[#96631A]" />
            <h1 className="text-2xl font-bold text-[#2C2820]">Journal</h1>
          </div>
          <p className="text-[#8C8062] text-sm mt-0.5">Notes, ideas, meeting logs, and things that inspire you</p>
        </div>
        <Button onClick={() => openAdd()} className="flex-shrink-0">
          <Plus size={15} className="mr-1.5" /> New Entry
        </Button>
      </div>

      {/* Quick-add category buttons */}
      <div className="flex flex-wrap gap-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => openAdd(cat)}
            className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all hover:shadow-sm ${CATEGORY_STYLES[cat]}`}
          >
            + {cat}
          </button>
        ))}
      </div>

      {/* Search + filter */}
      {journalEntries.length > 0 && (
        <div className="flex gap-3 items-center">
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#ADA082]" />
            <input
              type="text"
              placeholder="Search entries, tags…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-8 py-2 text-sm bg-[#FDFAF4] border border-[#E2D5BE] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820] placeholder-[#BFB39E]"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ADA082] hover:text-[#5C5244]">
                <X size={12} />
              </button>
            )}
          </div>
          <select
            value={filterCat}
            onChange={e => setFilterCat(e.target.value as JournalCategory | 'All')}
            className="text-sm bg-[#FDFAF4] border border-[#E2D5BE] rounded-xl px-3 py-2 text-[#5C5244] outline-none focus:border-[#567C45]"
          >
            <option value="All">All categories</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      )}

      {/* Empty state */}
      {journalEntries.length === 0 && (
        <Card>
          <CardBody className="py-16 text-center">
            <BookOpen size={36} className="mx-auto text-[#D8CEBC] mb-4" />
            <p className="text-[#5C5244] font-medium">Your journal is empty</p>
            <p className="text-[#ADA082] text-sm mt-1">Capture meeting notes, ideas, or anything that inspires you.</p>
            <Button onClick={() => openAdd()} className="mt-5 mx-auto">
              <Plus size={14} className="mr-1.5" /> Write first entry
            </Button>
          </CardBody>
        </Card>
      )}

      {/* No results */}
      {journalEntries.length > 0 && filtered.length === 0 && (
        <Card>
          <CardBody className="py-10 text-center">
            <p className="text-[#ADA082] text-sm">No entries match your search.</p>
            <button onClick={() => { setSearch(''); setFilterCat('All'); }} className="text-[#567C45] text-sm mt-2 hover:underline">Clear filters</button>
          </CardBody>
        </Card>
      )}

      {/* Pinned */}
      {pinned.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold text-[#ADA082] uppercase tracking-widest flex items-center gap-1.5">
            <Pin size={10} className="fill-[#ADA082]" /> Pinned
          </p>
          {pinned.map(e => <EntryCard key={e.id} e={e} />)}
        </div>
      )}

      {/* Rest */}
      {rest.length > 0 && (
        <div className="space-y-3">
          {pinned.length > 0 && (
            <p className="text-xs font-semibold text-[#ADA082] uppercase tracking-widest">Recent</p>
          )}
          {rest.map(e => <EntryCard key={e.id} e={e} />)}
        </div>
      )}

      {/* Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editEntry ? 'Edit Entry' : 'New Entry'} size="lg">
        <div className="space-y-4">
          <Input
            label="Title"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="What's this about?"
          />

          <div>
            <label className="text-sm font-medium text-[#463F2E] block mb-1">Notes</label>
            <textarea
              value={form.body}
              onChange={e => setForm({ ...form, body: e.target.value })}
              rows={8}
              placeholder="Write freely — meeting observations, ideas, things that stood out…"
              className="w-full px-3 py-3 text-sm bg-[#FDFAF4] border border-[#D8CEBC] rounded-xl outline-none focus:border-[#567C45] focus:ring-1 focus:ring-[#567C45]/20 text-[#2C2820] placeholder-[#BFB39E] resize-none leading-relaxed"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Category"
              options={CATEGORIES.map(c => ({ value: c, label: c }))}
              value={form.category}
              onChange={e => setForm({ ...form, category: e.target.value as JournalCategory })}
            />
            <Select
              label="Linked Building (optional)"
              options={[{ value: '', label: '— None —' }, ...buildings.map(b => ({ value: b.id, label: b.name }))]}
              value={form.linkedBuildingId}
              onChange={e => setForm({ ...form, linkedBuildingId: e.target.value })}
            />
          </div>

          <Input
            label="Tags (comma-separated)"
            value={form.tags}
            onChange={e => setForm({ ...form, tags: e.target.value })}
            placeholder="e.g. hospital, delhi, rwh, idea"
          />

          <label className="flex items-center gap-2.5 cursor-pointer">
            <input
              type="checkbox"
              checked={form.pinned}
              onChange={e => setForm({ ...form, pinned: e.target.checked })}
              className="rounded border-[#D8CEBC] text-[#567C45]"
            />
            <span className="text-sm text-[#5C5244]">Pin this entry to the top</span>
          </label>

          <div className="flex gap-3 pt-1">
            <Button onClick={save} className="flex-1" disabled={!form.title.trim() && !form.body.trim()}>
              {editEntry ? 'Save Changes' : 'Save Entry'}
            </Button>
            <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
