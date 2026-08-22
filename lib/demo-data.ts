export type DemoProduct = {
  id: string;
  name: string;
  sku: string;
  category: string;
  type: "PRODUCT" | "SERVICE";
  cost: number;
  price: number;
  stock: number;
  threshold: number;
  status: "ACTIVE" | "INACTIVE";
  image?: string;
  customValues?: Record<string, string>;
  accent: string;
  short: string;
};

export type DemoCustomer = { id: string; name: string; phone: string; email: string; notes: string; customValues?: Record<string, string>; transactions: number; total: number; last: string; initials: string };
export type DemoMovement = { id: string; product: string; sku: string; type: string; change: number; before: number; after: number; by: string; time: string; reason?: string };
export type DemoTransaction = { id: string; receipt: string; customer: string; initials: string; staff: string; items: number; method: string; total: number; time: string; date: string; status: string };

export const demoProducts: DemoProduct[] = [
  { id: "p1", name: "Hilot Massage — 60 min", sku: "SVC-HILOT60", category: "Massage", type: "SERVICE", cost: 280, price: 850, stock: 0, threshold: 0, status: "ACTIVE", accent: "bg-amber-100 text-amber-800", short: "HM" },
  { id: "p2", name: "Swedish Massage — 60 min", sku: "SVC-SWD60", category: "Massage", type: "SERVICE", cost: 250, price: 750, stock: 0, threshold: 0, status: "ACTIVE", accent: "bg-orange-100 text-orange-800", short: "SM" },
  { id: "p3", name: "Ventosa Therapy", sku: "SVC-VNT45", category: "Therapy", type: "SERVICE", cost: 220, price: 650, stock: 0, threshold: 0, status: "ACTIVE", accent: "bg-rose-100 text-rose-800", short: "VT" },
  { id: "p4", name: "Foot Spa & Scrub", sku: "SVC-FTSP", category: "Body Care", type: "SERVICE", cost: 160, price: 480, stock: 0, threshold: 0, status: "ACTIVE", accent: "bg-sky-100 text-sky-800", short: "FS" },
  { id: "p5", name: "Calamansi Body Oil", sku: "RTL-CBO100", category: "Wellness Retail", type: "PRODUCT", cost: 145, price: 320, stock: 18, threshold: 6, status: "ACTIVE", accent: "bg-lime-100 text-lime-800", short: "CO" },
  { id: "p6", name: "Lavender Massage Balm", sku: "RTL-LMB50", category: "Wellness Retail", type: "PRODUCT", cost: 110, price: 260, stock: 4, threshold: 5, status: "ACTIVE", accent: "bg-violet-100 text-violet-800", short: "LB" },
  { id: "p7", name: "Eucalyptus Room Mist", sku: "RTL-ERM100", category: "Aromatherapy", type: "PRODUCT", cost: 125, price: 290, stock: 11, threshold: 5, status: "ACTIVE", accent: "bg-teal-100 text-teal-800", short: "EM" },
  { id: "p8", name: "Lemongrass Soy Candle", sku: "RTL-LSC180", category: "Aromatherapy", type: "PRODUCT", cost: 190, price: 420, stock: 3, threshold: 5, status: "ACTIVE", accent: "bg-yellow-100 text-yellow-800", short: "LC" },
  { id: "p9", name: "Herbal Bath Salts", sku: "RTL-HBS250", category: "Body Care", type: "PRODUCT", cost: 95, price: 230, stock: 22, threshold: 8, status: "ACTIVE", accent: "bg-cyan-100 text-cyan-800", short: "BS" },
  { id: "p10", name: "Couples Wellness Package", sku: "PKG-CWP90", category: "Packages", type: "SERVICE", cost: 650, price: 1850, stock: 0, threshold: 0, status: "ACTIVE", accent: "bg-pink-100 text-pink-800", short: "CW" },
  { id: "p11", name: "Ginger Relief Liniment", sku: "RTL-GRL60", category: "Wellness Retail", type: "PRODUCT", cost: 80, price: 195, stock: 6, threshold: 6, status: "ACTIVE", accent: "bg-amber-100 text-amber-800", short: "GL" },
  { id: "p12", name: "Hot Stone Add-on", sku: "ADD-HSTONE", category: "Add-ons", type: "SERVICE", cost: 70, price: 220, stock: 0, threshold: 0, status: "ACTIVE", accent: "bg-stone-200 text-stone-700", short: "HS" },
];

