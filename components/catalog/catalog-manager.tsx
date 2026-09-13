"use client";

import { createContext, useContext, useMemo, useState } from "react";
import { Download, MoreHorizontal, PackagePlus, Plus, Search, Trash2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { demoProducts, type DemoProduct } from "@/lib/demo-data";
import { moneyFor, warmSwatchFor } from "@/lib/utils";
import { createCatalogItem, updateCatalogItem } from "@/app/actions/management";
import { updateProductRecipe } from "@/app/actions/ingredients";
import type { CustomFieldDefinition } from "@/lib/customization";
import { defaultTemplateExamples, defaultTerminology, type TemplateExamples, type Terminology } from "@/lib/platform-config";

function csvCell(value: string | number) { return `"${String(value).replaceAll('"', '""')}"`; }
const CatalogExamplesContext = createContext(defaultTemplateExamples);

export type IngredientOption = { id: string; name: string; unit: string };
type ItemType = "PRODUCT" | "SERVICE";
type RecipeRow = { ingredientId: string; quantity: string };
type FormValues = { name: string; sku: string; category: string; type: ItemType; image: string; cost: string; price: string; stock: string; threshold: string; status: "ACTIVE" | "INACTIVE"; customValues: Record<string, string>; recipe: RecipeRow[] };

function emptyValues(customFields: CustomFieldDefinition[]): FormValues {
  return { name: "", sku: "", category: "", type: "PRODUCT", image: "", cost: "", price: "", stock: "", threshold: "5", status: "ACTIVE", customValues: Object.fromEntries(customFields.map((field) => [field.id, ""])), recipe: [] };
}
function valuesFromItem(item: DemoProduct, customFields: CustomFieldDefinition[]): FormValues {
  return { name: item.name, sku: item.sku, category: item.category, type: item.type, image: item.image ?? "", cost: String(item.cost), price: String(item.price), stock: String(item.stock), threshold: String(item.threshold), status: item.status, customValues: Object.fromEntries(customFields.map((field) => [field.id, item.customValues?.[field.id] ?? ""])), recipe: (item.recipe ?? []).map((row) => ({ ingredientId: row.ingredientId, quantity: String(row.quantity) })) };
}

export function CatalogManager({ initialProducts = demoProducts, initialQuery = "", currency = "PHP", customFields = [], terminology = defaultTerminology, examples = defaultTemplateExamples, ingredients = [], recipesEnabled = false }: { initialProducts?: DemoProduct[]; initialQuery?: string; currency?: string; customFields?: CustomFieldDefinition[]; terminology?: Terminology; examples?: TemplateExamples; ingredients?: IngredientOption[]; recipesEnabled?: boolean }) {
  const money = moneyFor(currency);
  const [products, setProducts] = useState(initialProducts);
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState("ALL");
  const [status, setStatus] = useState("ALL");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DemoProduct | null>(null);
  const [values, setValues] = useState<FormValues>(() => emptyValues(customFields));
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const filtered = useMemo(() => products.filter((item) => (type === "ALL" || item.type === type) && (status === "ALL" || item.status === status) && `${item.name} ${item.sku} ${item.category} ${Object.values(item.customValues ?? {}).join(" ")}`.toLowerCase().includes(query.toLowerCase())), [products, query, status, type]);

  function openCreate() { setEditing(null); setValues(emptyValues(customFields)); setFieldErrors({}); setError(""); setOpen(true); }
  function openEdit(item: DemoProduct) { setEditing(item); setValues(valuesFromItem(item, customFields)); setFieldErrors({}); setError(""); setOpen(true); }
  function update<K extends keyof FormValues>(key: K, value: FormValues[K]) { setValues((current) => ({ ...current, [key]: value })); }

  const costNumber = Number(values.cost);
  const priceNumber = Number(values.price);
  const priceBelowCost = values.cost.trim() !== "" && values.price.trim() !== "" && Number.isFinite(costNumber) && Number.isFinite(priceNumber) && priceNumber < costNumber;
  const hasRecipe = values.recipe.length > 0;

  function addRecipeRow() { setValues((current) => ({ ...current, recipe: [...current.recipe, { ingredientId: ingredients[0]?.id ?? "", quantity: "" }] })); }
  function updateRecipeRow(index: number, patch: Partial<RecipeRow>) { setValues((current) => ({ ...current, recipe: current.recipe.map((row, i) => i === index ? { ...row, ...patch } : row) })); }
  function removeRecipeRow(index: number) { setValues((current) => ({ ...current, recipe: current.recipe.filter((_, i) => i !== index) })); }

  function validate(): Record<string, string> {
    const errors: Record<string, string> = {};
    if (!values.name.trim()) errors.name = "Name is required.";
    if (!values.sku.trim()) errors.sku = "SKU is required.";
    if (!values.category.trim()) errors.category = "Category is required.";
    if (values.image.trim() && !/^https?:\/\//i.test(values.image.trim()) && !values.image.trim().startsWith("/")) errors.image = "Enter a full URL or an app path starting with /.";
    if (values.cost.trim() === "" || !Number.isFinite(costNumber) || costNumber < 0) errors.cost = "Enter a cost of 0 or more.";
    if (values.price.trim() === "" || !Number.isFinite(priceNumber) || priceNumber <= 0) errors.price = "Enter a selling price greater than 0.";
    const hasRecipe = values.recipe.length > 0;
    if (values.type === "PRODUCT" && !hasRecipe) {
      if (!editing) {
        const stockNumber = Number(values.stock);
        if (values.stock.trim() === "" || !Number.isFinite(stockNumber) || stockNumber < 0) errors.stock = "Enter an opening stock of 0 or more.";
      }
      const thresholdNumber = Number(values.threshold);
      if (values.threshold.trim() === "" || !Number.isFinite(thresholdNumber) || thresholdNumber < 0) errors.threshold = "Enter a threshold of 0 or more.";
    }
    values.recipe.forEach((row, index) => {
      const quantity = Number(row.quantity);
      if (!row.ingredientId) errors[`recipe:${index}`] = "Choose an ingredient.";
      else if (row.quantity.trim() === "" || !Number.isFinite(quantity) || quantity <= 0) errors[`recipe:${index}`] = "Enter a quantity greater than 0.";
    });
    for (const field of customFields) {
      if (field.required && !values.customValues[field.id]?.trim()) errors[`custom:${field.id}`] = `${field.label} is required.`;
    }
    return errors;
  }

  async function saveItem(event: React.FormEvent) {
    event.preventDefault();
    const errors = validate();
    if (Object.keys(errors).length) { setFieldErrors(errors); setError(""); return; }
    setFieldErrors({}); setError(""); setSaving(true);
    const hasRecipe = values.recipe.length > 0;
    const recipeItems = values.recipe.map((row) => ({ ingredientId: row.ingredientId, quantity: Number(row.quantity) }));
    const payload = { name: values.name.trim(), sku: values.sku.trim(), category: values.category.trim(), type: values.type, image: values.image.trim(), customValues: values.customValues, cost: costNumber, price: priceNumber, threshold: values.type === "PRODUCT" && !hasRecipe ? Number(values.threshold) : 0 };
    try {
      let productId = editing?.id;
      if (editing) {
        const result = await updateCatalogItem({ id: editing.id, ...payload, status: values.status });
        if (!result.ok) { if (/sku/i.test(result.error)) setFieldErrors({ sku: result.error }); else setError(result.error); return; }
        setProducts((current) => current.map((item) => item.id === editing.id ? { ...item, ...payload, sku: payload.sku.toUpperCase(), status: values.status, stock: hasRecipe ? 0 : result.item.stock, recipe: recipeItems, short: payload.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() } : item));
      } else {
        const stock = values.type === "PRODUCT" && !hasRecipe ? Number(values.stock) : 0;
        const result = await createCatalogItem({ ...payload, stock });
        if (!result.ok) { if (/sku/i.test(result.error)) setFieldErrors({ sku: result.error }); else setError(result.error); return; }
        productId = result.id;
        const newItem: DemoProduct = { id: result.id, ...payload, sku: payload.sku.toUpperCase(), stock, status: "ACTIVE", recipe: recipeItems, accent: "bg-[var(--brand-soft)] text-[var(--brand)]", short: payload.name.split(" ").map((word) => word[0]).join("").slice(0, 2).toUpperCase() };
        setProducts((current) => [newItem, ...current]);
      }
      if (productId) {
        const recipeResult = await updateProductRecipe({ productId, items: recipeItems });
        if (!recipeResult.ok) { setError(recipeResult.error); return; }
      }
      setOpen(false); setEditing(null);
    } catch {
      setError("Connection lost while saving. Check your internet and try again.");
    } finally {
      setSaving(false);
    }
  }

  function exportCsv() {
    const rows = filtered.map((item) => [item.name, item.sku, item.category, item.type === "PRODUCT" ? "Product" : "Service", item.cost.toFixed(2), item.price.toFixed(2), item.type === "PRODUCT" ? item.stock : "", item.threshold, item.status]);
    const csv = [["Name", "SKU", "Category", "Type", "Cost", "Price", "Stock", "Low-stock threshold", "Status"], ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = `catalog-${new Date().toISOString().slice(0, 10)}.csv`; link.click(); URL.revokeObjectURL(url);
  }

  return (
    <CatalogExamplesContext.Provider value={examples}>
    <>
      <div className="flex flex-col gap-3 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--muted)]" size={17} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${terminology.products.toLowerCase()} — e.g. ${examples.catalogItem}`} aria-label="Search catalog" className="h-10 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] pl-10 pr-3 text-xs outline-none focus:border-[var(--brand)] focus:bg-[var(--surface)] focus:ring-2 focus:ring-[var(--brand-soft)]" /></div>
        <div className="flex flex-wrap gap-2"><select value={type} onChange={(event) => setType(event.target.value)} aria-label="Item type" className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink-soft)] outline-none"><option value="ALL">All types</option><option value="PRODUCT">{terminology.products}</option><option value="SERVICE">{terminology.services}</option></select><select value={status} onChange={(event) => setStatus(event.target.value)} aria-label="Item status" className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-3 text-xs font-semibold text-[var(--ink-soft)] outline-none"><option value="ALL">All statuses</option><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select><Button variant="secondary" onClick={exportCsv} disabled={!filtered.length}><Download size={15} /> Export</Button><Button onClick={openCreate}><PackagePlus size={16} /> Add {terminology.product.toLowerCase()}</Button></div>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
        <div className="overflow-x-auto"><table className="w-full min-w-[920px] text-left"><thead><tr className="border-b border-[var(--border)] bg-[var(--surface-subtle)] text-[10px] uppercase tracking-wider text-[var(--muted)]"><th className="px-5 py-3 font-bold">{terminology.product}</th><th className="px-4 py-3 font-bold">{terminology.category}</th><th className="px-4 py-3 font-bold">Type</th><th className="px-4 py-3 text-right font-bold">Cost</th><th className="px-4 py-3 text-right font-bold">Price</th><th className="px-4 py-3 text-right font-bold">Stock</th><th className="px-4 py-3 font-bold">Status</th><th className="w-12 px-4 py-3" /></tr></thead><tbody className="divide-y divide-dashed divide-[var(--border)]">
          {filtered.map((product) => { const swatch = warmSwatchFor(product.category); return <tr key={product.id} className="hover:bg-[var(--surface-subtle)]/60"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><span className="grid size-10 place-items-center rounded-lg bg-cover bg-center text-xs font-bold" style={product.image ? { backgroundImage: `url(${product.image})` } : { backgroundColor: swatch.bg, color: swatch.fg }}>{product.image ? <span className="sr-only">{product.name}</span> : product.short}</span><div><p className="text-xs font-bold text-[var(--foreground)]">{product.name}</p><p className="mt-1 text-[10px] font-medium text-[var(--muted)]">{product.sku}</p></div></div></td><td className="px-4 py-3.5 text-xs text-[var(--ink-soft)]">{product.category}</td><td className="px-4 py-3.5"><Badge tone={product.type === "SERVICE" ? "info" : "neutral"}>{product.type === "SERVICE" ? "Service" : "Product"}</Badge></td><td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums text-[var(--muted)]">{money.format(product.cost)}</td><td className="px-4 py-3.5 text-right font-mono text-xs font-bold tabular-nums text-[var(--foreground)]">{money.format(product.price)}</td><td className="px-4 py-3.5 text-right font-mono text-xs font-bold tabular-nums text-[var(--ink-soft)]">{product.type === "SERVICE" ? "—" : product.recipe?.length ? <span className="font-sans font-semibold text-[var(--brand)]" title="Stock tracked from ingredients">Recipe</span> : <span className={product.stock <= product.threshold ? "text-amber-700" : ""}>{product.stock}</span>}</td><td className="px-4 py-3.5"><Badge tone={product.status === "ACTIVE" ? "success" : "neutral"}>{product.status === "ACTIVE" ? "Active" : "Inactive"}</Badge></td><td className="px-4 py-3.5"><button onClick={() => openEdit(product)} aria-label={`Edit ${product.name}`} className="grid size-8 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--surface-subtle)] hover:text-[var(--foreground)]"><MoreHorizontal size={17} /></button></td></tr>; })}
        </tbody></table></div>
        {!filtered.length ? <div className="border-t border-[var(--border)] px-5 py-10 text-center text-xs text-[var(--muted)]">No items match the current filters.</div> : null}
        <div className="flex items-center justify-between border-t border-[var(--border)] px-5 py-3 text-[11px] text-[var(--muted)]"><span>Showing {filtered.length} of {products.length} items</span><span>Live catalog data</span></div>
      </div>

      {open ? <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-950/50 p-4"><form key={editing?.id ?? "new"} onSubmit={saveItem} noValidate className="my-8 w-full max-w-xl rounded-2xl bg-[var(--surface)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-5"><div><h2 className="font-display text-lg font-semibold text-[var(--foreground)]">{editing ? "Edit product or service" : "Add product or service"}</h2><p className="mt-1 text-xs text-[var(--muted)]">{editing ? "Update catalog details and availability." : "Create a new item for the catalog."}</p></div><button type="button" onClick={() => setOpen(false)}><X size={19} className="text-[var(--muted)]" /></button></div>
        <div className="grid gap-4 p-6 sm:grid-cols-2">
          <Field name="name" label="Name" placeholder="e.g. Deep Tissue Massage" className="sm:col-span-2" value={values.name} onChange={(value) => update("name", value)} error={fieldErrors.name} />
          <Field name="sku" label="SKU" placeholder="SVC-DTM60" value={values.sku} onChange={(value) => update("sku", value)} error={fieldErrors.sku} />
          <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Type</span>{editing ? <input value={editing.type === "PRODUCT" ? "Product" : "Service"} disabled className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--muted)]" /> : <select value={values.type} onChange={(event) => update("type", event.target.value as ItemType)} className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none"><option value="PRODUCT">Product</option><option value="SERVICE">Service</option></select>}</label>
          <Field name="category" label="Category" placeholder="Massage" value={values.category} onChange={(value) => update("category", value)} error={fieldErrors.category} />
          <Field name="image" type="text" label="Image URL (optional)" placeholder="https://example.com/item.jpg" value={values.image} onChange={(value) => update("image", value)} error={fieldErrors.image} className="sm:col-span-2" />
          <Field name="cost" type="number" min="0" step="0.01" label="Cost" placeholder="0.00" value={values.cost} onChange={(value) => update("cost", value)} error={fieldErrors.cost} />
          <Field name="price" type="number" min="0.01" step="0.01" label="Selling price" placeholder="0.00" value={values.price} onChange={(value) => update("price", value)} error={fieldErrors.price} warning={!fieldErrors.price && priceBelowCost ? "Selling price is below cost — this item will sell at a loss." : undefined} />
          {values.type === "PRODUCT" && !hasRecipe ? (editing ? <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Current stock</span><input value={editing.stock} disabled className="h-11 w-full rounded-lg border border-[var(--border)] bg-[var(--surface-subtle)] px-3 text-sm text-[var(--muted)]" /></label> : <Field name="stock" type="number" min="0" label="Opening stock" placeholder="0" value={values.stock} onChange={(value) => update("stock", value)} error={fieldErrors.stock} />) : null}
          {values.type === "PRODUCT" && !hasRecipe ? <Field name="threshold" type="number" min="0" label="Low-stock threshold" placeholder="5" value={values.threshold} onChange={(value) => update("threshold", value)} error={fieldErrors.threshold} /> : null}
          {editing ? <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">Status</span><select value={values.status} onChange={(event) => update("status", event.target.value as "ACTIVE" | "INACTIVE")} className="h-11 w-full rounded-lg border border-[var(--border)] px-3 text-sm outline-none"><option value="ACTIVE">Active</option><option value="INACTIVE">Inactive</option></select></label> : null}
          {customFields.map((field) => <CustomInput key={field.id} field={field} value={values.customValues[field.id] ?? ""} onChange={(value) => setValues((current) => ({ ...current, customValues: { ...current.customValues, [field.id]: value } }))} error={fieldErrors[`custom:${field.id}`]} />)}
          {editing?.type === "PRODUCT" && !hasRecipe ? <p className="self-end pb-3 text-[11px] leading-4 text-[var(--muted)]">Use Inventory to change stock so every adjustment remains auditable.</p> : null}

          {recipesEnabled ? <div className="sm:col-span-2 rounded-xl border border-[var(--border)] bg-[var(--surface-subtle)] p-4">
            <div className="flex items-center justify-between"><div><p className="text-xs font-bold text-[var(--foreground)]">Recipe (optional)</p><p className="mt-0.5 text-[11px] leading-4 text-[var(--muted)]">{hasRecipe ? "This item's stock is now tracked entirely from these ingredients — no stock field of its own." : "Add ingredients to make this a made-to-order item with no stock of its own; skip it to keep tracking this item's stock directly."}</p></div><Button type="button" size="sm" variant="secondary" onClick={addRecipeRow} disabled={!ingredients.length}><Plus size={14} /> Add ingredient</Button></div>
            {!ingredients.length ? <p className="mt-3 text-[11px] text-[var(--muted)]">No ingredients yet — add some in Ingredients first.</p> : null}
            {values.recipe.length ? <div className="mt-3 space-y-2">{values.recipe.map((row, index) => { const unit = ingredients.find((item) => item.id === row.ingredientId)?.unit ?? ""; return <div key={index}><div className="grid grid-cols-[1fr_100px_32px] gap-2"><select value={row.ingredientId} onChange={(event) => updateRecipeRow(index, { ingredientId: event.target.value })} className="h-10 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2 text-xs"><option value="">Choose…</option>{ingredients.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><div className="flex h-10 items-center gap-1 rounded-lg border border-[var(--border)] bg-[var(--surface)] px-2"><input type="number" min="0" step="0.001" value={row.quantity} onChange={(event) => updateRecipeRow(index, { quantity: event.target.value })} placeholder="0" className="w-full min-w-0 bg-transparent text-xs outline-none" /><span className="shrink-0 text-[10px] text-[var(--muted)]">{unit}</span></div><button type="button" onClick={() => removeRecipeRow(index)} aria-label="Remove ingredient" className="grid size-10 place-items-center text-[var(--muted)] hover:text-red-600"><Trash2 size={15} /></button></div>{fieldErrors[`recipe:${index}`] ? <p className="mt-1 text-[11px] font-semibold text-red-600">{fieldErrors[`recipe:${index}`]}</p> : null}</div>; })}</div> : null}
          </div> : null}

          {error ? <p className="sm:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-xs font-semibold text-red-700">{error}</p> : null}
        </div>
        <div className="flex justify-end gap-2 border-t border-[var(--border)] px-6 py-4"><Button type="button" variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button type="submit" disabled={saving}>{saving ? "Saving…" : editing ? "Save changes" : "Create item"}</Button></div>
      </form></div> : null}
    </>
    </CatalogExamplesContext.Provider>
  );
}

function CustomInput({ field, value, onChange, error }: { field: CustomFieldDefinition; value: string; onChange: (value: string) => void; error?: string }) {
  return <label><span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">{field.label}</span>{field.type === "select" ? <select value={value} onChange={(event) => onChange(event.target.value)} className={`h-11 w-full rounded-lg border ${error ? "border-red-400" : "border-[var(--border)]"} bg-[var(--surface)] px-3 text-sm`}><option value="">Select…</option>{field.options.map((option) => <option key={option}>{option}</option>)}</select> : <input value={value} onChange={(event) => onChange(event.target.value)} type={field.type} className={`h-11 w-full rounded-lg border ${error ? "border-red-400" : "border-[var(--border)]"} px-3 text-sm outline-none`} />}{error ? <p className="mt-1.5 text-[11px] font-semibold text-red-600">{error}</p> : null}</label>;
}

function Field({ label, className, name, placeholder, value, onChange, error, warning, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange"> & { label: string; value: string; onChange: (value: string) => void; error?: string; warning?: string }) {
  const examples = useContext(CatalogExamplesContext);
  const contextualPlaceholder = name === "name" ? `e.g. ${examples.catalogItem}` : name === "sku" ? examples.sku : name === "category" ? examples.category : placeholder;
  return <label className={className}>
    <span className="mb-2 block text-xs font-bold text-[var(--ink-soft)]">{label}</span>
    <input name={name} value={value} onChange={(event) => onChange(event.target.value)} placeholder={contextualPlaceholder} className={`h-11 w-full rounded-lg border ${error ? "border-red-400" : "border-[var(--border)]"} px-3 text-sm outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-soft)]`} {...props} />
    {error ? <p className="mt-1.5 text-[11px] font-semibold text-red-600">{error}</p> : warning ? <p className="mt-1.5 text-[11px] font-semibold text-amber-700">{warning}</p> : null}
  </label>;
}
