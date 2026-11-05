import { useState } from "react";
import { Download, FileText, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { buildPaymentReceiptDocument, type ReceiptPayment, type ReceiptStudent } from "@/lib/paymentReceipt";

interface PaymentReceiptActionProps {
  payment: ReceiptPayment;
  userId: string;
  email: string;
  buttonLabel?: string;
}

const money = (amount: number, currency: string) =>
  `${currency} ${Number(amount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const readMetadata = (metadata: unknown, key: string) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
};

export function PaymentReceiptAction({ payment, userId, email, buttonLabel = "View receipt" }: PaymentReceiptActionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [student, setStudent] = useState<ReceiptStudent | null>(null);

  const loadStudent = async () => {
    const { data, error } = await supabase.from("profiles")
      .select("full_name, phone, address, city, state, roll_number, academic_status")
      .eq("id", userId).maybeSingle();
    if (error) throw error;
    const profile = data as ReceiptStudent | null;
    setStudent(profile);
    return profile;
  };

  const handleOpen = async () => {
    setLoading(true);
    try {
      await loadStudent();
      setOpen(true);
    } catch {
      toast.error("Could not load your receipt details. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (payment.status !== "completed") return;
    setDownloading(true);
    try {
      const verifiedStudent = student ?? await loadStudent();
      const doc = await buildPaymentReceiptDocument(payment, verifiedStudent, email || "Not provided");
      doc.save(`PhyNetix-receipt-${payment.id.slice(0, 8)}.pdf`);
    } catch {
      toast.error("Could not download the receipt. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  const orderId = readMetadata(payment.metadata, "razorpay_order_id") || payment.provider_order_id;
  const coupon = readMetadata(payment.metadata, "coupon_code");
  const address = [student?.address, student?.city, student?.state].filter(Boolean).join(", ");

  return (
    <>
      <Button variant="outline" size="sm" onClick={handleOpen} disabled={loading}>
        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
        {loading ? "Loading…" : buttonLabel}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-xl">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary"><FileText className="h-5 w-5" /></div>
              <Badge variant="secondary" className="capitalize">{payment.status}</Badge>
            </div>
            <DialogTitle>PhyNetix payment receipt</DialogTitle>
            <DialogDescription>Receipt preview generated from your payment record and profile.</DialogDescription>
          </DialogHeader>

          <div className="space-y-5 rounded-md border bg-card p-4">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b pb-4">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">Enrollment</p>
                <p className="mt-1 font-semibold">{payment.batches?.name || "Course enrollment"}</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-medium uppercase text-muted-foreground">Amount paid</p>
                <p className="mt-1 text-lg font-bold text-primary">{money(Number(payment.amount), payment.currency)}</p>
              </div>
            </div>

            <section className="space-y-2 text-sm">
              <h3 className="font-semibold">Transaction details</h3>
              <Detail label="Receipt reference" value={payment.id} />
              <Detail label="Paid on" value={format(new Date(payment.updated_at || payment.created_at), "dd MMM yyyy, h:mm a")} />
              <Detail label="Payment method" value={payment.provider === "razorpay" ? "Razorpay" : payment.provider === "coupon" ? "Coupon" : "Free enrollment"} />
              {payment.transaction_id && <Detail label="Transaction ID" value={payment.transaction_id} />}
              {orderId && <Detail label="Order ID" value={orderId} />}
              {coupon && <Detail label="Coupon" value={coupon} />}
            </section>

            <section className="space-y-2 border-t pt-4 text-sm">
              <h3 className="font-semibold">Student details</h3>
              <Detail label="Name" value={student?.full_name || "Not provided"} />
              <Detail label="Email" value={email || "Not provided"} />
              {student?.phone && <Detail label="Phone" value={student.phone} />}
              {student?.academic_status && <Detail label="Class / status" value={student.academic_status} />}
              {student?.roll_number && <Detail label="Roll number" value={student.roll_number} />}
              {address && <Detail label="Address" value={address} />}
            </section>
          </div>

          <p className="text-xs text-muted-foreground">Payment acknowledgement generated from your completed payment record; not a tax invoice.</p>
          <Button onClick={handleDownload} disabled={downloading || payment.status !== "completed"}>
            {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
            {downloading ? "Preparing PDF…" : "Download PDF"}
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return <div className="grid grid-cols-[minmax(7rem,auto)_1fr] gap-3"><span className="text-muted-foreground">{label}</span><span className="break-words text-right font-medium">{value}</span></div>;
}