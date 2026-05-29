import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { SAFARI_DATABASE, DayPlan } from '../App';
import { Card } from '@/components/ui/card';

interface SafariMapProps {
  itinerary: DayPlan[];
}

export function SafariMap({ itinerary }: SafariMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<L.Map | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(null);
  const [routeLegs, setRouteLegs] = useState<any[]>([]);
  const [isLoadingRoutes, setIsLoadingRoutes] = useState(false);

  // 1. Calculate and fetch route legs when itinerary changes
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingRoutes(true);
    setRouteLegs([]);
    setActiveDayIndex(null);

    const baseLegs: any[] = [];
    
    // Prepare markers and routes
    itinerary.forEach((day, index) => {
      const driveTimeLower = day.drive_time.toLowerCase();
      const detailedLower = (day.detailed_description || '').toLowerCase();
      const activitiesLower = (day.activities || []).join(' ').toLowerCase();
      const fromLower = day.from.toLowerCase();
      const toLower = day.to.toLowerCase();
      
      let type = 'drive';
      if (
          driveTimeLower.includes('flight') || 
          driveTimeLower.includes('fly') || 
          detailedLower.includes('flight to') || 
          detailedLower.includes('fly to') ||
          activitiesLower.includes('flight') ||
          activitiesLower.includes('fly') ||
          fromLower.includes('flight') ||
          toLower.includes('flight') ||
          fromLower.includes('airstrip') ||
          toLower.includes('airstrip')
      ) {
          type = 'flight';
      }
      // If it's a drive but start & end are practically the same place
      else if (day.from.toLowerCase() === day.to.toLowerCase() || driveTimeLower.includes('full day game drive') || activitiesLower.includes('full day game drive')) {
          type = 'game_drive';
      }

      let fromCoords: {lat: number, lng: number} | null = null;
      let toCoords: {lat: number, lng: number} | null = null;
      let intermediateCoords: {lat: number, lng: number} | null = null;

      if (type === 'flight') {
        const fromAirstrip = getAirstripForLocation(day.from);
        const toAirstrip = getAirstripForLocation(day.to);
        if (fromAirstrip) fromCoords = { lat: fromAirstrip.lat, lng: fromAirstrip.lng };
        if (toAirstrip) toCoords = { lat: toAirstrip.lat, lng: toAirstrip.lng };
      }

      if (!fromCoords) fromCoords = getCoordinatesForLocation(day.from);
      if (!toCoords) toCoords = getCoordinatesForLocation(day.to);
      
      // If we can't find exact coords, try to use previous day's end for current day's start
      if (!fromCoords && index > 0) {
        fromCoords = baseLegs[index-1].toCoords;
      }
      
      // Backup coords if really missing
      if (!fromCoords) fromCoords = { lat: -3.3869, lng: 36.6822 }; // Arusha default
      if (!toCoords) toCoords = { lat: -2.3333, lng: 34.8333 }; // Serengeti default

      // Try to find lodge coordinates for 'toCoords' if possible
      if (type !== 'flight') {
        const lodgeNode = SAFARI_DATABASE.lodges.find(l => l.name === day.lodge.name);
        if (lodgeNode && lodgeNode.coordinates) {
          toCoords = lodgeNode.coordinates;
        }

        // Check for intermediate park visits in activities (e.g., stopping at Manyara or Arusha NP or Tarangire on the way)
        if (fromLower !== toLower) {
            const potentialStops = [
                { key: 'arusha national park', name: 'Arusha National Park' },
                { key: 'arusha np', name: 'Arusha National Park' },
                { key: 'manyara', name: 'Lake Manyara' },
                { key: 'tarangire', name: 'Tarangire' },
                { key: 'ngorongoro crater', name: 'Ngorongoro' }
            ];
            for (const stop of potentialStops) {
                if (activitiesLower.includes(stop.key) || detailedLower.includes(stop.key)) {
                    // Only use it if our start and end points aren't already this stop
                    if (!fromLower.includes(stop.key) && !toLower.includes(stop.key)) {
                        const coords = getCoordinatesForLocation(stop.name);
                        if (coords) {
                            intermediateCoords = coords;
                            break; // just take the first meaningful stop found
                        }
                    }
                }
            }
        }
      }

      let distance = haversineDist(fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng);
      if (intermediateCoords) {
          distance = haversineDist(fromCoords.lat, fromCoords.lng, intermediateCoords.lat, intermediateCoords.lng) + 
                     haversineDist(intermediateCoords.lat, intermediateCoords.lng, toCoords.lat, toCoords.lng);
      }

      baseLegs.push({
        day: day.day,
        fromCoords,
        toCoords,
        intermediateCoords,
        type,
        distance,
        index
      });
    });

    (async () => {
        // Fetch drive routes asynchronously
        for (const leg of baseLegs) {
            if (leg.type === 'game_drive' && leg.distance <= 5) {
                leg.curvePoints = getGameDriveLoop(leg.fromCoords);
            } else if ((leg.type === 'drive' || leg.type === 'game_drive') && leg.distance > 5) {
                if (leg.intermediateCoords) {
                    const dist1 = haversineDist(leg.fromCoords.lat, leg.fromCoords.lng, leg.intermediateCoords.lat, leg.intermediateCoords.lng);
                    const dist2 = haversineDist(leg.intermediateCoords.lat, leg.intermediateCoords.lng, leg.toCoords.lat, leg.toCoords.lng);
                    
                    const pts1 = await fetchRoadPoints(leg.fromCoords, leg.intermediateCoords, dist1);
                    const pts2 = await fetchRoadPoints(leg.intermediateCoords, leg.toCoords, dist2);
                    
                    leg.curvePoints = [...pts1, ...pts2];
                } else {
                    leg.curvePoints = await fetchRoadPoints(leg.fromCoords, leg.toCoords, leg.distance);
                }
            } else {
                const bend = 0.35;
                leg.curvePoints = getCurvePoints(leg.fromCoords, leg.toCoords, bend);
            }
        }

        if (!isCancelled) {
            setRouteLegs(baseLegs);
            setIsLoadingRoutes(false);
        }
    })();

    return () => { isCancelled = true; };
  }, [itinerary]);

  // 2. Draw map based on routeLegs and activeDayIndex
  useEffect(() => {
    if (!mapRef.current) return;

    if (!mapInstance.current) {
      mapInstance.current = L.map(mapRef.current, {
        zoomControl: false,
        attributionControl: false
      }).setView([-3.3, 35.8], 8);

      L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 18,
      }).addTo(mapInstance.current);
    }

    const map = mapInstance.current;
    
    // Clear existing layers
    map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      map.removeLayer(layer);
    });

    if (routeLegs.length === 0) return;

    // Draw Lodges
    routeLegs.forEach(leg => {
      const lodgeData = itinerary.find(d => d.day === leg.day)?.lodge;
      if (!lodgeData) return;
      
      const realLodge = SAFARI_DATABASE.lodges.find(l => l.name === lodgeData.name);
      
      const marker = L.circleMarker([leg.toCoords.lat, leg.toCoords.lng], {
          radius: 8,
          fillColor: "#A88655",
          color: "#ffffff",
          weight: 2,
          opacity: 1,
          fillOpacity: 1
      }).addTo(map);
      
      marker.bindPopup(`
          <div class="p-2 min-w-[150px]">
              <b class="block text-sm mb-1 text-safari-text">${lodgeData.name}</b>
              <span class="text-xs text-safari-accent font-semibold">${lodgeData.category ? lodgeData.category.toUpperCase() : 'LODGE'}</span>
              ${realLodge?.usp ? `<p class="text-xs text-gray-500 mt-1 line-clamp-2">${realLodge.usp}</p>` : ''}
          </div>
      `, { className: 'rounded-xl overflow-hidden' });
    });

    if (activeDayIndex === null) {
        // Zoom to fit all lodges
        const bounds = L.latLngBounds(routeLegs.map(leg => [leg.toCoords.lat, leg.toCoords.lng]));
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 9 });
        }
        return;
    }

    // Animate specific route
    const leg = routeLegs[activeDayIndex];
    if (!leg) return;

    const speed = leg.type === 'flight' ? 200 : 50;
    const dist = leg.distance || 0;
    const time = (dist / speed).toFixed(1);
    const curvePoints = leg.curvePoints;
    
    const color = leg.type === 'flight' ? '#A88655' : (leg.type === 'game_drive' ? '#8D6F44' : '#1C1B1A');
    const dashArray = leg.type === 'flight' ? '6, 8' : (leg.type === 'game_drive' ? '4, 4' : undefined);
    
    const options = {
        color: color,
        weight: leg.type === 'flight' ? 3 : 2,
        dashArray: dashArray,
        opacity: 0.75
    };

    const animDuration = Math.min(800 + (dist * 2), 1500); 

    // Fit bounds to the route we are animating
    const bounds = L.latLngBounds(curvePoints);
    if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80] });
    }

    animatePolyline(map, curvePoints, options, animDuration, 200, () => {
        const midPoint = curvePoints[Math.floor(curvePoints.length / 2)];
        const typeIcon = leg.type === 'flight' ? '✈️' : (leg.type === 'game_drive' ? '🦁' : '🚙');
        let labelText = '';
        if (leg.type === 'game_drive') {
            if (dist > 5) {
                labelText = `Day ${leg.day}: EN ROUTE GAME DRIVE ${typeIcon}<br>${dist.toFixed(0)}km | ~${time}h`;
            } else {
                labelText = `Day ${leg.day}: GAME DRIVE ${typeIcon}`;
            }
        } else {
            labelText = `Day ${leg.day}: ${leg.type.toUpperCase()} ${typeIcon}<br>${dist.toFixed(0)}km | ~${time}h`;
        }

        const labelIcon = L.divIcon({
            className: '',
            html: `<div style="background:white; border: 2px solid ${color}; color: #334155; padding: 4px 8px; border-radius: 6px; font-size: 11px; white-space: nowrap; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; font-weight: bold;">${labelText}</div>`,
            iconSize: [120, 44],
            iconAnchor: [60, 22]
        });

        if (midPoint) {
            L.marker(midPoint as L.LatLngExpression, { icon: labelIcon, interactive: false }).addTo(map);
        }
    });

  }, [routeLegs, activeDayIndex, itinerary]);

  return (
    <Card className="w-full h-[600px] overflow-hidden relative shadow-xl rounded-2xl border-none">
        <div ref={mapRef} className="absolute inset-0 z-0 bg-[#eef2f3]" />
        
        {/* Map Legend Overlay */}
        <div className="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg border border-white/20">
            <h3 className="font-serif text-lg text-safari-accent mb-2">Interactive Route Map</h3>
            <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-safari-text">
                    <div className="w-4 h-1 bg-blue-600 rounded-full"></div> Drive Route
                </div>
                <div className="flex items-center gap-2 text-sm text-safari-text">
                    <div className="w-4 h-1 border-b-2 border-orange-500 border-dashed"></div> Flight Path
                </div>
                <div className="flex items-center gap-2 text-sm text-safari-text">
                    <div className="w-3 h-3 bg-emerald-600 rounded-full border-2 border-white"></div> Lodge/Camp
                </div>
            </div>
        </div>

        {/* Day Selector Overlay */}
        <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur rounded-xl p-4 shadow-lg border border-white/20 w-64 max-h-[calc(100%-2rem)] flex flex-col">
            <h3 className="font-serif text-lg text-safari-accent mb-3">Select a Day</h3>
            {isLoadingRoutes ? (
                <div className="text-sm text-gray-500 animate-pulse text-center py-4">Calculating Routes...</div>
            ) : (
                <div className="overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                    {routeLegs.map((leg, idx) => (
                        <button
                            key={leg.day}
                            onClick={() => setActiveDayIndex(idx)}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all border ${activeDayIndex === idx ? 'bg-safari-accent text-white border-transparent shadow-md' : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'}`}
                        >
                            <span className="font-bold mr-2">Day {leg.day}:</span>
                            <span className="line-clamp-1 opacity-90">{itinerary[idx].from} &rarr; {itinerary[idx].to}</span>
                        </button>
                    ))}
                    {routeLegs.length > 0 && activeDayIndex !== null && (
                        <button
                            onClick={() => setActiveDayIndex(null)}
                            className="w-full mt-4 text-center px-3 py-2 rounded-lg text-sm font-medium text-safari-accent border border-safari-accent/30 hover:bg-safari-bg transition-colors"
                        >
                            Clear Selection
                        </button>
                    )}
                </div>
            )}
        </div>
    </Card>
  );
}

