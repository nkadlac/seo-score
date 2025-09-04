import { QuizAnswers, ScoreResult, ScoreBand } from '../types/quiz';
import { getAvgTicketForCity } from './cityData';

export const calculateScore = (answers: QuizAnswers): ScoreResult => {
  let score = 0;
  
  // Speed-to-Lead (30 points)
  if (answers.responseTime <= 15) score += 30;
  else if (answers.responseTime <= 60) score += 20;
  else if (answers.responseTime <= 1440) score += 10; // 24 hours
  
  // SMS Capabilities bonus
  if (answers.smsCapability === 'both') score += 5;
  
  // Review Velocity (20 points)
  if (answers.reviewCount >= 8) score += 20;
  else if (answers.reviewCount >= 4) score += 15;
  else if (answers.reviewCount >= 1) score += 10;
  
  // Premium Pages (20 points)  
  if (answers.premiumPages === 'all') score += 20;
  else if (answers.premiumPages === 'some') score += 12;
  
  // Service Zone Fit (20 points)
  const serviceCount = answers.services.length;
  const radiusMultiplier = answers.radius >= 30 ? 1.2 : 1.0;
  score += Math.min(20, serviceCount * 7 * radiusMultiplier);
  
  // GBP Presence & SEO Performance (15 points)
  if (answers.businessData?.hasGBP) {
    score += 6; // Has Google Business Profile
    
    // SEO Performance bonus based on rankings
    if (answers.seoIntelligence) {
      const rankings = answers.seoIntelligence.rankings;
      const mapPackRankings = rankings.filter(r => r.mapPackPosition !== null);
      const organicRankings = rankings.filter(r => r.currentRank !== null && r.currentRank <= 3);
      
      // Map pack rankings are worth more
      if (mapPackRankings.length >= 2) score += 9; // Excellent local SEO
      else if (mapPackRankings.length >= 1) score += 6; // Good local SEO
      else if (organicRankings.length >= 2) score += 3; // Some organic presence
      
      // Penalty for poor SEO performance (lots of missed opportunities)
      if (answers.seoIntelligence.totalMissedLeads > 200) score -= 3;
    }
  } else {
    score += 3; // Some credit for having a business name
  }
  
  const finalScore = Math.round(score);
  const band = getScoreBand(finalScore);
  
  return {
    score: finalScore,
    band,
    forecast: getForecast(finalScore, getAvgTicketForCity(answers.city)),
    topMoves: getTopMoves(answers, finalScore)
  };
};

export const getScoreBand = (score: number): ScoreBand => {
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow'; 
  if (score >= 55) return 'orange';
  return 'red';
};

// Forecast configuration (can be tuned without changing scoring logic)
const FORECAST_CONFIG = {
  avgTicket: 7500,          // Default average job value in USD - more realistic
  leadToOpportunity: 0.6,    // Portion of leads that become qualified opps
  pipeline90Multiplier: 1.5, // Scale 60-day leads to a 90-day opp pipeline
};

const formatK = (n: number) => {
  const k = Math.round(n / 1000);
  return `$${k}k`;
};

/**
 * Returns a human string: "60-day: X-Y leads, 90-day: $Ak-$Bk pipeline"
 * Integrates SEO intelligence with score-based forecasting for more accurate projections.
 */
export const getForecast = (score: number, avgTicketOverride?: number, seoIntelligence?: any): string => {
  // Base leads by score band
  let baseLeadsRange: [number, number] =
    score >= 85 ? [18, 25] :
    score >= 70 ? [12, 18] :
    score >= 55 ? [6, 12] : [2, 6];

  // SEO Enhancement Factor
  if (seoIntelligence) {
    const seoBoost = calculateSEOLeadBoost(seoIntelligence, score);
    baseLeadsRange = [
      Math.round(baseLeadsRange[0] * seoBoost.multiplier + seoBoost.additionalLeads),
      Math.round(baseLeadsRange[1] * seoBoost.multiplier + seoBoost.additionalLeads)
    ];
  }

  // Dynamic 90-day pipeline based on assumptions
  const avgTicket = avgTicketOverride || FORECAST_CONFIG.avgTicket;
  const oppMin = baseLeadsRange[0] * FORECAST_CONFIG.leadToOpportunity;
  const oppMax = baseLeadsRange[1] * FORECAST_CONFIG.leadToOpportunity;
  const pipeMin = oppMin * avgTicket * FORECAST_CONFIG.pipeline90Multiplier;
  const pipeMax = oppMax * avgTicket * FORECAST_CONFIG.pipeline90Multiplier;

  const pipelineStr = `${formatK(pipeMin)}-${formatK(pipeMax)} pipeline`;
  const leadsStr = `${baseLeadsRange[0]}-${baseLeadsRange[1]} leads`;
  return `60-day: ${leadsStr}, 90-day: ${pipelineStr}`;
};

