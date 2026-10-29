import { useState } from 'react';
import { D, addDays, fd } from './lib/core';

const cmp = (a, b) => a.due.localeCompare(b.due) || (b.pri ?? 1) - (a.pri ?? 1);
const byDay = (tasks, d) => tasks.filter((t) => t.due === d).sort((a, b) => a.done - b.done || (b.pri ?? 1) - (a.pri ?? 1));

function Row({ t, upd, toast, onEdit, showDate }) {
  const late = !t.done && t.due < D();
  const toggle = () => {
    upd((s) => { const x = s.tasks.find((y) => y.id === t.id); x.done = !x.done; if (x.done && !x.paid) { x.paid = 1; s.coins += 5; } });
    if (!t.done && !t.paid) toast('Task done · +5 coins');
  };
  return (
    <div className={`task ${t.done ? 'd' : ''}`}>
      <button className={`chk ${t.done ? 'on' : ''}`} onClick={toggle} aria-label={t.done ? 'Mark open' : 'Mark complete'}>{t.done ? '✓' : ''}</button>
      <div className="grow">
        <div className="tt">{t.title}{t.pri === 2 && !t.done && <span className="late"> High priority</span>}</div>
        <div className={`mute ${late ? 'late' : ''}`}>{[late && 'Overdue', (showDate || late) && fd(t.due), t.sub].filter(Boolean).join(' · ')}</div>
        {t.note && <div className="mute">{t.note}</div>}
      </div>
      <button className="sm" onClick={() => onEdit(t.id)}>Edit</button>
      <button className="sm" onClick={() => upd((s) => { s.tasks = s.tasks.filter((y) => y.id !== t.id); })}>Delete</button>
    </div>
  );
}

function TaskForm({ init, pre, subjects, onSave, onCancel }) {
  const [f, setF] = useState(init || { title: '', due: pre || '', pri: 1, sub: '', note: '' }), [err, setErr] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: k === 'pri' ? +e.target.value : e.target.value });
  const submit = (e) => {
    e.preventDefault();
    if (!f.title.trim() || !f.due) return setErr('Add a title and a due date.'); // description stays optional
    onSave({ ...f, title: f.title.trim(), sub: f.sub.trim(), note: f.note.trim() });
  };
  return (
    <form className="card" onSubmit={submit}>
      <h2>{init ? 'Edit task' : 'New task'}</h2>
      <div className="row">
        <input className="grow" placeholder="Title" aria-label="Title" value={f.title} onChange={set('title')} autoFocus />
        <input type="date" aria-label="Due date" value={f.due} onChange={set('due')} style={{ width: 'auto' }} />
        <select aria-label="Priority" value={f.pri} onChange={set('pri')} style={{ width: 'auto' }}>
          {['Low', 'Medium', 'High'].map((p, i) => <option key={i} value={i}>{p} priority</option>)}
        </select>
      </div>
      <div className="row gap-top">
        <input className="grow" list="subs" placeholder="Subject (optional)" aria-label="Subject" value={f.sub} onChange={set('sub')} />
        <datalist id="subs">{subjects.map((s) => <option key={s} value={s} />)}</datalist>
      </div>
      <textarea rows="2" className="gap-top" placeholder="Notes (optional)" aria-label="Notes" value={f.note} onChange={set('note')} />
      <div className="row gap-top">
        <button className="pri" type="submit">{init ? 'Save changes' : 'Add task'}</button>
        <button type="button" onClick={onCancel}>Cancel</button><span className="err">{err}</span>
      </div>
    </form>
  );
}

const Pager = ({ label, setOff }) => (
  <div className="row between gap-bottom">
    <button className="sm" onClick={() => setOff((o) => o - 1)} aria-label="Previous">‹</button>
    <b>{label}</b>
    <button className="sm" onClick={() => setOff((o) => o + 1)} aria-label="Next">›</button>
  </div>
);

