// routes/productRoutes.js
import express from 'express';
import jwt from 'jsonwebtoken';
import Product from '../models/productModel.js';
import { requirePermission, SCOPES } from '../utils/permissions.js';

const router = express.Router();

//  MIDDLEWARE AUTH (para rutas ADMIN)
const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autenticado: falta token' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    console.error('JWT error (products):', err.message);
    return res.status(401).json({ message: 'Token inválido o expirado' });
  }
};

//  RUTAS PÚBLICAS

// GET /api/products/public  -> lista visible para cualquiera (con filtros)
router.get('/public', async (req, res) => {
  try {
    const { brand, model, category, sku } = req.query;

    const filter = {
      isActive: true,
    };

    if (brand) {
      filter.brand = brand;
    }

    if (category) {
      filter.categories = { $in: [category] };
    }

    if (model) {
    }

    if (sku) {
      const regex = new RegExp(sku, 'i');
      filter.$or = [{ code: regex }, { name: regex }];
    }

    const products = await Product.find(filter)
      .populate('brand', 'name')
      .populate('categories', 'name')
      .select('name code price countInStock images brand categories iva slug')
      .sort({ createdAt: -1 });

    res.json(products);
  } catch (err) {
    console.error('listPublicProducts error', err);
    res.status(500).json({ message: 'Error al listar productos públicos' });
  }
});

// GET /api/products/public/:id  -> detalle visible para cualquiera
router.get('/public/:id', async (req, res) => {
  try {
    const prod = await Product.findById(req.params.id)
      .populate('brand', 'name')
      .populate('categories', 'name')
      .select(
        'name code description price countInStock brand categories images iva isActive slug'
      );

    if (!prod || !prod.isActive) {
      return res.status(404).json({ message: 'Producto no encontrado' });
    }

    res.json(prod);
  } catch (err) {
    console.error('getPublicProduct error', err);
    res.status(500).json({ message: 'Error al obtener el producto público' });
  }
});

//  RUTAS ADMIN (PROTEGIDAS)

// GET /api/products  -> listado para panel admin (ve todo)
router.get(
  '/',
  authenticate,
  requirePermission('products', [SCOPES.canView]),
  async (req, res, next) => {
    try {
      const list = await Product.find({})
        .populate('brand', 'name')
        .populate('categories', 'name')
        .sort({ createdAt: -1 });

      res.json(list);
    } catch (e) {
      next(e);
    }
  }
);

// GET /api/products/:id -> detalle admin (también ve inactivos)
router.get(
  '/:id',
  authenticate,
  requirePermission('products', [SCOPES.canView]),
  async (req, res) => {
    try {
      const prod = await Product.findById(req.params.id)
        .populate('brand', 'name')
        .populate('categories', 'name');

      if (!prod) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }
      res.json(prod);
    } catch (err) {
      console.error('Error get /products/:id:', err);
      res.status(500).json({ message: 'Error al obtener el producto' });
    }
  }
);

// POST /api/products  -> crear (sólo admin)
router.post(
  '/',
  authenticate,
  requirePermission('products', [SCOPES.canCreate]),
  async (req, res) => {
    try {
      const {
        name,
        code,
        description,
        price,
        countInStock,
        brand,
        categories,
        images,
        isActive,
      } = req.body;

      if (
        !name ||
        !code ||
        !description ||
        price == null ||
        !brand ||
        !categories?.length
      ) {
        return res
          .status(400)
          .json({ message: 'Faltan datos obligatorios del producto' });
      }

      const product = new Product({
        name,
        code,
        description,
        price,
        countInStock: countInStock ?? 0,
        brand,
        categories,
        images: images || [],
        isActive: isActive ?? true,
      });

      if (typeof product.ensureSingleMainImage === 'function') {
        product.ensureSingleMainImage();
      }

      const saved = await product.save();
      res.status(201).json(saved);
    } catch (err) {
      console.error('Error post /products:', err);
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ message: 'Ya existe un producto con ese código o slug' });
      }
      res.status(500).json({ message: 'Error al crear el producto' });
    }
  }
);

// PUT /api/products/:id  -> editar (sólo admin)
router.put(
  '/:id',
  authenticate,
  requirePermission('products', [SCOPES.canEdit]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const {
        name,
        code,
        description,
        price,
        countInStock,
        brand,
        categories,
        images,
        isActive,
      } = req.body;

      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      if (name !== undefined) product.name = name;
      if (code !== undefined) product.code = code;
      if (description !== undefined) product.description = description;
      if (price !== undefined) product.price = price;
      if (countInStock !== undefined) product.countInStock = countInStock;
      if (brand !== undefined) product.brand = brand;
      if (categories !== undefined) product.categories = categories;
      if (images !== undefined) product.images = images;
      if (isActive !== undefined) product.isActive = isActive;

      if (typeof product.ensureSingleMainImage === 'function') {
        product.ensureSingleMainImage();
      }

      const updated = await product.save();
      res.json(updated);
    } catch (err) {
      console.error('Error put /products/:id:', err);
      if (err.code === 11000) {
        return res
          .status(400)
          .json({ message: 'Ya existe un producto con ese código o slug' });
      }
      res.status(500).json({ message: 'Error al actualizar el producto' });
    }
  }
);

// DELETE /api/products/:id  -> desactivar (sólo admin)
router.delete(
  '/:id',
  authenticate,
  requirePermission('products', [SCOPES.canDelete]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const product = await Product.findById(id);
      if (!product) {
        return res.status(404).json({ message: 'Producto no encontrado' });
      }

      product.isActive = false;
      await product.save();

      res.json({ message: 'Producto desactivado' });
    } catch (err) {
      console.error('Error delete /products/:id:', err);
      res.status(500).json({ message: 'Error al eliminar el producto' });
    }
  }
);

export default router;
