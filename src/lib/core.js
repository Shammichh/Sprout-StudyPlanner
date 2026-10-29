// Shared constants, date helpers and game rules.
export const KEY = 'sprout1';

export const D = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const addDays = (n) => { const x = new Date(); x.setDate(x.getDate() + n); return D(x); };
export const fd = (d) => new Date(d + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
export const fmt = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export const LV = [0, 20, 60, 120, 200]; // XP needed for each growth stage
export const STAGES = ['Seed', 'Sprout', 'Seedling', 'Budding', 'Fully grown'];
export const stageOf = (xp) => LV.filter((l) => xp >= l).length - 1;

export const THEMES = {
  meadow: { name: 'Meadow', price: 0 },
  blossom: { name: 'Blossom', price: 30, mode: 'light' },
  night: { name: 'Night garden', price: 40, mode: 'dark' },
  orchid: { name: 'Orchid', plus: true, mode: 'light' },
  dusk: { name: 'Dusk', plus: true, mode: 'dark' },
};

export const fresh = () => ({
  name: '', tasks: [], sessions: [], coins: 0, theme: 'meadow', accent: '', bg: '', owned: ['meadow'],
  plant: { type: 'sprout', name: '', xp: 0 }, shelf: [], seeds: ['sprout'],
  frozen: [], freezes: 0, cf: 40, cb: 10, goal: 60, cycle: 0, sub: '', notified: {},
});

export const load = () => {
  try { return { ...fresh(), ...JSON.parse(localStorage.getItem(KEY)) }; } catch { return fresh(); }
};

export const totalMin = (S) => S.sessions.reduce((a, s) => a + s.min, 0);
export const doneCount = (S) => S.tasks.filter((t) => t.done).length;

// A streak = consecutive days with a saved session (a streak freeze counts as a day).
export function streaks(S) {
  const ds = [...new Set(S.sessions.map((s) => s.date).concat(S.frozen))].sort();
  let best = 0, run = 0, prev = null;
  for (const d of ds) { run = prev && new Date(d) - new Date(prev) === 864e5 ? run + 1 : 1; best = Math.max(best, run); prev = d; }
  let cur = 0; const x = new Date();
  if (!ds.includes(D(x))) x.setDate(x.getDate() - 1);
  while (ds.includes(D(x))) { cur++; x.setDate(x.getDate() - 1); }
  return { cur, best };
}

export const SEEDS = {
  sprout: { name: 'Sprout', req: 'Starter seed', ok: () => true },
  sunflower: { name: 'Sunflower', req: 'Reach a 3-day streak', ok: (S) => streaks(S).best >= 3 },
  cactus: { name: 'Cactus', req: 'Study 300 minutes in total', ok: (S) => totalMin(S) >= 300 },
  bonsai: { name: 'Bonsai', req: 'Complete 10 tasks', ok: (S) => doneCount(S) >= 10 },
};

export function beep() {
  try {
    const c = new (window.AudioContext || window.webkitAudioContext)(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); g.gain.value = 0.1; o.frequency.value = 660; o.start(); o.stop(c.currentTime + 0.4);
  } catch { /* sound is optional */ }
}
