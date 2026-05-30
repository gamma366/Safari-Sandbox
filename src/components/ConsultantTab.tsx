import React from 'react';
import { Users, Mail, Phone, Calendar, MessageSquare, ArrowRight, ShieldCheck, CheckCircle2, Tent, Star, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ConsultantTabProps {
  level: string;
  interests: string[];
  paxChildren: number;
}

const TOUR_COMPANIES = [
  {
    id: 'roy-safaris',
    name: 'Roy Safaris',
    description: 'A deeply experienced, family-owned Tanzanian operator offering exceptional bespoke safaris.',
    level: ['budget', 'mid-range', 'luxury'],
    specialties: ['wildlife', 'cultural', 'migration', 'family'],
    contact: 'info@roysafaris.com',
    phone: '+255 27 254 3144',
  },
  {
    id: 'kibo-guides',
    name: 'Kibo Guides',
    description: 'Pioneers in high-quality, customized Tanzanian adventures with a focus on local expertise.',
    level: ['mid-range', 'luxury'],
    specialties: ['wildlife', 'trekking', 'family'],
    contact: 'reservations@kiboguides.com',
    phone: '+255 27 254 4455',
  },
  {
    id: 'asilia-africa',
    name: 'Asilia Africa',
    description: 'Leading authentic luxury and conservation-focused safaris with premium camps.',
    level: ['luxury'],
    specialties: ['big-cats', 'migration'],
    contact: 'enquiries@asiliaafrica.com',
    phone: '+255 736 500 515',
  },
  {
    id: 'nomad-tanzania',
    name: 'Nomad Tanzania',
    description: 'Offering some of East Africa\'s most distinctive and adventurous luxury camps.',
    level: ['luxury'],
    specialties: ['wildlife', 'primate', 'migration'],
    contact: 'info@nomad-tanzania.com',
    phone: '+255 784 750 000',
  },
  {
    id: 'leopard-tours',
    name: 'Leopard Tours',
    description: 'One of the most established operators with extensive reach across all Tanzanian national parks.',
    level: ['budget', 'mid-range'],
    specialties: ['wildlife', 'family', 'budget'],
    contact: 'leopardtours@leopardtours.co.tz',
    phone: '+255 27 250 8378',
  }
];

export function ConsultantTab({ level, interests, paxChildren }: ConsultantTabProps) {
  // Determine relevant companies based on user's selected preferences
  const recommendedCompanies = TOUR_COMPANIES.filter(company => {
    // Exact level match
    const levelMatch = company.level.includes(level);
    
    // Check if it's a family trip and match family specific company
    const isFamily = paxChildren > 0;
    if (isFamily && company.specialties.includes('family')) return true;

    // Check interests overlap
    const interestMatch = company.specialties.some(sp => interests.includes(sp));

    return levelMatch || interestMatch;
  });

  // Fallback to defaults if none match well
  const displayedCompanies = recommendedCompanies.length > 0 
    ? recommendedCompanies.slice(0, 3) 
    : TOUR_COMPANIES.slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Dynamic Tour Operator Recommendations */}
      <div className="space-y-6">
        <div className="text-center md:text-left space-y-4 mb-8">
            <h2 className="text-4xl md:text-5xl lg:text-[56px] font-serif text-safari-text leading-tight tracking-widest">Recommended Tour Operators</h2>
            <p className="text-lg md:text-xl leading-relaxed text-safari-muted">Based on your {level} preference and selected interests, we've matched you with these verified local experts.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {displayedCompanies.map(company => (
                <Card key={company.id} className="border-safari-accent/20 shadow-sm flex flex-col h-full hover:shadow-md transition-shadow bg-white">
                    <CardHeader className="pb-3 border-b border-safari-accent/10 bg-safari-bg/30">
                        <CardTitle className="text-xl md:text-2xl font-serif text-safari-text tracking-wide">{company.name}</CardTitle>
                        <div className="flex flex-wrap gap-2 mt-2">
                            {company.level.map(lv => (
                                <Badge key={lv} variant="outline" className="text-xs border-safari-accent/30 capitalize">{lv}</Badge>
                            ))}
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4 flex-1 flex flex-col">
                        <p className="text-base text-safari-muted leading-[1.6] mb-6 flex-1">{company.description}</p>
                        
                        <div className="space-y-2 mb-6">
                            <span className="flex items-center gap-2 text-xs text-safari-muted">
                                <Mail className="w-3.5 h-3.5" /> {company.contact}
                            </span>
                            <span className="flex items-center gap-2 text-xs text-safari-muted">
                                <Phone className="w-3.5 h-3.5" /> {company.phone}
                            </span>
                        </div>

                        <Button 
                            className="w-full bg-safari-accent/10 border border-safari-accent/20 text-safari-accent hover:bg-safari-accent hover:text-white transition-all text-base font-medium py-6 rounded-full tracking-wide uppercase"
                            onClick={() => window.open(`mailto:${company.contact}?subject=Safari Inquiry from your app&body=Hello, I am interested in booking a ${level} safari.`)}
                        >
                            <Mail className="w-4 h-4 mr-2" /> Contact Operator
                        </Button>
                    </CardContent>
                </Card>
            ))}
        </div>
      </div>

      {/* General Advice Consultant Section */}
      <div className="bg-safari-accent p-8 rounded-3xl text-white relative overflow-hidden shadow-xl mt-12">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="w-32 h-32 rounded-full border-4 border-white/20 overflow-hidden shrink-0 bg-white/10 flex items-center justify-center">
                 <Users className="w-12 h-12 text-white/50" />
            </div>
            <div className="text-center md:text-left flex-1">
                <Badge className="bg-white/20 text-white border-none mb-4 px-3 py-1 uppercase tracking-widest text-[10px]">General Platform Advice</Badge>
                <h2 className="text-4xl md:text-5xl font-serif leading-tight mb-4 tracking-widest">Safari Planning Assistant</h2>
                <p className="text-lg md:text-xl leading-relaxed text-white/80 max-w-xl italic mb-6">"Not sure which operator to choose? Just want general advice before reaching out? Send an inquiry and we'll help point you in the right direction."</p>
                <Button className="bg-white text-safari-accent hover:bg-white/90 rounded-full shadow-md text-base md:text-lg h-14 px-8 font-medium tracking-wide uppercase transition-all" onClick={() => window.open(`mailto:general-advice@safariexperts.com`)}>
                    Get General Advice <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-8 border border-safari-accent/10 shadow-sm mt-8">
        <h3 className="text-2xl md:text-3xl font-serif text-safari-text tracking-wide mb-8">Why Book With These Operators?</h3>
        <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col gap-3">
                <CheckCircle2 className="w-8 h-8 text-green-600" />
                <h4 className="font-bold text-lg tracking-wide text-safari-text">Verified Excellence</h4>
                <p className="text-base text-safari-muted leading-[1.6]">We only recommend operators with outstanding track records and reviews.</p>
            </div>
            <div className="flex flex-col gap-3">
                <ShieldCheck className="w-8 h-8 text-blue-600" />
                <h4 className="font-bold text-lg tracking-wide text-safari-text">Fully Protected</h4>
                <p className="text-base text-safari-muted leading-[1.6]">Selected operators offer comprehensive financial security and clear booking policies.</p>
            </div>
            <div className="flex flex-col gap-3">
                <Tent className="w-8 h-8 text-amber-600" />
                <h4 className="font-bold text-lg tracking-wide text-safari-text">Expert On-Ground Support</h4>
                <p className="text-base text-safari-muted leading-[1.6]">All partners have local offices providing 24/7 assistance during your trip.</p>
            </div>
        </div>
      </div>
    </div>
  );
}
