import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  try {
    const apiKey = Deno.env.get('LOVABLE_API_KEY')
    if (!apiKey) return json({ error: 'AI assistant is not configured' }, 500)
    const auth = req.headers.get('Authorization')
    const token = auth?.match(/^Bearer\s+(.+)$/i)?.[1]
    if (!token) return json({ error: 'Not authenticated' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!supabaseUrl || !supabaseAnonKey) return json({ error: 'Payment assistant is not configured' }, 500)

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: auth } },
    })
    const { data: { user } } = await supabase.auth.getUser(token)
    if (!user) return json({ error: 'Not authenticated' }, 401)

    const body = await req.json().catch(() => null)
    const messages = body && typeof body === 'object' ? body.messages : null
    if (!Array.isArray(messages) || !messages.length || messages.length > 40) return json({ error: 'Ask a question first' }, 400)
    const history = messages.slice(-12).flatMap((message: unknown) => {
      if (!message || typeof message !== 'object') return []
      const entry = message as { role?: unknown; content?: unknown }
      if ((entry.role !== 'user' && entry.role !== 'assistant') || typeof entry.content !== 'string') return []
      const content = entry.content.trim().slice(0, 2000)
      return content ? [{ role: entry.role, content }] : []
    })
    if (!history.length || history[history.length - 1]?.role !== 'user') return json({ error: 'Ask a question first' }, 400)

    const { data: payments, error } = await supabase
      .from('payments')
      .select('id, amount, currency, status, provider, transaction_id, created_at, updated_at, batches(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30)
    if (error) return json({ error: 'Could not load your payments' }, 500)

    const records = (payments ?? []).map((p: any) => ({
      reference: p.id.slice(0, 8), course: p.batches?.name ?? 'Unknown course', amount: `${p.currency} ${p.amount}`,
      status: p.status, method: p.provider ?? 'none', transaction_id: p.transaction_id, created: p.created_at, last_updated: p.updated_at,
    }))

    const instructions = `You are the PhyNetix payment help assistant for one student. Answer only about this student's course payments listed below.
Status meanings: "completed" = paid and the student is enrolled (receipt downloadable on the Payment History page); "pending" = payment window was opened but not confirmed (often cancelled or still processing; if money was debited it is usually auto-refunded by the bank/Razorpay, otherwise the student can retry from the course page); "failed" = payment did not go through, no enrollment; retry from the course page.
Never invent payments, amounts, refunds or policies not shown. If something needs a human (debited but not enrolled after 24 hours, refund requests), tell them to use the Contact page and share the payment reference.
Keep answers under 120 words, use short markdown bullet points when helpful. Today's date: ${new Date().toISOString().slice(0, 10)}.
Payment records (JSON): ${JSON.stringify(records)}`

    const runId = req.headers.get('X-Lovable-AIG-Run-ID') ?? undefined
    const upstream = await fetch('https://ai.gateway.lovable.dev/v1/responses', {
      method: 'POST',
      signal: req.signal,
      headers: {
        'Content-Type': 'application/json', 'Lovable-API-Key': apiKey, 'X-Lovable-AIG-SDK': 'fetch',
        ...(runId ? { 'X-Lovable-AIG-Run-ID': runId } : {}),
      },
      body: JSON.stringify({
        model: 'openai/gpt-6-astra', instructions, input: history, stream: true, store: false,
        reasoning: { effort: 'low', summary: 'auto' }, include: ['reasoning.encrypted_content'],
      }),
    })
    const headers = new Headers(corsHeaders)
    upstream.headers.forEach((v, k) => { if (k.toLowerCase().startsWith('x-lovable-aig-')) headers.set(k, v) })
    if (!upstream.ok) {
      let message = 'The assistant is unavailable right now.'
      try { const b = await upstream.json(); message = b?.message || b?.error?.message || message } catch { /* noop */ }
      headers.set('Content-Type', 'application/json')
      return new Response(JSON.stringify({ error: message }), { status: upstream.status, headers })
    }
    headers.set('Content-Type', 'text/event-stream')
    return new Response(upstream.body, { status: 200, headers })
  } catch (e) {
    if (req.signal.aborted) return new Response(null, { status: 499, headers: corsHeaders })
    return json({ error: e instanceof Error ? e.message : 'Unexpected error' }, 500)
  }
})
