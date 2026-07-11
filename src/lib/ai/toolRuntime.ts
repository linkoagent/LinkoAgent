import { chatComplete, type ChatMessage, type ChatResult } from "@/lib/ai/provider";
import type { ToolDefinition, ToolExecutionContext } from "@/lib/ai/tools/types";

const MAX_ITERATIONS = 3;

/**
 * Loop genérico de tool-calling: llama al modelo, y si pide ejecutar tools, los corre contra
 * el registry y le devuelve el resultado como mensaje role:"tool", repitiendo hasta que no pida
 * más o se llegue al tope. No sabe nada de Calendar específicamente — se reutiliza para
 * cualquier familia de tools futura.
 */
export async function runWithTools(params: {
  messages: ChatMessage[];
  tools: ToolDefinition[];
  context: ToolExecutionContext;
}): Promise<ChatResult> {
  const { tools, context } = params;
  const messages = [...params.messages];

  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let totalCostUsd = 0;
  let lastModel = "mock";

  for (let iteration = 0; iteration < MAX_ITERATIONS; iteration++) {
    const result = await chatComplete(messages, tools.length ? tools : undefined);
    totalPromptTokens += result.promptTokens;
    totalCompletionTokens += result.completionTokens;
    totalCostUsd += result.costUsd;
    lastModel = result.model;

    if (!result.toolCalls?.length) {
      return {
        content: result.content,
        promptTokens: totalPromptTokens,
        completionTokens: totalCompletionTokens,
        totalTokens: totalPromptTokens + totalCompletionTokens,
        costUsd: totalCostUsd,
        model: lastModel,
      };
    }

    messages.push({ role: "assistant", content: result.content || null, toolCalls: result.toolCalls });

    for (const toolCall of result.toolCalls) {
      const tool = tools.find((t) => t.name === toolCall.name);
      let output: Record<string, unknown>;
      if (!tool) {
        output = { error: `Tool desconocido: ${toolCall.name}` };
      } else {
        let args: Record<string, unknown> = {};
        let parseError = false;
        try {
          args = JSON.parse(toolCall.arguments || "{}");
        } catch {
          parseError = true;
        }
        output = parseError ? { error: "No se pudieron interpretar los argumentos del tool." } : await tool.execute(args, context);
      }
      messages.push({ role: "tool", content: JSON.stringify(output), toolCallId: toolCall.id });
    }
  }

  // Se agotaron las iteraciones y el modelo todavía pedía tools: forzamos una respuesta final
  // en texto (sin tools) para no devolverle al cliente un mensaje vacío.
  const finalResult = await chatComplete(messages);
  totalPromptTokens += finalResult.promptTokens;
  totalCompletionTokens += finalResult.completionTokens;
  totalCostUsd += finalResult.costUsd;

  return {
    content: finalResult.content,
    promptTokens: totalPromptTokens,
    completionTokens: totalCompletionTokens,
    totalTokens: totalPromptTokens + totalCompletionTokens,
    costUsd: totalCostUsd,
    model: finalResult.model,
  };
}
