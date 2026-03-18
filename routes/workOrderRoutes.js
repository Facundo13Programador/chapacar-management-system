// routes/workOrderRoutes.js
import express from 'express';
import '../models/userModel.js';
import WorkOrder from '../models/workOrderModel.js';
import { isAuth, isAdminOrOperator } from '../utils/authUtils.js';

const router = express.Router();

// Todas las rutas de OT son internas del panel
router.use(isAuth);
router.use(isAdminOrOperator);

// GET /api/work-orders

router.get('/', async (req, res) => {
  try {
    const workOrders = await WorkOrder.find()
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status')
      .sort({ createdAt: -1 });

    return res.json(workOrders);
  } catch (err) {
    console.error('listWorkOrders error', err);
    return res
      .status(500)
      .json({ message: 'Error al listar órdenes de trabajo.' });
  }
});

// GET /api/work-orders/:id

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const workOrder = await WorkOrder.findById(id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status');

    if (!workOrder) {
      return res.status(404).json({ message: 'Orden de trabajo no encontrada.' });
    }

    return res.json(workOrder);
  } catch (err) {
    console.error('getWorkOrderById error', err);
    return res
      .status(500)
      .json({ message: 'Error al obtener la orden de trabajo.' });
  }
});

// PUT /api/work-orders/:id

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes, tasks } = req.body || {};

    let workOrder = await WorkOrder.findById(id);
    if (!workOrder) {
      return res.status(404).json({ message: 'Orden de trabajo no encontrada.' });
    }

    if (status) {
      const allowed = ['open', 'in_progress', 'completed', 'cancelled'];
      if (!allowed.includes(status)) {
        return res.status(400).json({ message: 'Estado de OT inválido.' });
      }
      workOrder.status = status;
    }

    if (typeof notes === 'string') {
      workOrder.notes = notes;
    }

    if (Array.isArray(tasks)) {
      workOrder.tasks = tasks
        .map((t) => ({
          description: String(t?.description || '').trim(),
          done: !!t?.done,
        }))
        .filter((t) => t.description.length > 0);
    }

    await workOrder.save();
    
    workOrder = await WorkOrder.findById(id)
      .populate({ path: 'client', select: 'name email', model: 'user' })
      .populate({
        path: 'vehicle',
        populate: { path: 'brand', select: 'name' },
      })
      .populate('reservation', 'dateTime serviceType status');

    return res.json(workOrder);
  } catch (err) {
    console.error('updateWorkOrder error', err);
    return res
      .status(500)
      .json({ message: 'Error al actualizar la orden de trabajo.' });
  }
});

export default router;
