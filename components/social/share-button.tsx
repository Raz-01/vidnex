"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function ShareButton({ url, title, className }: { url: string; title: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // user cancelled or share failed - fall through to clipboard
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable - nothing more we can do silently
    }
  }

  return (
    <button
      type="button"
      onClick={share}
      className={cn(
        "inline-flex flex-col items-center gap-1 text-sm text-ink-muted hover:text-ink",
        className,
      )}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path
          d="M8 12v7a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-7M12 15V3m0 0 4 4m-4-4L8 7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      {copied ? "Copied!" : "Share"}
    </button>
  );
}
