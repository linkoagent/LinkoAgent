"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireRole } from "@/lib/tenant";
import { parseCustomFieldsFormInput } from "@/lib/inventory/customFields";

export async function createProduct(formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const name = String(formData.get("name") ?? "").trim();
  const stock = Math.max(0, Math.round(Number(formData.get("stock") ?? 0)));
  const customFields = parseCustomFieldsFormInput(formData.get("customFields"));

  if (!name) return;

  await prisma.product.create({
    data: { companyId: ctx.companyId, name, stock, customFields },
  });

  revalidatePath("/products");
}

export async function updateProduct(productId: string, formData: FormData) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const name = String(formData.get("name") ?? "").trim();
  const stock = Math.max(0, Math.round(Number(formData.get("stock") ?? 0)));
  const customFields = parseCustomFieldsFormInput(formData.get("customFields"));

  if (!name) return;

  await prisma.product.updateMany({
    where: { id: productId, companyId: ctx.companyId },
    data: { name, stock, customFields },
  });

  revalidatePath("/products");
}

export async function deleteProduct(productId: string) {
  const ctx = await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);
  await prisma.product.deleteMany({ where: { id: productId, companyId: ctx.companyId } });
  revalidatePath("/products");
}
