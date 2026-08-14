import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type BadgeTone = "neutral" | "brand" | "token" | "success";

const tones: Record<BadgeTone, string> = {
  neutral: "bg-canvas-overlay text-ink-muted",
  brand: "bg-magenta/15 text-magenta",
  token: "bg-gold/15 text-token",
  success: "bg-success/15 text-success",
};

export function Badge({
  className,
  tone = "neutral",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { tone?: BadgeTone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium uppercase tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
