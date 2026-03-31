import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { Card, CardBody, CardHeader } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input, TextArea } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Table';
import { Badge } from '../components/ui/Badge';
import type { Referral } from '../types';
import { Plus, DollarSign, Clock, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';

const fmtCurrency = (n: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n);

const fmtLakh = (n: number) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  return `₹${(n / 1000).toFixed(0)}K`;
};

const STATUS_OPTIONS: Referral['status'][] = [
  'Referred',
  'Manufacturer Visited',
  'Proposal Sent',
  'Accepted',
  'Installation in Progress',
  'Complete',
  'Commission Paid',
];

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'Commission Paid': return 'success' as const;
    case 'Complete': return 'info' as const;
    case 'Accepted': case 'Installation in Progress': return 'purple' as const;
    case 'Proposal Sent': return 'warning' as const;
    case 'Manufacturer Visited': return 'info' as const;
    default: return 'default' as const;
  }
}

export default function Referrals() {
  const { state, addReferral, updateReferral } = useStore();
  const { referrals, buildings, manufacturers } = state;

  const [showModal, setShowModal] = useState(false);
  const [editReferral, setEditReferral] = useState<Referral | null>(null);
  const [form, setForm] = useState({
    fromBuildingId: '',
    referredName: '',
    referredContact: '',
    manufacturerId: '',
    installationValue: '',
    commissionPct: '12',
    notes: '',
    referredDate: new Date().toISOString().split('T')[0],
  });

  const enrichedReferrals = useMemo(() =>
    referrals
      .map(r => {
        const building = buildings.find(b => b.id === r.fromBuildingId);
        const manufacturer = r.manufacturerId ? manufacturers.find(m => m.id === r.manufacturerId) : null;
        return { referral: r, building, manufacturer };
      })
      .sort((a, b) => new Date(b.referral.createdAt).getTime() - new Date(a.referral.createdAt).getTime()),
    [referrals, buildings, manufacturers]
  );

  const stats = useMemo(() => {
    const active = referrals.filter(r => !['Commission Paid', 'Converted'].includes(r.status));
    const commissionPaid = referrals.filter(r => r.status === 'Commission Paid');
    const complete = referrals.filter(r => r.status === 'Complete');
    const totalExpected = referrals.reduce((s, r) => s + (r.expectedCommission || 0), 0);
    const totalPaid = referrals.reduce((s, r) => s + (r.commissionPaid || 0), 0);
    const overduePendingPay = complete.reduce((s, r) => s + ((r.expectedCommission || 0) - (r.commissionPaid || 0)), 0);
    return { active: active.length, commissionPaid: commissionPaid.length, totalExpected, totalPaid, overduePendingPay };
  }, [referrals]);

  function openAdd() {
    setEditReferral(null);
    setForm({
      fromBuildingId: '',
      referredName: '',
      referredContact: '',
      manufacturerId: '',
      installationValue: '',
      commissionPct: '12',
      notes: '',
      referredDate: new Date().toISOString().split('T')[0],
    });
    setShowModal(true);
  }

  function openEdit(r: Referral) {
    setEditReferral(r);
    setForm({
      fromBuildingId: r.fromBuildingId,
      referredName: r.referredName,
      referredContact: r.referredContact,
      manufacturerId: r.manufacturerId || '',
      installationValue: r.installationValue?.toString() || '',
      commissionPct: r.commissionPct?.toString() || '12',
      notes: r.notes,
      referredDate: r.referredDate || r.createdAt,
    });
    setShowModal(true);
  }

  function handleSubmit() {
    const installVal = parseFloat(form.installationValue) || 0;
    const commPct = parseFloat(form.commissionPct) || 0;
    const expectedCommission = (installVal * commPct) / 100;

    const mfr = form.manufacturerId ? manufacturers.find(m => m.id === form.manufacturerId) : null;
    const referredName = form.referredName || (buildings.find(b => b.id === form.fromBuildingId)?.name || '');

    if (editReferral) {
      updateReferral({
        ...editReferral,
        fromBuildingId: form.fromBuildingId,
        referredName,
        referredContact: form.referredContact,
        manufacturerId: form.manufacturerId || undefined,
        installationValue: installVal || undefined,
        commissionPct: commPct || undefined,
        expectedCommission: expectedCommission || undefined,
        notes: form.notes,
        referredDate: form.referredDate,
      });
    } else {
      addReferral({
        fromBuildingId: form.fromBuildingId,
        referredName,
        referredContact: form.referredContact,
        manufacturerId: form.manufacturerId || undefined,
        installationValue: installVal || undefined,
        commissionPct: commPct || undefined,
        expectedCommission: expectedCommission || undefined,
        referredDate: form.referredDate,
        status: 'Referred',
        notes: form.notes,
        createdAt: new Date().toISOString().split('T')[0],
      });
    }
    setShowModal(false);
  }

  function advanceStatus(r: Referral) {
    const idx = STATUS_OPTIONS.indexOf(r.status as typeof STATUS_OPTIONS[number]);
    if (idx < STATUS_OPTIONS.length - 1) {
      const next = STATUS_OPTIONS[idx + 1];
      const updates: Partial<Referral> = { status: next };
      if (next === 'Commission Paid') {
        updates.commissionPaid = r.expectedCommission;
        updates.commissionPaidDate = new Date().toISOString().split('T')[0];
      }
      updateReferral({ ...r, ...updates });
    }
  }

  return (
    <div className="max-w-screen-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Referrals & Commissions</h1>
          <p className="text-gray-500 text-sm">Track manufacturer referrals and commission payments</p>
        </div>
        <Button onClick={openAdd} size="sm">
          <Plus size={16} className="mr-1" /> Log Referral
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardBody className="flex items-center gap-3 py-4">
            <div className="bg-blue-100 p-2.5 rounded-xl"><Clock size={18} className="text-blue-700" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Active Referrals</p>
              <p className="text-xl font-bold text-gray-900">{stats.active}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3 py-4">
            <div className="bg-amber-100 p-2.5 rounded-xl"><DollarSign size={18} className="text-amber-700" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Total Expected</p>
              <p className="text-xl font-bold text-gray-900">{fmtLakh(stats.totalExpected)}</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3 py-4">
            <div className="bg-green-100 p-2.5 rounded-xl"><CheckCircle size={18} className="text-green-700" /></div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Commissions Paid</p>
              <p className="text-xl font-bold text-gray-900">{fmtLakh(stats.totalPaid)}</p>
              <p className="text-xs text-gray-400">{stats.commissionPaid} payments</p>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="flex items-center gap-3 py-4">
            <div className={`p-2.5 rounded-xl ${stats.overduePendingPay > 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
              <AlertTriangle size={18} className={stats.overduePendingPay > 0 ? 'text-red-600' : 'text-gray-500'} />
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium">Pending Payment</p>
              <p className={`text-xl font-bold ${stats.overduePendingPay > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                {fmtLakh(stats.overduePendingPay)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Status pipeline */}
      <Card>
        <CardBody className="py-3">
          <div className="flex items-center gap-1 overflow-x-auto pb-1">
            {STATUS_OPTIONS.map((stage, idx) => {
              const count = referrals.filter(r => r.status === stage).length;
              return (
                <React.Fragment key={stage}>
                  <div className={`flex-shrink-0 px-3 py-2 rounded-lg text-center min-w-[100px] ${
                    count > 0 ? 'bg-[#0F6E56]/10 border border-[#0F6E56]/20' : 'bg-gray-50 border border-gray-100'
                  }`}>
                    <p className="text-xs font-semibold text-gray-700 leading-tight">{stage}</p>
                    <p className={`text-lg font-bold mt-0.5 ${count > 0 ? 'text-[#0F6E56]' : 'text-gray-300'}`}>{count}</p>
                  </div>
                  {idx < STATUS_OPTIONS.length - 1 && (
                    <ArrowRight size={14} className="text-gray-300 flex-shrink-0" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </CardBody>
      </Card>

      {/* Referrals table */}
      <Card>
        <Table>
          <THead>
            <TR>
              <TH>Building</TH>
              <TH>Referred To / Manufacturer</TH>
              <TH>Date</TH>
              <TH>Install Value</TH>
              <TH>Comm %</TH>
              <TH>Expected ₹</TH>
              <TH>Paid ₹</TH>
              <TH>Status</TH>
              <TH>Action</TH>
            </TR>
          </THead>
          <TBody>
            {enrichedReferrals.map(({ referral: r, building, manufacturer }) => (
              <TR key={r.id} onClick={() => openEdit(r)}>
                <TD>
                  <div className="font-medium text-gray-900">{building?.name || r.fromBuildingId}</div>
                  <div className="text-xs text-gray-400">{building?.type}</div>
                </TD>
                <TD>
                  <div className="font-medium text-gray-900">{r.referredName}</div>
                  {manufacturer && (
                    <div className="text-xs text-[#0F6E56] font-medium">{manufacturer.name}</div>
                  )}
                </TD>
                <TD className="text-sm whitespace-nowrap">
                  {r.referredDate ? format(new Date(r.referredDate), 'dd MMM yy') : '—'}
                </TD>
                <TD className="text-sm">{r.installationValue ? fmtLakh(r.installationValue) : '—'}</TD>
                <TD className="text-sm">{r.commissionPct ? `${r.commissionPct}%` : '—'}</TD>
                <TD className="font-semibold text-amber-700">{r.expectedCommission ? fmtLakh(r.expectedCommission) : '—'}</TD>
                <TD>
                  {r.commissionPaid ? (
                    <span className="font-semibold text-green-700">{fmtLakh(r.commissionPaid)}</span>
                  ) : '—'}
                </TD>
                <TD>
                  <Badge variant={getStatusBadgeVariant(r.status)}>{r.status}</Badge>
                </TD>
                <TD onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                  {r.status !== 'Commission Paid' && (
                    <button
                      onClick={() => advanceStatus(r)}
                      className="px-2 py-1 bg-[#0F6E56]/10 text-[#0F6E56] rounded text-xs font-medium hover:bg-[#0F6E56]/20 transition-colors whitespace-nowrap"
                    >
                      Advance →
                    </button>
                  )}
                  {r.status === 'Commission Paid' && (
                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle size={12} /> Paid
                    </span>
                  )}
                </TD>
              </TR>
            ))}
            {enrichedReferrals.length === 0 && (
              <TR>
                <TD className="text-center text-gray-400 py-8" colSpan={9}>
                  No referrals logged yet. Click "Log Referral" to get started.
                </TD>
              </TR>
            )}
          </TBody>
        </Table>
      </Card>

      {/* Manufacturer panel */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-gray-900">Manufacturer Panel</h2>
        </CardHeader>
        <Table>
          <THead>
            <TR>
              <TH>Manufacturer</TH>
              <TH>City</TH>
              <TH>Comm. Rate</TH>
              <TH>Speciality</TH>
              <TH>Referrals Sent</TH>
              <TH>Commissions Earned</TH>
              <TH>Contact</TH>
            </TR>
          </THead>
          <TBody>
            {manufacturers.filter(m => m.active).map(m => {
              const mReferrals = referrals.filter(r => r.manufacturerId === m.id);
              const earned = mReferrals.reduce((s, r) => s + (r.commissionPaid || 0), 0);
              return (
                <TR key={m.id}>
                  <TD>
                    <div className="font-medium text-gray-900">{m.name}</div>
                    {m.website && <div className="text-xs text-blue-600">{m.website}</div>}
                  </TD>
                  <TD className="text-sm">{m.city}</TD>
                  <TD><span className="font-semibold text-[#0F6E56]">{m.commissionRatePct}%</span></TD>
                  <TD>
                    <p className="text-xs text-gray-600 max-w-xs">{m.speciality}</p>
                  </TD>
                  <TD className="text-center font-semibold">{mReferrals.length}</TD>
                  <TD className="font-semibold text-green-700">{fmtLakh(earned)}</TD>
                  <TD>
                    <div className="text-sm text-gray-700">{m.contactName}</div>
                    {m.contactPhone && (
                      <a href={`tel:${m.contactPhone}`} className="text-xs text-blue-600">{m.contactPhone}</a>
                    )}
                  </TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={showModal}
        onClose={() => setShowModal(false)}
        title={editReferral ? 'Edit Referral' : 'Log New Referral'}
        size="lg"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Select
              label="Building *"
              options={buildings.map(b => ({ value: b.id, label: b.name }))}
              placeholder="Select building"
              value={form.fromBuildingId}
              onChange={e => setForm({ ...form, fromBuildingId: e.target.value })}
            />
          </div>
          <Input
            label="Referred Contact Name"
            value={form.referredName}
            onChange={e => setForm({ ...form, referredName: e.target.value })}
            placeholder="Name of person / organisation referred"
          />
          <Input
            label="Contact Phone"
            value={form.referredContact}
            onChange={e => setForm({ ...form, referredContact: e.target.value })}
            placeholder="+91-98XXXXXXXX"
          />
          <Select
            label="Manufacturer"
            options={manufacturers.filter(m => m.active).map(m => ({ value: m.id, label: `${m.name} (${m.commissionRatePct}%)` }))}
            placeholder="Select manufacturer"
            value={form.manufacturerId}
            onChange={e => {
              const mfr = manufacturers.find(m => m.id === e.target.value);
              setForm({ ...form, manufacturerId: e.target.value, commissionPct: mfr?.commissionRatePct.toString() || '12' });
            }}
          />
          <Input
            label="Referral Date"
            type="date"
            value={form.referredDate}
            onChange={e => setForm({ ...form, referredDate: e.target.value })}
          />
          <Input
            label="Installation Value (₹)"
            type="number"
            value={form.installationValue}
            onChange={e => setForm({ ...form, installationValue: e.target.value })}
            placeholder="e.g. 1500000"
          />
          <div>
            <Input
              label="Commission % (auto-filled from manufacturer)"
              type="number"
              value={form.commissionPct}
              onChange={e => setForm({ ...form, commissionPct: e.target.value })}
            />
            {form.installationValue && form.commissionPct && (
              <p className="text-xs text-[#0F6E56] font-semibold mt-1">
                Expected commission: {fmtCurrency((parseFloat(form.installationValue) * parseFloat(form.commissionPct)) / 100)}
              </p>
            )}
          </div>
          <div className="sm:col-span-2">
            <TextArea
              label="Notes"
              value={form.notes}
              onChange={e => setForm({ ...form, notes: e.target.value })}
              placeholder="Context, background, what was agreed..."
            />
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button onClick={handleSubmit} className="flex-1">
            {editReferral ? 'Update Referral' : 'Log Referral'}
          </Button>
          <Button variant="ghost" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
        </div>
      </Modal>
    </div>
  );
}
