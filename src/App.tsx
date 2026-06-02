import { useState, lazy, Suspense } from 'react';
import { MapPin, Clock, Sun, Calendar, Compass, Camera, Tent, Loader2, Sparkles, Info, X, ShieldCheck, AlertTriangle, Edit3, Plus, Settings2, Check, ArrowRight, Receipt, Trash2, Users, Printer, Bird } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

const SafariMap = lazy(() => import('./components/SafariMap').then(m => ({ default: m.SafariMap })));
const CostSummary = lazy(() => import('./components/CostSummary').then(m => ({ default: m.CostSummary })));
const ConsultantTab = lazy(() => import('./components/ConsultantTab').then(m => ({ default: m.ConsultantTab })));

const INTEREST_OPTIONS = [
  { id: 'wildlife', label: 'General Wildlife', icon: Compass },
  { id: 'big-cats', label: 'Big Cats', icon: Camera },
  { id: 'bird-watching', label: 'Bird Watching', icon: Bird },
  { id: 'photography', label: 'Photography', icon: Camera },
  { id: 'luxury', label: 'Luxury Lodges', icon: Sparkles },
  { id: 'budget', label: 'Budget/Camping', icon: Tent },
  { id: 'migration', label: 'Great Migration', icon: Compass },
  { id: 'cultural', label: 'Cultural Visits', icon: MapPin },
  { id: 'crater-full', label: 'Full Crater Game Drive', icon: Sun },
];

