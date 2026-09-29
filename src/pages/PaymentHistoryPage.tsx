import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { downloadPaymentReceipt, type ReceiptPayment, type ReceiptStudent } from "@/lib/paymentReceipt";

const statusVariant = (s: string) =>
  s === "completed" ? "default" : s === "failed" ? "destructive" : "secondary";

export default function PaymentHistoryPage() {
  const { user } = useAuth();
  const [downloading, setDownloading] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["payment-history", user?.id],
    enabled: !!user,
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from("payments")
        .select("id, amount, currency, status, provider, transaction_id, provider_order_id, created_at, updated_at, metadata, batch_id, batches(name)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ReceiptPayment[];
    },
  });

  const handleDownload = async (payment: ReceiptPayment) => {
    if (!user || payment.status !== "completed") return;
    setDownloading(payment.id);
    try {
      const { data: profile, error } = await supabase.from("profiles")
        .select("full_name, phone, address, city, state, country, roll_number")
        .eq("id", user.id).maybeSingle();
      if (error) throw error;
      await downloadPaymentReceipt(payment, profile as ReceiptStudent | null, user.email || "Not provided");
    } catch {
      toast.error("Could not download receipt. Please try again.");
    } finally {
      setDownloading(null);
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Payment History</h1>
        <p className="text-sm text-muted-foreground mb-5">Download a payment receipt for any completed enrollment.</p>
        <Card>
          <CardHeader><CardTitle>Your enrollment payments</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-40 w-full" />
            ) : !data?.length ? (
              <p className="text-muted-foreground text-center py-8">No payments yet.</p>
            ) : (
              <div className="overflow-x-auto"><Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Course</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Transaction</TableHead>
                    <TableHead className="text-right">Receipt</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell>{new Date(p.created_at).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}</TableCell>
                      <TableCell>{p.batches?.name ?? "—"}</TableCell>
                      <TableCell>₹{Number(p.amount).toLocaleString("en-IN")}</TableCell>
                      <TableCell><Badge variant={statusVariant(p.status) as any} className="capitalize">{p.status}</Badge></TableCell>
                      <TableCell className="text-xs text-muted-foreground font-mono">{p.transaction_id ?? p.provider ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        {p.status === "completed" && <Button variant="outline" size="sm" onClick={() => handleDownload(p)} disabled={downloading === p.id} aria-label={`Download receipt for ${p.batches?.name || "enrollment"}`}>
                          <Download className="w-4 h-4 mr-2" />{downloading === p.id ? "Preparing…" : "Receipt"}
                        </Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table></div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
