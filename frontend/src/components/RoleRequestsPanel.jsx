// src/components/RoleRequestsPanel.jsx
import React, { useMemo } from 'react';
import { ROLES } from '../utils/permissionsFront';

import '../components/css/adminModules.css';

export default function RoleRequestsPanel({
  requests = [],
  loading = false,
  onApprove = () => {},
  onReject = () => {},
  onClose = () => {},
}) {
  const count = useMemo(() => (Array.isArray(requests) ? requests.length : 0), [requests]);

  return (
    <div className="adm-box" style={{ maxWidth: 920 }}>
      <div className="adm-box-head">
        <div>
          <h4 className="adm-box-title d-flex align-items-center gap-2">
            Solicitudes de rol
            <span className="adm-chip">{count} pendientes</span>
          </h4>
          <p className="adm-box-sub">
            Usuarios que solicitaron ser <strong>mecánico</strong>.
          </p>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
            ← Volver
          </button>
        </div>
      </div>

      <div className="adm-box-body">
        {loading ? (
          <div className="text-muted">Cargando solicitudes…</div>
        ) : count === 0 ? (
          <div className="alert alert-info mb-0">No hay solicitudes pendientes en este momento.</div>
        ) : (
          <>
            <div className="adm-toolbar mb-3" style={{ gridTemplateColumns: '1fr 240px 1fr 200px' }}>
              <div className="adm-field">
                <label className="form-label">Estado</label>
                <div className="adm-chip">Pendientes de aprobación</div>
              </div>

              <div className="adm-field">
                <label className="form-label">Tip</label>
                <div className="adm-chip">Revisá el email antes de aprobar</div>
              </div>

              <div className="adm-field">
                <label className="form-label">Acciones</label>
                <div className="adm-chip">Aceptar / Rechazar</div>
              </div>

              <div className="adm-field">
                <label className="form-label">Total</label>
                <div className="adm-chip">{count}</div>
              </div>
            </div>

            <div style={{ maxHeight: 320, overflowY: 'auto' }} className="table-responsive">
              <table className="table table-sm table-hover align-middle adm-table mb-0">
                <thead>
                  <tr>
                    <th>Nombre</th>
                    <th>Email</th>
                    <th>Rol actual</th>
                    <th>Fecha solicitud</th>
                    <th className="text-end" style={{ width: 220 }}>
                      Acciones
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {requests.map((u) => {
                    const roleLabel = ROLES?.[u.role] || u.role || 'Cliente';
                    const date = u.roleRequestedAt
                      ? new Date(u.roleRequestedAt).toLocaleString('es-UY', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })
                      : '—';

                    return (
                      <tr key={u._id}>
                        <td className="fw-semibold">{u.name || '—'}</td>
                        <td>
                          {u.email || '—'}
                          {u.phone ? (
                            <>
                              <br />
                              <small className="text-muted">{u.phone}</small>
                            </>
                          ) : null}
                        </td>
                        <td>
                          <span className="adm-badge gray">{roleLabel}</span>
                        </td>
                        <td>{date}</td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-success"
                              onClick={() => onApprove(u._id)}
                            >
                              Aceptar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => onReject(u._id)}
                            >
                              Rechazar
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