// Helpers
const AIRSTRIPS = [
    { name: 'Seronera', keywords: ['serengeti central', 'seronera'], lat: -2.4333, lng: 34.8167 },
    { name: 'Kogatende', keywords: ['northern serengeti', 'kogatende', 'mara'], lat: -1.5833, lng: 34.9000 },
    { name: 'Ndutu', keywords: ['ndutu', 'southern serengeti'], lat: -3.0167, lng: 34.9833 },
    { name: 'Sasakwa', keywords: ['grumeti', 'western corridor', 'western serengeti'], lat: -2.1500, lng: 34.2000 },
    { name: 'Kuro', keywords: ['tarangire'], lat: -3.7667, lng: 36.1167 },
    { name: 'Lake Manyara', keywords: ['ngorongoro', 'manyara', 'karatu'], lat: -3.3667, lng: 35.8167 },
    { name: 'Arusha Airport', keywords: ['arusha'], lat: -3.3667, lng: 36.6167 },
    { name: 'Kilimanjaro', keywords: ['kilimanjaro', 'jro'], lat: -3.4293, lng: 37.0741 },
];

function getAirstripForLocation(name: string) {
    const toLower = name.toLowerCase();
    for (const strip of AIRSTRIPS) {
        if (strip.keywords.some(k => toLower.includes(k))) {
            return { lat: strip.lat, lng: strip.lng, name: strip.name };
        }
    }
    // Return original coordinates if no specific airstrip found, or default
    return null;
}

