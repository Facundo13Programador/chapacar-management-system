// src/components/CategoryForm.jsx
import React, { useEffect, useMemo, useState } from 'react';
import '../components/css/header.css';

const emptyCategory = {
  name: '',
  slug: '',
};

export default function CategoryForm({
  initialValue = null,
  onSubmit,
  submitting = false,
}) {
  const [cat, setCat] = useState(emptyCategory);

  useEffect(() => {
    if (initialValue) {
      setCat({
        name: initialValue.name || '',
        slug: initialValue.slug || '',
      });
    } else {
      setCat(emptyCategory);
    }
  }, [initialValue]);

  const suggestedSlug = useMemo(() => {
    return String(cat.name || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '')
      .replace(/--+/g, '-');
  }, [cat.name]);

  const setField = (field, value) =>
    setCat((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payload = {
      name: cat.name.trim(),
      slug: (cat.slug || suggestedSlug || '').trim(),
    };
    if (!payload.name) return;
    onSubmit?.(payload);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-3">
        <label className="form-label">Nombre *</label>
        <input
          className="form-control"
          value={cat.name}
          onChange={(e) => setField('name', e.target.value)}
          required
        />
        <div className="form-text">
          Ej.: “Filtros de aceite”, “Embragues”, “Pastillas de freno”…
        </div>
      </div>

      <div className="mb-3">
        <label className="form-label">Slug (opcional)</label>
        <input
          className="form-control"
          value={cat.slug}
          onChange={(e) => setField('slug', e.target.value)}
          placeholder="si lo dejás vacío se autogenera"
        />
        <div className="form-text">
          Slug sugerido: <code>{suggestedSlug || '-'}</code>
        </div>
      </div>

      <button className="btn btn-chapacar" type="submit" disabled={submitting}>
        {submitting ? 'Guardando…' : 'Guardar categoría'}
      </button>
    </form>
  );
}
