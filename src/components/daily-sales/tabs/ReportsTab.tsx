import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DailySalesDialog } from "@/components/daily-sales/DailySalesDialog";
import { ModifyGgTransNoDialog } from "@/components/daily-sales/ModifyGgTransNoDialog";
import { PrintPreviewDialog } from "@/components/daily-sales/PrintPreviewDialog";
import {
  calculateRange,
  downloadCsv,
  fieldClassName,
  formatPesoShort,
  type ReportRangeType,
} from "@/components/daily-sales/shared";
import { listDailySalesEntries, removeDailySalesRecord, updateDailySalesGgTransNo } from "@/services/dailySales.service";
import type { DailySalesRecord, PrintLineItem, PrintTransaction } from "@/types/dailySales";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function matchesSearch(values: Array<string | number>, search: string) {
  return values.join(" ").toLowerCase().includes(search);
}

export function ReportsTab({
  refreshTick,
  onChanged,
}: {
  refreshTick: number;
  onChanged: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<DailySalesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<ReportRangeType>("daily");
  const [pendingStartDate, setPendingStartDate] = useState(today);
  const [pendingEndDate, setPendingEndDate] = useState(today);
  const [searchQuery, setSearchQuery] = useState("");
  const [reportType, setReportType] = useState<ReportRangeType>("daily");
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [warningOpen, setWarningOpen] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [selectedModifyRow, setSelectedModifyRow] = useState<DailySalesRecord | null>(null);
  const [isSavingGgTransNo, setIsSavingGgTransNo] = useState(false);
  const [printTransaction, setPrintTransaction] = useState<PrintTransaction | null>(null);
  const [printLineItems, setPrintLineItems] = useState<PrintLineItem[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadRows = async () => {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const nextRows = await listDailySalesEntries();
        if (isMounted) setRows(nextRows);
      } catch (error) {
        if (isMounted) {
          setRows([]);
          setErrorMessage(error instanceof Error ? error.message : "Failed to load sales report.");
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

  const activeRange = useMemo(
    () => calculateRange(reportType, startDate, endDate, today),
    [endDate, reportType, startDate, today],
  );

  const filteredRows = useMemo(() => {
    if (!hasGenerated) return [];

    const search = searchQuery.trim().toLowerCase();
    return rows.filter((row) => {
      if (row.date < activeRange.from || row.date > activeRange.to) return false;
      if (!search) return true;

      return matchesSearch(
        [
          row.date,
          row.pofNumber,
          row.ggTransNo,
          row.memberName,
          row.paymentMode,
          row.sales,
          row.bottles,
          row.blisters,
        ],
        search,
      );
    });
  }, [activeRange.from, activeRange.to, hasGenerated, rows, searchQuery]);

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (acc, row) => ({
          totalSales: acc.totalSales + row.sales,
          totalBottles: acc.totalBottles + row.bottles,
          totalBlisters: acc.totalBlisters + row.blisters,
        }),
        { totalSales: 0, totalBottles: 0, totalBlisters: 0 },
      ),
    [filteredRows],
  );

  const onReportTypeChange = (nextType: ReportRangeType) => {
    setPendingType(nextType);
    if (nextType === "custom") return;

    const nextRange = calculateRange(nextType, today, today, today);
    setPendingStartDate(nextRange.from);
    setPendingEndDate(nextRange.to);
  };

  const onGenerateReport = () => {
    if (!pendingStartDate || !pendingEndDate) {
      setWarningOpen(true);
      return;
    }

    setReportType(pendingType);
    setStartDate(pendingStartDate);
    setEndDate(pendingEndDate);
    setHasGenerated(true);
  };

  const onSaveModifyGgTransNo = async (newValue: string) => {
    if (!selectedModifyRow || !newValue.trim()) return;

    setIsSavingGgTransNo(true);
    try {
      await updateDailySalesGgTransNo(selectedModifyRow.id, newValue.trim());
      setNotice(`GG Transaction Number updated for ${selectedModifyRow.pofNumber}.`);
      setSelectedModifyRow(null);
      onChanged();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to modify GG transaction number.");
    } finally {
      setIsSavingGgTransNo(false);
    }
  };

  const onRemoveRow = async (row: DailySalesRecord) => {
    try {
      await removeDailySalesRecord(row.id);
      setNotice(`Removed ${row.pofNumber}.`);
      onChanged();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Failed to remove the row.");
    }
  };

  const onPrintRow = (row: DailySalesRecord) => {
    setPrintTransaction({
      date: row.date,
      pofNumber: row.pofNumber,
      customer: row.memberName || "N/A",
      ggTransNo: row.ggTransNo,
      modeOfPayment: row.paymentMode,
      encoder: row.zeroOne || row.ggTransNo || "N/A",
    });
    setPrintLineItems([
      {
        id: `line-${row.id}`,
        productPackage: row.packageType || "N/A",
        srp: row.originalPrice,
        discount: row.discount,
        discountedPrice: row.discountedPrice,
        quantity: row.quantity,
        amount: row.sales,
        releasedBottle: row.releasedBottle,
        releasedBlister: row.releasedBlister,
        balanceBottle: row.balanceBottle,
        balanceBlister: row.balanceBlister,
      },
    ]);
  };

  return (
    <>
      <section className="mt-4 space-y-4">
        <Card className="gap-0 border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div className="grid gap-3 md:grid-cols-5">
              <label className="text-xs font-medium text-slate-700">
                Report Type
                <select value={pendingType} onChange={(event) => onReportTypeChange(event.target.value as ReportRangeType)} className={fieldClassName}>
                  <option value="daily">Daily</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="custom">Custom Range</option>
                </select>
              </label>
              <label className="text-xs font-medium text-slate-700">
                Start Date
                <input type="date" value={pendingStartDate} onChange={(event) => setPendingStartDate(event.target.value)} readOnly={pendingType !== "custom"} className={fieldClassName} />
              </label>
              <label className="text-xs font-medium text-slate-700">
                End Date
                <input type="date" value={pendingEndDate} onChange={(event) => setPendingEndDate(event.target.value)} readOnly={pendingType !== "custom"} className={fieldClassName} />
              </label>
              <div className="flex items-end">
                <Button variant="secondary" className="w-full" onClick={onGenerateReport}>Generate Report</Button>
              </div>
              <label className="text-xs font-medium text-slate-700">
                Search
                <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search table..." className={fieldClassName} />
              </label>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 overflow-hidden border-slate-200 shadow-sm">
          <div className="flex items-center justify-end px-4 py-3">
            <Button
              size="sm"
              onClick={() =>
                downloadCsv(
                  "daily-sales-reports.csv",
                  ["Date", "POF Number", "GG Trans No.", "Total Sales", "Mode of Payment", "Total Bottles", "Total Blisters"],
                  filteredRows.map((row) => [
                    row.date,
                    row.pofNumber,
                    row.ggTransNo,
                    row.sales,
                    row.paymentMode,
                    row.bottles,
                    row.blisters,
                  ]),
                )
              }
            >
              Export CSV
            </Button>
          </div>
          {isLoading ? <p className="px-4 pb-2 text-xs text-slate-500">Loading sales report...</p> : null}
          {errorMessage ? <p className="px-4 pb-2 text-xs text-amber-600">{errorMessage}</p> : null}
          {!isLoading && !errorMessage && hasGenerated && filteredRows.length === 0 ? (
            <p className="px-4 pb-2 text-xs text-slate-500">No report rows found for the selected filters.</p>
          ) : null}
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>POF Number</TableHead>
                <TableHead>GG Trans No.</TableHead>
                <TableHead>Total Sales</TableHead>
                <TableHead>Mode of Payment</TableHead>
                <TableHead>Total Bottles</TableHead>
                <TableHead>Total Blisters</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="py-8 text-center text-slate-500">
                    No report rows found for the selected filters.
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.pofNumber}</TableCell>
                    <TableCell>{row.ggTransNo}</TableCell>
                    <TableCell>{formatPesoShort(row.sales)}</TableCell>
                    <TableCell>{row.paymentMode}</TableCell>
                    <TableCell>{row.bottles}</TableCell>
                    <TableCell>{row.blisters}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setSelectedModifyRow(row)}>Trans No.</Button>
                        <Button size="sm" variant="secondary" onClick={() => onPrintRow(row)}>Print</Button>
                        <Button size="sm" variant="destructive" onClick={() => void onRemoveRow(row)}>Remove</Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={3}>Total:</TableCell>
                <TableCell>{formatPesoShort(totals.totalSales)}</TableCell>
                <TableCell />
                <TableCell>{totals.totalBottles}</TableCell>
                <TableCell>{totals.totalBlisters}</TableCell>
                <TableCell />
              </TableRow>
            </TableFooter>
          </Table>
        </Card>
      </section>

      <DailySalesDialog isOpen={warningOpen} title="Warning!" onClose={() => setWarningOpen(false)}>
        Please input valid date.
      </DailySalesDialog>
      <DailySalesDialog isOpen={Boolean(notice)} title="Info" onClose={() => setNotice(null)}>
        {notice ?? ""}
      </DailySalesDialog>
      <ModifyGgTransNoDialog
        isOpen={Boolean(selectedModifyRow)}
        row={selectedModifyRow ? { id: selectedModifyRow.id, pofNumber: selectedModifyRow.pofNumber, ggTransNo: selectedModifyRow.ggTransNo } : null}
        onSave={onSaveModifyGgTransNo}
        onClose={() => setSelectedModifyRow(null)}
        isSaving={isSavingGgTransNo}
      />
      <PrintPreviewDialog isOpen={Boolean(printTransaction)} transaction={printTransaction} lineItems={printLineItems} onClose={() => setPrintTransaction(null)} />
    </>
  );
}

