import React, { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import Swal from "sweetalert2";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "./ui/table";
import {
  fetchSalesDashboardUsers,
  type SalesDashboardUser
} from "../services/salesDashboard.service";
import {
  fetchUserAccounts,
  saveUserAccount,
  type UserAccountCodePayment,
  type UserAccountRow
} from "../services/userAccount.service";

type UsersGridRow = {
  id: string;
  username: string;
  fullName: string;
  zeroOne: string;
  codePayment: "" | UserAccountCodePayment;
  createdAt: string;
};

type UsersFormState = {
  username: string;
  fullName: string;
  zeroOne: string;
  codePayment: UserAccountCodePayment;
};

const CODE_PAYMENT_OPTIONS: UserAccountCodePayment[] = ["PD", "FS"];

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeLookupKey(value: string): string {
  return value.trim().toLowerCase();
}

function formatDateTime(value: string): string {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("en-PH", {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function buildExportFileName(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");
  return `user_accounts_${yyyy}${mm}${dd}_${hh}${min}${ss}.xlsx`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error && error.message.trim()) {
    if (/user_account/i.test(error.message)) {
      return `${fallback} The user_account table is missing or inaccessible. Apply supabase/user_account.sql first.`;
    }
    return error.message;
  }

  if (error && typeof error === "object") {
    const maybeError = error as { message?: string; details?: string; hint?: string };
    const joined = [maybeError.message, maybeError.details, maybeError.hint]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .join(" ");
    if (joined) {
      if (/user_account/i.test(joined)) {
        return `${fallback} The user_account table is missing or inaccessible. Apply supabase/user_account.sql first.`;
      }
      return joined;
    }
  }

  return fallback;
}

async function exportUserAccountsToExcel(rows: UserAccountRow[]): Promise<void> {
  const [{ saveAs }, XLSX] = await Promise.all([import("file-saver"), import("xlsx")]);

  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((row) => ({
      "Full Name": row.fullName,
      Username: row.username,
      Sponsor: row.sponsor,
      Placement: row.placement,
      Group: row.group,
      "Account Type": row.accountType,
      "Zero One": row.zeroOne,
      "Code Payment": row.codePayment,
      City: row.city,
      Province: row.province,
      Region: row.region,
      Country: row.country,
      "Date Created": row.dateCreated ? formatDateTime(row.dateCreated) : "",
      "Date Updated": row.dateUpdated ? formatDateTime(row.dateUpdated) : ""
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "User Accounts");
  const output = XLSX.write(workbook, {
    bookType: "xlsx",
    type: "array"
  });

  saveAs(
    new Blob([output], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    }),
    buildExportFileName()
  );
}

const initialFormState: UsersFormState = {
  username: "",
  fullName: "",
  zeroOne: "",
  codePayment: "PD"
};

export function SalesDashboardUsersPage() {
  const [directoryUsers, setDirectoryUsers] = useState<SalesDashboardUser[]>([]);
  const [userAccounts, setUserAccounts] = useState<UserAccountRow[]>([]);
  const [formState, setFormState] = useState<UsersFormState>(initialFormState);
  const [usersSearchQuery, setUsersSearchQuery] = useState("");
  const [accountsSearchQuery, setAccountsSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setErrorMessage(null);

    const [directoryResult, accountResult] = await Promise.allSettled([
      fetchSalesDashboardUsers(),
      fetchUserAccounts()
    ]);

    const errors: string[] = [];

    if (directoryResult.status === "fulfilled") {
      setDirectoryUsers(directoryResult.value);
    } else {
      setDirectoryUsers([]);
      console.error("USERS DIRECTORY FETCH ERROR", directoryResult.reason);
      errors.push(getErrorMessage(directoryResult.reason, "Failed to load users directory."));
    }

    if (accountResult.status === "fulfilled") {
      setUserAccounts(accountResult.value);
    } else {
      setUserAccounts([]);
      console.error("USER ACCOUNT FETCH ERROR", accountResult.reason);
      errors.push(getErrorMessage(accountResult.reason, "Failed to load user accounts."));
    }

    setErrorMessage(errors.length > 0 ? errors.join(" ") : null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const usersRows = useMemo<UsersGridRow[]>(() => {
    const accountByUsername = new Map(
      userAccounts.map((row) => [normalizeLookupKey(row.username), row] as const)
    );

    const mergedRows: UsersGridRow[] = directoryUsers.map((user) => {
      const username = toText(user.username);
      const matchedAccount = accountByUsername.get(normalizeLookupKey(username));

      return {
        id: user.id,
        username,
        fullName: matchedAccount?.fullName || toText(user.member_name),
        zeroOne: matchedAccount?.zeroOne ?? "",
        codePayment: matchedAccount?.codePayment ?? "",
        createdAt: toText(user.created_at)
      };
    });

    const usernamesInDirectory = new Set(mergedRows.map((row) => normalizeLookupKey(row.username)));

    for (const accountRow of userAccounts) {
      const key = normalizeLookupKey(accountRow.username);
      if (usernamesInDirectory.has(key)) continue;

      mergedRows.push({
        id: `account-${accountRow.id}`,
        username: accountRow.username,
        fullName: accountRow.fullName,
        zeroOne: accountRow.zeroOne,
        codePayment: accountRow.codePayment,
        createdAt: accountRow.dateCreated
      });
    }

    return mergedRows.sort((left, right) => left.username.localeCompare(right.username));
  }, [directoryUsers, userAccounts]);

  const zeroOneOptions = useMemo(() => {
    const values = new Set<string>();

    for (const row of userAccounts) {
      if (row.zeroOne) values.add(row.zeroOne);
      if (row.sponsor) values.add(row.sponsor);
      if (row.username) values.add(row.username);
    }

    for (const row of directoryUsers) {
      const username = toText(row.username);
      if (username) values.add(username);
    }

    return [...values].sort((left, right) => left.localeCompare(right));
  }, [directoryUsers, userAccounts]);

  useEffect(() => {
    if (!formState.zeroOne && zeroOneOptions.length > 0) {
      setFormState((current) => ({
        ...current,
        zeroOne: zeroOneOptions[0]
      }));
    }
  }, [formState.zeroOne, zeroOneOptions]);

  const filteredUsersRows = useMemo(() => {
    const query = usersSearchQuery.trim().toLowerCase();
    if (!query) return usersRows;

    return usersRows.filter((row) =>
      [row.username, row.fullName, row.zeroOne, row.codePayment]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [usersRows, usersSearchQuery]);

  const filteredUserAccounts = useMemo(() => {
    const query = accountsSearchQuery.trim().toLowerCase();
    if (!query) return userAccounts;

    return userAccounts.filter((row) =>
      [
        row.fullName,
        row.username,
        row.sponsor,
        row.placement,
        row.group,
        row.accountType,
        row.zeroOne,
        row.codePayment,
        row.city,
        row.province,
        row.region,
        row.country,
        row.dateCreated,
        row.dateUpdated
      ]
        .join(" ")
        .toLowerCase()
        .includes(query)
    );
  }, [accountsSearchQuery, userAccounts]);

  const handleEditRow = (row: UsersGridRow) => {
    const nextZeroOne = row.zeroOne || zeroOneOptions[0] || "";
    setFormState({
      username: row.username,
      fullName: row.fullName,
      zeroOne: nextZeroOne,
      codePayment: row.codePayment || "PD"
    });
  };

  const handleClearForm = () => {
    setFormState({
      ...initialFormState,
      zeroOne: zeroOneOptions[0] || ""
    });
  };

  const handleSave = async () => {
    if (!formState.username || !formState.fullName || !formState.zeroOne || !formState.codePayment) {
      await Swal.fire({
        title: "Missing fields",
        text: "Select a user row first, then complete Zero One and Code Payment.",
        icon: "warning",
        confirmButtonColor: "#2563eb"
      });
      return;
    }

    setIsSaving(true);
    try {
      const savedRow = await saveUserAccount(formState);

      setUserAccounts((current) => {
        const nextRows = [...current];
        const targetIndex = nextRows.findIndex(
          (row) => normalizeLookupKey(row.username) === normalizeLookupKey(savedRow.username)
        );

        if (targetIndex >= 0) {
          nextRows[targetIndex] = {
            ...nextRows[targetIndex],
            ...savedRow
          };
        } else {
          nextRows.unshift(savedRow);
        }

        return nextRows;
      });

      await Swal.fire({
        title: "Saved",
        text: "User account details were saved successfully.",
        icon: "success",
        confirmButtonColor: "#2563eb"
      });
    } catch (error) {
      console.error("USER ACCOUNT SAVE ERROR", error);
      await Swal.fire({
        title: "Save failed",
        text: getErrorMessage(error, "Failed to save the user account."),
        icon: "error",
        confirmButtonColor: "#dc2626"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async () => {
    if (filteredUserAccounts.length === 0) {
      toast.error("There are no user account rows to export.");
      return;
    }

    setIsExporting(true);
    try {
      await exportUserAccountsToExcel(filteredUserAccounts);
      toast.success(`Exported ${filteredUserAccounts.length} user account record(s).`);
    } catch (error) {
      console.error("USER ACCOUNT EXPORT ERROR", error);
      toast.error(getErrorMessage(error, "Failed to export user accounts."));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="gap-3">
          <CardTitle className="text-2xl font-semibold text-gray-900">Users</CardTitle>
          <CardDescription>
            Manage Zero One and Code Payment values for Sales Metrics POF user accounts using the
            existing Billing System Supabase client.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {errorMessage ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {errorMessage}
            </div>
          ) : null}

          <div className="grid gap-4 lg:grid-cols-[2fr_1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="users-full-name">Full Name</Label>
              <Input
                id="users-full-name"
                value={formState.fullName}
                readOnly
                placeholder="Select a user row"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="users-zero-one">Zero One</Label>
              <Select
                value={formState.zeroOne}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    zeroOne: value
                  }))
                }
                disabled={zeroOneOptions.length === 0}
              >
                <SelectTrigger id="users-zero-one">
                  <SelectValue placeholder="Select Zero One" />
                </SelectTrigger>
                <SelectContent>
                  {zeroOneOptions.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="users-code-payment">Code Payment</Label>
              <Select
                value={formState.codePayment}
                onValueChange={(value) =>
                  setFormState((current) => ({
                    ...current,
                    codePayment: value as UserAccountCodePayment
                  }))
                }
              >
                <SelectTrigger id="users-code-payment">
                  <SelectValue placeholder="Select code payment" />
                </SelectTrigger>
                <SelectContent>
                  {CODE_PAYMENT_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="button" onClick={handleSave} disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Entry"}
              </Button>
              <Button type="button" variant="outline" onClick={handleClearForm} disabled={isSaving}>
                Clear Form
              </Button>
            </div>
          </div>

          <div className="rounded-md border bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
            <span className="font-medium text-gray-900">Selected Username:</span>{" "}
            {formState.username || "No user selected"}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900">Users Table</CardTitle>
            <CardDescription>
              Existing Billing System users merged with any saved user-account settings.
            </CardDescription>
          </div>
          <div className="w-full max-w-sm space-y-2">
            <Label htmlFor="users-table-search">Search users</Label>
            <Input
              id="users-table-search"
              value={usersSearchQuery}
              onChange={(event) => setUsersSearchQuery(event.target.value)}
              placeholder="Search username, full name, zero one..."
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Username</TableHead>
                <TableHead>Full Name</TableHead>
                <TableHead>Zero One</TableHead>
                <TableHead>Code Payment</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    Loading users...
                  </TableCell>
                </TableRow>
              ) : filteredUsersRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    {usersRows.length === 0
                      ? "No users are available yet."
                      : "No users matched your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsersRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.username || "-"}</TableCell>
                    <TableCell>{row.fullName || "-"}</TableCell>
                    <TableCell>{row.zeroOne || "-"}</TableCell>
                    <TableCell>{row.codePayment || "-"}</TableCell>
                    <TableCell>{row.createdAt ? formatDateTime(row.createdAt) : "-"}</TableCell>
                    <TableCell className="text-right">
                      <Button type="button" variant="outline" size="sm" onClick={() => handleEditRow(row)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-gray-900">User Accounts Table</CardTitle>
            <CardDescription>
              Direct `user_account` rows adapted from the transferred Next.js module into frontend
              Supabase service calls.
            </CardDescription>
          </div>
          <div className="flex w-full max-w-xl flex-col gap-3 md:flex-row md:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="user-accounts-search">Search user accounts</Label>
              <Input
                id="user-accounts-search"
                value={accountsSearchQuery}
                onChange={(event) => setAccountsSearchQuery(event.target.value)}
                placeholder="Search full name, username, sponsor, zero one..."
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={() => void loadData()} disabled={isLoading}>
                Refresh
              </Button>
              <Button type="button" onClick={() => void handleExport()} disabled={isExporting}>
                {isExporting ? "Exporting..." : "Excel"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead>Placement</TableHead>
                <TableHead>Group</TableHead>
                <TableHead>Account Type</TableHead>
                <TableHead>Zero One</TableHead>
                <TableHead>Code Payment</TableHead>
                <TableHead>City</TableHead>
                <TableHead>Province</TableHead>
                <TableHead>Region</TableHead>
                <TableHead>Country</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Date Updated</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={14} className="py-8 text-center text-muted-foreground">
                    Loading user accounts...
                  </TableCell>
                </TableRow>
              ) : filteredUserAccounts.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={14} className="py-8 text-center text-muted-foreground">
                    {userAccounts.length === 0
                      ? "No user account rows found. Apply supabase/user_account.sql if this table does not exist yet."
                      : "No user account rows matched your search."}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUserAccounts.map((row) => (
                  <TableRow key={row.id || row.username}>
                    <TableCell>{row.fullName || "-"}</TableCell>
                    <TableCell>{row.username || "-"}</TableCell>
                    <TableCell>{row.sponsor || "-"}</TableCell>
                    <TableCell>{row.placement || "-"}</TableCell>
                    <TableCell>{row.group || "-"}</TableCell>
                    <TableCell>{row.accountType || "-"}</TableCell>
                    <TableCell>{row.zeroOne || "-"}</TableCell>
                    <TableCell>{row.codePayment || "-"}</TableCell>
                    <TableCell>{row.city || "-"}</TableCell>
                    <TableCell>{row.province || "-"}</TableCell>
                    <TableCell>{row.region || "-"}</TableCell>
                    <TableCell>{row.country || "-"}</TableCell>
                    <TableCell>{row.dateCreated ? formatDateTime(row.dateCreated) : "-"}</TableCell>
                    <TableCell>{row.dateUpdated ? formatDateTime(row.dateUpdated) : "-"}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
