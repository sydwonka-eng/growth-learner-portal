import { type ReactNode } from "react";

export function PageHeader({
  title,
  highlight,
  subtitle,
  actions,
}: {
  title: string;
  highlight?: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {title} {highlight && <span className="text-flame">{highlight}</span>}
        </h1>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
