import { useNavigate } from "react-router-dom";
import { useUserEnrollments } from "@/hooks/useEnrollment";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrollmentBadge } from "@/components/batch/EnrollmentBadge";
import { BookOpen, Calendar, ArrowRight, Plus } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

const categoryLabels: Record<string, string> = {
  jee_main: "JEE Main",
  jee_advanced: "JEE Advanced",
  neet: "NEET",
  bitsat: "BITSAT",
  mht_cet: "MHT-CET",
  foundation: "Foundation",
};

export default function MyBatchesPage() {
  const navigate = useNavigate();
  const { data: enrollments, isLoading } = useUserEnrollments();

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 rounded-lg" />
            ))}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">My Batches</h1>
              <p className="text-muted-foreground">
                Your enrolled courses and test series
              </p>
            </div>
            <Button onClick={() => navigate('/batches')}>
              <Plus className="w-4 h-4 mr-2" />
              Explore More
            </Button>
          </div>

          {enrollments && enrollments.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {enrollments.map((enrollment: any) => (
                <Card 
                  key={enrollment.id} 
                  className="group hover:border-primary/30 transition-all cursor-pointer"
                  onClick={() => navigate(`/batches/${enrollment.batch_id}`)}
                >
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between">
                      <Badge variant="secondary">
                        {categoryLabels[enrollment.batches?.category] || 'Course'}
                      </Badge>
                      <EnrollmentBadge 
                        isEnrolled={true}
                        expiresAt={enrollment.expires_at}
                        paymentStatus={enrollment.payment_status}
                        size="sm"
                      />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {enrollment.batches?.name || 'Unknown Batch'}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        <span>Enrolled {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}</span>
                      </div>
                      
                      {enrollment.expires_at && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <BookOpen className="w-4 h-4" />
                          <span>Valid until {format(new Date(enrollment.expires_at), 'MMM d, yyyy')}</span>
                        </div>
                      )}

                      <Button variant="ghost" className="w-full mt-2 group-hover:bg-primary/10">
                        View Batch
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <BookOpen className="w-16 h-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">No Batches Yet</h3>
                <p className="text-muted-foreground mb-6">
                  You haven't enrolled in any batch yet. Explore our courses to get started!
                </p>
                <Button onClick={() => navigate('/batches')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Browse Batches
                </Button>
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
