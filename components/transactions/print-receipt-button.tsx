"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintReceiptButton() {
  return <Button variant="secondary" onClick={() => window.print()}><Printer size={16} /> Print receipt</Button>;
}
