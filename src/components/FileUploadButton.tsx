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
  multiple?: boolean;
}

export function FileUploadButton({ value, onChange, label, accept = "image/*", bucket = "aulas-capas", multiple = false }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const urls = value ? value.split("\n").filter(Boolean) : [];

  const uploadOne = async (file: File) => {
    const path = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}-${file.name.replace(/[^a-zA-Z0-9.-]/g, "_")}`;
    const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
    if (error) {
      toast.error(error.message);
      return null;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  };

  const handle = async (files: FileList) => {
    setLoading(true);
    if (multiple) {
      const uploaded: string[] = [];
      for (const f of Array.from(files)) {
        const u = await uploadOne(f);
        if (u) uploaded.push(u);
      }
      if (uploaded.length) {
        onChange([...urls, ...uploaded].join("\n"));
        toast.success(`${uploaded.length} arquivo(s) enviado(s)`);
      }
    } else {
      const u = await uploadOne(files[0]);
      if (u) {
        onChange(u);
        toast.success("Upload concluído");
      }
    }
    setLoading(false);
    if (ref.current) ref.current.value = "";
  };

  const removeOne = (u: string) => {
    const next = urls.filter((x) => x !== u);
    onChange(next.length ? next.join("\n") : null);
  };

  return (
    <div className="space-y-2">
      <input
        ref={ref}
        type="file"
        accept={accept}
        multiple={multiple}
        className="hidden"
        onChange={(e) => e.target.files?.length && handle(e.target.files)}
      />
      {urls.length > 0 && (
        <div className="space-y-1">
          {urls.map((u) => (
            <div key={u} className="flex items-center gap-2 rounded-md border border-border bg-secondary/40 p-2">
              {accept.startsWith("image") && <img src={u} alt="preview" className="h-10 w-16 rounded object-cover" />}
              <span className="flex-1 truncate text-xs text-muted-foreground">{u.split("/").pop()}</span>
              <button type="button" onClick={() => removeOne(u)} className="text-muted-foreground hover:text-destructive">
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
      {(multiple || urls.length === 0) && (
        <Button type="button" variant="outline" className="w-full" disabled={loading} onClick={() => ref.current?.click()}>
          {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
          {label}
        </Button>
      )}
    </div>
  );
}
