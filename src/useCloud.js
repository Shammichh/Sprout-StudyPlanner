import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase as db } from './lib/supabase';
import { KEY, fresh, streaks, totalMin } from './lib/core';

// Everything that talks to Supabase: login, sync, friends, Plus status.
export function useCloud(S, setS) {
  const [user, setUser] = useState(null), [username, setUsername] = useState('');
  const [plus, setPlus] = useState(false), [friends, setFriends] = useState([]);
  const loaded = useRef(false); // never upload until we have read the cloud copy first

  const loadFriends = useCallback(async (uid) => {
    const r = await db.from('friendships').select('id,requester,addressee,status').or(`requester.eq.${uid},addressee.eq.${uid}`);
    const rows = r.data || [], ids = [...new Set(rows.flatMap((x) => [x.requester, x.addressee]))].filter((i) => i !== uid), pr = {};
    if (ids.length) {
      const p = await db.from('profiles').select('id,username,total_min,streak,best_streak,plants,shelf').in('id', ids);
      (p.data || []).forEach((x) => { pr[x.id] = x; });
    }
    setFriends(rows.map((x) => ({ id: x.id, status: x.status, incoming: x.addressee === uid, p: pr[x.requester === uid ? x.addressee : x.requester] || { username: 'unknown' } })));
  }, []);

  const loadPlus = useCallback(async (uid) => {
    const r = await db.from('subscriptions').select('status').eq('user_id', uid).maybeSingle();
    const on = ['active', 'trialing'].includes(r.data?.status); setPlus(on); return on;
  }, []);

  useEffect(() => {
    if (!db) return;
    db.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = db.auth.onAuthStateChange((_e, s) => {
      setUser(s?.user ?? null);
      if (!s) { loaded.current = false; setPlus(false); setFriends([]); setUsername(''); }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!db || !user) return;
    let off = false;
    (async () => {
      const r = await db.from('user_data').select('data').eq('user_id', user.id).maybeSingle();
      if (off || r.error) return;
      if (r.data?.data?.tasks) setS({ ...fresh(), ...r.data.data });
      loaded.current = true;
      const p = await db.from('profiles').select('username').eq('id', user.id).maybeSingle();
      setUsername(p.data?.username || '');
      await loadPlus(user.id); await loadFriends(user.id);
      // Back from Stripe: the webhook can take a few seconds, so check a few times.
      if (new URLSearchParams(window.location.search).get('plus') === 'success') {
        for (let i = 0; i < 6 && !(await loadPlus(user.id)); i++) await new Promise((ok) => setTimeout(ok, 2000));
        window.history.replaceState({}, '', window.location.pathname);
      }
    })();
    return () => { off = true; };
  }, [user?.id]); // eslint-disable-line

  // Auto-save to the cloud 1.5 s after the last change.
  useEffect(() => {
    if (!db || !user || !loaded.current) return;
    const t = setTimeout(async () => {
      const s = streaks(S);
      await db.from('user_data').upsert({ user_id: user.id, data: S });
      await db.from('profiles').update({ total_min: totalMin(S), streak: s.cur, best_streak: s.best, plants: S.shelf.length + (S.plant ? 1 : 0), shelf: S.shelf }).eq('id', user.id);
    }, 1500);
    return () => clearTimeout(t);
  }, [S, user]);

  const call = async (path) => { // Vercel serverless functions in /api
    const { data } = await db.auth.getSession();
    const r = await fetch(path, { method: 'POST', headers: { Authorization: `Bearer ${data.session.access_token}` } });
    const j = await r.json().catch(() => ({}));
    if (j.url) window.location.href = j.url; else return j.error || 'Something went wrong';
  };

  return {
    enabled: !!db, user, username, plus, friends,
    signIn: async (email, password) => {
      const { error } = await db.auth.signInWithPassword({ email, password });
      return error ? (/invalid/i.test(error.message) ? 'Wrong email or password, or this email has no account.' : error.message) : '';
    },
    signUp: async (name, email, password) => {
      const { data, error } = await db.auth.signUp({ email, password, options: { data: { username: name }, emailRedirectTo: window.location.origin } });
      if (error) return /database|already|taken/i.test(error.message) ? 'That username or email is already taken.' : error.message;
      if (data.user && data.user.identities?.length === 0) return 'That email is already registered.';
      return 'Almost done: click the verification link we emailed you, then log in.';
    },
    signOut: async () => { await db.auth.signOut(); localStorage.removeItem(KEY); setS(fresh()); },
    addFriend: async (name) => {
      const r = await db.from('profiles').select('id').eq('username', name.trim().toLowerCase()).maybeSingle();
      if (!r.data) return 'No user with that username.';
      if (r.data.id === user.id) return 'That is you.';
      const w = await db.from('friendships').insert({ requester: user.id, addressee: r.data.id });
      await loadFriends(user.id);
      return w.error ? 'Request already sent, or you are already friends.' : 'Friend request sent.';
    },
    respond: async (accept, id) => {
      if (accept) await db.from('friendships').update({ status: 'accepted' }).eq('id', id);
      else await db.from('friendships').delete().eq('id', id);
      await loadFriends(user.id);
    },
    upgrade: () => call('/api/checkout'),
    manage: () => call('/api/portal'),
  };
}
