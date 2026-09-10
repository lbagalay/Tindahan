"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarDays, Download, Search, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { moneyFor } from "@/lib/utils";

export type TransactionListItem = {
  id: string;
  receipt: string;
  customer: string;
  initials: string;
  staffId: string;
  staff: string;
  items: number;
  method: string;
  total: number;
  createdAt: number;
  date: string;
  time: string;
  status: string;
};

type DateRange = "today" | "7" | "30" | "all";

function csvCell(value: string | number) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function startOfToday() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
}

export function TransactionList({ transactions, currency = "PHP" }: { transactions: TransactionListItem[]; currency?: string }) {
  const money = moneyFor(currency);
  const [query, setQuery] = useState("");
  const [dateRange, setDateRange] = useState<DateRange>("30");
  const [method, setMethod] = useState("all");
  const [staffId, setStaffId] = useState("all");

  const staff = useMemo(
    () => Array.from(new Map(transactions.map((transaction) => [transaction.staffId, transaction.staff])).entries()),
    [transactions],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const today = startOfToday();
    const rangeStart = dateRange === "7" ? today - 6 * 86_400_000 : dateRange === "30" ? today - 29 * 86_400_000 : today;

    return transactions.filter((transaction) => {
      const matchesQuery = !normalizedQuery || [transaction.receipt, transaction.customer, transaction.staff]
        .some((value) => value.toLowerCase().includes(normalizedQuery));
      const matchesMethod = method === "all" || transaction.method === method;
      const matchesStaff = staffId === "all" || transaction.staffId === staffId;
      const matchesDate = dateRange === "all" || transaction.createdAt >= rangeStart;
      return matchesQuery && matchesMethod && matchesStaff && matchesDate;
    });
  }, [dateRange, method, query, staffId, transactions]);

  const hasFilters = query.length > 0 || dateRange !== "30" || method !== "all" || staffId !== "all";
  const filteredTotal = filtered.reduce((sum, transaction) => sum + transaction.total, 0);

  function clearFilters() {
    setQuery("");
    setDateRange("30");
    setMethod("all");
    setStaffId("all");
  }

  function exportCsv() {
    const headings = ["Receipt", "Date", "Time", "Customer", "Staff", "Items", "Payment method", "Status", "Total"];
    const rows = filtered.map((transaction) => [
      transaction.receipt,
      transaction.date,
      transaction.time,
      transaction.customer,
      transaction.staff,
      transaction.items,
      transaction.method,
      transaction.status,
      transaction.total.toFixed(2),
    ]);
    const csv = [headings, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <>
      <div className="mt-6 flex flex-col gap-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4 xl:flex-row xl:items-center">
        <div className="relative min-w-0 flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search receipt, customer, or staff…"
            aria-label="Search transactions"
            className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] pl-10 pr-3 text-xs outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--brand-soft)]"
          />
        </div>
        <label className="relative">
          <CalendarDays size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" />
          <select value={dateRange} onChange={(event) => setDateRange(event.target.value as DateRange)} aria-label="Date range" className="h-10 w-full appearance-none rounded-lg border border-[var(--border)] bg-[var(--surface)] pl-9 pr-8 text-xs font-semibold text-[var(--ink-soft)] xl:w-auto">
            <option value="today">Today</option>
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="all">All dates</option>
          </select>
        </label>
        <select value={method} onChange={(event) => setMethod(event.target.value)} aria-label="Payment method" className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink-soft)]">
          <option value="all">All payment methods</option>
          <option value="Cash">Cash</option>
          <option value="GCash">GCash</option>
          <option value="Card">Card</option>
          <option value="Other">Other</option>
        </select>
        <select value={staffId} onChange={(event) => setStaffId(event.target.value)} aria-label="Staff member" className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink-soft)]">
          <option value="all">All staff</option>
          {staff.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
        </select>
        {hasFilters ? <button onClick={clearFilters} className="flex h-10 items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-semibold text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"><X size={14} /> Clear</button> : null}
        <Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}><Download size={16} /> Export CSV</Button>
      </div>

      <div className="mt-4 overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left">
            <thead><tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-[10px] uppercase tracking-wider text-[var(--muted)]"><th className="px-5 py-3 font-bold">Receipt</th><th className="px-4 py-3 font-bold">Date & time</th><th className="px-4 py-3 font-bold">Customer</th><th className="px-4 py-3 font-bold">Staff</th><th className="px-4 py-3 text-right font-bold">Items</th><th className="px-4 py-3 font-bold">Payment</th><th className="px-4 py-3 font-bold">Status</th><th className="px-5 py-3 text-right font-bold">Total</th></tr></thead>
            <tbody className="divide-y divide-dashed divide-[var(--border)]">
              {filtered.map((transaction) => <tr key={transaction.id} className="hover:bg-[var(--surface-subtle)]/60"><td className="px-5 py-4"><Link href={`/transactions/${transaction.id}`} className="text-xs font-bold text-[var(--brand)] hover:underline">{transaction.receipt}</Link></td><td className="px-4 py-4"><p className="text-xs font-medium text-[var(--ink-soft)]">{transaction.date}</p><p className="mt-0.5 text-[10px] text-[var(--muted)]">{transaction.time}</p></td><td className="px-4 py-4"><div className="flex items-center gap-2"><span className="grid size-7 place-items-center rounded-full bg-[var(--surface-subtle)] text-[9px] font-bold text-[var(--ink-soft)]">{transaction.initials}</span><span className="text-xs text-[var(--ink-soft)]">{transaction.customer}</span></div></td><td className="px-4 py-4 text-xs text-[var(--ink-soft)]">{transaction.staff}</td><td className="px-4 py-4 text-right text-xs font-semibold text-[var(--ink-soft)]">{transaction.items}</td><td className="px-4 py-4"><Badge>{transaction.method}</Badge></td><td className="px-4 py-4"><Badge tone="success">{transaction.status}</Badge></td><td className="px-5 py-4 text-right text-xs font-bold text-[var(--foreground)]">{money.format(transaction.total)}</td></tr>)}
            </tbody>
          </table>
        </div>
        {!filtered.length ? <div className="border-t border-[var(--border)] px-5 py-12 text-center"><p className="text-sm font-bold text-[var(--ink-soft)]">No matching transactions</p><p className="mt-1 text-xs text-[var(--muted)]">Try a different search or clear the filters.</p>{hasFilters ? <Button variant="secondary" className="mt-4" onClick={clearFilters}>Clear filters</Button> : null}</div> : null}
        <div className="flex flex-col gap-1 border-t border-[var(--border)] px-5 py-3 text-[11px] text-[var(--muted)] sm:flex-row sm:justify-between"><span>{filtered.length} of {transactions.length} transactions shown</span><span className="font-semibold text-[var(--ink-soft)]">Filtered total: {money.format(filteredTotal)}</span></div>
      </div>
    </>
  );
}
