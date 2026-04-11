import { cn } from "@/lib/utils";

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  variant?: "default" | "hoverable" | "active" | "inset";
  padding?: "sm" | "md" | "lg" | "none";
  onClick?: () => void;
}

const paddingMap = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  none: "",
};

const variantMap = {
  default: "",
  hoverable:
    "hover:bg-white/[0.08] hover:border-white/[0.12] hover:shadow-[0_0_40px_rgba(139,92,246,0.15)] cursor-pointer",
  active:
    "bg-white/[0.08] border-violet-500/50 shadow-[0_0_40px_rgba(139,92,246,0.2)]",
  inset: "bg-black/20 border-white/[0.05] rounded-xl shadow-none backdrop-blur-none",
};

export function GlassCard({
  children,
  className,
  variant = "default",
  padding = "md",
  onClick,
}: GlassCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "bg-white/5 border border-white/[0.08] rounded-2xl backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-200",
        paddingMap[padding],
        variantMap[variant],
        className
      )}
    >
      {children}
    </div>
  );
}
