/**
 * Tests de rutas de productos: público (listado, detalle) y privado (admin).
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import jwt from 'jsonwebtoken';
import { expect } from 'chai';
import request from 'supertest';
import productRouter from '../../routes/productRoutes.js';
import Product from '../../models/productModel.js';
import Brand from '../../models/brandModel.js';
import Category from '../../models/categoryModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

const app = express();
app.use(express.json());
app.use('/api/products', productRouter);

function makeToken(role = 'system_admin') {
  return jwt.sign(
    { id: 'fake-id', name: 'Admin', email: 'admin@test.com', role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

describe('Catalogo de productos y acceso', function () {
  let brandId;
  let categoryIds;
  let productId;

  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(async function () {
    await clearCollections();
    const [brand, cat1, cat2] = await Promise.all([
      Brand.create(fixtures.brand),
      Category.create(fixtures.category),
      Category.create(fixtures.category2),
    ]);
    brandId = brand._id;
    categoryIds = [cat1._id, cat2._id];
    const product = await Product.create(fixtures.product(brandId, categoryIds));
    productId = product._id;
  });

  describe('GET /api/products/public', function () {
    it('devuelve lista de productos activos sin autenticación', async function () {
      const res = await request(app)
        .get('/api/products/public')
        .expect(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0]).to.have.property('name');
      expect(res.body[0]).to.have.property('code');
      expect(res.body[0]).to.have.property('price');
      expect(res.body[0].name).to.equal('Filtro de aceite premium');
    });

    it('no devuelve productos inactivos', async function () {
      await Product.findByIdAndUpdate(productId, { isActive: false });
      const res = await request(app).get('/api/products/public').expect(200);
      expect(res.body).to.have.lengthOf(0);
    });

    it('filtra por categoría con query category', async function () {
      const res = await request(app)
        .get(`/api/products/public?category=${categoryIds[0]}`)
        .expect(200);
      expect(res.body).to.have.lengthOf(1);
    });
  });

  describe('GET /api/products/public/:id', function () {
    it('devuelve detalle del producto por id', async function () {
      const res = await request(app)
        .get(`/api/products/public/${productId}`)
        .expect(200);
      expect(res.body).to.have.property('_id');
      expect(res.body.name).to.equal('Filtro de aceite premium');
      expect(res.body).to.have.property('description');
    });

    it('devuelve 404 si el producto no existe', async function () {
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/products/public/${fakeId}`)
        .expect(404);
      expect(res.body.message).to.include('no encontrado');
    });

    it('devuelve 404 si el producto está inactivo', async function () {
      await Product.findByIdAndUpdate(productId, { isActive: false });
      await request(app)
        .get(`/api/products/public/${productId}`)
        .expect(404);
    });
  });

  describe('GET /api/products (privado)', function () {
    it('devuelve 401 sin token', async function () {
      await request(app).get('/api/products').expect(401);
    });

    it('devuelve 200 y listado con token de system_admin', async function () {
      const token = makeToken('system_admin');
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf(1);
    });

    it('devuelve 200 con token de client (tiene canView en products)', async function () {
      const token = makeToken('client');
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).to.be.an('array');
    });
  });

  describe('POST /api/products (privado)', function () {
    it('crea producto con token de system_admin y datos válidos', async function () {
      const token = makeToken('system_admin');
      const payload = {
        name: 'Filtro de aire',
        code: 'FIL-AIR-001',
        description: 'Filtro de aire para motor',
        price: 15,
        countInStock: 20,
        brand: brandId,
        categories: [categoryIds[0]],
      };
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send(payload)
        .expect(201);
      expect(res.body).to.have.property('_id');
      expect(res.body.name).to.equal('Filtro de aire');
      expect(res.body.code).to.equal('FIL-AIR-001');
      const found = await Product.findOne({ code: 'FIL-AIR-001' });
      expect(found).to.not.be.null;
    });

    it('devuelve 400 si faltan datos obligatorios', async function () {
      const token = makeToken('system_admin');
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Solo nombre' })
        .expect(400);
      expect(res.body.message).to.include('Faltan datos');
    });

    it('devuelve 401 sin token', async function () {
      await request(app)
        .post('/api/products')
        .send({ name: 'X', code: 'X', description: 'X', price: 1, brand: brandId, categories: categoryIds })
        .expect(401);
    });
  });
});
