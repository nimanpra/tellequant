"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { UploadCloud, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

type Job = { name: string; size: number; status: "uploading" | "ready" | "failed"; message?: string };

export function DocUploader({ kbId }: { kbId: string }) {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);

  const upload = useCallback(
    async (files: File[]) => {
      for (const f of files) {
        const id = jobs.length;
        setJobs((prev) => [...prev, { name: f.name, size: f.size, status: "uploading" }]);
        const fd = new FormData();
        fd.append("file", f);
        const res = await fetch(`/api/knowledge/${kbId}/documents`, { method: "POST", body: fd });
        const json = await res.json().catch(() => ({}));
        setJobs((prev) =>
          prev.map((j, i) =>
            i === id
              ? { ...j, status: res.ok ? "ready" : "failed", message: json.error }
              : j
          )
        );
        if (res.ok) toast.success(`${f.name}: ${json.chunks} chunks`);
        else toast.error(json.error ?? "Upload failed");
      }
      router.refresh();
    },
    [jobs.length, kbId, router]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: upload,
    accept: {
      "application/pdf": [".pdf"],
      "text/plain": [".txt", ".md", ".markdown"],
      "text/html": [".html", ".htm"],
      "text/csv": [".csv"],
      "application/json": [".json"],
    },
    multiple: true,
    maxSize: 25 * 1024 * 1024,
  });

  return (
    <div>
      <div
        {...getRootProps()}
        className={cn(
          "relative grid cursor-pointer place-items-center rounded-2xl border border-dashed px-6 py-14 text-center transition-colors",
          isDragActive
            ? "border-[#3E5CF8]/60 bg-[#3E5CF8]/10"
            : "border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.035]"
        )}
      >
        <input {...getInputProps()} />
        <div className="grid h-12 w-12 place-items-center rounded-xl bg-[#3E5CF8]/10">
          <UploadCloud className="h-6 w-6 text-[#98C9FF]" />
        </div>
        <div className="mt-4 text-sm font-medium text-neutral-50">
          Drop PDFs, Markdown, CSV, HTML, or plain text
        </div>
        <div className="mt-1 text-xs text-zinc-500">
          Up to 25MB per file · parsed, chunked, and embedded to pgvector
        </div>
      </div>
      {jobs.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {jobs.map((j, i) => (
            <li
              key={`${j.name}-${i}`}
              className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 text-sm"
            >
              <FileText className="h-4 w-4 text-zinc-500" />
              <span className="flex-1 truncate text-zinc-200">{j.name}</span>
              <span className="font-mono text-xs text-zinc-500">
                {(j.size / 1024).toFixed(0)} KB
              </span>
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium uppercase",
                  j.status === "uploading" && "bg-white/10 text-zinc-300 animate-pulse",
                  j.status === "ready" && "bg-emerald-500/15 text-emerald-300",
                  j.status === "failed" && "bg-red-500/15 text-red-300"
                )}
              >
                {j.status}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
