import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { DailySalesDialog } from "@/components/daily-sales/DailySalesDialog";
import { SectionPrintPreviewDialog } from "@/components/daily-sales/SectionPrintPreviewDialog";
import {
  AmountRow,
  cashDenominations,
  defaultCashPieces,
  fieldClassName,
  formatCurrency,
  formatDateDMYY,
  paymentTypeTableIds,
  type PackageRow,
} from "@/components/daily-sales/shared";
import { getPrintableHtmlById } from "@/lib/printElement";
import {
  getDailySalesNetPrice,
  getDailySalesPackagePrice,
  normalizeDailySalesPackageType,
} from "@/lib/dailySalesPackages";
import {
  getCashOnHandTotal,
  listDailySalesEntries,
  loadCashOnHand,
  persistCashOnHandLocally,
} from "@/services/dailySales.service";
import type { CashFieldId, CashOnHandPieces, DailySalesRecord } from "@/types/dailySales";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function buildPackageBreakdown(rows: DailySalesRecord[], memberType: "ALL" | "STOCKIST" | "CENTER"): PackageRow[] {
  const scoped = rows.filter((row) => {
    const normalizedMember = row.memberType.trim().toUpperCase();
    if (memberType === "ALL") return true;
    return normalizedMember === memberType;
  });

  return [
    {
      label: "Platinum",
      qty: scoped.filter((row) => (normalizeDailySalesPackageType(row.packageType) ?? "") === "PLATINUM").reduce((sum, row) => sum + row.quantity, 0),
      price: memberType === "STOCKIST" ? getDailySalesNetPrice("STOCKIST", "PLATINUM") : memberType === "CENTER" ? getDailySalesNetPrice("CENTER", "PLATINUM") : getDailySalesPackagePrice("PLATINUM"),
    },
    {
      label: "Gold",
      qty: scoped.filter((row) => (normalizeDailySalesPackageType(row.packageType) ?? "") === "GOLD").reduce((sum, row) => sum + row.quantity, 0),
      price: memberType === "STOCKIST" ? getDailySalesNetPrice("STOCKIST", "GOLD") : memberType === "CENTER" ? getDailySalesNetPrice("CENTER", "GOLD") : getDailySalesPackagePrice("GOLD"),
    },
    {
      label: "Silver",
      qty: scoped.filter((row) => (normalizeDailySalesPackageType(row.packageType) ?? "") === "SILVER").reduce((sum, row) => sum + row.quantity, 0),
      price: memberType === "STOCKIST" ? getDailySalesNetPrice("STOCKIST", "SILVER") : memberType === "CENTER" ? getDailySalesNetPrice("CENTER", "SILVER") : getDailySalesPackagePrice("SILVER"),
    },
  ];
}

function buildRetailBreakdown(rows: DailySalesRecord[]): PackageRow[] {
  return [
    {
      label: "SynBIOTIC+ (Bottle)",
      qty: rows.filter((row) => (normalizeDailySalesPackageType(row.packageType) ?? "") === "RETAIL").reduce((sum, row) => sum + row.bottles, 0),
      price: 2280,
    },
    {
      label: "SynBIOTIC+ (Blister)",
      qty: rows.filter((row) => (normalizeDailySalesPackageType(row.packageType) ?? "") === "BLISTER").reduce((sum, row) => sum + row.blisters, 0),
      price: 1299,
    },
    {
      label: "Employees Discount",
      qty: 0,
      price: 1200,
    },
  ];
}

function buildPaymentBreakdown(rows: DailySalesRecord[], cashTotal: number): AmountRow[] {
  const sums = new Map<string, number>();

  for (const row of rows) {
    sums.set(row.paymentMode, (sums.get(row.paymentMode) ?? 0) + (row.sales - row.salesTwo));
    if (row.paymentModeTwo !== "N/A" && row.salesTwo > 0) {
      sums.set(row.paymentModeTwo, (sums.get(row.paymentModeTwo) ?? 0) + row.salesTwo);
    }
  }

  return [
    { label: "Cash on hand", amount: cashTotal },
    { label: "E-Wallet", amount: sums.get("EWALLET") ?? 0 },
    { label: "Bank Transfer - Security Bank", amount: sums.get("BANK") ?? 0 },
    { label: "Maya (IGI)", amount: sums.get("MAYA(IGI)") ?? 0 },
    { label: "Maya (ATC)", amount: sums.get("MAYA(ATC)") ?? 0 },
    { label: "SB Collect (IGI)", amount: sums.get("SBCOLLECT(IGI)") ?? 0 },
    { label: "SB Collect (ATC)", amount: sums.get("SBCOLLECT(ATC)") ?? 0 },
    { label: "Accounts Receivable - CSA", amount: sums.get("AR(CSA)") ?? 0 },
    { label: "Accounts Receivable - Leaders Support", amount: sums.get("AR(LEADERSUPPORT)") ?? 0 },
    { label: "Cheque", amount: sums.get("CHEQUE") ?? 0 },
    { label: "E-Points", amount: sums.get("EPOINTS") ?? 0 },
  ];
}

