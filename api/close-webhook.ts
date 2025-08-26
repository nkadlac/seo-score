import type { VercelRequest, VercelResponse } from '@vercel/node';
import { CloseWebhookPayload, QuizAnswers, ScoreResult } from '../src/types/quiz';

/**
 * Close.com CRM Integration
 * Creates leads in Close.com based on quiz results
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { answers, result, email }: {
      answers: QuizAnswers;
      result: ScoreResult;
      email: string;
    } = req.body;
    
    // Validate required fields
    if (!answers || !result || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: answers, result, email' 
      });
    }

    // Get Close API key from environment (trim any whitespace)
    const closeApiKey = process.env.CLOSE_API_KEY?.trim();
    if (!closeApiKey) {
      console.error('Close.com API key not configured');
      return res.status(500).json({ 
        error: 'Close.com integration not configured' 
      });
    }

    console.log('Creating Close.com lead for:', email);

    // Prepare Close.com lead payload
    const payload: CloseWebhookPayload = {
      contact: {
        name: answers.fullName,
        emails: [{ email, type: 'office' }],
        phones: answers.businessData?.phone ? [{ 
          phone: answers.businessData.phone, 
          type: 'office' 
        }] : undefined,
      },
      custom: {
        business_city: answers.city,
        priority_services: answers.services,
        service_radius: answers.radius,
        response_speed: `${answers.responseTime}min`,
        sms_capability: answers.smsCapability,
        premium_pages: answers.premiumPages,
        review_velocity: answers.reviewCount.toString(),
        pipeline_score: result.score,
        score_band: result.band,
        top_moves: result.topMoves,
        
        // GBP Intelligence Data
        gbp_rating: answers.businessData?.rating,
        gbp_review_count: answers.businessData?.reviewCount,
        gbp_phone: answers.businessData?.phone,
        gbp_website: answers.businessData?.website,
        gbp_place_id: answers.businessData?.placeId,
        gbp_address: answers.businessData?.address,
        
        // SEO Intelligence Data
        seo_missed_leads: answers.seoIntelligence?.totalMissedLeads,
        seo_top_opportunity: answers.seoIntelligence?.topOpportunity,
        seo_map_pack_rankings: answers.seoIntelligence?.rankings.filter(r => r.mapPackPosition !== null).length,
        seo_keyword_count: answers.seoIntelligence?.rankings.length,
      },
      tags: [
        'pipeline-100-lead',
        `score-${result.band}`,
        `services-${answers.services.join('-').toLowerCase()}`,
        `zone-${answers.radius}mi`,
        result.guaranteeStatus.includes('guarantee') ? 'guarantee-eligible' : 'baseline-service'
      ]
    };

    // Create lead in Close.com (Close uses Basic auth)
    const auth = btoa(closeApiKey + ':');
    const closeResponse = await fetch('https://api.close.com/api/v1/lead/', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: `Pipeline 100: ${answers.businessName} (${answers.city})`,
        description: `Score: ${result.score} | Band: ${result.band} | Services: ${answers.services.join(', ')}`,
        contacts: [payload.contact],
        custom: Object.fromEntries([
          ['cf_dkzXWsG8XURLpM2jhec1MxSdy1MNXj649awQLJOwhJt', answers.businessName], // Company Name
          ['cf_X2wd1gXdMqVEGgpnDq1wWQs5BWpdJJ1c9BLrGcGJZ7N', answers.city], // Company City
          ['cf_HT8ccLEkuvMEEBV7WstnTZQoY6dJlnpC4QEPUadvFdw', 'Construction'], // Industry
          ['cf_DL209Bmqipm91l59MeQNu1GLqu2Y2vxIRvQQQFXMSHI', `${answers.radius}mi radius`], // Company Size (repurposed)
          ['cf_1WvfPBArTXpA1i5swai7sV6OeD5MU8mHyvGgRJ94HCN', `Pipeline Score: ${result.score} (${result.band})`], // Custom Field
          answers.businessData?.website ? ['cf_MkPi3BcTN5nMkFVQQKOn4rU71jzkaFyYAoDPj5rpnCJ', answers.businessData.website] : null, // Company Website
          ['cf_95HDTecROgvLw8XdsFp6MU0U2fxOyrjLe0DZcB6Lihj', `Services: ${answers.services.join(', ')} | Response: ${answers.responseTime}min | SMS: ${answers.smsCapability}`], // Socials (repurposed for service details)
        ].filter(entry => entry !== null)),
        status_id: 'stat_1uXDXW5xheJavWF8ge89acFKdt6spmsce4uohwGL4iH', // Potential status
      }),
    });

    const closeData = await closeResponse.json();

    if (!closeResponse.ok) {
      console.error('Close.com API error:', closeData);
      return res.status(closeResponse.status).json({
        error: 'Failed to create lead in Close.com',
        details: closeData
      });
    }

    console.log('Successfully created Close.com lead:', closeData.id);

    // Add tags to the lead
    if (payload.tags && payload.tags.length > 0) {
      try {
        await fetch(`https://api.close.com/api/v1/lead/${closeData.id}/`, {
          method: 'PUT',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            tags: payload.tags
          }),
        });
      } catch (tagError) {
        console.warn('Failed to add tags to Close.com lead:', tagError);
        // Don't fail the whole request for tag errors
      }
    }

    return res.status(200).json({
      success: true,
      lead_id: closeData.id,
      message: 'Successfully created lead in Close.com'
    });

  } catch (error) {
    console.error('Close.com webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}