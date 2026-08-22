"use client";

import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { moneyFor } from "@/lib/utils";

const categoryData = [{ name: "Massage", value: 68400 }, { name: "Wellness Retail", value: 28820 }, { name: "Body Care", value: 18460 }, { name: "Therapy", value: 15600 }, { name: "Packages", value: 11100 }];
const paymentData = [{ name: "Cash", value: 42, color: "#176b4d" }, { name: "GCash", value: 34, color: "#4f86c6" }, { name: "Card", value: 19, color: "#d39b3a" }, { name: "Other", value: 5, color: "#9aa5a0" }];

export function CategoryChart({ data = categoryData, currency = "PHP" }: { data?: { name: string; value: number }[]; currency?: string }) { const money = moneyFor(currency); return <div className="h-[275px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={data} layout="vertical" margin={{ left: 4, right: 16 }}><CartesianGrid stroke="#e8ece9" horizontal={false} strokeDasharray="3 3" /><XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#718078" }} tickFormatter={(value) => money.format(Number(value))} /><YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={92} tick={{ fontSize: 10, fill: "#526159" }} /><Tooltip formatter={(value) => [money.format(Number(value)), "Sales"]} contentStyle={{ borderRadius: 8, borderColor: "#dde3df", fontSize: 12 }} /><Bar dataKey="value" fill="#2b8a63" radius={[0, 4, 4, 0]} barSize={18} /></BarChart></ResponsiveContainer></div>; }

export function PaymentChart({ data = paymentData }: { data?: { name: string; value: number; color: string }[] }) { return <div className="h-[275px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius={58} outerRadius={87} paddingAngle={2}>{data.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie><Tooltip formatter={(value) => [`${Number(value).toFixed(1)}%`, "Share"]} contentStyle={{ borderRadius: 8, borderColor: "#dde3df", fontSize: 12 }} /><Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>; }
