import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { 
  CheckCircle, 
  ArrowRight, 
  Trophy,
  Calendar,
  Users,
  BookOpen,
  Search,
  Sparkles,
  Star,
  Zap,
  TrendingUp
} from "lucide-react";
import { cn } from "@/lib/utils";

// Category configuration with styling
const examCategories = [
  {
    id: "all",
    name: "All Exams",
    icon: BookOpen,
    gradient: "from-primary/20 via-accent/10 to-secondary/20",
    activeGradient: "from-primary to-accent",
  },
  {
    id: "jee_main",
    name: "JEE Main",
    logo: "/logos/test-series/jee-main.png",
    icon: Zap,
    gradient: "from-blue-500/20 to-indigo-600/20",
    activeGradient: "from-blue-500 to-indigo-600",
  },
  {
    id: "jee_advanced",
    name: "JEE Advanced",
    logo: "/logos/test-series/jee-advanced.png",
    icon: Star,
    gradient: "from-purple-500/20 to-violet-600/20",
    activeGradient: "from-purple-500 to-violet-600",
  },
  {
    id: "jee_main_advanced",
    name: "JEE Main + Advanced",
    logo: "/logos/test-series/jee-advanced.png",
    icon: Trophy,
    gradient: "from-indigo-500/20 to-purple-600/20",
    activeGradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "neet",
    name: "NEET",
    logo: "/logos/test-series/neet.png",
    icon: TrendingUp,
    gradient: "from-red-500/20 to-rose-600/20",
    activeGradient: "from-red-500 to-rose-600",
  },
  {
    id: "bitsat",
    name: "BITSAT",
    logo: "/logos/test-series/bitsat.png",
    icon: Sparkles,
    gradient: "from-orange-500/20 to-amber-600/20",
    activeGradient: "from-orange-500 to-amber-600",
  },
  {
    id: "mht_cet",
    name: "MHT-CET",
    logo: "/logos/test-series/mht-cet.png",
    icon: BookOpen,
    gradient: "from-green-500/20 to-emerald-600/20",
    activeGradient: "from-green-500 to-emerald-600",
  },
];

interface BatchWithCategory {
  id: string;
  name: string;
  short_description: string | null;
  category: string | null;
  price: number;
  original_price: number | null;
  features: string[] | null;
  current_students: number | null;
  is_featured: boolean | null;
  start_date: string | null;
}

