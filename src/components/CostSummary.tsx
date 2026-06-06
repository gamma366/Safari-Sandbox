import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Users, Plus, Minus, UserCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DayPlan } from '../App';
import { calculateCostSummary } from '../lib/costCalculator';

interface CostSummaryProps {
  itinerary: DayPlan[];
  adults: number;
  setAdults: (val: number) => void;
  childrenCount: number;
  setChildren: (val: number) => void;
  roomType: string;
  setRoomType: (val: string) => void;
}

export function CostSummary({ itinerary, adults, setAdults, childrenCount: children, setChildren, roomType, setRoomType }: CostSummaryProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    overview: true,
    accommodation: true,
    transport: true,
  });

  const toggleSection = (id: string) => {
    setOpenSections(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const roomTypeMultipliers: Record<string, { label: string, multi: number }> = {
    'single': { label: 'Single Room (+30%)', multi: 1.3 },
    'double': { label: 'Double/Twin Room', multi: 1.0 },
    'triple': { label: 'Triple Room (-10% pp)', multi: 0.9 },
    'family': { label: 'Family Suite (+20% pp)', multi: 1.2 }
  };

  const {
    subtotal,
    taxesTotal,
    grandTotal,
    formattedAccList,
    formattedTransList,
    formattedParkList,
    formattedFlightList,
    formattedActList,
    totalGuests,
    days,
    requiredVehicles,
    vatEst,
    TAXES_VAT_PERCENT,
    TAXES_SERVICE_FEE,
    TAXES_CONSERVATION_LEVY
  } = useMemo(() => calculateCostSummary(itinerary, adults, children, roomType), [itinerary, adults, children, roomType]);

  const accTotal = formattedAccList.reduce((acc: any, curr: any) => acc + curr.total, 0);
  const transTotal = formattedTransList.reduce((acc: any, curr: any) => acc + curr.total, 0);
  const parkTotal = formattedParkList.reduce((acc: any, curr: any) => acc + curr.total, 0);
  const flightTotal = formattedFlightList.reduce((acc: any, curr: any) => acc + curr.total, 0);
  const actTotal = formattedActList.reduce((acc: any, curr: any) => acc + curr.total, 0);

  const parksVisited = useMemo(() => {
    const parks = new Set<string>();
    itinerary.forEach(day => {
      if (day.to.toLowerCase().includes('tarangire')) parks.add('Tarangire');
      if (day.to.toLowerCase().includes('manyara')) parks.add('Lake Manyara');
      if (day.to.toLowerCase().includes('ngorongoro') || day.to.toLowerCase().includes('karatu')) parks.add('Ngorongoro');
      if (day.to.toLowerCase().includes('serengeti') || day.to.toLowerCase().includes('ndutu') || day.to.toLowerCase().includes('kogatende')) parks.add('Serengeti');
    });
    return Array.from(parks).join(', ') || "Various Parks";
  }, [itinerary]);

  const childParkDiscount = 0.3; // Children usually 30% of adult park fee
  const childAccDiscount = 0.5; // Children usually 50% for beds

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };


  const Section = ({ id, title, total, children }: { id: string, title: string, total?: string, children: React.ReactNode }) => (
    <div className="bg-white border-b border-safari-accent/20 overflow-hidden mb-0">
      <div 
        className="px-2 py-6 cursor-pointer flex justify-between items-center bg-white hover:bg-safari-bg/30 select-none transition-colors"
        onClick={() => toggleSection(id)}
      >
        <h2 className="text-2xl md:text-3xl font-serif text-safari-text tracking-wider">{title}</h2>
        <div className="flex items-center gap-6">
          {total && <span className="font-serif font-bold text-2xl md:text-3xl text-safari-accent">{total}</span>}
          {openSections[id] ? <ChevronUp className="w-5 h-5 text-safari-accent/60" /> : <ChevronDown className="w-5 h-5 text-safari-accent/60" />}
        </div>
      </div>
      {openSections[id] && (
        <div className="px-2 pb-8 pt-2 animate-in fade-in slide-in-from-top-4 duration-300">
          {children}
        </div>
      )}
    </div>
  );

  const TableRow: React.FC<{ label: string, desc: React.ReactNode, cost: string }> = ({ label, desc, cost }) => (
    <div className="flex justify-between py-4 border-b border-dashed border-safari-accent/20 last:border-0">
      <div>
        <div className="font-medium text-lg text-safari-text tracking-wide">{label}</div>
        <div className="text-base text-safari-muted leading-relaxed mt-1 max-w-lg">{desc}</div>
      </div>
      <div className="font-semibold text-lg text-safari-text text-right">{cost}</div>
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Section id="overview" title="1. Group & Room Configuration">
         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-safari-bg/30 p-4 rounded-xl border border-safari-accent/10">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-safari-muted text-xs uppercase tracking-wider font-bold flex items-center gap-2"><Users className="w-4 h-4 text-safari-accent" /> Adults</p>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-safari-accent">{adults}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-10 h-10 rounded-full bg-white border border-safari-accent/20 flex items-center justify-center text-safari-text hover:bg-safari-accent hover:text-white transition-colors">
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center text-sm font-medium text-safari-muted">Age 16+</div>
                    <button onClick={() => setAdults(adults + 1)} className="w-10 h-10 rounded-full bg-white border border-safari-accent/20 flex items-center justify-center text-safari-text hover:bg-safari-accent hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="bg-safari-bg/30 p-4 rounded-xl border border-safari-accent/10">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-safari-muted text-xs uppercase tracking-wider font-bold flex items-center gap-2"><UserCheck className="w-4 h-4 text-safari-accent" /> Children</p>
                    <span className="font-mono bg-white px-2 py-0.5 rounded text-safari-accent">{children}</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-10 h-10 rounded-full bg-white border border-safari-accent/20 flex items-center justify-center text-safari-text hover:bg-safari-accent hover:text-white transition-colors">
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="flex-1 text-center text-sm font-medium text-safari-muted">Age 3-15</div>
                    <button onClick={() => setChildren(children + 1)} className="w-10 h-10 rounded-full bg-white border border-safari-accent/20 flex items-center justify-center text-safari-text hover:bg-safari-accent hover:text-white transition-colors">
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
            </div>

            <div className="bg-safari-bg/30 p-4 rounded-xl border border-safari-accent/10">
                <div className="flex justify-between items-center mb-3">
                    <p className="text-safari-muted text-xs uppercase tracking-wider font-bold flex items-center gap-2">Room Type</p>
                </div>
                <select 
                    value={roomType}
                    onChange={(e) => setRoomType(e.target.value)}
                    className="w-full h-10 bg-white border border-safari-accent/20 rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-safari-accent/30 text-safari-text cursor-pointer"
                >
                    {Object.entries(roomTypeMultipliers).map(([key, info]) => (
                        <option key={key} value={key}>{info.label}</option>
                    ))}
                </select>
                <div className="mt-2 text-[10px] text-center text-safari-muted italic">Pricing adjusts dynamically</div>
            </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-safari-accent/10">
            <div>
                <p className="text-safari-muted text-xs uppercase tracking-wider mb-1 font-bold">Total Group</p>
                <p className="font-semibold text-lg text-safari-text">{totalGuests} Guests</p>
            </div>
            <div>
                <p className="text-safari-muted text-xs uppercase tracking-wider mb-1 font-bold">Duration</p>
                <p className="font-semibold text-lg text-safari-text">{days} Days</p>
            </div>
            <div>
                <p className="text-safari-muted text-xs uppercase tracking-wider mb-1 font-bold">Style</p>
                <p className="font-semibold text-lg text-safari-text">Luxury Safari</p>
            </div>
            <div>
                <p className="text-safari-muted text-xs uppercase tracking-wider mb-1 font-bold">Parks Included</p>
                <p className="font-semibold text-base leading-tight text-safari-text">{parksVisited}</p>
            </div>
        </div>
      </Section>

      <Section id="accommodation" title="2. Accommodation Costs" total={formatMoney(accTotal)}>
        {formattedAccList.map((item, i) => (
          <TableRow 
            key={i} 
            label={item.name} 
            desc={`${item.nights} Nights @ ${formatMoney(item.pricePerNight)} / night per guest`} 
            cost={formatMoney(item.total)} 
          />
        ))}
      </Section>

      <Section id="transport" title="3. Transport Costs" total={formatMoney(transTotal)}>
        {formattedTransList.map((item, i) => (
          <div key={i} className="mb-4 last:mb-0">
            <TableRow 
              label={`${item.vehicles}x ${item.vehicle}`} 
              desc={`${item.vehicles} Vehicle(s) for ${item.days} Days @ ${formatMoney(item.pricePerDay)} / day / vehicle`} 
              cost={formatMoney(item.total)} 
            />
            {item.vehicles > 1 && (
                <div className="bg-amber-50 text-amber-800 text-xs px-4 py-3 rounded-xl ml-4 mt-2 flex items-start gap-2 border border-amber-100">
                   <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
                   <p>Groups larger than 7 people require an additional safari vehicle ({item.vehicles} vehicles total) to ensure everyone has a guaranteed window seat and comfortable viewing space.</p>
                </div>
            )}
          </div>
        ))}
      </Section>

      <Section id="parkfees" title="4. Park & Concession Fees" total={formatMoney(parkTotal)}>
        {formattedParkList.map((item, i) => {
          return (
            <TableRow 
              key={i} 
              label={item.park} 
              desc={
                <div className="flex flex-col gap-3 mt-2 text-sm leading-relaxed text-safari-muted">
                  {item.feePerPerson > 0 && item.days > 0 && (
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold text-safari-text">Park Fee ({item.days} days @ {formatMoney(item.feePerPerson)}/day)</span>
                        {adults > 0 && <span className="pl-2">- Adults: {adults} x {formatMoney(item.feePerPerson)} = {formatMoney(item.adultEntryTotal)}</span>}
                        {children > 0 && <span className="pl-2">- Children: {children} x {formatMoney(item.feePerPerson * childParkDiscount)} = {formatMoney(item.childEntryTotal)}</span>}
                     </div>
                  )}
                  {item.concessionPerPerson > 0 && item.days > 0 && (
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold text-safari-text">Concession Fee ({item.days} days @ {formatMoney(item.concessionPerPerson)}/day)</span>
                        {adults > 0 && <span className="pl-2">- Adults: {adults} x {formatMoney(item.concessionPerPerson)} = {formatMoney(item.adultConcessionTotal)}</span>}
                        {children > 0 && <span className="pl-2">- Children: {children} x {formatMoney(item.concessionPerPerson * childParkDiscount)} = {formatMoney(item.childConcessionTotal)}</span>}
                     </div>
                  )}
                  {item.transitDays > 0 && item.transitFeePerPerson > 0 && (
                     <div className="flex flex-col gap-1">
                        <span className="font-semibold text-safari-text">Transit Fee ({item.transitDays} transits @ {formatMoney(item.transitFeePerPerson)}/transit)</span>
                        {adults > 0 && <span className="pl-2">- Adults: {adults} x {formatMoney(item.transitFeePerPerson)} = {formatMoney(item.adultTransitTotal)}</span>}
                        {children > 0 && <span className="pl-2">- Children: {children} x {formatMoney(item.transitFeePerPerson * childParkDiscount)} = {formatMoney(item.childTransitTotal)}</span>}
                     </div>
                  )}
                </div>
              } 
              cost={formatMoney(item.total)} 
            />
          );
        })}
        {formattedParkList.length === 0 && (
            <p className="text-safari-muted text-sm italic">No park fees identified in current selection.</p>
        )}
      </Section>

      {formattedFlightList.length > 0 && (
        <Section id="flights" title="5. Flight Costs" total={formatMoney(flightTotal)}>
          {formattedFlightList.map((item, i) => (
            <TableRow 
              key={i} 
              label={item.route} 
              desc={`${formatMoney(item.costPerPerson)} per person`} 
              cost={formatMoney(item.total)} 
            />
          ))}
        </Section>
      )}

      {formattedActList.length > 0 && (
          <Section id="activities" title="6. Optional Activities" total={formatMoney(actTotal)}>
            {formattedActList.map((item, i) => (
              <TableRow 
                key={i} 
                label={item.name} 
                desc={item.desc || `${formatMoney(item.costPerPerson)} per person`} 
                cost={formatMoney(item.total)} 
              />
            ))}
          </Section>
      )}

      <Section id="taxes" title="7. Taxes & Fees" total={formatMoney(taxesTotal)}>
        <TableRow 
          label={`Government VAT (${TAXES_VAT_PERCENT}%)`} 
          desc="Value added tax on applicable services" 
          cost={formatMoney(vatEst)} 
        />
        <TableRow 
          label="TDT Conservation Levy" 
          desc="Mandatory tourism development fee" 
          cost={formatMoney(TAXES_CONSERVATION_LEVY)} 
        />
        <TableRow 
          label="Handling & Administration" 
          desc="Processing fees" 
          cost={formatMoney(TAXES_SERVICE_FEE)} 
        />
      </Section>

      {/* Grand Total */}
      <div className="mt-10 bg-safari-text text-white rounded-none p-10 border border-safari-accent/30 shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 mix-blend-overlay"></div>
          
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-end gap-6">
              <div className="w-full md:w-auto text-left">
                  <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-safari-accent mb-2">Final Quotation</h2>
                  <p className="font-serif text-4xl md:text-5xl lg:text-[56px] tracking-widest text-[#FCFBFA] leading-tight">Total Estimated <br/> Investment</p>
                  <p className="text-white/50 text-xs mt-6 uppercase tracking-widest max-w-sm leading-relaxed">Excludes international flights, visas, and premium beverages.</p>
              </div>
              <div className="text-right w-full md:w-auto md:min-w-[300px]">
                  <div className="flex justify-between md:justify-end md:gap-16 mb-4 text-[#FCFBFA]/60 text-sm uppercase tracking-widest font-semibold">
                      <span>Subtotal</span>
                      <span className="font-serif text-white text-lg tracking-wider">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between md:justify-end md:gap-16 mb-8 text-[#FCFBFA]/60 text-sm uppercase tracking-widest font-semibold">
                      <span>Taxes & Fees</span>
                      <span className="font-serif text-white text-lg tracking-wider">{formatMoney(taxesTotal)}</span>
                  </div>
                  <div className="flex justify-between md:justify-end md:gap-16 pt-8 border-t border-safari-accent/30">
                      <span className="text-base font-bold uppercase tracking-[0.2em] text-[#FCFBFA] self-end pb-2">Grand Total</span>
                      <span className="text-5xl md:text-6xl font-serif text-safari-accent tracking-widest">{formatMoney(grandTotal)}</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