async function fetchRoadPoints(start: {lat: number, lng: number}, end: {lat: number, lng: number}, haversineDistKm: number): Promise<number[][]> {
    try {
        const res = await fetch(`https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`);
        const data = await res.json();
        if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
            const osrmDistKm = data.routes[0].distance / 1000;
            // If OSRM route is ridiculously long compared to straight line, it's likely a bad routing (e.g. Serengeti has few mapped roads)
            if (osrmDistKm > haversineDistKm * 3.5) {
                console.warn(`OSRM route is suspiciously long (${osrmDistKm}km vs ${haversineDistKm}km straight line), falling back to curve`);
                return getCurvePoints(start, end, 0.10);
            }
            
            const coords = data.routes[0].geometry.coordinates; // [[lng, lat], ...]
            return coords.map((c: number[]) => [c[1], c[0]]); // to [lat, lng]
        }
    } catch (e) {
        console.error("OSRM fetch failed, falling back to curve", e);
    }
    // Fallback if failed or no route:
    return getCurvePoints(start, end, 0.15);
}

function getCoordinatesForLocation(name: string) {
    const toLower = name.toLowerCase();
    
    // Specific hard-coded regions first for accuracy
    if (toLower.includes('northern serengeti') || toLower.includes('north serengeti') || toLower.includes('serengeti north') || toLower.includes('kogatende') || toLower.includes('mara')) return { lat: -1.5833, lng: 34.9000 };
    if (toLower.includes('southern serengeti') || toLower.includes('ndutu')) return { lat: -3.0167, lng: 34.9833 };
    if (toLower.includes('western serengeti') || toLower.includes('grumeti') || toLower.includes('western corridor')) return { lat: -2.1500, lng: 34.2000 };
    if (toLower.includes('central serengeti') || toLower.includes('seronera') || toLower === 'serengeti') return { lat: -2.4333, lng: 34.8167 };
    
    // Check parks
    for (const park of SAFARI_DATABASE.parks) {
        if (toLower.includes(park.name.toLowerCase().replace(" national park", "").replace(" conservation area", "").trim()) || 
            park.name.toLowerCase().includes(toLower)) {
            return park.coordinates;
        }
        if (park.landmarks) {
            for (const lm of park.landmarks) {
                if (toLower.includes(lm.toLowerCase())) return park.coordinates;
            }
        }
    }
    
    // Some hardcoded common hubs
    if (toLower.includes('arusha')) return { lat: -3.3869, lng: 36.6822 };
    if (toLower.includes('kilimanjaro')) return { lat: -3.4293, lng: 37.0741 }; // JRO
    if (toLower.includes('karatu')) return { lat: -3.3386, lng: 35.6747 };
    if (toLower.includes('mto wa mbu')) return { lat: -3.3768, lng: 35.8458 };
    if (toLower.includes('manyara')) return { lat: -3.4795, lng: 35.8354 };
    
    return null;
}

