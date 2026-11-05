import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { format, isValid } from "date-fns";
import {
  ArrowUpRight, BookOpen, CalendarDays, Clock3, GraduationCap,
  Layers3, Plus, ReceiptText, Sparkles, Wallet
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

  const { data: latestPaymentsByBatch = {}, isLoading: paymentsLoading } = useQuery<Record<string, ReceiptPayment>>({
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
    const totalPaid = Object.values(latestPaymentsByBatch).reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
    return { total: enrollments.length, expiring, totalPaid };
  }, [enrollments, latestPaymentsByBatch]);

  if (isLoading) {
    return <DashboardLayout><div className="mx-auto max-w-6xl space-y-6">
      <Skeleton className="h-16 w-72 bg-white/[0.05]" />
      <div className="grid gap-3 sm:grid-cols-3">{[1, 2, 3].map((item) => <Skeleton key={item} className="h-24 rounded-2xl bg-white/[0.05]" />)}</div>
      <div className="grid gap-5 md:grid-cols-2">{[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-72 rounded-2xl bg-white/[0.05]" />)}</div>
    </div></DashboardLayout>;
  }

  return <DashboardLayout>
    <div className="mx-auto max-w-6xl space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">Your learning space</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">My Batches</h1>
          <p className="mt-1 text-sm text-slate-500">All your enrolled courses and test series, together.</p>
        </div>
        <Button onClick={() => navigate("/batches")} className="rounded-xl bg-[#167CC0] text-white hover:bg-[#208FD5]">
          <Plus className="mr-2 h-4 w-4" />Explore batches
        </Button>
      </header>

      {isError ? <section className={panel + " p-8 text-center"}>
        <p className="text-sm text-slate-300">Your enrollments could not be loaded.</p>
        <Button onClick={() => void refetch()} variant="outline" className="mt-4 border-white/10 bg-white/[0.03] text-slate-200">Try again</Button>
      </section> : <>
        <section className="grid gap-3 sm:grid-cols-3">
          <div className={panel + " flex items-center gap-3 p-4"}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-sky-400/10 text-sky-300"><GraduationCap size={19} /></div>
            <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Enrolled batches</p><p className="mt-0.5 text-xl font-semibold tabular-nums text-white">{stats.total}</p></div>
          </div>
          <div className={panel + " flex items-center gap-3 p-4"}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-amber-400/10 text-amber-300"><Clock3 size={19} /></div>
            <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Expiring in 7 days</p><p className="mt-0.5 text-xl font-semibold tabular-nums text-white">{stats.expiring}</p></div>
          </div>
          <div className={panel + " flex items-center gap-3 p-4"}>
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/10 text-emerald-300"><Wallet size={19} /></div>
            <div><p className="text-[10px] uppercase tracking-wider text-slate-500">Recorded payments</p><p className="mt-0.5 text-xl font-semibold tabular-nums text-white">₹{stats.totalPaid.toLocaleString("en-IN", { maximumFractionDigits: 0 })}</p></div>
          </div>
        </section>

        {enrollments.length > 0 ? <section className="grid gap-5 md:grid-cols-2">
          {enrollments.map((enrollment: any) => {
            const batch = enrollment.batches || {};
            const payment = latestPaymentsByBatch[enrollment.batch_id];
            const features = Array.isArray(batch.features) ? batch.features.filter((item: unknown): item is string => typeof item === "string").slice(0, 3) : [];
            const enrolledDate = dateLabel(enrollment.enrolled_at);
            const expiryDate = dateLabel(enrollment.expires_at);
            const startDate = dateLabel(batch.start_date);
            const endDate = dateLabel(batch.end_date);
            const expired = enrollment.expires_at ? new Date(enrollment.expires_at).getTime() < Date.now() : false;

            return <article key={enrollment.id} className={panel + " group flex min-w-0 flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-sky-400/25"}>
              <div className="relative h-36 overflow-hidden border-b border-white/[0.07] bg-[radial-gradient(ellipse_at_75%_15%,rgba(42,153,224,0.26),transparent_48%),linear-gradient(120deg,#10243A,#0B1725)]">
                {batch.thumbnail_url ? <img src={batch.thumbnail_url} alt="" className="h-full w-full object-cover opacity-75 transition duration-500 group-hover:scale-[1.03]" /> : <div className="absolute inset-0 flex items-center justify-center"><div className="grid h-16 w-16 place-items-center rounded-2xl border border-sky-300/20 bg-sky-400/10 text-sky-200"><Layers3 size={29} /></div></div>}
                <div className="absolute left-4 top-4 flex flex-wrap gap-2">
                  <span className="rounded-full border border-white/15 bg-[#07111D]/80 px-3 py-1 text-[10px] font-medium text-sky-100 backdrop-blur">{categoryLabels[batch.category] || "Course"}</span>
                </div>
                <div className="absolute right-4 top-4"><EnrollmentBadge isEnrolled expiresAt={enrollment.expires_at} paymentStatus={enrollment.payment_status} size="sm" /></div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#08111D] to-transparent px-5 pb-4 pt-10">
                  <h2 className="truncate text-lg font-semibold text-white">{batch.name || "Enrolled batch"}</h2>
                </div>
              </div>

              <div className="flex flex-1 flex-col p-5">
                <p className="line-clamp-2 min-h-10 text-xs leading-5 text-slate-400">{batch.short_description || batch.description || "Your enrolled learning programme and test series."}</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">Enrolled on</p>
                    <p className="mt-1 text-xs font-medium text-slate-200">{enrolledDate || "—"}</p>
                  </div>
                  <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3">
                    <p className="text-[9px] uppercase tracking-wider text-slate-500">{expiryDate ? "Access until" : "Access"}</p>
                    <p className={`mt-1 text-xs font-medium ${expired ? "text-rose-300" : "text-slate-200"}`}>{expiryDate || "No expiry set"}</p>
                  </div>
                </div>

                {(startDate || endDate) && <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500"><CalendarDays size={13} /><span>{startDate || "Start date not set"}{endDate ? ` – ${endDate}` : ""}</span></div>}

                {features.length > 0 && <div className="mt-4 space-y-2">
                  {features.map((feature, index) => <div key={index} className="flex items-start gap-2 text-[11px] text-slate-400"><Sparkles size={12} className="mt-0.5 shrink-0 text-sky-400" /><span className="line-clamp-1">{feature}</span></div>)}
                </div>}

                <div className="mt-auto pt-5">
                  {payment && <div className="mb-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/10 bg-emerald-400/[0.04] px-3 py-2.5">
                    <div className="min-w-0"><p className="text-[9px] uppercase tracking-wider text-slate-500">Latest payment</p><p className="mt-0.5 truncate text-sm font-semibold text-emerald-200">{payment.currency} {Number(payment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p></div>
                    <span className="shrink-0 text-[10px] text-slate-500">{dateLabel(payment.updated_at || payment.created_at)}</span>
                  </div>}
                  <div className="flex flex-wrap items-center gap-2">
                    <Button onClick={() => navigate(`/batches/${enrollment.batch_id}`)} className="min-w-0 flex-1 rounded-xl bg-[#167CC0] text-white hover:bg-[#208FD5]">
                      <BookOpen size={15} className="mr-2" />Open batch<ArrowUpRight size={14} className="ml-2" />
                    </Button>
                    {payment && user && <PaymentReceiptAction payment={payment} userId={user.id} email={user.email || "Not provided"} buttonLabel="Receipt" />}
                  </div>
                  {paymentsLoading && <p className="mt-2 text-center text-[10px] text-slate-600">Checking payment records…</p>}
                </div>
              </div>
            </article>;
          })}
        </section> : <section className={panel + " px-5 py-14 text-center"}>
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-sky-400/15 bg-sky-400/[0.06] text-sky-300"><BookOpen size={27} /></div>
          <h2 className="mt-5 text-lg font-semibold text-white">Your learning starts here</h2>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">You haven't enrolled in a batch yet. Explore the available programmes and choose the one that matches your preparation.</p>
          <Button onClick={() => navigate("/batches")} className="mt-6 rounded-xl bg-[#167CC0] text-white hover:bg-[#208FD5]"><Plus size={15} className="mr-2" />Explore batches</Button>
        </section>}
      </>}
    </div>
  </DashboardLayout>;
}
