// src/screens/reservations/AdminReservations.jsx
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import '../../components/css/header.css';
import Header from '../../components/Header.jsx';
import Footer from '../../components/Footer.jsx';
import SideCart from '../../components/sideCart/sideCart.jsx';

import { getUser, clearAuth, onAuthChange } from '../../utils/authUtils.js';
import { logout as apiLogout } from '../../services/auth.service.js';
import {
  getAllReservations,
  updateReservationStatus,
} from '../../services/reservations.service.js';

export default function AdminReservations() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser());
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const role = user?.role || 'client';
  const canManageReservations =
    user && ['system_admin', 'bussiness_admin', 'operator'].includes(role);

  useEffect(() => {
    const off = onAuthChange(() => setUser(getUser()));
    return off;
  }, []);

  useEffect(() => {
    if (!user) return;

    if (!canManageReservations) {
      toast.error('No tienes permisos para ver las reservas del taller');
      navigate('/');
    }
  }, [user, canManageReservations, navigate]);

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch { }
    clearAuth();
    setUser(null);
    toast.info('Sesión cerrada');
    navigate('/signin');
  };

  const loadReservations = async () => {
    try {
      setLoading(true);
      const data = await getAllReservations();
      setReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar las reservas del taller');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && canManageReservations) {
      loadReservations();
    }
  }, [user, canManageReservations]);

  const handleChangeStatus = async (id, status) => {
    if (!window.confirm(`¿Seguro que deseas marcar la reserva como "${status}"?`))
      return;

    try {
      setUpdatingId(id);
      await updateReservationStatus(id, status);
      toast.success('Reserva actualizada');
      await loadReservations();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e.message ||
        'No se pudo actualizar la reserva';
      toast.error(msg);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <>
      <Header
        user={user}
        onLogout={onLogout}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main className="container my-4">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h2 className="mb-0">Reservas del taller</h2>
          <button
            className="btn btn-outline-secondary btn-sm"
            onClick={() => navigate('/')}
          >
            Volver al inicio
          </button>
        </div>

        {loading ? (
          <div className="text-muted">Cargando reservas…</div>
        ) : reservations.length === 0 ? (
          <div className="alert alert-info">
            No hay reservas registradas por el momento.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Cliente</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Comentarios</th>
                  <th className="text-end">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {reservations.map((r) => (
                  <tr key={r._id}>
                    <td>
                      {new Date(r.dateTime).toLocaleDateString('es-UY', {
                        dateStyle: 'short',
                      })}
                    </td>
                    <td>
                      {r.client?.name || 'Sin nombre'}
                      <br />
                      <small className="text-muted">{r.client?.email}</small>
                    </td>
                    <td>
                      {r.serviceType === 'revision'
                        ? 'Revisión'
                        : r.serviceType === 'full_service'
                          ? 'Service completo'
                          : r.serviceType}
                    </td>
                    <td>
                      <span className="badge bg-secondary">{r.status}</span>
                    </td>
                    <td>{r.notes || '-'}</td>
                    <td className="text-end">
                      {/* Botones según estado */}
                      {r.status === 'pending' && (
                        <>
                          <button
                            className="btn btn-sm btn-success me-2"
                            disabled={updatingId === r._id}
                            onClick={() =>
                              handleChangeStatus(r._id, 'confirmed')
                            }
                          >
                            Confirmar
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={updatingId === r._id}
                            onClick={() =>
                              handleChangeStatus(r._id, 'cancelled')
                            }
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      {r.status === 'confirmed' && (
                        <>
                          <button
                            className="btn btn-sm btn-chapacar me-2"
                            disabled={updatingId === r._id}
                            onClick={() =>
                              handleChangeStatus(r._id, 'completed')
                            }
                          >
                            Marcar como completada
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            disabled={updatingId === r._id}
                            onClick={() =>
                              handleChangeStatus(r._id, 'cancelled')
                            }
                          >
                            Cancelar
                          </button>
                        </>
                      )}

                      {['cancelled', 'completed'].includes(r.status) && (
                        <span className="text-muted small">
                          Sin acciones disponibles
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <SideCart
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
      />

      <Footer />
    </>
  );
}
