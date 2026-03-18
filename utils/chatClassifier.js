// utils/chatClassifier.js
import { openai } from "./openAi.js";

export function extractJsonObject(raw = "") {
  if (typeof raw !== "string") return raw;

  const unfenced = raw
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    return JSON.parse(unfenced);
  } catch (_) {
    const start = unfenced.indexOf("{");
    const end = unfenced.lastIndexOf("}");
    if (start !== -1 && end !== -1 && end > start) {
      const slice = unfenced.slice(start, end + 1);
      return JSON.parse(slice);
    }
    throw new Error(`No se pudo parsear JSON. Raw: ${raw}`);
  }
}

export async function classifyMessage(message, opts = {}) {
  const client = opts.openaiClient ?? openai;
  const completion = await client.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: `
Sos un clasificador de mensajes para una casa de repuestos de autos (CHAPACAR).

Devolvé SOLO un JSON válido (sin \`\`\`, sin texto extra).

{
  "intent": "stock_price" | "other",
  "brand": null | string,
  "model": null | string,
  "year": null | number,
  "part": null | string
}

Reglas:
- Si el usuario pregunta por un repuesto, precio o stock → intent = "stock_price".
- No inventes datos, solo extraé lo que encuentres.
- Año: número si aparece.
        `.trim(),
      },
      { role: "user", content: message },
    ],
  });

  const raw = completion.output?.[0]?.content?.[0]?.text ?? "";
  return extractJsonObject(raw);
}