function buildPaymentTypeRows(rows: DailySalesRecord[]) {
  const sums = new Map<string, number>();

  for (const row of rows) {
    sums.set(row.paymentMode, (sums.get(row.paymentMode) ?? 0) + (row.sales - row.salesTwo));
    if (row.paymentModeTwo !== "N/A" && row.salesTwo > 0) {
      sums.set(row.paymentModeTwo, (sums.get(row.paymentModeTwo) ?? 0) + row.salesTwo);
    }
  }

  return paymentTypeTableIds.map((table) => {
    let amount = 0;
    if (table.title === "Ewallet") amount = sums.get("EWALLET") ?? 0;
    if (table.title === "Bank") amount = sums.get("BANK") ?? 0;
    if (table.title === "Maya(IGI)") amount = sums.get("MAYA(IGI)") ?? 0;
    if (table.title === "Maya(ATC)") amount = sums.get("MAYA(ATC)") ?? 0;
    if (table.title === "SbCollect(IGI)") amount = sums.get("SBCOLLECT(IGI)") ?? 0;
    if (table.title === "SbCollect(ATC)") amount = sums.get("SBCOLLECT(ATC)") ?? 0;
    if (table.title === "AR(CSA)") amount = sums.get("AR(CSA)") ?? 0;
    if (table.title === "AR Leader Support") amount = sums.get("AR(LEADERSUPPORT)") ?? 0;
    if (table.title === "Cheque") amount = sums.get("CHEQUE") ?? 0;
    if (table.title === "Epoints") amount = sums.get("EPOINTS") ?? 0;
    return { ...table, rows: [{ label: table.label, amount }] };
  });
}

