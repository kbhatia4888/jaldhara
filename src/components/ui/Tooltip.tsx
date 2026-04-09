import React, { useState, useRef, useEffect } from 'react';

// Tooltip content library — plain English explanations
export const TOOLTIPS: Record<string, string> = {
  KLD: '1 KLD = 1,000 litres per day. A medium hospital might use 50 KLD. A school might use 10 KLD.',
  KL: '1 KL = 1,000 litres = roughly 5 large water drums (200L each). Delhi Jal Board charges per KL used.',
  Greywater: 'Wastewater from sinks, showers, washing machines, and baths — but NOT from toilets. Greywater is much easier and cheaper to treat than sewage. It makes up 60–80% of all water used in a building.',
  Blackwater: 'Wastewater from toilets and urinals. Contains sewage. Needs full sewage treatment. JalDhara does not deal with blackwater.',
  'Greywater recycling': 'Collecting greywater, treating it (filtering + disinfecting), and reusing it for flushing toilets, watering gardens, and cleaning floors — instead of sending it to the drain.',
  'DJB Rebate': 'Delhi Jal Board gives a 10% reduction on your total water bill every year if your building has a working greywater recycling system. It becomes 15% if you also have rainwater harvesting. This applies to all buildings 500 sq metres or larger. It is permanent — not a one-time benefit.',
  WaaS: 'JalDhara installs the greywater system at zero upfront cost to the building. The building pays a monthly fee or a rate per kilolitre of water recycled. JalDhara owns and maintains the system. Similar to how solar companies offer rooftop solar at no cost and charge for the electricity generated.',
  AMC: 'A yearly service agreement. JalDhara visits the installed system, cleans filters, checks the UV unit, tests water quality, and replaces any worn parts. The building pays an annual fee for this. Typical AMC fee: ₹15,000–50,000 per year depending on system size.',
  'Payback period': 'How many months it takes for the money saved on water bills to equal the upfront installation cost. Example: system costs ₹5 lakh, saves ₹20,000 per month → payback = 25 months. After payback, all savings are pure benefit.',
  MRR: 'Total money you receive every month from WaaS contracts and AMC fees. Predictable, repeating income. Example: 5 WaaS customers paying ₹25,000/month each = ₹1,25,000 MRR.',
  ARR: 'Your MRR × 12. Shows the yearly value of your recurring contracts.',
  NRW: 'Water that is produced and distributed but never billed — because it leaks, is stolen, or is unmeasured. Delhi loses over 40% of its distributed water this way.',
  OHT: 'The large water storage tank on the roof of a building. When it overflows at night (common in Delhi), thousands of litres are wasted silently. An overflow sensor costs ₹6,000–10,000 and stops this instantly.',
  STP: 'A system that treats sewage (blackwater) on-site before discharging it. Many large buildings in Delhi have one installed by law but leave it non-operational. A working STP can provide treated water for gardening and flushing.',
  'Tanker dependency': 'How much a building relies on private water tankers instead of municipal (DJB) supply. High tanker dependency = high operating cost = strong motivation to install a recycling system.',
  'Municipal supply': 'Water provided by the Delhi Jal Board through pipes. In most parts of Delhi, this is available for only 4–8 hours per day and pressure is low. This is why buildings depend on overhead tanks and tankers.',
  'UF Membrane': 'A filter with extremely tiny pores (0.01–0.08 microns) that removes 99.9% of bacteria, viruses, and particles from greywater. It is the core treatment component in most greywater recycling systems.',
  'UV Disinfection': 'Ultraviolet light kills any remaining bacteria in the treated water before it is reused. It is chemical-free and requires no consumables except an annual lamp replacement (₹2,000–5,000).',
  'Skid-mounted': 'A greywater treatment system where all components are pre-assembled on a steel frame (skid) at the factory and delivered ready to connect. Faster to install, easier to maintain.',
  'Conversion rate': 'Percentage of buildings you visited that became paying customers (referred installation or WaaS). Example: visited 20 buildings, 4 converted = 20% conversion rate.',
  Pipeline: 'All the prospects (buildings) at various stages of your sales process — from Cold (just visited) to Hot (very interested) to Referred to WaaS. Tracking the pipeline shows where buildings are in the journey.',
  Capex: 'The upfront one-time cost to buy and install a greywater system. Example: ₹6 lakh for a 20 KLD system. In WaaS, JalDhara pays this — not the customer.',
  Opex: 'Ongoing monthly or annual costs to run the system — electricity, filter replacements, AMC. Typically ₹8,000–20,000 per year for a medium system.',
  'Referral commission': 'When JalDhara recommends a manufacturer to a customer and the customer buys a system, the manufacturer pays JalDhara 10–15% of the total installation value as a thank-you fee.',
  'Expansion stage': 'Where JalDhara is in developing a new city: Not Started (no activity yet) → Researching (studying the market) → First Visits (visiting buildings) → First Revenue (first commission earned) → Scaling (multiple conversions, growing fast).',
  'Water stress level': 'How severely a state or city is affected by water shortage: Low (adequate supply), Medium (seasonal shortage), High (frequent shortage, many areas tanker-dependent), Critical (severe year-round shortage, groundwater being over-extracted).',
  'Greywater potential': 'Estimated litres of greywater this building generates every day that could be recycled. Calculated from building type and occupancy. Example: a 100-bed hospital generates 15,000 L/day of greywater.',
  ESG: 'A framework used by banks, investors, and large companies to measure their environmental and social impact. ESG lenders and investors pay for verified data showing water savings — which is why JalDhara\'s audit database becomes valuable at scale.',
  'Impact certificate': 'A monthly document JalDhara generates for WaaS customers showing exactly how many litres they recycled, how many tankers they saved, and how much CO2 they avoided. This is their sustainability proof — useful for ESG reporting and green building certifications.',
  IGBC: 'India\'s green building certification body. Buildings with greywater recycling systems earn IGBC points, which can help them achieve green ratings — increasing property value and attracting ESG-conscious tenants.',
  TDS: 'Total Dissolved Solids — a measure of minerals and salts in water. Measured in ppm (parts per million). Above 500 ppm: needs treatment before drinking. Above 1,000 ppm: may cause scaling in pipes. Delhi groundwater is often 800–1,500 ppm.',
  RWH: 'Rainwater Harvesting — collecting and storing rainwater from rooftops for later use. DJB gives an additional 5% rebate (on top of the 10% greywater rebate) for buildings that also have RWH.',
  DJB: 'Delhi Jal Board — the government body that supplies piped water to Delhi\'s buildings and collects sewage. They also administer the 10% water bill rebate for greywater recycling systems.',
};