/**
 * Calculate SEO-based lead boost from real search intelligence
 */
const calculateSEOLeadBoost = (seoIntelligence: any, currentScore: number): { multiplier: number; additionalLeads: number } => {
  const { totalMissedLeads, rankings } = seoIntelligence;
  
  // Base multiplier starts at 1.0 (no change)
  let multiplier = 1.0;
  let additionalLeads = 0;
  
  // Missed leads conversion (very conservative: 2% of missed clicks become leads)
  const seoLeadPotential = Math.round(totalMissedLeads * 0.02);
  
  // SEO boost based on search opportunity
  if (totalMissedLeads > 5000) {
    multiplier = 1.4; // 40% boost for high-volume markets
    additionalLeads = Math.min(seoLeadPotential * 0.3, 8); // Cap at 8 additional leads
  } else if (totalMissedLeads > 2000) {
    multiplier = 1.25; // 25% boost for medium-volume markets  
    additionalLeads = Math.min(seoLeadPotential * 0.25, 5); // Cap at 5 additional leads
  } else if (totalMissedLeads > 500) {
    multiplier = 1.15; // 15% boost for smaller markets
    additionalLeads = Math.min(seoLeadPotential * 0.2, 3); // Cap at 3 additional leads
  } else if (totalMissedLeads > 0) {
    multiplier = 1.05; // 5% boost for low-volume markets
    additionalLeads = 1; // Minimum 1 additional lead for any SEO opportunity
  }
  
  // Ranking bonus: If already ranking well, reduce the boost (harder to improve)
  const topRankings = rankings.filter((r: any) => r.currentRank && r.currentRank <= 10).length;
  if (topRankings > 3) {
    multiplier = Math.max(multiplier - 0.1, 1.05); // Reduce boost if already ranking well
  }
  
  // Score-based cap: Lower scores have more room for improvement
  if (currentScore < 55) {
    multiplier = Math.min(multiplier * 1.2, 1.5); // Low scores get bigger SEO impact
  } else if (currentScore > 85) {
    multiplier = Math.min(multiplier, 1.2); // High scores get smaller SEO impact
  }
  
  return { multiplier, additionalLeads };
};

// Removed guaranteeStatus label from public results to simplify messaging.

export const getTopMoves = (answers: QuizAnswers, _score: number): string[] => {
  const moves: { move: string; priority: number }[] = [];
  
  // Priority order (impact × speed)
  if (answers.responseTime > 15 || answers.smsCapability !== 'both') {
    moves.push({ 
      move: "Turn on missed-call text-back + SMS autoresponder", 
      priority: 1 
    });
  }
  
  if (answers.premiumPages !== 'all') {
    moves.push({ 
      move: "Ship Polyurea/Decorative/Epoxy pages", 
      priority: 2 
    });
  }
  
  if (answers.reviewCount <= 7) {
    const cityExample = (answers.city || '').split(',')[0]?.trim() || 'your city';
    moves.push({ 
      move: `Earn 15+ fresh Google reviews in 45 days. Ask customers to mention the job type and city (e.g., 'epoxy garage floor in ${cityExample}').`, 
      priority: 3 
    });
  }
  
  if (answers.radius < 30 || answers.services.length === 1) {
    moves.push({ 
      move: "Publish 6 city pages", 
      priority: 4 
    });
  }
  
  moves.push({ move: "GBP cleanup (categories/services/posts/Q&A/photos)", priority: 5 });
  moves.push({ move: "Add financing CTA + trust blocks", priority: 6 });
  moves.push({ move: "Turn on tracking (call numbers, UTMs, source tracking)", priority: 7 });
  
  // Return top 3 moves, sorted by priority
  return moves
    .sort((a, b) => a.priority - b.priority)
    .slice(0, 3)
    .map(item => item.move);
};
