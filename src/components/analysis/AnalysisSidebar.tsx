import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Target,
  Clock,
  BarChart3,
  TrendingUp,
  BookX,
  FileText,
  Users,
  ChevronLeft,
  Menu,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "attempt", label: "Attempt Analysis", icon: Target },
  { id: "time", label: "Time Analysis", icon: Clock },
  { id: "difficulty", label: "Difficulty Analysis", icon: BarChart3 },
  { id: "potential", label: "Score Potential", icon: TrendingUp },
  { id: "mistakes", label: "Mistake Book", icon: BookX },
  { id: "solutions", label: "Solutions", icon: FileText },
  { id: "rank", label: "Rank & Compare", icon: Users },
];

interface AnalysisSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  testName?: string;
  onBack?: () => void;
}

export function AnalysisSidebar({
  activeTab,
  onTabChange,
  testName,
  onBack,
}: AnalysisSidebarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const SidebarContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border/50">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="text-muted-foreground hover:text-foreground mb-2 w-full justify-start"
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          {(mobile || isExpanded) && <span>Back to Tests</span>}
        </Button>
        {(mobile || isExpanded) && testName && (
          <h2 className="text-sm font-medium text-foreground truncate">
            {testName}
          </h2>
        )}
      </div>

      {/* Nav Items */}
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                "text-muted-foreground hover:text-foreground hover:bg-secondary/50",
                isActive && "bg-primary/10 text-primary border-l-2 border-primary"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive && "text-primary")} />
              {(mobile || isExpanded) && (
                <span className="text-sm font-medium">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden fixed top-4 left-4 z-50 bg-card/80 backdrop-blur-xl border border-border"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0 bg-card border-r border-border">
          <SidebarContent mobile />
        </SheetContent>
      </Sheet>

      {/* Desktop Sidebar */}
      <motion.aside
        className="hidden lg:flex flex-col h-screen bg-card border-r border-border fixed left-0 top-0 z-40"
        initial={false}
        animate={{ width: isExpanded ? 240 : 72 }}
        transition={{ duration: 0.2 }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
      >
        <SidebarContent />
      </motion.aside>
    </>
  );
}
