import { useEffect } from "react";
import { useDraftStore } from "@/store/draft-store";
import { X } from "lucide-react";

export function ErrorToast() {
  const error = useDraftStore((s) => s.error);
  const setError = useDraftStore((s) => s.setError);

  useEffect(() => {
    if (!error) return;
    const timer = setTimeout(() => setError(null), 5000);
    return () => clearTimeout(timer);
  }, [error, setError]);

  if (!error) return null;

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2 animate-in fade-in slide-in-from-bottom-4">
      <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2 text-sm text-destructive shadow-lg">
        <span>{error}</span>
        <button aria-label="Dismiss error" onClick={() => setError(null)} className="ml-1 hover:opacity-70">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
