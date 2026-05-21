import { useRef, useState } from "react";
import { Upload, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
  label: string;
  accept?: string;
  bucket?: string;
}

export function FileUploadButton({ value, onChange, label, accept = "image/*", bucket = "aulas-capas" }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handle = async (file: File) => {
    setLoading(true);
    const path = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
    } else {
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      onChange(data.publicUrl);
      toast.success("Upload concluído");
    }
    setLoading(false);
  };

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])}
      />
      {value ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 p-2">
          {accept.startsWith("image") && <img src={value} alt="preview" className="h-10 w-16 rounded object-cover" />}
          <span className="flex-1 truncate text-xs text-muted-foreground">{value.split("/").pop()}</span>
          <button type="button" onClick={() => onChange(null)} className="text-muted-foreground hover:text-destructive">
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => ref.current?.click()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {label}
        </Button>
      )}
    </div>
  );
}
