import { requireRole } from "@/lib/tenant";
import { prisma } from "@/lib/prisma";
import { NewProductForm } from "@/components/products/new-product-form";
import { ProductRow } from "@/components/products/product-row";

export default async function ProductsPage() {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  const products = await prisma.product.findMany({ where: { companyId: ctx.companyId }, orderBy: { name: "asc" } });

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-2xl font-semibold text-foreground">Productos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          El agente puede consultar y actualizar el stock por WhatsApp usando esta lista. Cargalo acá mientras no
          haya sincronización automática con Google Sheets/Excel.
        </p>
      </div>

      <NewProductForm />

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-2 border-b border-border px-4 py-2.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Nombre</span>
          <span>SKU</span>
          <span>Stock</span>
          <span>Precio</span>
          <span>Unidad</span>
          <span />
        </div>
        {products.map((p) => (
          <ProductRow key={p.id} product={p} />
        ))}
        {products.length === 0 && (
          <p className="p-10 text-center text-sm text-muted-foreground">Todavía no cargaste ningún producto.</p>
        )}
      </div>
    </div>
  );
}
