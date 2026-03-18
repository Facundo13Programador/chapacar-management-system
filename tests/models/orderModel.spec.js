/**
 * Tests del modelo Order con datos virtuales precargados.
 */
import { expect } from 'chai';
import Order from '../../models/orderModel.js';
import User from '../../models/userModel.js';
import Product from '../../models/productModel.js';
import Brand from '../../models/brandModel.js';
import Category from '../../models/categoryModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

describe('Modelo de orden de compra y validaciones de negocio', function () {
  let userId;
  let productId;

  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(async function () {
    await clearCollections();
    const [user, brand, cat] = await Promise.all([
      User.create(fixtures.user),
      Brand.create(fixtures.brand),
      Category.create(fixtures.category),
    ]);
    userId = user._id;
    const product = await Product.create(fixtures.product(brand._id, [cat._id]));
    productId = product._id;
  });

  describe('creación con datos virtuales', function () {
    it('crea una orden con items y datos del fixture', async function () {
      const orderData = fixtures.order(userId, productId);
      const order = new Order(orderData);
      const saved = await order.save();
      expect(saved).to.have.property('_id');
      expect(saved.user.toString()).to.equal(userId.toString());
      expect(saved.items).to.have.lengthOf(1);
      expect(saved.items[0].name).to.equal('Filtro aceite');
      expect(saved.items[0].price).to.equal(25.5);
      expect(saved.items[0].qty).to.equal(2);
      expect(saved.phone).to.equal('+54 11 1234-5678');
      expect(saved.paymentMethod).to.equal('transferencia');
      expect(saved.deliveryMethod).to.equal('envio');
      expect(saved.status).to.equal('pending');
      expect(saved.subtotal).to.equal(51);
      expect(saved.total).to.equal(51);
    });

    it('aplica default status pending', async function () {
      const order = await Order.create(fixtures.order(userId, productId));
      expect(order.status).to.equal('pending');
    });

    it('rechaza items vacíos (validación custom)', async function () {
      const order = new Order({
        user: userId,
        items: [],
        phone: '123',
        paymentMethod: 'efectivo',
        deliveryMethod: 'local',
        subtotal: 0,
        total: 0,
      });
      try {
        await order.save();
        expect.fail('debería haber fallado validación');
      } catch (err) {
        expect(err.name).to.equal('ValidationError');
        expect(err.message).to.include('al menos un producto');
      }
    });

    it('rechaza paymentMethod inválido (enum)', async function () {
      const order = new Order({
        ...fixtures.order(userId, productId),
        paymentMethod: 'tarjeta',
      });
      try {
        await order.save();
        expect.fail('debería haber fallado enum');
      } catch (err) {
        expect(err.name).to.equal('ValidationError');
      }
    });

    it('rechaza total negativo', async function () {
      const order = new Order({
        ...fixtures.order(userId, productId),
        total: -1,
      });
      try {
        await order.save();
        expect.fail('debería haber fallado min');
      } catch (err) {
        expect(err.name).to.equal('ValidationError');
      }
    });
  });

  describe('listado', function () {
    beforeEach(async function () {
      await Order.create(fixtures.order(userId, productId));
    });

    it('encuentra órdenes por user', async function () {
      const orders = await Order.find({ user: userId }).lean();
      expect(orders).to.have.lengthOf(1);
      expect(orders[0].items[0].qty).to.equal(2);
    });
  });
});
