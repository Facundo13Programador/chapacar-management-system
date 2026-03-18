/**
 * Tests unitarios del módulo utils/permissions.js (getRoleName, hasPermission, middlewares).
 */
import { expect } from 'chai';
import {
  ROLES,
  SCOPES,
  getRoleName,
  hasPermission,
  requirePermission,
  requireAnyPermission,
} from '../../utils/permissions.js';

describe('Matriz de permisos y middlewares de autorizacion', function () {
  describe('getRoleName', function () {
    it('devuelve el nombre para roles conocidos', function () {
      expect(getRoleName('system_admin')).to.equal('Super Administrador');
      expect(getRoleName('bussiness_admin')).to.equal('Mecanico Taller');
      expect(getRoleName('operator')).to.equal('Mecanico');
      expect(getRoleName('client')).to.equal('Usuario');
    });

    it('devuelve string vacío para rol desconocido o inválido', function () {
      expect(getRoleName('unknown_role')).to.equal('');
      expect(getRoleName('')).to.equal('');
      expect(getRoleName(null)).to.equal('');
      expect(getRoleName(undefined)).to.equal('');
    });
  });

  describe('hasPermission', function () {
    it('system_admin tiene permiso total (canWrite) en categories', function () {
      expect(hasPermission('system_admin', 'categories', [SCOPES.canWrite])).to.be.true;
      expect(hasPermission('system_admin', 'categories', [SCOPES.canEdit])).to.be.true;
      expect(hasPermission('system_admin', 'categories', [SCOPES.canDelete])).to.be.true;
      expect(hasPermission('system_admin', 'categories', [])).to.be.true;
    });

    it('system_admin tiene permiso en orders (canView, canEdit)', function () {
      expect(hasPermission('system_admin', 'orders', [SCOPES.canView])).to.be.true;
      expect(hasPermission('system_admin', 'orders', [SCOPES.canEdit])).to.be.true;
    });

    it('client no tiene permisos en categories', function () {
      expect(hasPermission('client', 'categories', [SCOPES.canWrite])).to.be.false;
      expect(hasPermission('client', 'categories', [SCOPES.canEdit])).to.be.false;
      expect(hasPermission('client', 'categories', [])).to.be.false;
    });

    it('client tiene solo canView en products', function () {
      expect(hasPermission('client', 'products', [SCOPES.canView])).to.be.true;
      expect(hasPermission('client', 'products', [SCOPES.canEdit])).to.be.false;
    });

    it('devuelve false para rol inexistente', function () {
      expect(hasPermission('invalid_role', 'categories', [SCOPES.canView])).to.be.false;
    });

    it('devuelve false cuando el recurso no existe para el rol', function () {
      expect(hasPermission('operator', 'categories', [SCOPES.canWrite])).to.be.false;
      expect(hasPermission('operator', 'categories', [])).to.be.false;
    });

    it('con field usa fields del recurso', function () {
      expect(hasPermission('system_admin', 'orders', [SCOPES.canEdit], 'paid')).to.be.true;
      expect(hasPermission('client', 'orders', [SCOPES.canEdit], 'paid')).to.be.false;
    });
  });

  describe('requirePermission', function () {
    it('llama next() cuando el usuario tiene permiso', function () {
      const middleware = requirePermission('categories', [SCOPES.canWrite]);
      const req = { user: { role: 'system_admin' } };
      let nextCalled = false;
      middleware(req, {}, () => { nextCalled = true; });
      expect(nextCalled).to.be.true;
    });

    it('responde 403 cuando el usuario no tiene permiso', function () {
      const middleware = requirePermission('categories', [SCOPES.canWrite]);
      const req = { user: { role: 'client' } };
      const res = { status(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; } };
      let nextCalled = false;
      middleware(req, res, () => { nextCalled = true; });
      expect(nextCalled).to.be.false;
      expect(res.statusCode).to.equal(403);
      expect(res.body?.message).to.include('Not authorized');
    });

    it('usa role client cuando req.user no existe', function () {
      const middleware = requirePermission('categories', [SCOPES.canWrite]);
      const req = {};
      const res = { status(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; } };
      let nextCalled = false;
      middleware(req, res, () => { nextCalled = true; });
      expect(nextCalled).to.be.false;
      expect(res.statusCode).to.equal(403);
    });
  });

  describe('requireAnyPermission', function () {
    it('llama next() si alguna regla cumple', function () {
      const middleware = requireAnyPermission([
        { fn: 'categories', scopes: [SCOPES.canWrite] },
        { fn: 'products', scopes: [SCOPES.canView] },
      ]);
      const req = { user: { role: 'client' } };
      let nextCalled = false;
      middleware(req, {}, () => { nextCalled = true; });
      expect(nextCalled).to.be.true;
    });

    it('responde 403 si ninguna regla cumple', function () {
      const middleware = requireAnyPermission([
        { fn: 'categories', scopes: [SCOPES.canWrite] },
        { fn: 'users', scopes: [SCOPES.canWrite] },
      ]);
      const req = { user: { role: 'client' } };
      const res = { status(code) { this.statusCode = code; return this; }, send(body) { this.body = body; return this; } };
      let nextCalled = false;
      middleware(req, res, () => { nextCalled = true; });
      expect(nextCalled).to.be.false;
      expect(res.statusCode).to.equal(403);
    });
  });
});
