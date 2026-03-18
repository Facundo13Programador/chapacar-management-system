// routes/brandRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import { requirePermission, SCOPES } from '../utils/permissions.js';
import Brand from '../models/brandModel.js';

const router = express.Router();

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
    console.error('JWT error (brands):', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

router.get('/public', async (req, res, next) => {
  try {
    const brands = await Brand.find({}, '_id name slug models').sort({ name: 1 });
    res.json(brands);
  } catch (err) {
    next(err);
  }
});


router.get(
  '/',
  authenticate,
  requirePermission('brands', [SCOPES.canView]),
  async (req, res, next) => {
    try {

     const list = await Brand.find({})
       .select('_id name slug models') 
       .sort({ name: 1 });
      res.json(list);
    } catch (e) { next(e); }
  }
);

router.get(
  '/:id',
  authenticate,
  requirePermission('brands', [SCOPES.canView]),
  async (req, res, next) => {
    try {
     
     const brand = await Brand.findById(req.params.id)
       .select('_id name slug models'); 
      if (!brand) return res.status(404).json({ message: 'Marca no encontrada' });
      res.json(brand);
    } catch (e) { next(e); }
  }
);

router.post(
  '/',
  authenticate,
  requirePermission('brands', [SCOPES.canCreate]),
  async (req, res, next) => {
    try {
      const doc = new Brand(req.body);
      await doc.save();
      res.status(201).json(doc);
    } catch (e) {
      if (e?.code === 11000) return res.status(409).json({ message: 'Slug o nombre duplicado' });
      next(e);
    }
  }
);

router.put(
  '/:id',
  authenticate,
  requirePermission('brands', [SCOPES.canEdit]),
  async (req, res, next) => {
    try {
      const doc = await Brand.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
      if (!doc) return res.status(404).json({ message: 'Marca no encontrada' });
      res.json(doc);
    } catch (e) {
      if (e?.code === 11000) return res.status(409).json({ message: 'Slug duplicado' });
      next(e);
    }
  }
);

router.delete(
  '/:id',
  authenticate,
  requirePermission('brands', [SCOPES.canDelete]),
  async (req, res, next) => {
    try {
      const ok = await Brand.findByIdAndDelete(req.params.id);
      if (!ok) return res.status(404).json({ message: 'Marca no encontrada' });
      res.sendStatus(204);
    } catch (e) { next(e); }
  }
);

export default router;
