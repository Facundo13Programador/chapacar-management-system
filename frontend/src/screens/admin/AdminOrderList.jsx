import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import { getAllOrders, updateOrderStatus } from '../../services/orders.service';

import '../../components/css/header.css';
import '../../components/css/adminModules.css';

const STATUS_LABELS = {
  pending: 'Pendiente',
  confirmed: 'Confirmada',
  preparing: 'Preparando',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const statusBadgeClass = (s) => {
  if (s === 'completed') return 'ok';
  if (s === 'cancelled') return 'no';
  if (s === 'confirmed' || s === 'preparing') return 'neu';
  return 'gray'; 
};

const moneyUYU = (v) =>
  Number(v || 0).toLocaleString('es-UY', { style: 'currency', currency: 'UYU' });

export default function AdminOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  const [statusFilter, setStatusFilter] = useState('pending'); 
  const [q, setQ] = useState(''); 

  const [selectedOrder, setSelectedOrder] = useState(null);

  const [editStatus, setEditStatus] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);

  const loadOrders = async (status) => {
    try {
      setLoading(true);

      const params = {};
      if (status && status !== 'all') params.status = status;

      const data = await getAllOrders(params);
      const arr = Array.isArray(data) ? data : [];
      setOrders(arr);

      if (arr.length > 0) setSelectedOrder(arr[0]);
      else setSelectedOrder(null);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e.message ||
          'No se pudieron cargar las órdenes de compra'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders(statusFilter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  useEffect(() => {
    if (selectedOrder) setEditStatus(selectedOrder.status || 'pending');
    else setEditStatus('');
  }, [selectedOrder]);

  const handleSelectOrder = (order) => setSelectedOrder(order);

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !editStatus) return;

    if (editStatus === selectedOrder.status) {
      toast.info('El estado no cambió');
      return;
    }

    try {
      setUpdatingStatus(true);

      const updated = await updateOrderStatus(selectedOrder._id, editStatus);

      toast.success('Estado de la orden actualizado');

      setOrders((prev) => prev.map((o) => (o._id === updated._id ? updated : o)));
      setSelectedOrder(updated);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e.message ||
          'No se pudo actualizar el estado de la orden'
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const filteredOrders = useMemo(() => {
    const text = q.trim().toLowerCase();
    if (!text) return orders;

    return (orders || []).filter((o) => {
      const name = String(o?.user?.name || '').toLowerCase();
      const email = String(o?.user?.email || '').toLowerCase();
      const phone = String(o?.phone || o?.user?.phone || '').toLowerCase();
      const id = String(o?._id || '').toLowerCase();

      return (
        name.includes(text) ||
        email.includes(text) ||
        phone.includes(text) ||
        id.includes(text)
      );
    });
  }, [orders, q]);

  const selectedId = useMemo(() => String(selectedOrder?._id || ''), [selectedOrder]);

  return (
    <div className="row g-3">
      {/* LISTA */}
      <div className="col-12 col-lg-7">
        <div className="adm-box">
          <div className="adm-box-head">
            <div>
              <h4 className="adm-box-title">Órdenes de compra</h4>
              <p className="adm-box-sub">
                Gestioná las compras realizadas en la tienda online.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={() => loadOrders(statusFilter)}
              disabled={loading}
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>

          <div className="adm-box-body">
            {/* Toolbar */}
            <div className="adm-toolbar mb-3" style={{ gridTemplateColumns: '1fr 220px 200px 1fr' }}>
              <div className="adm-field">
                <label className="form-label">Buscar</label>
                <input
                  className="form-control form-control-sm"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cliente, email, teléfono o ID…"
                />
              </div>

              <div className="adm-field">
                <label className="form-label">Estado</label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="pending">Pendientes</option>
                  <option value="confirmed">Confirmadas</option>
                  <option value="preparing">Preparando</option>
                  <option value="completed">Completadas</option>
                  <option value="cancelled">Canceladas</option>
                  <option value="all">Todas</option>
                </select>
              </div>

              <div className="adm-field">
                <label className="form-label">Resultados</label>
                <div className="adm-chip">
                  {filteredOrders.length} de {orders.length}
                </div>
              </div>

              <div className="adm-field">
                <label className="form-label">Acción rápida</label>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100"
                  onClick={() => setQ('')}
                  disabled={!q}
                >
                  Limpiar búsqueda
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-muted">Cargando órdenes…</div>
            ) : filteredOrders.length === 0 ? (
              <div className="alert alert-info mb-0">
                No hay órdenes para el filtro/búsqueda seleccionada.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle adm-table mb-0">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Teléfono</th>
                      <th>Pago</th>
                      <th>Retiro</th>
                      <th className="text-end">Total</th>
                      <th>Estado</th>
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredOrders.map((o) => {
                      const isActive = String(o._id) === selectedId;

                      const date = o.createdAt
                        ? new Date(o.createdAt).toLocaleString('es-UY')
                        : '—';

                      const phone = o.phone || o.user?.phone || '—';
                      const total = o.total ?? o.subtotal ?? 0;

                      return (
                        <tr
                          key={o._id}
                          className={isActive ? 'adm-row-active' : ''}
                        >
                          <td>{date}</td>
                          <td>
                            {o.user?.name || '—'}
                            <br />
                            <small className="text-muted">{o.user?.email || ''}</small>
                          </td>
                          <td>{phone}</td>
                          <td className="text-capitalize">{o.paymentMethod || '—'}</td>
                          <td className="text-capitalize">{o.deliveryMethod || '—'}</td>
                          <td className="text-end fw-semibold">{moneyUYU(total)}</td>
                          <td>
                            <span className={`adm-badge ${statusBadgeClass(o.status)}`}>
                              {STATUS_LABELS[o.status] || o.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleSelectOrder(o)}
                            >
                              Ver
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PANEL */}
      <div className="col-12 col-lg-5">
        <div className="adm-box">
          <div className="adm-box-head">
            <div>
              <h4 className="adm-box-title">Detalle</h4>
              <p className="adm-box-sub">Datos del cliente, productos y estado.</p>
            </div>
          </div>

          <div className="adm-box-body">
            {!selectedOrder ? (
              <div className="text-muted">
                Seleccioná una orden de la lista.
              </div>
            ) : (
              <>
                {/* Header tipo OT */}
                <div className="adm-wo-header mb-3">
                  <div>
                    <div className="adm-wo-kicker">Orden</div>
                    <h5 className="adm-wo-title">#{String(selectedOrder._id).slice(-6)}</h5>
                    <div className="adm-muted">
                      ID: <span className="text-monospace">{selectedOrder._id}</span>
                    </div>
                  </div>

                  <span className={`adm-badge ${statusBadgeClass(selectedOrder.status)}`}>
                    {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
                  </span>
                </div>

                <div className="adm-kv">
                  <div>
                    <strong>Fecha:</strong>{' '}
                    {selectedOrder.createdAt
                      ? new Date(selectedOrder.createdAt).toLocaleString('es-UY')
                      : '—'}
                  </div>

                  <div>
                    <strong>Cliente:</strong> {selectedOrder.user?.name || '—'}
                    <br />
                    <strong>Email:</strong> {selectedOrder.user?.email || '—'}
                    <br />
                    <strong>Teléfono:</strong>{' '}
                    {selectedOrder.phone || selectedOrder.user?.phone || '—'}
                  </div>

                  <div>
                    <strong>Pago:</strong>{' '}
                    <span className="text-capitalize">
                      {selectedOrder.paymentMethod || '—'}
                    </span>
                    <br />
                    <strong>Retiro:</strong>{' '}
                    <span className="text-capitalize">
                      {selectedOrder.deliveryMethod || '—'}
                    </span>
                    {selectedOrder.deliveryMethod === 'envio' && (
                      <>
                        <br />
                        <strong>Dirección:</strong> {selectedOrder.address || '—'}
                      </>
                    )}
                  </div>
                </div>

                {/* Cambio estado */}
                <div className="mb-3">
                  <label className="form-label">Cambiar estado</label>
                  <div className="input-group input-group-sm" style={{ maxWidth: 340 }}>
                    <select
                      className="form-select form-select-sm"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                    >
                      {Object.entries(STATUS_LABELS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="btn btn-primary btn-sm"
                      onClick={handleUpdateStatus}
                      disabled={
                        updatingStatus ||
                        !editStatus ||
                        !selectedOrder ||
                        editStatus === selectedOrder.status
                      }
                    >
                      {updatingStatus ? 'Guardando…' : 'Actualizar'}
                    </button>
                  </div>
                  <div className="adm-muted mt-2">
                    Tip: “Pendiente → Confirmada → Preparando → Completada”
                  </div>
                </div>

                <div className="adm-divider" />

                {/* Items */}
                <h6 className="fw-bold mb-2">Productos</h6>

                {!selectedOrder.items || selectedOrder.items.length === 0 ? (
                  <div className="text-muted">Sin productos en la orden.</div>
                ) : (
                  <div className="d-grid gap-2 mb-3">
                    {selectedOrder.items.map((it, idx) => {
                      const lineTotal =
                        (Number(it.price) || 0) * (Number(it.qty) || 1);

                      return (
                        <div key={idx} className="adm-item">
                          <div>
                            <p className="adm-item-title">{it.name}</p>
                            <p className="adm-item-sub">
                              Cantidad: {it.qty} • Unitario: {moneyUYU(it.price)}
                            </p>
                          </div>
                          <div className="fw-bold">{moneyUYU(lineTotal)}</div>
                        </div>
                      );
                    })}
                  </div>
                )}

                <div className="d-flex justify-content-between">
                  <span>Subtotal</span>
                  <span>{moneyUYU(selectedOrder.subtotal ?? 0)}</span>
                </div>

                <div className="d-flex justify-content-between fw-bold mb-2">
                  <span>Total</span>
                  <span>{moneyUYU(selectedOrder.total ?? selectedOrder.subtotal ?? 0)}</span>
                </div>

                {selectedOrder.notes && (
                  <>
                    <div className="adm-divider" />
                    <div>
                      <strong>Notas del cliente:</strong>
                      <p className="mb-0 adm-muted">{selectedOrder.notes}</p>
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