export const demoTransactions: DemoTransaction[] = [
  { id: "t1", receipt: "HY-260822-0148", customer: "Camille Reyes", initials: "CR", staff: "Lea Mendoza", items: 3, method: "GCash", total: 1420, time: "10:42 AM", date: "Aug 22, 2026", status: "Completed" },
  { id: "t2", receipt: "HY-260822-0147", customer: "Walk-in customer", initials: "WC", staff: "Demo", items: 1, method: "Cash", total: 850, time: "10:18 AM", date: "Aug 22, 2026", status: "Completed" },
  { id: "t3", receipt: "HY-260822-0146", customer: "Patricia Lim", initials: "PL", staff: "Lea Mendoza", items: 2, method: "Card", total: 980, time: "9:54 AM", date: "Aug 22, 2026", status: "Completed" },
  { id: "t4", receipt: "HY-260822-0145", customer: "Jonas Villanueva", initials: "JV", staff: "Demo", items: 2, method: "Cash", total: 1070, time: "9:21 AM", date: "Aug 22, 2026", status: "Completed" },
  { id: "t5", receipt: "HY-260821-0144", customer: "Mae Dizon", initials: "MD", staff: "Lea Mendoza", items: 4, method: "GCash", total: 2090, time: "6:48 PM", date: "Aug 21, 2026", status: "Completed" },
  { id: "t6", receipt: "HY-260821-0143", customer: "Walk-in customer", initials: "WC", staff: "Lea Mendoza", items: 1, method: "Cash", total: 750, time: "5:37 PM", date: "Aug 21, 2026", status: "Completed" },
];

export const demoCustomers: DemoCustomer[] = [
  { id: "c1", name: "Camille Reyes", phone: "+63 917 524 1186", email: "camille.reyes@email.com", notes: "", transactions: 12, total: 12680, last: "Today, 10:42 AM", initials: "CR" },
  { id: "c2", name: "Patricia Lim", phone: "+63 905 336 7421", email: "patricia.lim@email.com", notes: "", transactions: 8, total: 8490, last: "Today, 9:54 AM", initials: "PL" },
  { id: "c3", name: "Jonas Villanueva", phone: "+63 917 822 9045", email: "jonas.v@email.com", notes: "", transactions: 6, total: 5320, last: "Today, 9:21 AM", initials: "JV" },
  { id: "c4", name: "Mae Dizon", phone: "+63 998 621 3370", email: "mae.dizon@email.com", notes: "", transactions: 15, total: 16840, last: "Yesterday, 6:48 PM", initials: "MD" },
  { id: "c5", name: "Rafael Navarro", phone: "+63 917 601 4332", email: "raf.navarro@email.com", notes: "", transactions: 4, total: 3880, last: "Aug 20, 2026", initials: "RN" },
  { id: "c6", name: "Sofia Garcia", phone: "+63 927 411 0874", email: "sofia.garcia@email.com", notes: "", transactions: 9, total: 7940, last: "Aug 19, 2026", initials: "SG" },
];

export const salesSeries = [
  { day: "Mon", sales: 12840 },
  { day: "Tue", sales: 15620 },
  { day: "Wed", sales: 11950 },
  { day: "Thu", sales: 18290 },
  { day: "Fri", sales: 21340 },
  { day: "Sat", sales: 24860 },
  { day: "Sun", sales: 17650 },
];

export const inventoryMovements: DemoMovement[] = [
  { id: "m1", product: "Calamansi Body Oil", sku: "RTL-CBO100", type: "Sale", change: -2, before: 20, after: 18, by: "Lea Mendoza", time: "Today, 10:42 AM" },
  { id: "m2", product: "Lavender Massage Balm", sku: "RTL-LMB50", type: "Sale", change: -1, before: 5, after: 4, by: "Lea Mendoza", time: "Today, 10:42 AM" },
  { id: "m3", product: "Herbal Bath Salts", sku: "RTL-HBS250", type: "Restock", change: 12, before: 10, after: 22, by: "Demo", time: "Today, 8:36 AM" },
  { id: "m4", product: "Lemongrass Soy Candle", sku: "RTL-LSC180", type: "Sale", change: -1, before: 4, after: 3, by: "Lea Mendoza", time: "Yesterday, 6:48 PM" },
  { id: "m5", product: "Eucalyptus Room Mist", sku: "RTL-ERM100", type: "Adjustment", change: -1, before: 12, after: 11, by: "Demo", time: "Yesterday, 2:15 PM" },
];
