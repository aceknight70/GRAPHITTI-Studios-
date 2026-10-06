import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

// Priority 1: import.meta.env (Standard Vite client-side bundle)
// Priority 2: window.ENV (Vite define / server injection fallback)
export const SUPABASE_URL = 
  import.meta.env?.VITE_SUPABASE_URL || 
  window.ENV?.VITE_SUPABASE_URL || 
  window.ENV?.SUPABASE_URL || 
  '';

export const SUPABASE_ANON_KEY = 
  import.meta.env?.VITE_SUPABASE_ANON_KEY || 
  window.ENV?.VITE_SUPABASE_ANON_KEY || 
  window.ENV?.SUPABASE_ANON_KEY || 
  '';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    '[Supabase Connection Warning] Missing Supabase environment variables!\n' +
    'Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file or Vercel Environment Variables.\n' +
    `Current SUPABASE_URL: "${SUPABASE_URL ? SUPABASE_URL.substring(0, 15) + '...' : '(empty)'}"\n` +
    `Current SUPABASE_ANON_KEY: "${SUPABASE_ANON_KEY ? '(set)' : '(empty)'}"`
  );
} else {
  console.log(`[Supabase Connected] Initialized client for ${SUPABASE_URL}`);
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/**
 * Diagnostic helper: Verifies connection and logs any table or auth issues
 */
export async function checkSupabaseConnection() {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[Supabase Check Failed] Cannot connect: VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is undefined.');
    return { ok: false, error: 'Missing environment variables' };
  }

  try {
    // Check core table gs_admins
    const { data, error, status } = await supabase.from('gs_admins').select('id, name, role').limit(1);
    if (error) {
      console.error(`[Supabase Check Error] HTTP ${status}:`, error);
      return { ok: false, status, error };
    }
    console.log('[Supabase Check Passed] Successfully queried gs_admins table from Supabase.');

    // Check gs_about_content table (used for persistent logo & about content)
    const aboutCheck = await supabase.from('gs_about_content').select('section_key').limit(1);
    if (aboutCheck.error) {
      console.warn(
        `[Supabase Schema Warning] Table "gs_about_content" returned error (code: ${aboutCheck.error.code}): ${aboutCheck.error.message}.\n` +
        'Please run the SQL migration script from "sql_instructions.txt" in your Supabase SQL Editor to create gs_about_content, gs_team_members, and gs_how_it_works tables.'
      );
    } else {
      console.log('[Supabase Check Passed] Table "gs_about_content" is available for uploads and persistent content.');
    }

    return { ok: true, status, data };
  } catch (err) {
    console.error('[Supabase Check Exception]', err);
    return { ok: false, error: err.message };
  }
}
