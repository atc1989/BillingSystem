import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DailySalesDialog } from "@/components/daily-sales/DailySalesDialog";
import { SectionPrintPreviewDialog } from "@/components/daily-sales/SectionPrintPreviewDialog";
import { fieldClassName, formatCurrency, formatDateSlash, type InventoryAggregateRow } from "@/components/daily-sales/shared";
import { getPrintableHtmlById } from "@/lib/printElement";
import { normalizeDailySalesPackageType } from "@/lib/dailySalesPackages";
import { listDailySalesEntries } from "@/services/dailySales.service";
import type { DailySalesRecord } from "@/types/dailySales";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function buildInventoryRows(rows: DailySalesRecord[]) {
  const grouped = new Map<string, InventoryAggregateRow>();

  for (const row of rows) {
    const packageType = normalizeDailySalesPackageType(row.packageType) ?? "SILVER";
    const current = grouped.get(packageType) ?? {
      id: packageType,
      name: packageType,
      ggTransNo: "-",
      pofNumber: "-",
      platinum: 0,
      gold: 0,
      silver: 0,
      synbioticBottle: 0,
      synbioticBlister: 0,
      voucher: 0,
      employeeDiscount: 0,
      numberOfBottles: 0,
      numberOfBlisters: 0,
      releasedBottle: 0,
      releasedBlister: 0,
      toFollowBottle: 0,
      toFollowBlister: 0,
      amount: 0,
      modeOfPayment: "N/A",
    };

    if (packageType === "PLATINUM") current.platinum += row.quantity;
    if (packageType === "GOLD") current.gold += row.quantity;
    if (packageType === "SILVER") current.silver += row.quantity;
    if (packageType === "RETAIL") current.synbioticBottle += row.bottles;
    if (packageType === "BLISTER") current.synbioticBlister += row.blisters;

    current.numberOfBottles += row.bottles;
    current.numberOfBlisters += row.blisters;
    current.releasedBottle += row.releasedBottle;
    current.releasedBlister += row.releasedBlister;
    current.toFollowBottle += row.balanceBottle;
    current.toFollowBlister += row.balanceBlister;
    current.amount += row.sales;
    grouped.set(packageType, current);
  }

  return Array.from(grouped.values()).sort((left, right) => left.name.localeCompare(right.name));
}

function matchesSearch(values: Array<string | number>, search: string) {
  return values.join(" ").toLowerCase().includes(search);
}

