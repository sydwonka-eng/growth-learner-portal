import logoOpr from "@/assets/logo-opr.png";

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const sizes = {
    sm: "h-7",
    md: "h-9 sm:h-10",
    lg: "h-16 sm:h-20",
  };
  return (
    <div className="flex items-center">
      <img
        src={logoOpr}
        alt="Operação Primeira Renda"
        className={`${sizes[size]} w-auto object-contain`}
      />
    </div>
  );
}