export default function Planner({ S, upd, toast }) {
  const [pv, setPv] = useState('list'), [off, setOff] = useState(0), [sel, setSel] = useState(null), [form, setForm] = useState(null);
  const t0 = D(), subjects = [...new Set(S.tasks.map((t) => t.sub).filter(Boolean))];
  const edit = form?.id ? S.tasks.find((t) => t.id === form.id) : null;

  const save = (f) => {
    upd((s) => { if (edit) Object.assign(s.tasks.find((t) => t.id === edit.id), f); else s.tasks.push({ id: Date.now(), done: false, ...f }); });
    setForm(null);
  };
  const row = (t, showDate) => <Row key={t.id} {...{ t, upd, toast, showDate }} onEdit={(id) => setForm({ id })} />;
  const dayCard = (d, title) => {
    const l = byDay(S.tasks, d);
    return (
      <div className={`card ${d === t0 ? 'today-card' : ''}`} key={d}>
        <div className="row between"><b>{title}</b><button className="sm" onClick={() => setForm({ pre: d })}>+ Add</button></div>
        {l.length ? l.map((t) => row(t)) : <p className="mute nomargin">Nothing planned</p>}
      </div>
    );
  };
  const switchView = (v) => { setPv(v); setOff(0); setSel(null); };

  let body;
  if (pv === 'list') {
    const open = S.tasks.filter((t) => !t.done).sort(cmp), t1 = addDays(1), t7 = addDays(7), done = S.tasks.filter((t) => t.done);
    const groups = [
      ['Overdue', open.filter((t) => t.due < t0)], ['Today', open.filter((t) => t.due === t0)], ['Tomorrow', open.filter((t) => t.due === t1)],
      ['Next 7 days', open.filter((t) => t.due > t1 && t.due <= t7)], ['Later', open.filter((t) => t.due > t7)],
    ].filter((g) => g[1].length);
    body = (<>
      {groups.length ? groups.map(([n, l]) => (
        <div className="card" key={n}><h2 className={n === 'Overdue' ? 'late' : ''}>{n} <span className="mute">{l.length}</span></h2>{l.map((t) => row(t, true))}</div>
      )) : <div className="card"><p className="mute">Nothing left to do. Add a task to plan ahead.</p></div>}
      {done.length > 0 && <details className="card"><summary>Done ({done.length})</summary>{done.map((t) => row(t, true))}</details>}
    </>);
  } else if (pv === 'week') {
    const mon = new Date(); mon.setDate(mon.getDate() - ((mon.getDay() + 6) % 7) + 7 * off);
    const days = Array.from({ length: 7 }, (_, i) => { const x = new Date(mon); x.setDate(mon.getDate() + i); return D(x); });
    body = (<><Pager label={off ? `${fd(days[0])} – ${fd(days[6])}` : 'This week'} setOff={setOff} />{days.map((d) => dayCard(d, fd(d) + (d === t0 ? ' · Today' : '')))}</>);
  } else {
    const base = new Date(); base.setDate(1); base.setMonth(base.getMonth() + off);
    const y = base.getFullYear(), mo = base.getMonth(), n = new Date(y, mo + 1, 0).getDate(), lead = (base.getDay() + 6) % 7;
    const ds = (i) => D(new Date(y, mo, i)), prefix = ds(1).slice(0, 7);
    const cur = sel && sel.startsWith(prefix) ? sel : t0.startsWith(prefix) ? t0 : ds(1);
    body = (<>
      <Pager label={base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })} setOff={setOff} />
      <div className="card"><div className="cal">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((x) => <span key={x} className="mute center-text">{x}</span>)}
        {Array.from({ length: lead }, (_, i) => <span key={'b' + i} />)}
        {Array.from({ length: n }, (_, i) => {
          const d = ds(i + 1), c = S.tasks.filter((t) => t.due === d && !t.done).length;
          return <button key={d} className={`cell ${d === cur ? 'on' : ''} ${d === t0 ? 'today' : ''}`} onClick={() => setSel(d)} aria-label={`${fd(d)}, ${c} open tasks`}>{i + 1}<small>{c ? '●'.repeat(Math.min(c, 3)) : '\u00a0'}</small></button>;
        })}
      </div></div>
      {dayCard(cur, fd(cur) + (cur === t0 ? ' · Today' : ''))}
    </>);
  }

  return (<>
    <div className="row between gap-bottom">
      <div className="row">{[['list', 'List'], ['week', 'Week'], ['month', 'Month']].map(([k, l]) => <button key={k} className={`sm ${pv === k ? 'on' : ''}`} onClick={() => switchView(k)}>{l}</button>)}</div>
      <button className="pri" onClick={() => setForm(form ? null : {})}>+ New task</button>
    </div>
    {form && <TaskForm key={form.id || form.pre || 'new'} init={edit} pre={form.pre} subjects={subjects} onSave={save} onCancel={() => setForm(null)} />}
    {body}
  </>);
}
