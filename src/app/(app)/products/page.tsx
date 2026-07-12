import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { getInventoryProviderForCompany } from "@/lib/inventory/providerFactory";
import { NewProductForm } from "@/components/products/new-product-form";
import { ProductRow } from "@/components/products/product-row";
import { NlCommandBox } from "@/components/products/nl-command-box";
import { SyncSheetButton } from "@/components/products/sync-sheet-button";

export default async function ProductsPage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const provider = await getInventoryProviderForCompany(ctx.companyId);
  const isSheets = provider.provider === "GOOGLE_SHEETS";

  // provider.listRaw() puede fallar (planilla borrada, permisos revocados, hoja renombrada) —
  // nunca debe tirar abajo toda la página, así que se atrapa acá y se muestra un aviso en vez de romper.
  let sheetHeaders: string[] = [];
  let sheetRows: { id: string; values: string[] }[] = [];
  let sheetsError: string | null = null;
  if (isSheets) {
    try {
      const raw = await provider.listRaw?.();
      sheetHeaders = raw?.headers ?? [];
      sheetRows = raw?.rows ?? [];
    } catch (err) {
      sheetsError = err instanceof Error ? err.message : "No se pudo leer la planilla conectada.";
    }
  }

  const products = isSheets
    ? []
    : await prisma.product.findMany({ where: { companyId: ctx.companyId }, orderBy: { name: "asc" } });

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

      {isSheets && sheetsError ? (
        <div className="flex items-start justify-between gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          <p>
            No se pudo leer la planilla conectada: {sheetsError} Revisá la conexión en{" "}
            <a href="/integrations" className="underline">
              Integraciones
            </a>
            .
          </p>
          <SyncSheetButton />
        </div>
      ) : isSheets ? (
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          <p>
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
          </p>
          <SyncSheetButton />
        </div>
      ) : (
        <NewProductForm />
      )}

      {isSheets ? (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {sheetHeaders.map((header, i) => (
                  <th key={i} className="px-4 py-2.5 font-medium">
                    {header || `Columna ${i + 1}`}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sheetRows.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  {row.values.map((value, i) => (
                    <td key={i} className="px-4 py-2.5 text-foreground">
                      {value || "—"}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {sheetRows.length === 0 && !sheetsError && (
            <p className="p-10 text-center text-sm text-muted-foreground">Todavía no cargaste ningún producto.</p>
          )}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          {products.map((p) => (
            <ProductRow key={p.id} product={p} />
          ))}
          {products.length === 0 && (
            <p className="p-10 text-center text-sm text-muted-foreground">Todavía no cargaste ningún producto.</p>
          )}
        </div>
      )}
    </div>
  );
}