interface TooltipProps {
  term: keyof typeof TOOLTIPS | string;
  children?: React.ReactNode;
  content?: string;
  className?: string;
}

export function Tooltip({ term, children, content, className = '' }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState<'above' | 'below'>('above');
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tooltipText = content || TOOLTIPS[term] || '';

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  function handleShow() {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    // Determine position
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setPosition(rect.top > 200 ? 'above' : 'below');
    }
    setVisible(true);
  }

  function handleHide() {
    timeoutRef.current = setTimeout(() => setVisible(false), 150);
  }

  function handleToggle() {
    if (visible) {
      setVisible(false);
    } else {
      handleShow();
    }
  }

  if (!tooltipText) return <>{children}</>;

  return (
    <span className={`relative inline-flex items-center gap-1 ${className}`}>
      {children}
      <span
        ref={triggerRef}
        className="inline-flex items-center cursor-help select-none"
        onMouseEnter={handleShow}
        onMouseLeave={handleHide}
        onClick={handleToggle}
        aria-label={`What is ${term}?`}
        role="button"
        tabIndex={0}
        onKeyDown={e => e.key === 'Enter' && handleToggle()}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="text-gray-400 hover:text-[#0F6E56] transition-colors flex-shrink-0"
        >
          <circle cx="7" cy="7" r="6.5" stroke="currentColor" strokeWidth="1"/>
          <text x="7" y="10.5" textAnchor="middle" fontSize="8" fill="currentColor" fontWeight="600">i</text>
        </svg>
      </span>
      {visible && (
        <div
          ref={tooltipRef}
          onMouseEnter={handleShow}
          onMouseLeave={handleHide}
          className={`absolute z-50 w-72 bg-gray-900 text-white text-xs rounded-xl shadow-xl p-3 leading-relaxed pointer-events-auto
            ${position === 'above' ? 'bottom-full mb-2' : 'top-full mt-2'}
            left-1/2 -translate-x-1/2
          `}
          style={{ maxWidth: '280px' }}
        >
          <div className="font-semibold text-[#6ECBB0] mb-1">{term}</div>
          <div className="text-gray-200">{tooltipText}</div>
          {/* Arrow */}
          <div className={`absolute left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45
            ${position === 'above' ? 'top-full -mt-1' : 'bottom-full -mb-1'}
          `} />
        </div>
      )}
    </span>
  );
}

// Convenience component: label + ⓘ in a single line
export function LabelWithTooltip({ label, term, content, className = '' }: { label: string; term?: string; content?: string; className?: string }) {
  return (
    <Tooltip term={term || label} content={content} className={className}>
      <span>{label}</span>
    </Tooltip>
  );
}
