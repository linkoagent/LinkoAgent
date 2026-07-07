import mammoth from "mammoth";
import ExcelJS from "exceljs";
import { PDFParse } from "pdf-parse";
import type { KnowledgeSourceType } from "@prisma/client";

const EXTENSION_TYPES: Record<string, KnowledgeSourceType> = {
  pdf: "PDF",
  docx: "DOCX",
  xlsx: "SPREADSHEET",
  xls: "SPREADSHEET",
  csv: "SPREADSHEET",
  txt: "TEXT",
};

export function knowledgeTypeForFile(fileName: string): KnowledgeSourceType | null {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_TYPES[ext] ?? null;
}

async function extractSpreadsheetText(buffer: Buffer, fileName: string): Promise<string> {
  if (fileName.toLowerCase().endsWith(".csv")) {
    return buffer.toString("utf-8");
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);

  const lines: string[] = [];
  workbook.eachSheet((sheet) => {
    lines.push(`# ${sheet.name}`);
    sheet.eachRow((row) => {
      const cells = (row.values as unknown[])
        .slice(1)
        .map((v) => (v == null ? "" : String(v).trim()));
      if (cells.some((c) => c !== "")) lines.push(cells.join(" | "));
    });
  });

  return lines.join("\n");
}

/** Extrae texto plano de un archivo subido para usarlo como fuente de conocimiento del agente. */
export async function extractTextFromFile(fileName: string, buffer: Buffer): Promise<string> {
  const type = knowledgeTypeForFile(fileName);
  if (!type) {
    throw new Error(`Formato no soportado: "${fileName}". Usá PDF, Word (.docx), Excel (.xlsx/.xls), CSV o texto (.txt).`);
  }

  switch (type) {
    case "PDF": {
      const parser = new PDFParse({ data: new Uint8Array(buffer) });
      try {
        const result = await parser.getText();
        return result.text.trim();
      } finally {
        await parser.destroy();
      }
    }
    case "DOCX": {
      const result = await mammoth.extractRawText({ buffer });
      return result.value.trim();
    }
    case "SPREADSHEET":
      return (await extractSpreadsheetText(buffer, fileName)).trim();
    case "TEXT":
      return buffer.toString("utf-8").trim();
    default:
      throw new Error(`Formato no soportado: "${fileName}".`);
  }
}
