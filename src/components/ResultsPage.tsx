import { ScoreResult, SEOIntelligence } from '../types/quiz';
import { trackEvent, AnalyticsEvents } from '../utils/analytics';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getForecast } from '@/utils/scoring';
import { getAvgTicketForCity } from '@/utils/cityData';
import { ArrowRight } from 'lucide-react';
import { CheckmarkIcon } from '@/components/ui/CheckmarkIcon';

interface ResultsPageProps {
  result: ScoreResult;
  seoIntelligence?: SEOIntelligence;
  city?: string;
  onRequestProScore: (email: string) => void;
  onBook?: () => void;
  meta?: {
    responseTime?: number;
    smsCapability?: 'both' | 'text-back' | 'autoresponder' | 'neither';
    premiumPages?: 'all' | 'some' | 'none';
    reviewCount?: number;
  };
}

export default function ResultsPage({ result, seoIntelligence, city, onRequestProScore, onBook, meta }: ResultsPageProps) {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailCapture, setShowEmailCapture] = useState(false);

  const handleProScoreRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      await onRequestProScore(email);
      trackEvent(AnalyticsEvents.PRO_SCORE_REQUEST);
      setShowEmailCapture(false);
      // Show success message
      alert('Thank you! Your Pro Score will be emailed to you within 24 hours.');
    } catch (error) {
      console.error('Failed to request pro score:', error);
      // Show user-friendly error message
      alert('Thank you for your interest! We received your request and will email your Pro Score within 24 hours. If you don\'t receive it, please contact support@floorplay.agency');
      setShowEmailCapture(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getScoreColor = (band: string) => {
    switch (band) {
      case 'green':
        return 'text-green-600 bg-green-50 border-green-600';
      case 'yellow':
        return 'text-yellow-600 bg-yellow-50 border-yellow-600';
      case 'orange':
        return 'text-orange-600 bg-orange-50 border-orange-600';
      case 'red':
        return 'text-red bg-red-50 border-red';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getScoreTextColor = (band: string) => {
    switch (band) {
      case 'green':
        return 'text-green-600';
      case 'yellow':
        return 'text-yellow-600';
      case 'orange':
        return 'text-orange-600';
      case 'red':
        return 'text-red';
      default:
        return 'text-gray-600';
    }
  };

  const getScoreBorderColor = (band: string) => {
    switch (band) {
      case 'green':
        return 'border-green-600';
      case 'yellow':
        return 'border-yellow-600';
      case 'orange':
        return 'border-orange-600';
      case 'red':
        return 'border-red';
      default:
        return 'border-gray-200';
    }
  };

  const getScoreBackgroundColor = (band: string) => {
    switch (band) {
      case 'green':
        return 'bg-green-600';
      case 'yellow':
        return 'bg-yellow-600';
      case 'orange':
        return 'bg-orange-600';
      case 'red':
        return 'bg-red';
      default:
        return 'bg-gray-600';
    }
  };

  const getScoreMessage = (band: string) => {
    switch (band) {
      case 'green':
        return 'Excellent! Ready for premium lead flow';
      case 'yellow':
        return 'Good foundation, minor gaps to address';
      case 'orange':
        return 'Significant improvements needed';
      case 'red':
        return 'Major systematic issues to resolve';
      default:
        return 'Assessment complete';
    }
  };

  // Helper: parse the forecast string into 60-day leads and 90-day pipeline
  const parseForecast = (forecast: string): { leads60: string; pipeline90: string } => {
    // Expected format examples:
    // "60-day: 18-25 leads, 90-day: $45k-65k pipeline"
    const leadsMatch = forecast.match(/60-day:\s*([^,]+)\s*leads/i);
    const pipeMatch = forecast.match(/90-day:\s*([^,]+)\s*pipeline/i);
    return {
      leads60: leadsMatch ? leadsMatch[1].trim() : '—',
      pipeline90: pipeMatch ? pipeMatch[1].trim() : '—',
    };
  };

  // Helper: choose a representative "target" score for the next band up
  const getNextBandTargetScore = (currentScore: number): number => {
    if (currentScore < 55) return 60; // target mid-orange
    if (currentScore < 70) return 75; // target mid-yellow
    if (currentScore < 85) return 88; // target within green
    return currentScore; // already green
  };

  // Helper: compute current leads for a given ranking using CTR tables
  const computeCurrentLeads = (searchVolume: number, currentRank: number | null, mapPackPosition: number | null): number => {
    const organicCTR: Record<number, number> = {
      1: 0.284, 2: 0.152, 3: 0.099, 4: 0.067, 5: 0.051, 6: 0.041, 7: 0.034, 8: 0.028, 9: 0.025, 10: 0.022,
    };
    const mapPackCTR: Record<number, number> = { 1: 0.446, 2: 0.156, 3: 0.098 };
    if (mapPackPosition && mapPackPosition <= 3) return Math.round(searchVolume * (mapPackCTR[mapPackPosition] || 0));
    if (currentRank && currentRank <= 10) return Math.round(searchVolume * (organicCTR[currentRank] || 0));
    return 0;
  };

  // Build data for Current vs Potential section
  const forecastCurrent = parseForecast(result.forecast);
  const nextScore = getNextBandTargetScore(result.score);
  const forecastPotential = parseForecast(getForecast(nextScore, getAvgTicketForCity(city), seoIntelligence));

  // Helper: parse a maximum dollar amount from a string like "$45k-65k"
  const parseMaxDollars = (v: string): number => {
    if (!v) return 0;
    const nums = Array.from(v.matchAll(/\$?([\d,.]+)\s*(k)?/gi)).map(m => {
      const n = parseFloat(m[1].replace(/,/g, ''));
      return m[2] ? n * 1000 : n;
    });
    return nums.length ? Math.max(...nums) : 0;
  };
  const opportunityIndex = (() => {
    const rt = meta?.responseTime ?? 1440; // minutes
    const rtScore = rt <= 15 ? 0 : rt <= 60 ? 0.4 : rt <= 1440 ? 0.7 : 1;
    const sms = meta?.smsCapability ?? 'neither';
    const smsScore = sms === 'both' ? 0 : sms === 'neither' ? 1 : 0.6;
    const pages = meta?.premiumPages ?? 'none';
    const pageScore = pages === 'all' ? 0 : pages === 'some' ? 0.6 : 1;
    const reviews = meta?.reviewCount;
    const revScore = reviews == null || reviews === -1 ? 0.5 : reviews >= 8 ? 0 : reviews >= 4 ? 0.5 : 1;
    const base = rtScore * 0.35 + smsScore * 0.2 + pageScore * 0.25 + revScore * 0.2;
    const missed = seoIntelligence?.totalMissedLeads ?? 0;
    const boost = missed >= 30 ? 0.1 : missed >= 15 ? 0.05 : 0;
    return Math.round(Math.min(1, base + boost) * 100);
  })();

  const opportunityBand: 'High' | 'Medium' | 'Low' = opportunityIndex >= 65 ? 'High' : opportunityIndex >= 40 ? 'Medium' : 'Low';

  const qualifiesSpecialOffer = parseMaxDollars(forecastPotential.pipeline90) >= 100000;

  const responseLabel = (() => {
    const rt = meta?.responseTime;
    if (rt == null) return '—';
    if (rt <= 15) return '≤15 min';
    if (rt <= 60) return '≤1 hr';
    if (rt <= 1440) return 'Same day';
    return '1–2 days';
  })();

  const reviewLabel = (() => {
    const rc = meta?.reviewCount;
    if (rc == null || rc === -1) return 'Not sure';
    if (rc >= 8) return '8+ (60d)';
    if (rc >= 4) return '4–7 (60d)';
    return '0–3 (60d)';
  })();

  const topMapPack = seoIntelligence?.rankings?.find(r => r.mapPackPosition && r.mapPackPosition <= 3);
  const gbpLabel = topMapPack ? `Top ${topMapPack.mapPackPosition}` : 'Not in pack';

  const parseMidDollars = (v: string): number => {
    if (!v) return 0;
    const nums = Array.from(v.matchAll(/\$?([\d,.]+)\s*(k)?/gi)).map(m => {
      const n = parseFloat(m[1].replace(/,/g, ''));
      return m[2] ? n * 1000 : n;
    });
    if (!nums.length) return 0;
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    return Math.round((min + max) / 2);
  };
  const pipelineCurrentMid = parseMidDollars(forecastCurrent.pipeline90);
  const pipelinePotentialMid = parseMidDollars(forecastPotential.pipeline90);
  const pipelineDelta = Math.max(0, pipelinePotentialMid - pipelineCurrentMid);

  const worstRanking = seoIntelligence?.rankings
    ? [...seoIntelligence.rankings].sort((a, b) => b.missedLeadsPerMonth - a.missedLeadsPerMonth)[0]
    : undefined;
  const worstCurrentLeads = worstRanking
    ? computeCurrentLeads(worstRanking.searchVolume, worstRanking.currentRank, worstRanking.mapPackPosition)
    : 0;
  const worstKeywordLabel = worstRanking?.keyword || (city ? `epoxy flooring ${city}` : 'priority keyword');

  return (
    <div className="bg-white min-h-screen">
      {/* Special Offer Bar */}
      {qualifiesSpecialOffer && (
        <div className="bg-brand flex items-center justify-center px-2 py-4 fixed top-0 left-0 right-0 z-50">
          <div className="flex items-center gap-4">
            <div className="font-work-sans font-medium text-white text-2xl">
              <span className="font-black">SPECIAL OFFER</span> For Owners Doing $30k+/mo
            </div>
            <button 
              onClick={() => {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
              }}
              className="bg-paper px-4 py-2 rounded hover:bg-paper/90 transition-colors"
            >
              <span className="font-work-sans font-extrabold text-brand text-xl">LEARN MORE</span>
            </button>
          </div>
        </div>
      )}

      <div className={`flex items-center justify-center pb-12 ${qualifiesSpecialOffer ? 'pt-24' : 'pt-18'}`}>
        <div className="w-full max-w-[1150px] space-y-8">
          {/* Score Section */}
          <div className="bg-white px-28 py-12 rounded-[24px] flex items-center gap-12">
            <div className="flex-1 space-y-6">
              <div className="space-y-3">
                <h1 className="font-big-shoulders font-extrabold text-ink text-[64px] uppercase leading-[1.1] max-w-[536px]">
                  Your Pipeline Readiness Score
                </h1>
                <p className={`font-work-sans font-bold text-[20px] leading-[1.1] max-w-[536px] ${getScoreTextColor(result.band)}`}>
                  {getScoreMessage(result.band)}
                </p>
              </div>

              {/* Status Tags */}
              <div className="flex flex-wrap gap-3">
                <div className={`px-4 py-2 rounded-[40px] border ${
                  opportunityBand === 'High' ? 'bg-red-50 border-red' : 
                  opportunityBand === 'Medium' ? 'bg-blue-50 border-brand' : 
                  'bg-green-50 border-green-600'
                }`}>
                  <span className="font-work-sans text-ink text-[18px]">Upside: {opportunityBand}</span>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-[40px] border border-red">
                  <span className="font-work-sans text-ink text-[18px]">GBP: {gbpLabel}</span>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-[40px] border border-red">
                  <span className="font-work-sans text-ink text-[18px]">Avg Response: {responseLabel}</span>
                </div>
                <div className="bg-red-50 px-4 py-2 rounded-[40px] border border-red">
                  <span className="font-work-sans text-ink text-[18px]">Low Reviews: {reviewLabel}</span>
                </div>
              </div>
            </div>

            {/* Score Circle */}
            <div className="flex items-center justify-center">
              <div className={`w-[264.5px] h-[264.5px] rounded-full flex items-center justify-center border-[11.756px] ${
                result.band === 'red' ? 'bg-red-50 border-red' :
                result.band === 'orange' ? 'bg-orange-50 border-orange-600' :
                result.band === 'yellow' ? 'bg-yellow-50 border-yellow-600' :
                'bg-green-50 border-green-600'
              }`}>
                <span className={`font-big-shoulders font-extrabold text-[113px] leading-[1.1] ${getScoreTextColor(result.band)}`}>
                  {result.score}
                </span>
              </div>
            </div>
          </div>

          {/* Pipeline Section */}
          <div className="bg-paper rounded-[24px] p-8 space-y-8">
            <div className="text-center py-4">
              <h2 className="font-big-shoulders font-extrabold text-ink text-[40px] leading-[1.1]">
                Your 60-Day Leads & 90-Day Pipeline for {city || 'Slinger, WI'}
              </h2>
            </div>

            <div className="flex gap-6">
              {/* Current Pipeline */}
              <div className="flex-1 bg-paper border-4 border-gray-300 rounded-[16px] p-8 space-y-6">
                <div className="text-center space-y-1">
                  <div className={`font-work-sans font-extrabold text-[18px] ${getScoreTextColor(result.band)}`}>NOW</div>
                  <div className="font-work-sans font-bold text-ink text-[32px]">Current Pipeline</div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2 items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBackgroundColor(result.band)}`}>
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      Score {result.score} ({result.band})
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBackgroundColor(result.band)}`}>
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      {forecastCurrent.leads60} leads
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBackgroundColor(result.band)}`}>
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      {forecastCurrent.pipeline90} 90-day pipeline
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getScoreBackgroundColor(result.band)}`}>
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      {worstCurrentLeads} leads for "{worstKeywordLabel}"
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center">
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      {topMapPack 
                        ? `Top ${topMapPack.mapPackPosition} placement for local flooring searches`
                        : 'Google Business Profile not in top 3 for local searches'
                      }
                    </span>
                  </div>
                </div>
              </div>

              {/* Potential Pipeline */}
              <div className="flex-1 bg-white border-4 border-green-600 rounded-[16px] p-8 space-y-6">
                <div className="text-center space-y-1">
                  <div className="font-work-sans font-extrabold text-green-600 text-[18px]">AFTER</div>
                  <div className="font-work-sans font-bold text-ink text-[32px]">Potential Pipeline</div>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      Score = {nextScore} (target)
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      {forecastPotential.leads60} leads
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      {forecastPotential.pipeline90} 90-day pipeline
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      {Math.max(worstCurrentLeads + 3, 5)}–{worstCurrentLeads + 8} leads for "{worstKeywordLabel}"
                    </span>
                  </div>
                  <div className="flex gap-2 items-start">
                    <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center">
                      <CheckmarkIcon className="w-5 h-3.5 text-white" />
                    </div>
                    <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                      Top 3 placement for local flooring searches
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <p className="font-work-sans text-ink text-[16px] leading-[1.1]">
              *Results are not guaranteed and are based on your local market dynamics
            </p>

            {/* Top Missed Lead Opportunities */}
            {seoIntelligence?.rankings && seoIntelligence.rankings.length > 0 && (
              <div className="bg-paper p-8 rounded-b-[24px] space-y-6">
                <div className="text-center py-4">
                  <h3 className="font-big-shoulders font-extrabold text-ink text-[40px] leading-[1.1]">
                    Top Missed Lead Opportunities
                  </h3>
                </div>
                
                <div className="space-y-6">
                  {seoIntelligence.rankings
                    .slice(0)
                    .sort((a,b) => b.missedLeadsPerMonth - a.missedLeadsPerMonth)
                    .slice(0,3)
                    .map((r, idx, arr) => {
                      const max = arr[0].missedLeadsPerMonth || 1
                      const pct = Math.round((r.missedLeadsPerMonth / max) * 100)
                      return (
                        <div key={r.keyword} className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="font-work-sans text-ink text-[18px]">{r.keyword}</span>
                            <span className="font-work-sans text-ink text-[18px]">{r.missedLeadsPerMonth} leads/mo</span>
                          </div>
                          <div className="h-4 bg-gray-300 rounded-[24px] w-full max-w-[1086px] overflow-hidden">
                            <div className="h-full bg-brand rounded-[24px]" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      )
                    })}
                </div>
              </div>
            )}

            {/* Top 3 To-Do's */}
            <div className="bg-paper px-8 pb-8 rounded-b-[24px] space-y-6">
              <div className="text-center py-4">
                <h3 className="font-big-shoulders font-extrabold text-ink text-[40px] leading-[1.1]">
                  Your Top 3 To-Do's
                </h3>
              </div>

              <div className="bg-paper rounded-[16px] py-2 space-y-4">
                <div className="font-work-sans font-bold text-ink text-[24px] text-center">
                  Do these in the next 14 days
                </div>
                
                <div className="space-y-4">
                  {result.topMoves.map((move, index) => {
                    const labelForMove = (move: string): string => {
                      const m = move.toLowerCase();
                      if (m.includes('missed-call') || m.includes('autoresponder') || m.includes('text-back')) return 'Speed to lead';
                      if (m.includes('service pages') || m.includes('polyurea') || m.includes('decorative') || m.includes('epoxy')) return 'Conversion Pages';
                      if (m.includes('review')) return 'Social Proof';
                      return 'Optimization';
                    };
                    
                    return (
                      <div key={index} className="flex gap-2 items-start">
                        <div className="w-8 h-8 bg-brand rounded-full flex items-center justify-center">
                          <span className="font-work-sans text-white text-[20px] font-normal leading-[1.5]">
                            {index + 1}
                          </span>
                        </div>
                        <div className="flex-1">
                          <span className="font-work-sans text-ink text-[20px] leading-[1.5]">
                            <span className="font-bold">{labelForMove(move)}: </span>
                            {move}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Special Offer Section */}
          {qualifiesSpecialOffer && (
            <div data-special-offer-section className="bg-white border-[16px] border-brand rounded-[24px] px-16 py-12 text-center space-y-8">
              <div className="space-y-4">
                <div className="font-work-sans font-black text-red text-[32px] leading-[1.3]">
                  SPECIAL OFFER
                </div>
                <div className="font-big-shoulders font-bold text-[48px] leading-[1.3]">
                  <span className="text-ink">ARE YOU A PREMIUM FLOOR INSTALLER</span><br />
                  <span className="text-ink">DOING </span>
                  <span className="text-brand">$30K+/MO?</span>
                </div>
                <p className="font-work-sans text-ink text-[24px] leading-[1.3]">
                  We'll walk through a detailed report on how to improve your local leadflow pipeline. (in just 15 minutes!)
                </p>
              </div>
              
              <Button
                onClick={() => onBook?.()}
                className="bg-brand hover:bg-brand/90 text-white h-auto p-0 rounded-none flex items-center w-full"
              >
                <div className="flex-1 px-8 py-8 text-left">
                  <div className="font-work-sans font-bold text-[#e7f2f1] text-[26px] leading-[1.3]">
                    Review your pipeline health
                  </div>
                  <div className="font-work-sans text-[#e7f2f1] text-[16px] leading-[1.3]">
                    Book a 15-min call to review your pipeline and immediate fixess to improve it
                  </div>
                </div>
                <div className="bg-ink w-[99px] h-full flex items-center justify-center px-[31px] py-[34px]">
                  <ArrowRight className="w-8 h-8 text-white" />
                </div>
              </Button>
              
              {!showEmailCapture ? (
                <button
                  className="font-work-sans text-ink text-[18px] leading-[1.3] underline underline-offset-4"
                  onClick={() => setShowEmailCapture(true)}
                >
                  No thanks, just email me the full pipeline report
                </button>
              ) : (
                <form onSubmit={handleProScoreRequest} className="flex flex-col gap-4 items-center">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email for the full report"
                    className="w-80 h-12 bg-white text-black border-gray-300"
                    required
                  />
                  <Button 
                    type="submit" 
                    disabled={isSubmitting}
                    className="bg-brand hover:bg-brand/90 text-white px-8 py-3 rounded-lg"
                  >
                    {isSubmitting ? 'Sending Report...' : 'Email Me The Report'}
                  </Button>
                </form>
              )}
            </div>
          )}

          {/* Pro Score CTA - Only for non-qualified leads */}
          {!qualifiesSpecialOffer && (
            <div className="bg-white border-[16px] border-brand rounded-[24px] px-16 py-12 flex items-center gap-8">
            <div className="flex-1 text-left">
              <h3 className="font-big-shoulders font-bold text-ink text-[48px] leading-[1.3] mb-2">
                Get your full Pro Score
              </h3>
              <p className="font-work-sans text-ink text-[24px] leading-[1.3]">
                Detailed breakdown, competitor context, and a 30‑day move map.
              </p>
            </div>
            
            {!showEmailCapture ? (
              <Button 
                onClick={() => setShowEmailCapture(true)}
                className="bg-brand hover:bg-brand/90 text-white px-4 pr-0 py-2 rounded-none flex items-center"
              >
                <span className="font-work-sans font-bold text-white text-[20px] tracking-[1px] px-4">
                  Email me the Pro Score
                </span>
                <div className="bg-brand p-2">
                  <ArrowRight className="w-8 h-8 text-white" />
                </div>
              </Button>
            ) : (
              <form onSubmit={handleProScoreRequest} className="flex gap-4 items-center">
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email"
                  className="w-64 h-12 bg-white text-black border-gray-300"
                  required
                />
                <Button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="bg-brand hover:bg-brand/90 text-white px-4 pr-0 py-2 rounded-none flex items-center"
                >
                  <span className="font-work-sans font-bold text-white text-[20px] tracking-[1px] px-4">
                    {isSubmitting ? 'Sending…' : 'Send Pro Score'}
                  </span>
                  <div className="bg-brand p-2">
                    <ArrowRight className="w-8 h-8 text-white" />
                  </div>
                </Button>
              </form>
            )}
          </div>
          )}
        </div>
      </div>
    </div>
  );
}
