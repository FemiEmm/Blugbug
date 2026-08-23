import { createClient } from '@supabase/supabase-js';

const json = (statusCode, body) => ({ statusCode, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' }, body: JSON.stringify(body) });
const adminClient = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Recovery service is not configured.');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
};
const findAuthUser = async (db, email) => {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const found = data.users.find((user) => user.email?.toLowerCase() === email);
    if (found || data.users.length < 1000) return found || null;
  }
  return null;
};
const createOrFindAuthUser = async (db, email, password) => {
  const existing = await findAuthUser(db, email);
  if (existing) {
    const { error } = await db.auth.admin.updateUserById(existing.id, { password, email_confirm: true });
    if (error) throw error;
    return existing;
  }
  const { data, error } = await db.auth.admin.createUser({ email, password, email_confirm: true });
  if (error) throw error;
  return data.user;
};

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method not allowed.' });
  try {
    const { email: rawEmail, password, method, secretAnswer = '', action = 'recover' } = JSON.parse(event.body || '{}');
    const email = String(rawEmail || '').trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) return json(400, { error: 'Enter a valid email address.' });

    const db = adminClient();
    const { data: legacy, error: legacyError } = await db.from('blugbug_legacy_accounts')
      .select('user_id,secret_question,secret_answer_hash,claimed_auth_user_id').ilike('legacy_email', email).maybeSingle();
    if (legacyError) throw legacyError;
    if (!legacy) return json(404, { error: 'No recoverable Blugbug account matches this email.' });
    if (legacy.claimed_auth_user_id) return json(409, { error: 'This account has already been recovered. Sign in or contact customer care.' });
    if (action === 'lookup') return json(200, { secretQuestion: legacy.secret_answer_hash ? legacy.secret_question : null });
    if (typeof password !== 'string' || password.length < 10) return json(400, { error: 'Use a password with at least 10 characters.' });
    if (!['email', 'secret'].includes(method)) return json(400, { error: 'Choose a recovery method.' });
    if (method === 'secret') {
      if (!legacy.secret_question || !legacy.secret_answer_hash) return json(400, { error: 'This account does not have a secret question. Use email-only recovery.' });
      const { data: verified, error: verifyError } = await db.rpc('blugbug_verify_legacy_answer', { recovery_email: email, supplied_answer: String(secretAnswer) });
      if (verifyError) throw verifyError;
      if (!verified) return json(401, { error: 'That secret answer is not correct.' });
    }

    const authUser = await createOrFindAuthUser(db, email, password);
    const status = method === 'email' ? 'pending' : 'approved';
    const now = new Date().toISOString();
    const { data: profile, error: profileError } = await db.from('blugbug_users').update({ auth_user_id: authUser.id, recovery_status: status, recovery_requested_at: now, recovery_approved_at: status === 'approved' ? now : null })
      .eq('id', legacy.user_id).is('auth_user_id', null).select('id').maybeSingle();
    if (profileError) throw profileError;
    if (!profile) return json(409, { error: 'This profile has already been linked. Sign in or contact customer care.' });
    const { error: claimError } = await db.from('blugbug_legacy_accounts').update({ claimed_auth_user_id: authUser.id, claimed_at: now }).eq('user_id', legacy.user_id).is('claimed_auth_user_id', null);
    if (claimError) throw claimError;
    return json(200, { recovered: true, status });
  } catch (error) {
    return json(500, { error: error instanceof Error ? error.message : 'Account recovery failed.' });
  }
};
