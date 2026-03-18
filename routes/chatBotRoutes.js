import express from 'express';
import { openai } from '../utils/openAi.js';
import { classifyMessage } from '../utils/chatClassifier.js';
import Product from '../models/productModel.js';
import Brand from '../models/brandModel.js';

const router = express.Router();

// Helper para escapar regex
function escapeRegex(text = "") {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

router.post("/", async (req, res) => {
  try {
    const { message } = req.body || {};
    const text = (message || "").trim();

    if (!text) {
      return res.json({
        answer:
          "Decime marca, modelo, año del vehículo y qué repuesto estás buscando así te digo precio y stock.",
      });
    }

    // 1) Clasificamos el mensaje
    const parsed = await classifyMessage(text);
    console.log("Clasificación:", parsed);

    let productContext = "No se encontraron productos exactos para esos datos.";

    if (parsed.intent === "stock_price") {
      const query = {
        isActive: true,
        countInStock: { $gt: 0 },
      };

      // 2) Marca -> Brand (ObjectId)
      if (parsed.brand) {
        const brandText = parsed.brand.trim();
        const brandRegex = new RegExp(escapeRegex(brandText), "i");

        const brandDoc = await Brand.findOne({
          $or: [{ name: brandRegex }, { slug: brandRegex }],
        });

        if (brandDoc) {
          query.brand = brandDoc._id;
          console.log("Marca encontrada:", brandDoc.name, brandDoc._id);
        } else {
          console.log("No se encontró Brand para:", parsed.brand);
        }
      }

      // 3) Texto a buscar
      const orFilters = [];

      if (parsed.part) {
        const partRegex = new RegExp(escapeRegex(parsed.part), "i");
        orFilters.push(
          { name: partRegex },
          { description: partRegex },
          { code: partRegex }
        );
      }

      // usamos también el modelo como texto dentro del producto
      if (parsed.model) {
        const modelRegex = new RegExp(escapeRegex(parsed.model), "i");
        orFilters.push(
          { name: modelRegex },
          { description: modelRegex }
        );
      }

      if (orFilters.length > 0) {
        query.$or = orFilters;
      }

      console.log("Query generada para Product.find:", JSON.stringify(query));

      // 4) Buscar productos, con la marca populada
      const productos = await Product.find(query)
        .limit(10)
        .populate("brand");

      console.log("Productos encontrados:", productos.length);

      if (productos.length > 0) {
        productContext = productos
          .map((p) => {
            const brandName = p.brand?.name || "";
            return `• ${p.name} ${
              brandName ? `(${brandName})` : ""
            } — Código: ${p.code} — $${p.price} — Stock: ${p.countInStock} unidades`;
          })
          .join("\n");
      } else {
        productContext =
          "No se encontraron productos en la base para esa combinación de marca/modelo/repuesto.";
      }
    }

    // 5) Generar respuesta final con OpenAI
    const completion = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content: `
Eres el asistente de CHAPACAR, una casa de repuestos en Maldonado.
Respondé siempre en español rioplatense, amable y claro.

Información de productos encontrados:
${productContext}

Reglas:
- Si hay productos, listalos con código, marca, precio y stock.
- Si no hay coincidencias, avisá que no se encontró nada exacto y pedí que el usuario aclare marca, modelo, año o el tipo de repuesto.
- No inventes productos ni precios que no estén en la lista.
        `.trim(),
        },
        { role: "user", content: text },
      ],
    });

    const answer = completion.output[0].content[0].text;
    return res.json({ answer });
  } catch (error) {
    console.error("Error en /api/chat:", error);
    return res.status(500).json({
      error: "Error interno en el chatbot",
    });
  }
});


export default router;
