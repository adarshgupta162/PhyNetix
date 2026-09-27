import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBatch } from "@/hooks/useBatches";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, ArrowLeft, Shield, Tag, CheckCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";

interface AppliedCoupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  computed_discount: number;
}

export default function CheckoutPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { data: batch, isLoading } = useBatch(batchId);

  const [couponCode, setCouponCode] = useState("");
  const [applying, setApplying] = useState(false);
  const [coupon, setCoupon] = useState<AppliedCoupon | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const basePrice = batch?.price ?? 0;
  const discount = coupon?.computed_discount ?? 0;
  const finalPrice = Math.max(0, basePrice - discount);
  const canEnroll = true;

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !batchId) return;
    setApplying(true);
    setCoupon(null);
    try {
      const code = couponCode.trim().toUpperCase();
      const { data: c, error } = await supabase
        .from("coupons")
        .select("id, code, discount_type, discount_value, max_uses, current_uses, valid_from, valid_until, is_active, applies_to, batch_id, applicable_batches, min_purchase_amount")
        .eq("code", code)
        .eq("is_active", true)
        .maybeSingle();
      if (error) throw error;
      if (!c) { toast.error("Invalid coupon code"); return; }
      const now = new Date();
      if (c.valid_from && new Date(c.valid_from) > now) { toast.error("Coupon not yet valid"); return; }
      if (c.valid_until && new Date(c.valid_until) < now) { toast.error("Coupon has expired"); return; }
      if (c.max_uses != null && c.current_uses >= c.max_uses) { toast.error("Coupon usage limit reached"); return; }
      if (c.min_purchase_amount && basePrice < Number(c.min_purchase_amount)) { toast.error(`Minimum purchase ₹${c.min_purchase_amount} required`); return; }
      const applies = c.applies_to;
      const okBatch =
        applies === "all" ||
        (applies === "batch" && (c.batch_id === batchId || (c.applicable_batches || []).includes(batchId))) ||
        (Array.isArray(c.applicable_batches) && c.applicable_batches.includes(batchId));
      if (!okBatch) { toast.error("Coupon not valid for this course"); return; }
      let computed = c.discount_type === "percentage"
        ? Math.round((basePrice * Number(c.discount_value)) / 100)
        : Number(c.discount_value);
      computed = Math.min(computed, basePrice);
      setCoupon({ id: c.id, code: c.code, discount_type: c.discount_type, discount_value: Number(c.discount_value), computed_discount: computed });
      toast.success("Coupon applied");
    } catch (e: any) {
      toast.error(e?.message || "Could not apply coupon");
    } finally {
      setApplying(false);
    }
  };

  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if ((window as any).Razorpay) return resolve(true);
      const s = document.createElement("script");
      s.src = "https://checkout.razorpay.com/v1/checkout.js";
      s.onload = () => resolve(true);
      s.onerror = () => resolve(false);
      document.body.appendChild(s);
    });

  const done = () => {
    queryClient.invalidateQueries({ queryKey: ["enrollments"] });
    queryClient.invalidateQueries({ queryKey: ["payment-history"] });
    toast.success("Enrolled successfully!");
    navigate("/my-batches");
  };

  const handleEnroll = async () => {
    if (!user || !batchId || !batch) { toast.error("Please log in"); return; }
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("razorpay-create-order", {
        body: { batch_id: batchId, coupon_code: coupon?.code ?? null },
      });
      if (error) {
        let msg = error.message;
        try { msg = (await (error as any).context.json()).error || msg; } catch { /* noop */ }
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);
      if (data.free) { done(); setSubmitting(false); return; }

      if (!(await loadRazorpay())) throw new Error("Could not load payment window");
      const rzp = new (window as any).Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        order_id: data.order_id,
        name: "PhyNetix",
        description: data.batch_name,
        prefill: data.prefill,
        handler: async (resp: any) => {
          const { data: v, error: vErr } = await supabase.functions.invoke("razorpay-verify-payment", {
            body: { ...resp, payment_id: data.payment_id },
          });
          setSubmitting(false);
          if (vErr || !v?.success) { toast.error("Payment verification failed"); return; }
          done();
        },
        modal: { ondismiss: () => { setSubmitting(false); toast.info("Payment cancelled"); } },
      });
      rzp.on("payment.failed", (r: any) => toast.error(r?.error?.description || "Payment failed"));
      rzp.open();
    } catch (e: any) {
      toast.error(e?.message || "Enrollment failed");
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 max-w-4xl mx-auto">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-2 gap-6">
            <Skeleton className="h-96 rounded-lg" />
            <Skeleton className="h-64 rounded-lg" />
          </div>
        </div>
      </DashboardLayout>
    );
  }
  if (!batch) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8 text-center">
          <h1 className="text-2xl font-bold mb-4">Batch Not Found</h1>
          <Button onClick={() => navigate('/batches')}><ArrowLeft className="w-4 h-4 mr-2" />Back to Batches</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          <Button variant="ghost" onClick={() => navigate(`/batches/${batchId}`)} className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />Back to Batch Details
          </Button>

          <h1 className="text-3xl font-bold mb-8">Complete Your Enrollment</h1>

          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your enrollment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{batch.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{batch.short_description}</p>
                  </div>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Batch Price</span>
                    <span className="flex items-center"><IndianRupee className="w-4 h-4" />{basePrice.toLocaleString('en-IN')}</span>
                  </div>
                  {coupon && discount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Coupon ({coupon.code})</span>
                      <span className="flex items-center">- <IndianRupee className="w-4 h-4" />{discount.toLocaleString('en-IN')}</span>
                    </div>
                  )}
                </div>
                <Separator />
                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="flex items-center"><IndianRupee className="w-5 h-5" />{finalPrice.toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>Pay securely with Razorpay (UPI, cards, netbanking)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coupon">Coupon code (optional)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="coupon" placeholder="Enter coupon code" value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())} className="pl-9" />
                    </div>
                    <Button variant="secondary" onClick={handleApplyCoupon} disabled={applying || !couponCode.trim()}>
                      {applying ? "Applying..." : "Apply"}
                    </Button>
                  </div>
                </div>

                <Separator />
                <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm"><Shield className="w-4 h-4 text-primary" />Secure payment via Razorpay</div>
                  <div className="flex items-center gap-2 text-sm"><CheckCircle className="w-4 h-4 text-primary" />Instant access after payment</div>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={handleEnroll} disabled={!canEnroll || submitting}>
                  {submitting ? "Processing..." : finalPrice === 0 ? "Enroll Now (Free)" : `Pay ₹${finalPrice.toLocaleString('en-IN')}`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
