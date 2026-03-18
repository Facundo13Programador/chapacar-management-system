import React, { useEffect, useMemo, useState } from 'react';
import { toast } from 'react-toastify';

import '../../components/css/header.css';
import '../../components/css/adminModules.css';

import {
  listProducts,
  deleteProduct,
  createProduct,
  getProduct,
  updateProduct,
} from '../../services/products.service.js';
import { listCategories } from '../../services/categories.service.js';
import { listBrands } from '../../services/brands.service.js';

import { getCurrentUser } from '../../services/auth.service.js';
import { hasPermission, SCOPES } from '../../utils/permissionsFront.js';

import ProductForm from '../../components/ProductForm.jsx';

const moneyUYU = (v) =>
  Number(v || 0).toLocaleString('es-UY', { style: 'currency', currency: 'UYU' });

const getProductThumb = (p) => {  
  const img0 = Array.isArray(p?.images) ? p.images[0] : null;
  if (typeof img0 === 'string') return img0;
  if (img0?.url) return img0.url;
  if (p?.image) return p.image;
  return '';
};

export default function ProductList() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState('list'); 
  const [editingId, setEditingId] = useState(null);
  const [formInitial, setFormInitial] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loadingForm, setLoadingForm] = useState(false);
  const [cats, setCats] = useState([]);
  const [brands, setBrands] = useState([]);
  const [q, setQ] = useState('');
  const [brandId, setBrandId] = useState('');
  const [catId, setCatId] = useState('');
  const [active, setActive] = useState('all'); 
  const user = getCurrentUser();
  const role = user?.role || 'client';
  const canCreate = hasPermission(role, 'products', [SCOPES.canCreate]);
  const canEdit = hasPermission(role, 'products', [SCOPES.canEdit]);
  const canDelete = hasPermission(role, 'products', [SCOPES.canDelete]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await listProducts();
      setRows(Array.isArray(data) ? data : data?.products || []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar productos');
    } finally {
      setLoading(false);
    }
  };

  const loadLookups = async () => {
    try {
      const [catsRes, brandsRes] = await Promise.all([listCategories(), listBrands()]);
      setCats(catsRes || []);
      setBrands(brandsRes || []);
    } catch (e) {
      console.error(e);
      toast.error('No se pudieron cargar categorías o marcas');
    }
  };

  useEffect(() => {
    load();
    loadLookups();
  }, []);

  const filteredRows = useMemo(() => {
    const text = q.trim().toLowerCase();

    return (rows || []).filter((p) => {
      const matchesText =
        !text ||
        String(p?.name || '').toLowerCase().includes(text) ||
        String(p?.code || '').toLowerCase().includes(text) ||
        String(p?.slug || '').toLowerCase().includes(text);

      const matchesBrand = !brandId || String(p?.brand?._id || p?.brand || '') === String(brandId);

      const categories = (p?.categories || []).map((c) => String(c?._id || c));
      const matchesCat = !catId || categories.includes(String(catId));

      const isActive = !!p?.isActive;
      const matchesActive =
        active === 'all' || (active === 'active' ? isActive : !isActive);

      return matchesText && matchesBrand && matchesCat && matchesActive;
    });
  }, [rows, q, brandId, catId, active]);

  const onDelete = async (id) => {
    if (!window.confirm('¿Borrar / desactivar este producto?')) return;
    try {
      await deleteProduct(id);
      toast.success('Producto desactivado');
      setRows((prev) => prev.filter((r) => r._id !== id));
    } catch (e) {
      const msg = e?.response?.data?.message || e.message || 'Error al borrar';
      toast.error(msg);
    }
  };

  const startCreate = () => {
    setMode('create');
    setEditingId(null);
    setFormInitial(null);
  };

  const startEdit = async (id) => {
    try {
      setLoadingForm(true);
      setEditingId(id);
      const data = await getProduct(id);

      setFormInitial({
        name: data.name || '',
        code: data.code || '',
        slug: data.slug || '',
        description: data.description || '',
        price: data.price ?? 0,
        countInStock: data.countInStock ?? 0,
        brand: data.brand?._id || data.brand || '',
        categories: (data.categories || []).map((c) => c._id || c),
        images: data.images || [],
        isActive: data.isActive ?? true,
      });

      setMode('edit');
    } catch (e) {
      console.error(e);
      toast.error('No se pudo cargar el producto');
    } finally {
      setLoadingForm(false);
    }
  };

  const goBackToList = () => {
    setMode('list');
    setEditingId(null);
    setFormInitial(null);
  };

  const handleSubmit = async (payload) => {
    try {
      setSaving(true);

      if (mode === 'create') {
        await createProduct(payload);
        toast.success('Producto creado');
      } else if (mode === 'edit' && editingId) {
        await updateProduct(editingId, payload);
        toast.success('Producto actualizado');
      }

      await load();
      goBackToList();
    } catch (e) {
      console.error(e);
      const msg =
        e?.response?.data?.message || e.message || 'Error al guardar el producto';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  // CREATE / EDIT FORM
  if (mode === 'create' || mode === 'edit') {
    return (
      <div className="my-3">
        <div className="adm-box">
          <div className="adm-box-head">
            <div>
              <h4 className="adm-box-title">
                {mode === 'create' ? 'Nuevo producto' : 'Editar producto'}
              </h4>
              <p className="adm-box-sub">
                Completá la información y guardá los cambios.
              </p>
            </div>

            <button
              type="button"
              className="btn btn-outline-secondary btn-sm"
              onClick={goBackToList}
            >
              ← Volver al listado
            </button>
          </div>

          <div className="adm-box-body">
            {loadingForm && mode === 'edit' ? (
              <div className="text-muted">Cargando producto…</div>
            ) : (
              <ProductForm
                categoriesOptions={cats}
                brandOptions={brands}
                initialValue={formInitial}
                onSubmit={handleSubmit}
                submitting={saving}
              />
            )}
          </div>
        </div>
      </div>
    );
  }

  // LIST
  return (
    <div className="my-3">
      <div className="adm-box">
        <div className="adm-box-head">
          <div>
            <h4 className="adm-box-title">Productos</h4>
            <p className="adm-box-sub">
              {filteredRows.length} de {rows.length} productos • Gestión de catálogo.
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

            {canCreate && (
              <button type="button" className="btn btn-chapacar btn-sm" onClick={startCreate}>
                + Nuevo
              </button>
            )}
          </div>
        </div>

        <div className="adm-box-body">
          {/* Toolbar */}
          <div className="adm-toolbar mb-3">
            <div className="adm-field">
              <label className="form-label">Buscar</label>
              <input
                className="form-control form-control-sm"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Nombre, código o slug…"
              />
            </div>

            <div className="adm-field">
              <label className="form-label">Marca</label>
              <select
                className="form-select form-select-sm"
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
              >
                <option value="">Todas</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="adm-field">
              <label className="form-label">Categoría</label>
              <select
                className="form-select form-select-sm"
                value={catId}
                onChange={(e) => setCatId(e.target.value)}
              >
                <option value="">Todas</option>
                {cats.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="adm-field">
              <label className="form-label">Estado</label>
              <select
                className="form-select form-select-sm"
                value={active}
                onChange={(e) => setActive(e.target.value)}
              >
                <option value="all">Todos</option>
                <option value="active">Activos</option>
                <option value="inactive">Inactivos</option>
              </select>
            </div>
          </div>

          {loading ? (
            <div className="text-muted">Cargando…</div>
          ) : filteredRows.length === 0 ? (
            <div className="alert alert-info mb-0">No hay productos con esos filtros.</div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-hover align-middle adm-table mb-0">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Código</th>
                    <th>Marca</th>
                    <th>Categorías</th>
                    <th className="text-end">Precio</th>
                    <th className="text-end">Stock</th>
                    <th>Activo</th>
                    {(canEdit || canDelete) && <th className="text-end" style={{ width: 190 }}></th>}
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((p) => {
                    const thumb = getProductThumb(p);
                    const catsText =
                      (p.categories || [])
                        .map((c) => c?.name)
                        .filter(Boolean)
                        .join(', ') || '—';

                    return (
                      <tr key={p._id}>
                        <td>
                          <div className="adm-namecell">
                            <div className="adm-thumb">
                              {thumb ? (
                                <img src={thumb} alt={p.name} />
                              ) : (
                                <span>IMG</span>
                              )}
                            </div>

                            <div>
                              <h6>{p.name || 'Sin nombre'}</h6>
                              <div className="adm-muted">
                                {p.slug ? `/${p.slug}` : '—'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td>
                          {p.code ? <code>{p.code}</code> : <span className="text-muted">—</span>}
                        </td>

                        <td>{p.brand?.name || '—'}</td>

                        <td>{catsText}</td>

                        <td className="text-end adm-price">{moneyUYU(p.price)}</td>

                        <td className="text-end">{p.countInStock ?? 0}</td>

                        <td>
                          <span className={`adm-badge ${p.isActive ? 'ok' : 'no'}`}>
                            {p.isActive ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        {(canEdit || canDelete) && (
                          <td className="text-end">
                            <div className="adm-actions">
                              {canEdit && (
                                <button
                                  className="btn btn-sm btn-outline-primary"
                                  onClick={() => startEdit(p._id)}
                                  type="button"
                                >
                                  Editar
                                </button>
                              )}
                              {canDelete && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => onDelete(p._id)}
                                  type="button"
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

          {/* small helper row */}
          {(q || brandId || catId || active !== 'all') && (
            <div className="mt-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
              <span className="adm-chip">
                Mostrando {filteredRows.length} / {rows.length}
              </span>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setQ('');
                  setBrandId('');
                  setCatId('');
                  setActive('all');
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
