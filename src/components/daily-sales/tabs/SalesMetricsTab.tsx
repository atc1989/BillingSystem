import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AgentCardGrid, AgentDetailsDialog, SummaryCardGrid } from "@/components/daily-sales/MetricsComponents";
import { loadSalesMetricsDataset } from "@/services/dailySales.service";
import type { AgentPerformance, SalesDataset, TimeRange } from "@/types/dailySales";

const emptyDataset: SalesDataset = {
  label: "Sales API Dataset",
  summary: [],
  agents: [],
};

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

function resolveDateRange(range: TimeRange, customStartDate: string, customEndDate: string) {
  const today = new Date();
  const dateTo = toIsoDate(today);

  if (range === "custom" && customStartDate && customEndDate) {
    return { dateFrom: customStartDate, dateTo: customEndDate };
  }

  if (range === "weekly") {
    const start = new Date(today);
    start.setDate(today.getDate() - 6);
    return { dateFrom: toIsoDate(start), dateTo };
  }

  if (range === "monthly") {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { dateFrom: toIsoDate(start), dateTo };
  }

  return { dateFrom: dateTo, dateTo };
}

export function SalesMetricsTab({ refreshTick }: { refreshTick: number }) {
  const [range, setRange] = useState<TimeRange>("daily");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");
  const [appliedCustomStartDate, setAppliedCustomStartDate] = useState("");
  const [appliedCustomEndDate, setAppliedCustomEndDate] = useState("");
  const [selectedAgent, setSelectedAgent] = useState<AgentPerformance | null>(null);
  const [dataset, setDataset] = useState<SalesDataset>(emptyDataset);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const { dateFrom, dateTo } = useMemo(
    () => resolveDateRange(range, appliedCustomStartDate, appliedCustomEndDate),
    [appliedCustomEndDate, appliedCustomStartDate, range],
  );

  useEffect(() => {
    let isMounted = true;

    const loadDataset = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextDataset = await loadSalesMetricsDataset(dateFrom, dateTo);
        if (isMounted) setDataset(nextDataset);
      } catch (error) {
        if (isMounted) {
          setDataset(emptyDataset);
          setErrorMessage(error instanceof Error ? error.message : "Failed to load sales performance.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadDataset();
    return () => {
      isMounted = false;
    };
  }, [dateFrom, dateTo, refreshTick]);

  const rankedAgentStats = useMemo(
    () => [...dataset.agents].sort((left, right) => right.conversionRate - left.conversionRate || right.sales - left.sales),
    [dataset.agents],
  );

  const selectedAgentRank = selectedAgent
    ? rankedAgentStats.findIndex((agent) => agent.id === selectedAgent.id) + 1
    : null;

  return (
    <>
      <section className="mt-4 space-y-4">
        <Card className="gap-0 border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold text-slate-900">Sales Metrics</h2>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" variant={range === "daily" ? "default" : "secondary"} onClick={() => setRange("daily")}>Daily</Button>
                <Button size="sm" variant={range === "weekly" ? "default" : "secondary"} onClick={() => setRange("weekly")}>Weekly</Button>
                <Button size="sm" variant={range === "monthly" ? "default" : "secondary"} onClick={() => setRange("monthly")}>Monthly</Button>
                <Button size="sm" variant={range === "custom" ? "default" : "secondary"} onClick={() => setRange("custom")}>Custom</Button>
                <div className="h-9 overflow-hidden">
                  <div className={`flex h-9 items-center gap-2 transition-all ${range === "custom" ? "opacity-100" : "pointer-events-none opacity-0"}`}>
                    <input type="date" value={customStartDate} onChange={(event) => setCustomStartDate(event.target.value)} className="h-9 rounded border border-slate-300 px-3 text-sm" />
                    <input type="date" value={customEndDate} onChange={(event) => setCustomEndDate(event.target.value)} className="h-9 rounded border border-slate-300 px-3 text-sm" />
                    <Button size="sm" variant="secondary" onClick={() => {
                      setAppliedCustomStartDate(customStartDate);
                      setAppliedCustomEndDate(customEndDate);
                    }}>
                      Apply
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {isLoading ? <p className="text-sm text-slate-500">Loading latest sales performance...</p> : null}
        {errorMessage ? <p className="text-sm text-amber-600">{errorMessage}</p> : null}
        {!isLoading && !errorMessage && dataset.agents.length === 0 ? (
          <p className="text-sm text-slate-500">No metrics for selected range.</p>
        ) : null}

        <SummaryCardGrid stats={dataset.summary} />
        <AgentCardGrid agents={dataset.agents} onAgentSelect={setSelectedAgent} />
      </section>

      <AgentDetailsDialog agent={selectedAgent} rank={selectedAgentRank} onClose={() => setSelectedAgent(null)} />
    </>
  );
}

