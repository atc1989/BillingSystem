import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  downloadCsv,
  fieldClassName,
  formatCurrency,
  paymentModes,
  type ReportRangeType,
} from "@/components/daily-sales/shared";
import { listDailySalesEntries } from "@/services/dailySales.service";
import type { DailySalesRecord, PaymentMode } from "@/types/dailySales";

function statusBadgeVariant(status: DailySalesRecord["status"]) {
  if (status === "Released") return "secondary" as const;
  if (status === "To Follow") return "outline" as const;
  return "destructive" as const;
}

function matchesSearch(values: Array<string | number>, search: string) {
  return values.join(" ").toLowerCase().includes(search);
}

export function DashboardTab({ refreshTick }: { refreshTick: number }) {
  const today = new Date().toISOString().slice(0, 10);
  const [rows, setRows] = useState<DailySalesRecord[]>([]);
  const [pendingFromDate, setPendingFromDate] = useState(today);
  const [pendingToDate, setPendingToDate] = useState(today);
  const [pendingPaymentMode, setPendingPaymentMode] = useState<PaymentMode>("ALL");
  const [fromDate, setFromDate] = useState(today);
  const [toDate, setToDate] = useState(today);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
          setErrorMessage(error instanceof Error ? error.message : "Failed to load daily sales.");
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

  const filteredRows = useMemo(() => {
    const search = searchQuery.trim().toLowerCase();

    return rows.filter((row) => {
      if (row.date < fromDate || row.date > toDate) return false;
      if (paymentMode !== "ALL" && row.paymentMode !== paymentMode) return false;
      if (!search) return true;

      return matchesSearch(
        [
          row.pofNumber,
          row.memberName,
          row.ggTransNo,
          row.paymentMode,
          row.packageType,
          row.sales,
        ],
        search,
      );
    });
  }, [fromDate, paymentMode, rows, searchQuery, toDate]);

  const totalSales = filteredRows.reduce((sum, row) => sum + row.sales, 0);
  const totalOrders = filteredRows.length;
  const totalNewMembers = filteredRows.filter((row) => row.newMember).length;
  const totalBottles = filteredRows.reduce((sum, row) => sum + row.bottles, 0);
  const totalBlisters = filteredRows.reduce((sum, row) => sum + row.blisters, 0);

  return (
    <section className="mt-4 space-y-4">
      <Card className="gap-0 border-slate-200 shadow-sm">
        <CardContent className="p-4">
          <div className="grid gap-3 md:grid-cols-5">
            <label className="text-xs font-medium text-slate-700">
              FROM
              <input type="date" value={pendingFromDate} onChange={(event) => setPendingFromDate(event.target.value)} className={fieldClassName} />
            </label>
            <label className="text-xs font-medium text-slate-700">
              TO
              <input type="date" value={pendingToDate} onChange={(event) => setPendingToDate(event.target.value)} className={fieldClassName} />
            </label>
            <label className="text-xs font-medium text-slate-700">
              MODE OF PAYMENT
              <select value={pendingPaymentMode} onChange={(event) => setPendingPaymentMode(event.target.value as PaymentMode)} className={fieldClassName}>
                {paymentModes.map((mode) => (
                  <option key={mode} value={mode}>{mode}</option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => {
                  setFromDate(pendingFromDate);
                  setToDate(pendingToDate);
                  setPaymentMode(pendingPaymentMode);
                }}
              >
                Apply
              </Button>
            </div>
            <label className="text-xs font-medium text-slate-700">
              SEARCH
              <input value={searchQuery} onChange={(event) => setSearchQuery(event.target.value)} placeholder="Search table..." className={fieldClassName} />
            </label>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          { label: "Total Sales", value: formatCurrency(totalSales) },
          { label: "Total Orders", value: totalOrders.toLocaleString() },
          { label: "New Members", value: totalNewMembers.toLocaleString() },
          { label: "Total Bottles Sold", value: totalBottles.toLocaleString() },
          { label: "Total Blister Sold", value: totalBlisters.toLocaleString() },
        ].map((item) => (
          <Card key={item.label} className="gap-0 border-slate-200 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-600">{item.label}</p>
              <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="gap-0 overflow-hidden border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-4 py-3">
          <h2 className="text-sm font-semibold text-slate-900">Recent Sales</h2>
          <Button
            size="sm"
            onClick={() =>
              downloadCsv(
                "daily-sales-dashboard.csv",
                [
                  "POF Number",
                  "Date",
                  "Member Name",
                  "Zero One",
                  "Package",
                  "Bottles",
                  "Blisters",
                  "Sales",
                  "Mode of Payment",
                  "Status",
                ],
                filteredRows.map((row) => [
                  row.pofNumber,
                  row.date,
                  row.memberName,
                  row.zeroOne,
                  row.packageType,
                  row.bottles,
                  row.blisters,
                  row.sales,
                  row.paymentMode,
                  row.status,
                ]),
              )
            }
          >
            Export CSV
          </Button>
        </div>
        {isLoading ? <p className="px-4 pb-2 text-xs text-slate-500">Loading daily sales...</p> : null}
        {errorMessage ? <p className="px-4 pb-2 text-xs text-amber-600">{errorMessage}</p> : null}
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead>POF Number</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Member Name</TableHead>
              <TableHead>Zero One</TableHead>
              <TableHead>Package</TableHead>
              <TableHead>Bottles</TableHead>
              <TableHead>Blisters</TableHead>
              <TableHead>Sales</TableHead>
              <TableHead>Mode of Payment</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredRows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} className="py-8 text-center text-slate-500">
                  No recent sales found for the selected filters.
                </TableCell>
              </TableRow>
            ) : (
              filteredRows.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.pofNumber}</TableCell>
                  <TableCell>{row.date}</TableCell>
                  <TableCell>{row.memberName}</TableCell>
                  <TableCell>{row.zeroOne}</TableCell>
                  <TableCell>{row.packageType}</TableCell>
                  <TableCell>{row.bottles}</TableCell>
                  <TableCell>{row.blisters}</TableCell>
                  <TableCell>{formatCurrency(row.sales)}</TableCell>
                  <TableCell>{row.paymentMode}</TableCell>
                  <TableCell>
                    <Badge variant={statusBadgeVariant(row.status)}>{row.status}</Badge>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </section>
  );
}

