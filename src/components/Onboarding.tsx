import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { Droplets, ArrowRight, CheckCircle2, Lock } from 'lucide-react';

const PHASE_CARDS = [
  {
    num: 1, title: 'Audit and Refer', timeline: 'Now → Month 18',
    active: true,
    summary: 'Visit buildings. Conduct free audits. Refer to manufacturers. Earn 10–15% commission per installation.',
    earn: '₹40K–₹1.5L per referral. Zero capital needed.',
    risk: 'Very low',
    color: 'border-[#567C45] bg-[#567C45]/5',
    badge: 'bg-[#567C45] text-white',
  },
  {
    num: 2, title: 'Own Installations', timeline: 'Month 12–24',
    active: false,
    summary: 'Use Phase 1 savings to buy and install your first system. Earn full margin + annual AMC fees.',
    earn: 'Full install margin + ₹15K–50K AMC/year per system.',
    risk: 'Moderate',
    color: 'border-[#E2D5BE] bg-[#F6F1EA]',
    badge: 'bg-[#DDD0BC] text-[#8C8062]',
  },
  {
    num: 3, title: 'Water-as-a-Service', timeline: 'Month 24+',
    active: false,
    summary: 'Install at zero cost to customer. They pay monthly. You own the system for 5–10 years.',
    earn: '₹1.5–3L per system per year, recurring.',
    risk: 'Low with proof',
    color: 'border-[#E2D5BE] bg-[#F6F1EA]',
    badge: 'bg-[#DDD0BC] text-[#8C8062]',
  },
];

const FIRST_TASKS = [
  { id: 'scripts', label: 'Read the Cold Approach phone script', link: '/scripts' },
  { id: 'buildings', label: 'Identify 3 buildings to visit near Model Town', link: '/crm' },
  { id: 'crm', label: 'Add your first building after the visit', link: '/crm' },
];

