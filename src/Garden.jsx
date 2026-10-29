import Plant from './Plant';
import { LV, STAGES, SEEDS, stageOf } from './lib/core';

export default function Garden({ S, upd, toast }) {
  const p = S.plant, st = p ? stageOf(p.xp) : 0, next = p && st < 4 ? LV[st + 1] : 0;
  const last = S.sessions.length ? S.sessions[S.sessions.length - 1].date : null;
  const wilt = !!p && !!last && (new Date() - new Date(last + 'T00:00')) / 864e5 >= 3; // 3+ days without studying
  return (<>
    {p ? (
      <section className="card">
        <div className={`hero ${wilt ? 'wilt' : ''}`}><Plant type={p.type} stage={st} /></div>
        {wilt && <p className="mute">Your plant looks droopy. A short focus session will perk it up. No XP is lost.</p>}
        <div className="row gap-top"><input className="grow" placeholder="Name your plant" aria-label="Plant name" value={p.name} onChange={(e) => upd((s) => { s.plant.name = e.target.value; })} /></div>
        <p className="line"><b>{STAGES[st]}</b> · {p.xp} XP{next ? ` · next stage at ${next}` : ''}</p>
        <div className="bar"><i style={{ width: `${Math.min(100, p.xp / 2)}%` }} /></div>
        {st === 4 && <button className="pri gap-top" onClick={() => { upd((s) => { s.shelf.push(s.plant); s.plant = null; s.coins += 50; }); toast('Plant moved to your shelf · +50 coins'); }}>Move to profile shelf (+50 coins)</button>}
      </section>
    ) : <section className="card"><p>Your garden bed is empty. Pick a seed below.</p></section>}
    <section className="card">
      <h2>Seeds</h2>
      <div className="grid">{Object.entries(SEEDS).map(([k, s]) => {
        const ok = S.seeds.includes(k);
        return (
          <div key={k} className={`stat ${ok ? '' : 'lock'}`}>
            <b className="small-b">{s.name}</b><span className="mute">{ok ? 'Unlocked' : `Locked: ${s.req}`}</span>
            {ok && <div><button className="sm gap-top" disabled={!!p} onClick={() => upd((x) => { x.plant = { type: k, name: '', xp: 0 }; })}>Plant</button></div>}
          </div>
        );
      })}</div>
    </section>
    <section className="card">
      <h2>Profile shelf</h2>
      {S.shelf.length ? <div className="row">{S.shelf.map((x, i) => <div key={i} className="center-text"><Plant type={x.type} stage={4} size={90} /><div className="mute">{x.name || SEEDS[x.type].name}</div></div>)}</div>
        : <p className="mute">Fully grown plants will be displayed here for others to see.</p>}
    </section>
  </>);
}
