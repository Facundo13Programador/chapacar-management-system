// utils/budgetPdf.js
import PDFDocument from "pdfkit";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

export function buildBudgetPdfBuffer(budget) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 48,
      bufferPages: true, // importante para dibujar footer/header en todas las páginas al final
    });

    const chunks = [];
    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    // ---------------- Paths ----------------
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    
    const logoPath = path.join(__dirname, "../assets/logoFunciona.png");
    const hasLogo = fs.existsSync(logoPath);

    // ---------------- Helpers ----------------
    const currency = budget?.currency || "UYU";
    const money = (n) =>
      Number(n || 0).toLocaleString("es-UY", { style: "currency", currency });

    const page = () => doc.page;
    const left = () => page().margins.left;
    const right = () => page().width - page().margins.right;
    const usableWidth = () => right() - left();

    const line = (y, color = "#E6E8EC") => {
      doc.save();
      doc.strokeColor(color).lineWidth(1);
      doc.moveTo(left(), y).lineTo(right(), y).stroke();
      doc.restore();
    };

    const ensureSpace = (neededHeight) => {
      const bottom = page().height - page().margins.bottom;
      if (doc.y + neededHeight > bottom) {
        doc.addPage();
        return true;
      }
      return false;
    };

    const sectionTitle = (t) => {
      ensureSpace(28);
      doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text(t);
      doc.moveDown(0.35);
      doc.font("Helvetica").fontSize(10).fillColor("#111827");
    };

    const kv = (k, v) => {
      const value = v ?? "—";
      doc.font("Helvetica-Bold").text(`${k}: `, { continued: true });
      doc.font("Helvetica").text(String(value));
    };

    // ---------------- Header (primera página) ----------------
    const headerTop = 48; 
    const headerH = 78;

    if (hasLogo) {
      try {
        doc.image(logoPath, left(), headerTop, { width: 92 });
      } catch {
      }
    }

    // Título y datos empresa (derecha)
    doc
      .font("Helvetica-Bold")
      .fontSize(18)
      .fillColor("#111827")
      .text("Presupuesto de servicio", left(), headerTop + 4, {
        width: usableWidth(),
        align: "right",
      });

    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#374151")
      .text("Chapacar Repuestos & Taller", left(), headerTop + 30, {
        width: usableWidth(),
        align: "right",
      })
      .text("Maldonado, Uruguay", {
        width: usableWidth(),
        align: "right",
      });

    line(headerTop + headerH);
    doc.y = headerTop + headerH + 18;

    // ---------------- Blocks (Cliente / Vehículo / Reserva) ----------------
    sectionTitle("Datos del cliente");
    kv("Nombre", budget?.client?.name || "—");
    kv("Email", budget?.client?.email || "—");
    doc.moveDown(0.9);

    sectionTitle("Datos del vehículo");
    const v = budget?.vehicle;
    const brandName = v?.brand?.name || v?.brand || "";
    kv("Marca / Modelo", `${brandName} ${v?.model || ""}`.trim() || "—");
    kv("Año", v?.year || "—");
    kv("Matrícula", v?.licensePlate || "—");
    doc.moveDown(0.9);

    if (budget?.reservation) {
      sectionTitle("Datos de la reserva");
      const r = budget.reservation;
      const fecha = r.dateTime
        ? new Date(r.dateTime).toLocaleDateString("es-UY")
        : "—";
      const tipo =
        r.serviceType === "full_service"
          ? "Service completo"
          : r.serviceType === "revision"
          ? "Revisión"
          : r.serviceType || "—";
      kv("Fecha", fecha);
      kv("Tipo de servicio", tipo);
      doc.moveDown(0.9);
    }

    // ---------------- Table layout ----------------
    sectionTitle("Detalle del presupuesto");

    const w = usableWidth();
    const colQtyW = 55;
    const colUnitW = 92;
    const colTotalW = 96;
    const gap = 10;

    const colDescW = w - (colQtyW + colUnitW + colTotalW + gap * 3);

    const xDesc = left();
    const xQty = xDesc + colDescW + gap;
    const xUnit = xQty + colQtyW + gap;
    const xTotal = xUnit + colUnitW + gap;

    const tableHeaderH = 22;

    const drawTableHeader = () => {
      ensureSpace(tableHeaderH + 10);

      const y = doc.y;

      doc.save();
      doc.fillColor("#F3F4F6");
      doc.rect(left(), y, usableWidth(), tableHeaderH).fill();
      doc.restore();

      doc.font("Helvetica-Bold").fontSize(10).fillColor("#111827");
      doc.text("Descripción", xDesc, y + 6, { width: colDescW });
      doc.text("Cant.", xQty, y + 6, { width: colQtyW, align: "right" });
      doc.text("P. unit.", xUnit, y + 6, { width: colUnitW, align: "right" });
      doc.text("Importe", xTotal, y + 6, { width: colTotalW, align: "right" });

      doc.y = y + tableHeaderH + 8;
      line(doc.y - 4);
      doc.font("Helvetica").fontSize(10).fillColor("#111827");
    };

    const drawRow = ({ desc, qty, unit, total }) => {
      const descText = (desc || "—").trim();
      const descH = doc.heightOfString(descText, { width: colDescW });
      const rowH = Math.max(18, descH);
      const paddingY = 4;
      const needed = rowH + paddingY * 2 + 8;

      if (ensureSpace(needed)) {
        drawTableHeader();
      }

      const y = doc.y;

      doc.text(descText, xDesc, y + paddingY, { width: colDescW });

      doc.text(qty ? String(qty) : "", xQty, y + paddingY, {
        width: colQtyW,
        align: "right",
      });

      doc.text(unit ? money(unit) : "", xUnit, y + paddingY, {
        width: colUnitW,
        align: "right",
      });

      doc.text(total ? money(total) : "", xTotal, y + paddingY, {
        width: colTotalW,
        align: "right",
      });

      doc.y = y + rowH + paddingY * 2;
      line(doc.y, "#EFF1F5");
      doc.moveDown(0.2);
    };

    drawTableHeader();

    // ---------------- Items + Total ----------------
    let total = 0;
    const items = Array.isArray(budget?.items) ? budget.items : [];

    if (!items.length) {
      doc.font("Helvetica").fontSize(10).fillColor("#6B7280");
      doc.text("No hay ítems cargados para este presupuesto.");
      doc.fillColor("#111827");
    } else {
      items.forEach((it) => {
        const qty = Number(it.quantity) || 0;
        const unit = Number(it.unitPrice) || 0;
        const lineTotal = qty * unit;
        total += lineTotal;

        drawRow({
          desc: it.productName || it.description || "—",
          qty,
          unit,
          total: lineTotal,
        });
      });
    }

    doc.moveDown(0.8);

    ensureSpace(64);

    const boxW = colUnitW + gap + colTotalW;
    const boxX = right() - boxW;
    const boxY = doc.y;

    doc.save();
    doc.fillColor("#111827");
    doc.roundedRect(boxX, boxY, boxW, 40, 8).fill();
    doc.restore();

    doc
      .font("Helvetica-Bold")
      .fontSize(11)
      .fillColor("#FFFFFF")
      .text("Total", boxX + 12, boxY + 12, {
        width: colUnitW,
        align: "left",
      });

    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#FFFFFF")
      .text(money(total), boxX + 12, boxY + 10, {
        width: boxW - 24,
        align: "right",
      });

    doc.y = boxY + 52;

    // ---------------- Notes ----------------
    if (budget?.notes) {
      sectionTitle("Notas");
      doc.font("Helvetica").fontSize(10).fillColor("#111827");
      doc.text(String(budget.notes), { width: usableWidth() });
      doc.moveDown(0.6);
    }

    // ---------------- Footer en TODAS las páginas ----------------
    const addFooters = () => {
      const range = doc.bufferedPageRange(); // { start, count }

      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        const footerY = doc.page.height - doc.page.margins.bottom + 14;
        const pageNum = i - range.start + 1;
        const totalPages = range.count;

        doc.save();
        doc.strokeColor("#E6E8EC").lineWidth(1);
        doc
          .moveTo(doc.page.margins.left, footerY - 10)
          .lineTo(doc.page.width - doc.page.margins.right, footerY - 10)
          .stroke();
        doc.restore();

        doc.font("Helvetica").fontSize(9).fillColor("#6B7280");

        doc.text(
          `Generado el ${new Date().toLocaleString("es-UY")}`,
          doc.page.margins.left,
          footerY,
          { align: "left" }
        );

        doc.text(
          `Página ${pageNum} de ${totalPages}`,
          doc.page.margins.left,
          footerY,
          { width: doc.page.width - doc.page.margins.left - doc.page.margins.right, align: "right" }
        );
      }
    };

    doc.on("end", () => {
    });
    addFooters();

    doc.end();
  });
}
