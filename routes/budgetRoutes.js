// routes/budgetRoutes.js
import express from 'express';
import '../models/userModel.js';
import crypto from 'crypto';
import Budget from '../models/budgetModel.js';
import Reservation from '../models/reservationModel.js';
import WorkOrder from '../models/workOrderModel.js';
import Product from '../models/productModel.js';
import { sendMail } from '../utils/mail.js';
import { buildBudgetPdfBuffer } from '../utils/budgetPdf.js';
import { isAuth, isAdminOrOperator } from '../utils/authUtils.js';

const router = express.Router();

function mapPayloadItemsToBudgetItems(rawItems) {
  if (!Array.isArray(rawItems)) return [];

  const allowedTypes = ['product', 'labor', 'other'];

  return rawItems.map((it) => {
    const quantity = Number(it.quantity ?? it.qty ?? 1) || 0;
    const unitPrice = Number(it.unitPrice ?? it.price ?? 0) || 0;

    const hasProduct = it.product || it.productId || it.product_id;

    let type = it.type;
    if (!allowedTypes.includes(type)) {
      type = hasProduct ? 'product' : 'other';
    }

    const description =
      it.description || it.productName || it.name || 'Ítem sin descripción';

    return {
      type,
      product: it.product || it.productId || it.product_id || undefined,
      productName: it.productName ?? it.name ?? undefined,
      productSku: it.productSku ?? it.sku ?? undefined,
      productImage: it.productImage ?? it.image ?? undefined,
      description,
      quantity,
      unitPrice,
    };
  });
}

async function discountStockForBudgetProducts(budgetId) {
  const budget = await Budget.findById(budgetId);
  if (!budget) throw new Error('Presupuesto no encontrado');
  if (budget.stockDiscounted) return budget;

  const productItems = (budget.items || []).filter(
    (it) => it.type === 'product' && it.product && it.quantity > 0
  );

  if (!productItems.length) {
    budget.stockDiscounted = true;
    await budget.save();
    return budget;
  }

  for (const it of productItems) {
    const prod = await Product.findById(it.product);
    if (!prod) throw new Error(`Producto no encontrado (${it.product})`);
    if (prod.countInStock < it.quantity) {
      throw new Error(
        `Stock insuficiente para "${prod.name}". Disponible: ${prod.countInStock}, requerido: ${it.quantity}`
      );
    }
  }

  for (const it of productItems) {
    await Product.findByIdAndUpdate(it.product, {
      $inc: { countInStock: -it.quantity },
    });
  }

  budget.stockDiscounted = true;
  await budget.save();
  return budget;
}

// GET /api/budgets/:id/public/approve?token=...
router.get('/:id/public/approve', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    const budget = await Budget.findById(id).populate({
      path: 'client',
      select: 'name email',
      model: 'user',
    });

    if (!budget) return res.status(404).send('Presupuesto no encontrado.');
    if (!token || token !== budget.clientToken)
      return res.status(403).send('Token inválido.');

    if (budget.status === 'approved')
      return res.send('Este presupuesto ya fue aprobado anteriormente.');
    if (budget.status === 'rejected')
      return res.send('Este presupuesto ya fue rechazado.');

    budget.status = 'approved';
    budget.approvedAt = new Date();
    await budget.save();

    try {
      await discountStockForBudgetProducts(budget._id);
    } catch (stockErr) {
      console.error('Error descontando stock al aprobar por cliente', stockErr);
      return res
        .status(409)
        .send(
          'No se pudo aprobar el presupuesto por falta de stock. Contactá con el taller.'
        );
    }

    return res.send(
      '¡Gracias! El presupuesto fue aprobado correctamente. Nos pondremos en contacto para coordinar el trabajo.'
    );
  } catch (err) {
    console.error('publicApproveBudget error', err);
    return res
      .status(500)
      .send('No se pudo procesar la aprobación del presupuesto.');
  }
});

// GET /api/budgets/:id/public/reject?token=...
router.get('/:id/public/reject', async (req, res) => {
  try {
    const { id } = req.params;
    const { token } = req.query;

    const budget = await Budget.findById(id).populate({
      path: 'client',
      select: 'name email',
      model: 'user',
    });

    if (!budget) return res.status(404).send('Presupuesto no encontrado.');
    if (!token || token !== budget.clientToken)
      return res.status(403).send('Token inválido.');

    if (budget.status === 'approved')
      return res.send('Este presupuesto ya fue aprobado anteriormente.');
    if (budget.status === 'rejected')
      return res.send('Este presupuesto ya había sido rechazado.');

    budget.status = 'rejected';
    budget.rejectedAt = new Date();
    await budget.save();

    return res.send(
      'El presupuesto fue rechazado. Gracias por tu respuesta. Si querés, podés contactarnos para revisar alternativas.'
    );
  } catch (err) {
    console.error('publicRejectBudget error', err);
    return res.status(500).send('No se pudo procesar el rechazo del presupuesto.');
  }
});

