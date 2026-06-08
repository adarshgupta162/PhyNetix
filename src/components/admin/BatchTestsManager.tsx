import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  Search,
  Plus,
  Trash2,
  GripVertical,
  Calendar,
  Gift,
  FileText,
  Clock,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchTestsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchName: string;
}

interface BatchTest {
  id: string;
  batch_id: string;
  test_id: string;
  unlock_date: string | null;
  is_bonus: boolean | null;
  order_index: number | null;
  tests: {
    id: string;
    name: string;
    duration_minutes: number;
    test_type: string;
    exam_type: string | null;
    is_published: boolean | null;
  };
}

interface Test {
  id: string;
  name: string;
  duration_minutes: number;
  test_type: string;
  exam_type: string | null;
  is_published: boolean | null;
  created_at: string;
}

export function BatchTestsManager({ 
  open, 
  onOpenChange, 
  batchId, 
  batchName 
}: BatchTestsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const queryClient = useQueryClient();

  // Fetch tests linked to this batch
  const { data: batchTests, isLoading: loadingBatchTests } = useQuery({
    queryKey: ['batch-tests', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_tests')
        .select(`
          *,
          tests (id, name, duration_minutes, test_type, exam_type, is_published)
        `)
        .eq('batch_id', batchId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      return data as BatchTest[];
    },
    enabled: open && !!batchId,
  });

  // Fetch all available tests
  const { data: allTests, isLoading: loadingAllTests } = useQuery({
    queryKey: ['all-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('id, name, duration_minutes, test_type, exam_type, is_published, created_at')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as Test[];
    },
    enabled: open,
  });

  // Get IDs of tests already in batch
  const linkedTestIds = new Set(batchTests?.map(bt => bt.test_id) || []);

  // Filter available tests (not already linked)
  const availableTests = allTests?.filter(test => 
    !linkedTestIds.has(test.id) &&
    (searchQuery === "" || test.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  // Add tests to batch mutation
  const addTestsMutation = useMutation({
    mutationFn: async (testIds: string[]) => {
      const currentMaxOrder = batchTests?.reduce((max, bt) => 
        Math.max(max, bt.order_index || 0), 0
      ) || 0;

      const newBatchTests = testIds.map((testId, index) => ({
        batch_id: batchId,
        test_id: testId,
        order_index: currentMaxOrder + index + 1,
        is_bonus: false,
      }));

      const { error } = await supabase
        .from('batch_tests')
        .insert(newBatchTests);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-tests', batchId] });
      setSelectedTests(new Set());
      toast.success("Tests added to batch");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add tests");
    },
  });

  // Remove test from batch mutation
  const removeTestMutation = useMutation({
    mutationFn: async (batchTestId: string) => {
      const { error } = await supabase
        .from('batch_tests')
        .delete()
        .eq('id', batchTestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-tests', batchId] });
      toast.success("Test removed from batch");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to remove test");
    },
  });

  // Toggle bonus status mutation
  const toggleBonusMutation = useMutation({
    mutationFn: async ({ batchTestId, isBonus }: { batchTestId: string; isBonus: boolean }) => {
      const { error } = await supabase
        .from('batch_tests')
        .update({ is_bonus: isBonus })
        .eq('id', batchTestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-tests', batchId] });
    },
  });

  // Update unlock date mutation
  const updateUnlockDateMutation = useMutation({
    mutationFn: async ({ batchTestId, unlockDate }: { batchTestId: string; unlockDate: string | null }) => {
      const { error } = await supabase
        .from('batch_tests')
        .update({ unlock_date: unlockDate })
        .eq('id', batchTestId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch-tests', batchId] });
      toast.success("Unlock date updated");
    },
  });

  const toggleTestSelection = (testId: string) => {
    const newSelected = new Set(selectedTests);
    if (newSelected.has(testId)) {
      newSelected.delete(testId);
    } else {
      newSelected.add(testId);
    }
    setSelectedTests(newSelected);
  };

  const handleAddSelected = () => {
    if (selectedTests.size === 0) return;
    addTestsMutation.mutate(Array.from(selectedTests));
  };

  const toDateTimeLocalValue = (isoString: string | null) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "";
    const pad = (value: number) => String(value).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>Manage Tests - {batchName}</DialogTitle>
          <DialogDescription>
            Link tests to this batch. Students enrolled in this batch will have access to these tests.
          </DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Linked Tests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Linked Tests ({batchTests?.length || 0})
              </h3>
            </div>

            <ScrollArea className="h-[400px] rounded-lg border p-3">
              {loadingBatchTests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : batchTests && batchTests.length > 0 ? (
                <div className="space-y-2">
                  {batchTests.map((bt) => (
                    <div 
                      key={bt.id} 
                      className="group p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <GripVertical className="w-4 h-4 mt-1 text-muted-foreground/50 cursor-grab" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm truncate">
                                {bt.tests?.name || "Unknown Test"}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" className="text-xs">
                                  {bt.tests?.test_type}
                                </Badge>
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {bt.tests?.duration_minutes} min
                                </span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                              onClick={() => removeTestMutation.mutate(bt.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>

                          {/* Controls */}
                          <div className="flex items-center gap-4 mt-3 text-xs">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <Checkbox
                                checked={bt.is_bonus || false}
                                onCheckedChange={(checked) => 
                                  toggleBonusMutation.mutate({ 
                                    batchTestId: bt.id, 
                                    isBonus: !!checked 
                                  })
                                }
                              />
                              <Gift className="w-3 h-3 text-primary" />
                              Bonus
                            </label>
                            <div className="flex items-center gap-2">
                              <Calendar className="w-3 h-3 text-muted-foreground" />
                              <div>
                                <Input
                                  type="datetime-local"
                                  className="h-7 w-44 text-xs"
                                  value={toDateTimeLocalValue(bt.unlock_date)}
                                  onChange={(e) => 
                                    updateUnlockDateMutation.mutate({
                                      batchTestId: bt.id,
                                      unlockDate: e.target.value ? new Date(e.target.value).toISOString() : null
                                    })
                                  }
                                />
                                <p className="mt-1 text-[10px] text-muted-foreground">Local time</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No tests linked yet</p>
                  <p className="text-xs">Add tests from the right panel</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Available Tests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Available Tests</h3>
              {selectedTests.size > 0 && (
                <Button 
                  size="sm" 
                  onClick={handleAddSelected}
                  disabled={addTestsMutation.isPending}
                >
                  {addTestsMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4 mr-2" />
                  )}
                  Add {selectedTests.size} Test{selectedTests.size > 1 ? 's' : ''}
                </Button>
              )}
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search tests..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <ScrollArea className="h-[360px] rounded-lg border p-3">
              {loadingAllTests ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableTests.length > 0 ? (
                <div className="space-y-2">
                  {availableTests.map((test) => (
                    <label
                      key={test.id}
                      className={cn(
                        "flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                        selectedTests.has(test.id) 
                          ? "bg-primary/10 border border-primary/30" 
                          : "bg-secondary/30 hover:bg-secondary/50"
                      )}
                    >
                      <Checkbox
                        checked={selectedTests.has(test.id)}
                        onCheckedChange={() => toggleTestSelection(test.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{test.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge 
                            variant={test.is_published ? "default" : "secondary"} 
                            className="text-xs"
                          >
                            {test.is_published ? "Published" : "Draft"}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {test.test_type}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            {test.duration_minutes} min
                          </span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No tests available</p>
                  <p className="text-xs">All tests are already linked or no matches</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
