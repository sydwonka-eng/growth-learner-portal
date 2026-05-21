import logoTriade from "@/assets/logo-triade.jpg";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: { icon: "h-7 w-7", text: "text-sm" },
    md: { icon: "h-9 w-9", text: "text-lg" },
    lg: { icon: "h-16 w-16", text: "text-2xl" },
  };
  const s = sizes[size];
  return (
    <div className="flex items-center gap-2">
      <img
        src={logoTriade}
        alt="Tríade da Ação"
        className={`${s.icon} rounded-md object-contain`}
      />
      <span className={`${s.text} font-bold tracking-tight text-foreground`}>
        Tríade <span className="text-flame">da Ação</span>
      </span>
    </div>
  );
}
