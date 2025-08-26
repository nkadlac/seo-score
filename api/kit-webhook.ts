import type { VercelRequest, VercelResponse } from '@vercel/node';
import { KitWebhookPayload } from '../src/types/quiz';

/**
 * Kit.com API Integration
 * Subscribes users to email sequences based on their quiz results
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const payload: KitWebhookPayload = req.body;
    
    // Validate required fields
    if (!payload.email || !payload.fields.score) {
      return res.status(400).json({ 
        error: 'Missing required fields: email and score' 
      });
    }

    // Get Kit API credentials from environment
    const kitApiKey = process.env.KIT_API_KEY;
    const kitApiSecret = process.env.KIT_API_SECRET;
    
    if (!kitApiKey && !kitApiSecret) {
      console.error('Kit.com API credentials not configured');
      return res.status(500).json({ 
        error: 'Kit.com integration not configured' 
      });
    }

    console.log('Sending to Kit.com:', {
      email: payload.email,
      tags: payload.tags,
      score: payload.fields.score
    });

    // Kit.com API v4 endpoint for subscribing to form (form ID: 8480887)
    const kitResponse = await fetch('https://api.kit.com/v4/forms/8480887/subscribers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Kit-Api-Key': kitApiKey || '',
      },
      body: JSON.stringify({
        email_address: payload.email,
        first_name: payload.fields.full_name ? payload.fields.full_name.split(' ')[0] : '',
        fields: {
          // Custom fields (these must already exist in your Kit account)
          pipeline_score: payload.fields.score,
          city: payload.fields.city,
          business_name: payload.fields.business_name,
          top_move_1: payload.fields.top_move_1,
          guarantee_status: payload.fields.guarantee_status,
          
          // GBP Intelligence for personalization (only if fields exist)
          gbp_rating: payload.fields.gbp_rating?.toString() || '',
          gbp_review_count: payload.fields.gbp_review_count?.toString() || '',
          gbp_phone: payload.fields.gbp_phone || '',
          gbp_website: payload.fields.gbp_website || '',
          
          // SEO Intelligence for personalization (only if fields exist)
          seo_missed_leads: payload.fields.seo_missed_leads?.toString() || '',
          seo_top_opportunity: payload.fields.seo_top_opportunity || '',
        }
      }),
    });

    const kitData = await kitResponse.json();

    if (!kitResponse.ok) {
      console.error('Kit.com API error:', kitData);
      return res.status(kitResponse.status).json({
        error: 'Failed to subscribe to Kit.com',
        details: kitData
      });
    }

    console.log('Successfully subscribed to Kit.com form 8480887:', kitData);

    // Add tags to subscriber if provided (v4 API)
    if (payload.tags && payload.tags.length > 0) {
      try {
        for (const tag of payload.tags) {
          // Note: This assumes tags exist in your Kit account
          // For v4 API, we add tags by email
          await fetch(`https://api.kit.com/v4/tags/${tag}/subscribers`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Kit-Api-Key': kitApiKey || '',
            },
            body: JSON.stringify({
              email_address: payload.email
            })
          });
        }
      } catch (tagError) {
        console.warn('Failed to add tags to subscriber:', tagError);
        // Don't fail the whole request for tag errors
      }
    }

    // Return success response
    return res.status(200).json({
      success: true,
      subscription: kitData,
      message: 'Successfully subscribed to Kit form 8480887'
    });

  } catch (error) {
    console.error('Kit.com webhook error:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}