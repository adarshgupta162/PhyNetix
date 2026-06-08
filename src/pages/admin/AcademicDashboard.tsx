import { Link } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  BookOpen, 
  FileText, 
  Library, 
  ClipboardList,
  Plus,
  ArrowRight,
  TrendingUp
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

export default function AcademicDashboard() {
  // Fetch stats
  const { data: testCount } = useQuery({
    queryKey: ['admin-test-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('tests')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: questionCount } = useQuery({
    queryKey: ['admin-question-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('phynetix_library')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: batchCount } = useQuery({
    queryKey: ['admin-batch-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('batches')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count || 0;
    },
  });

  const { data: recentTests } = useQuery({
    queryKey: ['admin-recent-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5);
      if (error) throw error;
      return data;
    },
  });

  const quickActions = [
    { label: "Create Test", path: "/admin/test-creator", icon: Plus },
    { label: "PDF Tests", path: "/admin/pdf-tests", icon: FileText },
    { label: "Question Bank", path: "/admin/question-bank", icon: BookOpen },
    { label: "PhyNetix Library", path: "/admin/phynetix-library", icon: Library },
  ];

  return (
    <AdminLayout>
      <div className="p-6 md:p-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">Academic Dashboard</h1>
              <p className="text-muted-foreground">
                Manage tests, questions, and content
              </p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Tests</CardTitle>
                <ClipboardList className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{testCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  All test papers
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Question Library</CardTitle>
                <Library className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{questionCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Questions in library
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Batches</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{batchCount || 0}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Course batches
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Content Growth</CardTitle>
                <TrendingUp className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">+12%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  This month
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>Common tasks and shortcuts</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {quickActions.map((action) => (
                  <Link key={action.path} to={action.path}>
                    <Button variant="outline" className="w-full h-auto py-6 flex-col gap-2">
                      <action.icon className="w-6 h-6" />
                      <span>{action.label}</span>
                    </Button>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Tests */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Recent Tests</CardTitle>
                <CardDescription>Latest test papers</CardDescription>
              </div>
              <Link to="/admin/tests">
                <Button variant="ghost" size="sm">
                  View All
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentTests?.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{test.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {test.duration_minutes} mins • {test.test_type}
                        </p>
                      </div>
                    </div>
                    <Badge variant={test.is_published ? "default" : "secondary"}>
                      {test.is_published ? "Published" : "Draft"}
                    </Badge>
                  </div>
                ))}
                {(!recentTests || recentTests.length === 0) && (
                  <p className="text-center text-muted-foreground py-4">
                    No tests created yet
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
