import React, { useState, useEffect, useMemo } from 'react';
import { ChevronDown, ChevronUp, Users, Plus, Minus, UserCheck, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DayPlan, SAFARI_DATABASE } from '../App';

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

  const totalGuests = adults + children;
  const days = itinerary.length;
  const requiredVehicles = Math.ceil(totalGuests / 7) || 1;

  const roomTypeMultipliers: Record<string, { label: string, multi: number }> = {
    'single': { label: 'Single Room (+30%)', multi: 1.3 },
    'double': { label: 'Double/Twin Room', multi: 1.0 },
    'triple': { label: 'Triple Room (-10% pp)', multi: 0.9 },
    'family': { label: 'Family Suite (+20% pp)', multi: 1.2 }
  };

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

  const {
    accList,
    transList,
    parkList,
    flightList,
    actList
  } = useMemo(() => {
    const accommodationsMap = new Map<string, { nights: number; pricePerNight: number; name: string }>();
    const parkMap = new Map<string, { park: string; feePerPerson: number; concessionPerPerson: number; days: number; transitFeePerPerson?: number; transitDays?: number }>();
    const flights: any[] = [];
    const optionalActivities: any[] = [];
    let craterFeeTracker = false;
    let balloonTracker = false;
    let maasaiTracker = false;

    itinerary.forEach((day, index) => {
      // Accommodations
      const lodgeName = day.lodge?.name || 'Unknown Lodge';
      const dbLodge = SAFARI_DATABASE.lodges.find(l => l.name === lodgeName) as any;
      
      const pricePerNight = dbLodge ? (dbLodge.price_usd?.mid || 400) : 400; // Default price if unknown
      
      // We skip adding to accommodations if it's explicitly stated as returning/none
      if (lodgeName && !lodgeName.toLowerCase().includes("none") && !lodgeName.toLowerCase().includes("arusha")) {
        const existingName = accommodationsMap.get(lodgeName);
        if (existingName) {
          existingName.nights += 1;
        } else {
          accommodationsMap.set(lodgeName, { nights: 1, pricePerNight, name: lodgeName });
        }
      }

      // Park Fees
      if (dbLodge) {
         const park = SAFARI_DATABASE.parks.find(p => p.id === dbLodge.park_id) as any;
         if (park && park.name.toLowerCase() !== "karatu / highlands" && park.name.toLowerCase() !== "arusha town") {
             const entry = park.entry_fee_usd || 0;
             const concession = dbLodge.inside_park ? (entry > 60 ? 71 : 59) : 0; 

             if (parkMap.has(park.name)) {
               parkMap.get(park.name)!.days += 1;
             } else {
               parkMap.set(park.name, { park: park.name, feePerPerson: entry, concessionPerPerson: concession, days: 1, transitFeePerPerson: 0, transitDays: 0 });
             }
         }
      }

      // Special Activites & Fees
      const activitiesStr = (day.activities || []).join(' ').toLowerCase();

      // Crater Fee
      if (!craterFeeTracker && (activitiesStr.includes('crater') || day.to.toLowerCase().includes('crater'))) {
         craterFeeTracker = true;
         // Crater fee is $295 per vehicle.
         // Pass total guests effectively spreading the per-vehicle cost so total = 295 * requiredVehicles
         const exactTotalFee = 295 * requiredVehicles;
         const perPersonEquivalent = exactTotalFee / totalGuests;
         optionalActivities.push({ 
           name: "Ngorongoro Crater Service Fee", 
           costPerPerson: perPersonEquivalent, 
           desc: `Mandatory vehicle fee ($295 per vehicle)`,
           isFlatVehicleFee: true
         });
      }

      // Balloon Safari
      if (!balloonTracker && activitiesStr.includes('balloon')) {
         balloonTracker = true;
         optionalActivities.push({ name: "Hot Air Balloon Safari", costPerPerson: 599, desc: "Classic aerial safari & champagne breakfast" });
      }

      // Maasai Visit
      if (!maasaiTracker && (activitiesStr.includes('maasai') || activitiesStr.includes('masai'))) {
         maasaiTracker = true;
         optionalActivities.push({ name: "Maasai Village Cultural Visit", costPerPerson: 40, desc: "Community contribution & cultural tour" });
      }

      // Flights and Transit Fee
      const flyKeywords = ['flight', 'fly', 'airstrip'];
      const drivesStr = (day.drive_time || '').toLowerCase();
      const toStr = (day.to || '').toLowerCase();
      const fromStr = (day.from || '').toLowerCase();
      
      const isFlight = flyKeywords.some(k => drivesStr.includes(k) || activitiesStr.includes(k) || toStr.includes(k) || fromStr.includes(k));
      
      if (isFlight) {
         // Prevent duplicate flight for the same route
         const routeDesc = `${day.from} to ${day.to} Flight`;
         if (!flights.some(f => f.route === routeDesc)) {
            flights.push({ route: routeDesc, costPerPerson: 360 });
         }
      }

      // Ngorongoro Transit Fee
      if (!isFlight) {
          const isWestStr = (str: string) => str.includes('serengeti') || str.includes('kogatende');
          const isEastStr = (str: string) => str.includes('karatu') || str.includes('arusha') || str.includes('tarangire') || str.includes('manyara') || str.includes('mto wa mbu');
          
          let fromIsWest = isWestStr(fromStr);
          let fromIsEast = isEastStr(fromStr);
          let toIsWest = isWestStr(toStr);
          let toIsEast = isEastStr(toStr);

          // Fallback to check lodge location if 'to' is vague (like 'ngorongoro')
          if (dbLodge && !toIsWest && !toIsEast) {
              const lodgePark = SAFARI_DATABASE.parks.find(p => p.id === dbLodge.park_id);
              if (lodgePark) {
                  const pName = lodgePark.name.toLowerCase();
                  if (isWestStr(pName)) toIsWest = true;
                  if (isEastStr(pName)) toIsEast = true;
              }
              const lName = dbLodge.name.toLowerCase();
              if (isWestStr(lName)) toIsWest = true;
              if (isEastStr(lName)) toIsEast = true;
          }

          if ((fromIsEast && toIsWest) || (fromIsWest && toIsEast)) {
             const parkName = "Ngorongoro Conservation Area";
             if (parkMap.has(parkName)) {
                 parkMap.get(parkName)!.transitDays = (parkMap.get(parkName)!.transitDays || 0) + 1;
                 parkMap.get(parkName)!.transitFeePerPerson = 71; // Ensure fee is set
             } else {
                 parkMap.set(parkName, { park: parkName, feePerPerson: 0, concessionPerPerson: 0, transitFeePerPerson: 71, days: 0, transitDays: 1 });
             }
          }
      }
    });

    return {
      accList: Array.from(accommodationsMap.values()),
      transList: [{ vehicle: "Private 4x4 Extended Safari Land Cruiser", days: days, pricePerDay: 280 }],
      parkList: Array.from(parkMap.values()),
      flightList: flights,
      actList: optionalActivities
    };
  }, [itinerary, days, requiredVehicles, totalGuests]);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount);
  };

  let subtotal = 0;

  const roomMultiplier = roomTypeMultipliers[roomType].multi;
  const childAccDiscount = 0.5; // Children usually 50% for beds
  const childParkDiscount = 0.3; // Children usually 30% of adult park fee

  // Acc calculations
  const formattedAccList = accList.map(item => {
    const accCostPerNightAdult = item.pricePerNight * roomMultiplier;
    const accCostPerNightChild = item.pricePerNight * childAccDiscount;
    const total = item.nights * ((adults * accCostPerNightAdult) + (children * accCostPerNightChild));
    subtotal += total;
    return { ...item, total, perAdult: accCostPerNightAdult, perChild: accCostPerNightChild };
  });
  const accTotal = formattedAccList.reduce((acc, curr) => acc + curr.total, 0);

  // Trans calculations (Fixed price per vehicle per day, ignoring pax count unless > 7)
  const formattedTransList = transList.map(item => {
    const total = item.days * item.pricePerDay * requiredVehicles;
    subtotal += total;
    return { ...item, total, vehicles: requiredVehicles };
  });
  const transTotal = formattedTransList.reduce((acc, curr) => acc + curr.total, 0);

  // Park calculations
  const formattedParkList = parkList.map(item => {
    const adultEntryTotal = item.feePerPerson * adults * item.days;
    const childEntryTotal = (item.feePerPerson * childParkDiscount) * children * item.days;
    
    // Concession fees apply more loosely, assume same discount
    const adultConcessionTotal = item.concessionPerPerson * adults * item.days;
    const childConcessionTotal = (item.concessionPerPerson * childParkDiscount) * children * item.days;

    // Transit fees
    const transitFeePerPerson = item.transitFeePerPerson || 0;
    const transitDays = item.transitDays || 0;
    const adultTransitTotal = transitFeePerPerson * adults * transitDays;
    const childTransitTotal = (transitFeePerPerson * childParkDiscount) * children * transitDays;

    const total = adultEntryTotal + childEntryTotal + adultConcessionTotal + childConcessionTotal + adultTransitTotal + childTransitTotal;
    subtotal += total;
    return { 
      ...item, 
      total, 
      adultEntryTotal, 
      childEntryTotal, 
      adultConcessionTotal, 
      childConcessionTotal, 
      childTransitTotal, 
      adultTransitTotal 
    };
  });
  const parkTotal = formattedParkList.reduce((acc, curr) => acc + curr.total, 0);

  // Flights calculations
  const formattedFlightList = flightList.map(item => {
    // Children normally ~75% on flights, let's just use 80%
    const flightCostChild = item.costPerPerson * 0.8;
    const total = (item.costPerPerson * adults) + (flightCostChild * children);
    subtotal += total;
    return { ...item, total, flightCostChild };
  });
  const flightTotal = formattedFlightList.reduce((acc, curr) => acc + curr.total, 0);

  // Activities calculations
  const formattedActList = actList.map((item: any) => {
    let total;
    let actCostChild;
    if (item.isFlatVehicleFee) {
        total = item.costPerPerson * totalGuests; // costPerPerson contains the already distributed fee
        actCostChild = item.costPerPerson;
    } else {
        actCostChild = item.costPerPerson * 0.5; // generic 50%
        total = (item.costPerPerson * adults) + (actCostChild * children);
    }
    subtotal += total;
    return { ...item, total, actCostChild };
  });
  const actTotal = formattedActList.reduce((acc, curr) => acc + curr.total, 0);

  // Taxes calculations
  const TAXES_VAT_PERCENT = 18;
  const TAXES_SERVICE_FEE = 150;
  const TAXES_CONSERVATION_LEVY = 100;

  const vatEst = subtotal * (TAXES_VAT_PERCENT / 100);
  const taxesTotal = vatEst + TAXES_SERVICE_FEE + TAXES_CONSERVATION_LEVY;
  const grandTotal = subtotal + taxesTotal;

  const Section = ({ id, title, total, children }: { id: string, title: string, total?: string, children: React.ReactNode }) => (
    <div className="bg-white border-b border-safari-accent/20 overflow-hidden mb-0">
      <div 
        className="px-2 py-6 cursor-pointer flex justify-between items-center bg-white hover:bg-safari-bg/30 select-none transition-colors"
        onClick={() => toggleSection(id)}
      >
        <h2 className="text-xl md:text-2xl font-serif text-safari-text tracking-wide">{title}</h2>
        <div className="flex items-center gap-6">
          {total && <span className="font-serif font-bold text-xl md:text-2xl text-safari-accent">{total}</span>}
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
    <div className="flex justify-between py-3 border-b border-dashed border-safari-accent/20 last:border-0">
      <div>
        <div className="font-medium text-safari-text">{label}</div>
        <div className="text-sm text-safari-muted mt-0.5">{desc}</div>
      </div>
      <div className="font-semibold text-safari-text text-right">{cost}</div>
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
                <div className="flex flex-col gap-2 mt-2 font-mono text-xs">
                  {item.feePerPerson > 0 && item.days > 0 && (
                     <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-safari-text">Park Fee ({item.days} days @ {formatMoney(item.feePerPerson)}/day)</span>
                        {adults > 0 && <span className="pl-2 text-safari-muted/80">- Adults: {adults} x {formatMoney(item.feePerPerson)} = {formatMoney(item.adultEntryTotal)}</span>}
                        {children > 0 && <span className="pl-2 text-safari-muted/80">- Children: {children} x {formatMoney(item.feePerPerson * childParkDiscount)} = {formatMoney(item.childEntryTotal)}</span>}
                     </div>
                  )}
                  {item.concessionPerPerson > 0 && item.days > 0 && (
                     <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-safari-text">Concession Fee ({item.days} days @ {formatMoney(item.concessionPerPerson)}/day)</span>
                        {adults > 0 && <span className="pl-2 text-safari-muted/80">- Adults: {adults} x {formatMoney(item.concessionPerPerson)} = {formatMoney(item.adultConcessionTotal)}</span>}
                        {children > 0 && <span className="pl-2 text-safari-muted/80">- Children: {children} x {formatMoney(item.concessionPerPerson * childParkDiscount)} = {formatMoney(item.childConcessionTotal)}</span>}
                     </div>
                  )}
                  {item.transitDays > 0 && item.transitFeePerPerson > 0 && (
                     <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-safari-text">Transit Fee ({item.transitDays} transits @ {formatMoney(item.transitFeePerPerson)}/transit)</span>
                        {adults > 0 && <span className="pl-2 text-safari-muted/80">- Adults: {adults} x {formatMoney(item.transitFeePerPerson)} = {formatMoney(item.adultTransitTotal)}</span>}
                        {children > 0 && <span className="pl-2 text-safari-muted/80">- Children: {children} x {formatMoney(item.transitFeePerPerson * childParkDiscount)} = {formatMoney(item.childTransitTotal)}</span>}
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
                  <p className="font-serif text-3xl md:text-4xl text-[#FCFBFA] leading-tight">Total Estimated <br/> Investment</p>
                  <p className="text-white/50 text-[10px] mt-4 uppercase tracking-widest max-w-xs leading-relaxed">Excludes international flights, visas, and premium beverages.</p>
              </div>
              <div className="text-right w-full md:w-auto md:min-w-[300px]">
                  <div className="flex justify-between md:justify-end md:gap-16 mb-3 text-[#FCFBFA]/60 text-xs uppercase tracking-widest font-semibold">
                      <span>Subtotal</span>
                      <span className="font-serif text-white text-base">{formatMoney(subtotal)}</span>
                  </div>
                  <div className="flex justify-between md:justify-end md:gap-16 mb-6 text-[#FCFBFA]/60 text-xs uppercase tracking-widest font-semibold">
                      <span>Taxes & Fees</span>
                      <span className="font-serif text-white text-base">{formatMoney(taxesTotal)}</span>
                  </div>
                  <div className="flex justify-between md:justify-end md:gap-16 pt-6 border-t border-safari-accent/30">
                      <span className="text-sm font-bold uppercase tracking-[0.2em] text-[#FCFBFA] self-end pb-1">Grand Total</span>
                      <span className="text-4xl md:text-5xl font-serif text-safari-accent">{formatMoney(grandTotal)}</span>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
}
