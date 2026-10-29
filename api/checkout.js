import { getUser, rest, stripe } from './_lib.js';

// POST /api/checkout  ->  { url } of a Stripe Checkout page for Sprout Plus
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'POST only' });
  const user = await getUser(req);
  if (!user) return res.status(401).json({ error: 'Please log in first' });

  const site = process.env.SITE_URL;
  const found = await (await rest(`subscriptions?user_id=eq.${user.id}&select=stripe_customer_id`)).json();
  const customer = found?.[0]?.stripe_customer_id;

  const session = await stripe('checkout/sessions', {
    mode: 'subscription',
    'line_items[0][price]': process.env.STRIPE_PRICE_ID,
    'line_items[0][quantity]': '1',
    client_reference_id: user.id,
    ...(customer ? { customer } : { customer_email: user.email }),
    allow_promotion_codes: 'true',
    success_url: `${site}/?plus=success`,
    cancel_url: `${site}/`,
  });
  if (!session.url) return res.status(500).json({ error: session.error?.message || 'Could not start checkout' });
  res.json({ url: session.url });
}