export default function Onboarding() {
  const { state, updateSettings } = useStore();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const [profile, setProfile] = useState({
    name: state.settings.consultantName || '',
    phone: state.settings.consultantPhone || '',
    mapboxToken: state.settings.mapboxToken || '',
  });

  function complete() {
    updateSettings({
      consultantName: profile.name,
      consultantPhone: profile.phone,
      mapboxToken: profile.mapboxToken,
      onboardingComplete: true,
    });
    navigate('/');
  }

  function toggleCheck(id: string) {
    setChecked(c => ({ ...c, [id]: !c[id] }));
  }

  const steps = [
    // Step 0 — Welcome
    <div key="welcome" className="flex flex-col items-center text-center max-w-lg mx-auto py-8 px-4">
      <div className="w-20 h-20 bg-[#567C45] rounded-3xl flex items-center justify-center mb-6 shadow-lg">
        <Droplets size={40} className="text-white" />
      </div>
      <h1 className="text-3xl font-bold text-[#2C2820] mb-3">Welcome to JalDhara</h1>
      <p className="text-[#5C5244] text-base leading-relaxed mb-8">
        This is your personal water conservation business platform. It will guide you through every step — from your first building visit in Model Town to building a city-wide water recycling business across India.
      </p>
      <p className="text-[#8C8062] text-sm mb-8">Let us start by understanding what this app does.</p>
      <button
        onClick={() => setStep(1)}
        className="flex items-center gap-2 bg-[#567C45] text-white px-8 py-3.5 rounded-2xl font-semibold text-base hover:bg-[#436036] transition-colors shadow-sm"
      >
        Let's begin <ArrowRight size={18} />
      </button>
    </div>,

    // Step 1 — Three phases
    <div key="phases" className="max-w-3xl mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <p className="text-xs font-bold text-[#567C45] uppercase tracking-widest mb-2">Step 1 of 3</p>
        <h2 className="text-2xl font-bold text-[#2C2820]">Your business has three phases</h2>
        <p className="text-[#8C8062] text-sm mt-2">You start Phase 1 today. Phases 2 and 3 unlock as you grow.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 mb-8">
        {PHASE_CARDS.map(p => (
          <div key={p.num} className={`rounded-2xl border-2 p-5 ${p.color} ${!p.active ? 'opacity-60' : ''}`}>
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="text-xs text-[#8C8062] font-semibold mb-0.5">{p.timeline}</div>
                <h3 className="font-bold text-[#2C2820] text-lg">Phase {p.num} — {p.title}</h3>
              </div>
              <div className="flex flex-col items-end gap-1">
                {p.active
                  ? <span className="text-xs bg-[#567C45] text-white px-3 py-1 rounded-full font-semibold">You are here</span>
                  : <span className="text-xs bg-[#DDD0BC] text-[#8C8062] px-3 py-1 rounded-full font-semibold flex items-center gap-1"><Lock size={10} /> Locked</span>
                }
              </div>
            </div>
            <p className="text-sm text-[#463F2E] leading-relaxed mb-3">{p.summary}</p>
            <div className="flex gap-4 text-xs text-[#5C5244]">
              <span><strong>Earnings:</strong> {p.earn}</span>
              <span><strong>Risk:</strong> {p.risk}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-center">
        <button
          onClick={() => setStep(2)}
          className="flex items-center gap-2 bg-[#567C45] text-white px-8 py-3.5 rounded-2xl font-semibold text-base hover:bg-[#436036] transition-colors"
        >
          Got it <ArrowRight size={18} />
        </button>
      </div>
    </div>,

    // Step 2 — First task
    <div key="tasks" className="max-w-lg mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <p className="text-xs font-bold text-[#567C45] uppercase tracking-widest mb-2">Step 2 of 3</p>
        <h2 className="text-2xl font-bold text-[#2C2820]">Your first task this week</h2>
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-6">
        <p className="text-gray-800 text-sm leading-relaxed">
          Visit <strong>3 buildings near Model Town</strong> — a hospital, a school, or a banquet hall.
          You are <strong>not selling anything</strong>. You are listening and learning.
          Use the Scripts section to know what to say. Use the CRM to record what you find.
        </p>
      </div>
      <div className="space-y-3 mb-8">
        <p className="text-xs font-semibold text-[#8C8062] uppercase tracking-wide">Checklist</p>
        {FIRST_TASKS.map(task => (
          <button
            key={task.id}
            onClick={() => toggleCheck(task.id)}
            className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
              checked[task.id]
                ? 'border-[#567C45] bg-[#567C45]/5 text-[#567C45]'
                : 'border-[#E2D5BE] bg-white text-[#463F2E] hover:border-gray-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
              checked[task.id] ? 'border-[#567C45] bg-[#567C45]' : 'border-gray-300'
            }`}>
              {checked[task.id] && <CheckCircle2 size={12} className="text-white" />}
            </div>
            <span className={`text-sm font-medium ${checked[task.id] ? 'line-through opacity-60' : ''}`}>{task.label}</span>
          </button>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <button
          onClick={() => { updateSettings({ onboardingComplete: true }); navigate('/scripts'); }}
          className="flex items-center justify-center gap-2 bg-[#567C45] text-white px-8 py-3.5 rounded-2xl font-semibold hover:bg-[#436036] transition-colors"
        >
          Take me to Scripts <ArrowRight size={18} />
        </button>
        <button onClick={() => setStep(3)} className="text-sm text-[#ADA082] hover:text-[#5C5244] py-2 transition-colors">
          Skip for now →
        </button>
      </div>
    </div>,

    // Step 3 — Setup profile
    <div key="profile" className="max-w-lg mx-auto py-8 px-4">
      <div className="text-center mb-8">
        <p className="text-xs font-bold text-[#567C45] uppercase tracking-widest mb-2">Step 3 of 3</p>
        <h2 className="text-2xl font-bold text-[#2C2820]">Quick setup</h2>
        <p className="text-[#8C8062] text-sm mt-2">2 minutes. You can change these anytime in Settings.</p>
      </div>
      <div className="space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-[#463F2E] mb-1">Your full name</label>
          <input
            type="text"
            className="w-full border border-[#E2D5BE] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#567C45]/20"
            value={profile.name}
            onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
            placeholder="e.g. Priya Sharma"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#463F2E] mb-1">Your phone number</label>
          <input
            type="tel"
            className="w-full border border-[#E2D5BE] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#567C45]/20"
            value={profile.phone}
            onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
            placeholder="+91-98XXXXXXXX"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#463F2E] mb-1">
            Mapbox token <span className="text-[#ADA082] font-normal">(optional — for map view)</span>
          </label>
          <input
            type="text"
            className="w-full border border-[#E2D5BE] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#567C45]/20 font-mono"
            value={profile.mapboxToken}
            onChange={e => setProfile(p => ({ ...p, mapboxToken: e.target.value }))}
            placeholder="pk.eyJ1IjoiY..."
          />
          <p className="text-xs text-[#ADA082] mt-1.5">
            Sign up free at{' '}
            <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-[#567C45] underline">
              mapbox.com
            </a>
            {' '}→ Account → Create a token → paste here.
          </p>
        </div>
      </div>
      <button
        onClick={complete}
        className="w-full flex items-center justify-center gap-2 bg-[#567C45] text-white px-8 py-4 rounded-2xl font-semibold text-base hover:bg-[#436036] transition-colors shadow-sm"
      >
        Save and enter JalDhara <ArrowRight size={18} />
      </button>
    </div>,
  ];

  return (
    <div className="min-h-screen bg-[#F4F3F0] flex flex-col">
      {/* Progress bar */}
      <div className="w-full h-1 bg-[#EDE4D4]">
        <div
          className="h-1 bg-[#567C45] transition-all duration-500"
          style={{ width: `${((step + 1) / steps.length) * 100}%` }}
        />
      </div>

      {/* Step dots */}
      {step > 0 && (
        <div className="flex justify-center gap-2 pt-6">
          {[0, 1, 2, 3].filter(s => s > 0).map(s => (
            <div
              key={s}
              className={`w-2 h-2 rounded-full transition-all ${s === step ? 'bg-[#567C45] w-4' : s < step ? 'bg-[#567C45]/40' : 'bg-[#DDD0BC]'}`}
            />
          ))}
        </div>
      )}

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {steps[step]}
      </div>

      {/* Back link */}
      {step > 0 && (
        <div className="text-center pb-6">
          <button onClick={() => setStep(s => s - 1)} className="text-xs text-[#ADA082] hover:text-[#5C5244] transition-colors">
            ← Back
          </button>
        </div>
      )}
    </div>
  );
}
