import { Flame } from "lucide-react";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: "h-6 w-6", text: "text-sm" },
    md: { icon: "h-8 w-8", text: "text-lg" },
    lg: { icon: "h-14 w-14", text: "text-2xl" },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2">
      <Flame className={`${s.icon} text-primary drop-shadow-[0_0_8px_oklch(0.68_0.19_45_/_0.6)]`} fill="currentColor" />
      <span className={`${s.text} font-bold tracking-tight text-foreground`}>
        Tríade <span className="text-flame">da Ação</span>
      </span>
    </div>
  );
}
