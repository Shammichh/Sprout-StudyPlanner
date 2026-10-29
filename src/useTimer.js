import { useState, useRef, useEffect } from 'react';
import { beep, fmt } from './lib/core';

export const modesOf = (S) => [
  { n: 'Focus 25', s: 1500, min: 25 }, { n: 'Focus 50', s: 3000, min: 50 },
  { n: 'Break 5', s: 300, min: 0 }, { n: 'Demo 10 sec', s: 10, min: 1 },
  { n: 'Custom focus', s: S.cf * 60, min: S.cf }, { n: 'Custom break', s: S.cb * 60, min: 0 },
  { n: 'Long break 15', s: 900, min: 0 },
];

// Lives in App so the timer keeps running when you switch tabs.
// It counts against an end timestamp, so it stays accurate in background tabs.
export function useTimer(S, onSession) {
  const modes = modesOf(S);
  const [m, setM] = useState(0), [left, setLeft] = useState(1500), [run, setRun] = useState(false);
  const end = useRef(0), lastFocus = useRef(0), done = useRef();
  const total = modes[m].s;

  useEffect(() => { if (!run) setLeft(modes[m].s); }, [m, S.cf, S.cb]); // eslint-disable-line

  done.current = () => {
    setRun(false); beep();
    if (modes[m].min) { lastFocus.current = m; setM(onSession(modes[m].min, false) ? 6 : 2); }
    else setM(lastFocus.current);
  };

  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => {
      const l = Math.max(0, Math.round((end.current - Date.now()) / 1000));
      setLeft(l); document.title = `${fmt(l)} · Sprout`;
      if (l === 0) done.current();
    }, 500);
    return () => { clearInterval(id); document.title = 'Sprout – study planner'; };
  }, [run]);

  return {
    modes, m, left, run, total,
    pick: (i) => { setRun(false); setM(i); },
    toggle: () => { if (run) setRun(false); else { end.current = Date.now() + left * 1000; setRun(true); } },
    reset: () => { setRun(false); setLeft(total); },
    finish: () => { // save the minutes studied so far
      const min = modes[m].min ? Math.floor((total - left) / 60) : 0;
      if (min < 1) return false;
      setRun(false); onSession(min, true); setLeft(total); return true;
    },
  };
}
