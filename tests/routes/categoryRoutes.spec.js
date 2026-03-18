/**
 * Tests de rutas de categorías con Supertest y datos virtuales.
 * GET /public (sin auth), GET / y POST / con token de system_admin.
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import jwt from 'jsonwebtoken';
import { expect } from 'chai';
import request from 'supertest';
import categoryRouter from '../../routes/categoryRoutes.js';
import Category from '../../models/categoryModel.js';
import User from '../../models/userModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

const app = express();
app.use(express.json());
app.use('/api/categories', categoryRouter);

function makeToken(role = 'system_admin') {
  return jwt.sign(
    { id: 'fake-id', name: 'Admin', email: 'admin@test.com', role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

describe('Gestion de categorias por API', function () {
  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(clearCollections);

  describe('GET /api/categories/public', function () {
    it('devuelve lista de categorías sin autenticación', async function () {
      await Category.create([fixtures.category, fixtures.category2]);
      const res = await request(app)
        .get('/api/categories/public')
        .expect(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf(2);
      expect(res.body[0]).to.have.property('name');
      expect(res.body[0]).to.have.property('slug');
      expect(res.body[0]).to.have.property('_id');
    });

    it('devuelve array vacío si no hay categorías', async function () {
      const res = await request(app).get('/api/categories/public').expect(200);
      expect(res.body).to.deep.equal([]);
    });
  });

  describe('GET /api/categories (privado)', function () {
    it('devuelve 401 sin token', async function () {
      await request(app).get('/api/categories').expect(401);
    });

    it('devuelve 200 y listado con token de system_admin', async function () {
      await Category.create(fixtures.category);
      const token = makeToken('system_admin');
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0].name).to.equal('Filtros de aceite');
    });

    it('devuelve 403 con token de client (sin permiso categories canView)', async function () {
      const token = makeToken('client');
      const res = await request(app)
        .get('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      expect(res.body.message).to.include('Not authorized');
    });
  });

  describe('POST /api/categories (privado)', function () {
    it('crea categoría con token de system_admin y datos virtuales', async function () {
      const token = makeToken('system_admin');
      const res = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Embragues', slug: 'embragues' })
        .expect(201);
      expect(res.body).to.have.property('_id');
      expect(res.body.name).to.equal('Embragues');
      expect(res.body.slug).to.equal('embragues');
      const found = await Category.findOne({ slug: 'embragues' });
      expect(found).to.not.be.null;
    });

    it('devuelve 401 sin token', async function () {
      await request(app)
        .post('/api/categories')
        .send({ name: 'Test', slug: 'test' })
        .expect(401);
    });

    it('devuelve 403 con token de client', async function () {
      const token = makeToken('client');
      await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', slug: 'test' })
        .expect(403);
    });
  });
});
