import { createSupabaseServerClient } from "@/lib/supabase/server";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createSupabaseServerClient();

  const { data: contacts } = await supabase
    .from("campaign_contacts")
    .select("*, calls:last_call_id(summary, outcome, sentiment, duration_seconds, recording_url)")
    .eq("campaign_id", id)
    .order("created_at", { ascending: true });

  const rows = (contacts ?? []).map((c) => ({
    phone: c.phone,
    name: c.name ?? "",
    status: c.status,
    attempts: c.attempts,
    outcome: c.outcome ?? "",
    summary:
      (c.calls as { summary: string | null } | null)?.summary?.replace(/\r?\n/g, " ") ?? "",
    sentiment: (c.calls as { sentiment: string | null } | null)?.sentiment ?? "",
    duration_seconds:
      (c.calls as { duration_seconds: number | null } | null)?.duration_seconds ?? 0,
    recording_url: (c.calls as { recording_url: string | null } | null)?.recording_url ?? "",
  }));

  const headers = [
    "phone",
    "name",
    "status",
    "attempts",
    "outcome",
    "summary",
    "sentiment",
    "duration_seconds",
    "recording_url",
  ];
  const csv =
    headers.join(",") +
    "\n" +
    rows
      .map((r) =>
        headers
          .map((h) => {
            const v = String((r as Record<string, unknown>)[h] ?? "");
            return /[,"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
          })
          .join(",")
      )
      .join("\n");

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="campaign-${id}.csv"`,
    },
  });
}
