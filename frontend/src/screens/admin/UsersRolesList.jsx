import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import '../../components/css/header.css';
import '../../components/css/adminModules.css';

import { listUsers, updateUser } from '../../services/users.service';
import { getCurrentUser } from '../../services/auth.service';
import { hasPermission, SCOPES } from '../../utils/permissionsFront';

const ROLES = [
  { value: 'client', label: 'Cliente' },
  { value: 'operator', label: 'Operador / Mecánico' },
  { value: 'bussiness_admin', label: 'Jefe del taller' },
  { value: 'system_admin', label: 'System Admin' },
];

const roleLabel = (role) => ROLES.find((r) => r.value === role)?.label || role || 'client';

export default function UsersRolesList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  // filtros (igual que ProductList)
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [admin, setAdmin] = useState('all'); // all | yes | no

  // para bloquear select mientras actualiza
  const [savingId, setSavingId] = useState(null);

  const user = getCurrentUser();
  const currentRole = user?.role || 'client';

  const canView = hasPermission(currentRole, 'users', [SCOPES.canView]);
  const canEdit = hasPermission(currentRole, 'users', [SCOPES.canEdit]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listUsers();
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar usuarios');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (canView) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canView]);

  const filteredRows = useMemo(() => {
    const text = q.trim().toLowerCase();

    return (rows || []).filter((u) => {
      const matchesText =
        !text ||
        String(u?.name || '').toLowerCase().includes(text) ||
        String(u?.email || '').toLowerCase().includes(text);

      const uRole = u?.role || 'client';
      const matchesRole = !role || uRole === role;

      const isAdmin = !!u?.isAdmin;
      const matchesAdmin =
        admin === 'all' || (admin === 'yes' ? isAdmin : !isAdmin);

      return matchesText && matchesRole && matchesAdmin;
    });
  }, [rows, q, role, admin]);

  const handleChangeRole = async (u, newRole) => {
    if (!canEdit) return;

    // opcional: evitar que el admin se cambie a sí mismo
    if (String(u?._id) === String(user?._id || user?.id)) {
      toast.warning('No podés cambiar tu propio rol desde acá.');
      return;
    }

    if (!window.confirm(`¿Cambiar el rol de "${u.name}" a "${roleLabel(newRole)}"?`)) return;

    try {
      setSavingId(u._id);

      // Tu backend ya recalcula isAdmin si role cambia (en PUT /:id)
      await updateUser(u._id, { role: newRole });

      setRows((prev) =>
        prev.map((x) =>
          x._id === u._id
            ? {
                ...x,
                role: newRole,
                isAdmin: ['system_admin', 'bussiness_admin'].includes(newRole),
              }
            : x
        )
      );

      toast.success('Rol actualizado');
    } catch (e) {
      console.error(e);
      toast.error(e?.response?.data?.message || 'No se pudo actualizar el rol');
    } finally {
      setSavingId(null);
    }
  };

  if (!canView) {
    return <div className="alert alert-warning">No tenés permisos para ver usuarios.</div>;
  }

  return (
    <div className="my-3">
      <div className="adm-box">
        <div className="adm-box-head">
          <div>
            <h4 className="adm-box-title">Usuarios y roles</h4>
            <p className="adm-box-sub">
              {filteredRows.length} de {rows.length} usuarios • Gestión de permisos.
            </p>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={load}
              disabled={loading}
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>
        </div>

        <div className="adm-box-body">
          {/* Toolbar (mismo layout que ProductList) */}
          <div className="adm-toolbar mb-3">
            <div className="adm-field">
              <label className="form-label">Buscar</label>
              <input
                className="form-control form-control-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre o email…"
              />
            </div>

            <div className="adm-field">
              <label className="form-label">Rol</label>
              <select
                className="form-select form-select-sm"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                <option value="">Todos</option>
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="adm-field">
              <label className="form-label">Admin</label>
              <select
                className="form-select form-select-sm"
                value={admin}
                onChange={(e) => setAdmin(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="yes">Sí</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-muted">Cargando…</div>
          ) : filteredRows.length === 0 ? (
            <div className="alert alert-info mb-0">No hay usuarios con esos filtros.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle adm-table mb-0">
                <thead>
                  <tr>
                    <th>Usuario</th>
                    <th>Email</th>
                    <th>Rol</th>
                    <th>Admin</th>
                    <th className="text-end" style={{ width: 180 }}>Acción</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((u) => {
                    const uRole = u?.role || 'client';

                    return (
                      <tr key={u._id}>
                        <td>
                          <div>
                            <h6 className="mb-0">{u.name || 'Sin nombre'}</h6>
                            <div className="adm-muted">ID: {u._id}</div>
                          </div>
                        </td>

                        <td>{u.email}</td>

                        <td style={{ width: 260 }}>
                          <select
                            className="form-select form-select-sm"
                            value={uRole}
                            disabled={!canEdit || savingId === u._id}
                            onChange={(e) => handleChangeRole(u, e.target.value)}
                          >
                            {ROLES.map((r) => (
                              <option key={r.value} value={r.value}>
                                {r.label}
                              </option>
                            ))}
                          </select>
                          {!canEdit && <div className="text-muted small mt-1">Solo lectura</div>}
                        </td>

                        <td>
                          <span className={`adm-badge ${u.isAdmin ? 'ok' : 'no'}`}>
                            {u.isAdmin ? 'Sí' : 'No'}
                          </span>
                        </td>

                        <td className="text-end">
                          <div className="adm-actions">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              type="button"
                              disabled={!canEdit || savingId === u._id}
                              onClick={() => toast.info(`Rol actual: ${roleLabel(uRole)}`)}
                            >
                              Ver
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* helper row igual que ProductList */}
          {(q || role || admin !== 'all') && (
            <div className="mt-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span className="adm-chip">
                Mostrando {filteredRows.length} / {rows.length}
              </span>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setQ('');
                  setRole('');
                  setAdmin('all');
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
