import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Users, BookOpen, CheckCircle, IndianRupee, Star } from "lucide-react";
import { Link } from "react-router-dom";
import type { Batch } from "@/hooks/useBatches";
import { format } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface BatchCardProps {
  batch: Batch;
  isEnrolled?: boolean;
  showEnrollButton?: boolean;
}

const categoryLabels: Record<string, string> = {
  jee_main: "JEE Main",
  jee_advanced: "JEE Advanced",
  neet: "NEET",
  bitsat: "BITSAT",
  mht_cet: "MHT-CET",
  foundation: "Foundation",
};

export function BatchCard({ batch, isEnrolled = false, showEnrollButton = true }: BatchCardProps) {
  const discountPercent = batch.original_price
    ? Math.round(((batch.original_price - batch.price) / batch.original_price) * 100)
    : 0;

  const features = (batch.features as string[]) || [];

  const { data: rating } = useQuery({
    queryKey: ["batch-rating", batch.id],
    queryFn: async () => {
      const { data: bts } = await supabase.from("batch_tests").select("test_id").eq("batch_id", batch.id);
      const ids = (bts || []).map((b: any) => b.test_id);
      if (!ids.length) return { avg: 0, count: 0 };
      const { data: reviews } = await supabase.from("test_reviews").select("rating").in("test_id", ids);
      const list = reviews || [];
      if (!list.length) return { avg: 0, count: 0 };
      const sum = list.reduce((a: number, r: any) => a + r.rating, 0);
      return { avg: sum / list.length, count: list.length };
    },
    staleTime: 60_000,
  });


  return (
    <Card className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-all duration-300">
      {/* Featured Badge */}
      {batch.is_featured && (
        <div className="absolute top-3 right-3 z-10">
          <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
            Featured
          </Badge>
        </div>
      )}

      {/* Enrolled Badge */}
      {isEnrolled && (
        <div className="absolute top-3 left-3 z-10">
          <Badge variant="outline" className="bg-background/80 backdrop-blur-sm">
            <CheckCircle className="w-3 h-3 mr-1 text-primary" />
            Enrolled
          </Badge>
        </div>
      )}

      {/* Thumbnail */}
      <div className="h-40 bg-gradient-to-br from-primary/20 to-secondary/20 relative overflow-hidden">
        {batch.thumbnail_url ? (
          <img 
            src={batch.thumbnail_url} 
            alt={batch.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <BookOpen className="w-16 h-16 text-primary/30" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
      </div>

      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Badge variant="secondary" className="mb-2">
              {categoryLabels[batch.category || 'jee_main'] || batch.category}
            </Badge>
            <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-primary transition-colors">
              {batch.name}
            </h3>
          </div>
        </div>
        {batch.short_description && (
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
            {batch.short_description}
          </p>
        )}
      </CardHeader>

      <CardContent className="pb-3">
        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
          {batch.current_students !== null && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              <span>{batch.current_students} enrolled</span>
            </div>
          )}
          {batch.start_date && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Starts {format(new Date(batch.start_date), 'MMM d')}</span>
            </div>
          )}
          {rating && rating.count > 0 && (
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
              <span>{rating.avg.toFixed(1)} ({rating.count})</span>
            </div>
          )}
        </div>

        {/* Features Preview */}
        {features.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {features.slice(0, 3).map((feature, i) => (
              <Badge key={i} variant="outline" className="text-xs font-normal">
                {feature}
              </Badge>
            ))}
            {features.length > 3 && (
              <Badge variant="outline" className="text-xs font-normal">
                +{features.length - 3} more
              </Badge>
            )}
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold text-foreground flex items-center">
            <IndianRupee className="w-5 h-5" />
            {batch.price.toLocaleString('en-IN')}
          </span>
          {batch.original_price && batch.original_price > batch.price && (
            <>
              <span className="text-sm text-muted-foreground line-through flex items-center">
                <IndianRupee className="w-3 h-3" />
                {batch.original_price.toLocaleString('en-IN')}
              </span>
              <Badge variant="secondary" className="text-xs">
                {discountPercent}% OFF
              </Badge>
            </>
          )}
        </div>
      </CardContent>

      {showEnrollButton && (
        <CardFooter className="pt-0">
          <Link to={`/batches/${batch.id}`} className="w-full">
            <Button 
              className="w-full" 
              variant={isEnrolled ? "secondary" : "default"}
            >
              {isEnrolled ? "View Batch" : "View Details"}
            </Button>
          </Link>
        </CardFooter>
      )}
    </Card>
  );
}
