import { useState } from 'react';
import Plant from './Plant';

function AuthForm({ cloud }) {
  const [mode, setMode] = useState('login'), [f, setF] = useState({ u: '', e: '', e2: '', p: '', p2: '' }), [msg, setMsg] = useState(''), [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const login = mode === 'login';
  const submit = async (ev) => {
    ev.preventDefault();
    if (!login) {
      if (!/^[a-z0-9_]{3,20}$/i.test(f.u.trim())) return setMsg('Username: 3 to 20 letters, numbers or underscores.');
      if (f.e.trim() !== f.e2.trim()) return setMsg('The email addresses do not match.');
      if (f.p.length < 8) return setMsg('Password needs at least 8 characters.');
      if (f.p !== f.p2) return setMsg('The passwords do not match.');
    }
    setBusy(true); setMsg('');
    setMsg(login ? await cloud.signIn(f.e.trim(), f.p) : await cloud.signUp(f.u.trim().toLowerCase(), f.e.trim(), f.p));
    setBusy(false);
  };
  const field = (k, ph, type = 'text', ac = 'off') => <input key={k} type={type} placeholder={ph} aria-label={ph} autoComplete={ac} value={f[k]} onChange={set(k)} required />;
  return (
    <form className="card" onSubmit={submit}>
      <h2>{login ? 'Log in' : 'Create account'}</h2>
      <div className="stack">
        {!login && field('u', 'Username', 'text', 'username')}
        {field('e', 'Email', 'email', 'email')}
        {!login && field('e2', 'Repeat email', 'email')}
        {field('p', login ? 'Password' : 'Password (8+ characters)', 'password', login ? 'current-password' : 'new-password')}
        {!login && field('p2', 'Repeat password', 'password', 'new-password')}
        <div className="row">
          <button className="pri" type="submit" disabled={busy}>{login ? 'Log in' : 'Create account'}</button>
          <button type="button" className="sm" onClick={() => { setMode(login ? 'reg' : 'login'); setMsg(''); }}>{login ? 'New here? Create an account' : 'Have an account? Log in'}</button>
        </div>
        <p className="err">{msg}</p>
      </div>
    </form>
  );
}

export default function Friends({ cloud }) {
  const [name, setName] = useState(''), [msg, setMsg] = useState('');
  if (!cloud.enabled) return <section className="card"><h2>Accounts and friends</h2><p>This copy runs in local mode, so your data stays on this device. Add your Supabase keys to switch on accounts, syncing and friends (see README).</p></section>;
  if (!cloud.user) return <AuthForm cloud={cloud} />;
  const acc = cloud.friends.filter((f) => f.status === 'accepted'), inc = cloud.friends.filter((f) => f.status === 'pending' && f.incoming), out = cloud.friends.filter((f) => f.status === 'pending' && !f.incoming);
  const add = async (e) => { e.preventDefault(); if (!name.trim()) return; setMsg(await cloud.addFriend(name)); setName(''); };
  return (<>
    <section className="card"><div className="row">
      <div className="grow"><h2 className="nomargin">{cloud.username || 'You'}</h2><span className="mute">{cloud.user.email}</span></div>
      <button onClick={cloud.signOut}>Log out</button>
    </div></section>
    <form className="card" onSubmit={add}>
      <h2>Add a friend</h2>
      <div className="row"><input className="grow" placeholder="Their username" aria-label="Friend username" value={name} onChange={(e) => setName(e.target.value)} /><button className="pri" type="submit">Send request</button></div>
      <p className="err">{msg}</p>
    </form>
    {inc.length > 0 && <section className="card"><h2>Friend requests</h2>{inc.map((f) => (
      <div className="row sub-row" key={f.id}><b className="grow">{f.p.username}</b><button className="sm pri" onClick={() => cloud.respond(true, f.id)}>Accept</button><button className="sm" onClick={() => cloud.respond(false, f.id)}>Decline</button></div>
    ))}</section>}
    <section className="card">
      <h2>Friends</h2>
      {acc.length ? acc.map((f) => (
        <div className="friend" key={f.id}>
          <div className="row"><b className="grow">{f.p.username}</b><button className="sm" onClick={() => cloud.respond(false, f.id)}>Remove</button></div>
          <div className="mute">{Math.floor((f.p.total_min || 0) / 60)}h {(f.p.total_min || 0) % 60}m studied · {f.p.streak || 0}-day streak · {f.p.plants || 0} plants</div>
          <div className="row">{(f.p.shelf || []).map((x, i) => <Plant key={i} type={x.type} stage={4} size={56} />)}</div>
        </div>
      )) : <p className="mute">No friends yet. Send a request using their username.</p>}
      {out.length > 0 && <p className="mute">Waiting for: {out.map((f) => f.p.username).join(', ')}</p>}
    </section>
  </>);
}
