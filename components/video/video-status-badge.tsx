import { Badge } from "@/components/ui/badge";
import type { Video } from "@/lib/db/schema";

const CONFIG: Record<Video["status"], { label: string; tone: "neutral" | "brand" | "token" | "success" }> = {
  pending: { label: "Uploading", tone: "neutral" },
  processing: { label: "Processing", tone: "token" },
  ready: { label: "Live", tone: "success" },
  errored: { label: "Failed", tone: "neutral" },
};

export function VideoStatusBadge({ status }: { status: Video["status"] }) {
  const { label, tone } = CONFIG[status];
  return <Badge tone={tone}>{label}</Badge>;
}
