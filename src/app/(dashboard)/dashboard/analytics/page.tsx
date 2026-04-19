import { requireOrg } from "@/lib/auth";
import { Card } from "@/components/ui/card";
import { formatDuration, currency } from "@/lib/utils";

export default async function AnalyticsPage() {
  const { supabase, org } = await requireOrg();

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const { data: calls } = await supabase
    .from("calls")
    .select("status, direction, duration_seconds, cost_cents, sentiment, outcome, created_at")
    .eq("org_id", org.id)
    .gte("created_at", since.toISOString());

  const rows = calls ?? [];
  const total = rows.length;
  const totalDuration = rows.reduce((a, c) => a + c.duration_seconds, 0);
  const totalCost = rows.reduce((a, c) => a + c.cost_cents, 0);
  const completed = rows.filter((c) => c.status === "completed").length;
  const answerRate = total ? Math.round((completed / total) * 100) : 0;
  const avgDur = completed ? Math.round(totalDuration / completed) : 0;

  const byDay = groupByDay(rows);
  const bySentiment = {
    positive: rows.filter((c) => c.sentiment === "positive").length,
    neutral: rows.filter((c) => c.sentiment === "neutral").length,
    negative: rows.filter((c) => c.sentiment === "negative").length,
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">Analytics</h1>
        <p className="mt-1 text-sm text-zinc-400">Last 30 days</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <Stat label="Calls" value={`${total}`} />
        <Stat label="Answer rate" value={`${answerRate}%`} />
        <Stat label="Avg duration" value={formatDuration(avgDur)} />
        <Stat label="Spend" value={currency(totalCost)} />
      </div>

      <Card className="mt-6 p-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Calls per day
        </div>
        <div className="mt-4 flex items-end gap-1.5">
          {byDay.map((d) => (
            <div key={d.date} className="flex-1">
              <div
                className="rounded-sm bg-gradient-to-t from-[#3E5CF8] to-[#98C9FF]"
                style={{ height: `${Math.max(4, d.bar)}px` }}
                title={`${d.date} · ${d.count} calls`}
              />
              <div className="mt-1 truncate text-center font-mono text-[9px] text-zinc-600">
                {d.label}
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card className="mt-6 p-6">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
          Sentiment
        </div>
        <div className="mt-4 flex gap-2 overflow-hidden rounded-full">
          <Bar
            label="Positive"
            count={bySentiment.positive}
            total={total}
            className="bg-[#22C55E]"
          />
          <Bar label="Neutral" count={bySentiment.neutral} total={total} className="bg-zinc-600" />
          <Bar
            label="Negative"
            count={bySentiment.negative}
            total={total}
            className="bg-[#F97316]"
          />
        </div>
      </Card>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-medium uppercase tracking-wider text-zinc-500">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-neutral-50">{value}</div>
    </Card>
  );
}

function Bar({
  label,
  count,
  total,
  className,
}: {
  label: string;
  count: number;
  total: number;
  className: string;
}) {
  const pct = total ? Math.round((count / total) * 100) : 0;
  return (
    <div className="flex-1">
      <div className={`h-2 rounded-full ${className}`} style={{ opacity: pct ? 1 : 0.2 }} />
      <div className="mt-1 text-[11px] text-zinc-500">
        {label} · {count} · {pct}%
      </div>
    </div>
  );
}

function groupByDay(
  rows: { created_at: string }[]
): { date: string; label: string; count: number; bar: number }[] {
  const buckets = new Map<string, number>();
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    buckets.set(key, 0);
  }
  for (const r of rows) {
    const key = r.created_at.slice(0, 10);
    if (buckets.has(key)) buckets.set(key, (buckets.get(key) ?? 0) + 1);
  }
  const max = Math.max(1, ...buckets.values());
  return Array.from(buckets.entries()).map(([date, count]) => {
    const d = new Date(date);
    return {
      date,
      label: d.getDate().toString().padStart(2, "0"),
      count,
      bar: (count / max) * 140,
    };
  });
}
