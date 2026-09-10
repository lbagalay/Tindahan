"use client";

import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { salesSeries } from "@/lib/demo-data";
import { moneyFor } from "@/lib/utils";

export function SalesChart({ data = salesSeries, currency = "PHP" }: { data?: { day: string; sales: number }[]; currency?: string }) {
  const money = moneyFor(currency);
  return (
    <div className="h-[260px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 8, left: -12, bottom: 0 }}>
          <defs>
            <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2b8a63" stopOpacity={0.25} />
              <stop offset="100%" stopColor="#2b8a63" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#ece0c4" strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#8c7b58", fontSize: 11 }} dy={10} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: "#8c7b58", fontSize: 11 }} tickFormatter={(value) => money.format(Number(value))} width={72} />
          <Tooltip formatter={(value) => [money.format(Number(value)), "Sales"]} contentStyle={{ borderRadius: 8, borderColor: "#e6d9bf", background: "#fffbf2", fontSize: 12 }} />
          <Area type="monotone" dataKey="sales" stroke="var(--brand)" strokeWidth={2.5} fill="url(#salesFill)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
