import type { jsPDF as PDF } from "jspdf";

export interface ReceiptPayment {
  id: string;
  amount: number;
  currency: string;
  status: string;
  provider: string | null;
  transaction_id: string | null;
  provider_order_id: string | null;
  created_at: string;
  updated_at: string;
  metadata: unknown;
  batches: { name: string } | null;
}

export interface ReceiptStudent {
  full_name: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  roll_number: string | null;
  academic_status?: string | null;
}

const money = (value: number, currency: string) => `${currency} ${value.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const metadataValue = (metadata: unknown, key: string) => {
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
  const value = (metadata as Record<string, unknown>)[key];
  return typeof value === "string" || typeof value === "number" ? String(value) : null;
};

async function addLogo(doc: PDF) {
  try {
    const response = await fetch("/logo.png");
    if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) return false;
    const blob = await response.blob();
    const imageUrl = URL.createObjectURL(blob);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Could not load logo image"));
        img.src = imageUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      canvas.getContext("2d")?.drawImage(image, 0, 0);
      const width = Math.min(48, 12 * image.width / image.height);
      doc.addImage(canvas.toDataURL("image/png"), "PNG", 17, 14, width, 12);
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
    return true;
  } catch {
    return false;
  }
}

export async function buildPaymentReceiptDocument(payment: ReceiptPayment, student: ReceiptStudent | null, email: string) {
  if (payment.status !== "completed") throw new Error("Receipts are available only for completed payments.");
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF();
  const blue: [number, number, number] = [18, 76, 157];
  const ink: [number, number, number] = [30, 43, 62];
  const grey: [number, number, number] = [94, 108, 125];
  const line = (y: number) => { doc.setDrawColor(222, 230, 240); doc.line(17, y, 193, y); };
  const label = (text: string, value: string, y: number) => {
    doc.setFontSize(9); doc.setTextColor(...grey); doc.text(text, 17, y);
    doc.setFontSize(10); doc.setTextColor(...ink);
    const lines = doc.splitTextToSize(value, 102);
    doc.text(lines, 89, y);
    return y + Math.max(9, lines.length * 5 + 4);
  };

  doc.setFillColor(...blue); doc.rect(0, 0, 210, 4, "F");
  if (!(await addLogo(doc))) {
    doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(22); doc.text("PhyNetix", 17, 24);
  }
  doc.setTextColor(...grey); doc.setFont("helvetica", "normal"); doc.setFontSize(9);
  doc.text("PAYMENT RECEIPT", 193, 22, { align: "right" });
  line(33);

  doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(17);
  doc.text("Payment received", 17, 46);
  doc.setTextColor(...ink); doc.setFontSize(11); doc.setFont("helvetica", "normal");
  doc.text("Receipt for your PhyNetix enrollment", 17, 54);

  let y = 68;
  doc.setTextColor(...blue); doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.text("TRANSACTION", 17, y);
  y += 10; doc.setFont("helvetica", "normal");
  y = label("Receipt reference", payment.id, y);
  y = label("Paid on", new Date(payment.updated_at || payment.created_at).toLocaleString("en-IN", { dateStyle: "long", timeStyle: "short" }), y);
  y = label("Enrollment", payment.batches?.name || "Course enrollment", y);
  y = label("Payment method", payment.provider === "razorpay" ? "Razorpay" : payment.provider === "coupon" ? "Coupon" : "Free enrollment", y);
  if (payment.transaction_id) y = label("Transaction ID", payment.transaction_id, y);
  const orderId = metadataValue(payment.metadata, "razorpay_order_id") || payment.provider_order_id;
  if (orderId) y = label("Order ID", orderId, y);
  const coupon = metadataValue(payment.metadata, "coupon_code");
  if (coupon) y = label("Coupon", coupon, y);

  line(y + 2); y += 14;
  doc.setFont("helvetica", "bold"); doc.setTextColor(...blue); doc.setFontSize(10); doc.text("STUDENT", 17, y);
  doc.setFont("helvetica", "normal"); y += 10;
  y = label("Name", student?.full_name || "Not provided", y);
  y = label("Email", email, y);
  if (student?.phone) y = label("Phone", student.phone, y);
  if (student?.academic_status) y = label("Class / status", student.academic_status, y);
  if (student?.roll_number) y = label("Roll number", student.roll_number, y);
  const address = [student?.address, student?.city, student?.state, student?.country].filter(Boolean).join(", ");
  if (address) y = label("Address", address, y);

  line(y + 2); y += 16;
  const originalPrice = Number(metadataValue(payment.metadata, "original_price"));
  if (Number.isFinite(originalPrice) && originalPrice > Number(payment.amount)) {
    y = label("Course price", money(originalPrice, payment.currency), y);
    y = label("Discount", `- ${money(originalPrice - Number(payment.amount), payment.currency)}`, y);
  }
  doc.setFillColor(239, 245, 253); doc.roundedRect(17, y, 176, 20, 2, 2, "F");
  doc.setFont("helvetica", "bold"); doc.setTextColor(...blue); doc.setFontSize(12);
  doc.text("Amount paid", 22, y + 13);
  doc.text(money(Number(payment.amount), payment.currency), 188, y + 13, { align: "right" });
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(...grey);
  doc.text("Generated from your completed payment record. This is a payment acknowledgement, not a tax invoice.", 17, 281);
  return doc;
}

export async function downloadPaymentReceipt(payment: ReceiptPayment, student: ReceiptStudent | null, email: string) {
  const doc = await buildPaymentReceiptDocument(payment, student, email);
  doc.save(`PhyNetix-receipt-${payment.id.slice(0, 8)}.pdf`);
}