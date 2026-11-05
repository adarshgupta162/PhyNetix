import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useBatch, useBatchTests, useCourseSections } from "@/hooks/useBatches";
import { useIsEnrolled } from "@/hooks/useEnrollment";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EnrollmentBadge } from "@/components/batch/EnrollmentBadge";
import { IndianRupee, CalendarDays, Users, Clock3, BookOpen, CheckCircle2, ArrowLeft, FileText, ArrowUpRight, Layers3 } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";
import TestListCard from "@/components/test/TestListCard";
import { PaymentReceiptAction } from "@/components/payments/PaymentReceiptAction";
import type { ReceiptPayment } from "@/lib/paymentReceipt";

const categoryLabels: Record<string, string> = {
  jee_main: "JEE Main", jee_advanced: "JEE Advanced", neet: "NEET",
  bitsat: "BITSAT", mht_cet: "MHT-CET", foundation: "Foundation",
};
const panel = "rounded-2xl border border-white/[0.08] bg-[#0B1725]";

export default function BatchDetailsPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: batch, isLoading } = useBatch(batchId);
  const { data: batchTests = [] } = useBatchTests(batchId);
  const { data: sections = [] } = useCourseSections(batchId);
  const { isEnrolled, enrollment } = useIsEnrolled(batchId);
  const [selectedSection, setSelectedSection] = useState("all");

  const { data: completedPayment } = useQuery({
    queryKey: ["batch-payment-details", user?.id, batchId],
    enabled: !!user && !!batchId,
    queryFn: async () => {
      if (!user || !batchId) return null;
      const { data, error } = await supabase.from("payments")
        .select("id, amount, currency, status, provider, transaction_id, provider_order_id, created_at, updated_at, metadata, batches(name)")
        .eq("user_id", user.id).eq("batch_id", batchId).eq("status", "completed")
        .order("created_at", { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data as ReceiptPayment | null;
    },
  });

  const features = (batch?.features as string[]) || [];
  const syllabus = (batch?.syllabus as { title: string; topics: string[] }[]) || [];
  const filteredTests = useMemo(() => {
    if (selectedSection === "all") return batchTests;
    if (selectedSection === "__none__") return batchTests.filter((item: any) => !item.section_id);
    return batchTests.filter((item: any) => item.section_id === selectedSection);
  }, [batchTests, selectedSection]);

  const discount = batch?.original_price && batch.original_price > batch.price
    ? Math.round(((batch.original_price - batch.price) / batch.original_price) * 100) : 0;

  if (isLoading) return <DashboardLayout><div className="mx-auto max-w-6xl space-y-5">
    <Skeleton className="h-8 w-40 bg-white/5" /><Skeleton className="h-64 rounded-2xl bg-white/5" /><div className="grid gap-5 lg:grid-cols-[1fr_320px]"><Skeleton className="h-96 rounded-2xl bg-white/5" /><Skeleton className="h-72 rounded-2xl bg-white/5" /></div>
  </div></DashboardLayout>;

  if (!batch) return <DashboardLayout><div className="mx-auto max-w-4xl py-24 text-center text-white"><h1 className="text-2xl font-semibold">Batch not found</h1><Button onClick={() => navigate("/batches")} className="mt-5">Browse batches</Button></div></DashboardLayout>;

  return <DashboardLayout>
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28 }} className="mx-auto max-w-6xl space-y-6">
      <button onClick={() => navigate(isEnrolled ? "/my-batches" : "/batches")} className="inline-flex items-center gap-2 text-xs font-medium text-slate-500 transition hover:text-slate-200">
        <ArrowLeft size={15} /> {isEnrolled ? "Back to My Batches" : "Browse batches"}
      </button>

      <section className={panel + " relative overflow-hidden"}>
        <div className="relative h-48 overflow-hidden sm:h-60">
          {batch.thumbnail_url ? <img src={batch.thumbnail_url} alt="" className="h-full w-full object-cover opacity-65" /> : <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_75%_15%,rgba(35,157,224,.24),transparent_48%),linear-gradient(120deg,#132B43,#0B1725)]" />}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0B1725] via-[#0B1725]/35 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-end justify-between gap-4 p-5 sm:p-7">
            <div className="min-w-0">
              <div className="mb-3 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-[10px] font-medium text-sky-200">{categoryLabels[batch.category || "jee_main"] || batch.category}</span>
                <EnrollmentBadge isEnrolled={isEnrolled} expiresAt={enrollment?.expires_at} paymentStatus={enrollment?.payment_status} />
              </div>
              <h1 className="max-w-3xl text-2xl font-semibold tracking-tight text-white sm:text-3xl">{batch.name}</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{batch.short_description || batch.description || "Your course workspace and test series."}</p>
            </div>
            <div className="hidden h-12 w-12 shrink-0 place-items-center rounded-2xl border border-white/10 bg-black/20 text-sky-200 sm:grid"><Layers3 size={23} /></div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-px border-t border-white/[0.07] bg-white/[0.07] sm:grid-cols-3">
          <div className="bg-[#0B1725] px-5 py-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Included tests</p><p className="mt-1 text-lg font-semibold tabular-nums text-white">{batchTests.length}</p></div>
          <div className="bg-[#0B1725] px-5 py-4"><p className="text-[10px] uppercase tracking-wider text-slate-500">Course sections</p><p className="mt-1 text-lg font-semibold tabular-nums text-white">{sections.length}</p></div>
          <div className="col-span-2 bg-[#0B1725] px-5 py-4 sm:col-span-1"><p className="text-[10px] uppercase tracking-wider text-slate-500">Students</p><p className="mt-1 flex items-center gap-2 text-lg font-semibold tabular-nums text-white"><Users size={16} className="text-slate-500" />{batch.current_students ?? "—"}</p></div>
        </div>
      </section>

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_310px]">
        <div className="min-w-0 space-y-5">
          {batch.description && <section className={panel + " p-5 sm:p-6"}>
            <h2 className="text-sm font-semibold text-white">About this batch</h2>
            <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-400">{batch.description}</p>
          </section>}

          {features.length > 0 && <section className={panel + " p-5 sm:p-6"}>
            <h2 className="text-sm font-semibold text-white">What’s included</h2>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {features.map((feature, i) => <div key={i} className="flex items-start gap-2.5 text-xs leading-5 text-slate-300"><CheckCircle2 size={15} className="mt-0.5 shrink-0 text-teal-300" />{feature}</div>)}
            </div>
          </section>}

          {syllabus.length > 0 && <section className={panel + " p-5 sm:p-6"}>
            <h2 className="text-sm font-semibold text-white">Syllabus overview</h2>
            <div className="mt-4 divide-y divide-white/[0.07]">
              {syllabus.map((section, i) => <details key={i} className="group py-3" open={i === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-xs font-medium text-slate-200">{section.title}<span className="text-slate-600 transition group-open:rotate-180">⌄</span></summary>
                <ul className="mt-3 grid gap-2 pl-1 sm:grid-cols-2">{section.topics.map((topic, j) => <li key={j} className="text-[11px] text-slate-500">— {topic}</li>)}</ul>
              </details>)}
            </div>
          </section>}

          <section className={panel + " p-5 sm:p-6"}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div><h2 className="text-sm font-semibold text-white">Tests in this batch</h2><p className="mt-1 text-[11px] text-slate-500">{filteredTests.length} of {batchTests.length} tests</p></div>
              {sections.length > 0 && <Select value={selectedSection} onValueChange={setSelectedSection}><SelectTrigger className="h-9 w-44 border-white/10 bg-white/[0.03] text-xs text-slate-200"><SelectValue placeholder="All sections" /></SelectTrigger><SelectContent><SelectItem value="all">All sections</SelectItem>{sections.map((section: any) => <SelectItem key={section.id} value={section.id}>{section.name}</SelectItem>)}<SelectItem value="__none__">Unsectioned</SelectItem></SelectContent></Select>}
            </div>
            {filteredTests.length ? <div className="mt-4 space-y-3">{filteredTests.map((item: any) => item.tests && <TestListCard key={item.id} hideAttempt test={{ id: item.tests.id, name: item.tests.name, syllabus: item.tests.syllabus, syllabus_subtitle: item.tests.syllabus_subtitle, duration_minutes: item.tests.duration_minutes || 0, total_questions: item.tests.total_questions ?? undefined, total_marks: item.tests.total_marks ?? undefined, scheduled_at: item.tests.scheduled_at }} />)}</div> : <div className="py-10 text-center"><FileText size={24} className="mx-auto text-slate-600" /><p className="mt-3 text-xs text-slate-500">No tests are listed in this section yet.</p></div>}
            {isEnrolled && <Button variant="outline" onClick={() => navigate("/tests")} className="mt-4 w-full border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]">Open Test Library <ArrowUpRight size={14} className="ml-2" /></Button>}
          </section>
        </div>

        <aside className={panel + " sticky top-20 p-5"}>
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">{isEnrolled ? "Your access" : "Enrollment"}</p>
          {isEnrolled ? <>
            <h2 className="mt-2 text-xl font-semibold text-white">You’re enrolled</h2>
            <p className="mt-2 text-xs leading-5 text-slate-400">Your batch materials and included tests are available from your student workspace.</p>
            <Button onClick={() => navigate("/tests")} className="mt-5 w-full rounded-xl bg-[#1687C9] text-white hover:bg-[#2099DB]"><BookOpen size={15} className="mr-2" />Go to Test Library</Button>
            {enrollment?.expires_at && <div className="mt-4 flex items-center gap-2 border-t border-white/[0.07] pt-4 text-[11px] text-slate-500"><Clock3 size={14} />Access until {format(new Date(enrollment.expires_at), "dd MMM yyyy")}</div>}
          </> : <>
            <div className="mt-3 flex items-end gap-1"><IndianRupee size={22} className="mb-1 text-slate-300" /><span className="text-3xl font-semibold tabular-nums text-white">{Number(batch.price || 0).toLocaleString("en-IN")}</span></div>
            {discount > 0 && <div className="mt-1 flex items-center gap-2 text-[11px]"><span className="text-slate-600 line-through">₹{Number(batch.original_price).toLocaleString("en-IN")}</span><span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-medium text-emerald-300">{discount}% off</span></div>}
            <Button onClick={() => navigate(user ? `/checkout/${batch.id}` : "/auth")} className="mt-5 w-full rounded-xl bg-[#1687C9] text-white hover:bg-[#2099DB]">{user ? "Enroll now" : "Login to enroll"}</Button>
            <p className="mt-2 text-center text-[10px] text-slate-600">Secure payment · Instant access after confirmation</p>
          </>}
          <div className="mt-5 space-y-3 border-t border-white/[0.07] pt-4">
            {batch.start_date && <div className="flex items-center gap-2 text-[11px] text-slate-400"><CalendarDays size={14} className="text-slate-600" />Starts {format(new Date(batch.start_date), "dd MMM yyyy")}</div>}
            {batch.end_date && <div className="flex items-center gap-2 text-[11px] text-slate-400"><Clock3 size={14} className="text-slate-600" />Ends {format(new Date(batch.end_date), "dd MMM yyyy")}</div>}
            {batch.enrollment_deadline && !isEnrolled && <div className="flex items-center gap-2 text-[11px] text-amber-300"><CalendarDays size={14} />Enroll by {format(new Date(batch.enrollment_deadline), "dd MMM yyyy")}</div>}
          </div>
          {completedPayment && user && <div className="mt-5 border-t border-white/[0.07] pt-4"><p className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">Payment receipt</p><p className="mb-3 text-sm font-semibold text-white">{completedPayment.currency} {Number(completedPayment.amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p><PaymentReceiptAction payment={completedPayment} userId={user.id} email={user.email || "Not provided"} buttonLabel="View receipt" /></div>}
        </aside>
      </div>
    </motion.div>
  </DashboardLayout>;
}
