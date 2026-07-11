import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getInventoryProviderForCompany } from "@/lib/inventory/providerFactory";
import { NewProductForm } from "@/components/products/new-product-form";
import { ProductRow } from "@/components/products/product-row";
import { NlCommandBox } from "@/components/products/nl-command-box";

export default async function ProductsPage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const provider = await getInventoryProviderForCompany(ctx.companyId);
  const isSheets = provider.provider === "GOOGLE_SHEETS";

  const sheetItems = isSheets ? await provider.list() : [];
  const products = isSheets
    ? []
    : await prisma.product.findMany({ where: { companyId: ctx.companyId }, orderBy: { name: "asc" } });
  const rowCount = isSheets ? sheetItems.length : products.length;

  const spreadsheetId = isSheets
    ? (await prisma.integration.findUnique({ where: { companyId_provider: { companyId: ctx.companyId, provider: "GOOGLE_SHEETS" } } }))
        ?.spreadsheetId
    : null;

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Productos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El agente puede consultar y actualizar el stock por WhatsApp usando esta lista.
        </p>
      </div>

      <NlCommandBox />

      {isSheets ? (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          Stock conectado a Google Sheets — editá los productos ahí o con el cuadro de arriba.{" "}
          {spreadsheetId && (
            <a
              href={`https://docs.google.com/spreadsheets/d/${spreadsheetId}`}
              target="_blank"
              rel="noreferrer"
              className="underline text-foreground"
            >
              Abrir la planilla
            </a>
          )}
        </div>
      ) : (
        <NewProductForm />
      )}

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Nombre</span>
          <span>SKU</span>
          <span>Stock</span>
          <span>Precio</span>
          <span>Unidad</span>
          <span />
        </div>
        {isSheets
          ? sheetItems.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] items-center gap-2 border-b border-border px-4 py-2.5 text-sm last:border-0"
              >
                <span className="text-foreground">{item.name}</span>
                <span className="text-muted-foreground">{item.sku ?? "—"}</span>
                <span className="text-foreground">{item.stock}</span>
                <span className="text-muted-foreground">{item.price ?? "—"}</span>
                <span className="text-muted-foreground">{item.unit ?? "—"}</span>
                <span />
              </div>
            ))
          : products.map((p) => <ProductRow key={p.id} product={p} />)}
        {rowCount === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">Todavía no cargaste ningún producto.</p>
        )}
      </div>
    </div>
  );
}
