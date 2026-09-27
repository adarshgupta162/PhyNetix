import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keySecret) {
      return new Response(JSON.stringify({ error: 'Payment gateway is not configured yet' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceKey)

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authErr } = await admin.auth.getUser(token)
    if (authErr || !user) {
      return new Response(JSON.stringify({ error: 'Not authenticated' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const body = await req.json().catch(() => null)
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, payment_id } = body || {}
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !payment_id) {
      return new Response(JSON.stringify({ error: 'Missing payment details' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Verify signature: HMAC_SHA256(order_id + "|" + payment_id, key_secret)
    const expected = await hmacSha256Hex(keySecret, `${razorpay_order_id}|${razorpay_payment_id}`)
    if (expected !== razorpay_signature) {
      await admin.from('payments').update({ status: 'failed' }).eq('id', payment_id).eq('user_id', user.id)
      return new Response(JSON.stringify({ error: 'Payment verification failed' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Mark payment completed — auto_enroll_on_payment trigger creates the enrollment
    const { data: payment, error: updErr } = await admin
      .from('payments')
      .update({
        status: 'completed',
        transaction_id: razorpay_payment_id,
        metadata: undefined as any,
      })
      .eq('id', payment_id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select('id, coupon_id, metadata')
      .maybeSingle()

    if (updErr) throw updErr
    if (!payment) {
      // Already processed or not found — treat as success if completed
      const { data: existing } = await admin.from('payments').select('status').eq('id', payment_id).maybeSingle()
      if (existing?.status === 'completed') {
        return new Response(JSON.stringify({ success: true, already: true }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify({ error: 'Payment record not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Merge razorpay payment id into metadata (keep original metadata)
    const meta = (payment.metadata as any) || {}
    await admin.from('payments').update({
      metadata: { ...meta, razorpay_payment_id },
    }).eq('id', payment_id)

    // Bump coupon usage
    if (payment.coupon_id) {
      const { data: c } = await admin.from('coupons').select('current_uses').eq('id', payment.coupon_id).maybeSingle()
      if (c) {
        await admin.from('coupons').update({ current_uses: (c.current_uses || 0) + 1 }).eq('id', payment.coupon_id)
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error(e)
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
