import { cn } from "@/lib/utils";

/**
 * The vidnex mark: a play-triangle cut from a flame, in the signature
 * coral -> magenta -> violet gradient. Scales cleanly to favicon size.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("h-8 w-8", className)}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="vidnex-flame" x1="4" y1="6" x2="44" y2="42" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ff6b3d" />
          <stop offset="55%" stopColor="#ff3d77" />
          <stop offset="100%" stopColor="#c026d3" />
        </linearGradient>
      </defs>
      <path
        d="M24 3c6 6.5 11 12.7 11 19.4C35 30.9 30.1 37 24 37c-6.1 0-11-6.1-11-14.6C13 15.7 18 9.5 24 3Z"
        fill="url(#vidnex-flame)"
      />
      <path d="M20 17.5 30 23l-10 5.5v-11Z" fill="#0b0a0e" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2 font-display font-bold text-xl", className)}>
      <LogoMark />
      vidnex
    </span>
  );
}
