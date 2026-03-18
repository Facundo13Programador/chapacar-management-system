// src/screens/admin/WorkOrderList.jsx
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import { useNavigate, useSearchParams, useParams } from 'react-router-dom';
import {
  listWorkOrders,
  getWorkOrder,
  updateWorkOrder,
} from '../../services/workOrders.service.js';

import '../../components/css/header.css';
import '../../components/css/adminModules.css';

const statusLabels = {
  open: 'Abierta',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
};

const statusBadgeClass = (s) => {
  if (s === 'completed') return 'ok';
  if (s === 'cancelled') return 'no';
  if (s === 'in_progress') return 'neu';
  return 'gray';
};

export default function WorkOrderList({ embedded = false }) {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const idFromQuery = searchParams.get('id');

  const { id: idFromParams } = useParams();
  const effectiveId = embedded ? idFromQuery : idFromParams;

  const [workOrders, setWorkOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const [selected, setSelected] = useState(null);
  const [saving, setSaving] = useState(false);

  const selectedId = useMemo(
    () => (selected?._id ? String(selected._id) : ''),
    [selected]
  );

  const loadWorkOrders = async () => {
    try {
      setLoading(true);
      const data = await listWorkOrders();
      setWorkOrders(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar las órdenes de trabajo');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkOrders();
  }, []);

  useEffect(() => {
    if (!effectiveId) return;

    (async () => {
      try {
        const full = await getWorkOrder(effectiveId);
        setSelected(full);
      } catch (e) {
        console.error(e);
        toast.error('No se pudo cargar el detalle de la OT');
      }
    })();
  }, [effectiveId]);

  const goToWorkOrder = (woId) => {
    if (embedded) navigate(`/admin?section=workOrders&id=${woId}`);
    else navigate(`/admin/work-orders/${woId}`);
  };

  const handleSelect = async (wo) => {
    try {
      const full = await getWorkOrder(wo._id);
      setSelected(full);
      goToWorkOrder(wo._id);
    } catch (e) {
      console.error(e);
      toast.error('No se pudo cargar el detalle de la OT');
    }
  };

  const handleChangeField = (field, value) => {
    setSelected((prev) => ({ ...prev, [field]: value }));
  };

  const handleTaskChange = (idx, field, value) => {
    setSelected((prev) => {
      if (!prev) return prev;
      const tasks = [...(prev.tasks || [])];
      const t = { ...(tasks[idx] || {}) };
      if (field === 'done') t.done = !!value;
      else t[field] = value;
      tasks[idx] = t;
      return { ...prev, tasks };
    });
  };

  const handleAddTask = () => {
    setSelected((prev) => ({
      ...prev,
      tasks: [...(prev.tasks || []), { description: '', done: false }],
    }));
  };

  const handleRemoveTask = (idx) => {
    setSelected((prev) => {
      const tasks = [...(prev.tasks || [])];
      tasks.splice(idx, 1);
      return { ...prev, tasks };
    });
  };

  const handleSave = async () => {
    if (!selected) return;
    try {
      setSaving(true);

      const payload = {
        status: selected.status,
        notes: selected.notes,
        tasks: selected.tasks || [],
      };

      const updated = await updateWorkOrder(selected._id, payload);

      toast.success('Orden de trabajo actualizada');

      setWorkOrders((prev) =>
        prev.map((w) => (w._id === updated._id ? updated : w))
      );

      setSelected(updated);
    } catch (e) {
      console.error(e);
      toast.error(
        e?.response?.data?.message ||
          e.message ||
          'No se pudo actualizar la orden de trabajo'
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="row g-3">
      {/* LISTA */}
      <div className="col-12 col-lg-7">
        <div className="adm-box">
          <div className="adm-box-head">
            <div>
              <h4 className="adm-box-title">Órdenes de trabajo</h4>
              <p className="adm-box-sub">Listado general y acceso rápido a edición.</p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={loadWorkOrders}
              disabled={loading}
            >
              {loading ? 'Actualizando…' : 'Actualizar'}
            </button>
          </div>

          <div className="adm-box-body">
            {loading ? (
              <div className="text-muted">Cargando órdenes…</div>
            ) : workOrders.length === 0 ? (
              <div className="alert alert-info mb-0">
                Todavía no hay órdenes de trabajo.
              </div>
            ) : (
              <div className="table-responsive">
                <table className="table table-sm table-hover align-middle adm-table mb-0">
                  <thead>
                    <tr>
                      <th>Número</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>Vehículo</th>
                      <th>Estado</th>
                      <th className="text-end"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {workOrders.map((w) => {
                      const isActive =
                        String(w._id) === selectedId ||
                        String(w._id) === String(effectiveId || '');

                      const date = w.createdAt
                        ? new Date(w.createdAt).toLocaleDateString('es-UY', { dateStyle: 'short' })
                        : '-';

                      const vehicleText = w.vehicle
                        ? `${w.vehicle.brand?.name || ''} ${w.vehicle.model || ''} ${w.vehicle.year || ''}`.trim()
                        : 'Sin vehículo';

                      return (
                        <tr key={w._id} className={isActive ? 'adm-row-active' : ''}>
                          <td className="fw-semibold">{w.number || '-'}</td>
                          <td>{date}</td>
                          <td>
                            {w.client?.name || 'Sin nombre'}
                            <br />
                            <small className="text-muted">{w.client?.email || ''}</small>
                          </td>
                          <td>
                            {vehicleText || '—'}
                            {w.vehicle?.licensePlate && (
                              <>
                                <br />
                                <small className="text-muted">{w.vehicle.licensePlate}</small>
                              </>
                            )}
                          </td>
                          <td>
                            <span className={`adm-badge ${statusBadgeClass(w.status)}`}>
                              {statusLabels[w.status] || w.status}
                            </span>
                          </td>
                          <td className="text-end">
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => handleSelect(w)}
                              type="button"
                            >
                              Ver / Editar
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
              <p className="adm-box-sub">Estado, tareas y notas de la OT.</p>
            </div>
          </div>

          <div className="adm-box-body">
            {!selected ? (
              <div className="text-muted">
                Seleccioná una orden de trabajo de la lista.
              </div>
            ) : (
              <>
                <div className="adm-wo-header mb-3">
                  <div>
                    <div className="adm-wo-kicker">Orden</div>
                    <h5 className="adm-wo-title">#{selected.number || '-'}</h5>
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
                    <option value="open">Abierta</option>
                    <option value="in_progress">En progreso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                  </select>
                </div>

                {/* Tareas */}
                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label mb-0">Tareas / puntos a realizar</label>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-primary"
                      onClick={handleAddTask}
                    >
                      + Añadir
                    </button>
                  </div>

                  {(selected.tasks || []).length === 0 ? (
                    <p className="text-muted small mt-2 mb-0">
                      Todavía no se cargaron tareas.
                    </p>
                  ) : (
                    <div className="mt-2 d-grid gap-2">
                      {(selected.tasks || []).map((t, idx) => (
                        <div key={idx} className="adm-task">
                          <div className="form-check mt-1">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              checked={!!t.done}
                              onChange={(e) => handleTaskChange(idx, 'done', e.target.checked)}
                            />
                          </div>

                          <textarea
                            className="form-control form-control-sm"
                            rows={1}
                            value={t.description || ''}
                            onChange={(e) => handleTaskChange(idx, 'description', e.target.value)}
                            placeholder="Descripción de la tarea…"
                          />

                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleRemoveTask(idx)}
                            title="Eliminar"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Notas */}
                <div className="mb-3">
                  <label className="form-label">Notas generales</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={selected.notes || ''}
                    onChange={(e) => handleChangeField('notes', e.target.value)}
                    placeholder="Notas internas del taller…"
                  />
                </div>

                <div className="d-flex justify-content-end">
                  <button
                    className="btn btn-chapacar"
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
