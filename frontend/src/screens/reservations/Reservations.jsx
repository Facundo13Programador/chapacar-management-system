// src/screens/reservations/Reservations.jsx
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
  createReservation,
  getMyReservations,
  cancelMyReservation,
} from '../../services/reservations.service.js';
import { listMyVehicles } from '../../services/vehicles.service';


export default function Reservations() {
  const navigate = useNavigate();

  const [user, setUser] = useState(getUser());
  const [isCartOpen, setIsCartOpen] = useState(false);

  const [serviceType, setServiceType] = useState('full_service');
  const [dateTime, setDateTime] = useState('');
  const [notes, setNotes] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [loadingList, setLoadingList] = useState(true);
  const [reservations, setReservations] = useState([]);

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);
  const [vehicleId, setVehicleId] = useState('');

  useEffect(() => {
    const off = onAuthChange(() => setUser(getUser()));
    return off;
  }, []);

  useEffect(() => {
    if (!user) {
      toast.info('Debes iniciar sesión para reservar');
      navigate('/signin');
    }
  }, [user, navigate]);

  const loadReservations = async () => {
    try {
      setLoadingList(true);
      const data = await getMyReservations();
      setReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar tus reservas');
    } finally {
      setLoadingList(false);
    }
  };

  const loadVehicles = async () => {
    try {
      setLoadingVehicles(true);
      const data = await listMyVehicles(); 
      setVehicles(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar tus vehículos');
    } finally {
      setLoadingVehicles(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadReservations();
      loadVehicles();
    }
  }, [user]);

  const onLogout = async () => {
    try {
      await apiLogout();
    } catch {}
    clearAuth();
    setUser(null);
    toast.info('Sesión cerrada');
    navigate('/signin');
  };

  const handleCreate = async (e) => {
    e.preventDefault();

    if (!vehicleId) {
      return toast.warn('Selecciona un vehículo para la reserva');
    }

    if (!dateTime) {
      return toast.warn('Selecciona una fecha');
    }

    try {
      setSubmitting(true);
      await createReservation({
        serviceType,
        dateTime,
        notes,
        vehicleId, 
      });
      toast.success('Reserva creada correctamente');
      setNotes('');
      setDateTime('');
      setServiceType('full_service');
      setVehicleId('');
      await loadReservations();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e.message ||
        'No se pudo crear la reserva';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm('¿Seguro que deseas cancelar esta reserva?')) return;

    try {
      await cancelMyReservation(id);
      toast.info('Reserva cancelada');
      await loadReservations();
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e.message ||
        'No se pudo cancelar la reserva';
      toast.error(msg);
    }
  };

  const todayISO = new Date().toISOString().split('T')[0];

  return (
    <>
      <Header
        user={user}
        onLogout={onLogout}
        onCartClick={() => setIsCartOpen(true)}
      />

      <main className="container my-4">
        <h2 className="mb-4">Reservar turno en el taller</h2>

        {/* FORMULARIO */}
        <div className="card mb-4">
          <div className="card-body">
            <h5 className="card-title">Nueva reserva</h5>

            <form onSubmit={handleCreate} className="row g-3">
              {/* Vehículo */}
              <div className="col-12 col-md-6">
                <label className="form-label">Vehículo</label>
                {loadingVehicles ? (
                  <p className="text-muted mb-0">Cargando vehículos...</p>
                ) : vehicles.length === 0 ? (
                  <>
                    <p className="text-muted mb-1">
                      No tienes vehículos cargados. Primero agrega uno desde tu perfil.
                    </p>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={() => navigate('/profile')}
                    >
                      Ir a mi perfil
                    </button>
                  </>
                ) : (
                  <select
                    className="form-select"
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    required
                  >
                    <option value="">Seleccionar vehículo...</option>
                    {vehicles.map((v) => (
                      <option key={v._id} value={v._id}>
                        {v.brand?.name || ''} {v.model}{' '}
                        {v.year ? `(${v.year})` : ''} –{' '}
                        {v.licensePlate || 'sin matrícula'}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Tipo de servicio */}
              <div className="col-12 col-md-3">
                <label className="form-label">Tipo de servicio</label>
                <select
                  className="form-select"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                >
                  <option value="full_service">Service completo</option>
                  <option value="revision">Revisión</option>
                </select>
              </div>

              {/* Fecha */}
              <div className="col-12 col-md-3">
                <label className="form-label">Fecha</label>
                <input
                  type="date"
                  className="form-control"
                  value={dateTime}
                  onChange={(e) => setDateTime(e.target.value)} 
                  min={todayISO}  
                />
              </div>

              {/* Comentarios */}
              <div className="col-12">
                <label className="form-label">Comentarios</label>
                <textarea
                  className="form-control"
                  rows="2"
                  placeholder="Ej: cambio de aceite, revisar frenos, etc."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                />
              </div>

              <div className="col-12">
                <button
                  type="submit"
                  className="btn btn-chapacar"
                  disabled={
                    submitting ||
                    loadingVehicles ||
                    vehicles.length === 0 ||
                    !vehicleId ||
                    !dateTime
                  }
                >
                  {submitting ? 'Creando reserva...' : 'Confirmar reserva'}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* LISTADO DE MIS RESERVAS */}
        <h4 className="mb-3">Mis reservas</h4>

        {loadingList ? (
          <div className="text-muted">Cargando reservas…</div>
        ) : reservations.length === 0 ? (
          <div className="alert alert-info">
            Aún no tienes reservas. Crea tu primera reserva con el formulario
            superior.
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-striped align-middle">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Vehículo</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Comentarios</th>
                  <th></th>
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
                      {r.vehicle
                        ? `${r.vehicle.brand?.name || ''} ${r.vehicle.model} ${
                            r.vehicle.year ? `(${r.vehicle.year})` : ''
                          } - ${r.vehicle.licensePlate || ''}`
                        : '—'}
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
                      {r.status !== 'cancelled' && r.status !== 'completed' && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleCancel(r._id)}
                        >
                          Cancelar
                        </button>
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
