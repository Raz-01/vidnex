import Link from "next/link";
import { Container } from "@/components/ui/container";

const TABS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/feed", label: "Feed curation" },
  { href: "/admin/moderation", label: "Moderation" },
  { href: "/admin/creators", label: "Creators" },
  { href: "/admin/metrics", label: "Metrics" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <div className="border-b border-border-subtle bg-canvas-raised/40">
      <Container>
        <nav className="flex gap-1 overflow-x-auto py-3">
          {TABS.map((tab) => (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors " +
                (active === tab.href
                  ? "bg-flame text-white"
                  : "text-ink-muted hover:text-ink hover:bg-canvas-overlay")
              }
            >
              {tab.label}
            </Link>
          ))}
        </nav>
      </Container>
    </div>
  );
}
