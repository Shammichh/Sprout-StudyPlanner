import crypto from 'node:crypto';
import { rest } from './_lib.js';

// Stripe calls this URL when someone subscribes, renews or cancels.
// We read the raw body, because the signature is calculated over the exact bytes.
export const config = { api: { bodyParser: false } };

const raw = (req) => new Promise((ok, no) => { const c = []; req.on('data', (d) => c.push(d)); req.on('end', () => ok(Buffer.concat(c))); req.on('error', no); });

function verify(body, header, secret) {
  const p = Object.fromEntries(header.split(',').map((x) => x.split('=')));
  if (!p.t || !p.v1) return false;
  const expected = crypto.createHmac('sha256', secret).update(`${p.t}.${body}`).digest('hex');
  return p.v1.length === expected.length && crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(p.v1)) && Math.abs(Date.now() / 1000 - p.t) < 300;
}

export default async function handler(req, res) {
  const body = (await raw(req)).toString('utf8');
  if (!verify(body, req.headers['stripe-signature'] || '', process.env.STRIPE_WEBHOOK_SECRET)) return res.status(400).send('Bad signature');

  const ev = JSON.parse(body), o = ev.data.object;

  if (ev.type === 'checkout.session.completed' && o.mode === 'subscription') {
    await rest('subscriptions?on_conflict=user_id', {
      method: 'POST', headers: { Prefer: 'resolution=merge-duplicates' },
      body: JSON.stringify({ user_id: o.client_reference_id, stripe_customer_id: o.customer, status: 'active' }),
    });
  }
  if (ev.type === 'customer.subscription.updated' || ev.type === 'customer.subscription.deleted') {
    await rest(`subscriptions?stripe_customer_id=eq.${o.customer}`, {
      method: 'PATCH',
      body: JSON.stringify({ status: o.status, current_period_end: new Date(o.current_period_end * 1000).toISOString() }),
    });
  }
  res.json({ received: true });
}
