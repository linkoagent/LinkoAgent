-- AlterTable: add customFields (new rows and existing rows both get '{}' via fast-default)
ALTER TABLE "Product" ADD COLUMN "customFields" JSONB NOT NULL DEFAULT '{}';

-- DataMigration: backfill from the columns being dropped, using default labels, omitting nulls
UPDATE "Product"
SET "customFields" = jsonb_strip_nulls(
  jsonb_build_object(
    'SKU', "sku",
    'Precio', CASE WHEN "price" IS NULL THEN NULL ELSE "price"::text END,
    'Unidad', "unit"
  )
);

-- AlterTable: drop the now-redundant typed columns
ALTER TABLE "Product" DROP COLUMN "sku";
ALTER TABLE "Product" DROP COLUMN "price";
ALTER TABLE "Product" DROP COLUMN "unit";
