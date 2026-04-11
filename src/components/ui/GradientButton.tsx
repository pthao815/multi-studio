import { cn } from "@/lib/utils";

interface GradientButtonProps {
  children: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
}

const sizeMap = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-sm",
  lg: "px-8 py-4 text-base",
};

export function GradientButton({
  children,
  className,
  size = "md",
  disabled,
  loading,
  onClick,
  type = "button",
}: GradientButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-500",
        "text-white font-semibold rounded-xl",
        "transition-all duration-200",
        "hover:opacity-90 hover:shadow-[0_0_30px_rgba(139,92,246,0.4)] hover:scale-[1.02]",
        "active:scale-[0.98]",
        (disabled || loading) && "opacity-40 cursor-not-allowed pointer-events-none",
        sizeMap[size],
        className
      )}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}
