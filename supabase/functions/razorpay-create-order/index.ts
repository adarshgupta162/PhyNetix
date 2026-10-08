import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors'
import { createClient } from 'npm:@supabase/supabase-js@2'

const BodySchema = {
  parse(body: any) {
    if (!body || typeof body.batch_id !== 'string' || body.batch_id.length < 10) {
      throw new Error('batch_id is required')
    }
    return {
      batch_id: body.batch_id,
      coupon_code: typeof body.coupon_code === 'string' ? body.coupon_code.trim().toUpperCase() : null,
    }
  },
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  try {
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')
    if (!keyId || !keySecret) {
      return new Response(JSON.stringify({ error: 'Payment gateway is not configured yet' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Authenticate the caller
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

    const { data: studentProfile } = await admin
      .from('profiles')
      .select('full_name, phone')
      .eq('id', user.id)
      .maybeSingle()

    let input
    try {
      input = BodySchema.parse(await req.json())
    } catch (e: any) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Load batch
    const { data: batch, error: batchErr } = await admin
      .from('batches')
      .select('id, name, price, is_active')
      .eq('id', input.batch_id)
      .single()
    if (batchErr || !batch) {
      return new Response(JSON.stringify({ error: 'Batch not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Already enrolled?
    const { data: existing } = await admin
      .from('batch_enrollments')
      .select('id')
      .eq('user_id', user.id)
      .eq('batch_id', batch.id)
      .eq('status', 'active')
      .maybeSingle()
    if (existing) {
      return new Response(JSON.stringify({ error: 'Already enrolled in this batch' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const basePrice = Number(batch.price || 0)
    let discount = 0
    let coupon: any = null

    if (input.coupon_code) {
      const { data: c } = await admin
        .from('coupons')
        .select('id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, is_active, applies_to, batch_id, applicable_batches, min_purchase_amount')
        .eq('code', input.coupon_code)
        .eq('is_active', true)
        .maybeSingle()

      if (!c) {
        return new Response(JSON.stringify({ error: 'Invalid coupon code' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }
      const now = new Date()
      if (c.valid_from && new Date(c.valid_from) > now) {
        return new Response(JSON.stringify({ error: 'Coupon not yet valid' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (c.valid_until && new Date(c.valid_until) < now) {
        return new Response(JSON.stringify({ error: 'Coupon has expired' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (c.max_uses != null && c.current_uses >= c.max_uses) {
        return new Response(JSON.stringify({ error: 'Coupon usage limit reached' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      if (c.min_purchase_amount && basePrice < Number(c.min_purchase_amount)) {
        return new Response(JSON.stringify({ error: `Minimum purchase ₹${c.min_purchase_amount} required` }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }
      const applies = c.applies_to
      const okBatch =
        applies === 'all' ||
        (applies === 'batch' && (c.batch_id === batch.id || (c.applicable_batches || []).includes(batch.id))) ||
        (Array.isArray(c.applicable_batches) && c.applicable_batches.includes(batch.id))
      if (!okBatch) {
        return new Response(JSON.stringify({ error: 'Coupon not valid for this course' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      discount = c.discount_type === 'percentage'
        ? Math.round((basePrice * Number(c.discount_value)) / 100)
        : Number(c.discount_value)
      discount = Math.min(discount, basePrice)
      coupon = c
    }

    const finalPrice = Math.max(0, basePrice - discount)

    // Free enrollment path (100% coupon or free batch)
    if (finalPrice <= 0) {
      const { error: payErr } = await admin.from('payments').insert({
        user_id: user.id,
        batch_id: batch.id,
        coupon_id: coupon?.id ?? null,
        amount: 0,
        currency: 'INR',
        status: 'completed',
        provider: coupon ? 'coupon' : 'free',
        metadata: { coupon_code: coupon?.code ?? null, original_price: basePrice },
      })
      if (payErr) throw payErr
      if (coupon) {
        await admin.from('coupons').update({ current_uses: (coupon.current_uses || 0) + 1 }).eq('id', coupon.id)
      }
      return new Response(JSON.stringify({ free: true, enrolled: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Create Razorpay order (amount in paise)
    const amountPaise = Math.round(finalPrice * 100)
    const receipt = `b${batch.id.slice(0, 8)}u${user.id.slice(0, 8)}${Date.now().toString(36)}`.slice(0, 40)
    const rzRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + btoa(`${keyId}:${keySecret}`),
      },
      body: JSON.stringify({
        amount: amountPaise,
        currency: 'INR',
        receipt,
        notes: { batch_id: batch.id, user_id: user.id },
      }),
    })
    const order = await rzRes.json()
    if (!rzRes.ok) {
      console.error('Razorpay order error', order)
      return new Response(JSON.stringify({ error: order?.error?.description || 'Could not create payment order' }), {
        status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Record pending payment
    const { data: payment, error: payErr } = await admin.from('payments').insert({
      user_id: user.id,
      batch_id: batch.id,
      coupon_id: coupon?.id ?? null,
      amount: finalPrice,
      currency: 'INR',
      status: 'pending',
      provider: 'razorpay',
      transaction_id: order.id,
      metadata: { coupon_code: coupon?.code ?? null, original_price: basePrice, discount, razorpay_order_id: order.id },
    }).select('id').single()
    if (payErr) throw payErr

    return new Response(JSON.stringify({
      free: false,
      order_id: order.id,
      amount: amountPaise,
      currency: 'INR',
      key_id: keyId,
      payment_id: payment.id,
      batch_name: batch.name,
      prefill: {
        name: studentProfile?.full_name ?? undefined,
        email: user.email ?? undefined,
        contact: studentProfile?.phone ?? undefined,
      },
    }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e: any) {
    console.error(e)
    return new Response(JSON.stringify({ error: e?.message || 'Unexpected error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
