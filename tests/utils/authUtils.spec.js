/**
 * Tests unitarios para middlewares de autorización (utils/authUtils.js).
 */
import { expect } from 'chai';
import { isAdmin, isSystemAdmin, isAdminOrOperator } from '../../utils/authUtils.js';

function mockRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    send(body) {
      this.body = body;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

describe('Middlewares de rol administrativo', function () {
  describe('isAdmin', function () {
    it('llama next() cuando req.user tiene role system_admin', function () {
      const req = { user: { role: 'system_admin' } };
      const res = mockRes();
      let nextCalled = false;
      isAdmin(req, res, () => { nextCalled = true; });
      expect(nextCalled).to.be.true;
      expect(res.statusCode).to.be.null;
    });

    it('llama next() cuando req.user tiene role bussiness_admin u operator', function () {
      for (const role of ['bussiness_admin', 'operator']) {
        const req = { user: { role } };
        let nextCalled = false;
        isAdmin(req, mockRes(), () => { nextCalled = true; });
        expect(nextCalled).to.be.true;
      }
    });

    it('responde 403 cuando req.user tiene role client', function () {
      const req = { user: { role: 'client' } };
      const res = mockRes();
      let nextCalled = false;
      isAdmin(req, res, () => { nextCalled = true; });
      expect(nextCalled).to.be.false;
      expect(res.statusCode).to.equal(403);
      expect(res.body?.message).to.include('administrador');
    });

    it('responde 403 cuando req.user no existe', function () {
      const req = {};
      const res = mockRes();
      isAdmin(req, res, () => {});
      expect(res.statusCode).to.equal(403);
    });
  });

  describe('isSystemAdmin', function () {
    it('llama next() cuando req.user.role es system_admin', function () {
      const req = { user: { role: 'system_admin' } };
      let nextCalled = false;
      isSystemAdmin(req, mockRes(), () => { nextCalled = true; });
      expect(nextCalled).to.be.true;
    });

    it('responde 403 cuando req.user.role es bussiness_admin', function () {
      const req = { user: { role: 'bussiness_admin' } };
      const res = mockRes();
      isSystemAdmin(req, res, () => {});
      expect(res.statusCode).to.equal(403);
      expect(res.body?.message).to.include('system_admin');
    });

    it('responde 403 cuando req.user no existe', function () {
      const req = {};
      const res = mockRes();
      isSystemAdmin(req, res, () => {});
      expect(res.statusCode).to.equal(403);
    });
  });

  describe('isAdminOrOperator', function () {
    it('llama next() para system_admin, bussiness_admin y operator', function () {
      for (const role of ['system_admin', 'bussiness_admin', 'operator']) {
        const req = { user: { role } };
        let nextCalled = false;
        isAdminOrOperator(req, mockRes(), () => { nextCalled = true; });
        expect(nextCalled).to.be.true;
      }
    });

    it('responde 403 para role client', function () {
      const req = { user: { role: 'client' } };
      const res = mockRes();
      isAdminOrOperator(req, res, () => {});
      expect(res.statusCode).to.equal(403);
      expect(res.body?.message).to.match(/reservas|permisos/);
    });
  });
});
