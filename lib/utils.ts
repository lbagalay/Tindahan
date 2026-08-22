import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function moneyFor(currency = "PHP") {
  return new Intl.NumberFormat(currency === "PHP" ? "en-PH" : "en-US", { style: "currency", currency, minimumFractionDigits: 2 });
}

export function currencySymbol(currency = "PHP") {
  return moneyFor(currency).formatToParts(0).find((part) => part.type === "currency")?.value ?? currency;
}

export const money = moneyFor();

export const wholeNumber = new Intl.NumberFormat("en-PH");

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
