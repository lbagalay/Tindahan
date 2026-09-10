import type { SaleInput } from "@/app/actions/sales";
import type { DemoProduct } from "@/lib/demo-data";

const DB_NAME = "tindahan-offline";
const DB_VERSION = 1;
const QUEUE_STORE = "pending-sales";
const CATALOG_STORE = "catalog-cache";
const CART_STORE = "cart-draft";

export type PendingSaleDisplay = {
  items: { name: string; quantity: number; price: number }[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: "Cash" | "GCash";
  amountReceived: number;
  customerName: string;
};

export type PendingSale = {
  clientTransactionId: string;
  businessId: string;
  payload: SaleInput;
  display: PendingSaleDisplay;
  createdAt: number;
};

export type CatalogCacheEntry = {
  businessId: string;
  products: DemoProduct[];
  cachedAt: number;
};

function isSupported() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(QUEUE_STORE)) db.createObjectStore(QUEUE_STORE, { keyPath: "clientTransactionId" });
      if (!db.objectStoreNames.contains(CATALOG_STORE)) db.createObjectStore(CATALOG_STORE, { keyPath: "businessId" });
      if (!db.objectStoreNames.contains(CART_STORE)) db.createObjectStore(CART_STORE, { keyPath: "businessId" });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function withStore<T>(storeName: string, mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest | void): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const request = run(store);
    tx.oncomplete = () => resolve((request as IDBRequest | undefined)?.result as T);
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error);
  });
}

export async function queueOfflineSale(sale: PendingSale): Promise<void> {
  if (!isSupported()) throw new Error("Offline storage is not available in this browser.");
  await withStore(QUEUE_STORE, "readwrite", (store) => store.put(sale));
}

export async function getPendingSales(): Promise<PendingSale[]> {
  if (!isSupported()) return [];
  const result = await withStore<PendingSale[]>(QUEUE_STORE, "readonly", (store) => store.getAll());
  return (result ?? []).sort((a, b) => a.createdAt - b.createdAt);
}

export async function removePendingSale(clientTransactionId: string): Promise<void> {
  if (!isSupported()) return;
  await withStore(QUEUE_STORE, "readwrite", (store) => store.delete(clientTransactionId));
}

export async function cacheCatalog(businessId: string, products: DemoProduct[]): Promise<void> {
  if (!isSupported()) return;
  const entry: CatalogCacheEntry = { businessId, products, cachedAt: Date.now() };
  await withStore(CATALOG_STORE, "readwrite", (store) => store.put(entry));
}

export async function getCachedCatalog(businessId: string): Promise<DemoProduct[] | null> {
  if (!isSupported()) return null;
  const entry = await withStore<CatalogCacheEntry | undefined>(CATALOG_STORE, "readonly", (store) => store.get(businessId));
  return entry?.products ?? null;
}

export type CartDraft = { businessId: string; cart: unknown; selectedCustomerId: string | null; discount: number; savedAt: number };

export async function saveCartDraft(draft: CartDraft): Promise<void> {
  if (!isSupported()) return;
  await withStore(CART_STORE, "readwrite", (store) => store.put(draft));
}

export async function getCartDraft(businessId: string): Promise<CartDraft | null> {
  if (!isSupported()) return null;
  const draft = await withStore<CartDraft | undefined>(CART_STORE, "readonly", (store) => store.get(businessId));
  return draft ?? null;
}

export async function clearCartDraft(businessId: string): Promise<void> {
  if (!isSupported()) return;
  await withStore(CART_STORE, "readwrite", (store) => store.delete(businessId));
}
