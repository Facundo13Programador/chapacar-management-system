import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  listBudgets,
  updateBudget,
  sendBudgetToClient,
  getBudgetPdf,
  createBudgetFromReservation,
} from '../../services/budgets.service.js';
import { listReservationsForBudget } from '../../services/reservations.service.js';
import { listPublicProducts } from '../../services/products.service.js';
import { createWorkOrderFromBudget } from '../../services/workOrders.service.js';
import { useNavigate } from 'react-router-dom';

import '../../components/css/header.css';
import '../../components/css/adminModules.css';

const emptyNewBudget = {
  status: 'draft',
  notes: '',
  currency: 'UYU',
  items: [],
};

const statusLabels = {
  draft: 'Borrador',
  sent: 'Enviado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

const statusBadgeClass = (s) => {
  if (s === 'approved') return 'ok';
  if (s === 'rejected') return 'no';
  if (s === 'sent') return 'info';
  return 'warn'; 
};

export default function BudgetList() {
  const navigate = useNavigate();
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [viewMode, setViewMode] = useState('list');
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); 
  const [reservations, setReservations] = useState([]);
  const [loadingReservations, setLoadingReservations] = useState(false);
  const [selectedReservationId, setSelectedReservationId] = useState('');
  const [creatingBudget, setCreatingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(emptyNewBudget);
  const [products, setProducts] = useState([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedProductQty, setSelectedProductQty] = useState(1);

  const loadBudgets = async () => {
    try {
      setLoading(true);
      const data = await listBudgets();
      setBudgets(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar los presupuestos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBudgets();
  }, []);

  const handleSelect = (b) => {
    setSelected(JSON.parse(JSON.stringify(b)));
    setViewMode('list');
  };

  const handleItemChange = (idx, field, value) => {
    setSelected((prev) => {
      if (!prev) return prev;
      const items = [...(prev.items || [])];
      const item = { ...(items[idx] || {}) };
      if (field === 'quantity' || field === 'unitPrice') item[field] = Number(value) || 0;
      else item[field] = value;
      items[idx] = item;
      return { ...prev, items };
    });
  };

  const handleChangeField = (field, value) => {
    setSelected((prev) => ({ ...prev, [field]: value }));
  };


  const buildDefaultItemsForServiceReservation = (reservation) => {
    return [
      {
        type: 'other',
        description: 'Service completo - mano de obra general',
        quantity: 1,
        unitPrice: 2500, 
      },
      {
        type: 'other',
        description: 'Revisión y ajuste de frenos (delanteros y traseros)',
        quantity: 1,
        unitPrice: 900, 
      },
      {
        type: 'other',
        description: 'Revisión de suspensión y tren delantero',
        quantity: 1,
        unitPrice: 900, 
      },
      {
        type: 'other',
        description: 'Chequeo y corrección de fluidos (agua, frenos, dirección, limpiaparabrisas)',
        quantity: 1,
        unitPrice: 600, 
      },
      {
        type: 'other',
        description: 'Chequeo de batería y sistema de carga',
        quantity: 1,
        unitPrice: 400, 
      },
      {
        type: 'other',
        description: 'Escaneo básico de diagnóstico (OBD) si corresponde',
        quantity: 1,
        unitPrice: 700, 
      },
    ];
  };



  const handleSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);
      const payload = {
        status: selected.status,
        notes: selected.notes,
        items: selected.items,
      };
      const updated = await updateBudget(selected._id, payload);
      toast.success('Presupuesto actualizado');

      setBudgets((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      setSelected(updated);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || e.message || 'No se pudo actualizar el presupuesto'
      );
    } finally {
      setSaving(false);
    }
  };

  const calcTotal = (b) =>
    (b.items || []).reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );

  const handleSendToClient = async () => {
    if (!selected) return;

    if (!selected.client?.email) {
      toast.warn('El cliente no tiene un email cargado.');
      return;
    }

    if (!window.confirm('¿Enviar este presupuesto al cliente por email en formato PDF?')) return;

    try {
      setSending(true);
      const payload = { notes: selected.notes || '', items: selected.items || [] };

      const resp = await sendBudgetToClient(selected._id, payload);

      toast.success('Presupuesto enviado al cliente');
      const updated = resp?.budget || resp;

      setBudgets((prev) => prev.map((b) => (b._id === updated._id ? updated : b)));
      setSelected(updated);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || e.message || 'No se pudo enviar el presupuesto'
      );
    } finally {
      setSending(false);
    }
  };

  const handleViewPdf = async () => {
    if (!selected) return;

    try {
      const blob = await getBudgetPdf(selected._id);
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || e.message || 'No se pudo generar el PDF del presupuesto'
      );
    }
  };

  // CREACIÓN DE PRESUPUESTO
  const loadReservationsForCreate = async () => {
    try {
      setLoadingReservations(true);
      const data = await listReservationsForBudget();
      setReservations(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar las reservas para presupuestar');
    } finally {
      setLoadingReservations(false);
    }
  };

  const loadProductsForBudget = async () => {
    try {
      setLoadingProducts(true);
      const data = await listPublicProducts();

      let list = [];
      if (Array.isArray(data)) list = data;
      else if (Array.isArray(data.products)) list = data.products;
      else if (Array.isArray(data.docs)) list = data.docs;

      setProducts(list);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar los productos para el presupuesto');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleOpenCreate = async () => {
    setSelected(null);
    setViewMode('create');
    setSelectedReservationId('');
    setNewBudget({
      ...emptyNewBudget,
      status: 'draft',
      notes: '',
      items: [],
      currency: 'UYU',
    });
    setProductSearch('');
    setSelectedProductId('');
    setSelectedProductQty(1);

    await loadReservationsForCreate();
    await loadProductsForBudget();
  };

  const handleCancelCreate = () => {
    setViewMode('list');
    setSelectedReservationId('');
    setNewBudget(emptyNewBudget);
  };

  const handleNewBudgetFieldChange = (field, value) => {
    setNewBudget((prev) => ({ ...prev, [field]: value }));
  };

  const handleNewItemChange = (idx, field, value) => {
    setNewBudget((prev) => {
      const items = [...(prev.items || [])];
      const item = { ...(items[idx] || {}) };
      if (field === 'quantity' || field === 'unitPrice') item[field] = Number(value) || 0;
      else item[field] = value;
      items[idx] = item;
      return { ...prev, items };
    });
  };

  const handleAddNewItem = () => {
    setNewBudget((prev) => ({
      ...prev,
      items: [...(prev.items || []), { type: 'other', description: '', quantity: 1, unitPrice: 0 }],
    }));
  };

  const handleRemoveNewItem = (idx) => {
    setNewBudget((prev) => {
      const items = [...(prev.items || [])];
      items.splice(idx, 1);
      return { ...prev, items };
    });
  };

  const calcNewBudgetTotal = () =>
    (newBudget.items || []).reduce(
      (sum, it) => sum + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0),
      0
    );

  const handleAddSelectedProductToBudget = () => {
    if (!selectedProductId) {
      toast.warn('Seleccioná un producto para agregar al presupuesto');
      return;
    }

    const qty = Number(selectedProductQty) || 0;
    if (qty <= 0) {
      toast.warn('La cantidad debe ser mayor a 0');
      return;
    }

    const p = products.find((x) => x._id === selectedProductId) || products.find((x) => x.id === selectedProductId);
    if (!p) {
      toast.error('No se encontró el producto seleccionado');
      return;
    }

    const unitPrice = Number(p.price) || 0;
    const productId = p._id || p.id;

    const alreadyInBudgetQty = (newBudget.items || [])
      .filter((it) => it.type === 'product' && String(it.product) === String(productId))
      .reduce((acc, it) => acc + (Number(it.quantity) || 0), 0);

    const totalRequested = alreadyInBudgetQty + qty;

    if (typeof p.countInStock === 'number' && totalRequested > p.countInStock) {
      toast.error(
        `Stock insuficiente para "${p.name}". Disponible: ${p.countInStock}, intentás agregar: ${totalRequested}.`
      );
      return;
    }

    const newItem = {
      type: 'product',
      product: productId,
      productName: p.name,
      description: p.name,
      quantity: qty,
      unitPrice,
    };

    setNewBudget((prev) => ({ ...prev, items: [...(prev.items || []), newItem] }));
    setSelectedProductQty(1);
    toast.success('Producto agregado al presupuesto');
  };

  const handleCreateBudgetFromReservation = async () => {
    if (!selectedReservationId) {
      toast.warn('Selecciona una reserva para crear el presupuesto');
      return;
    }

    if (!newBudget.items || newBudget.items.length === 0) {
      if (!window.confirm('El presupuesto no tiene ítems cargados. ¿Seguro que querés crearlo así?')) return;
    }

    const resv = reservations.find((r) => r._id === selectedReservationId);
    if (!resv) {
      toast.error('No se encontró la reserva seleccionada');
      return;
    }

    if (resv.status === 'completed') {
      toast.error('No se puede crear un presupuesto desde una reserva completada.');
      return;
    }

    try {
      setCreatingBudget(true);

      const payload = {
        reservationId: selectedReservationId,
        currency: newBudget.currency || 'UYU',
        notes: newBudget.notes || '',
        items: newBudget.items || [],
      };

      const newCreatedBudget = await createBudgetFromReservation(payload);

      setBudgets((prev) => [newCreatedBudget, ...prev]);
      setSelected(newCreatedBudget);
      setViewMode('list');
      toast.success('Presupuesto creado correctamente');
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message || e.message || 'No se pudo crear el presupuesto desde la reserva'
      );
    } finally {
      setCreatingBudget(false);
    }
  };

  const handleCreateWorkOrder = async (budget) => {
    if (budget.status !== 'approved') {
      toast.warn('Solo podés crear una OT si el presupuesto está APROBADO.');
      return;
    }

    const existingWoId = budget?.workOrder?._id || budget?.workOrder || null;

    if (existingWoId) {
      toast.info('Este presupuesto ya tiene una OT asociada.');
      navigate(`/admin?section=workOrders&id=${existingWoId}`);
      return;
    }

    if (!window.confirm('¿Crear una Orden de Trabajo para este presupuesto aprobado?')) return;

    try {
      const payload = { tasks: [], extraNotes: '' };
      const resp = await createWorkOrderFromBudget(budget._id, payload);
      const woId = resp?._id || resp?.workOrder?._id || resp?.workOrderId;

      if (!woId) {
        toast.error('Se creó la OT pero no se recibió el ID para navegar.');
        return;
      }

      toast.success('Orden de trabajo creada correctamente');

      setBudgets((prev) => prev.map((b) => (b._id === budget._id ? { ...b, workOrder: woId } : b)));
      navigate(`/admin?section=workOrders&id=${woId}`);
    } catch (e) {
      console.error(e);

      if (e?.response?.status === 409) {
        const data = e?.response?.data || {};
        const woId = data?.workOrder?._id || data?.workOrderId || budget?.workOrder?._id || budget?.workOrder;

        toast.info(data?.message || 'Este presupuesto ya tiene una OT asociada.');
        if (woId) navigate(`/admin?section=workOrders&id=${woId}`);
        return;
      }

      toast.error(
        e?.response?.data?.message || e.message || 'No se pudo crear la orden de trabajo desde el presupuesto'
      );
    }
  };

  const formatReservationLabel = (r) => {
    const clientName = r.client?.name || 'Sin nombre';
    const brandName = r.vehicle?.brand?.name || '';
    const model = r.vehicle?.model || '';
    const plate = r.vehicle?.licensePlate || '';
    const fecha = r.dateTime ? new Date(r.dateTime).toLocaleDateString('es-UY', { dateStyle: 'short' }) : '';
    return `${fecha} - ${clientName} - ${brandName} ${model} ${plate}`.trim();
  };

  const filteredProducts = (products || []).filter((p) => {
    const term = productSearch.trim().toLowerCase();
    if (!term) return true;
    const name = (p.name || '').toLowerCase();
    const sku = (p.sku || '').toLowerCase();
    return name.includes(term) || sku.includes(term);
  });

  const filteredBudgets = useMemo(() => {
    const text = q.trim().toLowerCase();

    return (budgets || []).filter((b) => {
      const matchesStatus = statusFilter === 'all' || String(b.status) === String(statusFilter);

      const clientName = String(b?.client?.name || '').toLowerCase();
      const email = String(b?.client?.email || '').toLowerCase();
      const plate = String(b?.vehicle?.licensePlate || '').toLowerCase();

      const matchesText = !text || clientName.includes(text) || email.includes(text) || plate.includes(text);

      return matchesStatus && matchesText;
    });
  }, [budgets, q, statusFilter]);

  const selectedId = useMemo(() => String(selected?._id || ''), [selected]);

  useEffect(() => {
    if (!selectedReservationId) return;

    const r = reservations.find((x) => x._id === selectedReservationId);
    if (!r) return;

    setNewBudget((prev) => {
      if (prev.items && prev.items.length > 0) return prev;

      if (r.serviceType !== 'full_service') return prev;

      return {
        ...prev,
        items: buildDefaultItemsForServiceReservation(r),
      };
    });
  }, [selectedReservationId, reservations]);

  // VISTA CREAR
  if (viewMode === 'create') {
    const selectedReservation = reservations.find((r) => r._id === selectedReservationId);

    return (
      <div className="row g-3">
        <div className="col-12">
          <div className="adm-box">
            <div className="adm-box-head">
              <div>
                <h4 className="adm-box-title">Crear nuevo presupuesto</h4>
                <p className="adm-box-sub">
                  Se crea en <strong>Borrador</strong>. Cuando lo envíes, pasa a <strong>Enviado</strong>.
                </p>
              </div>

              <button
                className="btn btn-outline-secondary btn-sm"
                type="button"
                onClick={handleCancelCreate}
                disabled={creatingBudget}
              >
                ← Volver
              </button>
            </div>

            <div className="adm-box-body">
              {loadingReservations ? (
                <div className="text-muted">Cargando reservas…</div>
              ) : reservations.length === 0 ? (
                <div className="alert alert-info mb-0">
                  No hay reservas disponibles para presupuestar (revisión / service completo).
                </div>
              ) : (
                <div className="mb-3">
                  <label className="form-label">Reserva</label>
                  <select
                    className="form-select"
                    value={selectedReservationId}
                    onChange={(e) => setSelectedReservationId(e.target.value)}
                  >
                    <option value="">Seleccionar reserva...</option>
                    {reservations.map((r) => (
                      <option key={r._id} value={r._id}>
                        {formatReservationLabel(r)}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedReservation && (
                <>
                  <div className="adm-panel-lite mb-3">
                    <p className="mb-1">
                      <strong>Cliente:</strong> {selectedReservation.client?.name || 'Sin nombre'}
                      <br />
                      <span className="adm-note">{selectedReservation.client?.email}</span>
                    </p>

                    <p className="mb-1">
                      <strong>Vehículo:</strong>{' '}
                      {selectedReservation.vehicle
                        ? `${selectedReservation.vehicle.brand?.name || ''} ${selectedReservation.vehicle.model || ''} ${selectedReservation.vehicle.year || ''}`
                        : 'Sin vehículo'}
                      {selectedReservation.vehicle?.licensePlate && (
                        <>
                          <br />
                          <span className="adm-note">{selectedReservation.vehicle.licensePlate}</span>
                        </>
                      )}
                    </p>

                    <p className="mb-0">
                      <strong>Fecha reserva:</strong>{' '}
                      {selectedReservation.dateTime
                        ? new Date(selectedReservation.dateTime).toLocaleString('es-UY', { dateStyle: 'short', timeStyle: 'short' })
                        : '—'}
                      <br />
                      <strong>Comentarios:</strong>{' '}
                      {selectedReservation.notes || <span className="adm-note">—</span>}
                    </p>
                  </div>

                  <div className="adm-inline mb-3">
                    <div className="adm-field">
                      <label className="form-label">Moneda</label>
                      <select
                        className="form-select form-select-sm"
                        value={newBudget.currency}
                        onChange={(e) => handleNewBudgetFieldChange('currency', e.target.value)}
                      >
                        <option value="UYU">UYU</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>

                    <div className="adm-field">
                      <label className="form-label">Notas</label>
                      <input
                        className="form-control form-control-sm"
                        value={newBudget.notes || ''}
                        onChange={(e) => handleNewBudgetFieldChange('notes', e.target.value)}
                        placeholder="Notas internas (opcional)…"
                      />
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="adm-box mb-3" style={{ boxShadow: 'none' }}>
                    <div className="adm-box-head" style={{ borderBottom: 'none', padding: '0 0 10px' }}>
                      <div>
                        <h6 className="adm-box-title" style={{ fontSize: 14 }}>Productos del stock</h6>
                        <p className="adm-box-sub">Agregá productos con cantidad controlando stock.</p>
                      </div>
                      {loadingProducts && <span className="adm-chip">Cargando…</span>}
                    </div>

                    <div className="adm-two">
                      <div className="row g-2 align-items-end">
                        <div className="col-md-5">
                          <label className="form-label form-label-sm">Buscar</label>
                          <input
                            type="search"
                            className="form-control form-control-sm"
                            placeholder="Nombre o SKU..."
                            value={productSearch}
                            onChange={(e) => setProductSearch(e.target.value)}
                          />
                        </div>

                        <div className="col-md-5">
                          <label className="form-label form-label-sm">Producto</label>
                          <select
                            className="form-select form-select-sm"
                            value={selectedProductId}
                            onChange={(e) => setSelectedProductId(e.target.value)}
                          >
                            <option value="">Seleccionar producto...</option>
                            {filteredProducts.slice(0, 50).map((p) => (
                              <option key={p._id || p.id} value={p._id || p.id}>
                                {p.name} — {Number(p.price || 0).toLocaleString('es-UY')}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="col-md-2">
                          <label className="form-label form-label-sm">Cant.</label>
                          <input
                            type="number"
                            min="1"
                            className="form-control form-control-sm"
                            value={selectedProductQty}
                            onChange={(e) => setSelectedProductQty(e.target.value)}
                          />
                        </div>

                        <div className="col-md-12 mt-2 text-end">
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-success"
                            onClick={handleAddSelectedProductToBudget}
                            disabled={!filteredProducts.length}
                          >
                            Agregar producto
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Ítems */}
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0 fw-bold">Ítems del presupuesto</label>
                    <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleAddNewItem}>
                      + Ítem manual
                    </button>
                  </div>

                  <div className="table-responsive mt-2">
                    <table className="table table-sm table-hover align-middle adm-table mb-0">
                      <thead>
                        <tr>
                          <th>Descripción / Producto</th>
                          <th style={{ width: 90 }}>Cant.</th>
                          <th style={{ width: 140 }}>P. unit.</th>
                          <th className="text-end" style={{ width: 40 }}></th>
                        </tr>
                      </thead>
                      <tbody>
                        {(newBudget.items || []).length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-muted small">
                              No hay ítems cargados. Agregá productos desde el stock o ítems manuales.
                            </td>
                          </tr>
                        ) : (
                          (newBudget.items || []).map((it, idx) => (
                            <tr key={idx}>
                              <td>
                                <input
                                  type="text"
                                  className="form-control form-control-sm"
                                  value={it.productName || it.description || ''}
                                  onChange={(e) => handleNewItemChange(idx, 'description', e.target.value)}
                                />
                                {it.type === 'product' && (
                                  <div className="adm-note">
                                    Producto (ID: {(it.product || it.productId || '').toString()})
                                  </div>
                                )}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  className="form-control form-control-sm"
                                  value={it.quantity ?? 0}
                                  onChange={(e) => handleNewItemChange(idx, 'quantity', e.target.value)}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  className="form-control form-control-sm"
                                  value={it.unitPrice ?? 0}
                                  onChange={(e) => handleNewItemChange(idx, 'unitPrice', e.target.value)}
                                />
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleRemoveNewItem(idx)}
                                  title="Eliminar"
                                >
                                  ×
                                </button>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="adm-total mt-3">
                    <span>Total</span>
                    <span>
                      {calcNewBudgetTotal().toLocaleString('es-UY', {
                        style: 'currency',
                        currency: newBudget.currency || 'UYU',
                      })}
                    </span>
                  </div>

                  <div className="text-end mt-3">
                    <button
                      className="btn btn-chapacar"
                      type="button"
                      onClick={handleCreateBudgetFromReservation}
                      disabled={creatingBudget || !selectedReservationId || loadingReservations}
                    >
                      {creatingBudget ? 'Creando…' : 'Crear presupuesto'}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // VISTA LISTA + EDICIÓN
  return (
    <div className="row g-3">
      {/* LISTA */}
      <div className="col-12 col-lg-7">
        <div className="adm-box">
          <div className="adm-box-head">
            <div>
              <h4 className="adm-box-title">Presupuestos del taller</h4>
              <p className="adm-box-sub">Listado, edición, envío al cliente y generación de OT.</p>
            </div>

            <div className="d-flex gap-2">
              <button className="btn btn-outline-secondary btn-sm" type="button" onClick={loadBudgets} disabled={loading}>
                {loading ? 'Actualizando…' : 'Actualizar'}
              </button>
              <button className="btn btn-chapacar btn-sm" type="button" onClick={handleOpenCreate}>
                + Nuevo
              </button>
            </div>
          </div>

          <div className="adm-box-body">
            <div className="adm-toolbar mb-3" style={{ gridTemplateColumns: '1fr 220px 200px 1fr' }}>
              <div className="adm-field">
                <label className="form-label">Buscar</label>
                <input
                  className="form-control form-control-sm"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Cliente, email o matrícula…"
                />
              </div>

              <div className="adm-field">
                <label className="form-label">Estado</label>
                <select
                  className="form-select form-select-sm"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">Todos</option>
                  <option value="draft">Borrador</option>
                  <option value="sent">Enviado</option>
                  <option value="approved">Aprobado</option>
                  <option value="rejected">Rechazado</option>
                </select>
              </div>

              <div className="adm-field">
                <label className="form-label">Resultados</label>
                <div className="adm-chip">
                  {filteredBudgets.length} de {budgets.length}
                </div>
              </div>

              <div className="adm-field">
                <label className="form-label">Acción rápida</label>
                <button
                  type="button"
                  className="btn btn-outline-secondary btn-sm w-100"
                  onClick={() => {
                    setQ('');
                    setStatusFilter('all');
                  }}
                  disabled={!q && statusFilter === 'all'}
                >
                  Limpiar filtros
                </button>
              </div>
            </div>

            {loading ? (
              <div className="text-muted">Cargando presupuestos…</div>
            ) : filteredBudgets.length === 0 ? (
              <div className="alert alert-info mb-0">No hay presupuestos con esos filtros.</div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle adm-table mb-0">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th>Estado</th>
                      <th className="text-end">Total</th>
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredBudgets.map((b) => {
                      const isActive = String(b._id) === selectedId;

                      const date = b.createdAt
                        ? new Date(b.createdAt).toLocaleDateString('es-UY', { dateStyle: 'short' })
                        : '—';

                      const vehicleText = b.vehicle
                        ? `${b.vehicle.brand?.name || ''} ${b.vehicle.model || ''} ${b.vehicle.year || ''}`.trim()
                        : 'Sin vehículo';

                      return (
                        <tr key={b._id} className={isActive ? 'adm-row-active' : ''}>
                          <td>{date}</td>
                          <td>
                            {b.client?.name || 'Sin nombre'}
                            <br />
                            <small className="text-muted">{b.client?.email || ''}</small>
                          </td>
                          <td>
                            {vehicleText}
                            {b.vehicle?.licensePlate && (
                              <>
                                <br />
                                <small className="text-muted">{b.vehicle.licensePlate}</small>
                              </>
                            )}
                          </td>
                          <td>
                            <span className={`adm-badge ${statusBadgeClass(b.status)}`}>
                              {statusLabels[b.status] || b.status}
                            </span>
                          </td>
                          <td className="text-end fw-semibold">
                            {calcTotal(b).toLocaleString('es-UY', {
                              style: 'currency',
                              currency: b.currency || 'UYU',
                            })}
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary me-2"
                              type="button"
                              onClick={() => handleSelect(b)}
                            >
                              Ver / Editar
                            </button>

                            {b.status === 'approved' && (
                              b.workOrder ? (
                                <button
                                  className="btn btn-sm btn-outline-secondary"
                                  type="button"
                                  onClick={() => {
                                    const woId = b.workOrder?._id || b.workOrder;
                                    navigate(`/admin?section=workOrders&id=${woId}`);
                                  }}
                                >
                                  Ver OT
                                </button>
                              ) : (
                                <button
                                  className="btn btn-sm btn-outline-warning"
                                  type="button"
                                  onClick={() => handleCreateWorkOrder(b)}
                                >
                                  Crear OT
                                </button>
                              )
                            )}
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

      {/* DETALLE */}
      <div className="col-12 col-lg-5">
        <div className="adm-box">
          <div className="adm-box-head">
            <div>
              <h4 className="adm-box-title">Detalle</h4>
              <p className="adm-box-sub">Editar ítems, estado, notas y acciones.</p>
            </div>
          </div>

          <div className="adm-box-body">
            {!selected ? (
              <div className="text-muted">Seleccioná un presupuesto de la lista o creá uno nuevo.</div>
            ) : (
              <>
                <div className="adm-wo-header mb-3">
                  <div>
                    <div className="adm-wo-kicker">Presupuesto</div>
                    <h5 className="adm-wo-title">
                      {selected.client?.name || 'Sin nombre'}
                    </h5>
                    <div className="adm-muted">
                      {selected.vehicle?.licensePlate ? `Matrícula: ${selected.vehicle.licensePlate}` : '—'}
                    </div>
                  </div>

                  <span className={`adm-badge ${statusBadgeClass(selected.status)}`}>
                    {statusLabels[selected.status] || selected.status}
                  </span>
                </div>

                <div className="mb-3">
                  <label className="form-label">Estado</label>
                  <select
                    className="form-select form-select-sm"
                    value={selected.status}
                    onChange={(e) => handleChangeField('status', e.target.value)}
                  >
                    <option value="draft">Borrador</option>
                    <option value="sent">Enviado</option>
                    <option value="approved">Aprobado</option>
                    <option value="rejected">Rechazado</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label">Notas</label>
                  <textarea
                    className="form-control"
                    rows="2"
                    value={selected.notes || ''}
                    onChange={(e) => handleChangeField('notes', e.target.value)}
                    placeholder="Notas internas…"
                  />
                </div>

                <div className="mb-2 d-flex justify-content-between align-items-center">
                  <label className="form-label mb-0">Ítems</label>
                  <span className="adm-chip">
                    Moneda: {selected.currency || 'UYU'}
                  </span>
                </div>

                <div className="table-responsive">
                  <table className="table table-sm table-hover align-middle adm-table">
                    <thead>
                      <tr>
                        <th>Descripción</th>
                        <th style={{ width: 90 }}>Cant.</th>
                        <th style={{ width: 140 }}>P. unit.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.items || []).length === 0 ? (
                        <tr>
                          <td colSpan={3} className="text-muted small">
                            Este presupuesto no tiene ítems.
                          </td>
                        </tr>
                      ) : (
                        (selected.items || []).map((it, idx) => (
                          <tr key={idx}>
                            <td>
                              {it.productName ? <strong>{it.productName}</strong> : it.description}
                              {it.productName && it.description && it.description !== it.productName && (
                                <div className="adm-note">{it.description}</div>
                              )}
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                className="form-control form-control-sm"
                                value={it.quantity ?? 0}
                                onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              />
                            </td>
                            <td>
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="form-control form-control-sm"
                                value={it.unitPrice ?? 0}
                                onChange={(e) => handleItemChange(idx, 'unitPrice', e.target.value)}
                              />
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="adm-total">
                  <span>Total</span>
                  <span>
                    {calcTotal(selected).toLocaleString('es-UY', {
                      style: 'currency',
                      currency: selected.currency || 'UYU',
                    })}
                  </span>
                </div>

                <div className="d-flex justify-content-end gap-2 mt-3 flex-wrap">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    onClick={handleViewPdf}
                    disabled={saving || sending}
                  >
                    Ver / imprimir PDF
                  </button>

                  <button
                    className="btn btn-outline-success btn-sm"
                    type="button"
                    onClick={handleSendToClient}
                    disabled={saving || sending || !selected?.client?.email}
                  >
                    {sending ? 'Enviando…' : 'Comunicar al cliente'}
                  </button>

                  <button
                    className="btn btn-chapacar btn-sm"
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Guardando…' : 'Guardar cambios'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
