import type { VercelRequest, VercelResponse } from '@vercel/node';

// Minimal webhook to mark calendar booked in Close by email if possible
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, name, start_time, provider } = req.body || {};
    if (!email) return res.status(400).json({ error: 'Missing email' });

    const apiKey = process.env.CLOSE_API_KEY?.trim();
    if (!apiKey) return res.status(200).json({ success: true, updated: false });

    // Best-effort: create a lead note indicating booking; real implementation could search/update custom fields
    const auth = Buffer.from(apiKey + ':').toString('base64');
    // Create a lead if it doesn't exist could be done by search; here we just log as server-side side effect
    await fetch('https://api.close.com/api/v1/activity/lead_note/', {
      method: 'POST',
      headers: { 'Authorization': `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        // Close requires a lead_id; without searching we cannot attach. So we no-op but respond success.
        // This is intentionally a stub to be expanded when lead ids are available in the payload.
      })
    }).catch(() => {});

    return res.status(200).json({ success: true, updated: false, message: 'Stubbed without lead_id' });
  } catch (e) {
    console.error('calendar webhook error', e);
    return res.status(500).json({ error: 'Internal server error' });
  }
}

