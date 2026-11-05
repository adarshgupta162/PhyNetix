import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import {
  ArrowUpRight, BookOpen, Plus, Sparkles
} from "lucide-react";
import { useUserEnrollments } from "@/hooks/useEnrollment";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrollmentBadge } from "@/components/batch/EnrollmentBadge";
import { PaymentReceiptAction } from "@/components/payments/PaymentReceiptAction";
import type { ReceiptPayment } from "@/lib/paymentReceipt";

const categoryLabels: Record<string, string> = {
  jee_main: "JEE Main",
  jee_advanced: "JEE Advanced",
  neet: "NEET",
  bitsat: "BITSAT",
  mht_cet: "MHT-CET",
  foundation: "Foundation",
};

const panel = "rounded-2xl border border-white/[0.08] bg-[#0B1725]/90 shadow-[0_16px_48px_rgba(0,0,0,0.16)]";
const dateLabel = (value?: string | null) => {
  if (!value) return null;
  const date = new Date(value);
  return isValid(date) ? format(date, "dd MMM yyyy") : null;
};

export default function MyBatchesPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: enrollments = [], isLoading, isError, refetch } = useUserEnrollments();
  const batchIds = useMemo(
    () => enrollments.map((enrollment: any) => enrollment.batch_id).filter(Boolean),
    [enrollments],
  );

  const { data: latestPaymentsByBatch = {} } = useQuery<Record<string, ReceiptPayment>>({
    queryKey: ["my-batches-payments", user?.id, batchIds],
    enabled: !!user && batchIds.length > 0,
    queryFn: async () => {
      if (!user || batchIds.length === 0) return {};
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, currency, status, provider, transaction_id, provider_order_id, created_at, updated_at, metadata, batch_id, batches(name)")
        .eq("user_id", user.id)
        .eq("status", "completed")
        .in("batch_id", batchIds)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data as (ReceiptPayment & { batch_id: string | null })[]).reduce<Record<string, ReceiptPayment>>((acc, payment) => {
        if (payment.batch_id && !acc[payment.batch_id]) acc[payment.batch_id] = payment;
        return acc;
      }, {});
    },
  });

  const stats = useMemo(() => {
    const now = Date.now();
    const expiring = enrollments.filter((item: any) => {
      if (!item.expires_at) return false;
      const expiry = new Date(item.expires_at).getTime();
      return expiry > now && expiry <= now + 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total: enrollments.length, expiring };
  }, [enrollments, latestPaymentsByBatch]);

  if (isLoading) {
    return <DashboardLayout>
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">Your courses</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">My Batches</h1>
          <p className="mt-1 text-sm text-slate-500">Everything you’re enrolled in, in one place.</p>
        </div>
        <Button onClick={() => navigate("/batches")} className="rounded-xl bg-[#1687C9] text-white hover:bg-[#2099DB]"><Plus className="mr-2 h-4 w-4" />Explore batches</Button>
      </header>

      {isError ? <section className={panel + " p-8 text-center"}>
        <p className="text-sm text-slate-300">Your batches couldn’t be loaded.</p>
        <Button onClick={() => void refetch()} variant="outline" className="mt-4 border-white/10 bg-white/[0.03] text-slate-200">Try again</Button>
      </section> : <>
        <div className="flex flex-wrap gap-3">
          <div className={panel + " min-w-[150px] px-4 py-3"}><p className="text-[9px] uppercase tracking-wider text-slate-500">Active enrollments</p><p className="mt-1 text-xl font-semibold tabular-nums text-white">{stats.total}</p></div>
          <div className={panel + " min-w-[150px] px-4 py-3"}><p className="text-[9px] uppercase tracking-wider text-slate-500">Expiring this week</p><p className={ "mt-1 text-xl font-semibold tabular-nums " + (stats.expiring ? "text-amber-300" : "text-white")}>{stats.expiring}</p></div>
        </div>

        {enrollments.length > 0 ? <section className="grid gap-4 md:grid-cols-2">
          {enrollments.map((enrollment: any) => {
            const batch = enrollment.batches || {};
            const payment = latestPaymentsByBatch[enrollment.batch_id];
            const enrolledDate = dateLabel(enrollment.enrolled_at);
            const expiryDate = dateLabel(enrollment.expires_at);
            const expired = enrollment.expires_at ? new Date(enrollment.expires_at).getTime() < Date.now() : false;
            const features = Array.isArray(batch.features) ? batch.features.filter((item: unknown): item is string => typeof item === "string").slice(0, 2) : [];
            return <article key={enrollment.id} className={panel + " group flex min-w-0 flex-col overflow-hidden transition-colors hover:border-sky-400/20"}>
              <div className="relative h-28 overflow-hidden bg-[radial-gradient(ellipse_at_80%_10%,rgba(42,153,224,0.2),transparent_45%),linear-gradient(120deg,#10243A,#0B1725)]">
                {batch.thumbnail_url && <img src={batch.thumbnail_url} alt="" className="h-full w-full object-cover opacity-60 transition duration-500 group-hover:scale-[1.02]" />}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B1725]/90 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 px-5 pb-4">
                  <div className="min-w-0"><p className="mb-1 text-[9px] font-medium uppercase tracking-[0.15em] text-sky-200/80">{categoryLabels[batch.category] || "Course"}</p><h2 className="truncate text-lg font-semibold text-white">{batch.name || "Enrolled batch"}</h2></div>
                  <EnrollmentBadge isEnrolled expiresAt={enrollment.expires_at} paymentStatus={enrollment.payment_status} size="sm" />
                </div>
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="line-clamp-2 text-xs leading-5 text-slate-400">{batch.short_description || batch.description || "Your enrolled course and test series."}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5"><p className="text-[9px] uppercase tracking-wider text-slate-600">Enrolled</p><p className="mt-1 text-xs font-medium text-slate-300">{enrolledDate || "—"}</p></div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] px-3 py-2.5"><p className="text-[9px] uppercase tracking-wider text-slate-600">Access until</p><p className={ "mt-1 text-xs font-medium " + (expired ? "text-rose-300" : "text-slate-300")}>{expiryDate || "No expiry"}</p></div>
                </div>
                {features.length > 0 && <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">{features.map((feature, index) => <span key={index} className="flex items-center gap-1.5 text-[10px] text-slate-500"><Sparkles size={11} className="text-sky-500" />{feature}</span>)}</div>}
                {payment && <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/[0.07] pt-3"><div><p className="text-[9px] uppercase tracking-wider text-slate-600">Last payment</p><p className="mt-0.5 text-xs font-medium text-slate-300">{payment.currency} {Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div><span className="text-[10px] text-slate-600">{dateLabel(payment.updated_at || payment.created_at)}</span></div>}
                <div className="mt-auto flex items-center gap-2 pt-5">
                  <Button onClick={() => navigate(`/batches/${enrollment.batch_id}`)} className="min-w-0 flex-1 rounded-xl bg-[#1687C9] text-white hover:bg-[#2099DB]"><BookOpen size={14} className="mr-2" />Open batch<ArrowUpRight size={13} className="ml-2" /></Button>
                  {payment && user && <PaymentReceiptAction payment={payment} userId={user.id} email={user.email || "Not provided"} buttonLabel="Receipt" />}
                </div>
              </div>
            </article>;
          })}
        </section> : <section className={panel + " px-5 py-16 text-center"}>
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-sky-400/15 bg-sky-400/[0.06] text-sky-300"><BookOpen size={24} /></div>
          <h2 className="mt-5 text-lg font-semibold text-white">No batches yet</h2>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">Your enrolled courses will appear here. Explore the available batches to get started.</p>
          <Button onClick={() => navigate("/batches")} className="mt-6 rounded-xl bg-[#1687C9] text-white hover:bg-[#2099DB]"><Plus size={15} className="mr-2" />Explore batches</Button>
        </section>}
      </>}
    </div>
  </DashboardLayout>;
}