function PackageTable({
  id,
  title,
  rows,
  totalLabel,
  includeGrandTotal = false,
}: {
  id: string;
  title: string;
  rows: PackageRow[];
  totalLabel: string;
  includeGrandTotal?: boolean;
}) {
  const total = rows.reduce((sum, row) => sum + row.qty * row.price, 0);

  return (
    <Card className="gap-0 overflow-hidden border-slate-200 shadow-sm">
      <Table id={id} className="text-xs">
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead>{title}</TableHead>
            <TableHead>QTY</TableHead>
            <TableHead>PRICE</TableHead>
            <TableHead>AMOUNT TOTAL</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${id}-${row.label}`}>
              <TableCell>{row.label}</TableCell>
              <TableCell>{row.qty}</TableCell>
              <TableCell>{formatCurrency(row.price)}</TableCell>
              <TableCell>{formatCurrency(row.qty * row.price)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={3}>{totalLabel}</TableCell>
            <TableCell>{formatCurrency(total)}</TableCell>
          </TableRow>
          {includeGrandTotal ? (
            <TableRow>
              <TableCell colSpan={3} className="text-center">GRAND TOTAL</TableCell>
              <TableCell>{formatCurrency(total)}</TableCell>
            </TableRow>
          ) : null}
        </TableFooter>
      </Table>
    </Card>
  );
}

function PaymentTable({ id, title, rows }: { id: string; title: string; rows: AmountRow[] }) {
  const total = rows.reduce((sum, row) => sum + row.amount, 0);
  return (
    <Card className="gap-0 overflow-hidden border-slate-200 shadow-sm">
      <Table id={id} className="text-xs">
        <TableHeader className="bg-slate-50">
          <TableRow><TableHead colSpan={2}>{title}</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={`${id}-${row.label}`}>
              <TableCell>{row.label}</TableCell>
              <TableCell>{formatCurrency(row.amount)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="text-center">TOTAL</TableCell>
            <TableCell>{formatCurrency(total)}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}

export function SalesReportTab({ refreshTick }: { refreshTick: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const [allRows, setAllRows] = useState<DailySalesRecord[]>([]);
  const [selectedRows, setSelectedRows] = useState<DailySalesRecord[]>([]);
  const [transDateDailySales, setTransDateDailySales] = useState(today);
  const [selectedDate, setSelectedDate] = useState(today);
  const [cashPieces, setCashPieces] = useState<CashOnHandPieces>(defaultCashPieces);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [hasGenerated, setHasGenerated] = useState(false);
  const [isPrintPreviewOpen, setIsPrintPreviewOpen] = useState(false);
  const [printPreviewHtml, setPrintPreviewHtml] = useState("");

  useEffect(() => {
    let isMounted = true;
    const loadRows = async () => {
      try {
        const nextRows = await listDailySalesEntries();
        if (isMounted) setAllRows(nextRows);
      } catch {
        if (isMounted) setAllRows([]);
      }
    };
    void loadRows();
    return () => {
      isMounted = false;
    };
  }, [refreshTick]);

  const packageRows = useMemo(() => buildPackageBreakdown(selectedRows, "ALL"), [selectedRows]);
  const msPackageRows = useMemo(() => buildPackageBreakdown(selectedRows, "STOCKIST"), [selectedRows]);
  const cdPackageRows = useMemo(() => buildPackageBreakdown(selectedRows, "CENTER"), [selectedRows]);
  const retailRows = useMemo(() => buildRetailBreakdown(selectedRows), [selectedRows]);
  const totalCashOnHand = useMemo(() => getCashOnHandTotal(cashPieces), [cashPieces]);
  const paymentBreakdownRows = useMemo(() => buildPaymentBreakdown(selectedRows, totalCashOnHand), [selectedRows, totalCashOnHand]);
  const paymentTypeRows = useMemo(() => buildPaymentTypeRows(selectedRows), [selectedRows]);
  const newAccounts = useMemo(
    () => ({
      silver: selectedRows.filter((row) => row.newMember && (normalizeDailySalesPackageType(row.packageType) ?? "") === "SILVER").length,
      gold: selectedRows.filter((row) => row.newMember && (normalizeDailySalesPackageType(row.packageType) ?? "") === "GOLD").length,
      platinum: selectedRows.filter((row) => row.newMember && (normalizeDailySalesPackageType(row.packageType) ?? "") === "PLATINUM").length,
    }),
    [selectedRows],
  );

  const onGenerateDailySales = async () => {
    if (!transDateDailySales) {
      setIsWarningOpen(true);
      return;
    }

    setSelectedDate(transDateDailySales);
    setErrorMessage("");
    setIsLoading(true);
    setHasGenerated(true);

    try {
      const rows = allRows.filter((row) => row.date === transDateDailySales);
      const cashResponse = await loadCashOnHand(transDateDailySales);
      setSelectedRows(rows);
      setCashPieces(cashResponse.pieces);
    } catch (error) {
      setSelectedRows([]);
      setCashPieces(defaultCashPieces);
      setErrorMessage(error instanceof Error ? error.message : "Backend error... showing fallback");
    } finally {
      setIsLoading(false);
    }
  };

  const onCashPieceChange = (fieldId: CashFieldId, value: string) => {
    const parsed = Number(value);
    const next = {
      ...cashPieces,
      [fieldId]: Number.isFinite(parsed) ? Math.max(parsed, 0) : 0,
    };
    setCashPieces(next);
    persistCashOnHandLocally(selectedDate, next);
  };

  const onPrint = () => {
    const html = getPrintableHtmlById("cntnrDailySales");
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
              <label className="text-xs font-medium text-slate-700">DATE<input type="date" value={transDateDailySales} onChange={(event) => setTransDateDailySales(event.target.value)} className={fieldClassName} /></label>
              <div className="flex items-end"><Button variant="secondary" className="w-full" onClick={() => void onGenerateDailySales()} disabled={isLoading}>{isLoading ? "Generating..." : "Generate Report"}</Button></div>
              <div className="flex items-end"><Button className="w-full" onClick={onPrint}>Print</Button></div>
              <div className="flex items-end text-sm text-slate-700"><span>{formatDateDMYY(selectedDate)}</span></div>
            </div>
          </CardContent>
        </Card>

        <Card className="gap-0 border-slate-200 shadow-sm">
          <CardContent className="p-4">
            <div id="cntnrDailySales" className="space-y-4">
              <div className="text-center text-sm font-semibold text-slate-900">
                <p>Billing System</p>
                <p>Daily Sales Report</p>
                <p className="font-normal">{formatDateDMYY(selectedDate)}</p>
              </div>
              {errorMessage ? <p className="text-xs text-amber-700">{errorMessage}</p> : null}
              {!isLoading && hasGenerated && selectedRows.length === 0 ? <p className="text-xs text-slate-500">No sales entries for selected date.</p> : null}

              <div className="grid gap-3 xl:grid-cols-[1fr_1fr]">
                <div className="space-y-3">
                  <PackageTable id="tblPackage" title="PACKAGE" rows={packageRows} totalLabel="Total Package Sales" />
                  <PackageTable id="tblMsPackage" title="MOBILE STOCKIST PACKAGE" rows={msPackageRows} totalLabel="Total Mobile Stockist Package Sales" />
                  <PackageTable id="tblCdPackage" title="DEPOT PACKAGE" rows={cdPackageRows} totalLabel="Total Depot Package Sales" />
                  <PackageTable id="tblRetail" title="RETAIL" rows={retailRows} totalLabel="Total Retail Sales" includeGrandTotal />
                </div>
                <div className="space-y-3">
                  <Card className="gap-0 overflow-hidden border-slate-200 shadow-sm">
                    <Table id="tblCashOnHand" className="text-xs">
                      <TableHeader className="bg-slate-50">
                        <TableRow>
                          <TableHead>Cash on Hand</TableHead>
                          <TableHead>Pieces</TableHead>
                          <TableHead>Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {cashDenominations.map((entry) => (
                          <TableRow key={entry.id}>
                            <TableCell>{entry.label}</TableCell>
                            <TableCell><input type="number" min="0" value={cashPieces[entry.id]} onChange={(event) => onCashPieceChange(entry.id, event.target.value)} className="h-8 w-24 rounded border border-slate-300 px-2 text-sm" /></TableCell>
                            <TableCell>{formatCurrency(cashPieces[entry.id] * entry.multiplier)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2} className="text-center">TOTAL CASH ON HAND</TableCell>
                          <TableCell>{formatCurrency(totalCashOnHand)}</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </Card>
                  <PaymentTable id="tblPaymentBreakdown" title="PAYMENT BREAKDOWN" rows={paymentBreakdownRows} />
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <Card className="gap-0 overflow-hidden border-slate-200 shadow-sm">
                  <Table id="tblNewAccounts" className="text-xs">
                    <TableHeader className="bg-slate-50">
                      <TableRow><TableHead colSpan={3}>New Accounts</TableHead></TableRow>
                      <TableRow><TableHead>Silver</TableHead><TableHead>Gold</TableHead><TableHead>Platinum</TableHead></TableRow>
                    </TableHeader>
                    <TableBody><TableRow><TableCell>{newAccounts.silver}</TableCell><TableCell>{newAccounts.gold}</TableCell><TableCell>{newAccounts.platinum}</TableCell></TableRow></TableBody>
                  </Table>
                </Card>
                <Card className="gap-0 overflow-hidden border-slate-200 shadow-sm">
                  <Table id="tblUpgrades" className="text-xs">
                    <TableHeader className="bg-slate-50">
                      <TableRow><TableHead colSpan={3}>Upgrades</TableHead></TableRow>
                      <TableRow><TableHead>Silver</TableHead><TableHead>Gold</TableHead><TableHead>Platinum</TableHead></TableRow>
                    </TableHeader>
                    <TableBody><TableRow><TableCell>0</TableCell><TableCell>0</TableCell><TableCell>0</TableCell></TableRow></TableBody>
                  </Table>
                </Card>
              </div>

              <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {paymentTypeRows.map((table) => <PaymentTable key={table.id} id={table.id} title={table.title} rows={table.rows} />)}
              </div>

              <div className="grid grid-cols-1 gap-3 pt-2 text-center text-xs text-slate-700 md:grid-cols-2">
                <div><p>PREPARED BY:</p><p className="font-semibold">Alaiza Jane Emoylan</p></div>
                <div><p>CHECKED BY:</p><p className="font-semibold">Erica Villaester</p></div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <DailySalesDialog isOpen={isWarningOpen} title="Warning!" onClose={() => setIsWarningOpen(false)}>
        Please input valid date.
      </DailySalesDialog>
      <SectionPrintPreviewDialog isOpen={isPrintPreviewOpen} title="Print Preview" html={printPreviewHtml} onClose={() => setIsPrintPreviewOpen(false)} />
    </>
  );
}

