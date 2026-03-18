import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { listUsers } from '../../services/users.service';
import { getCurrentUser } from '../../services/auth.service';
import { hasPermission, SCOPES, ROLES } from '../../utils/permissionsFront';

const ROLE_LABELS = ROLES;

export default function UserList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const current = getCurrentUser();
  const role = current?.role || 'client';

  const canView = hasPermission(role, 'users', [SCOPES.canView]);
  const canEdit = hasPermission(role, 'users', [SCOPES.canEdit]);

  useEffect(() => {
    if (!canView) {
      setLoading(false);
      return;
    }

    (async () => {
      try {
        const data = await listUsers();
        setRows(data);
      } catch (e) {
        console.error(e);
        toast.error('No se pudieron cargar los usuarios');
      } finally {
        setLoading(false);
      }
    })();
  }, [canView]);

  if (!canView) {
    return (
      <div className="container my-4">
        <div className="alert alert-danger">
          No tienes permisos para ver usuarios.
        </div>
      </div>
    );
  }

  return (
    <div className="container my-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3 className="m-0">Usuarios</h3>
      </div>

      {loading ? (
        <div className="text-muted">Cargando…</div>
      ) : rows.length === 0 ? (
        <div className="alert alert-info">No hay usuarios.</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Admin</th>
                <th style={{ width: 120 }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(u => (
                <tr key={u._id}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{ROLE_LABELS[u.role] || u.role || '—'}</td>
                  <td>{u.isAdmin ? 'Sí' : 'No'}</td>
                  <td>
                    {canEdit && (
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => navigate(`/users/${u._id}/edit`)}
                      >
                        Editar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
