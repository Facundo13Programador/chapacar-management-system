// src/components/ProductForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import '../components/css/header.css';

const emptyProduct = {
  name: '',
  code: '',
  slug: '',
  description: '',
  price: 0,
  countInStock: 0,
  brand: '',
  categories: [],
  images: [],
  isActive: true,
};

export default function ProductForm({
  categoriesOptions = [],
  brandOptions = [],
  initialValue = emptyProduct,
  onSubmit,
  submitting = false,
}) {
  const [p, setP] = useState(initialValue || emptyProduct);

  useEffect(() => {
    setP(initialValue || emptyProduct);
  }, [initialValue]);

  const suggestedSlug = useMemo(() => {
    return String(p.name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }, [p.name]);

  const setField = (key, val) => setP(prev => ({ ...prev, [key]: val }));

  const toggleCategory = (id) => {
    const set = new Set(p.categories.map(String));
    if (set.has(String(id))) set.delete(String(id));
    else set.add(String(id));
    setField('categories', Array.from(set));
  };

  // imágenes
  const addImage = () =>
    setField('images', [
      ...p.images,
      { url: '', alt: '', isMain: p.images.length === 0 },
    ]);

  const removeImage = (idx) =>
    setField('images', p.images.filter((_, i) => i !== idx));

  const updateImage = (idx, patch) => {
    let next = p.images.map((img, i) =>
      i === idx ? { ...img, ...patch } : img
    );
    if (patch.isMain) {
      next = next.map((img, i) => ({ ...img, isMain: i === idx }));
    }
    setField('images', next);
  };

  const submit = (e) => {
    e.preventDefault();
    const normalized = {
      ...p,
      slug: p.slug?.trim() || suggestedSlug,
      price: Number(p.price) || 0,
      countInStock: Number(p.countInStock) || 0,
      images: p.images.filter(img => img.url?.trim()),
    };
    onSubmit?.(normalized);
  };

  return (
    <form onSubmit={submit}>
      {/* Nombre / código */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Nombre *</label>
          <input
            className="form-control"
            value={p.name}
            onChange={(e) => setField('name', e.target.value)}
            required
          />
          <div className="form-text">
            Slug sugerido: <code>{suggestedSlug || '-'}</code>
          </div>
        </div>
        <div className="col-md-6">
          <label className="form-label">Código *</label>
          <input
            className="form-control"
            value={p.code}
            onChange={(e) => setField('code', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Slug opcional */}
      <div className="mb-3">
        <label className="form-label">Slug (opcional)</label>
        <input
          className="form-control"
          value={p.slug}
          onChange={(e) => setField('slug', e.target.value)}
          placeholder="auto si lo dejás vacío"
        />
      </div>

      {/* Descripción */}
      <div className="mb-3">
        <label className="form-label">Descripción *</label>
        <textarea
          className="form-control"
          rows={3}
          value={p.description}
          onChange={(e) => setField('description', e.target.value)}
          required
        />
      </div>

      {/* Precio / stock */}
      <div className="row g-3 mb-3">
        <div className="col-md-6">
          <label className="form-label">Precio *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className="form-control"
            value={p.price}
            onChange={(e) => setField('price', e.target.value)}
            required
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Cantidad en stock *</label>
          <input
            type="number"
            min="0"
            className="form-control"
            value={p.countInStock}
            onChange={(e) => setField('countInStock', e.target.value)}
            required
          />
        </div>
      </div>

      {/* Marca */}
      <div className="mb-3">
        <label className="form-label">Marca *</label>
        <select
          className="form-select"
          value={p.brand || ''}
          onChange={(e) => setField('brand', e.target.value || null)}
          required
        >
          <option value="">Selecciona una marca…</option>
          {brandOptions.map((b) => (
            <option key={b._id} value={b._id}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      {/* Categorías */}
      <div className="mb-3">
        <label className="form-label">Categorías *</label>
        <div className="d-flex flex-wrap gap-2">
          {categoriesOptions.map((c) => {
            const checked = p.categories.map(String).includes(String(c._id));
            return (
              <label key={c._id} className="form-check form-check-inline">
                <input
                  className="form-check-input"
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleCategory(c._id)}
                />
                <span className="form-check-label">{c.name}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Imágenes */}
      <div className="mb-3">
        <div className="d-flex justify-content-between align-items-center">
          <label className="form-label m-0">Imágenes</label>
          <button
            type="button"
            className="btn btn-sm btn-outline-primary"
            onClick={addImage}
          >
            + Agregar imagen
          </button>
        </div>
        {p.images.map((img, idx) => (
          <div key={idx} className="row g-2 align-items-center mb-2">
            <div className="col-12 col-lg-6">
              <input
                className="form-control"
                placeholder="URL"
                value={img.url}
                onChange={(e) => updateImage(idx, { url: e.target.value })}
              />
            </div>
            <div className="col-12 col-lg-4">
              <input
                className="form-control"
                placeholder="Alt"
                value={img.alt}
                onChange={(e) => updateImage(idx, { alt: e.target.value })}
              />
            </div>
            <div className="col-6 col-lg-1 form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id={`main-${idx}`}
                checked={!!img.isMain}
                onChange={(e) =>
                  updateImage(idx, { isMain: e.target.checked })
                }
              />
              <label className="form-check-label" htmlFor={`main-${idx}`}>
                Main
              </label>
            </div>
            <div className="col-6 col-lg-1 text-end">
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() => removeImage(idx)}
              >
                ✕
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Activo */}
      <div className="form-check mb-4">
        <input
          className="form-check-input"
          type="checkbox"
          id="isActive"
          checked={p.isActive}
          onChange={(e) => setField('isActive', e.target.checked)}
        />
        <label className="form-check-label" htmlFor="isActive">
          Activo
        </label>
      </div>

      <button type="submit" className="btn btn-chapacar" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Guardar producto'}
      </button>
    </form>
  );
}
