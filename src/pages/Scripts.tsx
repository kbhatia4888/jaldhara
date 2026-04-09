import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import type { Script } from '../types';
import { Copy, Check, Plus, Edit2, Trash2, MessageCircle, BookOpen } from 'lucide-react';

const CATEGORIES: Script['category'][] = [
  'Cold Approach',
  'DJB Rebate',
  'Objection Handlers',
  'WhatsApp Templates',
  'Referral Handover',
  'Commission',
];

const CATEGORY_COLORS: Record<Script['category'], string> = {
  'Cold Approach': 'bg-blue-100 text-blue-700',
  'DJB Rebate': 'bg-teal-100 text-teal-700',
  'Objection Handlers': 'bg-red-100 text-red-700',
  'WhatsApp Templates': 'bg-green-100 text-green-700',
  'Referral Handover': 'bg-purple-100 text-purple-700',
  'Commission': 'bg-amber-100 text-amber-700',
};

function ScriptCard({ script, onEdit, onDelete }: {
  script: Script;
  onEdit: (s: Script) => void;
  onDelete: (id: string) => void;
}) {
  const [copied, setCopied] = useState(false);

  function copyToClipboard() {
    navigator.clipboard.writeText(script.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openWhatsApp() {
    const encoded = encodeURIComponent(script.content);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  }

  return (
    <Card>
      <CardBody className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mb-1 ${CATEGORY_COLORS[script.category]}`}>
              {script.category}
            </span>
            <h3 className="font-semibold text-[#2C2820] text-sm">{script.title}</h3>
          </div>
          <div className="flex gap-1 flex-shrink-0">
            <button
              onClick={() => onEdit(script)}
              className="p-1.5 text-[#ADA082] hover:text-[#463F2E] hover:bg-[#EDE4D4] rounded-lg transition-colors"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={() => onDelete(script.id)}
              className="p-1.5 text-[#ADA082] hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>

        <pre className="text-sm text-[#463F2E] whitespace-pre-wrap font-sans leading-relaxed bg-[#F6F1EA] rounded-xl p-4 max-h-48 overflow-y-auto">
          {script.content}
        </pre>

        <div className="flex gap-2 pt-1">
          <button
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#E2D5BE] text-[#463F2E] rounded-lg text-xs font-medium hover:bg-[#F6F1EA] transition-colors"
          >
            {copied ? <Check size={13} className="text-green-500" /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={openWhatsApp}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 border border-green-200 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
          >
            <MessageCircle size={13} />
            Send via WhatsApp
          </button>
        </div>
      </CardBody>
    </Card>
  );
}

export default function Scripts() {
  const { state, addScript, updateScript, deleteScript } = useStore();
  const { scripts } = state;

  const [activeCategory, setActiveCategory] = useState<Script['category'] | 'All'>('All');
  const [showModal, setShowModal] = useState(false);
  const [editScript, setEditScript] = useState<Script | null>(null);
  const [form, setForm] = useState<{ title: string; category: Script['category']; content: string }>({
    title: '',
    category: 'Cold Approach',
    content: '',
  });

  const filtered = useMemo(() =>
    activeCategory === 'All' ? scripts : scripts.filter(s => s.category === activeCategory),
    [scripts, activeCategory]
  );

  const categoryCount = useMemo(() => {
    const counts: Record<string, number> = { All: scripts.length };
    CATEGORIES.forEach(cat => {
      counts[cat] = scripts.filter(s => s.category === cat).length;
    });
    return counts;
  }, [scripts]);

  function openAdd() {
    setEditScript(null);
    setForm({ title: '', category: 'Cold Approach', content: '' });
    setShowModal(true);
  }

  function openEdit(s: Script) {
    setEditScript(s);
    setForm({ title: s.title, category: s.category, content: s.content });
    setShowModal(true);
  }

  function handleSubmit() {
    if (!form.title.trim() || !form.content.trim()) return;
    if (editScript) {
      updateScript({ ...editScript, ...form });
    } else {
      addScript(form);
    }
    setShowModal(false);
  }

  function handleDelete(id: string) {
    if (window.confirm('Delete this script?')) deleteScript(id);
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <BookOpen size={22} className="text-[#567C45]" />
            <h1 className="text-2xl font-bold text-[#2C2820]">Scripts Library</h1>
          </div>
          <p className="text-[#8C8062] text-sm mt-0.5">Phone scripts, objection handlers, and WhatsApp templates</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus size={16} className="mr-1" /> Add Script
        </Button>
      </div>

      {/* Category filter tabs */}
      <div className="flex flex-wrap gap-2">
        {(['All', ...CATEGORIES] as const).map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat as Script['category'] | 'All')}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-[#567C45] text-white'
                : 'bg-white border border-[#E2D5BE] text-[#5C5244] hover:bg-[#F6F1EA]'
            }`}
          >
            {cat}
            <span className={`ml-1.5 text-xs ${activeCategory === cat ? 'text-white/70' : 'text-[#ADA082]'}`}>
              {categoryCount[cat] || 0}
            </span>
          </button>
        ))}
      </div>

      {/* Scripts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map(script => (
          <ScriptCard
            key={script.id}
            script={script}
            onEdit={openEdit}
            onDelete={handleDelete}
          />
        ))}
        {filtered.length === 0 && (
          <div className="lg:col-span-2 text-center py-12 text-[#ADA082]">
            No scripts in this category yet. Click "Add Script" to add one.
          </div>
        )}
      </div>

      {/* Add/Edit modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editScript ? 'Edit Script' : 'Add New Script'}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Script Title *"
            value={form.title}
            onChange={e => setForm({ ...form, title: e.target.value })}
            placeholder="e.g. Hospital — phone script"
          />
          <Select
            label="Category *"
            options={CATEGORIES.map(c => ({ value: c, label: c }))}
            value={form.category}
            onChange={e => setForm({ ...form, category: e.target.value as Script['category'] })}
          />
          <TextArea
            label="Script Content *"
            value={form.content}
            onChange={e => setForm({ ...form, content: e.target.value })}
            placeholder="Write the full script here..."
            rows={10}
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSubmit} className="flex-1">
            {editScript ? 'Save Changes' : 'Add Script'}
          </Button>
          <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
