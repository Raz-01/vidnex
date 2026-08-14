"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createUpload } from "@mux/upchunk";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type UploadState =
  | { phase: "idle" }
  | { phase: "starting" }
  | { phase: "uploading"; percent: number }
  | { phase: "done" }
  | { phase: "error"; message: string };

export function UploadVideoForm() {
  const [state, setState] = useState<UploadState>({ phase: "idle" });
  const [title, setTitle] = useState("");
  const [isExclusive, setIsExclusive] = useState(false);
  const [price, setPrice] = useState("20");
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  async function handleFile(file: File) {
    setState({ phase: "starting" });
    try {
      const res = await fetch("/api/videos/upload-url", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title || undefined,
          isExclusive,
          accessPriceTokens: isExclusive ? Number(price) || undefined : undefined,
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Couldn't start the upload.");
      }
      const { uploadUrl } = await res.json();

      const upload = createUpload({ endpoint: uploadUrl, file });

      upload.on("progress", (event) => {
        setState({ phase: "uploading", percent: Math.round(event.detail) });
      });
      upload.on("success", () => {
        setState({ phase: "done" });
      });
      upload.on("error", (event) => {
        setState({ phase: "error", message: event.detail?.message ?? "Upload failed." });
      });
    } catch (err) {
      setState({ phase: "error", message: err instanceof Error ? err.message : "Upload failed." });
    }
  }

  return (
    <Card>
      {state.phase === "idle" && (
        <div className="py-2">
          <div className="grid gap-4">
            <div className="grid gap-1.5">
              <label htmlFor="title" className="text-sm font-medium text-ink-muted">
                Title <span className="text-ink-faint">(optional)</span>
              </label>
              <input
                id="title"
                value={title}
                maxLength={200}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's the video about?"
                className="h-11 rounded-xl border border-border bg-canvas px-4 text-sm text-ink placeholder:text-ink-faint outline-none focus-visible:outline-2 focus-visible:outline-coral"
              />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={isExclusive}
                onChange={(e) => setIsExclusive(e.target.checked)}
                className="h-4 w-4 accent-coral"
              />
              Make this a paid unlock (Access)
            </label>

            {isExclusive && (
              <div className="grid gap-1.5">
                <label htmlFor="price" className="text-sm font-medium text-ink-muted">
                  Unlock price (tokens)
                </label>
                <input
                  id="price"
                  type="number"
                  min={1}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="h-11 w-32 rounded-xl border border-border bg-canvas px-4 text-sm text-ink outline-none focus-visible:outline-2 focus-visible:outline-coral"
                />
              </div>
            )}
          </div>

          <div className="text-center py-8">
            <p className="text-ink-muted mb-4">Choose a vertical video to upload.</p>
            <input
              ref={inputRef}
              type="file"
              accept="video/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            <Button type="button" size="lg" onClick={() => inputRef.current?.click()}>
              Choose video
            </Button>
          </div>
        </div>
      )}

      {state.phase === "starting" && (
        <p className="text-center py-8 text-ink-muted">Preparing upload...</p>
      )}

      {state.phase === "uploading" && (
        <div className="py-6">
          <div className="h-2 rounded-full bg-canvas-overlay overflow-hidden">
            <div className="h-full bg-flame transition-all" style={{ width: `${state.percent}%` }} />
          </div>
          <p className="mt-3 text-center text-sm text-ink-muted">Uploading - {state.percent}%</p>
        </div>
      )}

      {state.phase === "done" && (
        <div className="text-center py-8">
          <p className="font-medium">Uploaded! 🎉</p>
          <p className="mt-1 text-sm text-ink-muted">
            Mux is processing it now - it&rsquo;ll show as Live in your studio in a minute or two.
          </p>
          <Button type="button" size="lg" className="mt-6" onClick={() => router.push("/studio")}>
            Back to studio
          </Button>
        </div>
      )}

      {state.phase === "error" && (
        <div className="text-center py-8">
          <p className="text-danger font-medium">{state.message}</p>
          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="mt-6"
            onClick={() => setState({ phase: "idle" })}
          >
            Try again
          </Button>
        </div>
      )}
    </Card>
  );
}
