import { useState } from "react";
import { Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface RatingDialogProps {
  open: boolean;
  testId: string;
  userId: string;
  batchId?: string | null;
  onClose: () => void;
}

export default function RatingDialog({ open, testId, userId, batchId, onClose }: RatingDialogProps) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [review, setReview] = useState("");
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (rating < 1) return;
    setSaving(true);
    const { error } = await supabase.from("test_reviews").upsert(
      { user_id: userId, test_id: testId, batch_id: batchId ?? null, rating, review: review.trim() || null },
      { onConflict: "user_id,test_id" }
    );
    setSaving(false);
    if (error) {
      toast.error(error.message || "Could not save your review");
      return;
    }
    toast.success("Thanks for your feedback!");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Rate this test</DialogTitle>
          <DialogDescription>Your feedback helps other students.</DialogDescription>
        </DialogHeader>
        <div className="flex justify-center gap-2 py-4">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              onMouseEnter={() => setHover(n)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(n)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className="w-9 h-9"
                fill={(hover || rating) >= n ? "#f5c518" : "transparent"}
                stroke={(hover || rating) >= n ? "#f5c518" : "currentColor"}
              />
            </button>
          ))}
        </div>
        <Textarea
          placeholder="Share what you liked or what could improve (optional)"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          rows={4}
        />
        <DialogFooter className="gap-2">
          <Button variant="ghost" onClick={onClose} disabled={saving}>Skip</Button>
          <Button onClick={submit} disabled={rating < 1 || saving}>
            {saving ? "Saving..." : "Submit review"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
