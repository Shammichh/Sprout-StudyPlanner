import { getUser, rest, stripe } from './_lib.js';

// POST /api/portal  ->  { url } of Stripe's page to update payment details or cancel
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Please log in first' });

  const found = await (await rest(`subscriptions?user_id=eq.${user.id}&select=stripe_customer_id`)).json();
  const customer = found?.[0]?.stripe_customer_id;
  if (!customer) return res.status(404).json({ error: 'No subscription found' });

  const portal = await stripe('billing_portal/sessions', { customer, return_url: process.env.SITE_URL });
  if (!portal.url) return res.status(500).json({ error: portal.error?.message || 'Could not open the billing page' });
  res.json({ url: portal.url });
}
