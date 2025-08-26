import { QuizAnswers, ScoreResult, ScoreBand } from '../types/quiz';

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
    forecast: getForecast(finalScore),
    guaranteeStatus: getGuaranteeStatus(answers),
    topMoves: getTopMoves(answers, finalScore)
  };
};

export const getScoreBand = (score: number): ScoreBand => {
  if (score >= 85) return 'green';
  if (score >= 70) return 'yellow'; 
  if (score >= 55) return 'orange';
  return 'red';
};

export const getForecast = (score: number): string => {
  if (score >= 85) return "60-day: 18-25 leads, 90-day: $45k-65k pipeline";
  if (score >= 70) return "60-day: 12-18 leads, 90-day: $28k-45k pipeline";
  if (score >= 55) return "60-day: 6-12 leads, 90-day: $15k-28k pipeline";
  return "60-day: 2-6 leads, 90-day: $5k-15k pipeline";
};

export const getGuaranteeStatus = (answers: QuizAnswers): string => {
  const hasGoodResponse = answers.responseTime <= 60;
  const hasReviews = answers.reviewCount >= 4;
  const hasPages = answers.premiumPages !== 'none';
  
  if (hasGoodResponse && hasReviews && hasPages) {
    return "Eligible for 30-day lead guarantee";
  }
  return "Baseline service package recommended";
};

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
    moves.push({ 
      move: "Run 40-review sprint with job-type tags", 
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