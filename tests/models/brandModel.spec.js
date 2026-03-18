/**
 * Tests del modelo Brand con datos virtuales precargados.
 */
import { expect } from 'chai';
import Brand from '../../models/brandModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

describe('Modelo de marca y contador virtual de modelos', function () {
  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(clearCollections);

  describe('creación con datos virtuales', function () {
    it('crea una marca con datos del fixture', async function () {
      const brand = new Brand(fixtures.brand);
      const saved = await brand.save();
      expect(saved).to.have.property('_id');
      expect(saved.name).to.equal('Bosch');
      expect(saved.slug).to.equal('bosch');
      expect(saved.models).to.deep.equal(['ABC-100', 'XYZ-200']);
    });

    it('autogenera slug si solo se pasa name', async function () {
      const brand = new Brand({ name: 'Gates Corporation' });
      const saved = await brand.save();
      expect(saved.slug).to.equal('gates-corporation');
    });

    it('virtual modelsCount devuelve la cantidad de modelos', async function () {
      const brand = await Brand.create(fixtures.brand);
      expect(brand.modelsCount).to.equal(2);
      const empty = await Brand.create(fixtures.brand2);
      expect(empty.modelsCount).to.equal(0);
    });

    it('rechaza name duplicado (unique)', async function () {
      await Brand.create(fixtures.brand);
      const brand2 = new Brand({ name: 'Bosch', slug: 'bosch-2' });
      try {
        await brand2.save();
        expect.fail('debería haber fallado por unique');
      } catch (err) {
        expect(err.code).to.equal(11000);
      }
    });
  });

  describe('listado', function () {
    beforeEach(async function () {
      await Brand.create([fixtures.brand, fixtures.brand2]);
    });

    it('encuentra todas las marcas precargadas', async function () {
      const list = await Brand.find({}).lean();
      expect(list).to.have.lengthOf(2);
      expect(list.map((b) => b.name).sort()).to.deep.equal(['Bosch', 'Gates']);
    });
  });
});
