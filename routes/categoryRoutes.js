import express from 'express';
import jwt from 'jsonwebtoken';
import Category from '../models/categoryModel.js';
import { requirePermission, SCOPES } from '../utils/permissions.js';

const router = express.Router();

// --- auth middleware ---
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado: falta token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT error (categories):', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

router.get('/public', async (req, res, next) => {
  try {
    const list = await Category.find({})
      .select('_id name slug')
      .sort({ name: 1 });
    res.json(list);
  } catch (e) { next(e); }
});

router.get(
  '/',
  authenticate,
  requirePermission('categories', [SCOPES.canView]),
  async (req, res, next) => {
    try {
      const list = await Category.find({}).sort({ name: 1 });
      res.json(list);
    } catch (e) { next(e); }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('categories', [SCOPES.canCreate]),
  async (req, res, next) => {
    try {
      const cat = new Category(req.body);
      await cat.save();
      res.status(201).json(cat);
    } catch (e) {
      if (e?.code === 11000) return res.status(409).json({ message: 'Slug o nombre duplicado' });
      next(e);
    }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('categories', [SCOPES.canView]),
  async (req, res, next) => {
    try {
      const cat = await Category.findById(req.params.id);
      if (!cat) return res.status(404).json({ message: 'Categoría no encontrada' });
      res.json(cat);
    } catch (e) { next(e); }
  }
);

router.put(
  '/:id',
  authenticate,
  requirePermission('categories', [SCOPES.canEdit]),
  async (req, res, next) => {
    try {
      const cat = await Category.findByIdAndUpdate(
        req.params.id,
        req.body,
        { new: true, runValidators: true }
      );
      if (!cat) return res.status(404).json({ message: 'Categoría no encontrada' });
      res.json(cat);
    } catch (e) {
      if (e?.code === 11000) return res.status(409).json({ message: 'Slug o nombre duplicado' });
      next(e);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('categories', [SCOPES.canDelete]),
  async (req, res, next) => {
    try {
      const ok = await Category.findByIdAndDelete(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Categoría no encontrada' });
      res.sendStatus(204);
    } catch (e) { next(e); }
  }
);

export default router;