const FLIGHT_OPTIONS = [
  { id: 'none', label: 'No Flights (Drive Only)' },
  { id: 'in', label: 'Flight In (Start in Serengeti)' },
  { id: 'out', label: 'Flight Out (End in Serengeti)' },
  { id: 'both', label: 'Flight In & Out' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export const SAFARI_DATABASE = {
  "parks": [
    { "id": "park_001", "name": "Serengeti National Park", "region": "Northern Circuit", "landmarks": ["Seronera", "Kogatende", "Grumeti", "Lobo"], "entry_fee_usd": 70, "famous_for": ["Great Migration", "Big Cats", "Endless plains"], "coordinates": { "lat": -2.3333, "lng": 34.8333 } },
    { "id": "park_002", "name": "Ngorongoro Conservation Area", "region": "Northern Circuit", "landmarks": ["Crater Rim", "Olduvai Gorge", "Ndutu (south)"], "entry_fee_usd": 70, "crater_fee_usd": 295, "famous_for": ["Ngorongoro Crater", "Rhinos", "Dense wildlife"], "coordinates": { "lat": -3.1619, "lng": 35.5877 } },
    { "id": "park_003", "name": "Tarangire National Park", "region": "Northern Circuit", "landmarks": ["Tarangire River", "Silale Swamp"], "entry_fee_usd": 50, "famous_for": ["Elephants", "Baobab trees", "Dry season wildlife"], "coordinates": { "lat": -3.8333, "lng": 36.0000 } },
    { "id": "park_004", "name": "Lake Manyara National Park", "region": "Northern Circuit", "landmarks": ["Groundwater Forest", "Lake shore"], "entry_fee_usd": 50, "famous_for": ["Tree-climbing lions", "Flamingos", "Forest"], "coordinates": { "lat": -3.3762, "lng": 35.8063 } },
    { "id": "park_005", "name": "Karatu / Highlands", "region": "Northern Circuit", "landmarks": ["Karatu Town", "Highlands"], "entry_fee_usd": 0, "famous_for": ["Coffee plantations", "Gateway to Ngorongoro", "Iraqw culture"], "coordinates": { "lat": -3.3364, "lng": 35.6706 } },
    { "id": "park_006", "name": "Arusha National Park", "region": "Northern Circuit", "landmarks": ["Mount Meru", "Momella Lakes", "Ngurdoto Crater"], "entry_fee_usd": 50, "famous_for": ["Walking safaris", "Colobus monkeys", "Mount Meru views"], "coordinates": { "lat": -3.2500, "lng": 36.8333 } },
    { "id": "park_007", "name": "Arusha Town", "region": "Northern Circuit", "landmarks": ["Clock Tower", "Cultural Heritage Center"], "entry_fee_usd": 0, "famous_for": ["Starting point", "Cultural tours", "Dining"], "coordinates": { "lat": -3.3667, "lng": 36.6833 } }
  ],
  "serengeti_zones": [
    { "id": "zone_001", "name": "Serengeti Central (Seronera)", "best_for": ["Big cats", "Year-round wildlife"], "season_best": ["all year"], "notes": "Best base for consistent sightings" },
    { "id": "zone_002", "name": "Ndutu (Southern Serengeti)", "best_for": ["Calving season", "Cheetahs", "Migration"], "season_best": ["January", "February", "March"], "notes": "Peak predator-prey interaction" },
    { "id": "zone_003", "name": "Western Corridor (Grumeti)", "best_for": ["River crossings"], "season_best": ["May", "June"], "notes": "Unpredictable crossings" },
    { "id": "zone_004", "name": "Northern Serengeti (Kogatende)", "best_for": ["Mara River crossings"], "season_best": ["July", "August", "September", "October"], "notes": "Most dramatic migration crossings" }
  ],
  "migration_calendar": [
    { "month": "January-February", "location": "Ndutu", "event": "Calving season", "recommendation": "Stay in Ndutu area" },
    { "month": "March-April", "location": "Southern Serengeti", "event": "Movement begins", "recommendation": "Central Serengeti better" },
    { "month": "May-June", "location": "Western Corridor", "event": "Grumeti crossings", "recommendation": "Western camps" },
    { "month": "July-October", "location": "Northern Serengeti", "event": "Mara River crossings", "recommendation": "Kogatende camps" },
    { "month": "November-December", "location": "Central to South", "event": "Migration returns", "recommendation": "Central Serengeti" }
  ],
  "lodges": [
    { "id": "lodge_001", "name": "Serengeti Serena Safari Lodge", "park_id": "park_001", "category": "mid", "price_usd": { "low": 250, "mid": 400, "high": 600 }, "inside_park": true, "usp": "offers traditional circular 'rondavel' architecture with stunning valley views", "coordinates": { "lat": -2.3330, "lng": 34.8200 } },
    { "id": "lodge_002", "name": "Four Seasons Safari Lodge Serengeti", "park_id": "park_001", "category": "luxury", "price_usd": { "low": 700, "mid": 1200, "high": 1800 }, "inside_park": true, "usp": "uniquely features a busy watering hole right in front of its infinity pool", "coordinates": { "lat": -2.1420, "lng": 34.6850 } },
    { "id": "lodge_003", "name": "Kati Kati Tented Camp", "park_id": "park_001", "category": "budget", "price_usd": { "low": 150, "mid": 200, "high": 300 }, "inside_park": true, "usp": "is a mobile camp that places you directly within the heart of migration paths", "coordinates": { "lat": -2.4500, "lng": 34.9000 } },
    { "id": "lodge_004", "name": "Ngorongoro Serena Safari Lodge", "park_id": "park_002", "category": "mid", "price_usd": { "low": 300, "mid": 450, "high": 650 }, "inside_park": true, "usp": "is built from local river stone and camouflaged in indigenous vines on the crater rim", "coordinates": { "lat": -3.2500, "lng": 35.5500 } },
    { "id": "lodge_005", "name": "Ngorongoro Crater Lodge", "park_id": "park_002", "category": "luxury", "price_usd": { "low": 900, "mid": 1500, "high": 2500 }, "inside_park": true, "usp": "offers a 'Versailles of Africa' experience with baroque interiors and 24/7 butler service", "coordinates": { "lat": -3.2000, "lng": 35.5000 } },
    { "id": "lodge_006", "name": "Tarangire Safari Lodge", "park_id": "park_003", "category": "mid", "price_usd": { "low": 200, "mid": 300, "high": 450 }, "inside_park": true, "usp": "boasts one of the best views in Tanzania, looking directly down at the Tarangire River", "coordinates": { "lat": -3.7500, "lng": 36.0500 } },
    { "id": "lodge_007", "name": "Chem Chem Lodge", "park_id": "park_003", "category": "luxury", "price_usd": { "low": 600, "mid": 1000, "high": 1500 }, "inside_park": false, "usp": "provides an exclusive 'Slow Safari' experience with private concession access away from the crowds", "coordinates": { "lat": -3.7000, "lng": 35.9000 } },
    { "id": "lodge_008", "name": "Manyara Wildlife Safari Camp", "park_id": "park_004", "category": "budget", "price_usd": { "low": 120, "mid": 180, "high": 250 }, "inside_park": false, "usp": "is perched on the escarpment with sweeping views over the Lake Manyara plains", "coordinates": { "lat": -3.4000, "lng": 35.8000 } },
    { "id": "lodge_009", "name": "Kubu Kubu Tented Lodge", "park_id": "park_001", "zone": "zone_001", "category": "mid", "price_usd": { "low": 300, "mid": 450, "high": 650 }, "inside_park": true, "usp": "is strategically placed in Central Serengeti for excellent year-round wildlife viewing" },
    { "id": "lodge_010", "name": "Lemala Nanyukie", "park_id": "park_001", "zone": "zone_001", "category": "luxury", "price_usd": { "low": 600, "mid": 900, "high": 1400 }, "inside_park": true, "usp": "combines contemporary luxury with absolute seclusion in the eastern Serengeti plains" },
    { "id": "lodge_011", "name": "Nyikani Central Camp", "park_id": "park_001", "zone": "zone_001", "category": "mid", "price_usd": { "low": 250, "mid": 400, "high": 600 }, "inside_park": true, "usp": "provides an authentic, intimate safari atmosphere in the heart of the predator-rich areas" },
    { "id": "lodge_012", "name": "Ndutu Safari Lodge", "park_id": "park_002", "zone": "zone_002", "category": "mid", "price_usd": { "low": 200, "mid": 300, "high": 450 }, "inside_park": true, "usp": "is famous for its resident wildlife and front-row seats to the calving season" },
    { "id": "lodge_013", "name": "Lake Masek Tented Lodge", "park_id": "park_002", "zone": "zone_002", "category": "luxury", "price_usd": { "low": 500, "mid": 800, "high": 1200 }, "inside_park": true, "usp": "overlooks Lake Masek and offers high-end tented comfort near the migration herds" },
    { "id": "lodge_014", "name": "Grumeti Serengeti River Lodge", "park_id": "park_001", "zone": "zone_003", "category": "luxury", "price_usd": { "low": 800, "mid": 1200, "high": 2000 }, "inside_park": true, "usp": "is known for its hippos and prime location for the dramatic river crossings" },
    { "id": "lodge_015", "name": "Mbalageti Serengeti", "park_id": "park_001", "zone": "zone_003", "category": "mid", "price_usd": { "low": 300, "mid": 450, "high": 650 }, "inside_park": true, "usp": "perched on a hill with a 360-degree view of the Serengeti and the Dutch corridor" },
    { "id": "lodge_016", "name": "Mara River Camp", "park_id": "park_001", "zone": "zone_004", "category": "mid", "price_usd": { "low": 400, "mid": 600, "high": 900 }, "inside_park": true, "usp": "is a boutique lodge ideally situated for the high-action Mara River crossings" },
    { "id": "lodge_017", "name": "Sayari Camp", "park_id": "park_001", "zone": "zone_004", "category": "luxury", "price_usd": { "low": 900, "mid": 1400, "high": 2200 }, "inside_park": true, "usp": "redefines high-end wilderness living in the remote northern Serengeti" },
    { "id": "lodge_018", "name": "Lemala Kuria Hills", "park_id": "park_001", "zone": "zone_004", "category": "luxury", "price_usd": { "low": 800, "mid": 1300, "high": 2000 }, "inside_park": true, "usp": "offers glass-fronted suites with private plunge pools overlooking the kopjes" },
    { "id": "lodge_019", "name": "Rhino Lodge", "park_id": "park_002", "category": "budget", "price_usd": { "low": 120, "mid": 180, "high": 250 }, "inside_park": true, "usp": "is an eco-friendly lodge that offers an authentic, simple stay directly on the crater rim" },
    { "id": "lodge_020", "name": "Farm House Valley", "park_id": "park_005", "category": "mid", "price_usd": { "low": 250, "mid": 350, "high": 500 }, "inside_park": false, "usp": "is set on an active farm, offering fresh garden-to-table cuisine and scenic coffee walks" },
    { "id": "lodge_021", "name": "Maramboi Tented Lodge", "park_id": "park_003", "category": "mid", "price_usd": { "low": 200, "mid": 300, "high": 450 }, "inside_park": false, "usp": "is located on a wildlife corridor with animals often passing right by the rooms" },
    { "id": "lodge_022", "name": "Lake Burunge Tented Lodge", "park_id": "park_003", "category": "budget", "price_usd": { "low": 150, "mid": 220, "high": 300 }, "inside_park": false, "usp": "offers a tranquil lakeside atmosphere perfect for unwinding after a dusty game drive" },
    { "id": "lodge_023", "name": "Ngorongoro Farm House", "park_id": "park_005", "category": "mid", "price_usd": { "low": 200, "mid": 300, "high": 450 }, "inside_park": false, "usp": "features colonial-style bungalows set in hand-manicured gardens on a coffee plantation" },
    { "id": "lodge_024", "name": "Gibb's Farm", "park_id": "park_005", "category": "luxury", "price_usd": { "low": 600, "mid": 900, "high": 1300 }, "inside_park": false, "usp": "is a historic estate renowned for its award-winning organic farm and peaceful sanctuary" },
    { "id": "lodge_025", "name": "Eileen's Trees Inn", "park_id": "park_005", "category": "budget", "price_usd": { "low": 100, "mid": 150, "high": 220 }, "inside_park": false, "usp": "provides a comfortable and charming garden retreat in the highlands of Karatu" },
    { "id": "lodge_026", "name": "The Retreat Ngorongoro", "park_id": "park_005", "category": "luxury", "price_usd": { "low": 500, "mid": 800, "high": 1100 }, "inside_park": false, "usp": "is an exquisite luxury retreat in Karatu offering tranquility, wildlife corridors, and dedicated service" },
    { "id": "lodge_027", "name": "The African Tulip", "park_id": "park_007", "category": "luxury", "price_usd": { "low": 200, "mid": 250, "high": 350 }, "inside_park": false, "usp": "an elegant and charming boutique hotel located in the heart of Arusha, perfect for pre or post safari stays" }
  ],
  "routes": [
    { "id": "route_001", "from": "Arusha", "to": "Tarangire", "distance_km": 120, "drive_time_hours": 2.5, "road_type": "tarmac" },
    { "id": "route_002", "from": "Tarangire", "to": "Ngorongoro", "distance_km": 160, "drive_time_hours": 3.5, "road_type": "mixed" },
    { "id": "route_003", "from": "Ngorongoro", "to": "Serengeti Central", "distance_km": 145, "drive_time_hours": 4, "road_type": "dirt" },
    { "id": "route_004", "from": "Arusha", "to": "Lake Manyara", "distance_km": 125, "drive_time_hours": 2, "road_type": "tarmac" },
    { "id": "route_005", "from": "Tarangire", "to": "Karatu", "distance_km": 110, "drive_time_hours": 2, "road_type": "tarmac" },
    { "id": "route_006", "from": "Karatu", "to": "Ngorongoro", "distance_km": 20, "drive_time_hours": 0.5, "road_type": "dirt" },
    { "id": "route_007", "from": "Serengeti Central", "to": "Northern Serengeti", "distance_km": 150, "drive_time_hours": 5, "road_type": "dirt" },
    { "id": "route_008", "from": "Northern Serengeti", "to": "Serengeti Central", "distance_km": 150, "drive_time_hours": 5, "road_type": "dirt" },
    { "id": "route_009", "from": "Serengeti Central", "to": "Ngorongoro", "distance_km": 145, "drive_time_hours": 4, "road_type": "dirt" },
    { "id": "route_010", "from": "Ngorongoro", "to": "Tarangire", "distance_km": 160, "drive_time_hours": 3.5, "road_type": "mixed" },
    { "id": "route_011", "from": "Lake Manyara", "to": "Ngorongoro", "distance_km": 60, "drive_time_hours": 1.5, "road_type": "dirt" },
    { "id": "route_012", "from": "Ngorongoro", "to": "Arusha", "distance_km": 190, "drive_time_hours": 4, "road_type": "tarmac" },
    { "id": "route_013", "from": "Tarangire", "to": "Serengeti Central", "distance_km": 280, "drive_time_hours": 5.5, "road_type": "mixed" }
  ],
  "activities": [
    { "id": "act_002", "name": "Crater Tour", "duration": "half_day", "parks": ["park_002"] },
    { "id": "act_003", "name": "Walking Safari", "duration": "2-3 hours", "parks": ["park_003", "park_002"] },
    { "id": "act_004", "name": "Balloon Safari", "duration": "Early morning (2 hours)", "parks": ["park_001", "park_003"] },
    { "id": "act_005", "name": "Maasai Boma Visit", "duration": "1.5 hours", "areas": ["Mto wa Mbu", "Ngorongoro"] }
  ],
  "seasons": [
    { "month": "March-May", "type": "rainy", "effects": ["muddy roads", "avoid western Serengeti", "longer drive times"] },
    { "month": "June-October", "type": "dry", "effects": ["best wildlife viewing", "animals near water sources"] },
    { "month": "January-February", "type": "calving", "effects": ["Ndutu best for migration", "predator action high"] }
  ],
  "rules": [
    { "condition": "rainy season", "action": "avoid western serengeti routes" },
    { "condition": "client wants big cats", "action": "prioritize central serengeti" },
    { "condition": "migration july-october", "action": "send to northern serengeti" },
    { "condition": "short safari (<=3 days)", "action": "avoid serengeti, suggest tarangire + ngorongoro" }
  ]
};

interface Lodge {
  name: string;
  category: string;
  price_range: string;
  inside_park?: boolean;
  usp?: string;
}

interface AlternativeOption {
  title: string;
  description: string;
  reasoning: string;
  new_to?: string;
  new_from?: string;
  cascaded_next_day_description?: string;
  cascaded_next_day_reasoning?: string;
  cascaded_next_day_tip?: string;
  triggers_regeneration?: boolean;
  new_lodge?: Lodge;
  new_activities?: string[];
}

export interface DayPlan {
  day: number;
  from: string;
  to: string;
  drive_time: string;
  departure_time: string;
  activities: string[];
  lodge: Lodge;
  is_lodge_fixed?: boolean;
  detailed_description: string;
  reasoning: string;
  client_selection_summary?: string;
  permit_entry?: {
    gate: string;
    time: string;
  };
  permit_exit_deadline?: {
    gate: string;
    time: string;
  };
  permit_extension?: {
    park: string;
    days: number;
    reasoning: string;
  };
  permit_advisory?: string;
  alternatives?: AlternativeOption[];
  expert_tip?: string;
}

interface Summary {
  total_days: number;
  route_overview: string;
  best_for: string[];
  flight_logic_summary?: string;
}

interface PricingEstimate {
  park_fees: number;
  lodging: number;
  transport: number;
  total_estimate: number;
  total_range: string;
  lodging_avg: string;
}

interface Itinerary {
  summary: Summary;
  itinerary: DayPlan[];
  pricing_estimate: PricingEstimate;
}

export default function App() {
  const [days, setDays] = useState<number>(7);
  const [interests, setInterests] = useState<string[]>(['wildlife']);
  const [season, setSeason] = useState<string>('July');
  const [flightPref, setFlightPref] = useState<string>('none');
  
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [originalItinerary, setOriginalItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lodgeAlerts, setLodgeAlerts] = useState<Record<number, string>>({});
  const [selectedDay, setSelectedDay] = useState<DayPlan | null>(null);
  const [activeTab, setActiveTab] = useState<"view" | "customize" | "map" | "cost" | "consultant">("view");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [activityConfirm, setActivityConfirm] = useState<{day: number, activity: string, action: 'add' | 'remove'} | null>(null);
  
  // Cost Summary State
  const [paxAdults, setPaxAdults] = useState<number>(2);
  const [paxChildren, setPaxChildren] = useState<number>(0);
  const [roomType, setRoomType] = useState<string>('double');

  const toggleInterest = (id: string) => {
    setInterests(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleLodgeChange = (dayNumber: number, newLodgeName: string) => {
    if (!itinerary) return;
    
    const newLodgeData = SAFARI_DATABASE.lodges.find(l => l.name === newLodgeName);
    if (!newLodgeData) return;
    
    const parkData = SAFARI_DATABASE.parks.find(p => p.id === newLodgeData.park_id);
    const parkName = parkData ? parkData.name.replace(" National Park", "").replace(" Conservation Area", "") : "";

    setLodgeAlerts(prev => {
        const next = { ...prev };
        delete next[dayNumber];
        return next;
    });

    const updatedItinerary = {
      ...itinerary,
      itinerary: itinerary.itinerary.map(d => {
        if (d.day === dayNumber) {
          const oldLodgeName = d.lodge.name;
          const usp = newLodgeData.usp || "provides an excellent base for your safari activities";
          
          // 1. Surgical regex cleanup to remove standard stay justifications if they exist (prevents stacking)
          // Also look for specific AI-like sentences about staying at a place
          let cleanReasoning = d.reasoning
            .replace(/We've selected .*? for our stay because it .*?\.\s*/g, "")
            .replace(/We've chosen .*? as it .*?\.\s*/g, "")
            .replace(/We've switched to .*? because .*?\.\s*/g, "");
            
          let cleanDetailedDescription = d.detailed_description
            .replace(/Our accommodation for tonight is the .*?, which .*?\.\s*/g, "")
            .replace(/We will be staying at .*?, which .*?\.\s*/g, "");

          // 2. If the old name is mentioned in the narrative text (not in our markers), replace it to keep consistency
          // But only if we aren't already replacing the whole sentence via the regex above
          if (cleanReasoning.includes(oldLodgeName)) {
              cleanReasoning = cleanReasoning.split(oldLodgeName).join(newLodgeData.name);
          }
          if (cleanDetailedDescription.includes(oldLodgeName)) {
              cleanDetailedDescription = cleanDetailedDescription.split(oldLodgeName).join(newLodgeData.name);
          }

          const newReasoning = `We've selected ${newLodgeData.name} strategically as it ${usp}. This positioning is ideal for our route logistics. ${cleanReasoning.trim()}`;
          const newDetailedDescription = cleanDetailedDescription.trim();
          
          // Limit length to keep it clean
          const finalReasoning = newReasoning.length > 450 ? newReasoning.substring(0, 447) + "..." : newReasoning;

          const updated: DayPlan = {
            ...d,
            detailed_description: newDetailedDescription,
            lodge: {
              name: newLodgeData.name,
              category: newLodgeData.category,
              price_range: `$${newLodgeData.price_usd.low} - $${newLodgeData.price_usd.high}`,
              inside_park: newLodgeData.inside_park,
              usp: newLodgeData.usp
            },
            reasoning: finalReasoning,
            expert_tip: `Niche Insight: ${newLodgeData.inside_park ? "At this specific lodge, the wildlife often visits the property at dawn; keep your binoculars ready even before breakfast." : "The gardens here attract a variety of highland sunbirds that you won't easily spot once we descend into the dryer plains below."}`
          };
          if (parkName) updated.to = parkName;
          return updated;
        }
        if (parkName && d.day === dayNumber + 1) {
          return { ...d, from: parkName };
        }
        return d;
      })
    };
    
    setItinerary(updatedItinerary);
    
    if (selectedDay && selectedDay.day === dayNumber) {
      setSelectedDay(updatedItinerary.itinerary.find(d => d.day === dayNumber) || null);
    }
  };

  const handleActivityToggle = (dayNumber: number, activity: string) => {
    if (!itinerary) return;
    
    const day = itinerary.itinerary.find(d => d.day === dayNumber);
    if (!day) return;

    const isAdding = !day.activities.includes(activity);
    
    // Set for confirmation prompt
    setActivityConfirm({ day: dayNumber, activity, action: isAdding ? 'add' : 'remove' });
  };

  const performActivityToggle = (dayNumber: number, activity: string) => {
    if (!itinerary) return;
    
    const updatedItinerary = {
      ...itinerary,
      itinerary: itinerary.itinerary.map(d => {
        if (d.day === dayNumber) {
          const currentActivities = d.activities;
          const newActivities = currentActivities.includes(activity)
            ? currentActivities.filter(a => a !== activity)
            : [...currentActivities, activity];
          
          // Surgically update reasoning if we add/remove activity
          let newReasoning = d.reasoning;
          if (activity === "Balloon Safari" && !currentActivities.includes(activity)) {
              newReasoning = `Including a Balloon Safari over the plains at dawn for an unforgettable aerial perspective. ${newReasoning}`;
          } else if (activity === "Maasai Boma Visit" && !currentActivities.includes(activity)) {
              newReasoning = `Adding a Maasai Boma visit to provide authentic cultural insight into the local heritage. ${newReasoning}`;
          } else if (activity === "Walking Safari" && !currentActivities.includes(activity)) {
              newReasoning = `Incorporating a walking safari to experience the bush from a different, closer perspective. ${newReasoning}`;
          }

          return { ...d, activities: newActivities, reasoning: newReasoning };
        }
        return d;
      })
    };
    
    setItinerary(updatedItinerary);
  };

  const handleRemoveDay = (dayIndex: number) => {
    if (!itinerary) return;
    
    // Check if we have at least 2 days so we don't delete the whole itinerary
    if (itinerary.itinerary.length <= 1) {
        setError("Cannot delete the only day in the itinerary.");
        return;
    }

    const updatedDays = [...itinerary.itinerary];
    updatedDays.splice(dayIndex, 1);
    
    // Renumber days
    updatedDays.forEach((day, idx) => {
        day.day = idx + 1;
    });

    // Patch the routing from the previous to the next day if we deleted an intermediate day
    if (dayIndex > 0 && dayIndex < updatedDays.length) {
       updatedDays[dayIndex].from = updatedDays[dayIndex - 1].to;
    }

    const newItinerary = {
        ...itinerary,
        summary: {
           ...itinerary.summary,
           total_days: updatedDays.length
        },
        itinerary: updatedDays
    };

    setItinerary(newItinerary);
  };

  const handleDestinationChange = (dayNumber: number, field: 'from' | 'to', value: string) => {
    if (!itinerary) return;
    
    // Lodge validity check when changing 'to' destination
    if (field === 'to') {
        const currentDay = itinerary.itinerary.find(d => d.day === dayNumber);
        if (currentDay) {
            const dummyDay = { ...currentDay, to: value };
            const availableLodges = getAvailableLodges(dummyDay);
            const isCurrentLodgeValid = availableLodges.some(l => l.name === currentDay.lodge.name);
            
            if (!isCurrentLodgeValid && value.trim().length > 3) {
                setLodgeAlerts(prev => ({
                    ...prev,
                    [dayNumber]: `Destination changed to ${value}. Current lodge (${currentDay.lodge.name}) may not be located here. Please select an available lodge.`
                }));
            } else if (isCurrentLodgeValid) {
                setLodgeAlerts(prev => {
                    const next = { ...prev };
                    delete next[dayNumber];
                    return next;
                });
            }
        }
    }

    const updatedItinerary = {
      ...itinerary,
      itinerary: itinerary.itinerary.map(d => {
        if (d.day === dayNumber) {
          return { ...d, [field]: value };
        }
        // Cascade: If we change 'to', the next day's 'from' should update
        if (field === 'to' && d.day === dayNumber + 1) {
          return { ...d, from: value };
        }
        // Cascade: If we change 'from', the previous day's 'to' should update
        if (field === 'from' && d.day === dayNumber - 1) {
          return { ...d, to: value };
        }
        return d;
      })
    };
    
    setItinerary(updatedItinerary);
  };

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleSelectAlternative = (dayNumber: number, alt: AlternativeOption) => {
    applyAlternative(dayNumber, alt);
  };

  const applyAlternative = async (dayNumber: number, alt: AlternativeOption) => {
    if (!alt || !itinerary) return;

    // Helper to map destination string (which might be a lodge) to a park name
    const mapToArea = (dest: string | undefined): string | undefined => {
      if (!dest) return undefined;
      // Check if it's a lodge name
      const lodge = SAFARI_DATABASE.lodges.find(l => l.name.toLowerCase().includes(dest.toLowerCase()) || dest.toLowerCase().includes(l.name.toLowerCase()));
      if (lodge) {
          const park = SAFARI_DATABASE.parks.find(p => p.id === lodge.park_id);
          if (park) {
              if ((lodge as any).zone) {
                  const zoneInfo = SAFARI_DATABASE.serengeti_zones.find((z: any) => z.id === (lodge as any).zone);
                  if (zoneInfo) return `${zoneInfo.name.split(' ')[0]} Serengeti`;
              }
              return park.name.replace(" National Park", "").replace(" Conservation Area", "");
          }
      }
      return dest;
    };

    let finalTo = mapToArea(alt.new_to);
    let finalFrom = mapToArea(alt.new_from);

    // Default to resolving by lodge if not explicitly provided
    if (!finalTo && alt.new_lodge) {
       const matchedLodge = SAFARI_DATABASE.lodges.find(l => l.name === alt.new_lodge?.name);
       if (matchedLodge) {
           const park = SAFARI_DATABASE.parks.find(p => p.id === matchedLodge.park_id);
           if (park) {
               if ((matchedLodge as any).zone) {
                   const zoneInfo = SAFARI_DATABASE.serengeti_zones.find((z: any) => z.id === (matchedLodge as any).zone);
                   if (zoneInfo) finalTo = `${zoneInfo.name.split(' ')[0]} Serengeti`;
               } else {
                   finalTo = park.name.replace(" National Park", "").replace(" Conservation Area", "");
               }
           }
       }
    }

    const currentDay = itinerary.itinerary.find(d => d.day === dayNumber);
    if (!currentDay) return;

    const destinationChanged = finalTo && finalTo !== currentDay.to;
    let suggestedLodge = alt.new_lodge;
    let lodgeAlertMessage = "";

    if (!suggestedLodge && destinationChanged) {
        // We defer to `getAvailableLodges` logic which accurately filters by zone
        const dummyDay = { ...currentDay, to: finalTo! };
        const availableLodges = getAvailableLodges(dummyDay);
        
        const isCurrentLodgeValid = availableLodges.some(l => l.name === currentDay.lodge.name);
        
        if (!isCurrentLodgeValid) {
            // Lodge is invalid for the new destination. DO NOT try to auto-pick, set error state!
            lodgeAlertMessage = `You've changed your destination to ${finalTo}. Your previous accommodation (${currentDay.lodge.name}) is no longer in this area. Please select a new lodge.`;
            suggestedLodge = {
                name: "⚠️ Action Required: Select Lodge",
                category: "",
                price_range: "",
                inside_park: false
            };
            
            setLodgeAlerts(prev => ({
                ...prev,
                [dayNumber]: lodgeAlertMessage
            }));
        }
    } else {
        // Clear any previous alerts if they just picked a valid option
        setLodgeAlerts(prev => {
            const next = { ...prev };
            delete next[dayNumber];
            return next;
        });
    }

    const updatedItinerary = {
      ...itinerary,
      itinerary: itinerary.itinerary.map(d => {
        if (d.day === dayNumber) {
          let updatedDescription = alt.description;
          let updatedReasoning = alt.reasoning;

          if (suggestedLodge && suggestedLodge.name !== "⚠️ Action Required: Select Lodge" && suggestedLodge.name !== d.lodge.name && !updatedReasoning.includes(suggestedLodge.name)) {
              updatedReasoning = `We've selected ${suggestedLodge.name} as a strategic base. ${updatedReasoning}`;
          }

          return {
            ...d,
            detailed_description: updatedDescription,
            reasoning: updatedReasoning,
            client_selection_summary: alt.title,
            to: finalTo || d.to,
            from: finalFrom || d.from,
            lodge: suggestedLodge || d.lodge,
            is_lodge_fixed: !!alt.new_lodge,
            activities: alt.new_activities || d.activities
          };
        }
        
        // Next day propagation
        if (d.day === dayNumber + 1 && !alt.triggers_regeneration) {
          const currentDayDest = finalTo || itinerary.itinerary.find(prev => prev.day === dayNumber)?.to;
          if (!currentDayDest) return d;
          
          const newFrom = currentDayDest;
          let cascadedDescription = alt.cascaded_next_day_description || d.detailed_description;
          let cascadedReasoning = alt.cascaded_next_day_reasoning || d.reasoning;
          let cascadedDriveTime = d.drive_time;
          let cascadedTip = alt.cascaded_next_day_tip || d.expert_tip;
          let cascadedClientSummary = d.client_selection_summary;
          
          // Even if newFrom == d.from, we still want to apply the cascaded text fields if the API returned them.
          if (newFrom !== d.from || alt.cascaded_next_day_description) {
              const oldFrom = d.from;
              const route = SAFARI_DATABASE.routes.find(r => 
                  (r.from.toLowerCase() === newFrom.toLowerCase() && r.to.toLowerCase() === d.to.toLowerCase()) ||
                  (r.to.toLowerCase() === newFrom.toLowerCase() && r.from.toLowerCase() === d.to.toLowerCase())
              );
              
              if (route) {
                  cascadedDriveTime = `${route.drive_time_hours} hours (${route.distance_km}km)`;
              }
              
              if (!alt.cascaded_next_day_description && newFrom !== d.from) {
                  const replaceRegex = new RegExp(oldFrom, 'gi');
                  cascadedDescription = cascadedDescription.replace(replaceRegex, newFrom);
                  cascadedReasoning = cascadedReasoning.replace(replaceRegex, newFrom);
                  if (cascadedTip) {
                      cascadedTip = cascadedTip.replace(replaceRegex, newFrom);
                  }
                  
                  if (!cascadedReasoning.includes(`Since you altered yesterday's destination to ${newFrom}`)) {
                      cascadedReasoning = `Since you altered yesterday's destination to ${newFrom}, today's route logically begins here. ${cascadedReasoning}`;
                  }
              }

              if (newFrom !== d.from) {
                  cascadedClientSummary = `Adjusted starting point to ${newFrom} based on previous day's choice`;
              } else if (alt.cascaded_next_day_description) {
                  cascadedClientSummary = `Updated based on previous day's choice`;
              }
          }
          
          return { ...d, from: newFrom, drive_time: cascadedDriveTime, detailed_description: cascadedDescription, reasoning: cascadedReasoning, expert_tip: cascadedTip, client_selection_summary: cascadedClientSummary };
        }
        
        // Previous day backward propagation
        if (d.day === dayNumber - 1 && !alt.triggers_regeneration) {
          const currentDaySource = finalFrom || itinerary.itinerary.find(next => next.day === dayNumber)?.from;
          if (!currentDaySource) return d;
          
          const newTo = currentDaySource;
          let cascadedDescription = d.detailed_description;
          let cascadedReasoning = d.reasoning;
          let cascadedDriveTime = d.drive_time;
          let cascadedTip = d.expert_tip;
          
          if (newTo !== d.to) {
              const oldTo = d.to;
              const route = SAFARI_DATABASE.routes.find(r => 
                  (r.from.toLowerCase() === d.from.toLowerCase() && r.to.toLowerCase() === newTo.toLowerCase()) ||
                  (r.to.toLowerCase() === d.from.toLowerCase() && r.from.toLowerCase() === newTo.toLowerCase())
              );
              
              if (route) {
                  cascadedDriveTime = `${route.drive_time_hours} hours (${route.distance_km}km)`;
              }
              
              const replaceRegex = new RegExp(oldTo, 'gi');
              cascadedDescription = cascadedDescription.replace(replaceRegex, newTo);
              cascadedReasoning = cascadedReasoning.replace(replaceRegex, newTo);
              if (cascadedTip) {
                  cascadedTip = cascadedTip.replace(replaceRegex, newTo);
              }
              
              if (!cascadedReasoning.includes(`Your upcoming departure from ${newTo} changes`)) {
                  cascadedReasoning = `Your upcoming departure from ${newTo} changes our endpoint for today to ${newTo}. ${cascadedReasoning}`;
              }
          }
          
          return { ...d, to: newTo, drive_time: cascadedDriveTime, detailed_description: cascadedDescription, reasoning: cascadedReasoning, expert_tip: cascadedTip };
        }
        return d;
      })
    };
    
    setItinerary(updatedItinerary);

    if (alt.triggers_regeneration) {
      setIsAddingDay(true);
      setError(null);
      try {
        const lockedDays = updatedItinerary.itinerary.slice(0, dayNumber);
        
        const response = await fetch("/api/regenerate-forward", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            lockedDays,
            remainingOriginalDays: itinerary.itinerary.slice(dayNumber),
            originalTotalDays: itinerary.summary.total_days,
            interests,
            season,
            flightPref
          }),
        });

        if (!response.ok) {
          throw new Error("Failed to regenerate remaining days.");
        }

        const remainingDays = await response.json();
        
        const newItineraryDayArray = [...lockedDays, ...remainingDays];
        
        setItinerary({
          ...updatedItinerary,
          summary: {
             ...updatedItinerary.summary,
             total_days: newItineraryDayArray.length
          },
          itinerary: newItineraryDayArray
        });
        setOriginalItinerary(prev => prev ? {
          ...prev,
          summary: {
             ...prev.summary,
             total_days: newItineraryDayArray.length
          },
          itinerary: newItineraryDayArray
        } : prev);
        
      } catch (err: any) {
        console.error("Error regenerating days:", err);
        setError(err.message || "Failed to regenerate subsequent days.");
      } finally {
        setIsAddingDay(false);
      }
    }
  };

  const finalizeCustomization = () => {
    setSaveStatus('saving');
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => {
          setSaveStatus('idle');
          setActiveTab('view');
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }, 1500);
    }, 800);
  };

  const getAvailableLodges = (day: DayPlan) => {
    // Area to Park mapping for common destinations that aren't exact park names
    const areaMapping: Record<string, string> = {
      'olduvai': 'park_002', // Olduvai is in Ngorongoro
      'ndutu': 'park_002',   // Ndutu is in Ngorongoro Conservation Area
      'karatu': 'park_005',
      'mto wa mbu': 'park_004',
      'lake eyasi': 'park_005',
      'seronera': 'park_001',
      'kogatende': 'park_001',
      'grumeti': 'park_001'
    };

    const toLower = day.to.toLowerCase();
    
    let parkId: string | undefined = undefined;
    let requiredZone: string | undefined = undefined;

    // Evaluate Serengeti Zones explicitly first
    if (toLower.includes("serengeti") || toLower.includes("ndutu") || toLower.includes("kogatende") || toLower.includes("grumeti") || toLower.includes("seronera")) {
      parkId = "park_001";
      if (toLower.includes("central") || toLower.includes("seronera")) requiredZone = "zone_001";
      else if (toLower.includes("ndutu") || toLower.includes("south")) requiredZone = "zone_002";
      else if (toLower.includes("western") || toLower.includes("grumeti")) requiredZone = "zone_003";
      else if (toLower.includes("northern") || toLower.includes("kogatende")) requiredZone = "zone_004";
    } else {
       parkId = Object.entries(areaMapping).find(([key]) => toLower.includes(key))?.[1];
       if (!parkId) {
          const park = SAFARI_DATABASE.parks.find(p => 
            toLower.includes(p.name.toLowerCase().replace(" national park", "").replace(" conservation area", "").trim()) || 
            p.name.toLowerCase().includes(toLower) ||
            p.landmarks?.some(l => toLower.includes(l.toLowerCase()))
          );
          parkId = park?.id;
       }
    }

    if (!parkId) return [];
    
    let lodges = SAFARI_DATABASE.lodges.filter(l => l.park_id === parkId);
    if (requiredZone) {
      lodges = lodges.filter(l => (l as any).zone === requiredZone);
    }
    
    return lodges;
  };

  const getAvailableActivities = (day: DayPlan) => {
    return SAFARI_DATABASE.activities.filter(act => {
      // 1. Remove "Crater Tour" from general list - it should be logically scheduled by AI or special
      if (act.name === "Crater Tour") return false;

      // 2. Maasai Boma Visit (Mto wa Mbu area and Ngorongoro area)
      if (act.name === "Maasai Boma Visit") {
          const text = `${day.from} ${day.to}`.toLowerCase();
          return text.includes("mto wa mbu") || text.includes("ngorongoro") || text.includes("crater") || text.includes("karatu");
      }

      // 3. Identify current target park/area for other activities
      const areaMapping: Record<string, string> = {
        'olduvai': 'park_002',
        'ndutu': 'park_002',
        'karatu': 'park_005',
        'mto wa mbu': 'park_004',
        'seronera': 'park_001',
        'kogatende': 'park_001',
        'grumeti': 'park_001'
      };
      
      const toLower = day.to.toLowerCase();
      const mappedParkId = Object.entries(areaMapping).find(([key]) => toLower.includes(key))?.[1];
      
      const parkId = mappedParkId || SAFARI_DATABASE.parks.find(p => 
        toLower.includes(p.name.toLowerCase().replace(" national park", "").replace(" conservation area", "").trim()) || 
        p.name.toLowerCase().includes(toLower) ||
        p.landmarks?.some(l => toLower.includes(l.toLowerCase()))
      )?.id;

      // Special activity rules
      if (act.name === "Walking Safari") {
          return parkId === 'park_003' || parkId === 'park_002'; // Tarangire or Ngorongoro
      }
      if (act.name === "Balloon Safari") {
          // Balloon Safari must start from where you wake up (the 'from' location)
          const fromLower = day.from.toLowerCase();
          const fromParkId = SAFARI_DATABASE.parks.find(p => 
            fromLower.includes(p.name.toLowerCase().replace(" national park", "").replace(" conservation area", "").trim()) || 
            p.name.toLowerCase().includes(fromLower) ||
            p.landmarks?.some(l => fromLower.includes(l.toLowerCase()))
          )?.id;
          return fromParkId === 'park_001' || fromParkId === 'park_003';
      }

      // Generic park check if act has parks list
      if (act.parks) {
          return act.parks.includes(parkId || "");
      }

      return true;
    });
  };

  const resetDay = (idx: number) => {
    if (!itinerary || !originalItinerary) return;
    const updated = { ...itinerary };
    updated.itinerary[idx] = { ...originalItinerary.itinerary[idx] };
    delete updated.itinerary[idx].client_selection_summary;
    
    // Also handle cascading 'from' for the next day if we changed the destination back
    if (updated.itinerary[idx+1]) {
        const resetTo = updated.itinerary[idx].to;
        const targetDay = updated.itinerary[idx+1];
        
        if (targetDay.from !== resetTo) {
            const oldFrom = targetDay.from;
            targetDay.from = resetTo;
            
            // Revert route stats
            const route = SAFARI_DATABASE.routes.find(r => 
                (r.from.toLowerCase() === resetTo.toLowerCase() && r.to.toLowerCase() === targetDay.to.toLowerCase()) ||
                (r.to.toLowerCase() === resetTo.toLowerCase() && r.from.toLowerCase() === targetDay.to.toLowerCase())
            );
            
            if (route) {
                targetDay.drive_time = `${route.drive_time_hours} hours (${route.distance_km}km)`;
            }
            
            const replaceRegex = new RegExp(oldFrom, 'gi');
            targetDay.detailed_description = targetDay.detailed_description.replace(replaceRegex, resetTo);
            targetDay.reasoning = targetDay.reasoning.replace(replaceRegex, resetTo);
            if (targetDay.expert_tip) {
                targetDay.expert_tip = targetDay.expert_tip.replace(replaceRegex, resetTo);
            }
            
            targetDay.reasoning = targetDay.reasoning.replace(new RegExp(`Since you altered yesterday's destination to .*?, today's route logically begins here. `, 'gi'), '');
        }
    }
    
    setItinerary(updated);
  };

  const [isAddingDay, setIsAddingDay] = useState(false);
  const [addDayConfirm, setAddDayConfirm] = useState(false);

  const handleAddExtraDay = async () => {
    if (!itinerary || itinerary.itinerary.length === 0) return;
    
    setIsAddingDay(true);
    setProgress(0);
    setError(null);
    
    const startTime = Date.now();
    const assumedDuration = 10000; // 10 seconds for a single day add
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(95, (elapsed / assumedDuration) * 100);
      setProgress(newProgress);
    }, 100);

    try {
      const response = await fetch("/api/add-day", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          currentItinerary: itinerary.itinerary,
          interests,
          season,
          flightPref
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to generate extra day.");
      }

      const newDay = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 400));

      const newItineraryDayArray = [...itinerary.itinerary, newDay];
      
      setItinerary({
        ...itinerary,
        summary: {
           ...itinerary.summary,
           total_days: newItineraryDayArray.length
        },
        itinerary: newItineraryDayArray
      });
      setOriginalItinerary(prev => prev ? {
        ...prev,
        summary: {
           ...prev.summary,
           total_days: newItineraryDayArray.length
        },
        itinerary: newItineraryDayArray
      } : prev);
      
      setAddDayConfirm(false);
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("Error adding day:", err);
      setError(err.message || "Failed to add extra day.");
    } finally {
      setIsAddingDay(false);
    }
  };

  const generateItinerary = async () => {
    if (interests.length === 0) {
      setError("Please select at least one interest.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setError(null);
    setItinerary(null);

    const startTime = Date.now();
    const assumedDuration = 25000; // 25 seconds typical generation time
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const newProgress = Math.min(95, (elapsed / assumedDuration) * 100);
      setProgress(newProgress);
    }, 100);

    try {
      const prompt = `
        You are a PROFESSIONAL Tanzania safari planner with deep real-world experience.
        You think like a safari guide, not a generic AI.
        You use REAL geography, REAL driving routes, and REAL safari logic.
        
        INPUT:
        - Number of days: ${days}
        - Interests: ${interests.join(', ')}
        - Season (month): ${season}
        - Flight Preference: ${flightPref}
        - Starting location: Arusha
        
        DATABASE (SOURCE OF TRUTH):
        ${JSON.stringify(SAFARI_DATABASE, null, 2)}
        
        CORE OBJECTIVE:
        Generate a LOGICAL, REALISTIC, and HIGH-QUALITY safari itinerary.
        IMPORTANT: Keep descriptions, reasoning, and expert_tips highly concise (1-2 sentences maximum). Do not generate overly long text block otherwise your response will be severely truncated.
        - EXPLICIT TRAVEL STRATEGY REQUIREMENT: In the \`route_overview\` field (which acts as the Travel Strategy card), you MUST explain why you chose this specific route. If the user did NOT explicitly select "great-migration" in their interests, but your route either aligns with it by coincidence of season or explicitly ignores it because they didn't ask for it, you MUST explain that decision regarding the Great Migration in the \`route_overview\` text.

        PLANNING LOGIC (VERY IMPORTANT):
        1. PARK SELECTION:
           - NEVER add Lake Manyara National Park or Arusha National Park directly to the main itinerary UNLESS the client's interests explicitly include "bird-watching". Put them strictly as options in 'alternatives'.
           - Maximize time spent in parks. The backbone of a safari is time logistics—plan to maximize park time without forcing an extension.
           - Short trips (<=3 days): Tarangire + Ngorongoro
           - 4–6 days: Add Serengeti
           - 7+ days: Include Serengeti zones strategically
        2. SERENGETI ZONE LOGIC:
           - GREAT MIGRATION REQUIREMENT: ${interests.includes('great-migration') ? `The client explicitly selected "Great Migration". You MUST follow the migration and STRICTLY PRIORITIZE the migration area by maximizing the number of days spent there! For their season (${season}): Jan-Mar -> Ndutu, Apr-Jun -> Central/Western, Jul-Oct -> Northern, Nov-Dec -> Central/South. Allocate the OVERWHELMING MAJORITY of their days to this specific region.` : `The client did NOT select "Great Migration". You MUST NOT build the itinerary around following the migration! Do NOT prioritize the migration areas in number of days or routing. Guide them to general wildlife areas with strong resident wildlife like Central Serengeti, and ignore the migration calendar.`}
           - Big cats → Central Serengeti
           - Photography → mix of zones
        3. ROUTING & LOGISTICS:
           - Use ONLY realistic routes from routes table
           - UNSOLICITED ACTIVITIES: ABSOLUTELY DO NOT add Cultural Visits (e.g., Mto wa Mbu, Maasai Boma, banana plantations, local markets, cultural village tour) to the itinerary UNLESS the client explicitly selected the "Cultural Visits" ('cultural') interest! This is a strict constraint. Put them strictly as options in 'alternatives' instead.
           - Following logical driving order: Arusha → Tarangire/Manyara → Ngorongoro → Serengeti.
           - KARATU TO SERENGETI TIMING ISSUE: Karatu to Naabi Hill Gate (Serengeti entry) takes 3-4 hours. To avoid long travel, do Crater on the way IN to Serengeti (Day 2), not the way OUT.
           - STANDARD 7-DAY FLOW:
             Day 1: Arusha -> Karatu (via Tarangire game drive).
             Day 2: Karatu -> Ngorongoro Crater -> Serengeti (Central or Migration zone).
             Day 3: Serengeti game drive.
             Day 4: Serengeti game drive.
             Day 5: Serengeti -> Karatu.
             Day 6: Karatu -> Lake Manyara or Tarangire -> Karatu (or Arusha).
             Day 7: Karatu -> Arusha.
           - STANDARD 5-DAY FLOW WITHOUT EARLY FLIGHT:
             Day 1: Arusha -> Tarangire -> Karatu (Do NOT use Manyara on Day 1 unless "bird-watching" requested; offer it as an alternative).
             Day 2: Karatu -> Ngorongoro Crater -> Serengeti Central.
             Day 3-4: Serengeti Central game drive.
             Day 5: Serengeti Central to Arusha.
           - NEVER DRIVE NORTHERN SERENGETI TO ARUSHA IN ONE DAY: This is a 10-12 hour drive. It is IMPOSSIBLE for a standard safari. 
             - If the client is in Northern Serengeti and needs to return to Arusha by road, they MUST have an intermediate stop.
             - Alternatively, recommend a FLIGHT OUT from Kogatende to Arusha.
           - FLIGHTS: If client prefers "Flight In", "Flight Out", or "Both", adjust the route. 
             - Flight In: Arusha -> Fly to Serengeti -> Drive back via Ngorongoro/Tarangire.
             - Flight Out: Arusha -> Drive to Tarangire -> Ngorongoro -> Serengeti -> Fly back to Arusha.
             - Explain the pros/cons of their flight choice in "flight_logic_summary".
           - NEVER create straight-line or unrealistic travel.
           - DAY 1 STRICT RULE: Day 1 should ALWAYS be Arusha -> Karatu (via Tarangire game drive) (unless a flight is involved). 
             Crucially, in the \`alternatives\` array for Day 1, you MUST include an option to "Spend a night in Tarangire inside the park". The title should include a warning. The reasoning must explicitly mention: "Warning: This will automatically add an extra day to your itinerary to accommodate the change." You MUST set \`triggers_regeneration: true\` on this specific alternative object.
           - ALTERNATIVES: You MUST provide at least 3 distinct and rich alternative route options or experiences for EACH DAY. 
           - EXTRA NIGHT RULE (STRICT MANDATE): For EVERY SINGLE DAY in the itinerary where the destination (or main park) is NOT Karatu AND it is not the final day of the safari, you ABSOLUTELY MUST include one alternative option to "Spend an extra night in [Location]". The title MUST include "(Adds 1 Day)". The reasoning MUST explicitly mention: "Warning: This will automatically add an extra day to your itinerary to accommodate the change." You MUST set \`triggers_regeneration: true\` on this specific alternative object. This applies to Serengeti, Ngorongoro, Tarangire, etc. Do not skip this!
           - TARANGIRE 2 NIGHTS EXIT RULE: If a guest stays in Tarangire for 2 nights, and the next day they have to exit the park (e.g. 6 to 8 hours game drive before exit), they MUST NOT stay in Karatu afterwards. Their next stay MUST be inside the Ngorongoro Conservation Area.
           - SERENGETI TO CRATER RULE: If a guest is coming from Serengeti and has a Ngorongoro Crater activity, priority MUST be to stay in the Ngorongoro Conservation Area, NOT Karatu.
           - NGORONGORO CRATER TO ENDING POINT: When leaving Ngorongoro Crater to end the safari, you MUST provide options to either return directly to Arusha or stay overnight in Karatu.
           - KARATU OVERUSE: Do NOT default to Karatu for every intermediate stop. 
             - Staying INSIDE the parks (Tarangire, Serengeti, Ngorongoro Rim) is preferred for a high-end experience.
             - Karatu is a town stop; use it only for "Mid-range" or "Budget" repositioning, or for specific farm-house requests.
             - Consider Lake Manyara National Park as an alternative waypoint.
           - Include drive_time per leg
        4. CONSERVATION AREA GAME DRIVES (STRICT RULE):
           - In the Ngorongoro Conservation Area (NCAA), the ONLY area where general game drives are allowed is the Ndutu area.
           - Outside of Ndutu, the only activity in NCAA is the Crater Tour (going down into the crater).
           - Do NOT include general game drives in the general Conservation Area unless staying in/visiting Ndutu.
        5. NGORONGORO CRATER:
           - If "crater-full" is an interest, schedule a "Full Day Crater Game Drive" (6+ hours).
           - Otherwise, a standard 4-5 hour crater tour is usual.
        6. SEASON ADJUSTMENT:
           - Rainy season: Avoid difficult roads, Increase drive time
           - Dry season: Prioritize water sources
        7. LODGE SELECTION (STRICT AREA LOGIC):
           - Each day's lodge MUST be located in the "to" destination.
           - NEVER suggest a lodge in Tarangire if the guest is finishing the day in Serengeti or Ngorongoro.
           - NEVER stay at Gibb's Farm (Karatu) if the day involves visiting Olduvai Gorge and moving toward Serengeti. That's a 3-hour backtrack. 
           - If visiting Olduvai or Crater, stay at Ngorongoro Serena/Crater Lodge (Inside) or Ndutu (Park exit). 
           - Stay at Gibb's Farm ONLY if the day ends in Karatu (Repositioning day).
           - PREFERRED in Karatu: If a user has "luxury" preference or just needs a highly recommended place in Karatu, heavily PREFER "The Retreat Ngorongoro". 
           - PREFERRED in Arusha: If a day starts/ends in Arusha and requires a stay, strongly prefer "The African Tulip".
           - NEGATIVE GUIDANCE: If going to Ndutu, write the location precisely as 'Ndutu' instead of general 'Serengeti'.
           - CATEGORIZE lodges: 
             - "Inside the Park" (inside_park: true) - Usually more expensive, includes park fees for the night.
             - "Outside the Park" (inside_park: false) - Usually in nearby towns like Karatu or Mto wa Mbu.
           - Match user budget (budget/mid/luxury based on interests, default to mid)
           - Select lodges from correct park + zone
           - Avoid random lodge selection
        8. DAILY STRUCTURE:
           - Each day must include: route (from/to), drive_time, departure_time (realistic: 07:00–09:00), activities, lodge (with inside_park field)
        9. SMART GUIDE BEHAVIOR:
           - Stay LOGICAL: If moving from Karatu to Northern Serengeti, staying in Tarangire is IMPOSSIBLE. The lodge must be in Northern Serengeti (or Central Serengeti as a backup if travel time allows).
           - Balance travel vs game drives
           - Position client in best wildlife areas
        10. DETAILED EXPLANATIONS:
           - For each day, provide a detailed_description (4-5 sentences) titled "Full Day Narrative". TONE: Immersive and highly descriptive, painting a picture of the safari experience. AVOID logistics, driving details, or lodge names here. Focus on the sights, smells, and magic of the bush.
           - For each day, provide a reasoning (3-4 sentences) titled "Guide's Advice". TONE: Practical and strategic. Focus on planning, logical reasoning, and helpful advice for the guest.
           - Make the explanations professional and evocative.
        11. EXPERT INSIDER TIPS:
           - Provide an expert_tip for each day (1-2 sentences). TONE: Highlight a niche detail or a 'pro-tip' that only a local guide would know (e.g., "Look for the specific leopard that frequents the sausage tree near the Seronera river").
        12. TANZANIA PARK PERMIT LOGIC & TIME CONFLICTS (24-HOUR RULE):
           - Standard permits in Tanzania National Parks (TANAPA) and Ngorongoro (NCAA) are valid for 24 hours from time of entry.
           - NGORONGORO TRANSIT FEE: If the client goes and returns through the Ngorongoro Conservation Area (e.g. Arusha -> Serengeti -> Arusha by road) a Ngorongoro Transit Fee MUST be paid twice.
           - ENTRY/EXIT TIMES: You MUST track entry and exit times.
             - If entering Ngorongoro Loduare Gate at 2:00 PM on Day 2, the permit expires at 2:00 PM on Day 3.
             - Staying 2 nights in Serengeti requires 2 x 24h fees.
           - SCENARIO: If a guest lands at Seronera at 10:30 AM (Day 1) and stays 3 nights, they MUST exit Naabi Hill Gate by 10:30 AM on Day 4. 
           - PROBLEM: This often cuts Day 4 game drives short or makes it geographically impossible to reach the gate in time (e.g. Ndutu to Loduare takes 3-4 hours, so an 9:00 AM deadline is impossible without driving in the dark).
           - RESOLUTION: If the schedule creates a conflict or an impossible drive, you MUST AUTOMATICALLY ADD a \`permit_extension\` object. Set \`days\` to 1 (usually 1 extra day fee), \`park\` to the park name (e.g., "Ngorongoro Conservation Area"), and explain in \`reasoning\`. The UI will automatically charge the customer for this extension.
           - CRITICAL GATES:
             - Loduare Gate: Entrance to Ngorongoro from Karatu/Manyara.
             - Naabi Hill Gate: Entrance/Exit between Ngorongoro and Serengeti.
           - CALCULATE: For each day, determine if a "permit_entry" or "permit_exit_deadline" or "permit_extension" applies. Be precise.
        12. CUSTOMIZATION TAB ENRICHMENT (ALTERNATIVES):
           - The "Customize Plan" page needs to add NEW value, not just repeat the itinerary.
           - For EACH day, provide 2-3 distinct "alternatives" that actually change the logistics.
           - For each alternative, provide:
             - title: Short and punchy (e.g., "Stay Inside the Park").
             - description: 3-4 sentences of the NEW narrative for this choice.
             - reasoning: Why this is a valid choice (e.g., "Saves 2 hours of driving but lodge costs are 40% higher").
             - new_to: (Optional) The new destination if this choice changes where the guest ends the day.
             - new_from: (Optional) The new starting point if it changes.
             - cascaded_next_day_description: (Required IF new_to is provided). Write the entire detailed description for the NEXT day, so it correctly acknowledges this new starting location, rather than us trying to guess it.
             - cascaded_next_day_reasoning: (Required IF new_to is provided). The new reasoning for the NEXT day, continuing logically from this new origin.
             - cascaded_next_day_tip: (Required IF new_to is provided). A valid expert tip for the NEXT day that matches the new flow.
           - EXAMPLE choices:
             - Tarangire -> Ngorongoro (Stay inside Ngorongoro) vs Tarangire -> Karatu (Stay in Karatu as a cheaper option/farm-house stay).
             - Karatu -> Ngorongoro (Crater Tour) -> Karatu vs Karatu -> Ngorongoro (Crater Tour) -> Serengeti (Long drive, but wake up in Serengeti).
             - Ngorongoro (Crater Tour) -> Arusha (Return to Arusha to finish the trip) vs Ngorongoro (Crater Tour) -> Karatu (Stay overnight in Karatu to break the journey).
           - Add an "expert_tip" for each day (e.g., "Ask your guide to pack lunch boxes to avoid backtracking to the lodge at noon").
      `;

      const response = await fetch("/api/itinerary", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days, interests, season, flightPref, prompt }),
      });

      if (!response.ok) {
        let errorMessage = `Server error (${response.status})`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          // If response is not JSON, try to get text error
          try {
            const text = await response.text();
            if (text && text.length < 500) errorMessage = text;
          } catch (e2) {}
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      clearInterval(progressInterval);
      setProgress(100);
      await new Promise(resolve => setTimeout(resolve, 400));
      
      console.log("Generated Itinerary Data:", data);
      setItinerary(data);
      setOriginalItinerary(JSON.parse(JSON.stringify(data))); // Deep copy for resetting
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error("Itinerary Generation Error:", err);
      setError(err.message || "An error occurred while generating the itinerary.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20">
      <AnimatePresence>
        {isAddingDay && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm"
          >
            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center max-w-sm mx-4">
              <div className="w-full h-1.5 bg-safari-accent/20 rounded-full overflow-hidden mb-6">
                <motion.div 
                  className="h-full bg-safari-accent"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ ease: "linear", duration: 0.1 }}
                />
              </div>
              <h3 className="font-serif text-xl font-bold text-center text-safari-text tracking-tight mb-2">Analyzing Route</h3>
              <p className="text-sm text-safari-muted text-center leading-relaxed">
                We're carefully recalibrating your itinerary to ensure seamless logistics and logical routing...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section */}
      <div className="relative h-[45vh] min-h-[400px] flex items-center justify-center overflow-hidden print:hidden border-b-[6px] border-safari-accent">
        <div className="absolute inset-0 bg-[#FCFBFA] opacity-90 z-0">
          <img 
            src="https://images.unsplash.com/photo-1516426122078-c23e76319801?q=60&w=1200&auto=format&fit=crop" 
            alt="Tanzania Safari" 
            className="w-full h-full object-cover mix-blend-multiply opacity-50 z-0"
            referrerPolicy="no-referrer"
            loading="eager"
          />
        </div>
        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto flex flex-col items-center">
          <div className="w-16 h-[1px] bg-safari-accent mb-6"></div>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-6xl md:text-[6rem] lg:text-[6rem] leading-none font-serif text-safari-text mb-6 drop-shadow-sm tracking-widest"
          >
            Safari Sandbox
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-lg md:text-xl leading-relaxed text-safari-text/80 font-light tracking-widest uppercase max-w-2xl"
          >
            Craft your perfect journey through the Serengeti, Ngorongoro, and beyond.
          </motion.p>
          <div className="w-16 h-[1px] bg-safari-accent mt-8 delay-200"></div>
        </div>
      </div>

      <main className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 lg:px-8 -mt-16 print:mt-0 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
          
          {/* Form (Left Column on Desktop) */}
          <div className="lg:col-span-3 space-y-6 print:hidden">
            <Card className="border border-safari-accent/20 shadow-2xl shadow-black/5 rounded-none bg-white">
              <CardHeader className="bg-safari-bg/80 border-b border-safari-accent/10 pb-8 pt-8">
                <CardTitle className="font-serif text-3xl tracking-tight text-safari-text text-center">Design Your Safari</CardTitle>
                <CardDescription className="text-safari-muted text-center font-light mt-2 uppercase tracking-widest text-xs">Expertly Crafted Itineraries</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                
                {/* Duration */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <Label className="text-base font-medium text-safari-text flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-safari-accent" />
                      Duration
                    </Label>
                    <span className="font-serif text-xl text-safari-accent font-semibold">{days} Days</span>
                  </div>
                  <Slider 
                    value={days} 
                    onValueChange={(v) => setDays(Array.isArray(v) ? v[0] : v as number)} 
                    min={1} 
                    max={14} 
                    step={1}
                    className="py-4"
                  />
                </div>

                {/* Season */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-safari-text flex items-center gap-2">
                    <Sun className="w-4 h-4 text-safari-accent" />
                    Travel Month
                  </Label>
                  <Select value={season} onValueChange={setSeason}>
                    <SelectTrigger className="w-full h-12 rounded-xl border-safari-accent/20 focus:ring-safari-accent">
                      <SelectValue placeholder="Select a month" />
                    </SelectTrigger>
                    <SelectContent>
                      {MONTHS.map(m => (
                        <SelectItem key={m} value={m}>{m}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Flight Preference */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-safari-text flex items-center gap-2">
                    <Clock className="w-4 h-4 text-safari-accent" />
                    Transport Preference
                  </Label>
                  <Select value={flightPref} onValueChange={setFlightPref}>
                    <SelectTrigger className="w-full h-12 rounded-xl border-safari-accent/20 focus:ring-safari-accent">
                      <SelectValue placeholder="Driving or Flights?" />
                    </SelectTrigger>
                    <SelectContent>
                      {FLIGHT_OPTIONS.map(opt => (
                        <SelectItem key={opt.id} value={opt.id}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Interests */}
                <div className="space-y-3">
                  <Label className="text-base font-medium text-safari-text flex items-center gap-2">
                    <Compass className="w-4 h-4 text-safari-accent" />
                    Interests & Style
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {INTEREST_OPTIONS.map(interest => {
                      const isSelected = interests.includes(interest.id);
                      return (
                        <Badge 
                          key={interest.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`cursor-pointer px-4 py-2 rounded-none text-xs tracking-wider uppercase transition-all duration-300 ${
                            isSelected 
                              ? 'bg-safari-accent hover:bg-safari-accent-hover text-white border-transparent shadow-md' 
                              : 'bg-transparent hover:bg-safari-bg text-safari-muted border-safari-muted/30'
                          }`}
                          onClick={() => toggleInterest(interest.id)}
                        >
                          {interest.label}
                        </Badge>
                      );
                    })}
                  </div>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 text-red-600 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <Button 
                  onClick={generateItinerary} 
                  disabled={loading}
                  className="w-full h-14 rounded-full bg-safari-accent hover:bg-safari-accent/90 text-white font-medium text-base tracking-[0.2em] uppercase shadow-md transition-all relative overflow-hidden group border border-safari-accent/50"
                >
                  <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out"></div>
                  <span className="relative flex items-center justify-center">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Crafting Itinerary...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Itinerary
                    </>
                  )}
                  </span>
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Itinerary (Right Column on Desktop) */}
          <div className="lg:col-span-9 print:col-span-full">
            <AnimatePresence mode="wait">
              {loading ? (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col items-center justify-center h-full min-h-[400px] space-y-4"
                >
                  <div className="w-full max-w-sm h-1.5 bg-safari-accent/20 rounded-full overflow-hidden mb-2">
                    <motion.div 
                      className="h-full bg-safari-accent"
                      initial={{ width: "0%" }}
                      animate={{ width: `${progress}%` }}
                      transition={{ ease: "linear", duration: 0.1 }}
                    />
                  </div>
                  <p className="text-safari-muted font-serif text-xl italic">Consulting local guides...</p>
                </motion.div>
              ) : itinerary ? (
                <motion.div 
                  key="itinerary"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="space-y-8 pb-20"
                >
                  <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
                    <div className="bg-white/95 backdrop-blur shadow-md border border-safari-accent/20 p-4 md:px-6 flex flex-col md:flex-row justify-between items-end gap-4 mb-8">
                      <TabsList className="bg-transparent p-0 h-auto gap-6 rounded-none justify-start w-full md:w-auto border-b border-safari-accent/20 pb-0">
                        <TabsTrigger value="view" className="text-safari-muted hover:text-safari-accent rounded-none px-0 pb-3 pt-2 text-sm uppercase tracking-widest font-semibold border-b-2 border-transparent data-active:border-safari-accent data-active:bg-transparent data-active:shadow-none data-active:text-safari-accent translate-y-[1px]">View Itinerary</TabsTrigger>
                        <TabsTrigger value="customize" className="text-safari-muted hover:text-safari-accent rounded-none px-0 pb-3 pt-2 text-sm uppercase tracking-widest font-semibold border-b-2 border-transparent data-active:border-safari-accent data-active:bg-transparent data-active:shadow-none data-active:text-safari-accent translate-y-[1px] flex items-center gap-2">
                          <Settings2 className="w-4 h-4" />
                          Customize
                        </TabsTrigger>
                        <TabsTrigger value="map" className="text-safari-muted hover:text-safari-accent rounded-none px-0 pb-3 pt-2 text-sm uppercase tracking-widest font-semibold border-b-2 border-transparent data-active:border-safari-accent data-active:bg-transparent data-active:shadow-none data-active:text-safari-accent translate-y-[1px] flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          Interactive Map
                        </TabsTrigger>
                        <TabsTrigger value="cost" className="text-safari-muted hover:text-safari-accent rounded-none px-0 pb-3 pt-2 text-sm uppercase tracking-widest font-semibold border-b-2 border-transparent data-active:border-safari-accent data-active:bg-transparent data-active:shadow-none data-active:text-safari-accent translate-y-[1px] flex items-center gap-2">
                          <Receipt className="w-4 h-4" />
                          Cost Summary
                        </TabsTrigger>
                        <TabsTrigger value="consultant" className="text-safari-muted hover:text-safari-accent rounded-none px-0 pb-3 pt-2 text-sm uppercase tracking-widest font-semibold border-b-2 border-transparent data-active:border-safari-accent data-active:bg-transparent data-active:shadow-none data-active:text-safari-accent translate-y-[1px] flex items-center gap-2">
                          <Users className="w-4 h-4" />
                          Consultant
                        </TabsTrigger>
                      </TabsList>
                      
                      <div className="flex gap-2 w-full md:w-auto pb-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger render={
                              <Button 
                                variant="outline"
                                className="rounded-xl border-safari-accent/20 hover:bg-safari-accent/5 flex-1 md:flex-auto flex items-center justify-center gap-2"
                                onClick={() => {
                                  // Add tiny delay to ensure everything is rendered, then print
                                  setTimeout(() => window.print(), 100);
                                }}
                              >
                                <Printer className="w-4 h-4" />
                                Print PDF
                              </Button>
                            } />
                            <TooltipContent>Download your planned adventure</TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    </div>

                    <TabsContent value="view" className="space-y-8 mt-0">
                      {/* Summary Section */}
                      <Card className="border border-safari-accent/20 shadow-2xl shadow-black/5 rounded-none bg-white">
                        <div className="bg-safari-text p-10 text-white relative overflow-hidden">
                          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')] opacity-20 mix-blend-overlay"></div>
                          <div className="absolute top-0 right-0 w-64 h-64 bg-safari-accent/20 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                            <div>
                              <Badge className="bg-safari-accent text-white rounded-none uppercase tracking-[0.2em] text-[10px] mb-4 px-3 py-1">Adventure Summary</Badge>
                              <h2 className="text-4xl md:text-5xl lg:text-[56px] font-serif leading-tight mb-4 tracking-widest drop-shadow-sm text-[#FCFBFA]">The Wild Heart of Tanzania</h2>
                              <p className="text-lg md:text-xl leading-relaxed text-[#FCFBFA]/80 max-w-xl italic font-light tracking-wide">"{itinerary.summary.route_overview}"</p>
                            </div>
                            <div className="flex flex-col items-end gap-2 text-right">
                              <span className="text-xs font-medium uppercase tracking-[0.2em] opacity-60 text-safari-accent">Base Estimate</span>
                              <span className="text-4xl lg:text-5xl font-serif text-safari-accent drop-shadow-sm">${itinerary.pricing_estimate.total_estimate}</span>
                              <span className="text-xs opacity-60 text-[#FCFBFA]/70">({itinerary.pricing_estimate.total_range} - based on 2 Guests)</span>
                            </div>
                          </div>
                        </div>

                        <CardContent className="p-8">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold tracking-widest text-safari-muted">Duration</p>
                              <p className="text-lg font-serif text-safari-text flex items-center gap-2">
                                <Clock className="w-4 h-4 text-safari-accent" />
                                {itinerary.summary.total_days} Days
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold tracking-widest text-safari-muted">Pace</p>
                              <p className="text-lg font-serif text-safari-text flex items-center gap-2">
                                <Sun className="w-4 h-4 text-safari-accent" />
                                Interactive
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold tracking-widest text-safari-muted">Season</p>
                              <p className="text-lg font-serif text-safari-text flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-safari-accent" />
                                {season}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-[10px] uppercase font-bold tracking-widest text-safari-muted">Experience</p>
                              <p className="text-lg font-serif text-safari-text flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-safari-accent" />
                                Premium
                              </p>
                            </div>
                          </div>

                          {itinerary.summary.flight_logic_summary && (
                            <div className="bg-safari-bg/30 p-6 rounded-2xl border border-safari-accent/10 mb-8 flex gap-4">
                              <div className="bg-safari-accent/10 p-3 rounded-full h-fit">
                                <Sun className="w-6 h-6 text-safari-accent" />
                              </div>
                              <div>
                                <h3 className="font-serif text-xl md:text-2xl text-safari-text mb-1 tracking-wide">Travel Strategy</h3>
                                <p className="text-base text-safari-muted leading-[1.8]">
                                  {itinerary.summary.flight_logic_summary}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Summary Highlights */}
                          <div className="flex flex-wrap gap-2 mb-8">
                            {itinerary.summary.best_for.map((item, i) => (
                              <Badge key={i} variant="secondary" className="bg-safari-bg text-safari-accent border-safari-accent/10 px-4 py-1.5 rounded-full text-xs">
                                {item}
                              </Badge>
                            ))}
                          </div>

                          <div className="bg-amber-50/30 p-6 rounded-2xl border border-amber-200/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
                            <div className="flex items-start gap-4">
                              <div className="bg-amber-100 p-3 rounded-xl shrink-0">
                                <AlertTriangle className="w-6 h-6 text-amber-700" />
                              </div>
                              <div>
                                <h4 className="font-bold text-lg text-amber-900 mb-1 tracking-wide">Safari Budget Transparency</h4>
                                <p className="text-sm md:text-base text-amber-800 leading-[1.8] max-w-md">The base estimate is {itinerary.pricing_estimate.total_range} for 2 adults over {itinerary.itinerary.length} days. Excludes international flights. <strong className="font-black">See the Cost Summary tab for exact group pricing with children and room types.</strong></p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Day by Day Accordion */}
                      <Accordion type="single" className="space-y-4">
                        {itinerary.itinerary.map((dayPlan, index) => (
                          <AccordionItem key={index} value={`day-${dayPlan.day}`} className="border-none">
                            <AccordionTrigger className="hover:no-underline py-0 group">
                              <Card className="flex-1 border border-safari-accent/10 shadow-sm hover:shadow-md hover:border-safari-accent/30 rounded-none transition-all bg-white text-left">
                                <div className="p-6 md:p-8 flex items-center justify-between w-full gap-4">
                                  <div className="flex items-center gap-6">
                                    <div className="flex flex-col items-center justify-center w-12 shrink-0 border-r border-safari-accent/20 pr-6">
                                      <span className="text-[10px] uppercase font-bold tracking-widest text-safari-accent mb-1">Day</span>
                                      <span className="font-serif text-3xl text-safari-text leading-none">{dayPlan.day}</span>
                                    </div>
                                    <div className="pl-2">
                              <h3 className="text-2xl md:text-3xl font-serif font-medium tracking-wide text-safari-text group-hover:text-safari-accent transition-colors relative inline-block after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[2px] after:bottom-0 after:left-0 after:bg-safari-accent after:origin-bottom-right after:transition-transform after:duration-300 group-hover:after:scale-x-100 group-hover:after:origin-bottom-left">
                                        {dayPlan.from} → {dayPlan.to}
                                      </h3>
                                      <div className="flex gap-4 mt-2">
                                        <span className="text-xs text-safari-muted flex items-center gap-1 uppercase tracking-wider font-medium">
                                          <Clock className="w-3 h-3 text-safari-accent" /> {dayPlan.drive_time}
                                        </span>
                                        <span className="text-xs text-safari-muted flex items-center gap-1 uppercase tracking-wider font-medium">
                                          <Tent className="w-3 h-3 text-safari-accent" /> {dayPlan.lodge.name}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                  <Badge className="bg-transparent text-safari-accent border border-safari-accent/20 rounded-none tracking-widest uppercase text-[10px] md:flex hidden group-hover:bg-safari-accent group-hover:text-white transition-colors">Details</Badge>
                                </div>
                              </Card>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 pb-8 space-y-6">
                              <div className="grid md:grid-cols-2 gap-8 px-4">
                                  <div className="space-y-4">
                                    <h4 className="text-xl md:text-2xl font-serif font-medium tracking-wide text-safari-accent flex items-center gap-2">
                                      <Sparkles className="w-6 h-6" /> Detailed Adventure Plan
                                    </h4>
                                    <p className="text-lg md:text-xl leading-[1.8] text-safari-text">
                                      {dayPlan.detailed_description}
                                    </p>
                                    
                                    {dayPlan.expert_tip && (
                                      <div className="bg-safari-accent/5 p-4 rounded-xl border border-safari-accent/10 flex gap-3">
                                        <Sparkles className="w-5 h-5 text-safari-accent shrink-0" />
                                        <p className="text-xs text-safari-text font-serif italic">Expert Tip: "{dayPlan.expert_tip}"</p>
                                      </div>
                                    )}

                                    {dayPlan.permit_advisory && (
                                      <div className="bg-amber-100/50 p-4 rounded-xl border border-amber-200 flex gap-3">
                                        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0" />
                                        <div>
                                          <p className="text-[10px] font-bold text-amber-800 uppercase tracking-widest mb-0.5">Time Logisics Advisory</p>
                                          <p className="text-xs text-amber-900 leading-relaxed">{dayPlan.permit_advisory}</p>
                                        </div>
                                      </div>
                                    )}

                                    <div className="bg-safari-bg/50 p-4 rounded-xl border border-safari-accent/10">
                                      <p className="text-xs font-bold uppercase tracking-wider text-safari-muted mb-2">Planning Reasoning</p>
                                      <p className="text-sm italic text-safari-text">"{dayPlan.reasoning}"</p>
                                    </div>
                                  </div>
                                <div className="space-y-4">
                                  <h4 className="text-xl md:text-2xl font-serif font-medium tracking-wide text-safari-accent flex items-center gap-2">
                                    <Camera className="w-6 h-6" /> Highlights & Activities
                                  </h4>
                                  <ul className="grid grid-cols-1 gap-4 mt-2">
                                    {dayPlan.activities.map((act, i) => (
                                      <li key={i} className="flex items-center gap-3 text-lg leading-relaxed text-safari-text">
                                        <div className="w-1.5 h-1.5 rounded-full bg-safari-accent" />
                                        {act}
                                      </li>
                                    ))}
                                  </ul>
                                  <Separator className="bg-safari-accent/10" />
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-[10px] uppercase font-bold text-safari-muted tracking-widest">Accommodation</p>
                                      <p className="font-bold text-safari-text">{dayPlan.lodge.name}</p>
                                      <p className="text-xs text-safari-muted">{dayPlan.lodge.category} Comfort • {dayPlan.lodge.price_range}</p>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </TabsContent>

                    <TabsContent value="customize" className="mt-0">
                      <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="p-8 border-b border-safari-accent/5">
                          <CardTitle className="text-4xl md:text-5xl tracking-widest font-serif text-safari-text flex items-center gap-3">
                            <Settings2 className="w-8 h-8 md:w-10 md:h-10 text-safari-accent" />
                            Customize Your Journey
                          </CardTitle>
                          <CardDescription className="text-lg md:text-xl leading-relaxed text-safari-muted">
                            Adjust destinations, swap activities, or refine your stays. Every change updates your plan in real-time.
                          </CardDescription>
                        </CardHeader>
                        <CardContent className="p-0">
                          <div className="p-6 bg-safari-bg/30 border-b border-safari-accent/5 flex justify-between items-center group">
                            <div className="flex items-center gap-3">
                                <div className="bg-safari-accent p-2 rounded-xl text-white">
                                    <Edit3 className="w-4 h-4" />
                                </div>
                                <div>
                                    <p className="text-xs font-bold text-safari-text uppercase tracking-widest">Global Plan Controls</p>
                                    <p className="text-[10px] text-safari-muted">Review and commit all your changes at once</p>
                                </div>
                            </div>
                            <Button 
                                size="sm" 
                                className="rounded-full px-6 bg-safari-accent hover:bg-safari-accent/90 shadow-lg group-hover:scale-105 transition-transform"
                                onClick={finalizeCustomization}
                                disabled={saveStatus !== 'idle'}
                            >
                                {saveStatus === 'saving' ? (
                                    <Loader2 className="w-3 h-3 animate-spin mr-2" />
                                ) : saveStatus === 'saved' ? (
                                    <Check className="w-3 h-3 mr-2" />
                                ) : (
                                    <Sparkles className="w-3 h-3 mr-2" />
                                )
                                }
                                Save & Finish
                            </Button>
                          </div>
                          <div className="divide-y divide-safari-accent/5">
                            {itinerary.itinerary.map((day, idx) => (
                              <div key={idx} className="p-8 hover:bg-safari-bg/10 transition-colors">
                                <div className="flex flex-col lg:flex-row gap-8">
                                  {/* Day Info */}
                                  <div className="lg:w-48 text-center bg-safari-bg/30 p-6 rounded-2xl h-fit border border-safari-accent/5">
                                    <p className="text-xs font-bold uppercase tracking-widest text-safari-muted mb-1">Day</p>
                                    <p className="text-4xl font-serif text-safari-accent mb-4">{day.day}</p>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="w-full text-safari-muted hover:text-safari-accent"
                                      onClick={() => resetDay(idx)}
                                    >
                                      Reset Day
                                    </Button>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="w-full text-red-500 hover:text-red-700 hover:bg-red-50 mt-2"
                                      onClick={() => handleRemoveDay(idx)}
                                    >
                                      <Trash2 className="w-3 h-3 mr-1" /> Delete Day
                                    </Button>
                                  </div>

                                  {/* Editing Section */}
                                  <div className="flex-1 space-y-6">
                                    <div className="grid md:grid-cols-2 gap-6">
                                      <div className="space-y-4">
                                        <Label className="text-safari-muted font-bold text-xs uppercase tracking-widest">Routing</Label>
                                        <div className="flex items-center gap-2">
                                          <div className="flex-1 relative">
                                            <input 
                                              value={day.from}
                                              onChange={(e) => handleDestinationChange(day.day, 'from', e.target.value)}
                                              className="w-full bg-safari-bg/50 border border-safari-accent/10 rounded-xl px-4 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-safari-accent/20"
                                            />
                                            <Badge className="absolute -top-2.5 left-3 bg-white border border-safari-accent/20 text-safari-muted text-[8px] px-1">FROM</Badge>
                                          </div>
                                          <ArrowRight className="w-4 h-4 text-safari-muted" />
                                          <div className="flex-1 relative">
                                            <input 
                                              value={day.to}
                                              onChange={(e) => handleDestinationChange(day.day, 'to', e.target.value)}
                                              className="w-full bg-safari-bg/50 border border-safari-accent/10 rounded-xl px-4 py-3 h-12 focus:outline-none focus:ring-2 focus:ring-safari-accent/20"
                                            />
                                            <Badge className="absolute -top-2.5 left-3 bg-white border border-safari-accent/20 text-safari-muted text-[8px] px-1">TO</Badge>
                                          </div>
                                        </div>
                                        <div className="grid gap-3">
                                          <div className="p-4 rounded-xl bg-safari-bg/50 border border-safari-accent/5">
                                              <p className="text-[10px] font-bold text-safari-muted uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                  <Info className="w-3 h-3" />
                                                  Guide's Original Advice
                                              </p>
                                              <p className="text-xs text-safari-text leading-relaxed italic">{originalItinerary?.itinerary[idx]?.reasoning || day.reasoning}</p>
                                          </div>
                                          
                                          {day.client_selection_summary && (
                                            <div className="p-4 rounded-xl bg-safari-accent/5 border border-safari-accent/10">
                                                <p className="text-[10px] font-bold text-safari-accent uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                    <Sparkles className="w-3 h-3" />
                                                    Client Choice: {day.client_selection_summary}
                                                </p>
                                                <p className="text-xs text-safari-text leading-relaxed">{day.reasoning}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>

                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <Label className="text-safari-muted font-bold text-xs uppercase tracking-widest">Activities</Label>
                                          <Button variant="ghost" size="sm" className="h-6 text-[10px] text-safari-accent">
                                            <Plus className="w-3 h-3 mr-1" /> Add Custom
                                          </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                          {getAvailableActivities(day).map(act => (
                                            <Badge 
                                              key={act.id} 
                                              variant={day.activities.includes(act.name) ? "default" : "outline"}
                                              className={`cursor-pointer px-3 py-1.5 rounded-lg transition-all ${
                                                day.activities.includes(act.name) 
                                                  ? "bg-safari-accent hover:bg-safari-accent/90" 
                                                  : "border-safari-accent/20 text-safari-muted hover:bg-safari-accent/5"
                                              }`}
                                              onClick={() => handleActivityToggle(day.day, act.name)}
                                            >
                                              {day.activities.includes(act.name) && <Check className="w-3 h-3 mr-1.5" />}
                                              {act.name}
                                            </Badge>
                                          ))}
                                        </div>
                                        <div className="space-y-2 mt-4">
                                          <Label className="text-safari-muted font-bold text-xs uppercase tracking-widest">Accommodation</Label>
                                          <div className={cn("flex items-center gap-4 bg-white border p-4 rounded-2xl", lodgeAlerts[day.day] ? "border-red-300 bg-red-50/10" : "border-safari-accent/10")}>
                                             <div className={cn("p-2 rounded-lg", lodgeAlerts[day.day] ? "bg-red-100" : "bg-safari-bg")}>
                                                <Tent className={cn("w-5 h-5", lodgeAlerts[day.day] ? "text-red-600" : "text-safari-accent")} />
                                             </div>
                                             <div className="flex-1">
                                                <p className={cn("font-bold text-sm", lodgeAlerts[day.day] ? "text-red-700" : "text-safari-text")}>{day.lodge.name}</p>
                                                <p className="text-[10px] text-safari-muted">{day.lodge.category} comfort</p>
                                             </div>
                                             <Button 
                                                variant={lodgeAlerts[day.day] ? "default" : "outline"}
                                                size="sm" 
                                                className={cn("rounded-xl h-8 text-xs", lodgeAlerts[day.day] && "bg-red-600 hover:bg-red-700 text-white border-0")} 
                                                onClick={() => setSelectedDay(day)}
                                             >
                                                Swap
                                             </Button>
                                          </div>
                                          {lodgeAlerts[day.day] && (
                                            <div className="bg-red-50 text-red-700 text-[11px] p-3 rounded-xl flex items-start gap-2 mt-2">
                                              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                              <p>{lodgeAlerts[day.day]}</p>
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="space-y-4">
                                        <Label className="text-safari-muted font-bold text-xs uppercase tracking-widest">Full Day Narrative</Label>
                                        <textarea 
                                            value={day.detailed_description}
                                            onChange={(e) => {
                                                if (!itinerary) return;
                                                const updated = { ...itinerary };
                                                updated.itinerary[idx].detailed_description = e.target.value;
                                                setItinerary(updated);
                                            }}
                                            className="w-full bg-safari-bg/30 border border-safari-accent/10 rounded-xl px-4 py-3 min-h-[120px] text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-safari-accent/20"
                                        />
                                    </div>

                                    <Separator className="bg-safari-accent/5" />

                                    {day.expert_tip && (
                                      <div className="bg-safari-accent/5 p-5 rounded-2xl border border-safari-accent/20 flex gap-4">
                                        <div className="bg-safari-accent text-white p-2 rounded-xl h-fit">
                                          <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                          <p className="text-[10px] font-bold uppercase tracking-widest text-safari-accent mb-1">Expert Insider Tip</p>
                                          <p className="text-sm text-safari-text font-serif italic">"{day.expert_tip}"</p>
                                        </div>
                                      </div>
                                    )}

                                    {day.alternatives && day.alternatives.length > 0 && (
                                      <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                          <Label className="text-safari-muted font-bold text-xs uppercase tracking-widest">Alternative Route Options</Label>
                                        </div>
                                        <div className="grid md:grid-cols-2 gap-4">
                                          {day.alternatives.map((alt, ai) => {
                                            const isCurrentlyActive = day.detailed_description === alt.description;
                                            const visualSelected = isCurrentlyActive;

                                            return (
                                              <div 
                                                key={ai} 
                                                className={cn(
                                                  "group cursor-pointer p-5 rounded-2xl transition-all active:scale-[0.98] border-2",
                                                  visualSelected 
                                                    ? "bg-safari-bg border-safari-accent shadow-md" 
                                                    : "bg-white border-safari-accent/10 hover:border-safari-accent/40 hover:shadow-sm"
                                                )}
                                                onClick={() => handleSelectAlternative(day.day, alt)}
                                              >
                                                <div className="flex justify-between items-start mb-2">
                                                  <h5 className={cn("font-serif font-bold", visualSelected ? "text-safari-accent" : "text-safari-text")}>{alt.title}</h5>
                                                  <div className={cn(
                                                    "text-[8px] px-2 py-0.5 rounded-full font-bold uppercase transition-opacity",
                                                    isCurrentlyActive ? "bg-safari-accent text-white opacity-100" : "bg-safari-bg text-safari-accent opacity-0 group-hover:opacity-100"
                                                  )}>
                                                    {isCurrentlyActive ? "Current Route" : "Select This"}
                                                  </div>
                                                </div>
                                                <p className="text-xs text-safari-muted leading-relaxed mb-3">{alt.description}</p>
                                                <div className={cn(
                                                  "p-3 rounded-lg border",
                                                  visualSelected ? "bg-white/50 border-safari-accent/20" : "bg-safari-bg/50 border-safari-accent/5"
                                                )}>
                                                  <p className="text-[9px] font-bold uppercase text-safari-muted mb-1">Why choose this?</p>
                                                  <p className="text-[10px] italic text-safari-text">"{alt.reasoning}"</p>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}

                            <div className="px-6 py-8 border-b border-safari-accent/10 bg-white">
                                {!addDayConfirm ? (
                                    <Button 
                                      variant="outline" 
                                      className="w-full h-16 rounded-full border-dashed border-2 border-safari-accent/40 text-safari-accent hover:bg-safari-accent hover:text-white transition-all font-bold text-lg shadow-sm tracking-wide"
                                      onClick={() => setAddDayConfirm(true)}
                                    >
                                      <Plus className="w-5 h-5 mr-3" /> Add an Extra Day
                                    </Button>
                                ) : (
                                    <div className="bg-safari-accent/5 border border-safari-accent/20 p-8 rounded-3xl text-center shadow-inner max-w-2xl mx-auto">
                                        <h4 className="text-2xl font-serif text-safari-text tracking-wide mb-3">Add Extra Day</h4>
                                        <p className="text-safari-muted mb-6 leading-relaxed text-lg">
                                            We'll analyze your current ending location and thoughtfully generate an additional day, ensuring you end up seamlessly at a logical departure point (e.g., Arusha, Kilimanjaro, or Zanzibar).
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <Button variant="outline" className="rounded-full px-8 h-12 font-bold tracking-wide" onClick={() => setAddDayConfirm(false)}>
                                                Cancel
                                            </Button>
                                            <Button 
                                                className="rounded-full px-8 h-12 bg-safari-accent text-white font-bold hover:bg-safari-accent/90 tracking-wide" 
                                                onClick={handleAddExtraDay}
                                                disabled={isAddingDay}
                                            >
                                                {isAddingDay ? (
                                                    <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Analyzing Route...</>
                                                ) : (
                                                    <><Plus className="mr-2 h-5 w-5" /> Generate Extra Day</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-12 flex justify-center bg-safari-bg/10">
                                <Button 
                                    size="lg" 
                                    className="rounded-full px-12 py-7 text-lg font-serif bg-safari-accent hover:bg-safari-accent/90 shadow-xl overflow-hidden group"
                                    onClick={finalizeCustomization}
                                    disabled={saveStatus !== 'idle'}
                                >
                                    {saveStatus === 'saving' ? (
                                        <Loader2 className="w-5 h-5 animate-spin mr-3" />
                                    ) : saveStatus === 'saved' ? (
                                        <Check className="w-5 h-5 mr-3" />
                                    ) : (
                                        <Sparkles className="w-5 h-5 mr-3 group-hover:rotate-12 transition-transform" />
                                    )}
                                    {saveStatus === 'saving' ? "Optimizing Final Logistics..." : saveStatus === 'saved' ? "Itinerary Updated!" : "Update Complete Itinerary"}
                                </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </TabsContent>
                    
                    <TabsContent value="map" className="mt-0">
                        <Suspense fallback={<div className="h-[600px] flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-safari-accent" /></div>}>
                          <SafariMap itinerary={itinerary.itinerary} />
                        </Suspense>
                    </TabsContent>

                    <TabsContent value="cost" className="mt-0">
                      <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-safari-accent" /></div>}>
                        <CostSummary 
                          itinerary={itinerary.itinerary} 
                          adults={paxAdults}
                          setAdults={setPaxAdults}
                          childrenCount={paxChildren}
                          setChildren={setPaxChildren}
                          roomType={roomType}
                          setRoomType={setRoomType}
                        />
                      </Suspense>
                    </TabsContent>

                    <TabsContent value="consultant" className="mt-0">
                      <Suspense fallback={<div className="h-64 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-safari-accent" /></div>}>
                        <ConsultantTab 
                          level={interests.includes('luxury') ? 'luxury' : interests.includes('budget') ? 'budget' : 'mid-range'} 
                          interests={interests} 
                          paxChildren={paxChildren} 
                        />
                      </Suspense>
                    </TabsContent>
                  </Tabs>
                </motion.div>
              ) : (
                <motion.div 
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-safari-accent/20 rounded-3xl bg-white/50"
                >
                  <div className="w-20 h-20 bg-safari-bg rounded-full flex items-center justify-center mb-6">
                    <Compass className="w-10 h-10 text-safari-accent opacity-50" />
                  </div>
                  <h3 className="text-4xl md:text-5xl lg:text-[56px] font-serif text-safari-text mb-2 tracking-widest leading-tight">Ready to Explore?</h3>
                  <p className="text-lg md:text-xl leading-relaxed text-safari-muted max-w-md">
                    Select your preferences on the left and let our AI craft a realistic, geographically accurate safari itinerary tailored just for you.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </main>

      {/* Selected Day Modal */}
      <Dialog open={!!selectedDay} onOpenChange={(open) => !open && setSelectedDay(null)}>
        <DialogContent className="max-w-2xl bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          {selectedDay && (
            <div className="flex flex-col h-full">
              <div className="bg-safari-accent p-8 text-white">
                <div className="flex justify-between items-start mb-4">
                  <Badge className="bg-white/20 text-white border-none px-3 py-1">Day {selectedDay.day}</Badge>
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={() => setSelectedDay(null)}>
                    <X className="w-5 h-5" />
                  </Button>
                </div>
                <h2 className="text-4xl md:text-5xl lg:text-[56px] font-serif leading-tight mb-2 tracking-widest">{selectedDay.from} to {selectedDay.to}</h2>
                <div className="flex flex-wrap gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {selectedDay.drive_time} Drive</span>
                  <span className="flex items-center gap-1.5"><Sun className="w-4 h-4" /> {selectedDay.departure_time} Departure</span>
                </div>
              </div>

              <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh]">
                <section>
                  <h3 className="text-xl md:text-2xl font-serif font-medium tracking-wide text-safari-accent mb-3 flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    What to Expect
                  </h3>
                  <p className="text-lg md:text-xl leading-[1.6] text-safari-text">
                    {selectedDay.detailed_description}
                  </p>
                </section>

                <section className="bg-safari-bg/50 p-6 rounded-2xl border border-safari-accent/10">
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-safari-muted mb-2">Our Guide's Reasoning</h3>
                  <p className="text-lg md:text-xl leading-[1.6] text-safari-text italic">
                    "{selectedDay.reasoning}"
                  </p>
                </section>

                {(selectedDay.permit_entry || selectedDay.permit_exit_deadline || selectedDay.permit_advisory || selectedDay.permit_extension) && (
                  <section className="bg-amber-50/50 p-6 rounded-2xl border border-amber-200">
                    <h3 className="text-amber-800 font-serif text-xl md:text-2xl tracking-wide mb-3 flex items-center gap-2">
                       <ShieldCheck className="w-5 h-5" />
                       Park Permit Logistics
                    </h3>
                    <div className="grid md:grid-cols-2 gap-4 mb-4">
                      {selectedDay.permit_entry && (
                        <div className="bg-white p-3 rounded-xl border border-amber-100">
                          <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mb-1">Entry Registered</p>
                          <p className="text-sm font-medium">{selectedDay.permit_entry.gate}</p>
                          <p className="text-lg font-serif text-amber-900">{selectedDay.permit_entry.time}</p>
                        </div>
                      )}
                      {selectedDay.permit_exit_deadline && (
                        <div className="bg-white p-3 rounded-xl border border-amber-100">
                          <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mb-1">Exit Deadline (24h)</p>
                          <p className="text-sm font-medium">{selectedDay.permit_exit_deadline.gate}</p>
                          <p className="text-lg font-serif text-amber-900">{selectedDay.permit_exit_deadline.time}</p>
                        </div>
                      )}
                      {selectedDay.permit_extension && (
                        <div className="bg-amber-100 p-3 rounded-xl border border-amber-200 md:col-span-2">
                          <p className="text-[10px] uppercase tracking-wider text-amber-600 font-bold mb-1">Late Exit Penalty / Extension Added</p>
                          <p className="text-sm font-bold text-amber-900">+{selectedDay.permit_extension.days} Day(s) {selectedDay.permit_extension.park} Fee</p>
                          <p className="text-xs text-amber-800 mt-1">{selectedDay.permit_extension.reasoning}</p>
                        </div>
                      )}
                    </div>
                    {selectedDay.permit_advisory && (
                      <div className="flex gap-3 bg-amber-100/50 p-4 rounded-xl">
                        <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-bold text-amber-800 uppercase mb-1">Permit Advisory</p>
                          <p className="text-sm text-amber-900 leading-relaxed">{selectedDay.permit_advisory}</p>
                        </div>
                      </div>
                    )}
                  </section>
                )}

                <section>
                  <h3 className="text-xl md:text-2xl tracking-wide font-serif text-safari-accent mb-3">Today's Schedule</h3>
                  <ul className="space-y-3">
                    {selectedDay.activities.map((activity, i) => (
                      <li key={i} className="flex items-start gap-3 text-safari-text group">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-safari-accent/10 text-safari-accent text-xs flex items-center justify-center font-bold">{i + 1}</span>
                        <span>{activity}</span>
                      </li>
                    ))}
                  </ul>
                </section>

                <Separator className="bg-safari-accent/10" />

                <section>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl md:text-2xl tracking-wide font-serif text-safari-accent flex items-center gap-2">
                      <Tent className="w-5 h-5" />
                      Accommodation
                    </h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="bg-safari-accent/5 p-4 rounded-2xl border-2 border-safari-accent/20 flex justify-between items-center">
                      <div className="flex gap-3 items-center">
                        <div className="bg-safari-accent/10 p-2 rounded-xl">
                            <Tent className="w-5 h-5 text-safari-accent" />
                        </div>
                        <div>
                            <p className="font-bold text-safari-text">{selectedDay.lodge.name}</p>
                            <p className="text-xs text-safari-muted">{selectedDay.lodge.category} • {selectedDay.lodge.price_range}</p>
                            <Badge variant="outline" className="text-[10px] h-4 mt-1 border-safari-accent/20 text-safari-accent">
                                {selectedDay.lodge.inside_park ? "Inside Park" : "Outside Park"}
                            </Badge>
                        </div>
                      </div>
                      <Badge className="bg-safari-accent text-white">Current</Badge>
                    </div>

                    <div className="space-y-3">
                      <Tabs key={`lodge-tabs-${selectedDay.day}-${selectedDay.lodge.inside_park}`} defaultValue={selectedDay.lodge.inside_park ? "inside" : "outside"} className="w-full">
                        <TabsList className="grid w-full grid-cols-2 bg-safari-bg/50 p-1 h-10 rounded-xl">
                          <TabsTrigger value="inside" className="rounded-lg text-xs">Inside Park</TabsTrigger>
                          <TabsTrigger value="outside" className="rounded-lg text-xs">Outside Park</TabsTrigger>
                        </TabsList>
                        
                        {["inside", "outside"].map(tabType => (
                          <TabsContent key={tabType} value={tabType} className="mt-4">
                            <ScrollArea className="h-[250px] rounded-xl border border-safari-accent/10 pr-4">
                              <div className="p-2 space-y-2">
                                {getAvailableLodges(selectedDay).filter(l => (tabType === "inside" ? l.inside_park : !l.inside_park)).length > 0 ? (
                                  getAvailableLodges(selectedDay)
                                    .filter(l => (tabType === "inside" ? l.inside_park : !l.inside_park))
                                    .map(lodge => (
                                      <div 
                                        key={lodge.id}
                                        className={cn(
                                            "p-4 rounded-xl transition-all flex justify-between items-center group cursor-pointer border",
                                            lodge.name === selectedDay.lodge.name 
                                                ? "bg-safari-accent/5 border-safari-accent/20" 
                                                : "bg-white border-transparent hover:border-safari-accent/10 hover:bg-safari-bg/30"
                                        )}
                                        onClick={() => handleLodgeChange(selectedDay.day, lodge.name)}
                                      >
                                        <div>
                                          <p className="font-bold text-sm text-safari-text">{lodge.name}</p>
                                          <p className="text-[10px] text-safari-muted uppercase font-medium tracking-wider">{lodge.category} Comfort</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-mono text-safari-accent font-bold">${lodge.price_usd.mid}/nt</span>
                                            {lodge.name !== selectedDay.lodge.name && (
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    className="h-8 rounded-full text-[10px] px-3 bg-white hover:bg-safari-accent hover:text-white border-safari-accent/20 transition-all"
                                                    onClick={() => handleLodgeChange(selectedDay.day, lodge.name)}
                                                >
                                                    Select
                                                </Button>
                                            )}
                                        </div>
                                      </div>
                                    ))
                                ) : (
                                  <div className="flex flex-col items-center justify-center p-8 text-center">
                                    <div className="bg-safari-bg/50 p-3 rounded-full mb-3">
                                        <X className="w-5 h-5 text-safari-muted" />
                                    </div>
                                    <p className="text-xs text-safari-muted font-medium">None available in this area</p>
                                    <p className="text-[10px] text-safari-muted/60 mt-1">Try the other category or change destination</p>
                                  </div>
                                )}
                              </div>
                            </ScrollArea>
                          </TabsContent>
                        ))}
                      </Tabs>
                    </div>
                  </div>
                </section>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Activity Confirmation Dialog */}
      <Dialog open={!!activityConfirm} onOpenChange={(open) => !open && setActivityConfirm(null)}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-6 border-none shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-serif text-safari-accent flex items-center gap-2">
              <Sparkles className="w-6 h-6" />
              Itinerary Update
            </DialogTitle>
            <DialogDescription className="pt-2 text-safari-text leading-relaxed">
              Would you like to {activityConfirm?.action} <strong>{activityConfirm?.activity}</strong> to Day {activityConfirm?.day}? 
              {activityConfirm?.action === 'add' && " This will enrich your safari experience and we will automatically adjust your guide's advice."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex gap-4 sm:justify-end mt-6">
            <Button variant="outline" className="rounded-full px-8 h-12 font-bold tracking-wide border-safari-accent/40 hover:bg-safari-bg" onClick={() => setActivityConfirm(null)}>Cancel</Button>
            <Button 
                className="rounded-full px-8 h-12 bg-safari-accent hover:bg-safari-accent/90 text-white font-bold tracking-wide shadow-md" 
                onClick={() => {
                    if (activityConfirm) {
                        performActivityToggle(activityConfirm.day, activityConfirm.activity);
                        setActivityConfirm(null);
                    }
                }}
            >
                Confirm Update
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

