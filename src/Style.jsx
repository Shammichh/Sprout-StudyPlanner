import { useState } from 'react';
import { THEMES } from './lib/core';

export default function Style({ S, upd, toast, cloud }) {
  const [busy, setBusy] = useState(false);

  const pick = (k) => {
    const t = THEMES[k];
    if (t.plus && !cloud.plus) return toast('Sprout Plus unlocks this theme');
    if (!S.owned.includes(k) && t.price) {
      if (S.coins < t.price) return toast(`You need ${t.price - S.coins} more coins`);
      upd((s) => { s.coins -= t.price; s.owned.push(k); });
    }
    upd((s) => { s.theme = k; });
  };
  const go = async (fn) => { setBusy(true); const err = await fn(); if (err) toast(err); setBusy(false); };
  const reminders = () => {
    if (!('Notification' in window)) return toast('Notifications are not supported here');
    Notification.requestPermission().then((p) => toast(p === 'granted' ? 'Reminders are on while Sprout is open' : 'Notifications are blocked in your browser'));
  };

  return (<>
    <section className="card">
      <h2>Themes</h2>
      <div className="grid">{Object.entries(THEMES).map(([k, t]) => {
        const own = S.owned.includes(k), locked = t.plus && !cloud.plus;
        return (
          <div key={k} className="stat">
            <b className="small-b">{t.name}{t.plus && <span className="plus-badge"> Plus</span>}</b>
            <button className={`sm ${S.theme === k ? 'on' : ''}`} onClick={() => pick(k)}>
              {S.theme === k ? 'Applied' : locked ? 'Plus only' : own || !t.price ? 'Apply' : `Buy · ${t.price} coins`}
            </button>
          </div>
        );
      })}</div>
      {cloud.plus && <div className="row gap-top"><label htmlFor="bg">Background</label>
        <select id="bg" style={{ width: 'auto' }} value={S.bg} onChange={(e) => upd((s) => { s.bg = e.target.value; })}>
          <option value="">Plain</option><option value="leaves">Leaves</option><option value="sprouts">Sprouts</option>
        </select></div>}
    </section>

    <section className="card">
      <h2>Accent colour</h2>
      <div className="row"><input type="color" aria-label="Accent colour" value={S.accent || '#3f7d58'} onChange={(e) => upd((s) => { s.accent = e.target.value; })} style={{ width: 60, padding: 2 }} />
        <button className="sm" onClick={() => upd((s) => { s.accent = ''; })}>Reset</button></div>
    </section>

    <section className="card">
      <h2>Sprout Plus</h2>
      {!cloud.enabled ? <p className="mute">Plus needs accounts. Connect Supabase first (see README).</p>
        : !cloud.user ? <p className="mute">Log in on the Friends tab to subscribe.</p>
        : cloud.plus ? <>
            <p>You have Sprout Plus. Thank you for supporting Sprout.</p>
            <button className="sm" disabled={busy} onClick={() => go(cloud.manage)}>Manage or cancel subscription</button>
          </> : <>
            <p>Unlock the Orchid and Dusk themes and botanical backgrounds. Everything else stays free. Cancel any time.</p>
            <button className="pri" disabled={busy} onClick={() => go(cloud.upgrade)}>Get Sprout Plus</button>
          </>}
    </section>

    <section className="card">
      <h2>Streak freezes</h2>
      <p className="mute">A freeze protects your streak if you miss one day. It is used automatically.</p>
      <div className="row"><b>{S.freezes} owned</b>
        <button className="sm" onClick={() => { if (S.coins < 30) return toast('You need 30 coins'); upd((s) => { s.coins -= 30; s.freezes += 1; }); toast('Streak freeze added'); }}>Buy · 30 coins</button></div>
    </section>

    <section className="card">
      <h2>Reminders</h2>
      <p className="mute">Get a notification for tasks due today or tomorrow while Sprout is open in a browser tab.</p>
      <button className="sm" onClick={reminders}>Turn on reminders</button>
    </section>

    <section className="card">
      <h2>Daily study goal</h2>
      <div className="row"><input type="number" min="5" max="600" aria-label="Daily goal in minutes" style={{ width: 100 }} value={S.goal} onChange={(e) => upd((s) => { s.goal = Math.max(5, +e.target.value || 60); })} /><span className="mute">minutes per day</span></div>
    </section>

    <section className="card">
      <h2>Profile</h2>
      <input placeholder="Your name" aria-label="Your name" value={S.name} onChange={(e) => upd((s) => { s.name = e.target.value; })} />
    </section>
  </>);
}
