/**
 * Tests de la ruta del chatbot. Sin mensaje no se llama a OpenAI.
 * La integración con OpenAI (clasificación y respuesta) se prueba en utils/chatClassifier.spec.js con mocks.
 */
import '../config/setupFetch.js';
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { expect } from 'chai';
import request from 'supertest';
import chatBotRoutes from '../../routes/chatBotRoutes.js';

const app = express();
app.use(express.json());
app.use('/api/chat', chatBotRoutes);

describe('Interaccion basica con chatbot', function () {
  describe('POST /api/chat', function () {
    it('devuelve mensaje por defecto cuando no se envía message (no llama a OpenAI)', async function () {
      const res = await request(app)
        .post('/api/chat')
        .send({})
        .expect(200);
      expect(res.body).to.have.property('answer');
      expect(res.body.answer).to.include('marca');
      expect(res.body.answer).to.include('repuesto');
    });

    it('devuelve mensaje por defecto cuando message está vacío', async function () {
      const res = await request(app)
        .post('/api/chat')
        .send({ message: '   ' })
        .expect(200);
      expect(res.body.answer).to.be.a('string');
      expect(res.body.answer.length).to.be.greaterThan(0);
    });
  });
});
