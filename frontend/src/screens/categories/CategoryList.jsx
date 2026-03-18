// src/screens/categories/CategoryList.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';
import {
  listCategories,
  deleteCategory,
  createCategory,
  getCategory,
  updateCategory,
} from '../../services/categories.service.js';
import { getCurrentUser } from '../../services/auth.service.js';
import { hasPermission, SCOPES } from '../../utils/permissionsFront.js';
import CategoryForm from '../../components/CategoryForm.jsx';

import '../../components/css/header.css';
import '../../components/css/adminModules.css';

export default function CategoryList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list');
  const [formInitialValue, setFormInitialValue] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [q, setQ] = useState('');
  const user = getCurrentUser();
  const role = user?.role || 'client';
  const canCreate = hasPermission(role, 'categories', [SCOPES.canCreate]);
  const canEdit = hasPermission(role, 'categories', [SCOPES.canEdit]);
  const canDelete = hasPermission(role, 'categories', [SCOPES.canDelete]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listCategories();
      setRows(Array.isArray(data) ? data : data?.categories || []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filteredRows = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return rows;
    return (rows || []).filter((r) => {
      const name = String(r?.name || '').toLowerCase();
      const slug = String(r?.slug || '').toLowerCase();
      return name.includes(term) || slug.includes(term);
    });
  }, [rows, q]);

  const onDelete = async (id) => {
    if (!window.confirm('¿Borrar esta categoría?')) return;
    try {
      await deleteCategory(id);
      toast.success('Categoría eliminada');
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

      const data = await getCategory(id);

      setFormInitialValue({
        name: data.name || '',
        slug: data.slug || '',
      });

      setMode('edit');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo cargar la categoría');
    } finally {
      setLoadingForm(false);
    }
  };

  const handleSubmit = async (formData) => {
    try {
      setSaving(true);

      if (mode === 'create') {
        await createCategory(formData);
        toast.success('Categoría creada');
      } else if (mode === 'edit' && editingId) {
        await updateCategory(editingId, formData);
        toast.success('Categoría actualizada');
      }

      await load();
      setMode('list');
      setEditingId(null);
      setFormInitialValue(null);
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || e.message || 'Error al guardar la categoría';
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
            <h4 className="adm-box-title">
              {mode === 'create' ? 'Nueva categoría' : 'Editar categoría'}
            </h4>
            <p className="adm-box-sub">
              Definí nombre y slug para organizar el catálogo.
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
            <div className="text-muted">Cargando categoría…</div>
          ) : (
            <CategoryForm
              initialValue={formInitialValue}
              onSubmit={handleSubmit}
              submitting={saving}
            />
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="adm-box">
      <div className="adm-box-head">
        <div>
          <h4 className="adm-box-title">Categorías</h4>
          <p className="adm-box-sub">Administración de categorías del catálogo.</p>
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

          {canCreate && (
            <button type="button" className="btn btn-chapacar btn-sm" onClick={startCreate}>
              + Nueva
            </button>
          )}
        </div>
      </div>

      <div className="adm-box-body">
        {/* Toolbar */}
        <div
          className="adm-toolbar mb-3"
          style={{ gridTemplateColumns: '1fr 200px 200px 1fr' }}
        >
          <div className="adm-field">
            <label className="form-label">Buscar</label>
            <input
              className="form-control form-control-sm"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Nombre o slug…"
            />
          </div>

          <div className="adm-field">
            <label className="form-label">Resultados</label>
            <div className="adm-chip">{filteredRows.length} categorías</div>
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

          <div className="adm-field">
            <label className="form-label">Consejo</label>
            <div className="adm-chip">Usá slugs cortos</div>
          </div>
        </div>

        {loading ? (
          <div className="text-muted">Cargando…</div>
        ) : filteredRows.length === 0 ? (
          <div className="alert alert-info mb-0">No hay categorías</div>
        ) : (
          <div className="table-responsive">
            <table className="table table-sm table-hover align-middle adm-table mb-0">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Slug</th>
                  {(canEdit || canDelete) && <th className="text-end" style={{ width: 180 }}>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {filteredRows.map((r) => (
                  <tr key={r._id}>
                    <td className="fw-semibold">{r.name}</td>
                    <td>
                      <code>{r.slug}</code>
                    </td>

                    {(canEdit || canDelete) && (
                      <td className="text-end">
                        <div className="d-inline-flex gap-2">
                          {canEdit && (
                            <button
                              className="btn btn-sm btn-outline-primary"
                              onClick={() => startEdit(r._id)}
                              type="button"
                            >
                              Editar
                            </button>
                          )}
                          {canDelete && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => onDelete(r._id)}
                              type="button"
                            >
                              Borrar
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
