import { DayPlan, SAFARI_DATABASE } from '../App';

export function calculateCostSummary(itinerary: DayPlan[], adults: number, children: number, roomType: string) {
  const totalGuests = adults + children;
  const days = itinerary.length;
  const requiredVehicles = Math.ceil(totalGuests / 7) || 1;

  const roomTypeMultipliers: Record<string, { label: string, multi: number }> = {
    'single': { label: 'Single Room (+30%)', multi: 1.3 },
    'double': { label: 'Double/Twin Room', multi: 1.0 },
    'triple': { label: 'Triple Room (-10% pp)', multi: 0.9 },
    'family': { label: 'Family Suite (+20% pp)', multi: 1.2 }
  };

  const accommodationsMap = new Map<string, { nights: number; pricePerNight: number; name: string }>();
  const parkMap = new Map<string, { park: string; feePerPerson: number; concessionPerPerson: number; days: number; transitFeePerPerson?: number; transitDays?: number }>();
  const flights: any[] = [];
  const optionalActivities: any[] = [];
  let craterFeeTracker = false;
  let balloonTracker = false;
  let maasaiTracker = false;

  itinerary.forEach((day) => {
    // Accommodations
    const lodgeName = day.lodge?.name || 'Unknown Lodge';
    const dbLodge = SAFARI_DATABASE.lodges.find(l => l.name === lodgeName) as any;
    
    const pricePerNight = dbLodge ? (dbLodge.price_usd?.mid || 400) : 400; // Default price if unknown
    
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
               parkMap.get(parkName)!.transitFeePerPerson = 71; 
           } else {
               parkMap.set(parkName, { park: parkName, feePerPerson: 0, concessionPerPerson: 0, transitFeePerPerson: 71, days: 0, transitDays: 1 });
           }
        }
    }

    if (day.permit_extension && day.permit_extension.park) {
       const parkName = day.permit_extension.park;
       const p = SAFARI_DATABASE.parks.find(p => p.name.toLowerCase().includes(parkName.toLowerCase()) || parkName.toLowerCase().includes(p.name.toLowerCase())) as any;
       const entry = p ? (p.entry_fee_usd || 71) : 71;

       if (parkMap.has(parkName)) {
           parkMap.get(parkName)!.days += day.permit_extension.days;
       } else {
           parkMap.set(parkName, { park: parkName, feePerPerson: entry, concessionPerPerson: 0, days: day.permit_extension.days });
       }
    }
  });

  const accList = Array.from(accommodationsMap.values());
  const transList = [{ vehicle: "Private 4x4 Extended Safari Land Cruiser", days: days, pricePerDay: 280 }];
  const parkList = Array.from(parkMap.values());
  const flightList = flights;
  const actList = optionalActivities;

  let subtotal = 0;

  const roomMultiplier = roomTypeMultipliers[roomType] ? roomTypeMultipliers[roomType].multi : 1.0;
  const childAccDiscount = 0.5;
  const childParkDiscount = 0.3;

  // Acc calculations
  const formattedAccList = accList.map(item => {
    const accCostPerNightAdult = item.pricePerNight * roomMultiplier;
    const accCostPerNightChild = item.pricePerNight * childAccDiscount;
    const total = item.nights * ((adults * accCostPerNightAdult) + (children * accCostPerNightChild));
    subtotal += total;
    return { ...item, total, perAdult: accCostPerNightAdult, perChild: accCostPerNightChild };
  });

  // Trans calculations
  const formattedTransList = transList.map(item => {
    const total = item.days * item.pricePerDay * requiredVehicles;
    subtotal += total;
    return { ...item, total, vehicles: requiredVehicles };
  });

  // Park calculations
  const formattedParkList = parkList.map(item => {
    const adultEntryTotal = item.feePerPerson * adults * item.days;
    const childEntryTotal = (item.feePerPerson * childParkDiscount) * children * item.days;
    const adultConcessionTotal = item.concessionPerPerson * adults * item.days;
    const childConcessionTotal = (item.concessionPerPerson * childParkDiscount) * children * item.days;
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

  // Flights calculations
  const formattedFlightList = flightList.map(item => {
    const flightCostChild = item.costPerPerson * 0.8;
    const total = (item.costPerPerson * adults) + (flightCostChild * children);
    subtotal += total;
    return { ...item, total, flightCostChild };
  });

  // Activities calculations
  const formattedActList = actList.map((item: any) => {
    let total;
    let actCostChild;
    if (item.isFlatVehicleFee) {
        total = item.costPerPerson * totalGuests;
        actCostChild = item.costPerPerson;
    } else {
        actCostChild = item.costPerPerson * 0.5;
        total = (item.costPerPerson * adults) + (actCostChild * children);
    }
    subtotal += total;
    return { ...item, total, actCostChild };
  });

  const TAXES_VAT_PERCENT = 18;
  const TAXES_SERVICE_FEE = 150;
  const TAXES_CONSERVATION_LEVY = 100;

  const vatEst = subtotal * (TAXES_VAT_PERCENT / 100);
  const taxesTotal = vatEst + TAXES_SERVICE_FEE + TAXES_CONSERVATION_LEVY;
  const grandTotal = subtotal + taxesTotal;

  return {
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
  };
}
