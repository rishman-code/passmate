import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const AUTH_CHECK_TIMEOUT_MS = 8000;
const ANTHROPIC_TIMEOUT_MS = 15000;
// Generous ceiling meant to catch runaway/abusive usage, not normal study
// sessions (a full mock test is 50 questions) -- keeps a single account from
// driving unbounded Anthropic spend.
const DAILY_EXPLANATION_LIMIT = 150;
// How long a request will wait for another in-flight request to finish
// fetching the same question's explanation, before giving up and falling
// back to the DVSA explanation, rather than paying for a duplicate Anthropic call.
const CACHE_CLAIM_POLL_MS = 400;
const CACHE_CLAIM_MAX_POLLS = 5;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

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

    // Verify caller is an authenticated user
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

    const { question_id } = await req.json() as { question_id?: string };
    if (!question_id) return json({ error: 'question_id required' }, 400);

    // Service-role client for cache + question reads/writes (bypasses RLS)
    const svc = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    // Return cached explanation if available
    const { data: cached } = await svc
      .from('ai_explanation_cache')
      .select('ai_explanation')
      .eq('question_id', question_id)
      .maybeSingle();

    if (cached?.ai_explanation) {
      return json({ explanation: cached.ai_explanation });
    }

    // Fetch the question
    const { data: question, error: qErr } = await svc
      .from('questions')
      .select('question_text, category, correct_answer, explanation, option_a, option_b, option_c, option_d')
      .eq('id', question_id)
      .single();

    if (qErr || !question) return json({ error: 'Question not found' }, 404);

    // Claim this question so concurrent requests for the same cache miss
    // don't each pay for their own Anthropic call. The empty ai_explanation
    // is a placeholder sentinel -- the cache-hit check above treats it as
    // "not cached yet" (falsy), so a claim that never completes doesn't
    // wedge the question forever.
    const { data: claimed } = await svc
      .from('ai_explanation_cache')
      .upsert(
        { question_id, ai_explanation: '', created_at: new Date().toISOString() },
        { onConflict: 'question_id', ignoreDuplicates: true },
      )
      .select('question_id');

    if (!claimed || claimed.length === 0) {
      // Someone else already claimed it -- wait briefly for their result
      // instead of duplicating the Anthropic call. This costs nothing
      // against the daily cap below, since no Anthropic call is made here.
      for (let attempt = 0; attempt < CACHE_CLAIM_MAX_POLLS; attempt++) {
        await sleep(CACHE_CLAIM_POLL_MS);
        const { data: retry } = await svc
          .from('ai_explanation_cache')
          .select('ai_explanation')
          .eq('question_id', question_id)
          .maybeSingle();
        if (retry?.ai_explanation) return json({ explanation: retry.ai_explanation });
      }
      return json({ explanation: question.explanation });
    }

    // Per-user daily cap -- checked only for the request that won the claim
    // above, i.e. the one actually about to call Anthropic. Cache hits and
    // requests that just poll for another in-flight claim never reach here,
    // so they stay unlimited and free.
    const today = new Date().toISOString().slice(0, 10);
    const { data: usageCount, error: usageErr } = await svc.rpc('increment_ai_explanation_usage', {
      p_user_id: userId,
      p_date: today,
    });
    if (!usageErr && typeof usageCount === 'number' && usageCount > DAILY_EXPLANATION_LIMIT) {
      // Release the claim so a future (under-cap) request can fill it in.
      await svc.from('ai_explanation_cache').delete().eq('question_id', question_id).eq('ai_explanation', '');
      return json({ explanation: question.explanation });
    }

    const correctText = question[`option_${question.correct_answer}` as keyof typeof question] as string;

    try {
      const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
      const message = await anthropic.messages.create(
        {
          model: 'claude-haiku-4-5',
          max_tokens: 200,
          messages: [
            {
              role: 'user',
              content: `You are a UK driving theory test instructor. In 2-3 clear sentences, explain why "${correctText}" is the correct answer to the question below. Build on the official DVSA explanation but make it more memorable for a learner. Write in plain prose — no markdown, no bullet points, no headers, no bold or italic formatting.

Question: ${question.question_text}
Category: ${question.category}
Correct answer: ${correctText}
DVSA explanation: ${question.explanation}`,
            },
          ],
        },
        { timeout: ANTHROPIC_TIMEOUT_MS },
      );

      const block = message.content[0];
      const explanation = block.type === 'text' ? block.text : question.explanation;

      // Fill in the claimed placeholder with the real explanation
      await svc
        .from('ai_explanation_cache')
        .update({ ai_explanation: explanation, created_at: new Date().toISOString() })
        .eq('question_id', question_id);

      return json({ explanation });
    } catch (anthropicErr) {
      // Release the claim so a future request can retry this question,
      // rather than leaving a permanent empty placeholder behind.
      await svc.from('ai_explanation_cache').delete().eq('question_id', question_id).eq('ai_explanation', '');
      throw anthropicErr;
    }
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error' }, 500);
  }
});
