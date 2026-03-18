// routes/orderRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import Order from '../models/orderModel.js';
import Product from '../models/productModel.js';
import { requirePermission, SCOPES } from '../utils/permissions.js';

const orderRouter = express.Router();

// Middleware de auth 
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado: falta token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = decoded; // { id, ... }
    next();
  } catch (err) {
    console.error('JWT error (orders):', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

// POST /api/orders  -> crear orden para el usuario logueado
orderRouter.post('/', authenticate, async (req, res, next) => {
  try {
    const {
      items,
      paymentMethod,
      deliveryMethod,
      phone,
      address,
      notes,
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res
        .status(400)
        .json({ message: 'La orden debe tener al menos un producto' });
    }

    if (!phone || !phone.trim()) {
      return res.status(400).json({ message: 'El teléfono es obligatorio' });
    }

    if (deliveryMethod === 'envio' && (!address || !address.trim())) {
      return res
        .status(400)
        .json({ message: 'La dirección es obligatoria para envíos' });
    }

    const normalizedItems = items.map((it) => ({
      product: it.productId,
      name: it.name,
      price: Number(it.price) || 0,
      qty: Number(it.qty) || 1,
    }));

    const productIds = normalizedItems.map((it) => it.product);

    const dbProducts = await Product.find({
      _id: { $in: productIds },
      isActive: true,
    }).select('name countInStock');

    const productMap = new Map(dbProducts.map((p) => [String(p._id), p]));

    for (const it of normalizedItems) {
      const p = productMap.get(String(it.product));
      if (!p) {
        return res.status(400).json({
          message: `El producto "${it.name}" ya no está disponible o fue desactivado.`,
        });
      }

      if (p.countInStock < it.qty) {
        return res.status(400).json({
          message: `Stock insuficiente para "${p.name}". Disponible: ${p.countInStock}, solicitado: ${it.qty}.`,
        });
      }
    }

    const subtotalCalc = normalizedItems.reduce(
      (acc, it) => acc + it.price * it.qty,
      0
    );

    const totalCalc = subtotalCalc; 
    const order = new Order({
      user: req.user.id,
      items: normalizedItems,
      paymentMethod,
      deliveryMethod,
      phone: phone.trim(),
      address:
        deliveryMethod === 'envio' && address ? address.trim() : undefined,
      notes: notes || undefined,
      subtotal: subtotalCalc,
      total: totalCalc,
    });

    const saved = await order.save();

    try {
      const updates = normalizedItems.map((it) =>
        Product.updateOne(
          { _id: it.product },
          { $inc: { countInStock: -it.qty } }
        )
      );
      await Promise.all(updates);
    } catch (stockErr) {
      console.error(
        'Error al descontar stock luego de crear la orden:',
        stockErr
      );
    }

    res.status(201).json(saved);
  } catch (e) {
    next(e);
  }
});

orderRouter.put(
  '/:id/status',
  authenticate,
  requirePermission('orders', [SCOPES.canEdit]),
  async (req, res, next) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const allowed = [
        'pending',
        'confirmed',
        'preparing',
        'completed',
        'cancelled',
      ];

      if (!status || !allowed.includes(status)) {
        return res
          .status(400)
          .json({ message: 'Estado inválido para la orden' });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ message: 'Orden no encontrada' });
      }

      const oldStatus = order.status;

      if (oldStatus === 'cancelled' && status !== 'cancelled') {
        return res.status(400).json({
          message: 'No se puede cambiar el estado de una orden cancelada.',
        });
      }

      if (oldStatus === status) {
        return res.json(order);
      }

      order.status = status;
      const saved = await order.save();

      if (oldStatus !== 'cancelled' && status === 'cancelled') {
        try {
          const updates = order.items.map((it) =>
            Product.updateOne(
              { _id: it.product },
              { $inc: { countInStock: it.qty } }
            )
          );
          await Promise.all(updates);
        } catch (stockErr) {
          console.error(
            'Error al devolver stock al cancelar la orden:',
            stockErr
          );
        }
      }

      res.json(saved);
    } catch (e) {
      next(e);
    }
  }
);



// GET /api/orders  -> listado ADMIN de todas las órdenes
orderRouter.get(
  '/',
  authenticate,
  requirePermission('orders', [SCOPES.canView]),
  async (req, res, next) => {
    try {
      const { status } = req.query;

      const filter = {};
      if (status) {
        filter.status = status; 
      }

      const orders = await Order.find(filter)
        .sort({ createdAt: -1 })
        .select('-__v')
        .populate('user', 'name email');

      res.json(orders);
    } catch (e) {
      next(e);
    }
  }
);



// GET /api/orders/my  -> órdenes del usuario logueado
orderRouter.get('/my', authenticate, async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v');

    res.json(orders);
  } catch (e) {
    next(e);
  }
});



// GET /api/orders/:id  -> detalle de una orden propia
orderRouter.get('/:id', authenticate, async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('items.product', 'name code') 
      .exec();

    if (!order) {
      return res.status(404).json({ message: 'Orden no encontrada' });
    }

    if (String(order.user) !== String(req.user.id)) {
      return res
        .status(403)
        .json({ message: 'No tienes permiso para ver esta orden' });
    }

    res.json(order);
  } catch (e) {
    next(e);
  }
});

export default orderRouter;