function haversineDist(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; 
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2)*Math.sin(dLat/2) +
              Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180) *
              Math.sin(dLon/2)*Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

function getCurvePoints(start: {lat: number, lng: number}, end: {lat: number, lng: number}, bendOffset = 0.2) {
    const midLat = (start.lat + end.lat) / 2;
    const midLng = (start.lng + end.lng) / 2;
    
    const dx = end.lat - start.lat;
    const dy = end.lng - start.lng;
    
    const px = -dy * bendOffset;
    const py = dx * bendOffset;
    
    const controlPoint = [midLat + px, midLng + py];
    
    const points = [];
    for (let t = 0; t <= 1; t += 0.02) {
        const lat = (1-t)*(1-t)*start.lat + 2*(1-t)*t*controlPoint[0] + t*t*end.lat;
        const lng = (1-t)*(1-t)*start.lng + 2*(1-t)*t*controlPoint[1] + t*t*end.lng;
        points.push([lat, lng]);
    }
    return points;
}

function getGameDriveLoop(center: {lat: number, lng: number}) {
    const points = [];
    const radius = 0.05; // rough degrees
    for (let i = 0; i <= 36; i++) {
        const angle = (i * 10) * (Math.PI / 180);
        points.push([center.lat + Math.sin(angle)*radius*0.5, center.lng + Math.cos(angle)*radius]);
    }
    return points;
}

function animatePolyline(map: L.Map, points: number[][], options: any, duration: number, delay: number, onComplete: () => void) {
    if (!points || points.length === 0) return;
    
    setTimeout(() => {
        const polyline = L.polyline([points[0] as L.LatLngExpression], options).addTo(map);
        const totalPoints = points.length;
        let startPoint = 1;
        const startTime = performance.now();

        function animate(currentTime: number) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const targetPoint = Math.floor(progress * totalPoints);

            for (let i = startPoint; i < targetPoint; i++) {
                if (points[i]) {
                    polyline.addLatLng(points[i] as L.LatLngExpression);
                }
            }
            startPoint = targetPoint;

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                // Ensure the last point is drawn
                if (startPoint < totalPoints && points[totalPoints - 1]) {
                    polyline.addLatLng(points[totalPoints - 1] as L.LatLngExpression);
                }
                if (onComplete) onComplete();
            }
        }
        requestAnimationFrame(animate);
    }, delay);
}
