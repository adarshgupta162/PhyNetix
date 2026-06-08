import { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Users, 
  UserPlus, 
  BookOpen,
  Search,
  Mail,
  Phone,
  MoreHorizontal,
  CheckCircle,
  XCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAllEnrollments } from "@/hooks/useEnrollment";
import { format } from "date-fns";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OperationsDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  
  const { data: enrollments, isLoading: enrollmentsLoading } = useAllEnrollments();

  // Fetch student profiles
  const { data: students } = useQuery({
    queryKey: ['admin-students'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data;
    },
  });

  const stats = {
    totalStudents: students?.length || 0,
    activeEnrollments: enrollments?.filter(e => e.is_active).length || 0,
    pendingEnrollments: enrollments?.filter(e => e.payment_status === 'pending').length || 0,
    completedProfiles: students?.filter(s => s.profile_completed).length || 0,
  };

  const filteredEnrollments = enrollments?.filter(enrollment => {
    const matchesSearch = 
      enrollment.batches?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

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
              <h1 className="text-3xl font-bold mb-2">Operations Dashboard</h1>
              <p className="text-muted-foreground">
                Student management and enrollments
              </p>
            </div>
            <Button>
              <UserPlus className="w-4 h-4 mr-2" />
              Manual Enrollment
            </Button>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Total Students</CardTitle>
                <Users className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalStudents}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Registered users
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Active Enrollments</CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeEnrollments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Currently enrolled
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Pending</CardTitle>
                <UserPlus className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.pendingEnrollments}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Awaiting payment
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">Complete Profiles</CardTitle>
                <CheckCircle className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedProfiles}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Verified students
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="enrollments" className="space-y-4">
            <TabsList>
              <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
              <TabsTrigger value="students">Students</TabsTrigger>
              <TabsTrigger value="support">Support</TabsTrigger>
            </TabsList>

            <TabsContent value="enrollments" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Batch Enrollments</CardTitle>
                      <CardDescription>All student enrollments</CardDescription>
                    </div>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-9 w-[200px]"
                      />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Batch</TableHead>
                        <TableHead>Enrolled</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Payment</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredEnrollments?.map((enrollment: any) => (
                        <TableRow key={enrollment.id}>
                          <TableCell className="font-medium">
                            {enrollment.batches?.name || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {format(new Date(enrollment.enrolled_at), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            {enrollment.is_active ? (
                              <Badge className="bg-primary/20 text-primary">Active</Badge>
                            ) : (
                              <Badge variant="secondary">Inactive</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={enrollment.payment_status === 'completed' ? 'default' : 'outline'}>
                              {enrollment.payment_status || 'N/A'}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">
                            {enrollment.enrollment_type}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem>View Details</DropdownMenuItem>
                                <DropdownMenuItem>Extend Access</DropdownMenuItem>
                                <DropdownMenuItem className="text-destructive">
                                  Cancel Enrollment
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!filteredEnrollments || filteredEnrollments.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                            No enrollments found
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="students">
              <Card>
                <CardHeader>
                  <CardTitle>Student Directory</CardTitle>
                  <CardDescription>All registered students</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Roll Number</TableHead>
                        <TableHead>Phone</TableHead>
                        <TableHead>Target Exam</TableHead>
                        <TableHead>Profile</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students?.slice(0, 10).map((student) => (
                        <TableRow key={student.id}>
                          <TableCell className="font-medium">
                            {student.full_name || 'N/A'}
                          </TableCell>
                          <TableCell className="font-mono">
                            {student.roll_number || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {student.phone || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {student.target_exam || 'N/A'}
                          </TableCell>
                          <TableCell>
                            {student.profile_completed ? (
                              <CheckCircle className="w-4 h-4 text-primary" />
                            ) : (
                              <XCircle className="w-4 h-4 text-muted-foreground" />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="support">
              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Student inquiries and issues</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground text-center py-8">
                    Support ticket system coming soon
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