export function InventoryReportTab({ refreshTick }: { refreshTick: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<DailySalesRecord[]>([]);
  const [pendingFromDate, setPendingFromDate] = useState(today);
  const [pendingToDate, setPendingToDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [reportRows, setReportRows] = useState<InventoryAggregateRow[]>([]);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printPreviewHtml, setPrintPreviewHtml] = useState("");
  const [displayDateRange, setDisplayDateRange] = useState(
    `${formatDateSlash(today)} To ${formatDateSlash(today)}`,
  );

  useEffect(() => {
    let isMounted = true;
    const loadRows = async () => {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const nextRows = await listDailySalesEntries();
        if (isMounted) setRows(nextRows);
      } catch (error) {
        if (isMounted) {
          setRows([]);
          setErrorMessage(error instanceof Error ? error.message : "Failed to load inventory report.");
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    void loadRows();
    return () => {
      isMounted = false;
    };
  }, [refreshTick]);

  const filteredReportRows = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();
    if (!search) return reportRows;

    return reportRows.filter((row) =>
      matchesSearch([row.name, row.numberOfBottles, row.numberOfBlisters, row.amount], search),
    );
  }, [reportRows, searchQuery]);

  const onGenerate = () => {
    if (!pendingFromDate || !pendingToDate) {
      setIsWarningOpen(true);
      return;
    }

    setDisplayDateRange(`${formatDateSlash(pendingFromDate)} To ${formatDateSlash(pendingToDate)}`);
    setReportRows(buildInventoryRows(rows.filter((row) => row.date >= pendingFromDate && row.date <= pendingToDate)));
    setHasGenerated(true);
  };

  const onPrint = () => {
    const html = getPrintableHtmlById("cntnrDailyInventory");
    if (!html) return;
    setPrintPreviewHtml(html);
    setIsPrintPreviewOpen(true);
  };

  return (
    <>
      <section className="mt-4 space-y-4">
        <Card className="gap-0 border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-4">
              <label className="text-xs font-medium text-slate-700">FROM<input type="date" value={pendingFromDate} onChange={(event) => setPendingFromDate(event.target.value)} className={fieldClassName} /></label>
              <label className="text-xs font-medium text-slate-700">TO<input type="date" value={pendingToDate} onChange={(event) => setPendingToDate(event.target.value)} className={fieldClassName} /></label>
              <div className="flex items-end">
                <Button variant="secondary" className="w-full" onClick={onGenerate} disabled={isLoading}>
                  {isLoading ? "Generating..." : "Generate Report"}
                </Button>
              </div>
              <label className="text-xs font-medium text-slate-700">SEARCH<input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search table..." className={fieldClassName} /></label>
            </div>
          </CardContent>
        </Card>

        <Card id="cntnrDailyInventory" className="gap-0 overflow-hidden border-slate-200 shadow-sm">
          <div className="flex items-center justify-between px-4 py-3">
            <span className="text-sm text-slate-700">{displayDateRange}</span>
            <Button size="sm" variant="secondary" onClick={onPrint}>Print</Button>
          </div>
          {errorMessage ? <p className="px-4 pb-2 text-xs text-amber-700">{errorMessage}</p> : null}
          <Table className="min-w-[1600px]">
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead rowSpan={2}>Name</TableHead>
                <TableHead rowSpan={2}>GG TRANS NO.</TableHead>
                <TableHead rowSpan={2}>POF NUMBER</TableHead>
                <TableHead colSpan={3} className="text-center">PACKAGE TYPE</TableHead>
                <TableHead colSpan={4} className="text-center">RETAIL</TableHead>
                <TableHead rowSpan={2}>NUMBER OF BOTTLES</TableHead>
                <TableHead rowSpan={2}>NUMBER OF BLISTERS</TableHead>
                <TableHead rowSpan={2}>RELEASED (BOTTLE)</TableHead>
                <TableHead rowSpan={2}>RELEASED (BLISTER)</TableHead>
                <TableHead rowSpan={2}>TO FOLLOW (BOTTLE)</TableHead>
                <TableHead rowSpan={2}>TO FOLLOW (BLISTER)</TableHead>
                <TableHead rowSpan={2}>AMOUNT</TableHead>
                <TableHead rowSpan={2}>MODE OF PAYMENT</TableHead>
              </TableRow>
              <TableRow>
                <TableHead>PLATINUM</TableHead>
                <TableHead>GOLD</TableHead>
                <TableHead>SILVER</TableHead>
                <TableHead>SYNBIOTIC+ (BOTTLE)</TableHead>
                <TableHead>SYNBIOTIC+ (BLISTER)</TableHead>
                <TableHead>VOUCHER</TableHead>
                <TableHead>EMPLOYEE DISCOUNT</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredReportRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={18} className="py-8 text-center text-slate-500">
                    {hasGenerated ? "No inventory results for selected range" : "No inventory rows found for the selected filters."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredReportRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.name}</TableCell>
                    <TableCell>{row.ggTransNo}</TableCell>
                    <TableCell>{row.pofNumber}</TableCell>
                    <TableCell>{row.platinum}</TableCell>
                    <TableCell>{row.gold}</TableCell>
                    <TableCell>{row.silver}</TableCell>
                    <TableCell>{row.synbioticBottle}</TableCell>
                    <TableCell>{row.synbioticBlister}</TableCell>
                    <TableCell>{row.voucher}</TableCell>
                    <TableCell>{row.employeeDiscount}</TableCell>
                    <TableCell>{row.numberOfBottles}</TableCell>
                    <TableCell>{row.numberOfBlisters}</TableCell>
                    <TableCell>{row.releasedBottle}</TableCell>
                    <TableCell>{row.releasedBlister}</TableCell>
                    <TableCell>{row.toFollowBottle}</TableCell>
                    <TableCell>{row.toFollowBlister}</TableCell>
                    <TableCell>{formatCurrency(row.amount)}</TableCell>
                    <TableCell>{row.modeOfPayment}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      <DailySalesDialog isOpen={isWarningOpen} title="Warning!" onClose={() => setIsWarningOpen(false)}>
        Please input valid date.
      </DailySalesDialog>
      <SectionPrintPreviewDialog isOpen={isPrintPreviewOpen} title="Print Preview" html={printPreviewHtml} onClose={() => setIsPrintPreviewOpen(false)} />
    </>
  );
}

