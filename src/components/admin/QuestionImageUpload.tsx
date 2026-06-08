import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon, Paperclip } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  disabled?: boolean;
  className?: string;
  compact?: boolean;
}

export function QuestionImageUpload({ value, onChange, disabled, className, compact = false }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const uploadFile = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Maximum file size is 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2,8)}-${file.name.replace(/\s+/g,"_")}`;
      
      const { data, error } = await supabase.storage
        .from("question-images")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from("question-images")
        .getPublicUrl(data.path);

      onChange(urlData.publicUrl);
      toast({ title: "Image uploaded" });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await uploadFile(file);
  };

  // Drag and drop handlers - passive detection, no visible drop zone
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled && !uploading) {
      setIsDragging(true);
    }
  }, [disabled, uploading]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (disabled || uploading) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await uploadFile(files[0]);
    }
  }, [disabled, uploading]);

  const handleRemove = () => {
    onChange(null);
  };

  // Compact mode - just a small icon button
  if (compact) {
    return (
      <div 
        className={cn("inline-flex items-center gap-2", className)}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          onChange={handleUpload}
          disabled={disabled || uploading}
          className="hidden"
        />
        
        {value ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-green-600 flex items-center gap-1">
              <Paperclip className="w-3 h-3" />
              Image attached
            </span>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-destructive"
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
            className={cn(
              "h-7 px-2 text-xs",
              isDragging && "ring-2 ring-primary"
            )}
          >
            {uploading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-3 h-3 mr-1" />
                Image
              </>
            )}
          </Button>
        )}
      </div>
    );
  }

  // Standard mode
  return (
    <div 
      className={cn("space-y-2", className)}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={handleUpload}
        disabled={disabled || uploading}
        className="hidden"
      />

      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Question"
            className="max-w-full h-auto max-h-40 rounded-lg border border-border"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6"
            onClick={handleRemove}
            disabled={disabled}
          >
            <X className="w-3 h-3" />
          </Button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
          className={cn(
            "w-full h-12 border-dashed",
            isDragging && "ring-2 ring-primary border-primary"
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <ImageIcon className="w-4 h-4 mr-2" />
              {isDragging ? "Drop image here" : "Add Image"}
            </>
          )}
        </Button>
      )}
    </div>
  );
}