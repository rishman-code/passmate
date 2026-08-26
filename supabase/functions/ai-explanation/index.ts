import Anthropic from 'npm:@anthropic-ai/sdk';
import { createClient } from 'npm:@supabase/supabase-js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return json({ error: 'Unauthorized' }, 401);

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

    const correctText = question[`option_${question.correct_answer}` as keyof typeof question] as string;

    const anthropic = new Anthropic({ apiKey: Deno.env.get('ANTHROPIC_API_KEY') });
    const message = await anthropic.messages.create({
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
    });

    const block = message.content[0];
    const explanation = block.type === 'text' ? block.text : question.explanation;

    // Cache for future requests
    await svc.from('ai_explanation_cache').upsert({
      question_id,
      ai_explanation: explanation,
      created_at: new Date().toISOString(),
    });

    return json({ explanation });
  } catch (err) {
    console.error(err);
    return json({ error: 'Internal server error' }, 500);
  }
});
