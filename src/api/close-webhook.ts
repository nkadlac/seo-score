import { CloseWebhookPayload, QuizAnswers, ScoreResult } from '../types/quiz';

export const sendToClose = async (
  answers: QuizAnswers, 
  result: ScoreResult,
  email: string
): Promise<void> => {
  const payload: CloseWebhookPayload = {
    contact: {
      name: answers.fullName,
      emails: [{ email, type: 'office' }]
    },
    custom: {
      business_city: answers.city,
      priority_services: answers.services,
      service_radius: answers.radius,
      response_speed: `${answers.responseTime} minutes`,
      sms_capability: answers.smsCapability,
      premium_pages: answers.premiumPages,
      review_velocity: answers.reviewCount.toString(),
      pipeline_score: result.score,
      score_band: result.band,
      top_moves: result.topMoves,
      // GBP Intelligence Data (sales intelligence)
      gbp_rating: answers.businessData?.rating,
      gbp_review_count: answers.businessData?.reviewCount,
      gbp_phone: answers.businessData?.phone,
      gbp_website: answers.businessData?.website,
      gbp_place_id: answers.businessData?.placeId,
      gbp_address: answers.businessData?.address,
      // SEO Intelligence Data (sales intelligence)
      seo_missed_leads: answers.seoIntelligence?.totalMissedLeads,
      seo_top_opportunity: answers.seoIntelligence?.topOpportunity,
      seo_map_pack_rankings: answers.seoIntelligence?.rankings.filter(r => r.mapPackPosition !== null).length,
      seo_keyword_count: answers.seoIntelligence?.rankings.length,
      // UTM parameters would be captured from URL params
      utm_source: new URLSearchParams(window.location.search).get('utm_source') || undefined,
      utm_medium: new URLSearchParams(window.location.search).get('utm_medium') || undefined,
      utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign') || undefined,
    },
    tags: [
      'pipeline-100-lead',
      `score-${result.band}`,
      `services-${answers.services.join('-').toLowerCase()}`,
      `zone-${answers.radius}mi`
    ]
  };

  // In a real implementation, this would POST to your backend API
  // which would then send to Close.com
  const response = await fetch('/api/close-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to send data to Close.com');
  }
};