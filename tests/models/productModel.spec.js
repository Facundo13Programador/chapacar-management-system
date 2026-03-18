/**
 * Tests del modelo Product con datos virtuales precargados.
 * Requiere Brand y Category creados (refs).
 */
import { expect } from 'chai';
import Product from '../../models/productModel.js';
import Category from '../../models/categoryModel.js';
import Brand from '../../models/brandModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

describe('Modelo de producto, IVA y relaciones', function () {
  let brandId;
  let categoryIds;

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
  });

  describe('creación con datos virtuales', function () {
    it('crea un producto con refs a brand y categories', async function () {
      const product = new Product(fixtures.product(brandId, categoryIds));
      const saved = await product.save();
      expect(saved).to.have.property('_id');
      expect(saved.name).to.equal('Filtro de aceite premium');
      expect(saved.code).to.equal('FIL-ACE-001');
      expect(saved.price).to.equal(25.5);
      expect(saved.countInStock).to.equal(50);
      expect(saved.iva).to.equal(22);
      expect(saved.brand.toString()).to.equal(brandId.toString());
      expect(saved.categories.map((c) => c.toString())).to.have.members(
        categoryIds.map((id) => id.toString())
      );
    });

    it('autogenera slug y fuerza iva 22 (pre-validate)', async function () {
      const product = new Product({
        name: 'Producto Sin Slug',
        code: 'COD-001',
        description: 'Desc',
        price: 10,
        countInStock: 0,
        brand: brandId,
        categories: [categoryIds[0]],
      });
      const saved = await product.save();
      expect(saved.slug).to.equal('producto-sin-slug');
      expect(saved.iva).to.equal(22);
    });

    it('rechaza price negativo', async function () {
      const product = new Product({
        ...fixtures.product(brandId, categoryIds),
        price: -1,
      });
      try {
        await product.save();
        expect.fail('debería haber fallado validación');
      } catch (err) {
        expect(err.name).to.equal('ValidationError');
      }
    });

    it('rechaza code duplicado (unique)', async function () {
      await Product.create(fixtures.product(brandId, categoryIds));
      const product2 = new Product({
        ...fixtures.product(brandId, categoryIds),
        name: 'Otro nombre',
        slug: 'otro-slug',
        code: 'FIL-ACE-001',
      });
      try {
        await product2.save();
        expect.fail('debería haber fallado por unique');
      } catch (err) {
        expect(err.code).to.equal(11000);
      }
    });
  });

  describe('listado con populate', function () {
    beforeEach(async function () {
      await Product.create(fixtures.product(brandId, categoryIds));
    });

    it('populate brand y categories devuelve documentos', async function () {
      const product = await Product.findOne({ code: 'FIL-ACE-001' })
        .populate('brand')
        .populate('categories')
        .lean();
      expect(product.brand).to.have.property('name', 'Bosch');
      expect(product.categories).to.have.lengthOf(2);
    });
  });
});
