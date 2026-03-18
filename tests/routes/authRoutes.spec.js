/**
 * Tests de rutas de auth con Supertest y datos virtuales precargados.
 */
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { expect } from 'chai';
import request from 'supertest';
import authRouter from '../../routes/authRoutes.js';
import User from '../../models/userModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

const app = express();
app.use(express.json());
app.use('/api/auth', authRouter);

describe('Autenticacion de usuarios', function () {
  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(clearCollections);

  describe('POST /api/auth/login', function () {
    beforeEach(async function () {
      await User.create(fixtures.user);
    });

    it('devuelve 200 y user + accessToken con credenciales válidas (datos virtuales)', async function () {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: fixtures.user.email, password: fixtures.user.password })
        .expect(200);

      expect(res.body).to.have.property('user');
      expect(res.body).to.have.property('accessToken');
      expect(res.body.user.email).to.equal(fixtures.user.email);
      expect(res.body.user.name).to.equal(fixtures.user.name);
      expect(res.body.user.role).to.equal('client');
      expect(res.body.accessToken).to.be.a('string');
    });

    it('devuelve 401 con contraseña incorrecta', async function () {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: fixtures.user.email, password: 'wrong' })
        .expect(401);

      expect(res.body.message).to.include('Credenciales inválidas');
    });

    it('devuelve 401 con email inexistente', async function () {
      await request(app)
        .post('/api/auth/login')
        .send({ email: 'noexiste@test.com', password: 'any' })
        .expect(401);
    });
  });
});
