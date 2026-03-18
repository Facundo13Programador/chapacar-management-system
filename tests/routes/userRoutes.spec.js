/**
 * Tests de rutas de usuarios: GET /me y PUT /me (perfil del usuario logueado).
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import jwt from 'jsonwebtoken';
import { expect } from 'chai';
import request from 'supertest';
import userRouter from '../../routes/userRoutes.js';
import User from '../../models/userModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

const app = express();
app.use(express.json());
app.use('/api/users', userRouter);

describe('Perfil de usuario autenticado', function () {
  let user;
  let token;

  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(async function () {
    await clearCollections();
    user = await User.create(fixtures.user);
    token = jwt.sign(
      { id: user._id.toString(), name: user.name, email: user.email, role: user.role },
      process.env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  });

  describe('GET /api/users/me', function () {
    it('devuelve el usuario logueado (sin password)', async function () {
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);
      expect(res.body).to.have.property('_id');
      expect(res.body.email).to.equal(fixtures.user.email);
      expect(res.body.name).to.equal(fixtures.user.name);
      expect(res.body).to.not.have.property('password');
    });

    it('devuelve 401 sin token', async function () {
      await request(app).get('/api/users/me').expect(401);
    });

    it('devuelve 404 si el usuario ya no existe en BD', async function () {
      await User.findByIdAndDelete(user._id);
      const res = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
      expect(res.body.message).to.include('no encontrado');
    });
  });

  describe('PUT /api/users/me', function () {
    it('actualiza nombre del usuario logueado', async function () {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ name: 'Nombre Actualizado' })
        .expect(200);
      expect(res.body.name).to.equal('Nombre Actualizado');
      expect(res.body.email).to.equal(fixtures.user.email);
      const updated = await User.findById(user._id).lean();
      expect(updated.name).to.equal('Nombre Actualizado');
    });

    it('actualiza teléfono', async function () {
      const res = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: '+54 11 9999-0000' })
        .expect(200);
      expect(res.body.phone).to.equal('+54 11 9999-0000');
    });

    it('devuelve 401 sin token', async function () {
      await request(app)
        .put('/api/users/me')
        .send({ name: 'Otro' })
        .expect(401);
    });
  });
});