/* PANEL (PROTEGIDAS) */
router.use(isAuth);
router.use(isAdminOrOperator);

/*Crear presupuesto (desde reserva) POST /api/budgets */

router.post('/', async (req, res) => {
  try {
    const { reservationId, currency = 'UYU', notes = '', items = [] } =
      req.body || {};

    if (!reservationId) {
      return res.status(400).json({ message: 'reservationId es requerido' });
    }

    const reservation = await Reservation.findById(reservationId)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      });

    if (!reservation)
      return res.status(404).json({ message: 'Reserva no encontrada' });

    if (reservation.serviceType !== 'revision') {
      return res.status(400).json({
        message: 'Solo se pueden generar presupuestos desde reservas de revisión',
      });
    }

    const clientId = reservation.client?._id;
    if (!clientId) {
      return res
        .status(400)
        .json({ message: 'La reserva no tiene un cliente asociado' });
    }

    const vehicleId = reservation.vehicle?._id;

    const budgetDoc = await Budget.create({
      client: clientId,
      vehicle: vehicleId || undefined,
      reservation: reservation._id,
      status: 'draft',
      currency,
      notes,
      items: mapPayloadItemsToBudgetItems(items),
    });

    const budget = await Budget.findById(budgetDoc._id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status')
      .populate('workOrder');

    return res.status(201).json(budget);
  } catch (err) {
    console.error('createBudgetFromReservation error', err);
    return res.status(500).json({
      message: err.message || 'Error al crear el presupuesto desde la reserva',
    });
  }
});

/* Panel CRUD */

// GET /api/budgets
router.get('/', async (req, res) => {
  try {
    const budgets = await Budget.find()
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status')
      .populate('workOrder')
      .sort({ createdAt: -1 });

    return res.json(budgets);
  } catch (err) {
    console.error('listBudgets error', err);
    return res.status(500).json({ message: 'Error al listar presupuestos.' });
  }
});

// GET /api/budgets/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findById(id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status')
      .populate('workOrder');

    if (!budget)
      return res.status(404).json({ message: 'Presupuesto no encontrado.' });

    return res.json(budget);
  } catch (err) {
    console.error('getBudgetById error', err);
    return res.status(500).json({ message: 'Error al obtener el presupuesto.' });
  }
});

// PUT /api/budgets/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, items } = req.body;

    let budget = await Budget.findById(id);
    if (!budget)
      return res.status(404).json({ message: 'Presupuesto no encontrado.' });

    const prevStatus = budget.status;

    if (status) {
      if (!['draft', 'sent', 'approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Estado inválido.' });
      }
      budget.status = status;
    }

    if (typeof notes === 'string') budget.notes = notes;
    if (Array.isArray(items)) budget.items = mapPayloadItemsToBudgetItems(items);

    await budget.save();

    if (budget.status === 'approved' && prevStatus !== 'approved') {
      try {
        await discountStockForBudgetProducts(budget._id);
      } catch (err) {
        return res.status(409).json({ message: err.message });
      }
    }

    budget = await Budget.findById(id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status')
      .populate('workOrder');

    return res.json(budget);
  } catch (err) {
    console.error('updateBudget error', err);
    return res.status(500).json({ message: 'Error al actualizar el presupuesto.' });
  }
});

/* Enviar al cliente + PDF */

