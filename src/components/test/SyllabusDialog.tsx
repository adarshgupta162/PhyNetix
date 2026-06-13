import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface SyllabusDialogProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  testName: string;
  subtitle?: string | null;
  syllabus?: string | null;
}

export default function SyllabusDialog({ open, onOpenChange, testName, subtitle, syllabus }: SyllabusDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{testName}</DialogTitle>
          {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
        </DialogHeader>
        <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap text-sm leading-relaxed">
          {syllabus?.trim() ? syllabus : <span className="text-muted-foreground">No syllabus has been added for this test yet.</span>}
        </div>
      </DialogContent>
    </Dialog>
  );
}
