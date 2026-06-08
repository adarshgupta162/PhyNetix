import { useParams, useNavigate } from "react-router-dom";
import { useBatch, useBatchTests } from "@/hooks/useBatches";
import { useIsEnrolled } from "@/hooks/useEnrollment";
import { useAuth } from "@/hooks/useAuth";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { EnrollmentBadge } from "@/components/batch/EnrollmentBadge";
import { 
  IndianRupee, 
  Calendar, 
  Users, 
  Clock, 
  BookOpen, 
  CheckCircle,
  ArrowLeft,
  FileText
} from "lucide-react";
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

export default function BatchDetailsPage() {
  const { batchId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: batch, isLoading } = useBatch(batchId);
  const { data: batchTests } = useBatchTests(batchId);
  const { isEnrolled, enrollment } = useIsEnrolled(batchId);

  const features = (batch?.features as string[]) || [];
  const syllabus = (batch?.syllabus as { title: string; topics: string[] }[]) || [];

  const discountPercent = batch?.original_price 
    ? Math.round(((batch.original_price - batch.price) / batch.original_price) * 100)
    : 0;

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 md:p-8">
          <Skeleton className="h-8 w-48 mb-6" />
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-64 rounded-lg" />
              <Skeleton className="h-48 rounded-lg" />
            </div>
            <Skeleton className="h-96 rounded-lg" />
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
      <div className="p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Back Button */}
          <Button 
            variant="ghost" 
            onClick={() => navigate('/batches')}
            className="mb-6"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Batches
          </Button>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Card */}
              <Card className="overflow-hidden">
                <div className="h-48 bg-gradient-to-br from-primary/20 to-secondary/20 relative">
                  {batch.thumbnail_url ? (
                    <img 
                      src={batch.thumbnail_url} 
                      alt={batch.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <BookOpen className="w-24 h-24 text-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
                </div>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="secondary" className="mb-2">
                        {categoryLabels[batch.category || 'jee_main'] || batch.category}
                      </Badge>
                      <CardTitle className="text-2xl">{batch.name}</CardTitle>
                    </div>
                    <EnrollmentBadge 
                      isEnrolled={isEnrolled} 
                      expiresAt={enrollment?.expires_at}
                      paymentStatus={enrollment?.payment_status}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-4">
                    {batch.description || batch.short_description}
                  </p>

                  {/* Stats */}
                  <div className="flex flex-wrap gap-4 text-sm">
                    {batch.start_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        Starts {format(new Date(batch.start_date), 'MMM d, yyyy')}
                      </div>
                    )}
                    {batch.end_date && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        Ends {format(new Date(batch.end_date), 'MMM d, yyyy')}
                      </div>
                    )}
                    {batch.current_students !== null && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="w-4 h-4" />
                        {batch.current_students} students enrolled
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Features */}
              {features.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">What's Included</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="grid sm:grid-cols-2 gap-3">
                      {features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Syllabus */}
              {syllabus.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Syllabus</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {syllabus.map((section, i) => (
                      <div key={i}>
                        <h4 className="font-medium mb-2">{section.title}</h4>
                        <ul className="list-disc list-inside text-muted-foreground text-sm space-y-1">
                          {section.topics.map((topic, j) => (
                            <li key={j}>{topic}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Tests in this batch */}
              {batchTests && batchTests.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Tests Included ({batchTests.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {batchTests.slice(0, 5).map((bt: any) => (
                        <li key={bt.id} className="flex items-center justify-between p-2 rounded-lg bg-secondary/50">
                          <span>{bt.tests?.name || 'Unnamed Test'}</span>
                          {bt.is_bonus && (
                            <Badge variant="secondary" className="text-xs">Bonus</Badge>
                          )}
                        </li>
                      ))}
                      {batchTests.length > 5 && (
                        <li className="text-sm text-muted-foreground text-center py-2">
                          +{batchTests.length - 5} more tests
                        </li>
                      )}
                    </ul>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar - Pricing Card */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg">Enrollment</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Price */}
                  <div className="text-center py-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-4xl font-bold flex items-center">
                        <IndianRupee className="w-8 h-8" />
                        {batch.price.toLocaleString('en-IN')}
                      </span>
                    </div>
                    {batch.original_price && batch.original_price > batch.price && (
                      <div className="flex items-center justify-center gap-2 mt-1">
                        <span className="text-muted-foreground line-through flex items-center">
                          <IndianRupee className="w-4 h-4" />
                          {batch.original_price.toLocaleString('en-IN')}
                        </span>
                        <Badge variant="secondary">
                          {discountPercent}% OFF
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Enrollment deadline */}
                  {batch.enrollment_deadline && (
                    <div className="text-center text-sm text-muted-foreground">
                      Enrollment closes on {format(new Date(batch.enrollment_deadline), 'MMM d, yyyy')}
                    </div>
                  )}

                  {/* Capacity */}
                  {batch.max_students && (
                    <div className="text-center text-sm">
                      <span className="text-muted-foreground">
                        {batch.max_students - (batch.current_students || 0)} seats left
                      </span>
                    </div>
                  )}

                  {/* CTA Button */}
                  {isEnrolled ? (
                    <Button className="w-full" size="lg" onClick={() => navigate('/my-batches')}>
                      Go to My Batches
                    </Button>
                  ) : user ? (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate(`/checkout/${batch.id}`)}
                    >
                      Enroll Now
                    </Button>
                  ) : (
                    <Button 
                      className="w-full" 
                      size="lg"
                      onClick={() => navigate('/auth')}
                    >
                      Login to Enroll
                    </Button>
                  )}

                  <p className="text-xs text-center text-muted-foreground">
                    Secure payment. Instant access.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
