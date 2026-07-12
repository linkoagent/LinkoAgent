import { NextRequest, NextResponse } from "next/server";
import { requireRole } from "@/lib/tenant";
import { transcribeAudio } from "@/lib/ai/transcription";

/** Solo transcribe, no ejecuta ningún tool — el dueño revisa/edita el texto en el cuadro de
 * /products antes de mandarlo a /api/products/nl-command. */
export async function POST(req: NextRequest) {
  await requireRole(["COMPANY_ADMIN", "SUPER_ADMIN"]);

  const formData = await req.formData();
  const audio = formData.get("audio");
  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Falta el audio." }, { status: 400 });
  }

  const buffer = Buffer.from(await audio.arrayBuffer());
  const transcription = await transcribeAudio(buffer, audio.type || "audio/webm");
  return NextResponse.json({ text: transcription.text });
}
