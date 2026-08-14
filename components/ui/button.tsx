import { forwardRef } from "react";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost" | "token";
type ButtonSize = "sm" | "md" | "lg";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-transform duration-150 ease-out active:scale-[0.97] disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coral";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-flame text-white shadow-[0_8px_24px_-8px_rgba(255,61,119,0.55)] hover:brightness-110",
  secondary: "bg-canvas-overlay text-ink border border-border hover:bg-canvas-raised",
  ghost: "text-ink-muted hover:text-ink hover:bg-canvas-raised",
  token: "bg-token text-[#241900] shadow-[0_8px_24px_-8px_rgba(255,201,74,0.5)] hover:brightness-105",
};

const sizes: Record<ButtonSize, string> = {
  sm: "h-9 px-4 text-sm",
  md: "h-11 px-6 text-base",
  lg: "h-14 px-8 text-lg",
};

function buttonClasses(variant: ButtonVariant, size: ButtonSize, className?: string) {
  return cn(base, variants[variant], sizes[size], className);
}

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** A real `<button>`. For navigation, use `LinkButton` instead. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => (
    <button ref={ref} className={buttonClasses(variant, size, className)} {...props} />
  ),
);
Button.displayName = "Button";

export interface LinkButtonProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/** Button-styled navigation - renders a real `<a>` via next/link, never nested in a `<button>`. */
export const LinkButton = forwardRef<HTMLAnchorElement, LinkButtonProps>(
  ({ className, variant = "primary", size = "md", href, ...props }, ref) => (
    <Link ref={ref} href={href} className={buttonClasses(variant, size, className)} {...props} />
  ),
);
LinkButton.displayName = "LinkButton";
