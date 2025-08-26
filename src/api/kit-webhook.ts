import { KitWebhookPayload, QuizAnswers, ScoreResult } from '../types/quiz';

export const sendToKit = async (
  answers: QuizAnswers,
  result: ScoreResult,
  email: string
): Promise<void> => {
  const payload: KitWebhookPayload = {
    email,
    tags: [
      'pipeline-100-lead',
      `score-${result.band}`,
      `services-${answers.services.join('-').toLowerCase()}`,
      `zone-${answers.radius}mi`
    ],
    fields: {
      score: result.score,
      city: answers.city,
      full_name: answers.fullName,
      business_name: answers.businessName,
      top_move_1: result.topMoves[0] || '',
      guarantee_status: result.guaranteeStatus,
      // GBP Intelligence for email personalization
      gbp_rating: answers.businessData?.rating,
      gbp_review_count: answers.businessData?.reviewCount,
      gbp_phone: answers.businessData?.phone,
      gbp_website: answers.businessData?.website,
      // SEO Intelligence for email personalization
      seo_missed_leads: answers.seoIntelligence?.totalMissedLeads,
      seo_top_opportunity: answers.seoIntelligence?.topOpportunity
    }
  };

  // In a real implementation, this would POST to your backend API
  // which would then send to Kit.com
  const response = await fetch('/api/kit-webhook', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error('Failed to send data to Kit.com');
  }
};