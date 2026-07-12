"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mic, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function NlCommandBox() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [reply, setReply] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  async function send(formData: FormData) {
    setLoading(true);
    setError(null);
    setReply(null);
    try {
      const res = await fetch("/api/products/nl-command", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "No se pudo procesar el comando.");
        return;
      }
      setReply(data.reply);
      router.refresh();
    } catch {
      setError("No se pudo conectar con el servidor.");
    } finally {
      setLoading(false);
    }
  }

  async function handleTextSubmit() {
    if (!text.trim()) return;
    const formData = new FormData();
    formData.set("text", text.trim());
    setText("");
    await send(formData);
  }

  async function startRecording() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop());
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setTranscribing(true);
        setError(null);
        try {
          const formData = new FormData();
          formData.set("audio", blob, "command.webm");
          const res = await fetch("/api/products/transcribe", { method: "POST", body: formData });
          const data = await res.json();
          if (!res.ok) {
            setError(data.error ?? "No se pudo transcribir el audio.");
            return;
          }
          // Se pone en el cuadro para que el dueño la revise/edite antes de mandarla, no se
          // envía sola: es la queja explícita que motivó este cambio (antes se enviaba directo).
          setText((prev) => (prev ? `${prev} ${data.text}` : data.text));
        } catch {
          setError("No se pudo conectar con el servidor.");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
    } catch {
      setError("No se pudo acceder al micrófono. Revisá los permisos del navegador.");
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">
        Escribí o grabá un mensaje (ej: "cuánta silla gris queda", "actualizá la mesa ratona a 5" o "agregá 3 sillas
        azules a $8000") y la IA aplica el cambio.
      </p>
      <div className="flex gap-2">
        <Input
          value={transcribing ? "Transcribiendo..." : text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleTextSubmit();
          }}
          placeholder="Escribí tu consulta o comando..."
          disabled={loading || recording || transcribing}
          className="text-sm"
        />
        <Button
          type="button"
          size="sm"
          disabled={loading || recording || transcribing || !text.trim()}
          onClick={handleTextSubmit}
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Enviar"}
        </Button>
        <Button
          type="button"
          size="icon"
          variant={recording ? "destructive" : "outline"}
          disabled={loading || transcribing}
          aria-label={recording ? "Detener grabación" : "Grabar mensaje"}
          onClick={recording ? stopRecording : startRecording}
        >
          {transcribing ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : recording ? (
            <Square className="h-3.5 w-3.5" />
          ) : (
            <Mic className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>
      {reply && <p className="rounded-lg bg-muted p-2.5 text-sm text-foreground">{reply}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
