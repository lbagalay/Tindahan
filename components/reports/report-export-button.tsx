"use client";

import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ReportExportRow = { receipt: string; date: string; payment: string; total: number };

function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }

export function ReportExportButton({ rows, period }: { rows: ReportExportRow[]; period: string }) {
  function exportReport() {
    const csv = [["Receipt", "Date", "Payment method", "Total"], ...rows.map((row) => [row.receipt, row.date, row.payment, row.total.toFixed(2)])].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `sales-report-${period}-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }
  return <Button variant="secondary" onClick={exportReport} disabled={!rows.length}><Download size={15} /> Export CSV</Button>;
}
