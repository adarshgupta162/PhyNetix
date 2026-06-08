import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserEnrollments } from "@/hooks/useEnrollment";
import { BookOpen } from "lucide-react";

interface BatchSelectorProps {
  value: string | undefined;
  onChange: (batchId: string) => void;
  placeholder?: string;
}

export function BatchSelector({ value, onChange, placeholder = "Select a batch" }: BatchSelectorProps) {
  const { data: enrollments, isLoading } = useUserEnrollments();

  if (isLoading) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Loading..." />
        </SelectTrigger>
      </Select>
    );
  }

  if (!enrollments || enrollments.length === 0) {
    return (
      <Select disabled>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="No batches available" />
        </SelectTrigger>
      </Select>
    );
  }

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[200px]">
        <BookOpen className="w-4 h-4 mr-2" />
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All Batches</SelectItem>
        {enrollments.map((enrollment) => (
          <SelectItem key={enrollment.batch_id} value={enrollment.batch_id}>
            {enrollment.batches?.name || 'Unknown Batch'}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