// POST /api/budgets/:id/send
router.post('/:id/send', async (req, res) => {
  try {
    const { id } = req.params;
    const { notes, items } = req.body || {};

    let budget = await Budget.findById(id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status')
      .populate('workOrder');

    if (!budget) return res.status(404).json({ message: 'Presupuesto no encontrado' });
    if (!budget.client?.email)
      return res.status(400).json({ message: 'El cliente no tiene un email válido' });

    if (Array.isArray(items)) budget.items = mapPayloadItemsToBudgetItems(items);
    if (typeof notes === 'string') budget.notes = notes;

    if (budget.status === 'draft') budget.status = 'sent';

    if (!budget.clientToken) budget.clientToken = crypto.randomBytes(20).toString('hex');

    await budget.save();

    budget = await Budget.findById(id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status')
      .populate('workOrder');

    const pdfBuffer = await buildBudgetPdfBuffer(budget);

    const backendUrl = process.env.BACKEND_PUBLIC_URL || 'http://localhost:5000';

    const approveUrl = `${backendUrl}/api/budgets/${budget._id}/public/approve?token=${budget.clientToken}`;
    const rejectUrl = `${backendUrl}/api/budgets/${budget._id}/public/reject?token=${budget.clientToken}`;

    const v = budget.vehicle;
    const brandName = v?.brand?.name || v?.brand || '';
    const vehicleLabel =
      v?.licensePlate || [brandName, v?.model].filter(Boolean).join(' ') || 'vehículo';

    const subject = `Presupuesto de servicio - ${vehicleLabel}`;

    const html = `
      <p>Hola ${budget.client?.name || ''},</p>
      <p>Te enviamos el presupuesto para el trabajo en tu vehículo ${brandName ? brandName + ' ' : ''}${v?.model || ''}.</p>
      <p>Adjuntamos el presupuesto en formato PDF.</p>
      <p>Podés aprobar o rechazar el presupuesto desde estos enlaces:</p>
      <p>
        ✅ <a href="${approveUrl}">Aprobar presupuesto</a><br/>
        ❌ <a href="${rejectUrl}">Rechazar presupuesto</a>
      </p>
      <p>Saludos,<br/>Chapacar Repuestos & Taller</p>
    `;

    await sendMail({
      to: budget.client.email,
      subject,
      html,
      attachments: [
        {
          filename: `presupuesto-${budget._id}.pdf`,
          content: pdfBuffer,
          contentType: 'application/pdf',
        },
      ],
    });

    return res.json({ message: 'Presupuesto enviado al cliente', budget });
  } catch (err) {
    console.error('sendBudgetToClient error', err);
    return res.status(500).json({
      message: err.message || 'No se pudo enviar el presupuesto al cliente',
    });
  }
});

// GET /api/budgets/:id/pdf
router.get('/:id/pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const budget = await Budget.findById(id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status')
      .populate('workOrder');

    if (!budget) return res.status(404).json({ message: 'Presupuesto no encontrado' });

    const pdfBuffer = await buildBudgetPdfBuffer(budget);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="presupuesto-${budget._id}.pdf"`
    );
    return res.send(pdfBuffer);
  } catch (err) {
    console.error('getBudgetPdf error', err);
    return res.status(500).json({ message: 'No se pudo generar el PDF del presupuesto' });
  }
});

/* ✅ Crear OT manual desde presupuesto aprobado POST /api/budgets/:id/work-order */
router.post('/:id/work-order', async (req, res) => {
  try {
    const { id } = req.params; // budgetId
    const { tasks = [], notes = '' } = req.body || {};

    const budget = await Budget.findById(id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status');

    if (!budget) return res.status(404).json({ message: 'Presupuesto no encontrado.' });

    if (budget.status !== 'approved') {
      return res.status(400).json({
        message: 'Solo se puede crear OT desde un presupuesto APROBADO.',
      });
    }

    if (budget.workOrder) {
      return res.status(409).json({
        message: 'Este presupuesto ya tiene una OT creada.',
        workOrderId: budget.workOrder,
      });
    }

    const lastWo = await WorkOrder.findOne().sort({ number: -1 }).lean();
    const nextNumber = lastWo?.number ? lastWo.number + 1 : 1;

    const woItems = (budget.items || []).map((it) => ({
      type: it.type || (it.product ? 'product' : 'other'),
      product: it.product || undefined,
      productName: it.productName,
      productSku: it.productSku,
      productImage: it.productImage,
      description: it.description,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
    }));

    const cleanTasks = Array.isArray(tasks)
      ? tasks
          .map((t) => {
            if (typeof t === 'string') return { description: t.trim(), done: false };
            return {
              description: String(t?.description || '').trim(),
              done: !!t?.done,
            };
          })
          .filter((t) => t.description.length > 0)
      : [];

    const wo = await WorkOrder.create({
      number: nextNumber,
      budget: budget._id,
      reservation: budget.reservation?._id || budget.reservation || undefined,
      client: budget.client?._id || budget.client,
      vehicle: budget.vehicle?._id || budget.vehicle || undefined,
      status: 'open',
      notes: (notes || budget.notes || '').trim() || undefined,
      items: woItems,
      tasks: cleanTasks,
    });

    budget.workOrder = wo._id;
    await budget.save();

    if (budget.reservation) {
      await Reservation.findByIdAndUpdate(budget.reservation, {
        workOrder: wo._id,
        budget: budget._id,
      });
    }

    const populatedWo = await WorkOrder.findById(wo._id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status');

    return res.status(201).json(populatedWo);
  } catch (err) {
    console.error('createWorkOrderFromBudget error', err);
    return res.status(500).json({
      message: err.message || 'Error al crear la OT desde el presupuesto.',
    });
  }
});

export default router;
