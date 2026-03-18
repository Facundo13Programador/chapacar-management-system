/**
 * Tests de rutas de marcas (brands): público y privado con permisos.
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import jwt from 'jsonwebtoken';
import { expect } from 'chai';
import request from 'supertest';
import brandRoutes from '../../routes/brandRoutes.js';
import Brand from '../../models/brandModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

const app = express();
app.use(express.json());
app.use('/api/brands', brandRoutes);

function makeToken(role = 'system_admin') {
  return jwt.sign(
    { id: 'fake-id', name: 'Admin', email: 'admin@test.com', role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: '15m' }
  );
}

describe('Gestion de marcas por API', function () {
  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(clearCollections);

  describe('GET /api/brands/public', function () {
    it('devuelve lista de marcas sin autenticación', async function () {
      await Brand.create([fixtures.brand, fixtures.brand2]);
      const res = await request(app)
        .get('/api/brands/public')
        .expect(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf(2);
      expect(res.body[0]).to.have.property('name');
      expect(res.body[0]).to.have.property('slug');
      expect(res.body[0]).to.have.property('_id');
    });

    it('devuelve array vacío si no hay marcas', async function () {
      const res = await request(app).get('/api/brands/public').expect(200);
      expect(res.body).to.deep.equal([]);
    });
  });

  describe('GET /api/brands (privado)', function () {
    it('devuelve 401 sin token', async function () {
      await request(app).get('/api/brands').expect(401);
    });

    it('devuelve 200 y listado con token de system_admin', async function () {
      await Brand.create(fixtures.brand);
      const token = makeToken('system_admin');
      const res = await request(app)
        .get('/api/brands')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).to.be.an('array');
      expect(res.body).to.have.lengthOf(1);
      expect(res.body[0].name).to.equal('Bosch');
    });

    it('devuelve 403 con token de client', async function () {
      const token = makeToken('client');
      const res = await request(app)
        .get('/api/brands')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
      expect(res.body.message).to.include('Not authorized');
    });
  });

  describe('GET /api/brands/:id (privado)', function () {
    it('devuelve 200 y la marca con token válido', async function () {
      const brand = await Brand.create(fixtures.brand);
      const token = makeToken('system_admin');
      const res = await request(app)
        .get(`/api/brands/${brand._id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body.name).to.equal('Bosch');
      expect(res.body.slug).to.equal('bosch');
    });

    it('devuelve 404 si la marca no existe', async function () {
      const token = makeToken('system_admin');
      const fakeId = '507f1f77bcf86cd799439011';
      const res = await request(app)
        .get(`/api/brands/${fakeId}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      expect(res.body.message).to.include('no encontrada');
    });
  });

  describe('POST /api/brands (privado)', function () {
    it('crea marca con token de system_admin', async function () {
      const token = makeToken('system_admin');
      const res = await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Continental', slug: 'continental' })
        .expect(201);
      expect(res.body).to.have.property('_id');
      expect(res.body.name).to.equal('Continental');
      const found = await Brand.findOne({ slug: 'continental' });
      expect(found).to.not.be.null;
    });

    it('devuelve 401 sin token', async function () {
      await request(app)
        .post('/api/brands')
        .send({ name: 'Test', slug: 'test' })
        .expect(401);
    });

    it('devuelve 403 con token de client', async function () {
      const token = makeToken('client');
      await request(app)
        .post('/api/brands')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Test', slug: 'test' })
        .expect(403);
    });
  });
});
