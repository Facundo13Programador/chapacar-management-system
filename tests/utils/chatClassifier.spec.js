/**
 * Tests del clasificador de mensajes (OpenAI). Se mockea el cliente de OpenAI
 * para no realizar llamadas reales a la API.
 * setupFetch se importa primero para que el cliente OpenAI no falle al cargar (Node no tiene fetch global).
 */
import '../config/setupFetch.js';
import { expect } from 'chai';
import { extractJsonObject, classifyMessage } from '../../utils/chatClassifier.js';

describe('Clasificacion de mensajes del chatbot', function () {
  describe('extractJsonObject', function () {
    it('parsea JSON plano', function () {
      const raw = '{"intent":"stock_price","brand":"Bosch","part":"filtro"}';
      const out = extractJsonObject(raw);
      expect(out).to.deep.equal({
        intent: 'stock_price',
        brand: 'Bosch',
        part: 'filtro',
      });
    });

    it('parsea JSON envuelto en ```json ... ```', function () {
      const raw = '```json\n{"intent":"other","brand":null}\n```';
      const out = extractJsonObject(raw);
      expect(out.intent).to.equal('other');
      expect(out.brand).to.be.null;
    });

    it('parsea JSON con ``` sin etiqueta json', function () {
      const raw = '```\n{"intent":"stock_price","year":2020}\n```';
      const out = extractJsonObject(raw);
      expect(out.intent).to.equal('stock_price');
      expect(out.year).to.equal(2020);
    });

    it('extrae el primer objeto cuando hay texto extra', function () {
      const raw = 'Aquí está el resultado: {"intent":"stock_price","part":"pastillas"} - listo.';
      const out = extractJsonObject(raw);
      expect(out.intent).to.equal('stock_price');
      expect(out.part).to.equal('pastillas');
    });

    it('devuelve el objeto si raw ya es un objeto (por si se pasa por error)', function () {
      const obj = { intent: 'other' };
      expect(extractJsonObject(obj)).to.equal(obj);
    });

    it('lanza si no hay JSON válido', function () {
      expect(() => extractJsonObject('solo texto')).to.throw(/No se pudo parsear/);
      expect(() => extractJsonObject('')).to.throw(/No se pudo parsear/);
    });
  });

  describe('classifyMessage (con mock de OpenAI)', function () {
    it('devuelve el objeto parseado cuando el mock devuelve JSON válido', async function () {
      const mockResponse = {
        intent: 'stock_price',
        brand: 'Bosch',
        model: null,
        year: 2020,
        part: 'filtro de aceite',
      };
      const mockOpenai = {
        responses: {
          create: async () => ({
            output: [
              {
                content: [
                  { text: JSON.stringify(mockResponse) },
                ],
              },
            ],
          }),
        },
      };

      const result = await classifyMessage('Quiero un filtro Bosch para 2020', {
        openaiClient: mockOpenai,
      });
      expect(result).to.deep.equal(mockResponse);
      expect(result.intent).to.equal('stock_price');
      expect(result.brand).to.equal('Bosch');
    });

    it('devuelve intent "other" cuando el mock devuelve ese intent', async function () {
      const mockOpenai = {
        responses: {
          create: async () => ({
            output: [
              { content: [{ text: '{"intent":"other","brand":null,"model":null,"year":null,"part":null}' }] },
            ],
          }),
        },
      };
      const result = await classifyMessage('Hola, cómo están?', { openaiClient: mockOpenai });
      expect(result.intent).to.equal('other');
    });

    it('parsea respuesta con markdown ```json cuando el mock la devuelve así', async function () {
      const mockOpenai = {
        responses: {
          create: async () => ({
            output: [
              {
                content: [
                  { text: '```json\n{"intent":"stock_price","brand":"Gates","part":"correa"}\n```' },
                ],
              },
            ],
          }),
        },
      };
      const result = await classifyMessage('correa Gates', { openaiClient: mockOpenai });
      expect(result.intent).to.equal('stock_price');
      expect(result.brand).to.equal('Gates');
      expect(result.part).to.equal('correa');
    });

    it('lanza si el mock devuelve texto que no es JSON válido', async function () {
      const mockOpenai = {
        responses: {
          create: async () => ({
            output: [{ content: [{ text: 'respuesta en texto libre sin JSON' }] }],
          }),
        },
      };
      try {
        await classifyMessage('cualquier cosa', { openaiClient: mockOpenai });
        expect.fail('debería haber lanzado');
      } catch (err) {
        expect(err.message).to.match(/No se pudo parsear/);
      }
    });
  });
});
