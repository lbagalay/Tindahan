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

// A small warm, earthy palette so item swatches read as curated rather than a single flat
// brand-colored badge. Assigned per category (not per item) so items in the same category
// stay visually grouped while scanning a list or grid quickly.
const WARM_SWATCHES = [
  { bg: "#f3decb", fg: "#8a4a1f" },
  { bg: "#eae2c4", fg: "#6b5f24" },
  { bg: "#e2e7d5", fg: "#4c6a3c" },
  { bg: "#f1dbdb", fg: "#8a3f3f" },
  { bg: "#e8d8c3", fg: "#7a5230" },
  { bg: "#dbe4de", fg: "#3f6b5c" },
];
export function warmSwatchFor(category: string) {
  let hash = 0;
  for (let index = 0; index < category.length; index += 1) hash = (hash * 31 + category.charCodeAt(index)) >>> 0;
  return WARM_SWATCHES[hash % WARM_SWATCHES.length];
}

export function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}
