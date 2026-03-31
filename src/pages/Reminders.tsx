import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import type { Reminder } from '../types';
import { Bell, CheckCircle2, Clock, AlertTriangle, Plus, MessageCircle, Check } from 'lucide-react';
import { format, isToday, isPast, isFuture, addDays } from 'date-fns';

const REMINDER_TYPES = [
  'Follow-up after visit',
  'Send DJB rebate WhatsApp',
  'Check referral status',
  'Chase commission payment',
  'AMC due',
  'Hot prospect going cold',
  'Seasonal alert',
  'Other',
];

export default function Reminders() {
  const { state, addReminder, updateReminder, deleteReminder } = useStore();
  const { reminders, buildings, referrals } = state;

  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState<'all' | 'today' | 'upcoming' | 'completed'>('today');
  const [form, setForm] = useState({
    buildingId: '',
    type: 'Follow-up after visit',
    dueDate: new Date().toISOString().split('T')[0],
    message: '',
    whatsappTemplate: '',
  });

  const enrichedReminders = useMemo(() =>
    reminders.map(r => ({
      reminder: r,
      building: r.buildingId ? buildings.find(b => b.id === r.buildingId) : null,
    })).sort((a, b) => {
      if (a.reminder.completed !== b.reminder.completed) return a.reminder.completed ? 1 : -1;
      return new Date(a.reminder.dueDate).getTime() - new Date(b.reminder.dueDate).getTime();
    }),
    [reminders, buildings]
  );

  const filtered = useMemo(() => {
    return enrichedReminders.filter(({ reminder: r }) => {
      if (filter === 'today') return !r.completed && isToday(new Date(r.dueDate + 'T00:00:00'));
      if (filter === 'upcoming') return !r.completed && (isFuture(new Date(r.dueDate + 'T00:00:00')) || isToday(new Date(r.dueDate + 'T00:00:00')));
      if (filter === 'completed') return r.completed;
      return true;
    });
  }, [enrichedReminders, filter]);

  const counts = useMemo(() => ({
    today: reminders.filter(r => !r.completed && isToday(new Date(r.dueDate + 'T00:00:00'))).length,
    overdue: reminders.filter(r => !r.completed && isPast(new Date(r.dueDate + 'T00:00:00')) && !isToday(new Date(r.dueDate + 'T00:00:00'))).length,
    upcoming: reminders.filter(r => !r.completed && isFuture(new Date(r.dueDate + 'T00:00:00'))).length,
    completed: reminders.filter(r => r.completed).length,
  }), [reminders]);

  function markDone(r: Reminder) {
    updateReminder({ ...r, completed: true, completedAt: new Date().toISOString() });
  }

  function handleSubmit() {
    if (!form.message.trim() || !form.dueDate) return;
    addReminder({
      buildingId: form.buildingId || undefined,
      type: form.type,
      dueDate: form.dueDate,
      message: form.message,
      whatsappTemplate: form.whatsappTemplate || undefined,
      completed: false,
      createdAt: new Date().toISOString().split('T')[0],
    });
    setShowModal(false);
    setForm({ buildingId: '', type: 'Follow-up after visit', dueDate: new Date().toISOString().split('T')[0], message: '', whatsappTemplate: '' });
  }

  function getDueBadge(dueDate: string, completed: boolean) {
    if (completed) return null;
    const d = new Date(dueDate + 'T00:00:00');
    if (isToday(d)) return <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Due today</span>;
    if (isPast(d)) return <span className="text-xs font-semibold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">Overdue</span>;
    return <span className="text-xs text-gray-500">{format(d, 'dd MMM')}</span>;
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Bell size={22} className="text-[#0F6E56]" />
            <h1 className="text-2xl font-bold text-gray-900">Reminders</h1>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">Follow-up actions and scheduled tasks</p>
        </div>
        <Button onClick={() => setShowModal(true)} size="sm">
          <Plus size={16} className="mr-1" /> Add Reminder
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Due Today', value: counts.today, color: 'bg-amber-100 text-amber-700', icon: Clock },
          { label: 'Overdue', value: counts.overdue, color: counts.overdue > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-500', icon: AlertTriangle },
          { label: 'Upcoming', value: counts.upcoming, color: 'bg-blue-100 text-blue-700', icon: Bell },
          { label: 'Completed', value: counts.completed, color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
        ].map(stat => (
          <Card key={stat.label}>
            <CardBody className="flex items-center gap-3 py-4">
              <div className={`p-2.5 rounded-xl ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">{stat.label}</p>
                <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['today', 'upcoming', 'all', 'completed'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors capitalize ${
              filter === f
                ? 'bg-[#0F6E56] text-white'
                : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Reminders list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <Card>
            <CardBody className="text-center py-10 text-gray-400">
              {filter === 'today' ? 'No follow-ups due today. 🎉' : 'No reminders found.'}
            </CardBody>
          </Card>
        )}
        {filtered.map(({ reminder: r, building }) => (
          <Card key={r.id} className={r.completed ? 'opacity-60' : ''}>
            <CardBody className="flex items-start gap-4">
              <div className={`flex-shrink-0 mt-0.5 p-2 rounded-xl ${
                r.completed ? 'bg-gray-100' :
                isPast(new Date(r.dueDate + 'T00:00:00')) && !isToday(new Date(r.dueDate + 'T00:00:00')) ? 'bg-red-100' :
                isToday(new Date(r.dueDate + 'T00:00:00')) ? 'bg-amber-100' : 'bg-blue-100'
              }`}>
                {r.completed
                  ? <Check size={16} className="text-gray-500" />
                  : <Bell size={16} className={
                      isPast(new Date(r.dueDate + 'T00:00:00')) && !isToday(new Date(r.dueDate + 'T00:00:00')) ? 'text-red-600' :
                      isToday(new Date(r.dueDate + 'T00:00:00')) ? 'text-amber-600' : 'text-blue-600'
                    } />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  {getDueBadge(r.dueDate, r.completed)}
                  <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{r.type}</span>
                </div>
                <p className={`text-sm font-medium ${r.completed ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                  {r.message}
                </p>
                {building && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {building.name} · {building.contactName} · {building.contactPhone}
                  </p>
                )}
                {r.completedAt && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Completed {format(new Date(r.completedAt), 'dd MMM yyyy')}
                  </p>
                )}
              </div>

              <div className="flex gap-2 flex-shrink-0">
                {!r.completed && building?.contactPhone && (
                  <a
                    href={`https://wa.me/${building.contactPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 px-2 py-1.5 bg-green-50 text-green-700 border border-green-200 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                  >
                    <MessageCircle size={12} /> WhatsApp
                  </a>
                )}
                {!r.completed && (
                  <button
                    onClick={() => markDone(r)}
                    className="flex items-center gap-1 px-2 py-1.5 bg-[#0F6E56]/10 text-[#0F6E56] rounded-lg text-xs font-medium hover:bg-[#0F6E56]/20 transition-colors"
                  >
                    <CheckCircle2 size={12} /> Done
                  </button>
                )}
                <button
                  onClick={() => deleteReminder(r.id)}
                  className="px-2 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                >
                  Delete
                </button>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>

      {/* Add Reminder Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Add Reminder">
        <div className="space-y-4">
          <Select
            label="Linked Building (optional)"
            options={buildings.map(b => ({ value: b.id, label: b.name }))}
            placeholder="Select building (optional)"
            value={form.buildingId}
            onChange={e => {
              const b = buildings.find(bld => bld.id === e.target.value);
              setForm({ ...form, buildingId: e.target.value, message: b ? `Follow up with ${b.contactName} at ${b.name}` : form.message });
            }}
          />
          <Select
            label="Reminder Type *"
            options={REMINDER_TYPES.map(t => ({ value: t, label: t }))}
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
          />
          <Input
            label="Due Date *"
            type="date"
            value={form.dueDate}
            onChange={e => setForm({ ...form, dueDate: e.target.value })}
          />
          <TextArea
            label="Message / Action *"
            value={form.message}
            onChange={e => setForm({ ...form, message: e.target.value })}
            placeholder="What needs to be done?"
          />
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSubmit} className="flex-1">Add Reminder</Button>
          <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
