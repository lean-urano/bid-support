import { cn } from "@/lib/utils";

export function AdminPageShell({ children, className }: { children: React.ReactNode; className?: string }) {
  return <main className={cn("mx-auto min-h-[calc(100vh-4rem)] w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8", className)}>{children}</main>;
}

export function AdminPageHeader({ eyebrow, title, description, icon: Icon, action, children }: { eyebrow: string; title: string; description: string; icon?: React.ComponentType<{ className?: string }>; action?: React.ReactNode; children?: React.ReactNode }) {
  return <div className="flex flex-col gap-5 border-b border-slate-200 pb-6 sm:flex-row sm:items-end sm:justify-between">
    <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-600">{eyebrow}</p><h1 className="mt-2 flex items-center gap-2.5 text-2xl font-bold tracking-tight text-slate-900">{Icon && <span className="flex h-8 w-8 shrink-0 items-center justify-center bg-indigo-50 text-indigo-700"><Icon className="h-4 w-4" /></span>}{title}</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p>{children}</div>
    {action && <div className="shrink-0">{action}</div>}
  </div>;
}
