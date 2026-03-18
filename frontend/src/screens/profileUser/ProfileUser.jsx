// src/screens/ProfileUser.jsx
import React, { useEffect, useState } from 'react';
import { getCurrentUser } from '../../services/auth.service';
import {
  getMyProfile,
  updateMyProfile,
  changeMyPassword,
} from '../../services/users.service';
import { toast } from 'react-toastify';
import { getMyOrders } from '../../services/orders.service';
import '../../components/css/header.css';
import {
  listMyVehicles,
  createMyVehicle,
  updateMyVehicle,
  deleteMyVehicle,
} from '../../services/vehicles.service';
import { listPublicBrands } from '../../services/brands.service';
import Footer from '../../components/Footer.jsx';
import Header from '../../components/Header.jsx';
import ChatTest from '../../components/chatTest.jsx';

function getInitials(fullName = '') {
  const trimmed = fullName.trim();
  if (!trimmed) return '?';
  const parts = trimmed.split(/\s+/);
  const first = parts[0];
  const last = parts.length > 1 ? parts[parts.length - 1] : '';
  return ((first?.[0] || '') + (last?.[0] || '')).toUpperCase();
}

export default function ProfileUserScreen({ user, onLogout, onCartOpen }) {
  const localUser = getCurrentUser();
  const [me, setMe] = useState(localUser || null);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [profileForm, setProfileForm] = useState({
    name: '',
    lastName: '',
    email: '',
    phone: '',
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);

  const [vehicles, setVehicles] = useState([]);
  const [loadingVehicles, setLoadingVehicles] = useState(false);

  const [brands, setBrands] = useState([]);

  const [vehicleForm, setVehicleForm] = useState({
    id: null,
    brandId: '',
    model: '',
    year: '',
    licensePlate: '',
    fuelType: 'nafta',
    color: '',
    notes: '',
  });

  useEffect(() => {
    if (!localUser) return;

    const fetchProfile = async () => {
      try {
        const data = await getMyProfile();
        setMe(data);

        const [name, ...rest] = (data.name || '').split(' ');
        const lastName = rest.join(' ');
        setProfileForm({
          name: name || '',
          lastName: lastName || '',
          email: data.email || '',
          phone: data.phone || '',
        });
      } catch (e) {
        console.error(e);
        toast.error('No se pudo cargar el perfil');
      }
    };

    fetchProfile();
  }, []);

  useEffect(() => {
    if (!localUser) return;

    const loadData = async () => {
      try {
        setLoadingVehicles(true);

        const [brandsResp, vehiclesResp] = await Promise.all([
          listPublicBrands(),
          listMyVehicles(),
        ]);

        setBrands(Array.isArray(brandsResp) ? brandsResp : []);
        setVehicles(Array.isArray(vehiclesResp) ? vehiclesResp : []);
      } catch (e) {
        console.error('loadData error', e?.response?.status, e?.response?.data || e);
        toast.error('No se pudieron cargar tus vehículos');
      } finally {
        setLoadingVehicles(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    if (!localUser) return;

    let isMounted = true;

    const fetchOrders = async () => {
      try {
        setLoadingOrders(true);
        const data = await getMyOrders();
        if (!isMounted) return;
        setOrders(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        toast.error('No se pudo cargar el historial de compras');
      } finally {
        if (isMounted) setLoadingOrders(false);
      }
    };

    fetchOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: `${profileForm.name} ${profileForm.lastName}`.trim(),
        email: profileForm.email,
        phone: profileForm.phone,
      };

      const updated = await updateMyProfile(payload);
      toast.success('Perfil actualizado correctamente');
      setMe(updated);
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar el perfil');
    }
  };

  const handleSavePassword = async (e) => {
    e.preventDefault();
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    try {
      await changeMyPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success('Contraseña actualizada correctamente');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (e) {
      console.error(e);
      toast.error('No se pudo actualizar la contraseña');
    }
  };

  const handleVehicleFormChange = (e) => {
    const { name, value } = e.target;
    setVehicleForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetVehicleForm = () => {
    setVehicleForm({
      id: null,
      brandId: '',
      model: '',
      year: '',
      licensePlate: '',
      fuelType: 'nafta',
      color: '',
      notes: '',
    });
  };

  const handleEditVehicle = (vehicle) => {
    setVehicleForm({
      id: vehicle._id,
      brandId: vehicle.brand?._id || '',
      model: vehicle.model || '',
      year: vehicle.year || '',
      licensePlate: vehicle.licensePlate || '',
      fuelType: vehicle.fuelType || 'nafta',
      color: vehicle.color || '',
      notes: vehicle.notes || '',
    });
  };

  const handleDeleteVehicle = async (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar este vehículo?')) return;

    try {
      await deleteMyVehicle(id);
      toast.success('Vehículo eliminado');
      setVehicles((prev) => prev.filter((v) => v._id !== id));
      if (vehicleForm.id === id) resetVehicleForm();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || 'No se pudo eliminar el vehículo';
      toast.error(msg);
    }
  };

  const handleSubmitVehicle = async (e) => {
    e.preventDefault();

    if (!vehicleForm.brandId || !vehicleForm.model) {
      toast.warn('Selecciona una marca y un modelo');
      return;
    }

    const payload = {
      brandId: vehicleForm.brandId,
      model: vehicleForm.model,
      year: vehicleForm.year ? Number(vehicleForm.year) : undefined,
      licensePlate: vehicleForm.licensePlate || undefined,
      fuelType: vehicleForm.fuelType || 'nafta',
      color: vehicleForm.color || undefined,
      notes: vehicleForm.notes || undefined,
    };

    try {
      let saved;

      if (vehicleForm.id) {
        saved = await updateMyVehicle(vehicleForm.id, payload);
        toast.success('Vehículo actualizado');
        setVehicles((prev) => prev.map((v) => (v._id === saved._id ? saved : v)));
      } else {
        saved = await createMyVehicle(payload);
        toast.success('Vehículo agregado');
        setVehicles((prev) => [saved, ...prev]);
      }

      resetVehicleForm();
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || 'No se pudo guardar el vehículo';
      toast.error(msg);
    }
  };

  if (!localUser) {
    return (
      <div className="container py-4">
        <h2>Mi perfil</h2>
        <p>Debes iniciar sesión para ver tu perfil.</p>
      </div>
    );
  }

  const initials = getInitials(me?.name || '');

  const selectedBrand = brands.find((b) => b._id === vehicleForm.brandId);
  const brandModels = selectedBrand?.models || [];

  return (
    <>
      <Header user={me || user} onLogout={onLogout} onCartOpen={onCartOpen} />

      <div className="container py-4">
        <main className="col-12">
          <div className="d-flex align-items-center justify-content-between flex-wrap gap-3 mb-3">
            <h2 className="mb-0">Mi perfil</h2>

            <div
              className="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center"
              style={{ width: 48, height: 48, fontSize: 18, fontWeight: 'bold' }}
              title={me?.name || ''}
            >
              {initials}
            </div>
          </div>

          {/* Información básica */}
          <div className="card mb-4">
            <div className="card-header">Información básica</div>
            <div className="card-body">
              <form onSubmit={handleSaveProfile}>
                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Nombre</label>
                    <input
                      type="text"
                      className="form-control"
                      name="name"
                      value={profileForm.name}
                      onChange={handleProfileChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Apellidos</label>
                    <input
                      type="text"
                      className="form-control"
                      name="lastName"
                      value={profileForm.lastName}
                      onChange={handleProfileChange}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Teléfono</label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleProfileChange}
                    placeholder="Ej: 09X XXX XXX"
                  />
                </div>

                <button type="submit" className="btn btn-chapacar">
                  Guardar información de perfil
                </button>
              </form>
            </div>
          </div>

          {/* Contraseña */}
          <div className="card mb-4">
            <div className="card-header">Cambiar contraseña</div>
            <div className="card-body">
              <form onSubmit={handleSavePassword}>
                <div className="mb-3">
                  <label className="form-label">Contraseña actual</label>
                  <input
                    type="password"
                    className="form-control"
                    name="currentPassword"
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                    required
                  />
                </div>

                <div className="row mb-3">
                  <div className="col-md-6">
                    <label className="form-label">Nueva contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label">Confirmar nueva contraseña</label>
                    <input
                      type="password"
                      className="form-control"
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-outline-primary">
                  Guardar nueva contraseña
                </button>
              </form>
            </div>
          </div>

          {/* Mis vehículos */}
          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <span>Mis vehículos</span>
              {vehicleForm.id && (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={resetVehicleForm}
                >
                  Nuevo vehículo
                </button>
              )}
            </div>
            <div className="card-body">
              {loadingVehicles ? (
                <p className="text-muted">Cargando vehículos...</p>
              ) : vehicles.length === 0 ? (
                <p className="text-muted">
                  Todavía no tienes vehículos cargados. Agrega el primero usando el formulario.
                </p>
              ) : (
                <div className="table-responsive mb-3">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th>Marca</th>
                        <th>Modelo</th>
                        <th>Año</th>
                        <th>Matrícula</th>
                        <th>Combustible</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {vehicles.map((v) => (
                        <tr key={v._id}>
                          <td>{v.brand?.name || '—'}</td>
                          <td>{v.model}</td>
                          <td>{v.year || '—'}</td>
                          <td>{v.licensePlate || '—'}</td>
                          <td>{v.fuelType}</td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary me-2"
                              onClick={() => handleEditVehicle(v)}
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => handleDeleteVehicle(v._id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <h6 className="mb-3">{vehicleForm.id ? 'Editar vehículo' : 'Agregar vehículo'}</h6>

              <form onSubmit={handleSubmitVehicle} className="row g-3">
                <div className="col-md-4">
                  <label className="form-label">Marca</label>
                  <select
                    className="form-select"
                    name="brandId"
                    value={vehicleForm.brandId}
                    onChange={handleVehicleFormChange}
                    required
                  >
                    <option value="">Seleccionar marca...</option>
                    {brands.map((b) => (
                      <option key={b._id} value={b._id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Modelo</label>
                  {brandModels.length > 0 ? (
                    <select
                      className="form-select"
                      name="model"
                      value={vehicleForm.model}
                      onChange={handleVehicleFormChange}
                      required
                    >
                      <option value="">Seleccionar modelo...</option>
                      {brandModels.map((m) => (
                        <option key={m} value={m}>
                          {m}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      name="model"
                      placeholder="Modelo"
                      value={vehicleForm.model}
                      onChange={handleVehicleFormChange}
                      required
                    />
                  )}
                </div>

                <div className="col-md-4">
                  <label className="form-label">Año</label>
                  <input
                    type="number"
                    className="form-control"
                    name="year"
                    value={vehicleForm.year}
                    onChange={handleVehicleFormChange}
                    min="1950"
                    max={new Date().getFullYear() + 1}
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Matrícula</label>
                  <input
                    type="text"
                    className="form-control"
                    name="licensePlate"
                    value={vehicleForm.licensePlate}
                    onChange={handleVehicleFormChange}
                    placeholder="Ej: SBB1234"
                  />
                </div>

                <div className="col-md-4">
                  <label className="form-label">Combustible</label>
                  <select
                    className="form-select"
                    name="fuelType"
                    value={vehicleForm.fuelType}
                    onChange={handleVehicleFormChange}
                  >
                    <option value="nafta">Nafta</option>
                    <option value="diesel">Diésel</option>
                    <option value="híbrido">Híbrido</option>
                    <option value="eléctrico">Eléctrico</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>

                <div className="col-md-4">
                  <label className="form-label">Color</label>
                  <input
                    type="text"
                    className="form-control"
                    name="color"
                    value={vehicleForm.color}
                    onChange={handleVehicleFormChange}
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Notas</label>
                  <textarea
                    className="form-control"
                    name="notes"
                    rows="2"
                    value={vehicleForm.notes}
                    onChange={handleVehicleFormChange}
                    placeholder="Observaciones del vehículo (estado general, detalles, etc.)"
                  />
                </div>

                <div className="col-12">
                  <button type="submit" className="btn btn-chapacar">
                    {vehicleForm.id ? 'Guardar cambios' : 'Agregar vehículo'}
                  </button>
                  {vehicleForm.id && (
                    <button
                      type="button"
                      className="btn btn-outline-secondary ms-2"
                      onClick={resetVehicleForm}
                    >
                      Cancelar edición
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>

          {/* Historial de compras */}
          <div className="card">
            <div className="card-header">Historial de compras</div>
            <div className="card-body">
              {loadingOrders ? (
                <p>Cargando historial...</p>
              ) : orders.length === 0 ? (
                <p className="text-muted">Todavía no tienes compras registradas.</p>
              ) : (
                <div className="table-responsive">
                  <table className="table table-sm align-middle">
                    <thead>
                      <tr>
                        <th># Pedido</th>
                        <th>Fecha</th>
                        <th>Total</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((o) => (
                        <tr key={o._id}>
                          <td>{o._id}</td>
                          <td>{o.createdAt ? new Date(o.createdAt).toLocaleDateString('es-UY') : ''}</td>
                          <td>${o.total?.toLocaleString('es-UY')}</td>
                          <td>{o.status}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {isChatOpen && <ChatTest onClose={() => setIsChatOpen(false)} />}
          <button
            type="button"
            onClick={() => setIsChatOpen((prev) => !prev)}
            className="chap-fab"
            aria-label={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
            title={isChatOpen ? 'Cerrar chat' : 'Abrir chat'}
          >
            {isChatOpen ? '×' : '💬'}
          </button>
        </main>
      </div>

      <Footer />
    </>
  );
}