export function TestSeriesSection() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch active batches
  const { data: batches, isLoading } = useQuery({
    queryKey: ["landing-batches"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("id, name, short_description, category, price, original_price, features, current_students, is_featured, start_date")
        .eq("is_active", true)
        .order("is_featured", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as BatchWithCategory[];
    },
  });

  // Get categories that have batches
  const categoriesWithBatches = examCategories.filter(cat => 
    cat.id === "all" || batches?.some(b => b.category === cat.id)
  );

  // Filter batches by category and search
  const filteredBatches = batches?.filter(batch => {
    const matchesCategory = selectedCategory === "all" || batch.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      batch.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      batch.short_description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  }) || [];

  const getYearFromBatch = (batch: BatchWithCategory) => {
    const yearMatch = batch.name.match(/20\d{2}/);
    if (yearMatch) return yearMatch[0];
    if (batch.start_date) {
      return new Date(batch.start_date).getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 15 }
    }
  };

  if (isLoading) {
    return (
      <section className="relative z-10 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-radial)]" />
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Skeleton className="h-8 w-48 mx-auto mb-4" />
            <Skeleton className="h-14 w-[500px] max-w-full mx-auto mb-4" />
            <Skeleton className="h-6 w-80 mx-auto" />
          </div>
          <div className="flex justify-center gap-3 mb-10">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-12 w-32 rounded-full" />
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[400px] rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Empty state
  if (!batches?.length) {
    return (
      <section className="relative z-10 py-24 overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-radial)]" />
        <div className="container mx-auto px-4 relative">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 px-5 py-2 text-sm bg-primary/10 text-primary border-primary/20">
              <Trophy className="w-4 h-4 mr-2" />
              Test Series
            </Badge>
            <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">
              <span className="gradient-text">Choose Your</span>
              <br />
              <span>Test Series</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Comprehensive test series designed by experts to help you ace your exams
            </p>
          </motion.div>

          {/* Placeholder cards */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {examCategories.slice(1, 7).map((cat) => (
              <motion.div
                key={cat.id}
                variants={itemVariants}
                className="group relative"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl blur-xl -z-10" 
                  style={{ background: `linear-gradient(135deg, hsl(var(--primary) / 0.2), hsl(var(--accent) / 0.2))` }} 
                />
                <div className="relative overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-500 hover:border-primary/30 hover:shadow-[var(--glow-primary)]">
                  {/* Glass overlay */}
                  <div className="absolute inset-0 bg-[var(--gradient-glass)] pointer-events-none" />
                  
                  <div className="relative p-6">
                    <div className="flex items-start justify-between mb-6">
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center",
                        "bg-gradient-to-br shadow-lg",
                        cat.gradient
                      )}>
                        {cat.logo ? (
                          <img 
                            src={cat.logo} 
                            alt={cat.name}
                            className="w-10 h-10 object-contain"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                            }}
                          />
                        ) : (
                          <cat.icon className="w-8 h-8 text-foreground/70" />
                        )}
                      </div>
                      <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
                        Coming Soon
                      </Badge>
                    </div>

                    <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">
                      {cat.name} Test Series
                    </h3>

                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      Comprehensive test series with detailed analysis and expert solutions.
                    </p>

                    <Link to="/auth">
                      <Button 
                        variant="outline" 
                        className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300"
                      >
                        Get Notified
                        <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="relative z-10 py-24 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[var(--gradient-radial)]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      
      <div className="container mx-auto px-4 relative">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <Badge className="mb-6 px-5 py-2 text-sm bg-primary/10 text-primary border-primary/20 backdrop-blur-sm">
            <Sparkles className="w-4 h-4 mr-2" />
            Premium Test Series
          </Badge>
          <h2 className="text-4xl md:text-6xl font-bold font-display mb-6">
            <span className="gradient-text">Choose Your</span>
            <br />
            <span>Preparation Path</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
            India's most comprehensive test series with AI-powered analytics, 
            detailed solutions, and real exam patterns
          </p>

          {/* Search */}
          <div className="relative max-w-md mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search test series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-full bg-background/50 backdrop-blur-sm border-border/50 focus:border-primary/50"
            />
          </div>
        </motion.div>

        {/* Category Pills */}
        {categoriesWithBatches.length > 2 && (
          <motion.div 
            className="flex flex-wrap justify-center gap-3 mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            {categoriesWithBatches.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              
              return (
                <motion.button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={cn(
                    "relative px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-300",
                    "flex items-center gap-2 border",
                    isActive 
                      ? "bg-gradient-to-r text-primary-foreground border-transparent shadow-lg" 
                      : "bg-background/50 backdrop-blur-sm border-border/50 hover:border-primary/30 text-muted-foreground hover:text-foreground"
                  )}
                  style={isActive ? { 
                    backgroundImage: `linear-gradient(to right, hsl(var(--primary)), hsl(var(--accent)))` 
                  } : undefined}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className="w-4 h-4" />
                  {cat.name}
                  {!isActive && batches?.filter(b => cat.id === "all" || b.category === cat.id).length > 0 && (
                    <span className="ml-1 px-2 py-0.5 text-xs rounded-full bg-muted">
                      {cat.id === "all" ? batches.length : batches.filter(b => b.category === cat.id).length}
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}

        {/* Batch Cards Grid */}
        <AnimatePresence mode="wait">
          <motion.div 
            key={selectedCategory + searchQuery}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {filteredBatches.length > 0 ? (
              filteredBatches.slice(0, 9).map((batch) => {
                const categoryConfig = examCategories.find(c => c.id === batch.category) || examCategories[1];
                const features = (batch.features as string[]) || [];
                const year = getYearFromBatch(batch);
                const discountPercent = batch.original_price 
                  ? Math.round(((batch.original_price - batch.price) / batch.original_price) * 100)
                  : 0;

                return (
                  <motion.div
                    key={batch.id}
                    variants={itemVariants}
                    layout
                    className="group relative"
                  >
                    {/* Glow effect on hover */}
                    <div className={cn(
                      "absolute -inset-0.5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl -z-10",
                      `bg-gradient-to-br ${categoryConfig.gradient}`
                    )} />
                    
                    <div className="relative h-full overflow-hidden rounded-2xl border border-border/50 bg-card/80 backdrop-blur-xl transition-all duration-500 hover:border-primary/30 hover:shadow-xl">
                      {/* Glass overlay */}
                      <div className="absolute inset-0 bg-[var(--gradient-glass)] pointer-events-none" />
                      
                      {/* Featured ribbon */}
                      {batch.is_featured && (
                        <div className="absolute top-4 -right-8 z-20 rotate-45">
                          <div className="px-10 py-1 bg-gradient-to-r from-primary to-accent text-primary-foreground text-xs font-semibold shadow-lg">
                            Featured
                          </div>
                        </div>
                      )}
                      
                      <div className="relative p-6 flex flex-col h-full">
                        {/* Header */}
                        <div className="flex items-start justify-between mb-5">
                          <div className={cn(
                            "w-14 h-14 rounded-xl flex items-center justify-center shadow-lg",
                            `bg-gradient-to-br ${categoryConfig.gradient}`
                          )}>
                            {categoryConfig.logo ? (
                              <img 
                                src={categoryConfig.logo} 
                                alt={batch.name}
                                className="w-9 h-9 object-contain"
                                onError={(e) => {
                                  e.currentTarget.style.display = 'none';
                                }}
                              />
                            ) : (
                              <categoryConfig.icon className="w-7 h-7 text-foreground/70" />
                            )}
                          </div>
                          <div className="flex flex-col items-end gap-1.5">
                            <Badge 
                              variant="outline" 
                              className="bg-background/50 backdrop-blur-sm font-semibold"
                            >
                              {year}
                            </Badge>
                          </div>
                        </div>

                        {/* Title */}
                        <h3 className="text-lg font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2">
                          {batch.name}
                        </h3>

                        {batch.short_description && (
                          <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">
                            {batch.short_description}
                          </p>
                        )}

                        {/* Features */}
                        {features.length > 0 && (
                          <div className="space-y-2 mb-4 flex-grow">
                            {features.slice(0, 3).map((feature, idx) => (
                              <div key={idx} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <CheckCircle className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                                <span className="line-clamp-1">{feature}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Stats */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mb-5">
                          {batch.current_students !== null && batch.current_students > 0 && (
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                              <Users className="w-3.5 h-3.5" />
                              {batch.current_students.toLocaleString()}+ enrolled
                            </span>
                          )}
                          {batch.start_date && (
                            <span className="flex items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-full">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(batch.start_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          )}
                        </div>

                        {/* Price & CTA */}
                        <div className="mt-auto pt-4 border-t border-border/50">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-baseline gap-2">
                              <span className="text-2xl font-bold">₹{batch.price.toLocaleString('en-IN')}</span>
                              {discountPercent > 0 && (
                                <span className="text-sm text-muted-foreground line-through">
                                  ₹{batch.original_price?.toLocaleString('en-IN')}
                                </span>
                              )}
                            </div>
                            {discountPercent > 0 && (
                              <Badge className="bg-primary/10 text-primary border-primary/20">
                                {discountPercent}% OFF
                              </Badge>
                            )}
                          </div>

                          <Link to={`/batches/${batch.id}`} className="block">
                            <Button 
                              className={cn(
                                "w-full group/btn transition-all duration-300",
                                "bg-gradient-to-r from-primary to-accent hover:from-primary/90 hover:to-accent/90"
                              )}
                            >
                              View Details
                              <ArrowRight className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            ) : (
              <motion.div 
                className="col-span-full text-center py-16"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                  <Search className="w-10 h-10 text-muted-foreground/50" />
                </div>
                <h3 className="text-xl font-semibold mb-2">No test series found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* View All Button */}
        {filteredBatches.length > 9 && (
          <motion.div 
            className="text-center mt-12"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/batches">
              <Button 
                variant="outline" 
                size="lg" 
                className="rounded-full px-8 bg-background/50 backdrop-blur-sm hover:bg-primary hover:text-primary-foreground transition-all duration-300"
              >
                View All {batches?.length} Test Series
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </motion.div>
        )}
      </div>
    </section>
  );
}
