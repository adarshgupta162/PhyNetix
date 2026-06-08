import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, Lock, AlertCircle } from "lucide-react";
import { format } from "date-fns";

interface EnrollmentBadgeProps {
  isEnrolled: boolean;
  expiresAt?: string | null;
  paymentStatus?: string | null;
  size?: "sm" | "default";
}

export function EnrollmentBadge({ 
  isEnrolled, 
  expiresAt, 
  paymentStatus,
  size = "default" 
}: EnrollmentBadgeProps) {
  const iconSize = size === "sm" ? "w-3 h-3" : "w-4 h-4";
  
  if (!isEnrolled) {
    return (
      <Badge variant="outline" className="text-muted-foreground">
        <Lock className={`${iconSize} mr-1`} />
        Not Enrolled
      </Badge>
    );
  }

  if (paymentStatus === 'pending') {
    return (
      <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">
        <AlertCircle className={`${iconSize} mr-1`} />
        Payment Pending
      </Badge>
    );
  }

  if (expiresAt) {
    const expiryDate = new Date(expiresAt);
    const isExpired = expiryDate < new Date();
    const isExpiringSoon = !isExpired && expiryDate < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    if (isExpired) {
      return (
        <Badge className="bg-destructive/20 text-destructive border-destructive/30">
          <AlertCircle className={`${iconSize} mr-1`} />
          Expired
        </Badge>
      );
    }

    if (isExpiringSoon) {
      return (
        <Badge className="bg-amber-500/20 text-amber-600 border-amber-500/30">
          <Clock className={`${iconSize} mr-1`} />
          Expires {format(expiryDate, 'MMM d')}
        </Badge>
      );
    }
  }

  return (
    <Badge className="bg-green-500/20 text-green-600 border-green-500/30">
      <CheckCircle className={`${iconSize} mr-1`} />
      Enrolled
    </Badge>
  );
}
