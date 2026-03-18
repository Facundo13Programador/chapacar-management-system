/**
 * Tests del modelo Category con datos virtuales precargados.
 * Chai + Mocha + mongoose.
 */
import { expect } from 'chai';
import Category from '../../models/categoryModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

describe('Modelo de categorias y generacion de slug', function () {
  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(clearCollections);

  describe('creación con datos virtuales', function () {
    it('crea una categoría con nombre y slug del fixture', async function () {
      const cat = new Category(fixtures.category);
      const saved = await cat.save();
      expect(saved).to.have.property('_id');
      expect(saved.name).to.equal('Filtros de aceite');
      expect(saved.slug).to.equal('filtros-de-aceite');
      expect(saved).to.have.property('createdAt');
      expect(saved).to.have.property('updatedAt');
    });

    it('autogenera slug si solo se pasa name (pre-validate)', async function () {
      const cat = new Category({ name: 'Embragues y discos' });
      const saved = await cat.save();
      expect(saved.slug).to.equal('embragues-y-discos');
    });

    it('rechaza categoría sin name (required)', async function () {
      const cat = new Category({ slug: 'solo-slug' });
      try {
        await cat.save();
        expect.fail('debería haber lanzado validación');
      } catch (err) {
        expect(err.name).to.equal('ValidationError');
      }
    });

    it('rechaza slug duplicado (unique)', async function () {
      await Category.create(fixtures.category);
      const cat2 = new Category({ name: 'Otro nombre', slug: fixtures.category.slug });
      try {
        await cat2.save();
        expect.fail('debería haber fallado por unique');
      } catch (err) {
        expect(err.code).to.equal(11000);
      }
    });
  });

  describe('listado y búsqueda', function () {
    beforeEach(async function () {
      await Category.create([fixtures.category, fixtures.category2]);
    });

    it('encuentra todas las categorías precargadas', async function () {
      const list = await Category.find({}).lean();
      expect(list).to.have.lengthOf(2);
      const names = list.map((c) => c.name).sort();
      expect(names).to.deep.equal(['Filtros de aceite', 'Pastillas de freno']);
    });

    it('encuentra por slug', async function () {
      const one = await Category.findOne({ slug: 'pastillas-de-freno' }).lean();
      expect(one).to.not.be.null;
      expect(one.name).to.equal('Pastillas de freno');
    });
  });
});
