import { fmt, D } from './lib/core';

export default function Timer({ S, upd, toast, T }) {
  const status = T.run ? 'Running' : T.left < T.total ? 'Paused' : 'Ready';
  const subjects = [...new Set(S.tasks.map((t) => t.sub).filter(Boolean))];
  const today = S.sessions.filter((x) => x.date === D()).reduce((a, x) => a + x.min, 0);
  const custom = T.m === 4 || T.m === 5;
  const setMinutes = (e) => {
    const v = Math.min(240, Math.max(1, Math.round(+e.target.value) || 1));
    upd((s) => { if (T.m === 4) s.cf = v; else s.cb = v; });
  };
  return (<>
    <section className="card">
      <h2>Focus timer</h2>
      <div className="row">{T.modes.map((m, i) => <button key={i} className={`sm ${T.m === i ? 'on' : ''}`} onClick={() => T.pick(i)}>{m.n}</button>)}</div>
      <div className="row gap-top">
        <label htmlFor="sub">Subject</label>
        <select id="sub" style={{ width: 'auto' }} value={S.sub} onChange={(e) => upd((s) => { s.sub = e.target.value; })}>
          <option value="">None</option>{subjects.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>
      {custom && <div className="row gap-top"><label htmlFor="cm">Minutes</label><input id="cm" type="number" min="1" max="240" value={T.modes[T.m].s / 60} onChange={setMinutes} style={{ width: 90 }} /></div>}
      <div className="clock">{fmt(T.left)}</div>
      <div className="bar"><i style={{ width: `${(1 - T.left / T.total) * 100}%` }} /></div>
      <p className="mute center-text">{status}</p>
      <div className="row center">
        <button className="pri" onClick={T.toggle}>{T.run ? 'Pause' : T.left < T.total ? 'Resume' : 'Start'}</button>
        <button onClick={() => { if (!T.finish()) toast('Study at least 1 minute to save a session'); }}>Finish early</button>
        <button onClick={T.reset}>Reset</button>
      </div>
      <p className="mute center-text">{S.plant ? `Finished focus sessions give your ${S.plant.name || 'plant'} 1 XP per minute and coins.` : 'Plant a seed in the Garden to earn XP from sessions.'}</p>
    </section>
    <section className="card">
      <h2>Today’s goal</h2>
      <div className="bar"><i style={{ width: `${Math.min(100, (today / S.goal) * 100)}%` }} /></div>
      <p className="mute">{today} of {S.goal} minutes{today >= S.goal ? ' · goal reached!' : ''}</p>
    </section>
  </>);
}
