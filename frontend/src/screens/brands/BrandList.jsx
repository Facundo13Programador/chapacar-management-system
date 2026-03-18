// src/screens/brands/BrandList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import {
  listBrands,
  deleteBrand,
  createBrand,
  getBrand,
  updateBrand,
} from '../../services/brands.service';
import { getCurrentUser } from '../../services/auth.service';
import { hasPermission, SCOPES } from '../../utils/permissionsFront';
import BrandForm from '../../components/BrandForm.jsx';

import '../../components/css/header.css';
import '../../components/css/adminModules.css';

export default function BrandList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [formInitialValue, setFormInitialValue] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [q, setQ] = useState('');
  const [minModels, setMinModels] = useState('all'); 

  const user = getCurrentUser();
  const role = user?.role || 'client';

  const canCreate = hasPermission(role, 'brands', [SCOPES.canCreate]);
  const canEdit = hasPermission(role, 'brands', [SCOPES.canEdit]);
  const canDelete = hasPermission(role, 'brands', [SCOPES.canDelete]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listBrands();
      setRows(Array.isArray(data) ? data : data?.brands || []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar marcas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    const min = minModels === 'all' ? null : Number(minModels);

    return (rows || []).filter((r) => {
      const name = String(r?.name || '').toLowerCase();
      const modelsArr = Array.isArray(r?.models) ? r.models : [];
      const modelsCount = modelsArr.length;

      const matchesText =
        !term ||
        name.includes(term) ||
        modelsArr.some((m) => String(m || '').toLowerCase().includes(term));

      const matchesMin = min === null ? true : modelsCount >= min;

      return matchesText && matchesMin;
    });
  }, [rows, q, minModels]);

  const onDelete = async (id) => {
    if (!window.confirm('¿Borrar esta marca?')) return;
    try {
      await deleteBrand(id);
      toast.success('Marca eliminada');
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Error al borrar';
      toast.error(msg);
    }
  };

  const startCreate = () => {
    setFormInitialValue(null);
    setEditingId(null);
    setMode('create');
  };

  const startEdit = async (id) => {
    try {
      setLoadingForm(true);
      setEditingId(id);

      const data = await getBrand(id);
      setFormInitialValue({
        name: data.name || '',
        models: data.models || [],
      });

      setMode('edit');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo cargar la marca');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);

      if (mode === 'create') {
        await createBrand(formData);
        toast.success('Marca creada');
      } else if (mode === 'edit' && editingId) {
        await updateBrand(editingId, formData);
        toast.success('Marca actualizada');
      }

      await load();
      setMode('list');
      setEditingId(null);
      setFormInitialValue(null);
    } catch (e) {
      console.error(e);
      const msg = e?.response?.data?.message || e.message || 'Error al guardar la marca';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  const goBackToList = () => {
    setMode('list');
    setEditingId(null);
    setFormInitialValue(null);
  };

  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="adm-box">
        <div className="adm-box-head">
          <div>
            <h4 className="adm-box-title">{mode === 'create' ? 'Nueva marca' : 'Editar marca'}</h4>
            <p className="adm-box-sub">
              Gestioná marcas y su lista de modelos (para vehículos y compatibilidades).
            </p>
          </div>

          <button
            type="button"
            className="btn btn-outline-secondary btn-sm"
            onClick={goBackToList}
            disabled={saving}
          >
            ← Volver al listado
          </button>
        </div>

        <div className="adm-box-body">
          {loadingForm && mode === 'edit' ? (
            <div className="text-muted">Cargando marca…</div>
          ) : (
            <BrandForm initialValue={formInitialValue} onSubmit={handleSubmit} submitting={saving} />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="adm-box">
      <div className="adm-box-head">
        <div>
          <h4 className="adm-box-title">Marcas</h4>
          <p className="adm-box-sub">Listado y mantenimiento de marcas y modelos.</p>
        </div>

        <div className="d-flex gap-2">
          <button type="button" className="btn btn-outline-secondary btn-sm" onClick={load} disabled={loading}>
            {loading ? 'Actualizando…' : 'Actualizar'}
          </button>

          {canCreate && (
            <button type="button" className="btn btn-chapacar btn-sm" onClick={startCreate}>
              + Nueva
            </button>
          )}
        </div>
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
              placeholder="Marca o modelo…"
            />
          </div>

          <div className="adm-field">
            <label className="form-label">Mín. modelos</label>
            <select
              className="form-select form-select-sm"
              value={minModels}
              onChange={(e) => setMinModels(e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="0">0+</option>
              <option value="1">1+</option>
              <option value="5">5+</option>
              <option value="10">10+</option>
            </select>
          </div>

          <div className="adm-field">
            <label className="form-label">Resultados</label>
            <div className="adm-chip">
              {filteredRows.length} de {rows.length}
            </div>
          </div>

          <div className="adm-field">
            <label className="form-label">Acción rápida</label>
            <button
              type="button"
              className="btn btn-outline-secondary btn-sm w-100"
              onClick={() => {
                setQ('');
                setMinModels('all');
              }}
              disabled={!q && minModels === 'all'}
            >
              Limpiar filtros
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-muted">Cargando…</div>
        ) : filteredRows.length === 0 ? (
          <div className="alert alert-info mb-0">No hay marcas con esos filtros</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle adm-table mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Modelos (ejemplo)</th>
                  <th style={{ width: 160 }}>Cantidad</th>
                  {(canEdit || canDelete) && <th className="text-end" style={{ width: 180 }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => {
                  const models = Array.isArray(r.models) ? r.models : [];
                  const preview = models.slice(0, 3).join(', ');

                  return (
                    <tr key={r._id}>
                      <td className="fw-semibold">{r.name}</td>
                      <td>{preview || <span className="text-muted">—</span>}</td>
                      <td>
                        <span className="adm-chip">{models.length} modelos</span>
                      </td>

                      {(canEdit || canDelete) && (
                        <td className="text-end">
                          <div className="d-inline-flex gap-2">
                            {canEdit && (
                              <button
                                className="btn btn-sm btn-outline-primary"
                                type="button"
                                onClick={() => startEdit(r._id)}
                              >
                                Editar
                              </button>
                            )}
                            {canDelete && (
                              <button
                                className="btn btn-sm btn-outline-danger"
                                type="button"
                                onClick={() => onDelete(r._id)}
                              >
                                Borrar
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
