import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTH_CHECK_TIMEOUT_MS = 8000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms),
    ),
  ]);
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Unauthorized' }, 401);

    // Verify caller is an authenticated user, and only ever delete *that*
    // caller's own account -- the user id to delete comes from their JWT,
    // never from the request body, so this can't be used to delete anyone
    // else's account.
    const userClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } },
    );
    let userId: string;
    try {
      const { data, error: authError } = await withTimeout(
        userClient.auth.getUser(),
        AUTH_CHECK_TIMEOUT_MS,
        'Auth check',
      );
      if (authError || !data.user) return json({ error: 'Unauthorized' }, 401);
      userId = data.user.id;
    } catch {
      return json({ error: 'Unauthorized' }, 401);
    }

    // Service-role client: deleting an auth user requires elevated
    // privileges the anon/user client doesn't have. user_progress,
    // mock_test_results, and user_journey all reference auth.users(id)
    // ON DELETE CASCADE, so this alone also removes the user's app data.
    const svc = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { error: deleteError } = await svc.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error(deleteError);
      return json({ error: 'Failed to delete account' }, 500);
    }

    return json({ success: true });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error' }, 500);
  }
});
