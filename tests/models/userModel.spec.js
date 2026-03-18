/**
 * Tests del modelo User con datos virtuales precargados.
 * Verifica creación, defaults, y hash de password (pre-save).
 */
import { expect } from 'chai';
import bcrypt from 'bcryptjs';
import User from '../../models/userModel.js';
import { beforeTestSuite, afterTestSuite, clearCollections, fixtures } from '../config/test.helper.js';

describe('Modelo de usuario y manejo de credenciales', function () {
  before(beforeTestSuite);
  after(afterTestSuite);
  beforeEach(clearCollections);

  describe('creación con datos virtuales', function () {
    it('crea un usuario con datos del fixture', async function () {
      const user = new User(fixtures.user);
      const saved = await user.save();
      expect(saved).to.have.property('_id');
      expect(saved.name).to.equal('Usuario Test');
      expect(saved.email).to.equal('test@example.com');
      expect(saved.role).to.equal('client');
      expect(saved.isAdmin).to.equal(false);
      expect(saved.password).to.not.equal('password123');
      const match = await bcrypt.compare('password123', saved.password);
      expect(match).to.be.true;
    });

    it('aplica defaults: role client, isAdmin false', async function () {
      const user = new User({
        name: 'Solo nombre',
        email: 'solo@test.com',
        password: 'secret',
      });
      const saved = await user.save();
      expect(saved.role).to.equal('client');
      expect(saved.isAdmin).to.equal(false);
    });

    it('guarda admin con role system_admin', async function () {
      const user = new User(fixtures.userAdmin);
      const saved = await user.save();
      expect(saved.role).to.equal('system_admin');
      expect(saved.isAdmin).to.be.true;
    });

    it('rechaza email duplicado (unique)', async function () {
      await User.create(fixtures.user);
      const user2 = new User({
        ...fixtures.userAdmin,
        email: fixtures.user.email,
      });
      try {
        await user2.save();
        expect.fail('debería haber fallado por unique');
      } catch (err) {
        expect(err.code).to.equal(11000);
      }
    });

    it('normaliza email a lowercase', async function () {
      const user = new User({
        name: 'Test',
        email: 'MAYUS@EXAMPLE.COM',
        password: 'pass',
      });
      const saved = await user.save();
      expect(saved.email).to.equal('mayus@example.com');
    });
  });

  describe('consulta sin password', function () {
    it('find() no incluye password por defecto (select: false)', async function () {
      await User.create(fixtures.user);
      const found = await User.findOne({ email: fixtures.user.email }).lean();
      expect(found).to.not.have.property('password');
    });

    it('find().select("+password") sí incluye password', async function () {
      await User.create(fixtures.user);
      const found = await User.findOne({ email: fixtures.user.email })
        .select('+password')
        .lean();
      expect(found).to.have.property('password');
      expect(found.password).to.be.a('string');
    });
  });
});
