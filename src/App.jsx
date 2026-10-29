import { useState, useEffect, useRef } from 'react';
import { KEY, load, fresh, D, addDays, THEMES, SEEDS, streaks } from './lib/core';
import { useCloud } from './useCloud';
import { useTimer } from './useTimer';
import Planner from './Planner';
import Timer from './Timer';
import Garden from './Garden';
import Stats from './Stats';
import Style from './Style';
import Friends from './Friends';

const TABS = [['planner', 'Planner'], ['timer', 'Focus'], ['garden', 'Garden'], ['stats', 'Stats'], ['style', 'Style'], ['friends', 'Friends']];

export default function App() {
  const [S, setS] = useState(load), [view, setView] = useState('planner'), [msg, setMsg] = useState('');
  const tt = useRef();

  // upd(fn): copy the state, let fn change the copy, store it. Keeps the code below short.
  const upd = (fn) => setS((s) => { const n = structuredClone(s); fn(n); return n; });
  const toast = (m) => { setMsg(m); clearTimeout(tt.current); tt.current = setTimeout(() => setMsg(''), 2600); };

  const cloud = useCloud(S, setS);

  // Called by the timer when a session ends. Returns true when a long break is due.
  const saveSession = (min, early) => {
    const longBreak = !early && (S.cycle + 1) % 4 === 0;
    upd((s) => {
      s.sessions.push({ date: D(), min, sub: s.sub });
      s.coins += Math.floor(min / 5);
      if (s.plant) s.plant.xp = Math.min(200, s.plant.xp + min);
      if (!early) s.cycle += 1;
    });
    toast(`Session saved: ${min} min` + (early ? '' : longBreak ? '. Time for a long break.' : '. Take a short break.'));
    return longBreak;
  };
  const T = useTimer(S, saveSession);

  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch { /* storage full or blocked */ } }, [S]);

  // Theme, accent colour and Plus background. Plus themes fall back to Meadow if Plus ends.
  useEffect(() => {
    const r = document.documentElement, name = THEMES[S.theme]?.plus && !cloud.plus ? 'meadow' : S.theme, t = THEMES[name] || THEMES.meadow;
    if (name === 'meadow') { r.removeAttribute('data-t'); r.removeAttribute('data-theme'); } else { r.dataset.t = name; r.dataset.theme = t.mode; }
    if (S.accent) r.style.setProperty('--ac', S.accent); else r.style.removeProperty('--ac');
    document.body.dataset.bg = cloud.plus ? S.bg : '';
  }, [S.theme, S.accent, S.bg, cloud.plus]);

  // Unlock seeds.
  useEffect(() => {
    const add = Object.keys(SEEDS).filter((k) => SEEDS[k].ok(S) && !S.seeds.includes(k));
    if (add.length) { upd((s) => { add.forEach((k) => { if (!s.seeds.includes(k)) s.seeds.push(k); }); }); toast(`${SEEDS[add[0]].name} seed unlocked!`); }
  }, [S]); // eslint-disable-line

  // A streak freeze covers exactly one missed day.
  useEffect(() => {
    const ds = new Set(S.sessions.map((x) => x.date).concat(S.frozen)), y = addDays(-1);
    if (S.freezes > 0 && !ds.has(y) && ds.has(addDays(-2))) {
      upd((s) => { if (!s.frozen.includes(y) && s.freezes > 0) { s.frozen.push(y); s.freezes -= 1; } });
      toast('A streak freeze protected your streak');
    }
  }, [S.sessions.length, S.freezes]); // eslint-disable-line

  // Deadline reminders (only while the tab is open).
  useEffect(() => {
    const id = setInterval(() => {
      if (!('Notification' in window) || Notification.permission !== 'granted') return;
      S.tasks.filter((t) => !t.done && t.due <= addDays(1) && S.notified[t.id] !== D()).forEach((t) => {
        new Notification(`Sprout: ${t.title}`, { body: (t.due < D() ? 'Overdue since ' : 'Due ') + t.due });
        upd((s) => { s.notified[t.id] = D(); });
      });
    }, 60000);
    return () => clearInterval(id);
  }, [S]); // eslint-disable-line

  const props = { S, upd, toast, cloud, T };
  return (
    <div className="wrap">
      <header>
        <h1>Sprout</h1>
        <span className="coin">{cloud.plus && <b className="plus-badge">Plus</b>} {S.coins} coins · {streaks(S).cur}-day streak</span>
      </header>
      <nav>{TABS.map(([k, l]) => <button key={k} className={view === k ? 'on' : ''} onClick={() => setView(k)}>{l}</button>)}</nav>
      <main>
        {S.name && view === 'planner' && <p className="mute">Hi {S.name}, here is what is coming up.</p>}
        {view === 'planner' && <Planner {...props} />}
        {view === 'timer' && <Timer {...props} />}
        {view === 'garden' && <Garden {...props} />}
        {view === 'stats' && <Stats {...props} />}
        {view === 'style' && <Style {...props} />}
        {view === 'friends' && <Friends {...props} />}
      </main>
      <div id="toast" className={msg ? 'show' : ''} role="status">{msg}</div>
    </div>
  );
}
