import { addDays, streaks, totalMin, doneCount } from './lib/core';

export default function Stats({ S }) {
  const s = streaks(S), t = totalMin(S);
  const days = Array.from({ length: 7 }, (_, i) => { const d = addDays(i - 6); return [d.slice(8), S.sessions.filter((x) => x.date === d).reduce((a, x) => a + x.min, 0)]; });
  const mx = Math.max(30, ...days.map((d) => d[1]));
  const bySub = {}; S.sessions.forEach((x) => { if (x.sub) bySub[x.sub] = (bySub[x.sub] || 0) + x.min; });
  const subs = Object.entries(bySub).sort((a, b) => b[1] - a[1]);
  return (<>
    <section className="card">
      <h2>Your progress</h2>
      <div className="grid">
        <div className="stat"><b>{Math.floor(t / 60)}h {t % 60}m</b>Total study time</div>
        <div className="stat"><b>{doneCount(S)}</b>Tasks completed</div>
        <div className="stat"><b>{s.cur}</b>Current streak (days)</div>
        <div className="stat"><b>{s.best}</b>Longest streak</div>
        <div className="stat"><b>{S.shelf.length + (S.plant ? 1 : 0)}</b>Plants</div>
      </div>
    </section>
    {subs.length > 0 && <section className="card"><h2>Time per subject</h2>{subs.map(([k, v]) => (
      <div className="row sub-row" key={k}><span className="sub-name">{k}</span><div className="bar grow"><i style={{ width: `${(v / subs[0][1]) * 100}%` }} /></div><span className="mute">{v} min</span></div>
    ))}</section>}
    <section className="card">
      <h2>Last 7 days (minutes)</h2>
      <div className="bars">{days.map((d, i) => <div key={i}><i style={{ height: `${(d[1] / mx) * 80}px` }} />{d[1]}<br />{d[0]}</div>)}</div>
    </section>
  </>);
}
