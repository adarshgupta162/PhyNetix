import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useBatch } from "@/hooks/useBatches";
import { useCreateEnrollment } from "@/hooks/useEnrollment";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { IndianRupee, ArrowLeft, Shield, Tag, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";

export default function CheckoutPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: batch, isLoading } = useBatch(batchId);
  const createEnrollment = useCreateEnrollment();
  
  const [couponCode, setCouponCode] = useState("");
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  const [appliedDiscount, setAppliedDiscount] = useState(0);

  // For now, we'll implement a simple "demo" checkout that creates a manual enrollment
  // Real payment integration would connect to Razorpay/Stripe here
  
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    // TODO: Implement coupon validation
    setTimeout(() => {
      setIsApplyingCoupon(false);
      toast.error("Invalid coupon code");
    }, 1000);
  };

  const handleProceedToPayment = async () => {
    if (!user || !batchId) {
      toast.error("Please login to continue");
      return;
    }

    // For demo purposes, create a manual enrollment
    // In production, this would redirect to payment gateway
    try {
      await createEnrollment.mutateAsync({
        batchId,
        enrollmentType: 'manual', // Change to 'paid' when payment integration is ready
        notes: 'Demo enrollment - payment integration pending',
      });
      
      toast.success("Enrollment successful!");
      navigate('/my-batches');
    } catch (error: any) {
      toast.error(error.message || "Failed to complete enrollment");
    }
  };

  const finalPrice = batch ? batch.price - appliedDiscount : 0;

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
          <Button onClick={() => navigate('/batches')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batches
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Button 
            variant="ghost" 
            onClick={() => navigate(`/batches/${batchId}`)}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batch Details
          </Button>

          <h1 className="text-3xl font-bold mb-8">Complete Your Enrollment</h1>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Order Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Order Summary</CardTitle>
                <CardDescription>Review your enrollment details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-secondary/30 rounded-lg">
                  <div className="flex-1">
                    <h3 className="font-semibold">{batch.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      {batch.short_description}
                    </p>
                  </div>
                </div>

                <Separator />

                {/* Price Breakdown */}
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Batch Price</span>
                    <span className="flex items-center">
                      <IndianRupee className="w-4 h-4" />
                      {(batch.original_price || batch.price).toLocaleString('en-IN')}
                    </span>
                  </div>
                  
                  {batch.original_price && batch.original_price > batch.price && (
                    <div className="flex justify-between text-primary">
                      <span>Discount</span>
                      <span className="flex items-center">
                        - <IndianRupee className="w-4 h-4" />
                        {(batch.original_price - batch.price).toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}

                  {appliedDiscount > 0 && (
                    <div className="flex justify-between text-primary">
                      <span>Coupon Discount</span>
                      <span className="flex items-center">
                        - <IndianRupee className="w-4 h-4" />
                        {appliedDiscount.toLocaleString('en-IN')}
                      </span>
                    </div>
                  )}
                </div>

                <Separator />

                <div className="flex justify-between text-lg font-bold">
                  <span>Total</span>
                  <span className="flex items-center">
                    <IndianRupee className="w-5 h-5" />
                    {finalPrice.toLocaleString('en-IN')}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Payment Card */}
            <Card>
              <CardHeader>
                <CardTitle>Payment</CardTitle>
                <CardDescription>Complete your purchase</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Coupon Code */}
                <div className="space-y-2">
                  <Label htmlFor="coupon">Have a coupon?</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="coupon"
                        placeholder="Enter coupon code"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="pl-9"
                      />
                    </div>
                    <Button 
                      variant="secondary" 
                      onClick={handleApplyCoupon}
                      disabled={isApplyingCoupon || !couponCode.trim()}
                    >
                      Apply
                    </Button>
                  </div>
                </div>

                <Separator />

                {/* Payment Info */}
                <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Shield className="w-4 h-4 text-primary" />
                    <span>Secure payment powered by Razorpay</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    <span>Instant access after payment</span>
                  </div>
                </div>

                <Badge variant="outline" className="w-full justify-center py-2">
                  Demo Mode - Click below for free enrollment
                </Badge>
              </CardContent>
              <CardFooter>
                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleProceedToPayment}
                  disabled={createEnrollment.isPending}
                >
                  {createEnrollment.isPending ? "Processing..." : `Enroll Now - ₹${finalPrice.toLocaleString('en-IN')}`}
                </Button>
              </CardFooter>
            </Card>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
